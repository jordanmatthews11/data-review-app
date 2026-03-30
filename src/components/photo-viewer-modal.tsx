
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import Image from 'next/image';
import type { PhotoInfo } from '@/types';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

interface PhotoViewerModalProps {
  photos: PhotoInfo[];
  startIndex?: number;
  children: React.ReactNode;
  userFlaggedResponses: string[];
  onToggleFlagged: (responseId: string) => void;
}

export function PhotoViewerModal({ photos, startIndex = 0, children, userFlaggedResponses, onToggleFlagged }: PhotoViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, photos.length, isOpen]);

  const goToPrevious = () => {
    const isFirst = currentIndex === 0;
    const newIndex = isFirst ? photos.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLast = currentIndex === photos.length - 1;
    const newIndex = isLast ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };
  
  useEffect(() => {
      if (isOpen) {
        setCurrentIndex(startIndex);
      }
  }, [isOpen, startIndex])

  const currentPhoto = photos[currentIndex];
  if (!currentPhoto) return null;

  const altText = `Photo ${currentIndex + 1} of ${photos.length}`;
  const responseId = currentPhoto.responseId;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl w-full h-[90vh] p-0 bg-transparent border-0 shadow-none flex items-center justify-center">
        <DialogTitle className="sr-only">{altText}</DialogTitle>
        
        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            key={currentPhoto.url}
            src={currentPhoto.url}
            alt={altText}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1000px"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
          />
        </div>
        
        <div className="absolute top-1/2 -translate-y-1/2 left-4 z-10">
          <Button variant="outline" size="icon" onClick={goToPrevious} className="rounded-full h-10 w-10 bg-black/30 hover:bg-black/50 border-white/20 text-white">
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 right-4 z-10">
          <Button variant="outline" size="icon" onClick={goToNext} className="rounded-full h-10 w-10 bg-black/50 hover:bg-black/50 border-white/20 text-white">
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        <DialogClose asChild>
            <Button variant="outline" size="icon" className="absolute top-4 right-4 z-20 rounded-full h-10 w-10 bg-black/30 hover:bg-black/50 border-white/20 text-white">
              <X className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </Button>
        </DialogClose>
        
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full z-10">
            {currentIndex + 1} / {photos.length}
        </div>

        {responseId && (
             <div className="absolute bottom-4 left-4 z-10">
                <div className="flex items-center gap-2 bg-black/50 text-white p-2 rounded-md">
                    <Checkbox
                        id={`flag-modal-${responseId}`}
                        checked={userFlaggedResponses.includes(responseId)}
                        onCheckedChange={() => onToggleFlagged(responseId)}
                        className="border-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    />
                    <Label htmlFor={`flag-modal-${responseId}`} className="text-sm font-normal text-white">Flag for Review</Label>
                </div>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
