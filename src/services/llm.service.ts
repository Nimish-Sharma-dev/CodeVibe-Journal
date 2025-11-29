import OpenAI from 'openai';
import { GitHubRepoMetadata, ScanResults, LLMAnalysis } from '../types/database';
import { summaryPrompt, vibePrompt, difficultyPrompt, improvementPrompt } from '../prompts/analysis.prompts';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/error.middleware';

class LLMService {
    private client: OpenAI;
    private model: string;

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            logger.warn('OpenAI API key not found. LLM features will use fallback responses.');
        }

        this.client = new OpenAI({
            apiKey: apiKey || 'dummy-key',
        });

        this.model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
    }

    /**
     * Generate complete analysis for a repository
     */
    async analyzeRepository(
        metadata: GitHubRepoMetadata,
        scanResults: ScanResults
    ): Promise<LLMAnalysis> {
        try {
            const [summary, vibe, difficulty, improvements] = await Promise.all([
                this.generateRepoSummary(metadata, scanResults),
                this.classifyVibe(metadata, scanResults),
                this.predictDifficulty(scanResults),
                this.generateImprovementPlan(metadata, scanResults),
            ]);

            return {
                summary,
                vibe,
                difficulty,
                improvements,
            };
        } catch (error) {
            logger.error('Error in LLM analysis:', error);
            // Return fallback analysis
            return this.getFallbackAnalysis(metadata, scanResults);
        }
    }

    /**
     * Generate repository summary
     */
    async generateRepoSummary(
        metadata: GitHubRepoMetadata,
        scanResults: ScanResults
    ): Promise<string> {
        try {
            const prompt = summaryPrompt(metadata, scanResults);

            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a senior software engineer analyzing GitHub repositories. Provide concise, technical summaries.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.7,
                max_tokens: 200,
            });

            const summary = response.choices[0]?.message?.content?.trim();
            if (!summary) {
                throw new Error('Empty response from LLM');
            }

            logger.debug('Generated summary:', summary);
            return summary;
        } catch (error) {
            logger.error('Error generating summary:', error);
            return this.getFallbackSummary(metadata);
        }
    }

    /**
     * Classify repository vibe
     */
    async classifyVibe(metadata: GitHubRepoMetadata, scanResults: ScanResults): Promise<string> {
        try {
            const prompt = vibePrompt(metadata, scanResults);

            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a repository classifier. Respond with only the category name.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.3,
                max_tokens: 50,
            });

            const vibe = response.choices[0]?.message?.content?.trim();
            if (!vibe) {
                throw new Error('Empty response from LLM');
            }

            logger.debug('Classified vibe:', vibe);
            return vibe;
        } catch (error) {
            logger.error('Error classifying vibe:', error);
            return this.getFallbackVibe(scanResults);
        }
    }

    /**
     * Predict difficulty level
     */
    async predictDifficulty(scanResults: ScanResults): Promise<string> {
        try {
            const prompt = difficultyPrompt(scanResults);

            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a code complexity analyzer. Respond with only the difficulty level.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.3,
                max_tokens: 50,
            });

            const difficulty = response.choices[0]?.message?.content?.trim();
            if (!difficulty) {
                throw new Error('Empty response from LLM');
            }

            logger.debug('Predicted difficulty:', difficulty);
            return difficulty;
        } catch (error) {
            logger.error('Error predicting difficulty:', error);
            return this.getFallbackDifficulty(scanResults);
        }
    }

    /**
     * Generate improvement plan
     */
    async generateImprovementPlan(
        metadata: GitHubRepoMetadata,
        scanResults: ScanResults
    ): Promise<string[]> {
        try {
            const prompt = improvementPrompt(metadata, scanResults);

            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a senior software engineer providing code review feedback. Respond with only valid JSON.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.7,
                max_tokens: 500,
            });

            const content = response.choices[0]?.message?.content?.trim();
            if (!content) {
                throw new Error('Empty response from LLM');
            }

            // Parse JSON response
            const improvements = JSON.parse(content);
            const formatted = improvements.map(
                (imp: any) => `[${imp.category}] ${imp.title}: ${imp.description}`
            );

            logger.debug('Generated improvements:', formatted);
            return formatted;
        } catch (error) {
            logger.error('Error generating improvements:', error);
            return this.getFallbackImprovements();
        }
    }

    /**
     * Fallback analysis when LLM is unavailable
     */
    private getFallbackAnalysis(
        metadata: GitHubRepoMetadata,
        scanResults: ScanResults
    ): LLMAnalysis {
        return {
            summary: this.getFallbackSummary(metadata),
            vibe: this.getFallbackVibe(scanResults),
            difficulty: this.getFallbackDifficulty(scanResults),
            improvements: this.getFallbackImprovements(),
        };
    }

    private getFallbackSummary(metadata: GitHubRepoMetadata): string {
        return `${metadata.full_name} is a ${metadata.language || 'software'} project${metadata.description ? `: ${metadata.description}` : ''
            }. The repository has ${metadata.stars} stars and ${metadata.forks} forks.`;
    }

    private getFallbackVibe(scanResults: ScanResults): string {
        if (scanResults.complexityScore < 30) return 'Learning Project';
        if (scanResults.complexityScore < 50) return 'Personal Tool';
        if (scanResults.complexityScore < 70) return 'Open Source Library';
        return 'Enterprise';
    }

    private getFallbackDifficulty(scanResults: ScanResults): string {
        if (scanResults.complexityScore < 25) return 'Beginner';
        if (scanResults.complexityScore < 50) return 'Intermediate';
        if (scanResults.complexityScore < 75) return 'Advanced';
        return 'Expert';
    }

    private getFallbackImprovements(): string[] {
        return [
            '[documentation] Add README: Create comprehensive documentation explaining project setup and usage.',
            '[testing] Implement tests: Add unit and integration tests to ensure code reliability.',
            '[code-quality] Add linting: Set up ESLint or similar tools for consistent code style.',
        ];
    }
}

export const llmService = new LLMService();
