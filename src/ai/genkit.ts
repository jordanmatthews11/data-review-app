import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// NOTE:
// Next.js will import server modules during SSR to build the render tree.
// `genkit` (and its storage dependencies) can have side effects that expect a
// working `localStorage` polyfill, so we avoid importing `genkit` at module
// load time. Instead, we `require()` it only when `getAi()` is actually
// called.
let aiInstance: any | null = null;

export function getAi() {
  if (!aiInstance) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { genkit } = require('genkit') as typeof import('genkit');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { googleAI } = require('@genkit-ai/googleai') as typeof import('@genkit-ai/googleai');

    aiInstance = genkit({
      plugins: [googleAI()],
      model: 'googleai/gemini-2.0-flash',
    });
  }

  return aiInstance;
}
