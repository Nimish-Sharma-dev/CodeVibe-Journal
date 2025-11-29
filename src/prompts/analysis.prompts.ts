import { GitHubRepoMetadata, ScanResults } from '../types/database';

/**
 * Generate prompt for repository summary
 */
export function summaryPrompt(metadata: GitHubRepoMetadata, scanResults: ScanResults): string {
    const languages = Object.entries(scanResults.languages)
        .map(([lang, count]) => `${lang} (${count} files)`)
        .join(', ');

    return `Analyze this GitHub repository and provide a concise, professional summary (2-3 sentences):

Repository: ${metadata.full_name}
Description: ${metadata.description || 'No description provided'}
Primary Language: ${metadata.language || 'Unknown'}
Stars: ${metadata.stars}
Forks: ${metadata.forks}

Code Analysis:
- Total Files: ${scanResults.totalFiles}
- Languages: ${languages}
- Frameworks/Tools: ${scanResults.frameworks.join(', ') || 'None detected'}
- Dependencies: ${scanResults.dependencies.join(', ') || 'None detected'}

Provide a summary that explains what this project does, its main purpose, and key technologies used. Be specific and technical.`;
}

/**
 * Generate prompt for vibe classification
 */
export function vibePrompt(metadata: GitHubRepoMetadata, scanResults: ScanResults): string {
    return `Classify the "vibe" or nature of this GitHub repository into ONE of these categories:

Categories:
1. Enterprise - Large-scale production application with complex architecture
2. Startup MVP - Minimum viable product or early-stage startup project
3. Open Source Library - Reusable library or framework for developers
4. Learning Project - Educational or tutorial project for learning
5. Experimental - Research, proof-of-concept, or experimental project
6. Personal Tool - Personal utility or automation tool
7. Portfolio Project - Showcase project for portfolio
8. Boilerplate - Template or starter project

Repository: ${metadata.full_name}
Description: ${metadata.description || 'No description'}
Stars: ${metadata.stars}
Forks: ${metadata.forks}
Files: ${scanResults.totalFiles}
Complexity Score: ${scanResults.complexityScore}/100
Frameworks: ${scanResults.frameworks.join(', ') || 'None'}

Respond with ONLY the category name (e.g., "Enterprise" or "Learning Project").`;
}

/**
 * Generate prompt for difficulty prediction
 */
export function difficultyPrompt(scanResults: ScanResults): string {
    const languages = Object.keys(scanResults.languages).join(', ');

    return `Predict the difficulty level for a developer to understand and contribute to this codebase.

Choose ONE difficulty level:
1. Beginner - Simple structure, few files, single language, minimal dependencies
2. Intermediate - Moderate complexity, multiple files, common frameworks
3. Advanced - Complex architecture, multiple languages, many dependencies
4. Expert - Very complex, large codebase, advanced patterns, specialized domain

Code Metrics:
- Total Files: ${scanResults.totalFiles}
- Total Directories: ${scanResults.totalDirectories}
- Languages: ${languages}
- Complexity Score: ${scanResults.complexityScore}/100
- Frameworks: ${scanResults.frameworks.join(', ') || 'None'}
- Dependencies: ${scanResults.dependencies.length}

Respond with ONLY the difficulty level (e.g., "Intermediate").`;
}

/**
 * Generate prompt for improvement suggestions
 */
export function improvementPrompt(
    metadata: GitHubRepoMetadata,
    scanResults: ScanResults
): string {
    return `As a senior software engineer, suggest 3-5 specific improvements for this repository:

Repository: ${metadata.full_name}
Description: ${metadata.description || 'No description'}
Files: ${scanResults.totalFiles}
Complexity: ${scanResults.complexityScore}/100
Frameworks: ${scanResults.frameworks.join(', ') || 'None'}
Dependencies: ${scanResults.dependencies.join(', ') || 'None'}

Focus on:
- Code quality and organization
- Testing and documentation
- Performance and scalability
- Security best practices
- Developer experience

Provide a JSON array of improvement suggestions. Each suggestion should have:
- category: "code-quality" | "testing" | "documentation" | "performance" | "security" | "devex"
- title: Brief title (max 50 chars)
- description: Detailed explanation (max 150 chars)

Example format:
[
  {
    "category": "testing",
    "title": "Add unit tests",
    "description": "Implement unit tests using Jest to ensure code reliability and catch bugs early."
  }
]

Respond with ONLY the JSON array, no additional text.`;
}
