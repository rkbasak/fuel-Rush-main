import { SiteSettings } from '@/lib/services/config';

export async function generateOpenRouterContent(
  prompt: string, 
  settings: SiteSettings,
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const apiKey = settings.openrouter_api_key || process.env.OPENROUTER_API_KEY;
  const model = settings.openrouter_model || 'mistralai/mistral-7b-instruct';

  if (!apiKey) {
    throw new Error('OpenRouter API key is not configured.');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Fuel Rush Admin',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenRouter Error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}
