import { createClient } from '@/lib/supabase/client';

export interface SiteSettings {
  google_maps_api_key: string;
  gemini_api_key: string;
  redis_url: string;
  redis_token: string;
  firebase_api_key: string;
  firebase_auth_domain: string;
  firebase_project_id: string;
  firebase_app_id: string;
  ai_provider: 'gemini' | 'openrouter';
  openrouter_api_key: string;
  openrouter_model: string;
}

const CACHE_KEY = 'fr_site_settings';
const CACHE_TTL = 60 * 1000; // 1 minute

let cachedSettings: SiteSettings | null = null;
let lastFetchTime = 0;

/**
 * Utility to check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return !!url && !url.includes('your-project.supabase.co');
}


export async function getSiteSettings(): Promise<SiteSettings> {
  const now = Date.now();
  
  // Return cached if fresh
  if (cachedSettings && (now - lastFetchTime < CACHE_TTL)) {
    return cachedSettings;
  }

  if (!isSupabaseConfigured()) {
    console.warn('[Config] Supabase is not configured (using placeholders). Falling back to environment variables.');
    return fallbackSettings();
  }

  const supabase = createClient();

  
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .single();

    if (error) throw error;

    cachedSettings = {
      google_maps_api_key: data.google_maps_api_key || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      gemini_api_key: data.gemini_api_key || process.env.GEMINI_API_KEY,
      redis_url: data.redis_url || process.env.UPSTASH_REDIS_REST_URL,
      redis_token: data.redis_token || process.env.UPSTASH_REDIS_REST_TOKEN,
      firebase_api_key: data.firebase_api_key || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      firebase_auth_domain: data.firebase_auth_domain || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebase_project_id: data.firebase_project_id || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      firebase_app_id: data.firebase_app_id || process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      ai_provider: data.ai_provider || 'gemini',
      openrouter_api_key: data.openrouter_api_key || process.env.OPENROUTER_API_KEY,
      openrouter_model: data.openrouter_model || 'mistralai/mistral-7b-instruct',
    };
    
    lastFetchTime = now;
    return cachedSettings;
  } catch (err) {
    console.warn('Failed to fetch site settings from DB, falling back to environment variables.', err);
    return fallbackSettings();
  }
}

/**
 * Returns static settings derived from environment variables
 */
function fallbackSettings(): SiteSettings {
  return {
    google_maps_api_key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    gemini_api_key: process.env.GEMINI_API_KEY || '',
    redis_url: process.env.UPSTASH_REDIS_REST_URL || '',
    redis_token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    firebase_api_key: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    firebase_auth_domain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    firebase_project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    firebase_app_id: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
    ai_provider: 'gemini',
    openrouter_api_key: process.env.OPENROUTER_API_KEY || '',
    openrouter_model: 'mistralai/mistral-7b-instruct',
  };
}


export async function updateSiteSettings(updates: Partial<SiteSettings>): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { 
      success: false, 
      error: 'Supabase is not configured. Please update your NEXT_PUBLIC_SUPABASE_URL environment variable in .env.local' 
    };
  }

  const supabase = createClient();

  
  try {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ 
        id: 1, // Single record for global settings
        ...updates,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    
    // Invalidate cache
    cachedSettings = null;
    lastFetchTime = 0;
    
    return { success: true };
  } catch (err: any) {
    console.error('Failed to update site settings:', err);
    return { 
      success: false, 
      error: err?.message || err?.error_description || String(err) || 'Unknown error occurred'
    };
  }
}
