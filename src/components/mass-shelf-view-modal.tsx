'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ShelfRow } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export type MassShelfRowCount = '10' | '25' | '50' | '100' | 'all';

interface MassShelfViewModalProps {
  rows: ShelfRow[];
  children: React.ReactNode;
  userFlaggedResponses: string[];
  onToggleFlagged: (responseId: string) => void;
}

const ROW_COUNT_OPTIONS: { value: MassShelfRowCount; label: string }[] = [
  { value: '10', label: '10' },
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
  { value: 'all', label: 'All' },
];

function sliceRows(rows: ShelfRow[], count: MassShelfRowCount): ShelfRow[] {
  if (count === 'all') return rows;
  const n = parseInt(count, 10);
  return rows.slice(0, n);
}

export function MassShelfViewModal({
  rows,
  children,
  userFlaggedResponses,
  onToggleFlagged,
}: MassShelfViewModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rowCount, setRowCount] = useState<MassShelfRowCount>('10');

  useEffect(() => {
    if (isOpen) {
      setRowCount('10');
    }
  }, [isOpen, rows.length]);

  const visibleRows = useMemo(() => sliceRows(rows, rowCount), [rows, rowCount]);

  if (rows.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col gap-3 p-4 sm:p-6">
        <DialogHeader className="flex-shrink-0 space-y-1 text-left">
          <DialogTitle>Mass Shelf View</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Showing {visibleRows.length} of {rows.length} response{rows.length === 1 ? '' : 's'} with photos
          </p>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-3 border-b pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Label htmlFor="mass-shelf-rows" className="text-xs text-muted-foreground whitespace-nowrap">
              Rows at once
            </Label>
            <Select value={rowCount} onValueChange={(v) => setRowCount(v as MassShelfRowCount)}>
              <SelectTrigger id="mass-shelf-rows" className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROW_COUNT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {rowCount === 'all' && rows.length > 100 && (
            <p className="text-xs text-amber-600 dark:text-amber-500">
              Loading many rows may take a moment; images load as you scroll.
            </p>
          )}
        </div>

        <ScrollArea className="flex-1 min-h-0 pr-3">
          <div className="flex flex-col gap-8 pb-4">
            {visibleRows.map((shelfRow, rowIdx) => (
              <section
                key={`${shelfRow.responseId}-${shelfRow.rowIndex}`}
                className="rounded-lg border bg-card/50 overflow-hidden"
                aria-labelledby={`mass-shelf-heading-${shelfRow.responseId}`}
              >
                <div
                  id={`mass-shelf-heading-${shelfRow.responseId}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 text-sm border-b bg-muted/40"
                >
                  <span className="font-medium text-muted-foreground text-xs">
                    #{rowIdx + 1}
                  </span>
                  {shelfRow.agentLabel && (
                    <span>
                      <span className="font-semibold">Agent: </span>
                      {shelfRow.agentLabel}
                    </span>
                  )}
                  {shelfRow.jobName && (
                    <span>
                      <span className="font-semibold">Job: </span>
                      {shelfRow.jobName}
                    </span>
                  )}
                  {shelfRow.locationLabel && (
                    <span>
                      <span className="font-semibold">Location: </span>
                      {shelfRow.locationLabel}
                    </span>
                  )}
                  <span className="font-mono text-xs text-muted-foreground">
                    Response: {shelfRow.responseId}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {shelfRow.photos.length} photo{shelfRow.photos.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div
                  className="flex w-full overflow-x-auto overflow-y-hidden items-center gap-0 bg-muted/30"
                  role="region"
                  aria-label={`Photos for response ${shelfRow.responseId}`}
                >
                  {shelfRow.photos.map((photo, idx) => (
                    <div
                      key={`${photo.url}-${photo.question}-${idx}`}
                      className="flex flex-shrink-0 items-center justify-center"
                    >
                      <img
                        src={photo.url}
                        alt={photo.question}
                        className="h-[200px] max-h-[28vh] w-auto max-w-none object-contain select-none"
                        draggable={false}
                        loading={rowIdx < 5 && idx < 6 ? 'eager' : 'lazy'}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 px-3 py-2 border-t bg-muted/20">
                  <Checkbox
                    id={`mass-shelf-flag-${shelfRow.responseId}`}
                    checked={userFlaggedResponses.includes(shelfRow.responseId)}
                    onCheckedChange={() => onToggleFlagged(shelfRow.responseId)}
                  />
                  <Label
                    htmlFor={`mass-shelf-flag-${shelfRow.responseId}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    Flag for Review
                  </Label>
                </div>
              </section>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
