import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';

const DEFAULT_MODELS = 'gemini-3.8-flash,gemini-3.7-flash,gemini-3.5-flash,gemini-3.1-flash-lite';
const MODELS = (process.env.GEMINI_MODELS || DEFAULT_MODELS).split(',').map((model) => model.trim()).filter(Boolean);
const MAX_SAME_MODEL_RETRIES = 1;
const RETRY_DELAY_MS = 1000;
const MAX_REQUEST_TIME_MS = 40000;
const DAILY_QUOTA_COOLDOWN_MS = 60 * 60 * 1000;

let client: GoogleGenerativeAI | null = null;
const dailyQuotaModels = new Map<string, number>();

function getClient(): GoogleGenerativeAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured. Set it in practice settings or environment variables.');
    }
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
}

function getErrorDetails(error: unknown): { status?: number; message: string; dailyQuota: boolean; transient: boolean } {
  const err = error as { status?: number; statusCode?: number; message?: string; code?: string; errorDetails?: unknown };
  const status = err?.status ?? err?.statusCode;
  const message = [
    err?.message,
    err?.code,
    typeof err?.errorDetails === 'string' ? err.errorDetails : JSON.stringify(err?.errorDetails ?? ''),
  ].filter(Boolean).join(' ');
  const lowerMessage = message.toLowerCase();
  const dailyQuota = /quotafailure|daily.?quota|quota.{0,30}(exceed|limit|exhaust)|exhaust.{0,30}quota/i.test(message);
  const transient = status === 408 || status === 500 || status === 502 || status === 504 ||
    ['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN'].includes(err?.code || '') ||
    lowerMessage.includes('temporarily unavailable') ||
    lowerMessage.includes('overloaded');

  return { status, message: message || String(error), dailyQuota, transient };
}

async function withRetry<T>(fn: (modelName: string) => Promise<T>): Promise<T> {
  const deadline = Date.now() + MAX_REQUEST_TIME_MS;
  let lastError: unknown;
  const models = MODELS.length > 0 ? MODELS : DEFAULT_MODELS.split(',');

  for (const modelName of models) {
    const quotaUntil = dailyQuotaModels.get(modelName);
    if (quotaUntil && quotaUntil > Date.now()) continue;
    dailyQuotaModels.delete(modelName);

    let sameModelRetries = 0;
    while (Date.now() < deadline) {
      const remaining = deadline - Date.now();
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      try {
        const result = await Promise.race([
          fn(modelName),
          new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => reject(Object.assign(
              new Error('Gemini model fallback exceeded the 40-second time limit'),
              { statusCode: 503 }
            )), remaining);
          }),
        ]);
        logger.info({ model: modelName }, 'GEMINI_USED');
        return result;
      } catch (error: unknown) {
        lastError = error;
        const details = getErrorDetails(error);
        logger.error({ model: modelName, status: details.status, message: details.message }, 'GEMINI_ATTEMPT_FAILED');

        if (details.status === 429 || details.status === 503) {
          if (details.status === 429 && details.dailyQuota) {
            dailyQuotaModels.set(modelName, Date.now() + DAILY_QUOTA_COOLDOWN_MS);
          }
          break;
        }

        if (details.transient && sameModelRetries < MAX_SAME_MODEL_RETRIES) {
          sameModelRetries++;
          const delay = Math.min(RETRY_DELAY_MS, Math.max(0, deadline - Date.now()));
          if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        break;
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    }
  }

  const lastDetails = lastError ? getErrorDetails(lastError) : undefined;
  const statusCode = lastDetails?.status === 429 ? 429 : 503;
  const message = Date.now() >= deadline
    ? 'Gemini model fallback exceeded the 40-second time limit'
    : `Gemini request failed for all configured models${lastDetails ? `: ${lastDetails.message}` : ''}`;
  throw Object.assign(new Error(message), { statusCode });
}

export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const genAI = getClient();

  return withRetry(async (modelName) => {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt,
      generationConfig: {
        maxOutputTokens: options?.maxTokens || 4096,
        temperature: options?.temperature ?? 0.3,
      },
    });

    const result = await model.generateContent(userMessage);
    const text = result.response.text();

    if (!text) {
      throw new Error('No text response from Gemini');
    }

    return text;
  });
}

export async function callClaudeVision(
  systemPrompt: string,
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
  textPrompt?: string,
  options?: { maxTokens?: number }
): Promise<string> {
  const genAI = getClient();

  return withRetry(async (modelName) => {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt,
      generationConfig: {
        maxOutputTokens: options?.maxTokens || 4096,
        temperature: 0.2,
      },
    });

    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType: mediaType,
        },
      },
      ...(textPrompt ? [{ text: textPrompt }] : []),
    ]);

    const text = result.response.text();

    if (!text) {
      throw new Error('No text response from Gemini Vision');
    }

    return text;
  });
}

export function resetClient(): void {
  client = null;
}