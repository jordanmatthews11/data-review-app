
'use client';

import type { AnalyzedQuestion, CsvData, MultipleChoiceData, NumericData, OpenEndedData, PhotoGridData } from '@/types';
import { BarChartDisplay } from './charts/bar-chart-display';
import { HistogramDisplay } from './charts/histogram-display';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { BarChart2, Hash, MessageSquare, Camera, GalleryVertical, List, Video, Flag } from 'lucide-react';
import { PhotoGridDisplay } from './charts/photo-grid-display';
import { QCResultDisplay } from './qc-result-display';
import { PhotoGalleryModal } from './photo-gallery-modal';
import { Button } from './ui/button';
import { OpenEndedResponsesModal } from './open-ended-responses-modal';
import { OpenEndedFindings } from './open-ended-findings';
import { Badge } from './ui/badge';
import { NumericFilter } from './charts/numeric-filter';
import { ResponseListModal } from './response-list-modal';

interface QuestionCardProps {
  question: AnalyzedQuestion;
  fullCsvData: CsvData;
  userFlaggedResponses: string[];
  onToggleFlagged: (responseId: string) => void;
  onFlagResponses: (responseIds: string[]) => void;
  onAiFlags?: (questionId: string, reason: string, responseIds: string[]) => void;
  aiFlaggedResponses?: Record<string, { reason: string; ids: string[] }>;
  isAiReviewEnabled?: boolean;
}

const ICONS: Record<Exclude<AnalyzedQuestion['type'], 'unknown'>, React.ReactNode> = {
  'multiple-choice': <BarChart2 className="h-4 w-4 text-muted-foreground" />,
  numeric: <Hash className="h-4 w-4 text-muted-foreground" />,
  'open-ended': <MessageSquare className="h-4 w-4 text-muted-foreground" />,
  'photo-grid': <Camera className="h-4 w-4 text-muted-foreground" />,
  video: <Video className="h-4 w-4 text-muted-foreground" />,
};

const TYPE_LABELS: Record<Exclude<AnalyzedQuestion['type'], 'unknown'>, string> = {
  'multiple-choice': 'Multiple Choice',
  numeric: 'Numeric',
  'open-ended': 'Open-Ended',
  'photo-grid': 'Photo Grid',
  video: 'Video',
};

export function QuestionCard({ 
  question, 
  fullCsvData,
  userFlaggedResponses, 
  onToggleFlagged,
  onFlagResponses, 
  onAiFlags,
  aiFlaggedResponses,
  isAiReviewEnabled
}: QuestionCardProps) {
  
  const handleFlagOutliers = (filters: { min: number | null; max: number | null }) => {
    if (question.type !== 'numeric') return;
    
    const data = question.data as NumericData;
    const { min, max } = filters;
    
    // First, find all currently flagged responses for this question that were flagged by this mechanism
    const numericQuestionResponseIds = new Set(data.values.map(item => item.responseId));
    const currentNumericUserFlags = userFlaggedResponses.filter(id => numericQuestionResponseIds.has(id));

    const outlierIds = data.values.filter(item => {
      const value = item.value;
      if (min !== null && max !== null && (value < min || value > max)) return true;
      if (min !== null && max === null && value < min) return true;
      if (max !== null && min === null && value > max) return true;
      return false;
    }).map(item => item.responseId);
    
    const idsToFlag = new Set(outlierIds);
    const idsToUnflag = new Set(currentNumericUserFlags.filter(id => !idsToFlag.has(id)));

    // Flag new outliers
    const newFlags = Array.from(idsToFlag).filter(id => !userFlaggedResponses.includes(id));
    if (newFlags.length > 0) {
      onFlagResponses(newFlags);
    }

    // Unflag old outliers that are now within range
    idsToUnflag.forEach(id => onToggleFlagged(id));
  };

  const renderContent = () => {
    switch (question.type) {
      case 'multiple-choice':
        const mcData = question.data as MultipleChoiceData;
        const allMcResponses = mcData.options.flatMap(o => o.responses);
        return <BarChartDisplay 
                  data={mcData}
                  fullCsvData={fullCsvData}
                  aiFlaggedResponses={aiFlaggedResponses?.[question.id]?.ids} 
                  userFlaggedResponses={userFlaggedResponses}
                  onToggleFlagged={onToggleFlagged}
                  allResponses={allMcResponses}
                  question={question.question}
                />;
      case 'numeric':
        const numericData = question.data as NumericData;
        return (
          <div className="flex flex-col h-full">
            <NumericFilter 
              data={numericData}
              onFlagOutliers={handleFlagOutliers}
            />
            <div className="flex-grow mt-2">
              <HistogramDisplay data={numericData} />
            </div>
          </div>
        );
      case 'open-ended':
      case 'video':
         if (onAiFlags) {
           return <QCResultDisplay question={question} onAiFlags={onAiFlags} />;
         }
         return <OpenEndedFindings question={question} isAiReviewEnabled={isAiReviewEnabled} />;
      case 'photo-grid':
        return (
          <PhotoGridDisplay
            data={question.data as PhotoGridData}
            userFlaggedResponses={userFlaggedResponses}
            onToggleFlagged={onToggleFlagged}
          />
        );
      default:
        return <p className="text-muted-foreground text-sm">This question type is not supported.</p>;
    }
  };
  
  const renderFooter = () => {
    const flaggedIds = aiFlaggedResponses?.[question.id]?.ids || [];

    if (question.type === 'photo-grid') {
      const photoData = question.data as PhotoGridData;
      if (photoData.photos && photoData.photos.length > 0) {
        return (
          <CardFooter className="p-4 pt-0">
             <PhotoGalleryModal 
                photos={photoData.photos}
                userFlaggedResponses={userFlaggedResponses}
                onToggleFlagged={onToggleFlagged}
                analyzedQuestions={[question]}
                fullCsvData={fullCsvData}
              >
                <Button variant="outline" className="w-full">
                  <GalleryVertical className="mr-2 h-4 w-4" />
                  View All ({photoData.photos.length})
                </Button>
            </PhotoGalleryModal>
          </CardFooter>
        )
      }
    }
    if (question.type === 'open-ended' || question.type === 'video') {
      const openEndedData = question.data as OpenEndedData;
      if (openEndedData.answers && openEndedData.answers.length > 0) {
        return (
          <CardFooter className="p-4 pt-0">
            <OpenEndedResponsesModal 
              question={question.question}
              answers={openEndedData.answers}
              fullCsvData={fullCsvData}
              userFlaggedResponses={userFlaggedResponses}
              onToggleFlagged={onToggleFlagged}
              aiFlaggedResponses={flaggedIds}
            >
              <Button variant="outline" className="w-full relative">
                <List className="mr-2 h-4 w-4" />
                View All ({openEndedData.answers.length})
                {onAiFlags && flaggedIds.length > 0 && (
                   <Badge variant="destructive" className="absolute -top-2 -right-2 px-1.5 h-5 flex items-center">
                    <Flag className="h-3 w-3 mr-1" /> {flaggedIds.length}
                  </Badge>
                )}
              </Button>
            </OpenEndedResponsesModal>
          </CardFooter>
        )
      }
    }
    if (question.type === 'numeric') {
        const numericData = question.data as NumericData;
        const allNumericAnswers = numericData.values.map(v => ({ responseId: v.responseId, answer: String(v.value) }));
        return (
             <CardFooter className="p-4 pt-0">
                <OpenEndedResponsesModal 
                  question={question.question}
                  answers={allNumericAnswers}
                  fullCsvData={fullCsvData}
                  userFlaggedResponses={userFlaggedResponses}
                  onToggleFlagged={onToggleFlagged}
                  aiFlaggedResponses={flaggedIds}
                >
                  <Button variant="outline" className="w-full relative">
                    <List className="mr-2 h-4 w-4" />
                    View All ({numericData.values.length})
                    {onAiFlags && flaggedIds.length > 0 && (
                      <Badge variant="destructive" className="absolute -top-2 -right-2 px-1.5 h-5 flex items-center">
                        <Flag className="h-3 w-3 mr-1" /> {flaggedIds.length}
                      </Badge>
                    )}
                  </Button>
                </OpenEndedResponsesModal>
            </CardFooter>
        )
    }
    return null;
  }

  if (question.type === 'unknown') {
    return null;
  }

  const flaggedCount = aiFlaggedResponses?.[question.id]?.ids?.length ?? 0;

  return (
    <Card className="flex flex-col">
       <CardHeader className="p-4">
        <div className="flex justify-between items-start gap-3">
            <CardTitle className="text-base font-semibold leading-tight flex-1">{question.question}</CardTitle>
            <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
                {onAiFlags && flaggedCount > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <Flag className="h-3 w-3" /> {flaggedCount}
                  </Badge>
                )}
                {ICONS[question.type]}
            </div>
        </div>
        <CardDescription className="text-xs">{TYPE_LABELS[question.type]} &middot; {question.rowCount} responses</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow flex flex-col min-h-[12rem]">
        <div className='relative flex-1'>
         {renderContent()}
        </div>
      </CardContent>
      {renderFooter()}
    </Card>
  );
}
