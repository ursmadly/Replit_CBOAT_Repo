import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  RefreshCw, 
  RefreshCcw, 
  CheckCircle, 
  AlertCircle, 
  Database, 
  Download, 
  FileText, 
  FileSpreadsheet 
} from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportToCSV, exportToExcel } from "@/lib/utils/exportUtils";

export type DataSource = {
  id: number;
  name: string; 
  type: string;
  queriesTotal: number;
  queriesOpen: number;
  queriesOverdue: number;
  lastSync: string;
  status: 'connected' | 'disconnected' | 'error';
};

interface DataSourcesTableProps {
  dataSources: DataSource[];
  isLoading: boolean;
  onSync?: (sourceId: number) => void;
}

export default function DataSourcesTable({ 
  dataSources = [], 
  isLoading = false,
  onSync
}: DataSourcesTableProps) {
  const [syncingSource, setSyncingSource] = useState<number | null>(null);

  const handleSync = async (sourceId: number) => {
    setSyncingSource(sourceId);
    try {
      if (onSync) {
        await onSync(sourceId);
      }
      // Simulate sync
      await new Promise(resolve => setTimeout(resolve, 1500));
    } finally {
      setSyncingSource(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" /> Connected</Badge>;
      case 'disconnected':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Disconnected</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><AlertCircle className="h-3 w-3 mr-1" /> Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (dataSources.length === 0) {
    return (
      <div className="border rounded-md p-6 flex flex-col items-center justify-center text-center h-64">
        <Database className="h-10 w-10 text-gray-400 mb-3" />
        <h3 className="text-lg font-medium mb-1">No Data Sources Connected</h3>
        <p className="text-sm text-gray-500 mb-4">Connect data sources in the system settings</p>
        <Button variant="outline" size="sm">Go to Settings</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Export Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => exportToCSV(dataSources, 'Data_Sources')}>
              <FileText className="h-4 w-4 mr-2" />
              <span>Export to CSV</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportToExcel(dataSources, 'Data_Sources')}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              <span>Export to Excel</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Total Queries</TableHead>
            <TableHead>Open Queries</TableHead>
            <TableHead>Last Sync</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dataSources.map((source) => (
            <TableRow key={source.id}>
              <TableCell className="font-medium">{source.name}</TableCell>
              <TableCell>{source.type}</TableCell>
              <TableCell>{source.queriesTotal}</TableCell>
              <TableCell>
                {source.queriesOpen > 0 ? (
                  <span className="text-amber-600 font-medium">{source.queriesOpen}</span>
                ) : (
                  source.queriesOpen
                )}
                {source.queriesOverdue > 0 && (
                  <span className="ml-2 text-xs text-red-600 font-medium">({source.queriesOverdue} overdue)</span>
                )}
              </TableCell>
              <TableCell>
                {source.lastSync ? 
                  format(new Date(source.lastSync), "MMM dd, yyyy HH:mm") : 
                  "Never"
                }
              </TableCell>
              <TableCell>{getStatusBadge(source.status)}</TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="ghost" 
                  size="sm"
                  disabled={syncingSource === source.id}
                  onClick={() => handleSync(source.id)}
                >
                  {syncingSource === source.id ? (
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <RefreshCcw className="h-4 w-4 mr-1" />
                  )}
                  Sync
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}