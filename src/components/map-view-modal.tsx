
'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useApiIsLoaded,
} from '@vis.gl/react-google-maps';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { extractCoordinates, parseLinksFromCell } from '@/lib/csv-analysis';
import type { CsvData, CoordinateData } from '@/types';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Table, TableBody, TableCell, TableRow } from './ui/table';

interface MapViewModalProps {
  data: CsvData;
  children: React.ReactNode;
}

// Centered on the continental US
const US_CENTER = { lat: 39.8283, lng: -98.5795 };

const renderCellContent = (value: any) => {
    const textValue = String(value ?? '');
    if (!textValue) {
        return <span className="text-muted-foreground">—</span>;
    }

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
    
    return textValue;
};


const MapContainer = ({ coordinates }: { coordinates: CoordinateData[] }) => {
  const [selectedMarker, setSelectedMarker] = useState<CoordinateData | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const isApiLoaded = useApiIsLoaded();

  useEffect(() => {
    const originalAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      setAuthError('The Google Maps API requires billing to be enabled on your project. In development, you may see this as a full-screen error overlay; it can be safely dismissed with the \'Esc\' key.');
    };
    // Cleanup the global callback when the component unmounts
    return () => {
      (window as any).gm_authFailure = originalAuthFailure;
    };
  }, []);


  if (authError) {
     return (
        <div className="p-8">
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Map Error: Billing Not Enabled</AlertTitle>
                <AlertDescription>
                    {authError}
                    <p className='mt-2'>To resolve this permanently, please visit the <a href="https://console.cloud.google.com/project/_/billing/enable" target='_blank' rel="noopener noreferrer" className='font-semibold underline'>Google Cloud Console</a> and enable billing.</p>
                </AlertDescription>
            </Alert>
        </div>
      );
  }

  if (!isApiLoaded) {
      return (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium text-muted-foreground">Loading Map...</p>
          </div>
      );
  }

  return (
      <Map
        defaultCenter={US_CENTER}
        defaultZoom={4}
        gestureHandling={'greedy'}
        mapId={'datareviewai-map'}
        className="w-full h-full"
        zoomControl={true}
        streetViewControl={false}
        mapTypeControl={false}
        fullscreenControl={false}
      >
        {coordinates.map((coord) => (
          <AdvancedMarker 
              key={coord.id} 
              position={coord.position}
              onClick={() => setSelectedMarker(coord)}
          >
            <Pin 
              background={'hsl(var(--primary))'}
              borderColor={'hsl(var(--primary))'}
              glyphColor={'hsl(var(--primary-foreground))'}
            />
          </AdvancedMarker>
        ))}

        {selectedMarker && (
          <InfoWindow 
              position={selectedMarker.position}
              onCloseClick={() => setSelectedMarker(null)}
              minWidth={350}
              maxWidth={500}
          >
              <div className='space-y-2'>
                  <h3 className="font-bold text-base">{selectedMarker['Store Name'] || 'Response Details'}</h3>
                  <ScrollArea className="h-48">
                      <Table>
                        <TableBody>
                          {Object.entries(selectedMarker).map(([key, value]) => {
                              if (key === 'position' || key === 'id') return null;
                              return(
                                  <TableRow key={key}>
                                    <TableCell className="font-medium text-muted-foreground p-1 pr-2 align-top">{key}</TableCell>
                                    <TableCell className="p-1">{renderCellContent(value)}</TableCell>
                                  </TableRow>
                              )
                          })}
                        </TableBody>
                      </Table>
                  </ScrollArea>
              </div>
          </InfoWindow>
        )}
      </Map>
  );
};


export function MapViewModal({ data, children }: MapViewModalProps) {
  const coordinates = useMemo(() => extractCoordinates(data), [data]);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const renderContent = () => {
    if (!apiKey) {
      return (
        <div className="p-8">
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Configuration Error</AlertTitle>
                <AlertDescription>
                    The Google Maps API key is missing. Please add it to your .env file as 
                    <code className="font-mono bg-destructive/20 p-1 rounded-sm mx-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>
                    to enable the map view.
                </AlertDescription>
            </Alert>
        </div>
      );
    }
    
    if (coordinates.length === 0) {
        return (
            <div className="p-8">
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>No Coordinates Found</AlertTitle>
                    <AlertDescription>
                       We could not find "Latitude" and "Longitude" columns in your CSV file. Please ensure these columns exist to use the map view.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
      <APIProvider apiKey={apiKey}>
        <MapContainer coordinates={coordinates} />
      </APIProvider>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Response Map View</DialogTitle>
        </DialogHeader>
        <div className="flex-grow min-h-0">
            {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
