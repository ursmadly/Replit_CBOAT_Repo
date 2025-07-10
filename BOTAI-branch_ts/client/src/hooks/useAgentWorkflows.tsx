import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AgentType, WorkflowExecutionMode } from "@shared/schema";

// Types
export interface AgentWorkflowInput {
  name: string;
  description?: string;
  agentType: string;
  aiComponent: 'DataManagerAI' | 'CentralMonitorAI';
  executionMode: string;
  prerequisites?: { agentTypes: string[] };
  triggers?: { events: string[] };
  enabled: boolean;
}

export interface AgentWorkflow extends AgentWorkflowInput {
  id: number;
  createdAt: string;
  updatedAt: string;
}

// Hook to get workflows for a specific AI component
export function useAgentWorkflows(aiComponent?: string) {
  const queryParams = aiComponent ? `?aiComponent=${aiComponent}` : '';
  const { toast } = useToast();
  
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/agent-workflows${queryParams}`],
    queryFn: () => apiRequest(`/api/agent-workflows${queryParams}`, 'GET'),
    enabled: true,
    gcTime: 0,
    staleTime: 0, // Reduce stale time to refresh more often
    retry: 3
  });

  // Handle any errors after query is complete
  if (error) {
    console.error("Error fetching agent workflows:", error);
    // Optionally show toast notification for error
    // toast({
    //   title: "Error",
    //   description: `Failed to fetch workflows: ${error.message}`,
    //   variant: "destructive",
    // });
  }

  return {
    workflows: Array.isArray(data) ? data : [],
    isLoading,
    error
  };
}

// Hook to get a specific workflow
export function useAgentWorkflow(id: number) {
  const { toast } = useToast();
  
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/agent-workflows/${id}`],
    queryFn: () => apiRequest(`/api/agent-workflows/${id}`, 'GET'),
    enabled: !!id,
    gcTime: 0,
    staleTime: 1000,
    retry: 1
  });

  // Handle any errors after query is complete
  if (error) {
    console.error(`Error fetching agent workflow with id ${id}:`, error);
    // Optionally show toast notification for error
    // toast({
    //   title: "Error",
    //   description: `Failed to fetch workflow: ${error.message}`,
    //   variant: "destructive",
    // });
  }

  return {
    workflow: data as AgentWorkflow,
    isLoading,
    error
  };
}

// Hook to create a workflow
export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (workflow: AgentWorkflowInput) => {
      return apiRequest('/api/agent-workflows', 'POST', workflow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agent-workflows'] });
      toast({
        title: "Workflow created",
        description: "The agent workflow has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create workflow: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  return mutation;
}

// Hook to update a workflow
export function useUpdateWorkflow() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number, updates: Partial<AgentWorkflowInput> }) => {
      return apiRequest(`/api/agent-workflows/${id}`, 'PATCH', updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agent-workflows'] });
      toast({
        title: "Workflow updated",
        description: "The agent workflow has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update workflow: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  return mutation;
}

// Hook to delete a workflow
export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/agent-workflows/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agent-workflows'] });
      toast({
        title: "Workflow deleted",
        description: "The agent workflow has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete workflow: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  return mutation;
}

// Helper functions in a utility object to avoid export incompatibility issues
export const workflowHelpers = {
  agentTypeOptions: [
    { value: AgentType.DATA_FETCH, label: 'Data Fetch' },
    { value: AgentType.DATA_QUALITY, label: 'Data Quality' },
    { value: AgentType.DATA_RECONCILIATION, label: 'Data Reconciliation' },
    { value: AgentType.SIGNAL_DETECTION, label: 'Signal Detection' },
    { value: AgentType.TASK_MANAGER, label: 'Task Manager' },
    { value: AgentType.QUERY_MANAGER, label: 'Query Manager' },
    { value: AgentType.REPORT_GENERATOR, label: 'Report Generator' },
    { value: AgentType.EVENT_MONITOR, label: 'Event Monitor' },
    { value: AgentType.DOMAIN_PROGRESS, label: 'Domain Progress' },
    { value: AgentType.SITE_MONITOR, label: 'Site Monitor' }
  ],

  executionModeOptions: [
    { value: WorkflowExecutionMode.SEQUENTIAL, label: 'Sequential' },
    { value: WorkflowExecutionMode.INDEPENDENT, label: 'Independent' },
    { value: WorkflowExecutionMode.CONDITIONAL, label: 'Conditional' }
  ],

  // Data Manager specific agents
  dataManagerAgents: [
    AgentType.DATA_FETCH,
    AgentType.DATA_QUALITY,
    AgentType.DATA_RECONCILIATION,
    AgentType.DOMAIN_PROGRESS,
    AgentType.REPORT_GENERATOR
  ],

  // Central Monitor specific agents
  centralMonitorAgents: [
    AgentType.SIGNAL_DETECTION,
    AgentType.TASK_MANAGER,
    AgentType.QUERY_MANAGER,
    AgentType.SITE_MONITOR,
    AgentType.EVENT_MONITOR
  ]
};