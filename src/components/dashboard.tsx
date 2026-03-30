
'use client';

import { useMemo } from 'react';
import type { AnalyzedQuestion, CsvData, PhotoGridData } from '@/types';
import { QuestionCard } from './question-card';
import { Button } from './ui/button';
import { FileText, RefreshCw, GalleryVertical, GalleryHorizontal, LayoutGrid, Map, Wand2, ChevronDown, Loader2 } from 'lucide-react';
import { QCAnalysis } from './qc-analysis';
import { PhotoGalleryModal } from './photo-gallery-modal';
import { ShelfViewModal } from './shelf-view-modal';
import { MassShelfViewModal } from './mass-shelf-view-modal';
import { MapViewModal } from './map-view-modal';
import { buildShelfRowsFromCsv } from '@/lib/csv-analysis';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DashboardProps {
  data: AnalyzedQuestion[];
  fileName: string;
  onReset: () => void;
  fullCsvData: Record<string, string>[];
  userFlaggedResponses: string[];
  onToggleFlagged: (responseId: string) => void;
  onFlagResponses: (responseIds: string[]) => void;
  onClearUserFlags: () => void;
  aiFlaggedResponses: Record<string, { reason: string; ids: string[] }>;
  onAiFlags?: (questionId: string, reason: string, responseIds: string[]) => void;
  onClearAiFlags: () => void;
  ignoredAiFlags: string[];
  onToggleIgnoreAiFlag: (questionId: string) => void;
  isAiReviewEnabled: boolean;
  onToggleAiReview: (enabled: boolean) => void;
  availableStatuses: string[];
  filterByStatus: string[];
  onStatusFilterChange: (status: string) => void;
  isProcessing: boolean;
}

const statusMap: Record<string, string> = {
  "N": "New",
  "S": "Still Loading",
  "X": "Denied",
  "A": "Approved",
  "P": "Pay/Hidden",
};

const getStatusLabel = (status: string) => statusMap[status] || status;

export function Dashboard({ 
  data, 
  fileName, 
  onReset, 
  fullCsvData, 
  userFlaggedResponses, 
  onToggleFlagged,
  onFlagResponses, 
  onClearUserFlags,
  aiFlaggedResponses,
  onAiFlags,
  onClearAiFlags,
  ignoredAiFlags,
  onToggleIgnoreAiFlag,
  isAiReviewEnabled,
  onToggleAiReview,
  availableStatuses,
  filterByStatus,
  onStatusFilterChange,
  isProcessing
}: DashboardProps) {

  const allPhotos = useMemo(() => {
    return data
      .filter(q => q.type === 'photo-grid')
      .flatMap(q => {
        const photoData = q.data as PhotoGridData;
        return (photoData.photos || []).map(photo => ({
          ...photo,
          question: q.question, // Ensure question is attached
        }));
      });
  }, [data]);

  const shelfRows = useMemo(() => buildShelfRowsFromCsv(fullCsvData), [fullCsvData]);
  
  const getSelectedStatusLabel = () => {
    if (filterByStatus.length === 0) return "All Statuses";
    if (filterByStatus.length === 1) return getStatusLabel(filterByStatus[0]);
    return `${filterByStatus.length} statuses selected`;
  };

  return (
    <div className="w-full animate-in fade-in-50 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{fileName}</span>
             {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          <h1 className="text-3xl font-bold text-foreground mt-1">
            Data Review Dashboard
          </h1>
          <p className="text-muted-foreground">
            Found {data.length} questions to analyze from {fullCsvData.length} responses.
          </p>
        </div>
        <div className="flex items-center gap-4">
            {availableStatuses.length > 0 && (
              <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Filter by Status</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-[180px] justify-between">
                        <span className='truncate'>
                          {getSelectedStatusLabel()}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[180px]">
                      <DropdownMenuLabel>Statuses</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {availableStatuses.map((status) => (
                        <DropdownMenuCheckboxItem
                          key={status}
                          checked={filterByStatus.includes(status)}
                          onCheckedChange={() => onStatusFilterChange(status)}
                          onSelect={(e) => e.preventDefault()}
                        >
                          {getStatusLabel(status)}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
              </div>
            )}
            <div className="flex items-center space-x-2 self-end">
              <Switch 
                id="ai-review-toggle" 
                checked={isAiReviewEnabled}
                onCheckedChange={onToggleAiReview}
              />
              <Label htmlFor="ai-review-toggle" className="flex items-center gap-2 text-xs font-medium text-foreground w-[120px]">
                <Wand2 className="h-4 w-4" />
                AI Review of Free Form Questions
              </Label>
            </div>

            <MapViewModal data={fullCsvData}>
              <Button variant="outline" className='self-end'>
                <Map className="mr-2 h-4 w-4" />
                Map View
              </Button>
            </MapViewModal>
            {shelfRows.length > 0 && (
              <>
                <ShelfViewModal
                  rows={shelfRows}
                  userFlaggedResponses={userFlaggedResponses}
                  onToggleFlagged={onToggleFlagged}
                >
                  <Button variant="outline" className="self-end max-w-[220px] sm:max-w-none">
                    <GalleryHorizontal className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">
                      Shelf View - 1 response per ({shelfRows.length})
                    </span>
                  </Button>
                </ShelfViewModal>
                <MassShelfViewModal
                  rows={shelfRows}
                  userFlaggedResponses={userFlaggedResponses}
                  onToggleFlagged={onToggleFlagged}
                >
                  <Button variant="outline" className="self-end max-w-[220px] sm:max-w-none">
                    <LayoutGrid className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">
                      Mass Shelf View ({shelfRows.length})
                    </span>
                  </Button>
                </MassShelfViewModal>
              </>
            )}
            {allPhotos.length > 0 && (
              <PhotoGalleryModal
                photos={allPhotos}
                userFlaggedResponses={userFlaggedResponses}
                onToggleFlagged={onToggleFlagged}
                analyzedQuestions={data}
                fullCsvData={fullCsvData}
              >
                <Button variant="outline" className='self-end'>
                  <GalleryVertical className="mr-2 h-4 w-4" />
                  View All Photos ({allPhotos.length})
                </Button>
              </PhotoGalleryModal>
            )}
            <Button onClick={onReset} variant="outline" className='self-end'>
                <RefreshCw className="mr-2 h-4 w-4" />
                Upload New File
            </Button>
        </div>
      </div>
      
      <QCAnalysis 
        analyzedQuestions={data} 
        fullCsvData={fullCsvData} 
        userFlaggedResponses={userFlaggedResponses}
        onClearUserFlags={onClearUserFlags}
        aiFlaggedResponses={aiFlaggedResponses}
        onClearAiFlags={onClearAiFlags}
        ignoredAiFlags={ignoredAiFlags}
        onToggleIgnoreAiFlag={onToggleIgnoreAiFlag}
        isAiReviewEnabled={isAiReviewEnabled}
      />

      {data.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 mt-6">
          {data.map((question, index) => (
            <QuestionCard 
              key={question.id + index} 
              question={question}
              fullCsvData={fullCsvData}
              userFlaggedResponses={userFlaggedResponses}
              onToggleFlagged={onToggleFlagged}
              onFlagResponses={onFlagResponses}
              onAiFlags={onAiFlags}
              aiFlaggedResponses={aiFlaggedResponses}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed rounded-lg">
          <h2 className="text-xl font-medium">No Questions Found</h2>
          <p className="text-muted-foreground mt-2">No data matches the current filters, or we couldn't find any columns matching the question format (e.g., 'Q1:').</p>
          <Button onClick={onReset} className="mt-4">Upload a different file</Button>
        </div>
      )}
    </div>
  );
}
