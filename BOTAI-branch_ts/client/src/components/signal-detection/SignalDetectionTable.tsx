import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportToCSV, exportToExcel } from "@/lib/utils/exportUtils";

interface SignalDetectionTableProps {
  priorityFilter: string | null;
}

type Signal = {
  id: number;
  detectionId: string;
  trialId: number;
  siteId: number | null;
  title: string;
  signalType: string;
  detectionType: string;
  observation: string;
  dataReference: string | null;
  detectionDate: string;
  priority: string;
  status: string;
  createdBy: string;
  createdAt: string;
  assignedTo: string | null;
  dueDate: string | null;
  notifiedPersons: string[] | null;
};

export default function SignalDetectionTable({ priorityFilter }: SignalDetectionTableProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: signals = [], isLoading } = useQuery<Signal[]>({
    queryKey: ['/api/signaldetections'],
    queryFn: () => apiRequest('/api/signaldetections'),
    refetchOnWindowFocus: true
  });
  
  // Filter signals based on priority if needed
  const filteredSignals = priorityFilter 
    ? signals.filter(signal => signal.priority.toLowerCase() === priorityFilter.toLowerCase())
    : signals;

  const getPriorityBadge = (priority: string) => {
    const priorityClass = {
      critical: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800"
    };
    
    const priorityKey = priority.toLowerCase() as keyof typeof priorityClass;
    const className = priorityClass[priorityKey] || "bg-gray-100 text-gray-800";
    
    return <Badge className={className}>{priority}</Badge>;
  };
  
  const getStatusBadge = (status: string) => {
    const statusClass = {
      open: "bg-blue-100 text-blue-800",
      in_progress: "bg-purple-100 text-purple-800",
      resolved: "bg-green-100 text-green-800",
      closed: "bg-gray-100 text-gray-800"
    };
    
    const formattedStatus = status.toLowerCase().replace(/\s+/g, "_");
    const statusKey = formattedStatus as keyof typeof statusClass;
    const className = statusClass[statusKey] || "bg-gray-100 text-gray-800";
    
    return <Badge className={className}>{status}</Badge>;
  };
  
  // Function to determine signal type based on detection ID prefix
  const determineSignalTypeFromId = (detectionId: string): string => {
    if (detectionId.startsWith('ST_Risk')) return 'Site Risk';
    if (detectionId.startsWith('SF_Risk')) return 'Safety Risk';
    if (detectionId.startsWith('PD_Risk')) return 'PD Risk';
    if (detectionId.startsWith('LAB_Risk')) return 'LAB Testing Risk';
    if (detectionId.startsWith('ENR_Risk')) return 'Enrollment Risk';
    if (detectionId.startsWith('AE_Risk')) return 'AE Risk';
    
    // Default fallback
    return 'Site Risk';
  };

  // Function to handle navigation to signal details with proper path
  const handleViewSignalDetails = (signalId: number) => {
    // Make sure to invalidate the signal details query to ensure fresh data when viewing
    queryClient.invalidateQueries({ queryKey: [`/api/signaldetections/${signalId}`] });
    setLocation(`/signaldetection/details/${signalId}`);
  };

  return (
    <div>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredSignals.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No signals found
        </div>
      ) : (
        <div className="overflow-x-auto">
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
                <DropdownMenuItem onClick={() => exportToCSV(filteredSignals, 'Signal_Detections')}>
                  <FileText className="h-4 w-4 mr-2" />
                  <span>Export to CSV</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportToExcel(filteredSignals, 'Signal_Detections')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  <span>Export to Excel</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Detection ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Signal Type</TableHead>
                <TableHead>Detection Type</TableHead>
                <TableHead>Detection Date</TableHead>
                <TableHead>Data Reference</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSignals.map((signal) => (
                <TableRow key={signal.id} className="hover:bg-neutral-50">
                  <TableCell className="font-medium">{signal.detectionId}</TableCell>
                  <TableCell>{signal.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {signal.signalType || determineSignalTypeFromId(signal.detectionId)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {signal.detectionType || "Manual"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(signal.detectionDate).toLocaleDateString()}</TableCell>
                  <TableCell>{signal.dataReference || "N/A"}</TableCell>
                  <TableCell>{signal.createdBy}</TableCell>
                  <TableCell>{getPriorityBadge(signal.priority)}</TableCell>
                  <TableCell>{getStatusBadge(signal.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 px-2 text-neutral-600"
                      onClick={() => handleViewSignalDetails(signal.id)}
                    >
                      <span className="material-icons text-sm">visibility</span>
                      <span className="ml-1">View</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}