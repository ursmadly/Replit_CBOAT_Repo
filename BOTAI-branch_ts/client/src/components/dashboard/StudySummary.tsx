import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Progress
} from "@/components/ui/progress";
import ExportMenu from "@/components/common/ExportMenu";
import { Trial, Task, SignalDetection } from "@shared/schema";

export default function StudySummary() {
  // Fetch trials data
  const { data: trials = [] } = useQuery<Trial[]>({
    queryKey: ['/api/trials'],
  });

  // Fetch tasks data
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  // Fetch signal detections data
  const { data: signalDetections = [] } = useQuery<SignalDetection[]>({
    queryKey: ['/api/signaldetections'],
  });

  // Generate study summaries
  const studySummaries = trials.map(trial => {
    const trialTasks = tasks.filter(task => task.trialId === trial.id);
    const trialDetections = signalDetections.filter(detection => detection.trialId === trial.id);
    
    // Calculate task statistics
    const totalTasks = trialTasks.length;
    const completedTasks = trialTasks.filter(task => task.status === 'completed').length;
    const inProgressTasks = trialTasks.filter(task => task.status === 'in_progress').length;
    const criticalTasks = trialTasks.filter(task => task.priority === 'Critical').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Calculate detection statistics
    const totalDetections = trialDetections.length;
    const openDetections = trialDetections.filter(detection => 
      detection.status !== 'resolved' && detection.status !== 'closed'
    ).length;
    const criticalDetections = trialDetections.filter(detection => detection.priority === 'Critical').length;
    
    // Data reconciliation status (in a real app, this would come from actual data)
    const dataReconciliationStatus = {
      percent: trial.id === 1 ? 78 : trial.id === 2 ? 92 : trial.id === 3 ? 65 : 85,
      status: trial.id === 1 ? 'at-risk' : trial.id === 2 ? 'on-track' : trial.id === 3 ? 'critical' : 'on-track',
    };
    
    // Generate a concise summary
    let summary = '';
    if (trial.id === 1) {
      summary = `${trial.indication} study showing critical safety signals requiring attention. Database reconciliation at risk (78%), with ${criticalTasks} critical tasks and ${openDetections} open signal detections. Protocol deviations at Site 178 need investigation.`;
    } else if (trial.id === 2) {
      summary = `${trial.indication} study progressing well with 92% data reconciliation. Limited signal detections and most tasks on schedule. Patient recruitment exceeding targets with high data quality across sites.`;
    } else if (trial.id === 3) {
      summary = `${trial.indication} study facing data quality challenges (65% reconciliation). Site monitoring required for ${openDetections} open signals. Enrollment on target but critical safety issues identified.`;
    } else {
      summary = `${trial.indication} study in initial setup phase with baseline data collection underway. Early monitoring shows 85% reconciliation with minimal signals detected. Protocol compliance high across all active sites.`;
    }
    
    return {
      trial,
      completionRate,
      totalTasks,
      completedTasks,
      inProgressTasks,
      criticalTasks,
      totalDetections,
      openDetections,
      criticalDetections,
      dataReconciliationStatus,
      summary
    };
  });

  return (
    <div className="grid grid-cols-1 gap-6 mb-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Study Summary</CardTitle>
              <CardDescription>Overview of current studies based on detections, tasks, and data reconciliation</CardDescription>
            </div>
            <ExportMenu 
              data={studySummaries.map(summary => ({
                protocol: summary.trial.protocolId,
                title: summary.trial.title,
                phase: summary.trial.phase,
                status: summary.trial.status,
                indication: summary.trial.indication,
                therapeuticArea: summary.trial.therapeuticArea,
                tasksTotal: summary.totalTasks,
                tasksCompleted: summary.completedTasks,
                tasksCritical: summary.criticalTasks,
                detectionsTotal: summary.totalDetections,
                detectionsOpen: summary.openDetections, 
                dataReconciliation: summary.dataReconciliationStatus.percent + '%',
                riskStatus: summary.dataReconciliationStatus.status
              }))}
              filename="clinical_trials_summary"
              title="Clinical Trials Summary"
            />
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            {studySummaries.map((studySummary) => (
              <div key={studySummary.trial.id} className="border rounded-md p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-medium">{studySummary.trial.protocolId}: {studySummary.trial.title}</h3>
                    <p className="text-sm text-gray-500">{studySummary.trial.phase} • {studySummary.trial.therapeuticArea} • {studySummary.trial.status}</p>
                  </div>
                  <div className="flex items-center space-x-2 mt-2 md:mt-0">
                    <Badge variant="outline" className={
                      studySummary.dataReconciliationStatus.status === 'on-track' ? 'bg-green-50 text-green-700 border-green-200' :
                      studySummary.dataReconciliationStatus.status === 'at-risk' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }>
                      {studySummary.dataReconciliationStatus.status === 'on-track' ? 'On Track' :
                       studySummary.dataReconciliationStatus.status === 'at-risk' ? 'At Risk' : 'Critical'}
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-800">{studySummary.dataReconciliationStatus.percent}% Reconciled</Badge>
                  </div>
                </div>
                
                <p className="text-sm text-gray-700 mb-4">{studySummary.summary}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Tasks Completion</span>
                      <span className="font-medium">{studySummary.completedTasks}/{studySummary.totalTasks}</span>
                    </div>
                    <Progress value={studySummary.completionRate} className="h-2" />
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Critical: {studySummary.criticalTasks}</span>
                      <span className="text-gray-500">In Progress: {studySummary.inProgressTasks}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Signal Detections</span>
                      <span className="font-medium">{studySummary.openDetections}/{studySummary.totalDetections}</span>
                    </div>
                    <Progress 
                      value={studySummary.totalDetections > 0 ? 
                        Math.round(((studySummary.totalDetections - studySummary.openDetections) / studySummary.totalDetections) * 100) : 0
                      } 
                      className="h-2" 
                    />
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Critical: {studySummary.criticalDetections}</span>
                      <span className="text-gray-500">Open: {studySummary.openDetections}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Data Reconciliation</span>
                      <span className="font-medium">{studySummary.dataReconciliationStatus.percent}%</span>
                    </div>
                    <Progress 
                      value={studySummary.dataReconciliationStatus.percent} 
                      className={`h-2 ${
                        studySummary.dataReconciliationStatus.status === 'on-track' ? 'bg-green-200' :
                        studySummary.dataReconciliationStatus.status === 'at-risk' ? 'bg-orange-200' :
                        'bg-red-200'
                      }`} 
                    />
                    <div className="flex justify-between text-xs">
                      <span className={
                        studySummary.dataReconciliationStatus.status === 'on-track' ? 'text-green-600' :
                        studySummary.dataReconciliationStatus.status === 'at-risk' ? 'text-orange-600' :
                        'text-red-600'
                      }>
                        {studySummary.dataReconciliationStatus.status === 'on-track' ? 'Good Quality' :
                         studySummary.dataReconciliationStatus.status === 'at-risk' ? 'Needs Attention' :
                         'Critical Issues'}
                      </span>
                      <span className="text-gray-500">Target: 95%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}