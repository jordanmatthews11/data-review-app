

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { CsvData, AnalyzedQuestion, QuestionType, MultipleChoiceData, NumericData, OpenEndedData, QuestionData, PhotoGridData, PhotoInfo, OpenEndedAnswer, CoordinateData, ParsedLink, NumericValueWithResponse, OptionWithResponses, ShelfRow } from '@/types';

const KNOWN_METADATA_HEADERS = [
    /Response Group ID/i,
    /Store Name/i,
    /Address/i,
    /City/i,
    /State/i,
    /Zip/i,
    /Agent ID/i,
    /Latitude/i,
    /Longitude/i,
    /Photo #\d+$/i, // Photo columns are handled separately
    /Project ID/i,
    /Job ID/i,
    /Job Name/i,
    /Job Name \(Internal\)/i,
    /Job Custom Data/i,
    /Location Status/i,
    /Location ID/i,
    /Location Name/i,
    /Location Address 1/i,
    /Location Address 2/i,
    /Location City/i,
    /Location State/i,
    /Location Zip/i,
    /Location Latitude/i,
    /Location Longitude/i,
    /Agent Date & Timestamp - Local Time/i,
    /Location List/i,
    /Quota/i,
    /Tags/i,
];

export const QUESTION_COLUMN_REGEX = /^Q\d+: /i;
const PHOTO_COLUMN_REGEX = /Photo #\d+$/i;
export const RESPONSE_ID_COLUMN_REGEX = /Response Group ID/i;
const STORE_NAME_REGEX = /Store Name/i;
const ADDRESS_REGEX = /Address/i;
const CITY_REGEX = /City/i;
const STATE_REGEX = /State/i;
const ZIP_REGEX = /Zip/i;
export const AGENT_ID_REGEX = /Agent ID/i;
const LATITUDE_REGEX = /Latitude/i;
const LONGITUDE_REGEX = /Longitude/i;
const MAX_UNIQUE_FOR_MULTIPLE_CHOICE = 10;
const MIN_ROWS_FOR_ANALYSIS = 3;
const HYPERLINK_REGEX = /HYPERLINK\("([^"]+)"(?:,\s*"([^"]+)")?\)/i;
const RAW_URL_REGEX = /(https?:\/\/[^\s,"]+\.(?:jpg|jpeg|png|gif|mp4|mov))/i;
const VIDEO_URL_REGEX = /\.(mp4|mov)$/i;

export const parseLinksFromCell = (value: string): ParsedLink[] => {
    if (typeof value !== 'string' || !value) {
        return [];
    }

    const links: ParsedLink[] = [];
    
    // 1. Replace Excel's double quotes for escaping
    // 2. Trim whitespace and potential surrounding quotes
    let sanitizedValue = value.replace(/""/g, '"').trim();
    if (sanitizedValue.startsWith('"') && sanitizedValue.endsWith('"')) {
         sanitizedValue = sanitizedValue.substring(1, sanitizedValue.length - 1);
    }
    
    // 3. Remove leading '=' if it exists
    if (sanitizedValue.startsWith('=')) {
        sanitizedValue = sanitizedValue.substring(1);
    }

    // Now `sanitizedValue` should be just `HYPERLINK(...)`
    const hyperlinkMatch = sanitizedValue.match(HYPERLINK_REGEX);
    if (hyperlinkMatch) {
        links.push({ url: hyperlinkMatch[1], label: hyperlinkMatch[2] || 'View Link' });
        return links;
    }

    // If no HYPERLINK, check for raw URLs as a fallback
    const rawUrlMatch = value.match(RAW_URL_REGEX); // Use original value for raw URL matching
    if (rawUrlMatch) {
        links.push({ url: rawUrlMatch[0], label: 'View Link' });
    }

    return links;
};

export const parseFile = (file: File): Promise<Record<string, CsvData>> => {
  return new Promise((resolve, reject) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            // Return data even if there are non-critical errors
          }
          if (!results.data || results.data.length === 0) {
              reject(new Error('CSV file is empty or could not be parsed.'));
          }
          resolve({ [file.name]: results.data as CsvData });
        },
        error: (error: Error) => {
          reject(error);
        },
      });
    } else if (fileExtension === 'xlsx') {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                if (!data) {
                    reject(new Error('Failed to read XLSX file.'));
                    return;
                }
                const workbook = XLSX.read(data, { type: 'array' });
                
                const allSheetsData: Record<string, CsvData> = {};

                if (workbook.SheetNames.length === 0) {
                    reject(new Error('XLSX file contains no sheets.'));
                    return;
                }

                for (const sheetName of workbook.SheetNames) {
                    const worksheet = workbook.Sheets[sheetName];
                    if (!worksheet) continue;

                    const sheetAsArray: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
                    if (sheetAsArray.length < 1) continue;
                    
                    const headers = sheetAsArray[0] as string[];
                    if (!headers || headers.every(h => !h)) continue;

                    const jsonData: CsvData = [];

                    for (let i = 1; i < sheetAsArray.length; i++) {
                        const dataRow = sheetAsArray[i];
                        if (!dataRow || dataRow.every(cell => cell === null)) continue; 
                        
                        const rowObject: Record<string, string> = {};

                        headers.forEach((header, colIndex) => {
                            if (!header) return; 

                            const cellRef = XLSX.utils.encode_cell({ r: i, c: colIndex });
                            const cell = worksheet[cellRef];
                            let finalValue = "";

                            if (cell) {
                                if (cell.l && cell.l.Target) {
                                    const url = cell.l.Target;
                                    const text = cell.w || 'View Link';
                                    finalValue = `=HYPERLINK("${url}","${text.replace(/"/g, '""')}")`;
                                } else if (cell.f && cell.f.toUpperCase().includes('HYPERLINK')) {
                                    finalValue = cell.f.startsWith('=') ? cell.f : `=${cell.f}`;
                                } else if (cell.w) {
                                    finalValue = String(cell.w);
                                } else if (cell.v !== null && cell.v !== undefined) {
                                    finalValue = String(cell.v);
                                }
                            }
                            
                            if (finalValue === "" && dataRow[colIndex] !== null && dataRow[colIndex] !== undefined) {
                                finalValue = String(dataRow[colIndex]);
                            }
                            
                            rowObject[header] = finalValue;
                        });

                        headers.forEach(header => {
                            if (header && !Object.prototype.hasOwnProperty.call(rowObject, header)) {
                                rowObject[header] = "";
                            }
                        });

                        jsonData.push(rowObject);
                    }
                    if (jsonData.length > 0) {
                        allSheetsData[sheetName] = jsonData;
                    }
                }
                
                if (Object.keys(allSheetsData).length === 0) {
                    reject(new Error('XLSX file has no data rows in any sheet.'));
                    return;
                }

                resolve(allSheetsData);
            } catch (err) {
                console.error("Error parsing XLSX:", err);
                reject(err instanceof Error ? err : new Error('An unknown error occurred during XLSX parsing.'));
            }
        };
        reader.onerror = (error) => {
            reject(error);
        };
        reader.readAsArrayBuffer(file);
    } else {
        reject(new Error('Unsupported file type. Please upload a .csv or .xlsx file.'));
    }
  });
};

const extractUrl = (value: string): string | null => {
    const links = parseLinksFromCell(value);
    return links.length > 0 ? links[0].url : null;
}

const isVideoUrl = (text: string) => {
    if (!text) return false;
    const lowercasedText = text.toLowerCase();
    return lowercasedText.startsWith('http') && VIDEO_URL_REGEX.test(lowercasedText);
}

const detectQuestionType = (header: string, columnData: { value: string; row: Record<string, string> }[]): { type: QuestionType, data: QuestionData } => {
  const headers = Object.keys(columnData[0].row);
  const responseIdHeader = findResponseIdHeader(headers) || GENERATED_ID_COLUMN;

  const nonEmptyData = columnData
    .filter(item => item.value != null && item.value.trim() !== '')
    .map(item => ({...item, responseId: item.row[responseIdHeader] }));

  if (nonEmptyData.length < MIN_ROWS_FOR_ANALYSIS) {
      return { type: 'unknown', data: { answers: [] } as OpenEndedData };
  }

  const storeNameHeader = headers.find(h => STORE_NAME_REGEX.test(h));
  const addressHeader = headers.find(h => ADDRESS_REGEX.test(h));
  const cityHeader = headers.find(h => CITY_REGEX.test(h));
  const stateHeader = headers.find(h => STATE_REGEX.test(h));
  const zipHeader = headers.find(h => ZIP_REGEX.test(h));
  const agentIdHeader = headers.find(h => AGENT_ID_REGEX.test(h));

  // Check for Photo Grid
  if (PHOTO_COLUMN_REGEX.test(header) || header.toLowerCase().includes('photo')) {
    const photos: PhotoInfo[] = nonEmptyData.map(item => {
        const url = extractUrl(item.value);
        if (!url) return null;

        return {
            url,
            question: header,
            responseId: responseIdHeader ? item.row[responseIdHeader] : undefined,
            storeName: storeNameHeader ? item.row[storeNameHeader] : undefined,
            address: addressHeader ? item.row[addressHeader] : undefined,
            city: cityHeader ? item.row[cityHeader] : undefined,
            state: stateHeader ? item.row[stateHeader] : undefined,
            zip: zipHeader ? item.row[zipHeader] : undefined,
            agentId: agentIdHeader ? item.row[agentIdHeader] : undefined,
        }
    }).filter((p): p is PhotoInfo => p !== null);

    if (photos.length / nonEmptyData.length > 0.8) {
      return { type: 'photo-grid', data: { photos } as PhotoGridData };
    }
  }
  
  // Attempt to convert to numbers
  const numericData: NumericValueWithResponse[] = nonEmptyData
    .map(item => ({ value: Number(item.value), responseId: item.responseId }))
    .filter(item => !isNaN(item.value));

  if (numericData.length / nonEmptyData.length > 0.8) {
    return { type: 'numeric', data: { values: numericData } as NumericData };
  }

  // Check for multiple choice
  const uniqueValues = new Map<string, { count: number, responses: { id: string, value: string }[] }>();
  nonEmptyData.forEach(item => {
      const existing = uniqueValues.get(item.value) || { count: 0, responses: [] };
      existing.count++;
      existing.responses.push({ id: item.responseId, value: item.value });
      uniqueValues.set(item.value, existing);
  });

  if (uniqueValues.size > 0 && uniqueValues.size <= MAX_UNIQUE_FOR_MULTIPLE_CHOICE) {
    const options: OptionWithResponses[] = Array.from(uniqueValues.entries())
      .map(([name, data]) => ({ name, count: data.count, responses: data.responses }))
      .sort((a, b) => b.count - a.count);
    return { type: 'multiple-choice', data: { options } as MultipleChoiceData };
  }

  const openEndedAnswers: OpenEndedAnswer[] = nonEmptyData.map(item => ({
    answer: item.value,
    responseId: item.responseId,
  }));

  // Check if open-ended answers are videos
  const videoCount = openEndedAnswers.filter(a => isVideoUrl(a.answer)).length;
  if (nonEmptyData.length > 0 && (videoCount / nonEmptyData.length) > 0.8) {
    return { type: 'video', data: { answers: openEndedAnswers } as OpenEndedData };
  }

  // Default to open-ended
  return { type: 'open-ended', data: { answers: openEndedAnswers } as OpenEndedData };
};

export const GENERATED_ID_COLUMN = '__generated_row_id__';

export const findResponseIdHeader = (headers: string[]): string | undefined =>
  headers.find(h => RESPONSE_ID_COLUMN_REGEX.test(h));

/**
 * Headers that may contain one image URL per cell (same heuristic as photo-grid detection).
 * Order matches the first row's key order.
 */
export function getPhotoColumnHeaders(headers: string[]): string[] {
  return headers.filter(h => PHOTO_COLUMN_REGEX.test(h) || h.toLowerCase().includes('photo'));
}

/**
 * Build row-level groups for Shelf View: each row with at least one parsed image URL
 * from photo columns, photos ordered left-to-right by column order.
 * Ensures `__generated_row_id__` exists when Response Group ID is missing (mutates `data` like analyzeData).
 */
export function buildShelfRowsFromCsv(data: CsvData): ShelfRow[] {
  if (!data || data.length === 0) {
    return [];
  }

  const headers = Object.keys(data[0]);
  let idHeader = findResponseIdHeader(headers);

  if (!idHeader) {
    idHeader = GENERATED_ID_COLUMN;
    data.forEach((row, idx) => {
      if (!row[GENERATED_ID_COLUMN]) {
        row[GENERATED_ID_COLUMN] = `row-${idx + 1}`;
      }
    });
  }

  const photoHeaders = getPhotoColumnHeaders(headers);
  if (photoHeaders.length === 0) {
    return [];
  }

  const storeNameHeader = headers.find(h => STORE_NAME_REGEX.test(h));
  const addressHeader = headers.find(h => ADDRESS_REGEX.test(h));
  const cityHeader = headers.find(h => CITY_REGEX.test(h));
  const stateHeader = headers.find(h => STATE_REGEX.test(h));
  const zipHeader = headers.find(h => ZIP_REGEX.test(h));
  const agentIdHeader = headers.find(h => AGENT_ID_REGEX.test(h));
  const jobNameHeader =
    headers.find(h => /^Job Name$/i.test(h.trim())) ??
    headers.find(h => /Job Name/i.test(h) && !/Internal/i.test(h));
  const locationNameHeader = headers.find(h => /Location Name/i.test(h));

  const rows: ShelfRow[] = [];

  data.forEach((row, rowIndex) => {
    const responseId = row[idHeader] || `row-${rowIndex + 1}`;
    const photos: PhotoInfo[] = [];

    for (const header of photoHeaders) {
      const value = row[header] ?? '';
      const links = parseLinksFromCell(value);
      for (const link of links) {
        if (isVideoUrl(link.url)) {
          continue;
        }
        photos.push({
          url: link.url,
          question: header,
          responseId,
          storeName: storeNameHeader ? row[storeNameHeader] : undefined,
          address: addressHeader ? row[addressHeader] : undefined,
          city: cityHeader ? row[cityHeader] : undefined,
          state: stateHeader ? row[stateHeader] : undefined,
          zip: zipHeader ? row[zipHeader] : undefined,
          agentId: agentIdHeader ? row[agentIdHeader] : undefined,
        });
      }
    }

    if (photos.length === 0) {
      return;
    }

    const jobName = jobNameHeader ? row[jobNameHeader] : undefined;
    const locFromLocation = locationNameHeader ? row[locationNameHeader] : '';
    const locFromStore = storeNameHeader ? row[storeNameHeader] : '';
    const locationLabel = [locFromLocation, locFromStore].filter(Boolean).join(' — ') || undefined;
    const agentLabel = agentIdHeader ? row[agentIdHeader] : undefined;

    rows.push({
      rowIndex,
      responseId,
      photos,
      jobName: jobName?.trim() || undefined,
      locationLabel,
      agentLabel: agentLabel?.trim() || undefined,
    });
  });

  return rows;
}

export const analyzeData = (data: CsvData): AnalyzedQuestion[] => {
  if (!data || data.length === 0) {
    return [];
  }

  const headers = Object.keys(data[0]);
  let responseIdHeader = findResponseIdHeader(headers);

  if (!responseIdHeader) {
    responseIdHeader = GENERATED_ID_COLUMN;
    data.forEach((row, idx) => {
      row[GENERATED_ID_COLUMN] = `row-${idx + 1}`;
    });
  }
  
  const questionColumns = headers.filter(h => QUESTION_COLUMN_REGEX.test(h));
  
  const analysis: AnalyzedQuestion[] = questionColumns.map(header => {
    const columnData = data.map(row => ({
      value: row[header],
      row,
    }));

    const { type, data: questionData } = detectQuestionType(header, columnData);

    return {
      id: header,
      question: header,
      type,
      data: questionData,
      rowCount: columnData.length,
    };
  });
  
  // Add photo columns separately regardless of where they appear
  const photoColumns = headers.filter(h => PHOTO_COLUMN_REGEX.test(h) || h.toLowerCase().includes('photo'));
  photoColumns.forEach(header => {
    // Avoid re-analyzing if it was already part of questionColumns
    if (analysis.some(a => a.id === header)) return;

    const columnData = data.map(row => ({
      value: row[header],
      row,
    }));
    const { type, data: questionData } = detectQuestionType(header, columnData);
    if (type === 'photo-grid') {
      analysis.push({
        id: header,
        question: header,
        type,
        data: questionData,
        rowCount: columnData.length,
      });
    }
  });
  
  return analysis.filter(q => q.type !== 'unknown');
};

export const extractCoordinates = (data: CsvData): CoordinateData[] => {
  if (!data || data.length === 0) {
    return [];
  }

  const headers = Object.keys(data[0]);
  const latHeader = headers.find(h => LATITUDE_REGEX.test(h));
  const lngHeader = headers.find(h => LONGITUDE_REGEX.test(h));

  if (!latHeader || !lngHeader) {
    console.warn("Could not find Latitude/Longitude columns in the CSV data.");
    return [];
  }

  return data.map((row, index) => {
    const lat = parseFloat(row[latHeader]);
    const lng = parseFloat(row[lngHeader]);

    if (isNaN(lat) || isNaN(lng)) {
      return null;
    }

    return {
      id: `response-${index}`,
      position: { lat, lng },
      ...row
    };
  }).filter((c): c is CoordinateData => c !== null);
};

