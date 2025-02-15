// app/api/summarize/route.ts
import { createOpenAI as createGithubModels } from "@ai-sdk/openai";
import { generateText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log("----------------------++++++++++==++++");

  const { transcript } = await req.json();

  const prompt = `
You are an expert in understanding and summarizing mixed Hebrew and English transcriptions.
The following is a transcription of an audio recording that may contain both Hebrew and English,
with possible transcription errors. Please:

1. Read and understand the context of the conversation
2. Identify any unclear or mistranscribed Hebrew words and make appropriate corrections based on context
3. Provide a coherent summary in the same language mix as the original
4. Maintain the original meaning while fixing any obvious transcription errors
5. Format properly. Use appropriate punctuation and line breaks as needed.
Here is the full transcription:

${transcript}

Please provide a clear and accurate summary, maintaining the same language mix as the original.Write only the summary nothing else.
Summary:
`;

  try {
    const githubModel = createGithubModels({
      baseURL: "https://models.inference.ai.azure.com",
      apiKey: process.env.GITHUB_TOKEN,
    });

    const result = await generateText({
      model: githubModel("gpt-4o"),
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant specialized in understanding and summarizing mixed Hebrew-English content, with expertise in fixing common transcription errors in both languages.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7, // Slightly higher temperature for more natural language
    });

    const summary = result.text;
    console.log(summary, "##");

    return Response.json({ summary });
  } catch (error) {
    console.error("Error generating summary:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate summary" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
