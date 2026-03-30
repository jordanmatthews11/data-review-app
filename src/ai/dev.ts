import { config } from 'dotenv';
config();

import '@/ai/flows/perform-bulk-quality-control.ts';
import '@/ai/flows/generate-customer-insights.ts';
import '@/ai/flows/summarize-open-ended.ts';
