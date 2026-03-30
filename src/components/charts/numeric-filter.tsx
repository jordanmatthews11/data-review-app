
'use client';

import { useEffect, useMemo, useState } from 'react';
import type { NumericData } from '@/types';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface NumericFilterProps {
    data: NumericData;
    onFlagOutliers: (filters: { min: number | null; max: number | null }) => void;
}

export function NumericFilter({ data, onFlagOutliers }: NumericFilterProps) {
    const [minStr, setMinStr] = useState('');
    const [maxStr, setMaxStr] = useState('');

    const { initialMin, initialMax } = useMemo(() => {
        if (data.values.length === 0) {
            return { initialMin: 0, initialMax: 0 };
        }
        const values = data.values.map(v => v.value);
        return {
            initialMin: Math.min(...values),
            initialMax: Math.max(...values),
        }
    }, [data]);
    
    useEffect(() => {
        const min = minStr === '' ? null : Number(minStr);
        const max = maxStr === '' ? null : Number(maxStr);
        onFlagOutliers({ min, max });
    }, [minStr, maxStr, onFlagOutliers]);


    return (
        <div className="flex items-end gap-2">
            <div className="flex-grow grid grid-cols-2 gap-2">
                <div className="space-y-1">
                    <Label htmlFor="min-filter" className="text-xs text-muted-foreground">Min</Label>
                    <Input
                        id="min-filter"
                        type="number"
                        value={minStr}
                        onChange={(e) => setMinStr(e.target.value)}
                        placeholder={String(initialMin)}
                        className="h-8 text-xs"
                    />
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="max-filter" className="text-xs text-muted-foreground">Max</Label>
                    <Input
                        id="max-filter"
                        type="number"
                        value={maxStr}
                        onChange={(e) => setMaxStr(e.target.value)}
                        placeholder={String(initialMax)}
                        className="h-8 text-xs"
                    />
                </div>
            </div>
        </div>
    );
}
