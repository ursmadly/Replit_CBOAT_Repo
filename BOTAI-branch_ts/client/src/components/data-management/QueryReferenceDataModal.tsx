import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Database, ExternalLink } from "lucide-react";
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ReferenceData {
  id: string;
  queryId: string;
  dataSource: string;
  recordId: string;
  patientId: string;
  visitId?: string;
  dataPoints: Record<string, any>;
  createdAt: Date;
}

interface Query {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'assigned' | 'in-review' | 'resolved';
  dataSources: string[];
  referenceData?: string;
}

interface QueryReferenceDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: Query | null;
  referenceData: ReferenceData | null | undefined;
}

export const QueryReferenceDataModal: React.FC<QueryReferenceDataModalProps> = ({
  isOpen,
  onClose,
  query,
  referenceData
}) => {
  if (!query || !referenceData) {
    return null;
  }

  // Function to format data values nicely
  const formatValue = (key: string, value: any): JSX.Element | string => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">Not available</span>;
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    if (key.toLowerCase().includes('date') && typeof value === 'string') {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString();
        }
      } catch (e) {
        // If parsing fails, return the original string
      }
    }
    
    return String(value);
  };

  // Get all keys from the data points
  const dataPointKeys = Object.keys(referenceData.dataPoints);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Reference Data for Query {query.id}
          </DialogTitle>
          <DialogDescription>
            Showing data that was used to identify the issue in {referenceData.dataSource}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 py-2">
          <div>
            <span className="text-sm font-medium">Data Source:</span>
            <Badge className="ml-2" variant="outline">{referenceData.dataSource}</Badge>
          </div>
          <div>
            <span className="text-sm font-medium">Record ID:</span>
            <span className="ml-2 text-sm">{referenceData.recordId}</span>
          </div>
          <div>
            <span className="text-sm font-medium">Patient ID:</span>
            <span className="ml-2 text-sm">{referenceData.patientId}</span>
          </div>
          {referenceData.visitId && (
            <div>
              <span className="text-sm font-medium">Visit ID:</span>
              <span className="ml-2 text-sm">{referenceData.visitId}</span>
            </div>
          )}
        </div>

        <Separator />

        <Tabs defaultValue="table">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="raw">Raw Data</TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="overflow-hidden">
            <ScrollArea className="h-[400px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Field</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataPointKeys.map((key) => (
                    <TableRow key={key}>
                      <TableCell className="font-medium">{key}</TableCell>
                      <TableCell>{formatValue(key, referenceData.dataPoints[key])}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="raw">
            <ScrollArea className="h-[400px] rounded-md border p-4">
              <pre className="text-xs">
                {JSON.stringify(referenceData.dataPoints, null, 2)}
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="bg-amber-50 border border-amber-200 p-3 rounded-md mt-2 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Query Description</p>
            <p className="text-sm text-amber-700 mt-1">{query.description}</p>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
          <Button 
            variant="outline" 
            size="sm"
            className="gap-1"
            onClick={onClose}
          >
            Close
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="gap-1"
          >
            <ExternalLink className="h-4 w-4" />
            View in Data Explorer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};