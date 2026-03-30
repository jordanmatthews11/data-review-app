
'use server';

/**
 * @fileOverview Performs quality control on a single question's data.
 *
 * - performQualityControl - A function that handles the quality control process.
 * - QCInput - The input type for the performQualityControl function.
 * - QCResult - The return type for the performQualityControl function.
 */

import { getAi } from '@/ai/genkit';
import { z } from 'genkit';

const AnswerSchema = z.object({
  responseId: z.string(),
  answer: z.string(),
});

// Input schema for the quality control flow
const QCInputSchema = z.object({
  question: z.string().describe('The survey question that was asked.'),
  answers: z.array(AnswerSchema).describe('A sample of answers with their corresponding Response Group IDs.'),
  questionType: z.enum(['multiple-choice', 'open-ended', 'numeric']).describe('The type of question being analyzed.'),
});
export type QCInput = z.infer<typeof QCInputSchema>;

// Output schema for the quality control result
const QCResultSchema = z.object({
  flagged: z.boolean().describe('Whether or not this question has any problematic responses.'),
  reason: z.string().describe('If flagged, a brief, one-sentence explanation of why. e.g., "Identified several responses that did not directly answer the question."'),
  responseGroupIds: z.array(z.string()).describe('An array of Response Group IDs for the answers that should be reviewed. Empty if not flagged.'),
});
export type QCResult = z.infer<typeof QCResultSchema>;

// The main flow function
export async function performQualityControl(input: QCInput): Promise<QCResult> {
    const ai = getAi();
    const { output } = await ai.generate({
        prompt: `You are an expert quality control analyst for a market research firm. Your primary task is to review survey responses for a single question and flag any that appear problematic, suspicious, or low-quality.

Your goal is to provide a list of "Response Group IDs" for any answers that a project manager should manually review.

Follow these steps for your analysis:
1.  **Understand the Question:** First, carefully read the survey question to understand its intent and what constitutes a valid answer.
2.  **Review Responses Critically:** Examine each provided answer and its ID.
3.  **Identify Problematic Responses:** Flag responses based on the following criteria:
    *   **Irrelevant or Off-Topic:** The answer does not address the question asked.
    *   **Gibberish or Nonsensical:** The answer consists of random characters, nonsense words, or is completely incoherent.
    *   **Low-Effort:** The answer is overly simplistic, vague, or lazy (e.g., "good", "idk", "none").
    *   **Contradictory:** The answer contradicts itself or common sense.
    *   **Statistical Outliers (for Numeric type):** The value is significantly different from the other responses.
    *   **Doesn't Answer the Question:** The response avoids answering the actual question (e.g., "I don't want to answer that").
4.  **Format the Output:** Based on your analysis, provide a JSON response. If you find any problematic answers, set "flagged" to true, provide a brief, one-sentence summary of the main issue you found, and list the corresponding "responseGroupIds" that should be reviewed. If you find no significant issues, set "flagged" to false and leave the other fields empty.

**Analysis Details:**
- **Question Asked:** "${input.question}"
- **Question Type:** ${input.questionType}
- **Sample of Answers to Review:**
${input.answers.map(a => `- Response ID: ${a.responseId}, Answer: "${a.answer}"`).join('\n')}
`,
        input: input,
        output: {
            schema: QCResultSchema,
        },
        model: 'googleai/gemini-2.0-flash',
    });
    return output!;
}
