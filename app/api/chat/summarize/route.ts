import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log("----------------------++++++++++++++");

  const { transcript } = await req.json();

  const systemPrompt = `
  Read and analyze the given transcript carefully and thoroughly. Take time to understand all nuances, context, and content before providing a structured analysis with these three parts:

  1. SUMMARY:
- Write 6-8 short paragraphs
- Use English as the main language
- Keep Hebrew terms/quotes when they are important
- Cover all major topics from the transcript
- Be concise but comprehensive
- When using Hebrew words, provide the English term first, followed by the Hebrew in brackets

2. SENTIMENT:
- Describe the overall tone in 1-3 words
- Focus on these aspects:
  * Emotional tone (e.g., serious, joyful, inspirational)
  * Teaching style (e.g., scholarly, conversational)
  * Purpose (e.g., educational, historical, halachic)

3. KEY TAKEAWAYS:
- List 3-5 main points
- Each point should be one clear, complete sentence
- Focus on the most important lessons or insights
- Include any crucial Hebrew concepts or terms
- When using Hebrew words, provide the English term first, followed by the Hebrew in brackets
  `;

  const prompt = `
    Full Transcript:
    ${transcript}
    `;

  try {
    // const githubModel = createGithubModels({
    //   baseURL: "https://models.inference.ai.azure.com",
    //   apiKey: process.env.GITHUB_TOKEN,
    // });

    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: z.object({
        summary: z.string(),
        sentiment: z.string(),
        takeaways: z.array(z.string()),
      }),
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^");
    console.log(result.object);

    return Response.json({ summary: result.object });
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
