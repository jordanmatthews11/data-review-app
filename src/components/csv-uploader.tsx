
'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface CsvUploaderProps {
  onFileUpload: (file: File) => void;
  isPending: boolean;
}

export function CsvUploader({ onFileUpload, isPending }: CsvUploaderProps) {
  const [isHover, setIsHover] = useState(false);
  
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileUpload(acceptedFiles[0]);
      }
    },
    [onFileUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] 
    },
    multiple: false,
  });

  return (
    <div className="text-center w-full max-w-2xl mx-auto">
       <Alert variant="destructive" className="mb-6 bg-amber-50 border-amber-400 text-amber-800 [&>svg]:text-amber-600">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="font-bold">Attention</AlertTitle>
        <AlertDescription className="text-amber-700">
          If you open and save the file in a spreadsheet editor before uploading, photo links may not be parsed correctly.
        </AlertDescription>
      </Alert>

      <div
        {...getRootProps()}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        className={cn(
          'relative flex flex-col items-center justify-center w-full p-12 border-2 border-dashed rounded-xl cursor-pointer bg-card transition-colors duration-300 ease-in-out',
          isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
        )}
      >
        <input {...getInputProps()} disabled={isPending} />
        <div className={cn("absolute inset-0 bg-primary/10 rounded-xl transition-opacity", isHover && !isDragActive ? 'opacity-100' : 'opacity-0')} />
        
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className={cn("p-4 rounded-full bg-secondary transition-transform duration-300", isHover ? 'scale-110' : 'scale-100')}>
             <UploadCloud className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">
            {isDragActive ? "Drop the file here..." : "Upload your CSV or XLSX file"}
          </h2>
          <p className="text-muted-foreground">
            Drag and drop your file here, or click to browse.
          </p>
          <Button asChild variant="outline" className="mt-4 z-10 bg-background hover:bg-secondary">
             <span>Select File</span>
          </Button>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        We'll automatically analyze your survey data and generate visualizations.
      </p>
    </div>
  );
}
