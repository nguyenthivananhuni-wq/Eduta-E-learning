import "server-only";
import Anthropic from "@anthropic-ai/sdk";

let cached: Anthropic | null | undefined;

/**
 * Anthropic SDK singleton.
 * Returns `null` when `ANTHROPIC_API_KEY` is not configured — callers should
 * fall back to rule-based recommendations in that case.
 */
export function getAnthropic(): Anthropic | null {
  if (cached !== undefined) return cached;
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) {
    cached = null;
    return null;
  }
  cached = new Anthropic({ apiKey: key });
  return cached;
}

export const CLAUDE_MODEL = "claude-haiku-4-5-20251001";
