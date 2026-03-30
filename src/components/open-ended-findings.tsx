
'use client';

import { useEffect, useState } from 'react';
import { summarizeOpenEnded } from '@/ai/flows/summarize-open-ended';
import type { AnalyzedQuestion, OpenEndedData, OpenEndedSummaryInput, OpenEndedSummaryOutput } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lightbulb, Wand2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface OpenEndedFindingsProps {
  question: AnalyzedQuestion;
  isAiReviewEnabled?: boolean;
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-2">AI is generating findings...</p>
    </div>
  );
}

export function OpenEndedFindings({ question, isAiReviewEnabled }: OpenEndedFindingsProps) {
  const [summary, setSummary] = useState<OpenEndedSummaryOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    
    if (!isAiReviewEnabled) {
        setSummary(null);
        setIsLoading(false);
        return;
    }

    const getSummary = async () => {
      if (question.type !== 'open-ended' && question.type !== 'video') {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      const answers = (question.data as OpenEndedData).answers;
      
      const input: OpenEndedSummaryInput = {
        question: question.question,
        answers: answers.slice(0, 50), // Limit to 50 answers for performance
      };

      try {
        const result = await summarizeOpenEnded(input);
        if (isMounted) {
          setSummary(result);
        }
      } catch (error) {
        console.error('Failed to get AI summary:', error);
        if (isMounted) {
          toast({
            variant: 'destructive',
            title: 'AI Findings Failed',
            description: 'Could not generate findings for this question.',
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    getSummary();

    return () => {
      isMounted = false;
    };
  }, [question, isAiReviewEnabled, toast]);

  if (!isAiReviewEnabled) {
      return (
        <div className="flex items-center justify-center h-full">
            <Alert variant="default" className="text-center bg-secondary/50">
                <Wand2 className="h-4 w-4" />
                <AlertTitle>AI Analysis Disabled</AlertTitle>
                <AlertDescription>
                   Enable AI Analysis to generate key findings.
                </AlertDescription>
            </Alert>
        </div>
      )
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (!summary || summary.findings.length === 0) {
    return (
      <div className="text-sm text-muted-foreground h-full flex items-center justify-center">
        No significant findings were generated from the responses.
      </div>
    );
  }

  return (
    <div className="text-sm h-full flex flex-col justify-center">
        <div className="space-y-3">
            <p className='font-medium text-foreground flex items-center gap-2'>
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Key Findings
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-muted-foreground">
                {summary.findings.map((finding, index) => (
                    <li key={index}>
                        {finding}
                    </li>
                ))}
            </ul>
        </div>
    </div>
  );
}
