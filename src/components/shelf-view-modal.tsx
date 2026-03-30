'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { ShelfRow } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ShelfViewModalProps {
  rows: ShelfRow[];
  children: React.ReactNode;
  userFlaggedResponses: string[];
  onToggleFlagged: (responseId: string) => void;
}

export function ShelfViewModal({
  rows,
  children,
  userFlaggedResponses,
  onToggleFlagged,
}: ShelfViewModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const safeIndex = rows.length > 0 ? Math.min(currentIndex, rows.length - 1) : 0;
  const currentRow = rows[safeIndex];

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen, rows.length]);

  useEffect(() => {
    if (rows.length === 0) return;
    setCurrentIndex((i) => Math.min(i, rows.length - 1));
  }, [rows.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : i));
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (rows.length > 0 && i < rows.length - 1 ? i + 1 : i));
  }, [rows.length]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || rows.length === 0) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, rows.length, goPrev, goNext]);

  if (rows.length === 0) {
    return null;
  }

  const atStart = safeIndex === 0;
  const atEnd = safeIndex >= rows.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col gap-3 p-4 sm:p-6">
        <DialogHeader className="flex-shrink-0 space-y-1 text-left">
          <DialogTitle>Shelf View - 1 response per</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Row {safeIndex + 1} of {rows.length} · {currentRow?.photos.length ?? 0} photo
            {(currentRow?.photos.length ?? 0) === 1 ? '' : 's'}
          </p>
        </DialogHeader>

        {currentRow && (
          <>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground border-b pb-3">
              {currentRow.agentLabel && (
                <span>
                  <span className="font-semibold">Agent: </span>
                  {currentRow.agentLabel}
                </span>
              )}
              {currentRow.jobName && (
                <span>
                  <span className="font-semibold">Job: </span>
                  {currentRow.jobName}
                </span>
              )}
              {currentRow.locationLabel && (
                <span>
                  <span className="font-semibold">Location: </span>
                  {currentRow.locationLabel}
                </span>
              )}
              <span className="font-mono text-xs text-muted-foreground">
                Response: {currentRow.responseId}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={goPrev}
                disabled={atStart}
                aria-label="Previous row"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous row
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={goNext}
                disabled={atEnd}
                aria-label="Next row"
              >
                Next row
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <div
                className="flex w-full flex-1 min-h-[50vh] overflow-x-auto overflow-y-hidden items-center gap-0 rounded-md border bg-muted/30"
                role="region"
                aria-label="Photos for this response"
              >
                {currentRow.photos.map((photo, idx) => (
                  <div
                    key={`${photo.url}-${photo.question}-${idx}`}
                    className="flex h-full flex-shrink-0 items-center justify-center"
                  >
                    {/* Native img: natural aspect ratio + fixed height matches Field Agent shelf strip */}
                    <img
                      src={photo.url}
                      alt={photo.question}
                      className="max-h-[min(72vh,800px)] h-[72vh] w-auto max-w-none object-contain select-none"
                      draggable={false}
                      loading={idx < 4 ? 'eager' : 'lazy'}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Scroll horizontally to see all photos for this row. Use keyboard ← → to change rows.
              </p>
            </div>

            <div className="flex items-center gap-2 border-t pt-3 flex-shrink-0">
              <Checkbox
                id={`shelf-flag-${currentRow.responseId}`}
                checked={userFlaggedResponses.includes(currentRow.responseId)}
                onCheckedChange={() => onToggleFlagged(currentRow.responseId)}
              />
              <Label
                htmlFor={`shelf-flag-${currentRow.responseId}`}
                className="text-sm font-normal cursor-pointer"
              >
                Flag for Review
              </Label>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
