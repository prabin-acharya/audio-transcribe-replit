import { createOpenAI as createGithubModels } from "@ai-sdk/openai";
import { streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const githubModel = createGithubModels({
    baseURL: "https://models.inference.ai.azure.com",
    apiKey: process.env.GITHUB_TOKEN,
  });

  const result = streamText({
    model: githubModel("gpt-4o"),
    messages,
  });

  return result.toDataStreamResponse();
}
