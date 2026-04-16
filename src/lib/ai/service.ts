import { getSiteSettings, SiteSettings } from '@/lib/services/config';
import { generateOpenRouterContent } from './openrouter';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Universal AI Completion Engine
 * Dynamically switches between Gemini and OpenRouter based on Admin Settings.
 */
export async function generateAIContent(
  prompt: string, 
  options: { temperature?: number; maxTokens?: number; model?: string } = {}
): Promise<string> {
  const settings = await getSiteSettings();
  const provider = settings.ai_provider || 'gemini';

  if (provider === 'openrouter') {
    try {
      console.log(`[AI] Routing request to OpenRouter using model: ${settings.openrouter_model}`);
      return await generateOpenRouterContent(prompt, settings, options);
    } catch (err) {
      console.error('[AI] OpenRouter failed, falling back to Gemini:', err);
      // Fallback to Gemini if OpenRouter fails
      return await generateGeminiContent(prompt, settings, options);
    }
  }

  // Default to Gemini
  return await generateGeminiContent(prompt, settings, options);
}

/**
 * Internal helper for direct Gemini calls
 */
async function generateGeminiContent(
  prompt: string,
  settings: SiteSettings,
  options: { model?: string } = {}
): Promise<string> {
  const apiKey = settings.gemini_api_key || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelId = options.model || process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.0-flash';
  const model = genAI.getGenerativeModel({ model: modelId });

  const result = await model.generateContent(prompt);
  return result.response.text();
}
