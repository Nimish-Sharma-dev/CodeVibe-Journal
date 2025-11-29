import { supabaseAdmin } from '../config/supabase';
import { Repository } from '../types/database';
import { githubService } from './github.service';
import { scannerService } from './scanner.service';
import { llmService } from './llm.service';
import { cacheService } from './cache.service';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/error.middleware';
import { getPagination } from '../utils/helpers';

class RepoService {
    /**
     * Analyze a GitHub repository (full pipeline)
     */
    async analyzeRepository(userId: string, githubUrl: string): Promise<Repository> {
        try {
            // Check cache first
            const cacheKey = `repo:${githubUrl}`;
            const cached = cacheService.get<Repository>(cacheKey);
            if (cached && cached.user_id === userId) {
                logger.info(`Returning cached analysis for ${githubUrl}`);
                return cached;
            }

            // Check if already analyzed by this user
            const { data: existing } = await supabaseAdmin
                .from('repositories')
                .select('*')
                .eq('user_id', userId)
                .eq('github_url', githubUrl)
                .single();

            if (existing) {
                logger.info(`Repository already analyzed: ${githubUrl}`);
                cacheService.set(cacheKey, existing, 86400); // Cache for 24 hours
                return existing;
            }

            logger.info(`Starting analysis for ${githubUrl}`);

            // Step 1: Fetch repo metadata and file tree
            const { metadata, fileTree } = await githubService.cloneRepoStructure(githubUrl);

            // Step 2: Scan codebase
            const scanResults = await scannerService.scanCodebase(fileTree);

            // Step 3: Generate LLM insights
            const llmAnalysis = await llmService.analyzeRepository(metadata, scanResults);

            // Step 4: Save to database
            const { data: repo, error } = await supabaseAdmin
                .from('repositories')
                .insert({
                    user_id: userId,
                    github_url: githubUrl,
                    name: metadata.repo,
                    description: metadata.description,
                    language: metadata.language,
                    stars: metadata.stars,
                    forks: metadata.forks,
                    complexity_score: scanResults.complexityScore,
                    difficulty_level: llmAnalysis.difficulty,
                    vibe_classification: llmAnalysis.vibe,
                    summary: llmAnalysis.summary,
                    tags: [],
                    metadata: {
                        owner: metadata.owner,
                        full_name: metadata.full_name,
                        default_branch: metadata.default_branch,
                        total_files: scanResults.totalFiles,
                        total_directories: scanResults.totalDirectories,
                        languages: scanResults.languages,
                        frameworks: scanResults.frameworks,
                        dependencies: scanResults.dependencies,
                        improvements: llmAnalysis.improvements,
                    },
                })
                .select()
                .single();

            if (error) {
                logger.error('Error saving repository:', error);
                throw new AppError(500, 'Failed to save repository analysis');
            }

            logger.info(`Analysis complete for ${githubUrl}`);

            // Cache the result
            cacheService.set(cacheKey, repo, 86400);

            return repo;
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            logger.error('Unexpected error in repository analysis:', error);
            throw new AppError(500, 'Repository analysis failed');
        }
    }

    /**
     * Get user's repositories with filters and pagination
     */
    async getUserRepositories(
        userId: string,
        filters: {
            language?: string;
            tags?: string[];
            difficulty?: string;
            page?: number;
            limit?: number;
        }
    ): Promise<{
        repositories: Repository[];
        total: number;
        page: number;
        limit: number;
    }> {
        try {
            const page = filters.page || 1;
            const limit = filters.limit || 20;
            const { from, to } = getPagination(page, limit);

            let query = supabaseAdmin
                .from('repositories')
                .select('*', { count: 'exact' })
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            // Apply filters
            if (filters.language) {
                query = query.eq('language', filters.language);
            }

            if (filters.difficulty) {
                query = query.eq('difficulty_level', filters.difficulty);
            }

            if (filters.tags && filters.tags.length > 0) {
                query = query.contains('tags', filters.tags);
            }

            // Apply pagination
            query = query.range(from, to);

            const { data, error, count } = await query;

            if (error) {
                logger.error('Error fetching repositories:', error);
                throw new AppError(500, 'Failed to fetch repositories');
            }

            return {
                repositories: data || [],
                total: count || 0,
                page,
                limit,
            };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            logger.error('Unexpected error fetching repositories:', error);
            throw new AppError(500, 'Failed to fetch repositories');
        }
    }

    /**
     * Get repository by ID
     */
    async getRepositoryById(repoId: string, userId: string): Promise<Repository> {
        try {
            const { data, error } = await supabaseAdmin
                .from('repositories')
                .select('*')
                .eq('id', repoId)
                .eq('user_id', userId)
                .single();

            if (error || !data) {
                throw new AppError(404, 'Repository not found');
            }

            return data;
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            logger.error('Error fetching repository:', error);
            throw new AppError(500, 'Failed to fetch repository');
        }
    }

    /**
     * Update repository metadata
     */
    async updateRepository(
        repoId: string,
        userId: string,
        updates: {
            tags?: string[];
            metadata?: Record<string, any>;
        }
    ): Promise<Repository> {
        try {
            const updateData: any = {};
            if (updates.tags !== undefined) updateData.tags = updates.tags;
            if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

            const { data, error } = await supabaseAdmin
                .from('repositories')
                .update(updateData)
                .eq('id', repoId)
                .eq('user_id', userId)
                .select()
                .single();

            if (error || !data) {
                throw new AppError(404, 'Repository not found or update failed');
            }

            logger.info(`Repository updated: ${repoId}`);

            // Invalidate cache
            cacheService.delete(`repo:${data.github_url}`);

            return data;
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            logger.error('Error updating repository:', error);
            throw new AppError(500, 'Failed to update repository');
        }
    }

    /**
     * Delete repository
     */
    async deleteRepository(repoId: string, userId: string): Promise<void> {
        try {
            // First get the repo to invalidate cache
            const { data: repo } = await supabaseAdmin
                .from('repositories')
                .select('github_url')
                .eq('id', repoId)
                .eq('user_id', userId)
                .single();

            const { error } = await supabaseAdmin
                .from('repositories')
                .delete()
                .eq('id', repoId)
                .eq('user_id', userId);

            if (error) {
                throw new AppError(404, 'Repository not found or delete failed');
            }

            logger.info(`Repository deleted: ${repoId}`);

            // Invalidate cache
            if (repo) {
                cacheService.delete(`repo:${repo.github_url}`);
            }
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            logger.error('Error deleting repository:', error);
            throw new AppError(500, 'Failed to delete repository');
        }
    }

    /**
     * Search repositories
     */
    async searchRepositories(
        userId: string,
        query: string,
        page: number = 1,
        limit: number = 20
    ): Promise<{
        repositories: Repository[];
        total: number;
        page: number;
        limit: number;
    }> {
        try {
            const { from, to } = getPagination(page, limit);

            const { data, error, count } = await supabaseAdmin
                .from('repositories')
                .select('*', { count: 'exact' })
                .eq('user_id', userId)
                .or(`name.ilike.%${query}%,description.ilike.%${query}%,summary.ilike.%${query}%`)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) {
                logger.error('Error searching repositories:', error);
                throw new AppError(500, 'Search failed');
            }

            return {
                repositories: data || [],
                total: count || 0,
                page,
                limit,
            };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            logger.error('Unexpected error searching repositories:', error);
            throw new AppError(500, 'Search failed');
        }
    }
}

export const repoService = new RepoService();
