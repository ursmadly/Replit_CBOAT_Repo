import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowDown, ArrowRight, ArrowUpDown, ChevronRight, ChevronsUpDown, CircleDot, GripVertical, Plus, Settings, Trash2 } from "lucide-react";
import { AgentType, WorkflowExecutionMode } from "@shared/schema";
import { 
  useAgentWorkflows, 
  useCreateWorkflow, 
  useUpdateWorkflow, 
  useDeleteWorkflow,
  workflowHelpers,
  AgentWorkflow,
  AgentWorkflowInput
} from "@/hooks/useAgentWorkflows";

interface WorkflowDependencyManagerProps {
  aiComponent: 'DataManagerAI' | 'CentralMonitorAI';
  allowedAgentTypes: string[];
}

export function WorkflowDependencyManager({ aiComponent, allowedAgentTypes }: WorkflowDependencyManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [workflowToEdit, setWorkflowToEdit] = useState<AgentWorkflow | null>(null);
  
  const { workflows, isLoading } = useAgentWorkflows(aiComponent);
  const createWorkflow = useCreateWorkflow();
  const updateWorkflow = useUpdateWorkflow();
  const deleteWorkflow = useDeleteWorkflow();

  const availableAgentOptions = workflowHelpers.agentTypeOptions.filter(option => 
    allowedAgentTypes.includes(option.value)
  );

  // Form state for new workflow
  const [formState, setFormState] = useState<AgentWorkflowInput>({
    name: '',
    description: '',
    agentType: allowedAgentTypes[0] || AgentType.DATA_FETCH,
    aiComponent,
    executionMode: WorkflowExecutionMode.SEQUENTIAL,
    prerequisites: { agentTypes: [] },
    triggers: { events: [] },
    enabled: true
  });

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  // Handle switch changes
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormState(prev => ({ ...prev, [name]: checked }));
  };

  // Handle prerequisites selection
  const handlePrerequisiteChange = (agentType: string, checked: boolean) => {
    setFormState(prev => {
      const currentPrereqs = prev.prerequisites?.agentTypes || [];
      const newPrereqs = checked
        ? [...currentPrereqs, agentType]
        : currentPrereqs.filter(type => type !== agentType);
      
      return {
        ...prev,
        prerequisites: { agentTypes: newPrereqs }
      };
    });
  };

  // Reset form to default values
  const resetForm = () => {
    setFormState({
      name: '',
      description: '',
      agentType: allowedAgentTypes[0] || AgentType.DATA_FETCH,
      aiComponent,
      executionMode: WorkflowExecutionMode.SEQUENTIAL,
      prerequisites: { agentTypes: [] },
      triggers: { events: [] },
      enabled: true
    });
  };

  // Load a workflow into the form for editing
  const loadWorkflowForEdit = (workflow: AgentWorkflow) => {
    setWorkflowToEdit(workflow);
    setFormState({
      name: workflow.name,
      description: workflow.description || '',
      agentType: workflow.agentType,
      aiComponent: workflow.aiComponent as 'DataManagerAI' | 'CentralMonitorAI',
      executionMode: workflow.executionMode,
      prerequisites: workflow.prerequisites || { agentTypes: [] },
      triggers: workflow.triggers || { events: [] },
      enabled: workflow.enabled
    });
    setIsEditDialogOpen(true);
  };

  // Handle form submission for create
  const handleCreate = () => {
    createWorkflow.mutate(formState, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        resetForm();
      }
    });
  };

  // Handle form submission for update
  const handleUpdate = () => {
    if (!workflowToEdit) return;
    
    updateWorkflow.mutate({
      id: workflowToEdit.id,
      updates: formState
    }, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setWorkflowToEdit(null);
        resetForm();
      }
    });
  };

  // Handle workflow deletion
  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      deleteWorkflow.mutate(id);
    }
  };

  // Get human-readable agent type name
  const getAgentTypeName = (type: string) => {
    const option = workflowHelpers.agentTypeOptions.find(opt => opt.value === type);
    return option ? option.label : type;
  };

  // Get workflow execution mode label
  const getExecutionModeLabel = (mode: string) => {
    const option = workflowHelpers.executionModeOptions.find(opt => opt.value === mode);
    return option ? option.label : mode;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Agent Workflow Dependencies</h3>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Workflow
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Workflow Configuration</CardTitle>
          <CardDescription>
            Define how AI agents collaborate in the {aiComponent} system. Configure dependencies and execution modes to optimize automation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : workflows.length === 0 ? (
            <div className="text-center p-8 border rounded-md bg-muted/10">
              <p className="text-lg font-medium mb-2">No workflows defined yet</p>
              <p className="text-sm text-muted-foreground mb-6">
                Define workflows to control how agents work together. Create your first workflow to get started.
              </p>
              <Button 
                variant="default" 
                size="lg"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="mr-2 h-5 w-5" /> Create First Workflow
              </Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-medium">Agent Type</TableHead>
                    <TableHead className="font-medium">Workflow Name</TableHead>
                    <TableHead className="font-medium">Execution Mode</TableHead>
                    <TableHead className="font-medium">Dependencies</TableHead>
                    <TableHead className="font-medium">Status</TableHead>
                    <TableHead className="font-medium w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflows.map((workflow) => (
                    <TableRow key={workflow.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {workflow.agentType === AgentType.DATA_FETCH && <ArrowDown className="h-4 w-4 text-blue-500" />}
                          {workflow.agentType === AgentType.DATA_QUALITY && <CircleDot className="h-4 w-4 text-green-500" />}
                          {workflow.agentType === AgentType.DATA_RECONCILIATION && <ArrowUpDown className="h-4 w-4 text-violet-500" />}
                          {workflow.agentType === AgentType.SIGNAL_DETECTION && <ChevronsUpDown className="h-4 w-4 text-amber-500" />}
                          {workflow.agentType === AgentType.TASK_MANAGER && <Settings className="h-4 w-4 text-rose-500" />}
                          <span className="font-medium">{getAgentTypeName(workflow.agentType)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{workflow.name}</div>
                        {workflow.description && (
                          <div className="text-sm text-muted-foreground">{workflow.description}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {workflow.executionMode === WorkflowExecutionMode.SEQUENTIAL ? (
                            <ArrowDown className="mr-2 h-4 w-4 text-blue-500" />
                          ) : workflow.executionMode === WorkflowExecutionMode.INDEPENDENT ? (
                            <ArrowRight className="mr-2 h-4 w-4 text-green-500" />
                          ) : (
                            <ChevronsUpDown className="mr-2 h-4 w-4 text-amber-500" />
                          )}
                          <span>{getExecutionModeLabel(workflow.executionMode)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {workflow.prerequisites?.agentTypes && workflow.prerequisites.agentTypes.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {workflow.prerequisites.agentTypes.map((type: string, index: number) => (
                              <div key={index} className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                                {getAgentTypeName(type)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${workflow.enabled ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                          <CircleDot className={`mr-1 h-2 w-2 ${workflow.enabled ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`} />
                          {workflow.enabled ? 'Active' : 'Disabled'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => loadWorkflowForEdit(workflow)}
                            title="Edit Workflow"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                            onClick={() => handleDelete(workflow.id)}
                            title="Delete Workflow"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        {workflows.length > 0 && (
          <CardFooter className="flex justify-between border-t pt-4">
            <div className="text-sm text-muted-foreground">
              Showing {workflows.length} workflow{workflows.length !== 1 ? 's' : ''}
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="h-8"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Workflow
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Create Workflow Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Create Agent Workflow</DialogTitle>
            <DialogDescription>
              Configure how agents work together in the {aiComponent} system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formState.name}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="My Workflow"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formState.description}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="What this workflow does..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="agentType" className="text-right">
                Agent Type
              </Label>
              <Select
                value={formState.agentType}
                onValueChange={(value) => handleSelectChange('agentType', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Agent Type" />
                </SelectTrigger>
                <SelectContent>
                  {availableAgentOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="executionMode" className="text-right">
                Execution Mode
              </Label>
              <Select
                value={formState.executionMode}
                onValueChange={(value) => handleSelectChange('executionMode', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Execution Mode" />
                </SelectTrigger>
                <SelectContent>
                  {workflowHelpers.executionModeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Prerequisites</Label>
              <div className="col-span-3 space-y-2 border rounded-md p-3">
                {availableAgentOptions
                  .filter(option => option.value !== formState.agentType)
                  .map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`prereq-${option.value}`}
                        checked={formState.prerequisites?.agentTypes.includes(option.value) || false}
                        onCheckedChange={(checked) => 
                          handlePrerequisiteChange(option.value, checked as boolean)
                        }
                      />
                      <Label htmlFor={`prereq-${option.value}`}>{option.label}</Label>
                    </div>
                  ))
                }
                {availableAgentOptions.length <= 1 && (
                  <p className="text-sm text-muted-foreground">No other agents available as prerequisites</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="enabled" className="text-right">
                Enabled
              </Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={formState.enabled}
                  onCheckedChange={(checked) => handleSwitchChange('enabled', checked)}
                />
                <Label htmlFor="enabled">
                  {formState.enabled ? 'Active' : 'Disabled'}
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createWorkflow.isPending || !formState.name}>
              {createWorkflow.isPending ? 'Creating...' : 'Create Workflow'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Workflow Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Agent Workflow</DialogTitle>
            <DialogDescription>
              Update the configuration for this workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                name="name"
                value={formState.name}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="edit-description"
                name="description"
                value={formState.description}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-agentType" className="text-right">
                Agent Type
              </Label>
              <Select
                value={formState.agentType}
                onValueChange={(value) => handleSelectChange('agentType', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Agent Type" />
                </SelectTrigger>
                <SelectContent>
                  {availableAgentOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-executionMode" className="text-right">
                Execution Mode
              </Label>
              <Select
                value={formState.executionMode}
                onValueChange={(value) => handleSelectChange('executionMode', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Execution Mode" />
                </SelectTrigger>
                <SelectContent>
                  {workflowHelpers.executionModeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Prerequisites</Label>
              <div className="col-span-3 space-y-2 border rounded-md p-3">
                {availableAgentOptions
                  .filter(option => option.value !== formState.agentType)
                  .map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-prereq-${option.value}`}
                        checked={formState.prerequisites?.agentTypes.includes(option.value) || false}
                        onCheckedChange={(checked) => 
                          handlePrerequisiteChange(option.value, checked as boolean)
                        }
                      />
                      <Label htmlFor={`edit-prereq-${option.value}`}>{option.label}</Label>
                    </div>
                  ))
                }
                {availableAgentOptions.length <= 1 && (
                  <p className="text-sm text-muted-foreground">No other agents available as prerequisites</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-enabled" className="text-right">
                Enabled
              </Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-enabled"
                  checked={formState.enabled}
                  onCheckedChange={(checked) => handleSwitchChange('enabled', checked)}
                />
                <Label htmlFor="edit-enabled">
                  {formState.enabled ? 'Active' : 'Disabled'}
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateWorkflow.isPending || !formState.name}>
              {updateWorkflow.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}