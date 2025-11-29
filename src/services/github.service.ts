import axios, { AxiosInstance } from 'axios';
import { GitHubRepoMetadata, FileTreeNode } from '../types/database';
import { parseGitHubUrl, retryWithBackoff } from '../utils/helpers';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/error.middleware';

class GitHubService {
    private client: AxiosInstance;
    private token: string | undefined;

    constructor() {
        this.token = process.env.GITHUB_TOKEN;

        this.client = axios.create({
            baseURL: 'https://api.github.com',
            headers: {
                Accept: 'application/vnd.github.v3+json',
                ...(this.token && { Authorization: `token ${this.token}` }),
            },
            timeout: 30000,
        });

        // Add response interceptor for rate limiting
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 403 && error.response?.headers['x-ratelimit-remaining'] === '0') {
                    const resetTime = error.response.headers['x-ratelimit-reset'];
                    const resetDate = new Date(parseInt(resetTime) * 1000);
                    logger.error(`GitHub API rate limit exceeded. Resets at: ${resetDate}`);
                    throw new AppError(429, 'GitHub API rate limit exceeded. Please try again later.');
                }
                throw error;
            }
        );
    }

    /**
     * Fetch repository metadata from GitHub
     */
    async fetchRepoMetadata(githubUrl: string): Promise<GitHubRepoMetadata> {
        const parsed = parseGitHubUrl(githubUrl);
        if (!parsed) {
            throw new AppError(400, 'Invalid GitHub URL');
        }

        const { owner, repo } = parsed;

        try {
            const response = await retryWithBackoff(async () => {
                return await this.client.get(`/repos/${owner}/${repo}`);
            });

            const data = response.data;

            return {
                owner: data.owner.login,
                repo: data.name,
                full_name: data.full_name,
                description: data.description || undefined,
                language: data.language || undefined,
                stars: data.stargazers_count || 0,
                forks: data.forks_count || 0,
                default_branch: data.default_branch || 'main',
            };
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new AppError(404, 'Repository not found');
            }
            if (error.response?.status === 403) {
                throw new AppError(403, 'Repository is private or access denied');
            }
            logger.error('Error fetching repo metadata:', error);
            throw new AppError(500, 'Failed to fetch repository metadata');
        }
    }

    /**
     * Fetch repository file tree
     */
    async fetchRepoTree(owner: string, repo: string, branch: string = 'main'): Promise<FileTreeNode[]> {
        try {
            const response = await retryWithBackoff(async () => {
                return await this.client.get(`/repos/${owner}/${repo}/git/trees/${branch}`, {
                    params: { recursive: 1 },
                });
            });

            const tree = response.data.tree;

            return tree.map((item: any) => ({
                path: item.path,
                type: item.type === 'tree' ? 'dir' : 'file',
                size: item.size,
                extension: item.type === 'blob' ? this.getFileExtension(item.path) : undefined,
            }));
        } catch (error: any) {
            if (error.response?.status === 409) {
                // Empty repository
                logger.warn(`Repository ${owner}/${repo} is empty`);
                return [];
            }
            logger.error('Error fetching repo tree:', error);
            throw new AppError(500, 'Failed to fetch repository file tree');
        }
    }

    /**
     * Fetch file content from repository
     */
    async fetchFileContent(owner: string, repo: string, path: string, branch: string = 'main'): Promise<string> {
        try {
            const response = await retryWithBackoff(async () => {
                return await this.client.get(`/repos/${owner}/${repo}/contents/${path}`, {
                    params: { ref: branch },
                });
            });

            const content = response.data.content;
            if (!content) {
                throw new Error('No content in response');
            }

            // Decode base64 content
            return Buffer.from(content, 'base64').toString('utf-8');
        } catch (error: any) {
            logger.error(`Error fetching file content for ${path}:`, error.message);
            throw new AppError(500, `Failed to fetch file: ${path}`);
        }
    }

    /**
     * Clone repository structure (metadata + file tree)
     */
    async cloneRepoStructure(githubUrl: string): Promise<{
        metadata: GitHubRepoMetadata;
        fileTree: FileTreeNode[];
    }> {
        const metadata = await this.fetchRepoMetadata(githubUrl);
        const fileTree = await this.fetchRepoTree(metadata.owner, metadata.repo, metadata.default_branch);

        logger.info(`Cloned structure for ${metadata.full_name}: ${fileTree.length} items`);

        return {
            metadata,
            fileTree,
        };
    }

    /**
     * Get file extension from path
     */
    private getFileExtension(path: string): string | undefined {
        const parts = path.split('.');
        if (parts.length > 1) {
            return parts[parts.length - 1].toLowerCase();
        }
        return undefined;
    }

    /**
     * Check rate limit status
     */
    async getRateLimitStatus(): Promise<{
        limit: number;
        remaining: number;
        reset: Date;
    }> {
        try {
            const response = await this.client.get('/rate_limit');
            const core = response.data.resources.core;

            return {
                limit: core.limit,
                remaining: core.remaining,
                reset: new Date(core.reset * 1000),
            };
        } catch (error) {
            logger.error('Error fetching rate limit:', error);
            throw new AppError(500, 'Failed to fetch rate limit status');
        }
    }
}

export const githubService = new GitHubService();
