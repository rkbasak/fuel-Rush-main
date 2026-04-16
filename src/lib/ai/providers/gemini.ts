import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not set');
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export async function callGemini(modelId: string, prompt: string): Promise<string> {
  const genAIInstance = getGenAI();
  const model = genAIInstance.getGenerativeModel({ model: modelId });
  const result = await model.generateContent(prompt);
  return result.response.text();
}
