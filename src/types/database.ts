export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    full_name: string | null;
                    avatar_url: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            repositories: {
                Row: {
                    id: string;
                    user_id: string;
                    github_url: string;
                    name: string;
                    description: string | null;
                    language: string | null;
                    stars: number;
                    forks: number;
                    complexity_score: number;
                    difficulty_level: string | null;
                    vibe_classification: string | null;
                    summary: string | null;
                    tags: string[];
                    last_analyzed_at: string;
                    metadata: Record<string, any>;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    github_url: string;
                    name: string;
                    description?: string | null;
                    language?: string | null;
                    stars?: number;
                    forks?: number;
                    complexity_score?: number;
                    difficulty_level?: string | null;
                    vibe_classification?: string | null;
                    summary?: string | null;
                    tags?: string[];
                    last_analyzed_at?: string;
                    metadata?: Record<string, any>;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    github_url?: string;
                    name?: string;
                    description?: string | null;
                    language?: string | null;
                    stars?: number;
                    forks?: number;
                    complexity_score?: number;
                    difficulty_level?: string | null;
                    vibe_classification?: string | null;
                    summary?: string | null;
                    tags?: string[];
                    last_analyzed_at?: string;
                    metadata?: Record<string, any>;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            daily_logs: {
                Row: {
                    id: string;
                    user_id: string;
                    repo_id: string | null;
                    log_date: string;
                    content: string;
                    hours_worked: number;
                    mood: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    repo_id?: string | null;
                    log_date: string;
                    content: string;
                    hours_worked?: number;
                    mood?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    repo_id?: string | null;
                    log_date?: string;
                    content?: string;
                    hours_worked?: number;
                    mood?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            activity_days: {
                Row: {
                    id: string;
                    user_id: string;
                    activity_date: string;
                    log_count: number;
                    total_hours: number;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    activity_date: string;
                    log_count?: number;
                    total_hours?: number;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    activity_date?: string;
                    log_count?: number;
                    total_hours?: number;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
            };
        };
    };
}

// Additional type definitions
export interface User {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
}

export interface Repository {
    id: string;
    user_id: string;
    github_url: string;
    name: string;
    description?: string;
    language?: string;
    stars: number;
    forks: number;
    complexity_score: number;
    difficulty_level?: string;
    vibe_classification?: string;
    summary?: string;
    tags: string[];
    last_analyzed_at: string;
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface DailyLog {
    id: string;
    user_id: string;
    repo_id?: string;
    log_date: string;
    content: string;
    hours_worked: number;
    mood?: string;
    created_at: string;
    updated_at: string;
}

export interface ActivityDay {
    id: string;
    user_id: string;
    activity_date: string;
    log_count: number;
    total_hours: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface GitHubRepoMetadata {
    owner: string;
    repo: string;
    full_name: string;
    description?: string;
    language?: string;
    stars: number;
    forks: number;
    default_branch: string;
}

export interface FileTreeNode {
    path: string;
    type: 'file' | 'dir';
    size?: number;
    extension?: string;
}

export interface ScanResults {
    totalFiles: number;
    totalDirectories: number;
    languages: Record<string, number>;
    dependencies: string[];
    frameworks: string[];
    complexityScore: number;
    fileTree: FileTreeNode[];
}

export interface LLMAnalysis {
    summary: string;
    vibe: string;
    difficulty: string;
    improvements: string[];
}
