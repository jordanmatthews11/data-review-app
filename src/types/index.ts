import { z } from 'genkit';

export type QuestionType = 'multiple-choice' | 'open-ended' | 'numeric' | 'photo-grid' | 'video' | 'unknown';

export interface QCResult {
  flagged: boolean;
  reason: string;
  responseGroupIds: string[];
}

export interface OptionWithResponses {
  name: string;
  count: number;
  responses: { id: string, value: string }[];
}

export interface MultipleChoiceData {
  options: OptionWithResponses[];
}

export interface NumericValueWithResponse {
    value: number;
    responseId: string;
}

export interface NumericData {
  values: NumericValueWithResponse[];
}

export interface OpenEndedAnswer {
  answer: string;
  responseId: string;
}

export interface OpenEndedData {
  answers: OpenEndedAnswer[];
}

const AnswerSchema = z.object({
  responseId: z.string(),
  answer: z.string(),
});

export const OpenEndedSummaryInputSchema = z.object({
  question: z.string().describe('The survey question that was asked.'),
  answers: z.array(AnswerSchema).describe('A sample of answers to be analyzed.'),
});
export type OpenEndedSummaryInput = z.infer<typeof OpenEndedSummaryInputSchema>;

export const OpenEndedSummaryOutputSchema = z.object({
  findings: z.array(z.string()).describe("A list of 1 to 3 key findings or themes discovered in the open-ended responses. Each finding should be a concise sentence."),
});
export type OpenEndedSummaryOutput = z.infer<typeof OpenEndedSummaryOutputSchema>;


export interface PhotoInfo {
    url: string;
    question: string; // Added to know which question this photo belongs to
    responseId?: string;
    storeName?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    agentId?: string;
}

export interface ParsedLink {
  url: string;
  label?: string;
}

export interface PhotoGridData {
    photos: PhotoInfo[];
}

/** One spreadsheet row with all photo URLs from photo columns, in column order. */
export interface ShelfRow {
    rowIndex: number;
    responseId: string;
    photos: PhotoInfo[];
    jobName?: string;
    locationLabel?: string;
    agentLabel?: string;
}

export interface CoordinateData extends Record<string, any> {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
}

export type QuestionData = MultipleChoiceData | NumericData | OpenEndedData | PhotoGridData;

export type AnalyzedQuestion = {
  id: string;
  question: string;
  type: QuestionType;
  data: QuestionData;
  rowCount: number;
  qcResult?: QCResult;
};

export type CsvData = Record<string, string>[];
