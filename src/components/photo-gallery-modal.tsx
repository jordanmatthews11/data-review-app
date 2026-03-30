
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from './ui/scroll-area';
import Image from 'next/image';
import type { PhotoInfo, AnalyzedQuestion, CsvData } from '@/types';
import { PhotoViewerModal } from './photo-viewer-modal';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, X, ChevronDown } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Button } from './ui/button';

interface PhotoGalleryModalProps {
  photos: PhotoInfo[];
  children: React.ReactNode;
  userFlaggedResponses: string[];
  onToggleFlagged: (responseId: string) => void;
  analyzedQuestions: AnalyzedQuestion[];
  fullCsvData: CsvData;
}

export function PhotoGalleryModal({
  photos,
  children,
  userFlaggedResponses,
  onToggleFlagged,
  analyzedQuestions,
  fullCsvData,
}: PhotoGalleryModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewCount, setViewCount] = useState('200');
  const [filterPhotoQuestions, setFilterPhotoQuestions] = useState<string[]>([]);
  const [filterByQuestion, setFilterByQuestion] = useState('none');
  const [filterByAnswers, setFilterByAnswers] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const photoQuestions = useMemo(() => {
    return analyzedQuestions.filter(q => q.type === 'photo-grid');
  }, [analyzedQuestions]);
  
  const filterableAnswers = useMemo(() => {
    if (filterByQuestion === 'none' || !fullCsvData) return [];
    const questionData = fullCsvData.map(row => row[filterByQuestion]).filter(Boolean);
    return [...new Set(questionData)].sort();
  }, [filterByQuestion, fullCsvData]);

  useEffect(() => {
    // Reset answer filter when question filter changes
    setFilterByAnswers([]);
  }, [filterByQuestion]);

  const filteredPhotos = useMemo(() => {
    if (!fullCsvData || fullCsvData.length === 0) {
      return photos;
    }

    const lowercasedSearch = searchTerm.toLowerCase();

    // Create a map for quick lookup of response rows
    const idCol = Object.keys(fullCsvData[0] || {}).find(h => /Response Group ID/i.test(h)) || '__generated_row_id__';
    const responseIdMap = new Map(fullCsvData.map(row => [row[idCol], row]));

    return photos.filter(photo => {
      if (!photo.responseId) return true;
      const responseRow = responseIdMap.get(photo.responseId);
      if (!responseRow) return true;

      // Photo Question Filter
      if (filterPhotoQuestions.length > 0 && !filterPhotoQuestions.includes(photo.question)) {
        return false;
      }
      
      // Answer Filter
      if (filterByQuestion !== 'none' && filterByAnswers.length > 0) {
        if (!filterByAnswers.includes(responseRow[filterByQuestion])) {
          return false;
        }
      }

      // Search Term Filter
      if (lowercasedSearch) {
        return (
          photo.storeName?.toLowerCase().includes(lowercasedSearch) ||
          photo.address?.toLowerCase().includes(lowercasedSearch) ||
          photo.city?.toLowerCase().includes(lowercasedSearch) ||
          photo.state?.toLowerCase().includes(lowercasedSearch) ||
          photo.zip?.toLowerCase().includes(lowercasedSearch) ||
          photo.responseId?.toLowerCase().includes(lowercasedSearch) ||
          photo.agentId?.toLowerCase().includes(lowercasedSearch) ||
          photo.question.toLowerCase().includes(lowercasedSearch)
        );
      }
      
      return true;
    });
  }, [photos, searchTerm, filterPhotoQuestions, filterByQuestion, filterByAnswers, fullCsvData]);

  const photosToDisplay = useMemo(() => {
    const count = viewCount === 'all' ? filteredPhotos.length : parseInt(viewCount, 10);
    return filteredPhotos.slice(0, count);
  }, [filteredPhotos, viewCount]);

  const handlePhotoQuestionFilterChange = (question: string) => {
    setFilterPhotoQuestions(prev => 
      prev.includes(question)
        ? prev.filter(q => q !== question)
        : [...prev, question]
    );
  }

  const handleAnswerFilterChange = (answer: string) => {
    setFilterByAnswers(prev =>
      prev.includes(answer)
        ? prev.filter(a => a !== answer)
        : [...prev, answer]
    );
  };
  
  const clearFilters = () => {
    setFilterPhotoQuestions([]);
    setFilterByQuestion('none');
    setFilterByAnswers([]);
  }

  const hasActiveFilters = filterPhotoQuestions.length > 0 || filterByQuestion !== 'none';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Photo Gallery</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-wrap items-center gap-4 px-1 py-2 border-b pb-4">
            <div className="relative flex-grow min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search metadata..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>
            
            <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Filter by Photo Question</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-[220px] justify-between">
                      <span className='truncate'>
                        {filterPhotoQuestions.length === 0
                          ? "All Photo Questions"
                          : filterPhotoQuestions.length === 1
                            ? filterPhotoQuestions[0]
                            : `${filterPhotoQuestions.length} questions selected`
                        }
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[220px]">
                    <DropdownMenuLabel>Photo Questions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {photoQuestions.map((q) => (
                      <DropdownMenuCheckboxItem
                        key={q.id}
                        checked={filterPhotoQuestions.includes(q.question)}
                        onCheckedChange={() => handlePhotoQuestionFilterChange(q.question)}
                        onSelect={(e) => e.preventDefault()}
                      >
                        {q.question}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
            
            <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Filter by Answer</Label>
                <div className="flex gap-2">
                    <Select value={filterByQuestion} onValueChange={setFilterByQuestion}>
                        <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder="Select question" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Select a Question</SelectItem>
                            {analyzedQuestions.map(q => <SelectItem key={q.id} value={q.question}>{q.question}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild disabled={filterByQuestion === 'none'}>
                         <Button variant="outline" className="w-[220px] justify-between">
                           <span className='truncate'>
                              {filterByAnswers.length === 0
                                ? "All Answers"
                                : filterByAnswers.length === 1
                                  ? filterByAnswers[0]
                                  : `${filterByAnswers.length} answers selected`
                              }
                           </span>
                           <ChevronDown className="h-4 w-4 opacity-50" />
                         </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[220px]">
                         <DropdownMenuLabel>Answers</DropdownMenuLabel>
                         <DropdownMenuSeparator />
                         {filterableAnswers.map(answer => (
                            <DropdownMenuCheckboxItem
                              key={answer}
                              checked={filterByAnswers.includes(answer)}
                              onCheckedChange={() => handleAnswerFilterChange(answer)}
                              onSelect={(e) => e.preventDefault()}
                            >
                              {answer}
                            </DropdownMenuCheckboxItem>
                         ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters} className="self-end">
                    <X className="mr-2 h-4 w-4" />
                    Clear Filters
                </Button>
            )}
        </div>

        <div className="flex items-center justify-end gap-4 px-1 py-2">
            <p className="text-sm text-muted-foreground whitespace-nowrap mr-auto">
                Showing {photosToDisplay.length} of {filteredPhotos.length} photos ({photos.length} total)
            </p>
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show</span>
                <Select value={viewCount} onValueChange={setViewCount}>
                    <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Count" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="200">200</SelectItem>
                        <SelectItem value="500">500</SelectItem>
                        <SelectItem value="all">All</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        <div className="flex-grow min-h-0 relative">
            <ScrollArea className="h-full pr-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {photosToDisplay.map((photo, index) => (
                <div key={photo.url + index} className="rounded-lg overflow-hidden border flex flex-col group">
                    <PhotoViewerModal 
                        photos={photosToDisplay} 
                        startIndex={index}
                        userFlaggedResponses={userFlaggedResponses}
                        onToggleFlagged={onToggleFlagged}
                    >
                        <div className="aspect-square relative w-full cursor-pointer">
                            <Image
                            src={photo.url}
                            alt={`Photo for ${photo.question} - ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                            placeholder="blur"
                            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
                            />
                        </div>
                    </PhotoViewerModal>
                    <div className="p-2 text-[10px] bg-muted/50 border-t space-y-1">
                        <p className="font-bold text-foreground truncate" title={photo.question}>{photo.question}</p>
                        {photo.storeName && <p className="font-semibold text-foreground truncate">{photo.storeName}</p>}
                        {photo.address && <p className="text-muted-foreground truncate">{photo.address}</p>}
                        {(photo.city || photo.state || photo.zip) && <p className="text-muted-foreground truncate">{photo.city}, {photo.state} {photo.zip}</p>}
                        {photo.responseId && <p className="text-muted-foreground mt-1 font-mono text-[9px]">Response: {photo.responseId}</p>}
                        {photo.agentId && <p className="text-muted-foreground font-mono text-[9px]">Agent: {photo.agentId}</p>}
                    </div>
                     {photo.responseId && (
                        <div className="p-2 border-t flex items-center gap-2 bg-muted/50">
                            <Checkbox
                                id={`flag-${photo.responseId}-gallery`}
                                checked={userFlaggedResponses.includes(photo.responseId)}
                                onCheckedChange={() => onToggleFlagged(photo.responseId!)}
                            />
                            <Label htmlFor={`flag-${photo.responseId}-gallery`} className="text-xs text-muted-foreground font-normal">Flag for Review</Label>
                        </div>
                    )}
                </div>
                ))}
            </div>
             {photosToDisplay.length === 0 && (
                <div className="text-center py-16">
                    <p className="text-muted-foreground">No photos match your current filters.</p>
                </div>
             )}
            </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
