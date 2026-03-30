
'use server';

/**
 * @fileOverview Generates high-level customer insights from survey data.
 *
 * - generateCustomerInsights - A function that analyzes survey questions and answers to produce a report.
 * - InsightsInput - The input type for the function.
 * - InsightsOutput - The return type for the function.
 */

import { getAi } from '@/ai/genkit';
import { z } from 'genkit';
import { AnalyzedQuestion } from '@/types';

// We can pass the full AnalyzedQuestion object, but zod needs a schema.
// For simplicity, we'll define a less strict schema here for the AI prompt.
const QuestionSummarySchema = z.object({
    question: z.string(),
    type: z.string(),
    rowCount: z.number(),
    // A simplified version of the data for the prompt
    dataSummary: z.string().describe("A summary of the answers, e.g., for multiple choice it's the options and counts, for numeric it's the average/min/max, for open-ended it's a few sample answers."),
});

const InsightsInputSchema = z.object({
  questions: z.array(QuestionSummarySchema).describe('An array of all the questions and their summarized data from the survey.'),
});
export type InsightsInput = z.infer<typeof InsightsInputSchema>;

const InsightItemSchema = z.object({
  title: z.string().describe("A short, descriptive title for the insight (e.g., 'Brand Preference Insights', 'Key Service Improvement Area')."),
  description: z.string().describe("A paragraph detailing the insight, explaining what was observed in the data and what it means."),
  basedOnQuestions: z.array(z.string()).describe("The specific question(s) this insight is derived from."),
});

const InsightsOutputSchema = z.object({
  overallSummary: z.string().describe("A high-level executive summary of the entire survey's findings. This should be a concise paragraph that captures the most important takeaways."),
  keyLearnings: z.array(InsightItemSchema).describe("A list of the most significant learnings from the survey. Focus on surprising or impactful findings."),
  recommendations: z.array(InsightItemSchema).describe("A list of strategic recommendations for the customer based on the survey data. What should they do next?"),
  actionableInsights: z.array(InsightItemSchema).describe("A list of specific, actionable insights that the customer can immediately use to make decisions or changes."),
});
export type InsightsOutput = z.infer<typeof InsightsOutputSchema>;


export async function generateCustomerInsights(input: InsightsInput): Promise<InsightsOutput> {
  const ai = getAi();
  const insightsPrompt = ai.definePrompt({
    name: 'customerInsightsPrompt',
    input: { schema: InsightsInputSchema },
    output: { schema: InsightsOutputSchema },
    prompt: `You are an expert market research analyst. Your task is to analyze a compiled summary of survey data and generate a strategic report for a client. The report should be easy to understand, insightful, and provide clear next steps.

The client needs to understand the key takeaways from their survey. Transform the raw data summaries into a compelling story about their customers and market.

**SURVEY DATA SUMMARY:**
{{#each questions}}
- **Question:** "{{question}}"
  - **Type:** {{type}}
  - **Response Count:** {{rowCount}}
  - **Data Summary:** {{dataSummary}}
{{/each}}

**YOUR TASK:**

Based *only* on the data provided above, generate a comprehensive report with the following sections:

1.  **Overall Summary:** Write a high-level executive summary (2-3 sentences) of the entire survey's findings. What is the single most important message the client should take away?

2.  **Key Learnings:** Identify 2-4 of the most significant and interesting learnings from the data. These should be the "aha!" moments. For each learning, provide a title and a description explaining the finding.

3.  **Recommendations:** Based on the key learnings, provide 2-3 strategic recommendations. What high-level actions should the client consider? For each recommendation, provide a title and a description.

4.  **Actionable Insights:** Provide 2-4 specific, tactical, and actionable insights. These should be concrete steps the client can take in the short term. For each insight, provide a title and a description.

Structure your entire response in the requested JSON format. Ensure that every insight, learning, and recommendation is directly tied to the provided survey data.
`,
  });

  const { output } = await insightsPrompt(input);
  return output!;
}
