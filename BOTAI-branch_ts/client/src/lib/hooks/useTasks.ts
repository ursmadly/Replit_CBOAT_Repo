import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TaskStatus, TaskPriority } from "@shared/schema";

interface TaskFilters {
  status?: string;
  priority?: string;
  assignedTo?: string;
  trialId?: number;
  siteId?: number;
}

export function useTasks(filters: TaskFilters = {}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/tasks'],
    select: (data) => {
      return data
        .filter((task: any) => {
          if (filters.status && task.status !== filters.status) return false;
          if (filters.priority && task.priority !== filters.priority) return false;
          if (filters.assignedTo && task.assignedTo !== filters.assignedTo) return false;
          if (filters.trialId && task.trialId !== filters.trialId) return false;
          if (filters.siteId && task.siteId !== filters.siteId) return false;
          return true;
        })
        .sort((a: any, b: any) => {
          // Sort by priority (Critical first) then by due date
          const priorityOrder = {
            [TaskPriority.CRITICAL]: 0,
            [TaskPriority.HIGH]: 1,
            [TaskPriority.MEDIUM]: 2,
            [TaskPriority.LOW]: 3
          };
          
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          }
          
          // If priority is the same, sort by due date (earliest first)
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
    }
  });
  
  return { tasks: data || [], isLoading, error };
}

export function useTasksByStats() {
  const { tasks } = useTasks();
  
  const stats = {
    critical: tasks.filter((task: any) => task.priority === TaskPriority.CRITICAL).length,
    high: tasks.filter((task: any) => task.priority === TaskPriority.HIGH).length,
    medium: tasks.filter((task: any) => task.priority === TaskPriority.MEDIUM).length,
    low: tasks.filter((task: any) => task.priority === TaskPriority.LOW).length,
    
    notStarted: tasks.filter((task: any) => task.status === TaskStatus.NOT_STARTED).length,
    inProgress: tasks.filter((task: any) => task.status === TaskStatus.IN_PROGRESS).length,
    pendingReview: tasks.filter((task: any) => task.status === TaskStatus.PENDING_REVIEW).length,
    completed: tasks.filter((task: any) => task.status === TaskStatus.COMPLETED).length,
    
    overdue: tasks.filter((task: any) => {
      if (task.status === TaskStatus.COMPLETED) return false;
      const now = new Date();
      const dueDate = new Date(task.dueDate);
      return dueDate < now;
    }).length,
    
    dueToday: tasks.filter((task: any) => {
      if (task.status === TaskStatus.COMPLETED) return false;
      const now = new Date();
      const dueDate = new Date(task.dueDate);
      return dueDate.toDateString() === now.toDateString();
    }).length,
    
    dueSoon: tasks.filter((task: any) => {
      if (task.status === TaskStatus.COMPLETED) return false;
      const now = new Date();
      const dueDate = new Date(task.dueDate);
      const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 3;
    }).length,
    
    total: tasks.length
  };
  
  return stats;
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const mutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number, updates: any }) => {
      return apiRequest('PATCH', `/api/tasks/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Task updated",
        description: "The task has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update task: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  return mutation;
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const mutation = useMutation({
    mutationFn: async (taskData: any) => {
      return apiRequest('/api/tasks', 'POST', taskData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Task created",
        description: "The task has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create task: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  return mutation;
}
