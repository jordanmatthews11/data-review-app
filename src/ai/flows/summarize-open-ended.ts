
'use server';

/**
 * @fileOverview Summarizes open-ended survey responses into key findings.
 *
 * - summarizeOpenEnded - A function that generates 1-3 key findings from a list of answers.
 */

import { getAi } from '@/ai/genkit';
import { OpenEndedSummaryInput, OpenEndedSummaryInputSchema, OpenEndedSummaryOutput, OpenEndedSummaryOutputSchema } from '@/types';


export async function summarizeOpenEnded(input: OpenEndedSummaryInput): Promise<OpenEndedSummaryOutput> {
  const ai = getAi();
  const summaryPrompt = ai.definePrompt({
    name: 'summarizeOpenEndedPrompt',
    input: { schema: OpenEndedSummaryInputSchema },
    output: { schema: OpenEndedSummaryOutputSchema },
    prompt: `You are a market research analyst. Your task is to analyze a set of open-ended survey responses for a single question and identify the key themes or findings.

**Question:**
"{{question}}"

**Responses:**
{{#each answers}}
- "{{answer}}"
{{/each}}

Based on the responses provided, generate a list of 1 to 3 distinct findings. Each finding should be a single, concise sentence that summarizes a key theme or a common point from the answers. Focus on the most important takeaways.

Example Output:
{
  "findings": [
    "Many customers feel the pricing is too high compared to competitors.",
    "Users frequently mention a desire for a dark mode feature.",
    "A recurring theme is the positive feedback on customer service."
  ]
}
`,
  });

  const { output } = await summaryPrompt(input);
  return output!;
}
