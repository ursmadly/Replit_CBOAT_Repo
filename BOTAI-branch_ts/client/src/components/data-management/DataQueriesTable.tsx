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
  ArrowRight, 
  Clock,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  AlertTriangle
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";

export type DataQuery = {
  id: string;
  source: string;
  sourceType: string;
  subject: string;
  site: string;
  queryText: string;
  status: 'open' | 'answered' | 'closed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  dueDate: string;
  assignedTo: string;
  form?: string;
  visit?: string;
};

interface DataQueriesTableProps {
  queries: DataQuery[];
  isLoading: boolean;
  filterStatus?: string;
  onQueryClick?: (queryId: string) => void;
}

export default function DataQueriesTable({ 
  queries = [], 
  isLoading = false,
  filterStatus = 'all',
  onQueryClick
}: DataQueriesTableProps) {
  
  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = isPast(new Date(dueDate)) && !isToday(new Date(dueDate));
    
    if (status === 'open' && isOverdue) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <AlertTriangle className="h-3 w-3 mr-1" /> Overdue
        </Badge>
      );
    }
    
    switch (status) {
      case 'open':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <CircleHelp className="h-3 w-3 mr-1" /> Open
          </Badge>
        );
      case 'answered':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Clock className="h-3 w-3 mr-1" /> Answered
          </Badge>
        );
      case 'closed':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CircleCheck className="h-3 w-3 mr-1" /> Closed
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertTriangle className="h-3 w-3 mr-1" /> Overdue
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Critical</Badge>;
      case 'high':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">High</Badge>;
      case 'medium':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Filter queries based on status if needed
  const filteredQueries = filterStatus === 'all' 
    ? queries 
    : queries.filter(q => q.status === filterStatus);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (filteredQueries.length === 0) {
    return (
      <div className="border rounded-md p-6 flex flex-col items-center justify-center text-center h-64">
        <CircleCheck className="h-10 w-10 text-green-400 mb-3" />
        <h3 className="text-lg font-medium mb-1">No Queries Found</h3>
        <p className="text-sm text-gray-500 mb-4">
          {filterStatus === 'all' 
            ? 'There are no data queries for this study' 
            : `No ${filterStatus} queries found`}
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Site</TableHead>
          <TableHead>Query</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Assigned To</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredQueries.map((query) => (
          <TableRow key={query.id}>
            <TableCell className="font-medium">{query.id}</TableCell>
            <TableCell>{query.subject}</TableCell>
            <TableCell>{query.site}</TableCell>
            <TableCell className="max-w-[300px] truncate">
              {query.queryText}
              {query.form && (
                <div className="text-xs text-gray-500 mt-1">
                  Form: {query.form}{query.visit ? ` / Visit: ${query.visit}` : ''}
                </div>
              )}
            </TableCell>
            <TableCell>{getStatusBadge(query.status, query.dueDate)}</TableCell>
            <TableCell>{getPriorityBadge(query.priority)}</TableCell>
            <TableCell>
              {format(new Date(query.dueDate), "MMM dd, yyyy")}
            </TableCell>
            <TableCell>{query.assignedTo}</TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onQueryClick && onQueryClick(query.id)}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}