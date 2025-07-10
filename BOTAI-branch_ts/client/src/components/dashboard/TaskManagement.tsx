import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { Task } from "@shared/schema";

type TaskData = {
  id: number;
  taskId: string;
  title: string;
  description: string;
  priority: string;
  siteId?: string;
  assignedTo?: string;
  dueDate: string | Date | null;
  status: string;
  detectionId?: number | null;
  trialId: number;
  createdAt?: string | Date;
};

const getBadgeColorForPriority = (priority: string) => {
  switch (priority) {
    case 'Critical':
      return 'bg-danger-100 text-danger-800';
    case 'High':
      return 'bg-warning-100 text-warning-800';
    case 'Medium':
      return 'bg-blue-100 text-blue-800';
    case 'Low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-neutral-100 text-neutral-800';
  }
};

const getBadgeColorForStatus = (status: string) => {
  switch (status) {
    case 'not_started':
      return 'bg-neutral-100 text-neutral-800';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'pending_review':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-neutral-100 text-neutral-800';
  }
};

const formatStatus = (status: string) => {
  switch (status) {
    case 'not_started':
      return 'Not Started';
    case 'in_progress':
      return 'In Progress';
    case 'pending_review':
      return 'Pending Review';
    case 'completed':
      return 'Completed';
    default:
      return status;
  }
};

// Format date safely
const formatDate = (date: string | Date | null): string => {
  if (!date) return 'Not set';
  try {
    return new Date(date).toLocaleDateString();
  } catch (error) {
    return 'Invalid date';
  }
};

// Calculate days remaining or overdue
const getDueDateStatus = (dueDate: string | Date | null) => {
  if (!dueDate) {
    return {
      text: "No due date",
      color: 'text-neutral-600'
    };
  }
  
  try {
    const today = new Date();
    const dueDateObj = dueDate instanceof Date ? dueDate : new Date(dueDate);
    const diffTime = dueDateObj.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return {
        text: `${Math.abs(diffDays)} days overdue`,
        color: 'text-danger-600'
      };
    } else if (diffDays === 0) {
      return {
        text: 'Due today',
        color: 'text-warning-600'
      };
    } else if (diffDays === 1) {
      return {
        text: '1 day remaining',
        color: 'text-warning-600'
      };
    } else if (diffDays <= 3) {
      return {
        text: `${diffDays} days remaining`,
        color: 'text-warning-600'
      };
    } else {
      return {
        text: `${diffDays} days remaining`,
        color: 'text-neutral-600'
      };
    }
  } catch (error) {
    return {
      text: "Invalid date",
      color: 'text-neutral-600'
    };
  }
};

interface TaskManagementProps {
  onTaskClick?: (taskId: number) => void;
  tasks?: Task[];
  isLoading?: boolean;
}

export default function TaskManagement({ onTaskClick, tasks = [], isLoading = false }: TaskManagementProps) {
  const [taskFilter, setTaskFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Transform tasks to TaskData format
  const allTasks: TaskData[] = tasks.map((task) => ({
    id: task.id,
    taskId: task.taskId,
    title: task.title,
    description: task.description || "",
    priority: task.priority,
    siteId: task.siteId ? `Site ${task.siteId}` : 'Multiple',
    assignedTo: task.assignedTo || undefined,
    dueDate: task.dueDate,
    status: task.status,
    detectionId: task.detectionId,
    trialId: task.trialId,
    createdAt: task.createdAt
  }));

  // Apply component-level filters (these are separate from the page-level filters)
  const filteredTasks = allTasks.filter((task: TaskData) => {
    if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    if (taskFilter === "assigned" && !task.assignedTo) return false;
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <Card>
      <CardHeader className="border-b border-neutral-200 px-4 py-4 flex-row justify-between items-center">
        <CardTitle className="text-base font-medium text-neutral-800">Task Management</CardTitle>
        <div className="flex space-x-3">
          <Select value={taskFilter} onValueChange={setTaskFilter}>
            <SelectTrigger className="pl-3 pr-8 py-1.5 bg-neutral-100 border border-neutral-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 h-auto w-auto">
              <SelectValue placeholder="All Tasks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="assigned">Assigned Tasks</SelectItem>
              <SelectItem value="unassigned">Unassigned Tasks</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="pl-3 pr-8 py-1.5 bg-neutral-100 border border-neutral-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 h-auto w-auto">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="pl-3 pr-8 py-1.5 bg-neutral-100 border border-neutral-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 h-auto w-auto">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="pending_review">Pending Review</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Task ID
                </th>
                <th className="px-6 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Site
                </th>
                <th className="px-6 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-6 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 bg-neutral-50"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center">
                    <div className="flex justify-center items-center">
                      <span className="material-icons animate-spin text-primary-500 mr-2">refresh</span>
                      Loading tasks...
                    </div>
                  </td>
                </tr>
              ) : currentTasks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-neutral-500">
                    No tasks found matching the current filters
                  </td>
                </tr>
              ) : (
                currentTasks.map((task: TaskData) => {
                  const dueStatus = getDueDateStatus(task.dueDate);
                  
                  return (
                    <tr 
                      key={task.id} 
                      className="hover:bg-neutral-50 cursor-pointer"
                      onClick={() => onTaskClick && onTaskClick(task.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                        {task.taskId}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-800 max-w-md truncate">
                        {task.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          getBadgeColorForPriority(task.priority)
                        )}>
                          {task.priority}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                        {task.siteId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                        {task.assignedTo ? (
                          <div className="flex items-center">
                            <div className="h-6 w-6 rounded-full bg-neutral-300 mr-2"></div>
                            <span>{task.assignedTo}</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center mr-2 text-primary-700 text-xs font-bold">
                              +
                            </div>
                            <span className="text-primary-500">Assign</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                        {formatDate(task.createdAt || null)}
                      </td>
                      <td className={cn("px-6 py-4 whitespace-nowrap text-sm font-medium", dueStatus.color)}>
                        {formatDate(task.dueDate)} 
                        {task.dueDate && ` (${dueStatus.text})`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          getBadgeColorForStatus(task.status)
                        )}>
                          {formatStatus(task.status)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary-600 hover:text-primary-800"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click event
                            onTaskClick && onTaskClick(task.id);
                          }}
                        >
                          <span className="material-icons">more_horiz</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        <div className="mt-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-700">
              Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(indexOfLastItem, filteredTasks.length)}
              </span>{" "}
              of <span className="font-medium">{filteredTasks.length}</span> tasks
            </p>
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Create a window of pages around the current page
                let pageNum = i + 1;
                if (currentPage > 3 && totalPages > 5) {
                  pageNum = currentPage + i - 2;
                  if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                  if (pageNum < 1) pageNum = i + 1;
                }
                
                if (pageNum <= totalPages) {
                  return (
                    <PaginationItem key={i}>
                      <PaginationLink 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(pageNum);
                        }}
                        isActive={currentPage === pageNum}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
                return null;
              })}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <PaginationItem>
                  <PaginationLink 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(totalPages);
                    }}
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                  }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </CardContent>
    </Card>
  );
}
