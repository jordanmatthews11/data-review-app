
'use client';

import { useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Wand2, UserCheck, Download, Trash2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import type { AnalyzedQuestion, CsvData } from '@/types';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import Papa from 'papaparse';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Checkbox } from './ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface QCAnalysisProps {
  analyzedQuestions: AnalyzedQuestion[];
  fullCsvData: CsvData;
  userFlaggedResponses: string[];
  onClearUserFlags: () => void;
  aiFlaggedResponses: Record<string, { reason: string; ids: string[] }>;
  onClearAiFlags: () => void;
  ignoredAiFlags: string[];
  onToggleIgnoreAiFlag: (questionId: string) => void;
  isAiReviewEnabled: boolean;
}

export function QCAnalysis({ 
  analyzedQuestions, 
  fullCsvData, 
  userFlaggedResponses, 
  onClearUserFlags,
  aiFlaggedResponses,
  onClearAiFlags,
  ignoredAiFlags,
  onToggleIgnoreAiFlag,
  isAiReviewEnabled
}: QCAnalysisProps) {
  const [manualInclude, setManualInclude] = useState('');
  const [manualExclude, setManualExclude] = useState('');
  const { toast } = useToast();

  const allAiFlaggedIds = useMemo(() => {
    if (!isAiReviewEnabled) return [];
    return Array.from(new Set(
        Object.entries(aiFlaggedResponses)
            .filter(([questionId, _]) => !ignoredAiFlags.includes(questionId))
            .flatMap(([_, item]) => item.ids)
    ));
  }, [aiFlaggedResponses, ignoredAiFlags, isAiReviewEnabled]);

  const allFlaggedIds = useMemo(() => {
    const combinedIds = new Set([...userFlaggedResponses, ...allAiFlaggedIds]);
    
    const manuallyIncluded = manualInclude.split(/[\s,]+/).filter(id => id.trim() !== '');
    manuallyIncluded.forEach(id => combinedIds.add(id));

    const manuallyExcluded = new Set(manualExclude.split(/[\s,]+/).filter(id => id.trim() !== ''));
    
    const finalIds = new Set<string>();
    combinedIds.forEach(id => {
      if (!manuallyExcluded.has(id)) {
        finalIds.add(id);
      }
    });

    return Array.from(finalIds);
  }, [userFlaggedResponses, allAiFlaggedIds, manualInclude, manualExclude]);

  const fieldAgentUrl = useMemo(() => {
    if (allFlaggedIds.length === 0) return '#';
    const baseUrl = 'https://my.fieldagent.net/admin/fieldagent/responseSearch/';
    return `${baseUrl}?group_id=${allFlaggedIds.join(',')}`;
  }, [allFlaggedIds]);

  const handleExport = () => {
    const responseIdHeader = Object.keys(fullCsvData[0]).find(h => /Response Group ID/i.test(h)) || '__generated_row_id__';
    if (!fullCsvData[0][responseIdHeader]) {
        toast({ variant: 'destructive', title: 'Export Error', description: 'Cannot find a response ID column for export.' });
        return;
    }

    const dataToExport = fullCsvData
        .filter(row => allFlaggedIds.includes(row[responseIdHeader]))
        .map(row => {
            const responseId = row[responseIdHeader];
            const isUserFlagged = userFlaggedResponses.includes(responseId);
            const isAiFlagged = allAiFlaggedIds.includes(responseId);
            let reviewReason = '';
            if (isUserFlagged) reviewReason += 'User; ';
            if (isAiFlagged && isAiReviewEnabled) reviewReason += 'AI; ';

            return { ...row, 'Review Reason': reviewReason.trim().slice(0, -1) };
        });
    
    if (dataToExport.length === 0) {
        toast({ title: 'No Data to Export', description: 'There are no flagged responses to export.' });
        return;
    }

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'Flagged Response Groups to Review.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  const clearAllFlags = () => {
      onClearUserFlags();
      onClearAiFlags();
      setManualInclude('');
      setManualExclude('');
  }

  const hasAnyFlags = allFlaggedIds.length > 0;
  const hasUserFlags = userFlaggedResponses.length > 0;
  const hasAiFlags = Object.keys(aiFlaggedResponses).length > 0 && isAiReviewEnabled;
  
  if (!hasUserFlags && !hasAiFlags) {
      return null;
  }

  return (
    <Card className="bg-secondary/50 border-primary/20">
       <CardHeader className="flex flex-row items-start justify-between">
        <div>
            <CardTitle>Flagged Response Groups</CardTitle>
            <CardDescription>Total unique responses to review: {allFlaggedIds.length}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
             <Button onClick={clearAllFlags} size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" disabled={!hasAnyFlags && !hasUserFlags}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All Flags
            </Button>
            <Button asChild size="sm" variant="outline" disabled={!hasAnyFlags}>
                <a href={fieldAgentUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in Field Agent
                </a>
            </Button>
            <Button onClick={handleExport} disabled={!hasAnyFlags} size="sm" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Flagged Data
            </Button>
        </div>
      </CardHeader>
      <CardContent>
          
      {hasAiFlags && (
        <>
            <CardHeader className='pt-0 flex flex-row items-start justify-between'>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Wand2 className="h-5 w-5 text-primary" />
                    <span>AI Flagged ({allAiFlaggedIds.length})</span>
                </CardTitle>
                 <Button onClick={onClearAiFlags} size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear AI Flags
                </Button>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {Object.entries(aiFlaggedResponses).map(([question, { reason, ids }]) => (
                  <AccordionItem value={question} key={question}>
                    <AccordionTrigger className="text-sm hover:no-underline">
                      <div className="flex-1 text-left">
                        <p className="font-semibold">{question}</p>
                        <p className="text-xs text-muted-foreground font-normal">{reason}</p>
                      </div>
                      <span className="ml-4 text-xs font-mono bg-primary/10 text-primary-foreground/80 px-2 py-1 rounded-md">{ids.length} IDs</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id={`ignore-${question}`} 
                            checked={ignoredAiFlags.includes(question)}
                            onCheckedChange={() => onToggleIgnoreAiFlag(question)}
                            />
                          <Label htmlFor={`ignore-${question}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Ignore this AI flag
                          </Label>
                        </div>
                        <div className="p-2 bg-background rounded-md border text-sm max-h-24 overflow-y-auto">
                          <p className="font-mono">{ids.join(', ')}</p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
        </>
      )}

      {hasUserFlags && (
        <>
            {hasAiFlags && <Separator className="my-2 bg-primary/10" />}
            <CardHeader className='pt-4 flex flex-row items-start justify-between'>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <UserCheck className="h-5 w-5 text-primary" />
                    <span>User Flagged ({userFlaggedResponses.length})</span>
                </CardTitle>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear User Flags
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will clear all {userFlaggedResponses.length} of your manually flagged responses. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onClearUserFlags}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </CardHeader>
            <CardContent>
                <div className="p-2 bg-background rounded-md border text-sm max-h-24 overflow-y-auto">
                    <p className="font-mono">{[...userFlaggedResponses].sort().join(', ')}</p>
                </div>
            </CardContent>
        </>
      )}

      {(hasUserFlags || hasAiFlags) && <Separator className="my-2 bg-primary/10" />}

       <CardHeader className='pt-4'>
            <CardTitle className="flex items-center gap-2 text-lg">
                Manual Overrides
            </CardTitle>
        </CardHeader>
        <CardContent>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="manual-include">Manually Include IDs</Label>
                    <Textarea
                        id="manual-include"
                        placeholder="Enter comma or space-separated Response Group IDs to add them to the review list."
                        value={manualInclude}
                        onChange={(e) => setManualInclude(e.target.value)}
                        rows={3}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="manual-exclude">Manually Exclude IDs</Label>
                    <Textarea
                        id="manual-exclude"
                        placeholder="Enter comma or space-separated Response Group IDs to remove them from the review list."
                        value={manualExclude}
                        onChange={(e) => setManualExclude(e.target.value)}
                        rows={3}
                    />
                </div>
            </div>
        </CardContent>
    </CardContent>
    </Card>
  );
}
