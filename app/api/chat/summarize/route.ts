import { createOpenAI as createGithubModels } from "@ai-sdk/openai";

import { generateObject } from "ai";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log("----------------------++++++++++++++");

  const { transcript } = await req.json();

  const systemPrompt = `
You are proficient in English and Hebrew language. You will be provided with a transcript of a lecture which will be in a mix of Hebrew and English. Summarize the transcript into a cohesive, lecture-style summary that mirrors the natural flow of a Torah class. The goal is for readers to feel as if they are following the logical and narrative flow of the lecture, similar to a university lecture format—starting with a central question, moving through background information, stories, proofs, and ending with key learnings.

The end result should be a summary that feels like a mini-lecture, guiding the reader through the flow of questions, answers, stories, proofs, and final reflections—mirroring the experience of attending the lecture.
Ensure that the summary adopts an engaging, conversational tone that mirrors the flow of a live lecture. The writing should guide the reader through the ideas naturally, making them feel like they're part of the class discussion—rather than reading a dry or technical textbook.


## Desired Summary Structure & Flow:
  1. Introduction & Central Question:
      - Start the summary with the main question or issue the lecturer posed.
      - Example: "Why does the Torah highlight Yitro’s past as a priest, even though it’s halachically forbidden to remind a convert of their origins?"
  2. Background Knowledge:
    - Include brief context or historical background provided in the lecture to frame the discussion.
    - Example: "The Torah discusses Yitro’s journey to join the Jewish people and his role as Moshe’s father-in-law."
  3. Development (Stories, Proofs, and Insights):
    - Follow the lecture’s flow by introducing stories, halachic proofs, and anecdotes in the order they were presented.
    - Ensure smooth transitions between different ideas to maintain a cohesive narrative.
    - Example:
        - "To explore this further, the speaker shared a story of a rabbi who..."
        - "Halachically, it’s noted that reminding a convert of their past is prohibited, yet the Torah highlights Yitro’s background for a deeper reason."
  4. Modern Relevance & Reflections:
    - Include any modern applications or relevant societal commentary the lecturer makes.
    - Example: "The speaker drew a parallel to modern challenges, highlighting the rise of anti-Semitism and urging the community to strengthen ties with Israel."
  5. Key Learnings & Conclusion:
    - End the summary with concise takeaways that capture the essence of the lecture.
      Example:
        - "The main lesson is clear: no matter one’s past, growth and redemption are always possible."

## Key Writing Style Elements to Mimic:
  1. Conversational & Engaging Tone:
      - Use natural, flowing language that feels like a dialogue between the speaker and the audience.
        Example:
        "Why does the Torah highlight Yitro’s past as a priest, even though it’s halachically forbidden to remind a convert of their origins?"
        "To explore this further, the speaker shared a story of a rabbi who..."
  2. Use of Questions to Drive Engagement:
      - Incorporate questions posed in the lecture to pull the reader in and mimic the lecturer’s teaching style.
        Example:
        "But this raises an important question—how can the Torah contradict its own halacha?"
        "Have you ever wondered why certain biblical figures are described in specific ways?"
  3. Smooth Transitions Between Ideas:
      - Use transitional phrases to maintain a cohesive flow between sections (questions, stories, proofs, and lessons).
        Example Phrases:
          "To dive deeper into this idea…", "This leads us to another important point…", "The speaker didn’t stop there—he continued with a personal story that illustrates this."
  4. Storytelling Elements:
      - When summarizing stories or anecdotes, preserve the narrative feel.
        Example:
          "The speaker shared an anecdote about a rabbi who faced a difficult moment when asked to recount his conversion. The audience could sense the discomfort, highlighting the delicate nature of discussing someone’s past."
  5. Reflections and Emotional Insights:
      - Include emotional or reflective moments that give the reader a deeper connection to the content.
        Example:
          "The takeaway is powerful—no one is beyond redemption, no matter their past. It's a message that resonates deeply, especially in today’s world."
  6. Avoid Textbook-Like Summarization:
      - No bullet lists or overly formal paragraphs that feel detached.
      - The writing should flow naturally, inviting the reader to think and reflect, as if they were present in the class.

    `;

  const prompt = `
    Full Transcript:
    ${transcript}
    `;

  try {
    const githubModel = createGithubModels({
      baseURL: "https://models.inference.ai.azure.com",
      apiKey: process.env.GITHUB_TOKEN,
    });

    const result = await generateObject({
      model: githubModel("gpt-4o"),
      schema: z.object({
        summary: z.string(),
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

//   1. SUMMARY:
// - Write 6-8 short paragraphs
// - Use English as the main language
// - Keep Hebrew terms/quotes when they are important
// - Cover all major topics from the transcript
// - Be concise but comprehensive
// - When using Hebrew words, provide the English term first, followed by the Hebrew in brackets

// 2. SENTIMENT:
// - Describe the overall tone in 1-3 words
// - Focus on these aspects:
//   * Emotional tone (e.g., serious, joyful, inspirational)
//   * Teaching style (e.g., scholarly, conversational)
//   * Purpose (e.g., educational, historical, halachic)

// 3. KEY TAKEAWAYS:
// - List 3-5 main points
// - Each point should be one clear, complete sentence
// - Focus on the most important lessons or insights
// - Include any crucial Hebrew concepts or terms
// - When using Hebrew words, provide the English term first, followed by the Hebrew in brackets
