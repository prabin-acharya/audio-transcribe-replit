import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log("----------------------++++++++++++++");

  const { transcript } = await req.json();

  //   const prompt = `
  // You are a skilled language assistant specializing in Hebrew and English transcription analysis. Your task is to process and improve an auto-generated bilingual transcript.  Since it is an auto-generated transcript there might be some transcription errors in the Hebrew words.
  //   Your task is to read and understand the context of the conversation, identify any unclear or mistranscribed Hebrew words and make appropriate corrections based on context.
  //   You will then provide a coherent summary in the same language mix as the original. You will maintain the original meaning while fixing any obvious transcription errors and format properly. Use appropriate punctuation and line breaks as needed. Try to write the Hebrew words in Hebrew inside bracket if appropriate.
  //   Summarize the transcript carefully and accurately and keep it coherent. Preserve the core meaning and context. Primarily it should be in English, but use Hebrew words where necessary. Dont mention the transcript itself in the summary.

  // Here is the full transcript to process(if there is no transcript, write a short message saying that there is no transcript):
  // ${transcript}

  // Please provide only the summary, with no additional commentary or explanations. It should be failry detailed with about 6-8 paragraphs. And write in plain text.
  // Summary:
  // `;

  const systemPrompt = `
  Read and analyze the given transcript carefully and thoroughly. Take time to understand all nuances, context, and content before providing a structured analysis with these three parts:

  1. SUMMARY:
- Write 6-8 short paragraphs
- Use English as the main language
- Keep Hebrew terms/quotes when they are important
- Cover all major topics from the transcript
- Be concise but comprehensive

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

    // const summary = result.text;
    // console.log(summary, "##");

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
