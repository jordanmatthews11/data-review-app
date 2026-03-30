
'use client';

import { useState, useTransition, useCallback, useEffect, useMemo } from 'react';
import { CsvUploader } from '@/components/csv-uploader';
import { Dashboard } from '@/components/dashboard';
import { analyzeData, parseFile } from '@/lib/csv-analysis';
import type { AnalyzedQuestion, CsvData } from '@/types';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InsightsDashboard } from '@/components/insights-dashboard';
import { QuestionCard } from '@/components/question-card';

const DataReviewTab = ({
  analyzedData,
  fileName,
  handleReset,
  filteredCsvData,
  userFlaggedResponses,
  handleToggleFlaggedResponse,
  handleFlagResponses,
  handleClearUserFlags,
  aiFlaggedResponses,
  isAiReviewEnabled,
  handleAiFlags,
  handleClearAiFlags,
  ignoredAiFlags,
  handleToggleIgnoreAiFlag,
  handleToggleAiReview,
  availableStatuses,
  filterByStatus,
  handleStatusFilterChange,
  isPending
}: any) => (
  <Dashboard
    data={analyzedData}
    fileName={fileName}
    onReset={handleReset}
    fullCsvData={filteredCsvData}
    userFlaggedResponses={userFlaggedResponses}
    onToggleFlagged={handleToggleFlaggedResponse}
    onFlagResponses={handleFlagResponses}
    onClearUserFlags={handleClearUserFlags}
    aiFlaggedResponses={aiFlaggedResponses}
    onAiFlags={isAiReviewEnabled ? handleAiFlags : undefined}
    onClearAiFlags={handleClearAiFlags}
    ignoredAiFlags={ignoredAiFlags}
    onToggleIgnoreAiFlag={handleToggleIgnoreAiFlag}
    isAiReviewEnabled={isAiReviewEnabled}
    onToggleAiReview={handleToggleAiReview}
    availableStatuses={availableStatuses}
    filterByStatus={filterByStatus}
    onStatusFilterChange={handleStatusFilterChange}
    isProcessing={isPending}
  />
);

const InsightsTab = ({ 
  analyzedData, 
  isInsightsAiEnabled, 
  handleToggleInsightsAi,
  userFlaggedResponses,
  handleToggleFlaggedResponse,
  handleFlagResponses,
}: any) => (
  <>
    <InsightsDashboard 
      analyzedData={analyzedData} 
      isAiEnabled={isInsightsAiEnabled}
      onToggleAi={handleToggleInsightsAi} 
    />
    {analyzedData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 mt-6">
        {analyzedData.map((question: AnalyzedQuestion, index: number) => (
            <QuestionCard 
              key={question.id + index} 
              question={question} 
              userFlaggedResponses={userFlaggedResponses}
              onToggleFlagged={handleToggleFlaggedResponse}
              onFlagResponses={handleFlagResponses}
              isAiReviewEnabled={isInsightsAiEnabled}
            />
        ))}
        </div>
    ) : (
        <div className="text-center py-16 border border-dashed rounded-lg">
        <h2 className="text-xl font-medium">No Questions Found</h2>
        <p className="text-muted-foreground mt-2">We couldn't find any columns to analyze for insights.</p>
        </div>
    )}
  </>
);


export default function Home() {
  const [allSheetsData, setAllSheetsData] = useState<Record<string, CsvData> | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheetName, setActiveSheetName] = useState<string | null>(null);

  const [analyzedData, setAnalyzedData] = useState<AnalyzedQuestion[] | null>(null);
  const [filteredCsvData, setFilteredCsvData] = useState<CsvData | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [userFlaggedResponses, setUserFlaggedResponses] = useState<string[]>([]);
  const [aiFlaggedResponses, setAiFlaggedResponses] = useState<Record<string, { reason: string; ids: string[] }>>({});
  const [ignoredAiFlags, setIgnoredAiFlags] = useState<string[]>([]);
  const [isAiReviewEnabled, setIsAiReviewEnabled] = useState(false);
  const [isInsightsAiEnabled, setIsInsightsAiEnabled] = useState(false);
  const [filterByStatus, setFilterByStatus] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('review');

  const unfilteredCsvData = useMemo(() => {
    if (!allSheetsData || !activeSheetName) return null;
    return allSheetsData[activeSheetName] || null;
  }, [allSheetsData, activeSheetName]);

  const availableStatuses = useMemo(() => {
    if (!unfilteredCsvData) return [];
    const statusHeader = Object.keys(unfilteredCsvData[0] || {}).find(h => h.toLowerCase() === 'status');
    if (!statusHeader) return [];
    const statusData = unfilteredCsvData.map(row => row[statusHeader]).filter(Boolean);
    return [...new Set(statusData)].sort();
  }, [unfilteredCsvData]);

  useEffect(() => {
    if (!unfilteredCsvData) {
      setFilteredCsvData(null);
      return;
    }

    if (filterByStatus.length === 0) {
      setFilteredCsvData(unfilteredCsvData);
      return;
    }

    const statusHeader = Object.keys(unfilteredCsvData[0] || {}).find(h => h.toLowerCase() === 'status');
    if (!statusHeader) {
      setFilteredCsvData(unfilteredCsvData);
      return;
    }

    const newData = unfilteredCsvData.filter(row => filterByStatus.includes(row[statusHeader]));
    setFilteredCsvData(newData);
  }, [unfilteredCsvData, filterByStatus]);
  
  useEffect(() => {
    if (filteredCsvData) {
       startTransition(() => {
        const analysis = analyzeData(filteredCsvData);
        setAnalyzedData(analysis);
       });
    } else {
        setAnalyzedData(null);
    }
  }, [filteredCsvData]);


  const handleToggleFlaggedResponse = (responseId: string) => {
    setUserFlaggedResponses(prev =>
      prev.includes(responseId)
        ? prev.filter(id => id !== responseId)
        : [...prev, responseId]
    );
  };
  
  const handleFlagResponses = (responseIds: string[]) => {
    setUserFlaggedResponses(prev => {
      const newFlags = responseIds.filter(id => !prev.includes(id));
      return [...prev, ...newFlags];
    });
  };

  const handleToggleIgnoreAiFlag = (questionId: string) => {
    setIgnoredAiFlags(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };
  
  const handleAiFlags = useCallback((questionId: string, reason: string, responseIds: string[]) => {
    if (responseIds.length > 0) {
      setAiFlaggedResponses(prev => ({
        ...prev,
        [questionId]: { reason, ids: responseIds },
      }));
    }
  }, []);

  const handleClearUserFlags = () => {
    setUserFlaggedResponses([]);
  };
  
  const handleClearAiFlags = () => {
    setAiFlaggedResponses({});
    setIgnoredAiFlags([]);
  };

  const handleToggleAiReview = (enabled: boolean) => {
    setIsAiReviewEnabled(enabled);
    if (!enabled) {
      handleClearAiFlags();
    }
  };

  const handleToggleInsightsAi = (enabled: boolean) => {
    setIsInsightsAiEnabled(enabled);
  };

  const handleFileUpload = (file: File) => {
    setError(null);
    setAnalyzedData(null);
    setFilteredCsvData(null);
    setFileName(null);
    setUserFlaggedResponses([]);
    setAiFlaggedResponses({});
    setIgnoredAiFlags([]);
    setIsAiReviewEnabled(false);
    setIsInsightsAiEnabled(false);
    setFilterByStatus([]);
    setAllSheetsData(null);
    setSheetNames([]);
    setActiveSheetName(null);

    startTransition(async () => {
      try {
        const parsedSheets = await parseFile(file);
        const sheetKeys = Object.keys(parsedSheets);
        if (sheetKeys.length === 0) {
          setError('The uploaded file is empty or could not be parsed correctly.');
          return;
        }
        
        setAllSheetsData(parsedSheets);
        setSheetNames(sheetKeys);
        setActiveSheetName(sheetKeys[0]);
        setFileName(file.name);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred during file processing.');
      }
    });
  };

  const handleReset = () => {
    setAnalyzedData(null);
    setFilteredCsvData(null);
    setError(null);
    setFileName(null);
    setUserFlaggedResponses([]);
    setAiFlaggedResponses({});
    setIgnoredAiFlags([]);
    setIsAiReviewEnabled(false);
    setIsInsightsAiEnabled(false);
    setFilterByStatus([]);
    setAllSheetsData(null);
    setSheetNames([]);
    setActiveSheetName(null);
  };

  const handleSheetChange = (sheetName: string) => {
    if (sheetName === activeSheetName) return;

    startTransition(() => {
      // Reset state for the new sheet analysis
      setAnalyzedData(null);
      setFilteredCsvData(null);
      setUserFlaggedResponses([]);
      setAiFlaggedResponses({});
      setIgnoredAiFlags([]);
      setFilterByStatus([]);
      setIsAiReviewEnabled(false);
      setIsInsightsAiEnabled(false);
      setActiveTab('review');
      
      setActiveSheetName(sheetName);
    });
  };

  const handleStatusFilterChange = (status: string) => {
    setFilterByStatus(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };
  
  const renderContent = () => {
    if (isPending && !allSheetsData) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium text-muted-foreground">Analyzing your data...</p>
          <p className="text-sm text-muted-foreground">This may take a moment for larger files.</p>
        </div>
      );
    }

    if (error) {
      return (
        <Card className="w-full max-w-lg mx-auto">
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Processing Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={handleReset} className="w-full mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }
    
    if (allSheetsData && fileName && activeSheetName) {
      const dashboardContent = () => {
        if (isPending) {
          // This is for sheet changes.
          return (
            <div className="flex flex-col items-center justify-center gap-4 text-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium text-muted-foreground">Analyzing your data...</p>
              <p className="text-sm text-muted-foreground">Loading data for sheet: {activeSheetName}</p>
            </div>
          );
        }
        if (analyzedData && filteredCsvData) {
           return (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-center mb-6">
                <TabsList>
                  <TabsTrigger value="review">Data Review</TabsTrigger>
                  <TabsTrigger value="insights">Customer Insights</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="review" forceMount={activeTab === 'review' ? undefined : false}>
                 {activeTab === 'review' && (
                  <DataReviewTab
                    analyzedData={analyzedData}
                    fileName={fileName}
                    handleReset={handleReset}
                    filteredCsvData={filteredCsvData}
                    userFlaggedResponses={userFlaggedResponses}
                    handleToggleFlaggedResponse={handleToggleFlaggedResponse}
                    handleFlagResponses={handleFlagResponses}
                    handleClearUserFlags={handleClearUserFlags}
                    aiFlaggedResponses={aiFlaggedResponses}
                    isAiReviewEnabled={isAiReviewEnabled}
                    handleAiFlags={handleAiFlags}
                    handleClearAiFlags={handleClearAiFlags}
                    ignoredAiFlags={ignoredAiFlags}
                    handleToggleIgnoreAiFlag={handleToggleIgnoreAiFlag}
                    handleToggleAiReview={handleToggleAiReview}
                    availableStatuses={availableStatuses}
                    filterByStatus={filterByStatus}
                    handleStatusFilterChange={handleStatusFilterChange}
                    isProcessing={isPending}
                  />
                )}
              </TabsContent>
              <TabsContent value="insights" forceMount={activeTab === 'insights' ? undefined : false}>
                {activeTab === 'insights' && (
                  <InsightsTab
                    analyzedData={analyzedData}
                    isInsightsAiEnabled={isInsightsAiEnabled}
                    handleToggleInsightsAi={handleToggleInsightsAi}
                    userFlaggedResponses={userFlaggedResponses}
                    handleToggleFlaggedResponse={handleToggleFlaggedResponse}
                    handleFlagResponses={handleFlagResponses}
                  />
                )}
              </TabsContent>
            </Tabs>
           )
        }
        return null;
      }
      
      return (
          <div className="w-full">
            {sheetNames.length > 1 && (
                <div className="flex justify-center items-center gap-4 mb-4">
                    <p className="text-sm text-muted-foreground">Select a sheet:</p>
                    <Tabs value={activeSheetName} onValueChange={handleSheetChange}>
                        <TabsList className="bg-card border">
                            {sheetNames.map((name) => (
                                <TabsTrigger key={name} value={name}>{name}</TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>
            )}
            {dashboardContent()}
          </div>
      )
    }

    return <CsvUploader onFileUpload={handleFileUpload} isPending={isPending} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow flex items-center justify-center p-4 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
}
