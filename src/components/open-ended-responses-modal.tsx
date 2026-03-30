
'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Search, Flag } from 'lucide-react';
import { Separator } from './ui/separator';
import type { CsvData, OpenEndedAnswer } from '@/types';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { AGENT_ID_REGEX, RESPONSE_ID_COLUMN_REGEX } from '@/lib/csv-analysis';

interface OpenEndedResponsesModalProps {
  question: string;
  answers: OpenEndedAnswer[];
  fullCsvData: CsvData;
  children: React.ReactNode;
  userFlaggedResponses: string[];
  onToggleFlagged: (responseId: string) => void;
  aiFlaggedResponses?: string[];
}

const isVideoUrl = (text: string) => {
    if (!text) return false;
    const lowercasedText = text.toLowerCase();
    return lowercasedText.startsWith('http') && (lowercasedText.endsWith('.mp4') || lowercasedText.endsWith('.mov'));
}

export function OpenEndedResponsesModal({ 
  question, 
  answers, 
  fullCsvData,
  children, 
  userFlaggedResponses, 
  onToggleFlagged, 
  aiFlaggedResponses = [] 
}: OpenEndedResponsesModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const responseIdToRowMap = useMemo(() => {
    if (!fullCsvData || fullCsvData.length === 0) {
      return new Map();
    }
    const headers = Object.keys(fullCsvData[0] || {});
    const responseIdHeader = headers.find(h => RESPONSE_ID_COLUMN_REGEX.test(h));
    if (!responseIdHeader) return new Map();
    return new Map(fullCsvData.map(row => [row[responseIdHeader], row]));
  }, [fullCsvData]);

  const filteredAnswers = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    return answers.filter(item => {
      if (!searchTerm) return true;
      const row = responseIdToRowMap.get(item.responseId);
      const agentId = row ? Object.entries(row).find(([key]) => AGENT_ID_REGEX.test(key))?.[1] : '';
      return item.answer.toLowerCase().includes(lowercasedFilter) || agentId?.toLowerCase().includes(lowercasedFilter);
    });
  }, [answers, searchTerm, responseIdToRowMap]);

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{question}</DialogTitle>
        </DialogHeader>
        <div className="relative flex-grow-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder={`Search ${answers.length} responses...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
            />
        </div>
        <p className="text-sm text-muted-foreground -mt-2">
            Showing {filteredAnswers.length} of {answers.length} responses.
        </p>
        <div className="flex-grow min-h-0">
            <ScrollArea className="h-full pr-6">
                <div className="flex flex-col gap-3">
                    {filteredAnswers.map((item, index) => {
                       const isAiFlagged = aiFlaggedResponses.includes(item.responseId);
                       const row = responseIdToRowMap.get(item.responseId);
                       const agentId = row ? Object.entries(row).find(([key]) => AGENT_ID_REGEX.test(key))?.[1] : null;

                       return (
                        <div key={item.responseId + index} className={cn("rounded-md p-2", isAiFlagged && "bg-destructive/10 border border-destructive/20")}>
                           <div className="flex items-start gap-4">
                                {isVideoUrl(item.answer) ? (
                                    <a
                                        href={item.answer}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm flex-1 text-primary hover:underline"
                                    >
                                        {item.answer}
                                    </a>
                                ) : (
                                    <p className="text-sm flex-1">{item.answer}</p>
                                )}
                                <div className="flex items-center gap-2 pt-1">
                                    <Checkbox
                                        id={`flag-${item.responseId}-openended`}
                                        checked={userFlaggedResponses.includes(item.responseId)}
                                        onCheckedChange={() => onToggleFlagged(item.responseId)}
                                    />
                                    <Label htmlFor={`flag-${item.responseId}-openended`} className="text-xs text-muted-foreground font-normal whitespace-nowrap">Flag</Label>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className='flex items-center gap-2'>
                                  <p className="text-muted-foreground font-mono text-[10px] mt-1">RID: {item.responseId}</p>
                                  {agentId && <p className="text-muted-foreground font-mono text-[10px] mt-1">Agent: {agentId}</p>}
                                </div>
                              {isAiFlagged && (
                                <Badge variant="destructive" className="gap-1 text-xs">
                                  <Flag className="h-3 w-3" />
                                  AI Flagged
                                </Badge>
                              )}
                            </div>
                            {index < filteredAnswers.length - 1 && <Separator className="mt-3 bg-border/50" />}
                        </div>
                    )})}
                </div>
            </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
