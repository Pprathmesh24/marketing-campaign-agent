import Anthropic from "@anthropic-ai/sdk";

// Swap this one line to change the model across the entire app.
export const MODEL_ID = "claude-sonnet-4-6";

// Instantiated once at module load; safe in Next.js server components and route handlers.
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
