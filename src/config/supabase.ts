import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

// Admin client with service role key for server-side operations
export const supabaseAdmin: SupabaseClient<Database> = createClient<Database>(
    supabaseUrl!,
    (supabaseServiceRoleKey || supabaseAnonKey)!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

// Regular client with anon key
export const supabase: SupabaseClient<Database> = createClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!
);

/**
 * Create a Supabase client with a specific user's JWT token
 * Useful for operations that need to respect RLS policies
 */
export function createUserClient(accessToken: string): SupabaseClient<Database> {
    return createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    });
}

/**
 * Verify Supabase connection
 */
export async function verifySupabaseConnection(): Promise<boolean> {
    try {
        const { error } = await supabaseAdmin.from('profiles').select('count').limit(1);
        if (error) {
            console.error('Supabase connection error:', error);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Supabase connection failed:', error);
        return false;
    }
}
