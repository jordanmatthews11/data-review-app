
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
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { CsvData, OptionWithResponses } from '@/types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { AGENT_ID_REGEX, RESPONSE_ID_COLUMN_REGEX } from '@/lib/csv-analysis';

interface ResponseListModalProps {
  option?: OptionWithResponses;
  allResponses?: {id: string, value: string}[];
  question?: string;
  fullCsvData: CsvData;
  children: React.ReactNode;
  userFlaggedResponses: string[];
  onToggleFlagged: (responseId: string) => void;
  aiFlaggedResponses: string[];
}

export function ResponseListModal({
  option,
  allResponses,
  question,
  fullCsvData,
  children,
  userFlaggedResponses,
  onToggleFlagged,
  aiFlaggedResponses,
}: ResponseListModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const responseIdToRowMap = useMemo(() => {
    if (!fullCsvData || fullCsvData.length === 0) {
        return new Map();
    }
    const headers = Object.keys(fullCsvData[0] || {});
    const responseIdHeader = headers.find(h => RESPONSE_ID_COLUMN_REGEX.test(h));
    if (!responseIdHeader) return new Map();
    return new Map(fullCsvData.map(row => [row[responseIdHeader], row]));
  }, [fullCsvData]);

  const responses = useMemo(() => {
    if (allResponses) return allResponses.map(r => ({ id: r.id, value: r.value }));
    if (option) return option.responses.map(r => ({id: r.id, value: r.value}));
    return [];
  }, [option, allResponses]);

  const filteredAnswers = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    return responses.filter(item => {
      if (!searchTerm) return true;
      const row = responseIdToRowMap.get(item.id);
      const agentId = row ? Object.entries(row).find(([key]) => AGENT_ID_REGEX.test(key))?.[1] : '';
      return item.id.toLowerCase().includes(lowercasedFilter) || item.value.toLowerCase().includes(lowercasedFilter) || agentId?.toLowerCase().includes(lowercasedFilter);
    });
  }, [responses, searchTerm, responseIdToRowMap]);

  const title = useMemo(() => {
    if (question) return `All Responses for: "${question}"`;
    if (option) return `Responses for: "${option.name}"`;
    return 'Responses';
  }, [question, option]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="relative flex-grow-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${responses.length} responses...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <p className="text-sm text-muted-foreground -mt-2">
          Showing {filteredAnswers.length} of {responses.length} responses.
        </p>
        <div className="flex-grow min-h-0">
          <ScrollArea className="h-full pr-6">
            <div className="flex flex-col">
              {filteredAnswers.map((item, index) => {
                const isAiFlagged = aiFlaggedResponses.includes(item.id);
                const row = responseIdToRowMap.get(item.id);
                const agentId = row ? Object.entries(row).find(([key]) => AGENT_ID_REGEX.test(key))?.[1] : null;

                return (
                  <div key={item.id + index} className={cn("rounded-md", isAiFlagged && "bg-destructive/10")}>
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-4 text-xs">
                            <p className="font-mono text-muted-foreground">RID: <span className="text-foreground">{item.id}</span></p>
                            {agentId && <p className="font-mono text-muted-foreground">Agent: <span className="text-foreground">{agentId}</span></p>}
                            {allResponses && <p className='text-muted-foreground'>Answer: <span className="text-foreground">{item.value}</span></p>}
                        </div>
                        <div className="flex items-center gap-4">
                            {isAiFlagged && (
                                <Badge variant="destructive" className="gap-1 text-xs">
                                <Flag className="h-3 w-3" />
                                AI Flagged
                                </Badge>
                            )}
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id={`flag-${item.id}-list`}
                                    checked={userFlaggedResponses.includes(item.id)}
                                    onCheckedChange={() => onToggleFlagged(item.id)}
                                />
                                <Label
                                    htmlFor={`flag-${item.id}-list`}
                                    className="text-xs text-muted-foreground font-normal whitespace-nowrap"
                                >
                                    Flag
                                </Label>
                            </div>
                        </div>
                    </div>
                    {index < filteredAnswers.length - 1 && <Separator className="bg-border/50" />}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
