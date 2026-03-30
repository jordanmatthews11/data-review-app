
'use client';

import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/data-table';
import type { CsvData } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ColumnDef } from '@tanstack/react-table';
import { parseLinksFromCell } from '@/lib/csv-analysis';

const renderCellContent = (cell: any) => {
    const value = cell.getValue();
    if (value === null || typeof value === 'undefined' || value === '') {
        return <span className="text-muted-foreground">—</span>;
    }

    const textValue = String(value);
    const links = parseLinksFromCell(textValue);
    
    if (links.length > 0) {
        return (
            <div className="flex flex-col gap-1">
                {links.map((link, index) => (
                    <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                        title={link.url}
                    >
                        {link.label || 'View Link'}
                    </a>
                ))}
            </div>
        );
    }
    
    return <span className="truncate" title={textValue}>{textValue}</span>;
}

export default function TablePage() {
    const [data, setData] = useState<CsvData>([]);
    const [fileName, setFileName] = useState<string | null>(null);

    useEffect(() => {
        const storedData = sessionStorage.getItem('csvData');
        const storedFileName = sessionStorage.getItem('csvFileName');
        if (storedData) {
            setData(JSON.parse(storedData));
        }
        if (storedFileName) {
            setFileName(storedFileName);
        }
    }, []);

    const columns: ColumnDef<Record<string, any>>[] = useMemo(() => {
        if (data.length === 0) return [];
        const headers = Object.keys(data[0]);
        return headers.map(header => ({
            accessorKey: header,
            header: () => <div className="font-semibold">{header}</div>,
            cell: ({ cell }) => renderCellContent(cell),
            size: header.toLowerCase().includes('photo') || header.toLowerCase().includes('video') ? 300 : 200,
            enableColumnFilter: true,
            filterFn: 'array',
        }));
    }, [data]);

    if (!fileName) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                 <Alert className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Data Found</AlertTitle>
                    <AlertDescription>
                        It looks like no CSV data was loaded. Please go back to the dashboard to upload a file first.
                    </AlertDescription>
                </Alert>
                <Button asChild>
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="h-screen w-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{fileName}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                    <h1 className="text-2xl font-bold">Data Table</h1>
                    <Button asChild variant="outline">
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                </div>
            </header>
            <div className="flex-grow min-h-0">
                {data.length > 0 ? (
                    <DataTable columns={columns} data={data} />
                ) : (
                    <p>Loading data...</p>
                )}
            </div>
        </div>
    );
}
