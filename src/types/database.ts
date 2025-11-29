export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            repositories: {
                Row: {
                    id: string
                    user_id: string
                    github_url: string
                    name: string
                    description: string | null
                    language: string | null
                    stars: number
                    forks: number
                    complexity_score: number
                    difficulty_level: string | null
                    vibe_classification: string | null
                    summary: string | null
                    tags: string[]
                    last_analyzed_at: string
                    metadata: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    github_url: string
                    name: string
                    description?: string | null
                    language?: string | null
                    stars?: number
                    forks?: number
                    complexity_score?: number
                    difficulty_level?: string | null
                    vibe_classification?: string | null
                    summary?: string | null
                    tags?: string[]
                    last_analyzed_at?: string
                    metadata?: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    github_url?: string
                    name?: string
                    description?: string | null
                    language?: string | null
                    stars?: number
                    forks?: number
                    complexity_score?: number
                    difficulty_level?: string | null
                    vibe_classification?: string | null
                    summary?: string | null
                    tags?: string[]
                    last_analyzed_at?: string
                    metadata?: Json
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "repositories_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            daily_logs: {
                Row: {
                    id: string
                    user_id: string
                    repo_id: string | null
                    log_date: string
                    content: string
                    hours_worked: number
                    mood: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    repo_id?: string | null
                    log_date: string
                    content: string
                    hours_worked?: number
                    mood?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    repo_id?: string | null
                    log_date?: string
                    content?: string
                    hours_worked?: number
                    mood?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "daily_logs_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "daily_logs_repo_id_fkey"
                        columns: ["repo_id"]
                        referencedRelation: "repositories"
                        referencedColumns: ["id"]
                    }
                ]
            }
            activity_days: {
                Row: {
                    id: string
                    user_id: string
                    activity_date: string
                    log_count: number
                    total_hours: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    activity_date: string
                    log_count?: number
                    total_hours?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    activity_date?: string
                    log_count?: number
                    total_hours?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "activity_days_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

// Additional type definitions
export interface User {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
}

export interface Repository {
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
    metadata: any;
    created_at: string;
    updated_at: string;
}

export interface DailyLog {
    id: string;
    user_id: string;
    repo_id: string | null;
    log_date: string;
    content: string;
    hours_worked: number;
    mood: string | null;
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
    description: string | null;
    language: string | null;
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
