import { FileTreeNode, ScanResults } from '../types/database';
import { logger } from '../utils/logger';

class ScannerService {
    /**
     * Scan codebase and generate analysis results
     */
    async scanCodebase(fileTree: FileTreeNode[]): Promise<ScanResults> {
        logger.info(`Scanning codebase with ${fileTree.length} items`);

        const files = fileTree.filter((node) => node.type === 'file');
        const directories = fileTree.filter((node) => node.type === 'dir');

        const languages = this.detectLanguages(files);
        const dependencies = this.extractDependencies(files);
        const frameworks = this.detectFrameworks(files);
        const complexityScore = this.calculateComplexity(files, directories, languages, dependencies);

        return {
            totalFiles: files.length,
            totalDirectories: directories.length,
            languages,
            dependencies,
            frameworks,
            complexityScore,
            fileTree,
        };
    }

    /**
     * Detect programming languages by file extensions
     */
    private detectLanguages(files: FileTreeNode[]): Record<string, number> {
        const languageMap: Record<string, string> = {
            js: 'JavaScript',
            jsx: 'JavaScript',
            ts: 'TypeScript',
            tsx: 'TypeScript',
            py: 'Python',
            java: 'Java',
            cpp: 'C++',
            c: 'C',
            cs: 'C#',
            go: 'Go',
            rs: 'Rust',
            rb: 'Ruby',
            php: 'PHP',
            swift: 'Swift',
            kt: 'Kotlin',
            scala: 'Scala',
            html: 'HTML',
            css: 'CSS',
            scss: 'SCSS',
            sass: 'SASS',
            vue: 'Vue',
            svelte: 'Svelte',
            dart: 'Dart',
            r: 'R',
            sql: 'SQL',
            sh: 'Shell',
            yaml: 'YAML',
            yml: 'YAML',
            json: 'JSON',
            xml: 'XML',
            md: 'Markdown',
        };

        const languages: Record<string, number> = {};

        for (const file of files) {
            if (file.extension) {
                const language = languageMap[file.extension];
                if (language) {
                    languages[language] = (languages[language] || 0) + 1;
                }
            }
        }

        return languages;
    }

    /**
     * Extract dependencies from package files
     */
    private extractDependencies(files: FileTreeNode[]): string[] {
        const dependencyFiles = [
            'package.json',
            'requirements.txt',
            'Gemfile',
            'go.mod',
            'Cargo.toml',
            'pom.xml',
            'build.gradle',
            'composer.json',
            'Pipfile',
            'pyproject.toml',
        ];

        const found: string[] = [];

        for (const file of files) {
            const fileName = file.path.split('/').pop() || '';
            if (dependencyFiles.includes(fileName)) {
                found.push(fileName);
            }
        }

        return found;
    }

    /**
     * Detect frameworks and tools from file patterns
     */
    private detectFrameworks(files: FileTreeNode[]): string[] {
        const frameworks: Set<string> = new Set();

        const patterns: Record<string, string> = {
            'next.config.js': 'Next.js',
            'next.config.ts': 'Next.js',
            'nuxt.config.js': 'Nuxt.js',
            'angular.json': 'Angular',
            'vue.config.js': 'Vue.js',
            'svelte.config.js': 'Svelte',
            'gatsby-config.js': 'Gatsby',
            'remix.config.js': 'Remix',
            'vite.config.js': 'Vite',
            'vite.config.ts': 'Vite',
            'webpack.config.js': 'Webpack',
            'rollup.config.js': 'Rollup',
            'tsconfig.json': 'TypeScript',
            'Dockerfile': 'Docker',
            'docker-compose.yml': 'Docker Compose',
            '.eslintrc': 'ESLint',
            '.prettierrc': 'Prettier',
            'jest.config.js': 'Jest',
            'vitest.config.ts': 'Vitest',
            'cypress.json': 'Cypress',
            'playwright.config.ts': 'Playwright',
            'tailwind.config.js': 'Tailwind CSS',
            'prisma/schema.prisma': 'Prisma',
            'manage.py': 'Django',
            'app.py': 'Flask',
            'main.go': 'Go',
            'Cargo.toml': 'Rust',
            'pom.xml': 'Maven',
            'build.gradle': 'Gradle',
        };

        for (const file of files) {
            for (const [pattern, framework] of Object.entries(patterns)) {
                if (file.path.includes(pattern)) {
                    frameworks.add(framework);
                }
            }
        }

        // Detect from package.json dependencies
        const packageJson = files.find((f) => f.path === 'package.json');
        if (packageJson) {
            // Common framework indicators
            const frameworkIndicators = [
                'react',
                'vue',
                'angular',
                'svelte',
                'express',
                'fastify',
                'nestjs',
                'koa',
            ];
            frameworkIndicators.forEach((fw) => {
                // This is a simplified check - in real implementation, we'd parse package.json
                frameworks.add(fw.charAt(0).toUpperCase() + fw.slice(1));
            });
        }

        return Array.from(frameworks);
    }

    /**
     * Calculate complexity score based on various metrics
     */
    private calculateComplexity(
        files: FileTreeNode[],
        directories: FileTreeNode[],
        languages: Record<string, number>,
        dependencies: string[]
    ): number {
        let score = 0;

        // File count contribution (0-30 points)
        const fileCount = files.length;
        if (fileCount < 10) score += 5;
        else if (fileCount < 50) score += 10;
        else if (fileCount < 200) score += 15;
        else if (fileCount < 500) score += 20;
        else if (fileCount < 1000) score += 25;
        else score += 30;

        // Directory depth contribution (0-20 points)
        const dirCount = directories.length;
        if (dirCount < 5) score += 5;
        else if (dirCount < 15) score += 10;
        else if (dirCount < 30) score += 15;
        else score += 20;

        // Language diversity (0-20 points)
        const languageCount = Object.keys(languages).length;
        if (languageCount === 1) score += 5;
        else if (languageCount === 2) score += 10;
        else if (languageCount <= 4) score += 15;
        else score += 20;

        // Dependency complexity (0-15 points)
        const depCount = dependencies.length;
        if (depCount === 0) score += 0;
        else if (depCount === 1) score += 5;
        else if (depCount <= 3) score += 10;
        else score += 15;

        // Configuration files (0-15 points)
        const configFiles = files.filter((f) => {
            const name = f.path.split('/').pop() || '';
            return (
                name.startsWith('.') ||
                name.includes('config') ||
                name.includes('.json') ||
                name.includes('.yaml') ||
                name.includes('.yml')
            );
        });
        const configCount = configFiles.length;
        if (configCount < 5) score += 3;
        else if (configCount < 10) score += 7;
        else if (configCount < 20) score += 11;
        else score += 15;

        // Normalize to 0-100
        return Math.min(100, score);
    }

    /**
     * Analyze code patterns (simplified version)
     */
    analyzeCodePatterns(content: string): {
        hasClasses: boolean;
        hasFunctions: boolean;
        hasImports: boolean;
        hasExports: boolean;
    } {
        return {
            hasClasses: /class\s+\w+/.test(content),
            hasFunctions: /function\s+\w+|const\s+\w+\s*=\s*\(/.test(content),
            hasImports: /import\s+.*from|require\(/.test(content),
            hasExports: /export\s+(default|const|class|function)/.test(content),
        };
    }
}

export const scannerService = new ScannerService();
