import { ApiError } from '@/lib/api';

/**
 * Обращение к Gemini через REST — отдельного SDK не тянем, запрос один.
 * Ключ берётся из GEMINI_API_KEY (получить на aistudio.google.com).
 */

const DEFAULT_MODEL = 'gemini-2.5-flash';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string; status?: string };
}

export async function askGemini(system: string, messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new ApiError(503, 'Ассистент не настроен: не задан GEMINI_API_KEY');
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: messages.map((message) => ({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: message.text }],
        })),
        generationConfig: { temperature: 0.4, maxOutputTokens: 1000 },
      }),
    });
  } catch {
    throw new ApiError(502, 'Не удалось связаться с Gemini — проверьте интернет');
  }

  const data = (await response.json().catch(() => ({}))) as GeminiResponse;

  if (!response.ok) {
    const detail = data.error?.message ?? `код ${response.status}`;
    if (response.status === 404) {
      throw new ApiError(502, `Модель «${model}» недоступна. Укажите другую в GEMINI_MODEL. (${detail})`);
    }
    if (response.status === 400 || response.status === 403) {
      throw new ApiError(502, `Gemini отклонил запрос: ${detail}`);
    }
    throw new ApiError(502, `Gemini вернул ошибку: ${detail}`);
  }

  if (data.promptFeedback?.blockReason) {
    throw new ApiError(422, 'Gemini отказался отвечать на такой запрос');
  }

  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim();
  if (!text) throw new ApiError(502, 'Gemini вернул пустой ответ');

  return text;
}
