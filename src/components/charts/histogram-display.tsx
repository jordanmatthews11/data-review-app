
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import type { NumericData } from '@/types';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

interface HistogramDisplayProps {
  data: NumericData;
}

const createHistogramData = (data: NumericData, numBins = 10) => {
  const values = data.values.map(item => item.value);
  
  if (values.length === 0) return [];
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  if (min === max) {
    return [{ name: `${min}`, count: values.length }];
  }

  // Sturges' formula for number of bins, with guard rails
  if (values.length > 2) {
    numBins = Math.ceil(1 + Math.log2(values.length));
  } else {
    numBins = values.length;
  }
  if (numBins > 20) numBins = 20;
  if (numBins < 2) numBins = 2;


  const binSize = (max - min) / numBins;
  const bins = Array.from({ length: numBins }, (_, i) => {
    const binStart = min + i * binSize;
    const binEnd = binStart + binSize;
    return {
      name: `${Math.round(binStart * 10) / 10}-${Math.round(binEnd * 10) / 10}`,
      count: 0,
      start: binStart,
      end: binEnd,
    };
  });

  values.forEach(value => {
    let binIndex = Math.floor((value - min) / binSize);
    // Handle the max value which would otherwise fall out of bounds
    if (binIndex === numBins) binIndex--;
    if(bins[binIndex]) {
        bins[binIndex].count++;
    }
  });

  return bins.map(({ name, count }) => ({ name, count }));
};


export function HistogramDisplay({ data }: HistogramDisplayProps) {
  const histogramData = useMemo(() => createHistogramData(data), [data]);

  if (histogramData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        No numeric data available.
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[10rem]">
      <ChartContainer config={{
        count: {
          label: "Count",
          color: "hsl(var(--chart-2))",
        }
      }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={histogramData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={40}>
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={40}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              width={40}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--accent))' }}
              content={<ChartTooltipContent />}
            />
            <Bar dataKey="count" fill="var(--color-count)" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
