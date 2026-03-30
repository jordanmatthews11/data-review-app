
'use client';

import { useEffect, useState } from 'react';
import { performQualityControl } from '@/ai/flows/perform-quality-control';
import type { QCResult, QCInput } from '@/ai/flows/perform-quality-control';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { Wand2, Flag, Check, Loader2 } from 'lucide-react';
import type { AnalyzedQuestion, OpenEndedData, NumericData, MultipleChoiceData, NumericValueWithResponse } from '@/types';

interface QCResultDisplayProps {
  question: AnalyzedQuestion;
  onAiFlags: (questionId: string, reason: string, responseIds: string[]) => void;
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-2">AI analysis in progress...</p>
    </div>
  );
}

export function QCResultDisplay({ question, onAiFlags }: QCResultDisplayProps) {
  const [qcResult, setQcResult] = useState<QCResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    const getQCResult = async () => {
      if (question.type === 'photo-grid' || question.type === 'unknown' || question.type === 'video') {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      let answers: { responseId: string; answer: string; }[] = [];
      if (question.type === 'open-ended') {
          answers = (question.data as OpenEndedData).answers.map(a => ({...a, answer: String(a.answer)}));
      } else if (question.type === 'numeric') {
          answers = (question.data as NumericData).values.map((item: NumericValueWithResponse) => ({ responseId: item.responseId, answer: String(item.value) }));
      } else if (question.type === 'multiple-choice') {
          const mcData = question.data as MultipleChoiceData;
          answers = mcData.options.flatMap(o => o.responses.map(r => ({ responseId: r.id, answer: r.value })));
      }
      
      if (answers.length === 0) {
        setIsLoading(false);
        return;
      }

      const input: QCInput = {
        question: question.question,
        answers: answers.slice(0, 50), // Limit to 50 answers for performance
        questionType: question.type as 'open-ended' | 'numeric' | 'multiple-choice',
      };

      try {
        const result = await performQualityControl(input);
        if (isMounted) {
          setQcResult(result);
          if (result.flagged) {
            onAiFlags(question.id, result.reason, result.responseGroupIds);
          }
        }
      } catch (error) {
        console.error('Failed to get AI QC analysis:', error);
        if (isMounted) {
          toast({
            variant: 'destructive',
            title: 'AI Analysis Failed',
            description: 'Could not perform quality control on this question.',
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    getQCResult();

    return () => {
      isMounted = false;
    };
  }, [question, toast, onAiFlags]);

  if (isLoading) {
    return <LoadingState />;
  }
  
  if (question.type === 'video' || question.type === 'photo-grid' || question.type === 'unknown') {
      return (
        <div className="text-sm text-muted-foreground h-full flex flex-col justify-between">
             <div className="text-xs text-center p-2 bg-secondary rounded-md">
                AI quality control is not run for this question type.
            </div>
        </div>
      );
  }

  if (!qcResult) return null;

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-start gap-3">
        <Wand2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
            <p className="font-semibold text-foreground">AI Review of Free Form Questions</p>
            <p className="text-muted-foreground">
              {qcResult.flagged 
                ? <span className='text-destructive-foreground font-medium bg-destructive/80 px-1.5 py-0.5 rounded-sm'>Flagged ({qcResult.responseGroupIds.length})</span>
                : <span className='text-green-800 font-medium bg-green-100 px-1.5 py-0.5 rounded-sm'>Passed</span>
              }
            </p>
        </div>
      </div>
      
      {qcResult.flagged && (
        <div className="flex items-start gap-3">
            <Flag className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
             <div>
                <p className="font-semibold text-foreground">Reason</p>
                <p className="text-muted-foreground">{qcResult.reason}</p>
            </div>
        </div>
      )}

      {!qcResult.flagged && (
         <div className="flex items-start gap-3">
            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
             <div>
                <p className="font-semibold text-foreground">Details</p>
                <p className="text-muted-foreground">No major quality control issues were identified.</p>
            </div>
        </div>
      )}

    </div>
  );
}
