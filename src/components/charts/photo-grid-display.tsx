
'use client';

import type { PhotoGridData } from '@/types';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { PhotoViewerModal } from '../photo-viewer-modal';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';

interface PhotoGridDisplayProps {
  data: PhotoGridData;
  userFlaggedResponses: string[];
  onToggleFlagged: (responseId: string) => void;
}

export function PhotoGridDisplay({ data, userFlaggedResponses, onToggleFlagged }: PhotoGridDisplayProps) {
  if (!data.photos || data.photos.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No images found.
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <Carousel className="w-full max-w-sm" opts={{loop: true}}>
        <CarouselContent>
          {data.photos.map((photo, index) => (
            <CarouselItem key={index}>
              <div className="p-1">
                <Card>
                  <CardContent className="flex flex-col items-center justify-center p-0 overflow-hidden rounded-lg">
                    <PhotoViewerModal 
                        photos={data.photos} 
                        startIndex={index}
                        userFlaggedResponses={userFlaggedResponses}
                        onToggleFlagged={onToggleFlagged}
                    >
                        <div className="aspect-square w-full relative cursor-pointer">
                            <Image
                                src={photo.url}
                                alt={`Uploaded image ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                placeholder="blur"
                                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
                            />
                        </div>
                    </PhotoViewerModal>
                    <div className="p-3 text-xs w-full bg-secondary/50 border-t space-y-1">
                        {photo.storeName && <p className="font-semibold text-foreground truncate">{photo.storeName}</p>}
                        {(photo.city || photo.state) && <p className="text-muted-foreground truncate">{photo.city}, {photo.state} {photo.zip}</p>}
                        {photo.responseId && <p className="text-muted-foreground mt-1 font-mono text-[10px]">ID: {photo.responseId}</p>}
                        {photo.responseId && (
                           <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                                <Checkbox
                                    id={`flag-${photo.responseId}-carousel`}
                                    checked={userFlaggedResponses.includes(photo.responseId)}
                                    onCheckedChange={() => onToggleFlagged(photo.responseId!)}
                                />
                                <Label htmlFor={`flag-${photo.responseId}-carousel`} className="text-xs text-muted-foreground font-normal">Flag for Review</Label>
                            </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
