import { callGemini } from './providers/gemini';
import { callOpenAI } from './providers/openai';
import { callAnthropic } from './providers/anthropic';
import { callGroq } from './providers/groq';

// AI Model types
type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'groq';

interface AIModel {
  id: string;
  provider: AIProvider;
  priority: number;
  rpmLimit: number;
  tpmLimit: number;
}

// Model registry
const MODELS: AIModel[] = [
  { id: 'gemini-2.0-flash', provider: 'gemini', priority: 1, rpmLimit: 60, tpmLimit: 1000000 },
  { id: 'gemini-1.5-flash', provider: 'gemini', priority: 2, rpmLimit: 60, tpmLimit: 1000000 },
  { id: 'llama-3.1-8b-instant', provider: 'groq', priority: 3, rpmLimit: 30, tpmLimit: 6000 },
  { id: 'mixtral-8x7b-32768', provider: 'groq', priority: 4, rpmLimit: 30, tpmLimit: 6000 },
  { id: 'gpt-4o-mini', provider: 'openai', priority: 5, rpmLimit: 500, tpmLimit: 200000 },
  { id: 'gpt-4o', provider: 'openai', priority: 6, rpmLimit: 200, tpmLimit: 300000 },
  { id: 'claude-3-haiku', provider: 'anthropic', priority: 7, rpmLimit: 100, tpmLimit: 200000 },
];

// Per-minute request tracking (simple in-memory)
// ⚠️ WARNING: This in-memory rate limiting is NOT safe for multi-instance/serverless deployments.
// Each server instance maintains its own counter, bypassing cross-instance limits.
// Use Upstash Redis rate limiting for production multi-instance deployments.
const requestCounts = new Map<string, number>();
const requestTimestamps = new Map<string, number>();

function resetCountIfNeeded(modelId: string) {
  const now = Date.now();
  const lastReset = requestTimestamps.get(modelId) || 0;
  if (now - lastReset > 60000) {
    requestCounts.set(modelId, 0);
    requestTimestamps.set(modelId, now);
  }
}

function getAvailableModel(): AIModel | null {
  for (const model of [...MODELS].sort((a, b) => a.priority - b.priority)) {
    resetCountIfNeeded(model.id);
    const count = requestCounts.get(model.id) || 0;
    if (count < model.rpmLimit) {
      return model;
    }
  }
  return null;
}

function recordRequest(modelId: string) {
  requestCounts.set(modelId, (requestCounts.get(modelId) || 0) + 1);
}

function isRateLimitError(error: any): boolean {
  const msg = (error?.message || '').toLowerCase();
  const code = error?.status || error?.code || '';
  return (
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('429') ||
    code === 429 ||
    msg.includes('too many requests') ||
    msg.includes('resource has been exhausted')
  );
}

async function callModel(modelId: string, prompt: string): Promise<string> {
  if (modelId.startsWith('gemini')) {
    return callGemini(modelId, prompt);
  } else if (modelId.startsWith('gpt') || modelId.startsWith('o1') || modelId.startsWith('o3')) {
    return callOpenAI(modelId, prompt);
  } else if (modelId.startsWith('claude')) {
    return callAnthropic(modelId, prompt);
  } else if (modelId.startsWith('llama') || modelId.startsWith('mixtral') || modelId.startsWith('gemma')) {
    return callGroq(modelId, prompt);
  }
  throw new Error(`Unknown model: ${modelId}`);
}

/**
 * Call an AI model with automatic fallback.
 * If one model hits a rate limit, it transparently switches to the next available.
 */
export async function callWithFallback(
  prompt: string,
  fallbackModels?: string[]
): Promise<{ text: string; modelUsed: string }> {
  const tried = new Set<string>();
  const additionalModels: AIModel[] = (fallbackModels || []).map(id => ({
    id,
    provider: id.startsWith('gemini') ? 'gemini' : id.startsWith('gpt') ? 'openai' : 'anthropic',
    priority: 0,
    rpmLimit: 9999,
    tpmLimit: 999999,
  }));

  const allModels = [...additionalModels, ...MODELS];

  while (true) {
    const model = getAvailableModelForList(allModels);
    if (!model) {
      throw new Error('All AI models are at capacity. Please try again later.');
    }

    if (tried.has(model.id)) {
      // Try to find another model
      const next = allModels.find(m => !tried.has(m.id) && isModelAvailable(m));
      if (!next) {
        throw new Error('All AI models are at capacity. Please try again later.');
      }
      tried.add(next.id);
      try {
        recordRequest(next.id);
        console.log(`[AI Router] Using model: ${next.id} (provider: ${next.provider})`);
        const result = await callModel(next.id, prompt);
        return { text: result, modelUsed: next.id };
      } catch (error: any) {
        if (isRateLimitError(error)) {
          console.warn(`[AI Router] Rate limit hit for ${next.id}, trying next model...`);
          tried.add(next.id);
          continue;
        }
        throw error;
      }
    }

    tried.add(model.id);

    try {
      recordRequest(model.id);
      console.log(`[AI Router] Using model: ${model.id} (provider: ${model.provider})`);
      const result = await callModel(model.id, prompt);
      return { text: result, modelUsed: model.id };
    } catch (error: any) {
      if (isRateLimitError(error)) {
        console.warn(`[AI Router] Rate limit hit for ${model.id}, trying next model...`);
        continue;
      }
      throw error;
    }
  }
}

function isModelAvailable(model: AIModel): boolean {
  resetCountIfNeeded(model.id);
  const count = requestCounts.get(model.id) || 0;
  return count < model.rpmLimit;
}

function getAvailableModelForList(models: AIModel[]): AIModel | null {
  for (const model of [...models].sort((a, b) => a.priority - b.priority)) {
    if (isModelAvailable(model)) {
      return model;
    }
  }
  return null;
}
