
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, Text } from 'recharts';
import type { CsvData, MultipleChoiceData, OptionWithResponses } from '@/types';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { ResponseListModal } from '../response-list-modal';
import { Button } from '../ui/button';
import { List } from 'lucide-react';
import { useMemo } from 'react';

interface BarChartDisplayProps {
  data: MultipleChoiceData;
  fullCsvData: CsvData;
  userFlaggedResponses?: string[];
  aiFlaggedResponses?: string[];
  onToggleFlagged?: (responseId: string) => void;
  allResponses: { id: string; value: string }[];
  question: string;
}

const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
const LABEL_WIDTH = 230; // Width available for labels
const CHAR_WIDTH_ESTIMATE = 8; // Estimated width of a character
const LINE_HEIGHT = 16; // Estimated height of a line of text in pixels
const BASE_BAR_HEIGHT = 30; // Base height for a single-line bar

// Simple text wrapper
const wrapText = (text: string, maxCharsPerLine: number) => {
    const words = text.split(' ');
    let lines: string[] = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
    const word = words[i];
    if ((currentLine + " " + word).length > maxCharsPerLine) {
        lines.push(currentLine);
        currentLine = word;
    } else {
        currentLine += " " + word;
    }
    }
    lines.push(currentLine);
    return lines;
};


const CustomYAxisTick = (props: any) => {
    const { x, y, payload, data, fullCsvData, userFlaggedResponses, aiFlaggedResponses, onToggleFlagged } = props;
    const optionData = data.options.find((opt: OptionWithResponses) => opt.name === payload.value);

    if (!optionData) return null;

    const tickContent = payload.value;
    const maxChars = Math.floor(LABEL_WIDTH / CHAR_WIDTH_ESTIMATE);
    const lines = wrapText(tickContent, maxChars);
    const textHeight = lines.length * LINE_HEIGHT;

    return (
        <g transform={`translate(${x},${y})`}>
          <ResponseListModal
              option={optionData}
              fullCsvData={fullCsvData}
              userFlaggedResponses={userFlaggedResponses || []}
              onToggleFlagged={onToggleFlagged || (() => {})}
              aiFlaggedResponses={aiFlaggedResponses || []}
          >
            <text x={0} y={0} dy={5} textAnchor="end" fill="hsl(var(--muted-foreground))" className="text-xs cursor-pointer hover:underline hover:fill-primary">
               {lines.map((line, index) => (
                  <tspan key={index} x={-10} dy={index === 0 ? -(textHeight/3) : '1.2em'}>{line}</tspan>
              ))}
            </text>
          </ResponseListModal>
        </g>
    );
};


export function BarChartDisplay({ data, fullCsvData, userFlaggedResponses, aiFlaggedResponses, onToggleFlagged, allResponses, question }: BarChartDisplayProps) {
  const chartData = data.options;
  
  const { chartDataWithLayout, containerHeight } = useMemo(() => {
    let yOffset = 0;
    const maxCharsPerLine = Math.floor(LABEL_WIDTH / CHAR_WIDTH_ESTIMATE);

    const dataWithLayout = chartData.map(item => {
      const lines = wrapText(item.name, maxCharsPerLine);
      const barHeight = Math.max(BASE_BAR_HEIGHT, (lines.length -1) * LINE_HEIGHT + BASE_BAR_HEIGHT);
      const itemWithLayout = { ...item, layout: { y: yOffset, height: barHeight } };
      yOffset += barHeight + (BASE_BAR_HEIGHT / 2); // Add gap
      return itemWithLayout;
    });

    const totalHeight = yOffset;

    return { chartDataWithLayout: dataWithLayout, containerHeight: totalHeight };
  }, [chartData]);


  const chartConfig = {
    count: {
      label: "Count",
    },
    ...chartData.reduce((acc, item) => {
      acc[item.name] = { label: item.name };
      return acc;
    }, {})
  };

  return (
    <div className="flex flex-col h-full">
      <div style={{ width: '100%', height: `${containerHeight}px` }}>
        <ChartContainer config={chartConfig} className="w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 250, bottom: 5 }} barCategoryGap="30%">
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                interval={0}
                tick={<CustomYAxisTick data={data} fullCsvData={fullCsvData} userFlaggedResponses={userFlaggedResponses} aiFlaggedResponses={aiFlaggedResponses} onToggleFlagged={onToggleFlagged} />}
                width={1}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--accent))' }}
                content={<ChartTooltipContent />}
              />
              <Bar dataKey="count" radius={4} barSize={20}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
      <div className="p-4 pt-0 mt-auto">
        <ResponseListModal 
            allResponses={allResponses}
            question={question}
            fullCsvData={fullCsvData}
            userFlaggedResponses={userFlaggedResponses || []}
            onToggleFlagged={onToggleFlagged || (() => {})}
            aiFlaggedResponses={aiFlaggedResponses || []}
        >
            <Button variant="outline" className="w-full">
                <List className="mr-2 h-4 w-4" />
                View All ({allResponses.length})
            </Button>
        </ResponseListModal>
      </div>
    </div>
  );
}
