
'use server';

/**
 * @fileOverview A Genkit flow for performing quality control on multiple survey questions.
 */

import { getAi } from '@/ai/genkit';
import { performQualityControl, QCInput, QCResult } from './perform-quality-control';
import { z } from 'genkit';

// Define the input schema for the bulk quality control flow
const BulkQCInputSchema = z.object({
  questions: z.array(QCInput),
});
export type BulkQCInput = z.infer<typeof BulkQCInputSchema>;

// Define the output schema for the bulk quality control flow
const BulkQCOutputSchema = z.record(z.string(), QCResult);
export type BulkQCOutput = z.infer<typeof BulkQCOutputSchema>;

/**
 * Performs quality control analysis on a batch of questions concurrently.
 * @param {BulkQCInput} input - The input containing an array of questions to analyze.
 * @returns {Promise<BulkQCOutput>} A promise that resolves to a record of QC results, with question IDs as keys.
 */
export const performBulkQualityControl = getAi().defineFlow(
  {
    name: 'performBulkQualityControl',
    inputSchema: BulkQCInputSchema,
    outputSchema: BulkQCOutputSchema,
  },
  async ({ questions }) => {
    const promises = questions.map(async (question) => {
      // Note: We are not running the `performQualityControl` flow directly,
      // but calling its underlying implementation to avoid nested flow tracing issues.
      const result = await performQualityControl(question);
      return { questionId: question.question, result };
    });

    const results = await Promise.all(promises);

    // Convert the array of results into a record for easier lookup
    const resultsByQuestionId = results.reduce<BulkQCOutput>((acc, { questionId, result }) => {
      acc[questionId] = result;
      return acc;
    }, {});

    return resultsByQuestionId;
  }
);
