-- Fix: Create site_settings table if it doesn't exist and add OpenRouter columns
-- Migration: 007_saas_infrastructure_v2

CREATE TABLE IF NOT EXISTS public.site_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    google_maps_api_key TEXT,
    gemini_api_key TEXT,
    redis_url TEXT,
    redis_token TEXT,
    firebase_api_key TEXT,
    firebase_auth_domain TEXT,
    firebase_project_id TEXT,
    firebase_app_id TEXT,
    ai_provider TEXT DEFAULT 'gemini',
    openrouter_api_key TEXT,
    openrouter_model TEXT DEFAULT 'mistralai/mistral-7b-instruct',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT singleton_check CHECK (id = 1)
);

-- Ensure RLS is enabled
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read settings (public config)
CREATE POLICY "Allow public read on site_settings" 
ON public.site_settings FOR SELECT 
USING (true);

-- Only authenticated admins should be able to update (mock policy for now)
-- In production, replace with: USING (auth.uid() IN (select id from users where role = 'admin'))
CREATE POLICY "Allow authenticated update on site_settings" 
ON public.site_settings FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Initial record
INSERT INTO public.site_settings (id) 
VALUES (1) 
ON CONFLICT (id) DO NOTHING;
