
'use client';

import { useEffect, useState } from 'react';
import type { AnalyzedQuestion, MultipleChoiceData, NumericData, OpenEndedData } from '@/types';
import { Button } from './ui/button';
import { Loader2, Wand2, Lightbulb, TrendingUp, Sparkles } from 'lucide-react';
import { generateCustomerInsights, InsightsInput, InsightsOutput } from '@/ai/flows/generate-customer-insights';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

interface InsightsDashboardProps {
  analyzedData: AnalyzedQuestion[];
  isAiEnabled: boolean;
  onToggleAi: (enabled: boolean) => void;
}

const summarizeQuestionData = (question: AnalyzedQuestion): string => {
    switch (question.type) {
        case 'multiple-choice':
            const mcData = question.data as MultipleChoiceData;
            const optionsSummary = mcData.options.map(o => `${o.name} (${o.count})`).join(', ');
            return `Options and counts: ${optionsSummary}.`;
        case 'numeric':
            const numData = question.data as NumericData;
            if (numData.values.length === 0) return 'No numeric data.';
            const values = numData.values.map(v => v.value);
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            return `Average: ${avg.toFixed(2)}, Min: ${Math.min(...values)}, Max: ${Math.max(...values)}.`;
        case 'open-ended':
        case 'video':
            const oeData = question.data as OpenEndedData;
            const sample = oeData.answers.slice(0, 3).map(a => `"${a.answer}"`).join(', ');
            return `Sample responses: ${sample}.`;
        default:
            return 'N/A';
    }
};

const Section = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
    <div className="mb-8">
        <h2 className="text-2xl font-bold flex items-center mb-4 text-foreground">
            {icon}
            <span className="ml-3">{title}</span>
        </h2>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const InsightCard = ({ title, description, basedOnQuestions }: { title: string, description: string, basedOnQuestions: string[] }) => (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
            <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground mb-4">{description}</p>
            <div className="flex flex-wrap gap-2">
                <span className="text-xs font-semibold">Source Questions:</span>
                {basedOnQuestions.map(q => <Badge key={q} variant="secondary">{q}</Badge>)}
            </div>
        </CardContent>
    </Card>
)

export function InsightsDashboard({
  analyzedData,
  isAiEnabled,
  onToggleAi,
}: InsightsDashboardProps) {
  const [insights, setInsights] = useState<InsightsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    
    if (!isAiEnabled) {
      setInsights(null);
      setIsLoading(false);
      return;
    }

    const getInsights = async () => {
        setIsLoading(true);

        const insightInput: InsightsInput = {
            questions: analyzedData.map(q => ({
                question: q.question,
                type: q.type,
                rowCount: q.rowCount,
                dataSummary: summarizeQuestionData(q)
            }))
        };

        try {
            const result = await generateCustomerInsights(insightInput);
            if (isMounted) {
                setInsights(result);
            }
        } catch (error) {
            console.error('Failed to get AI insights:', error);
            if (isMounted) {
                toast({
                    variant: 'destructive',
                    title: 'AI Insights Failed',
                    description: 'Could not generate customer insights for this dataset.',
                });
            }
        } finally {
            if (isMounted) {
                setIsLoading(false);
            }
        }
    };

    getInsights();
    
    return () => {
      isMounted = false;
    };
  }, [analyzedData, isAiEnabled, toast]);

  const renderContent = () => {
    if (!isAiEnabled) {
        return (
            <Alert className="max-w-xl mx-auto">
                <Wand2 className="h-4 w-4" />
                <AlertTitle>AI Analysis Disabled</AlertTitle>
                <AlertDescription>
                   To generate a customer insights report, please enable AI Analysis.
                </AlertDescription>
            </Alert>
        );
    }
    
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 text-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium text-muted-foreground">Generating customer insights...</p>
          <p className="text-sm text-muted-foreground">The AI is analyzing the data to find key learnings and recommendations.</p>
        </div>
      );
    }
    
    if (!insights) {
        return (
             <div className="text-center py-16">
                <p className="text-muted-foreground">Could not generate insights for this file.</p>
            </div>
        )
    }
    
    return (
        <div className="max-w-4xl mx-auto">
            <Card className="mb-8 bg-secondary/50">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl">
                        <Wand2 className="mr-3 h-6 w-6 text-primary" />
                        Overall Summary
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-foreground leading-relaxed">{insights.overallSummary}</p>
                </CardContent>
            </Card>

            <Section title="Key Learnings" icon={<Lightbulb className="text-amber-500" />}>
                {insights.keyLearnings.map((item, i) => <InsightCard key={i} {...item} />)}
            </Section>

            <Section title="Recommendations" icon={<TrendingUp className="text-green-500" />}>
                {insights.recommendations.map((item, i) => <InsightCard key={i} {...item} />)}
            </Section>
            
            <Section title="Actionable Insights" icon={<Sparkles className="text-sky-500" />}>
                {insights.actionableInsights.map((item, i) => <InsightCard key={i} {...item} />)}
            </Section>
        </div>
    )
  }

  return (
    <div className="w-full animate-in fade-in-50 duration-500">
        <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-foreground mt-1">
                Customer Insights Report
            </h1>
             <div className="flex items-center justify-center space-x-2 mt-4">
              <Switch 
                id="ai-insights-toggle" 
                checked={isAiEnabled}
                onCheckedChange={onToggleAi}
              />
              <Label htmlFor="ai-insights-toggle" className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Wand2 className="h-4 w-4" />
                Enable AI Analysis
              </Label>
            </div>
        </div>
      {renderContent()}
    </div>
  );
}
