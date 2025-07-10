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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CalendarClock, 
  CheckCircle2, 
  UserCheck,
  MessageSquare
} from "lucide-react";

interface WorkflowStep {
  id: string;
  queryId: string;
  action: 'created' | 'assigned' | 'reviewed' | 'resolved' | 'auto-detected' | 'auto-corrected' | 'notified';
  timestamp: Date;
  user?: string;
  notes?: string;
  dataChange?: {
    before: any;
    after: any;
  };
}

interface Query {
  id: string;
  description: string;
  status: 'new' | 'assigned' | 'in-review' | 'resolved';
  severity: 'low' | 'medium' | 'high' | 'critical';
  dataSources: string[];
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  contact?: string;
  // Additional fields that may be available
  referenceData?: string;
  workflowSteps?: WorkflowStep[];
  resolutionMethod?: 'manual' | 'auto-corrected' | 'not-applicable';
}

interface QueryWorkflowHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: Query | null;
  workflowSteps: WorkflowStep[];
}

export const QueryWorkflowHistoryModal: React.FC<QueryWorkflowHistoryModalProps> = ({
  isOpen,
  onClose,
  query,
  workflowSteps
}) => {
  // Function to get the action status badge color and label
  const getActionBadge = (action: string) => {
    switch(action) {
      case 'created':
        return { label: 'Created', color: 'bg-blue-100 text-blue-800' };
      case 'assigned':
        return { label: 'Assigned', color: 'bg-purple-100 text-purple-800' };
      case 'reviewed':
        return { label: 'Reviewed', color: 'bg-yellow-100 text-yellow-800' };
      case 'resolved':
        return { label: 'Resolved', color: 'bg-green-100 text-green-800' };
      case 'auto-detected':
        return { label: 'Auto-detected', color: 'bg-indigo-100 text-indigo-800' };
      case 'auto-corrected':
        return { label: 'Auto-corrected', color: 'bg-emerald-100 text-emerald-800' };
      case 'notified':
        return { label: 'Notification Sent', color: 'bg-amber-100 text-amber-800' };
      default:
        return { label: action, color: 'bg-gray-100 text-gray-800' };
    }
  };

  // No query data available
  if (!query) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Query Workflow History</DialogTitle>
          <DialogDescription>
            Tracking the lifecycle of query {query.id}
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4">
          <div className="flex flex-col gap-1">
            <p className="font-medium">{query.description}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge className={
                query.severity === 'critical' ? 'bg-red-100 text-red-800' :
                query.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                query.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }>
                {query.severity.charAt(0).toUpperCase() + query.severity.slice(1)}
              </Badge>
              
              <span>•</span>
              
              <Badge className={
                query.status === 'resolved' ? 'bg-green-100 text-green-800' :
                query.status === 'in-review' ? 'bg-yellow-100 text-yellow-800' :
                query.status === 'assigned' ? 'bg-purple-100 text-purple-800' :
                'bg-blue-100 text-blue-800'
              }>
                {query.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </Badge>
              
              <span>•</span>
              
              <div className="flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5" />
                <span>Created {new Date(query.createdAt).toLocaleDateString()}</span>
              </div>
              
              {query.resolutionMethod && (
                <>
                  <span>•</span>
                  <Badge className={
                    query.resolutionMethod === 'auto-corrected' ? 'bg-emerald-100 text-emerald-800' :
                    query.resolutionMethod === 'manual' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {query.resolutionMethod === 'auto-corrected' ? 'Auto-corrected' :
                     query.resolutionMethod === 'manual' ? 'Manually resolved' :
                     'Not applicable'}
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>

        {workflowSteps.length > 0 ? (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflowSteps.sort((a, b) => 
                  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                ).map((step) => {
                  const { label, color } = getActionBadge(step.action);
                  return (
                    <TableRow key={step.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(step.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={color}>{label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>{step.user || 'System'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-1">
                          <MessageSquare className="h-3.5 w-3.5 mt-0.5" />
                          <span>{step.notes || 'No notes provided'}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No workflow history available for this query.
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};