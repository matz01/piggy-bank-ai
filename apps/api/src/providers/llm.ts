import { createOpenAI } from '@ai-sdk/openai';

const github = createOpenAI({
  baseURL: 'https://models.github.ai/inference',
  apiKey: process.env.GITHUB_TOKEN,
});

export const defaultModel = github('openai/gpt-4o-mini');
