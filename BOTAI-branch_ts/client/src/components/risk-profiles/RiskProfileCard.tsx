import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { getRiskLevelColors, calculateRiskLevel } from "@/lib/utils/calculations";
import { ProfileType } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

type RiskMetrics = {
  [key: string]: number;
};

type RiskProfileCardProps = {
  profileType: string;
  profileData: any;
  entityType: string;
  entityDetails: any;
};

export default function RiskProfileCard({ profileType, profileData, entityType, entityDetails }: RiskProfileCardProps) {
  if (!profileData) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-neutral-500">
        <span className="material-icons text-4xl mb-4">assessment</span>
        <p>No {profileType} profile data available</p>
      </div>
    );
  }
  
  const { metrics, riskScore, recommendations } = profileData;
  const riskLevel = calculateRiskLevel(riskScore);
  const { badge: badgeColor } = getRiskLevelColors(riskLevel);
  
  // Fetch related signal detections
  const { data: signalDetections = [], isLoading: isLoadingSignals } = useQuery({
    queryKey: ['/api/signaldetections', { trialId: entityDetails?.id }],
    enabled: !!entityDetails?.id && (entityType === 'trial' || entityType === 'site'),
  });
  
  // Render different metrics based on profile type
  const renderMetrics = () => {
    switch (profileType) {
      case ProfileType.RISK:
        return renderRiskMetrics(metrics);
      case ProfileType.QUALITY:
        return renderQualityMetrics(metrics);
      case ProfileType.COMPLIANCE:
        return renderComplianceMetrics(metrics);
      case ProfileType.SAFETY:
        return renderSafetyMetrics(metrics);
      case ProfileType.VENDOR:
        return renderVendorMetrics(metrics);
      case ProfileType.RESOURCE:
        return renderResourceMetrics(metrics);
      default:
        return renderGenericMetrics(metrics);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-xl font-medium text-neutral-800">{profileType} Profile</h2>
          <Badge className={`ml-3 ${badgeColor}`}>{riskLevel}</Badge>
        </div>
        <div className="flex items-center">
          <span className="text-lg font-semibold">{riskScore}/100</span>
          <span className="ml-2 text-sm text-neutral-500">Risk Score</span>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-6">
          {renderMetrics()}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-medium">Recent Signals</h3>
              <Link href="/signal-detection">
                <Button variant="outline" size="sm">
                  <span className="material-icons text-sm mr-1">visibility</span>
                  View All
                </Button>
              </Link>
            </div>
            {renderRecentSignals(signalDetections as any[], isLoadingSignals)}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="text-base font-medium mb-4">Recommendations</h3>
            {renderRecommendations(recommendations, riskLevel, profileType)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper functions to render different types of metrics
function renderRiskMetrics(metrics: RiskMetrics) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <MetricProgressBar label="Patient Risk" value={metrics.patientRisk} />
      <MetricProgressBar label="Protocol Deviation" value={metrics.protocolDeviation} />
      <MetricProgressBar label="Data Quality" value={metrics.dataQuality} />
      <MetricProgressBar label="Adverse Events" value={metrics.adverseEvents} />
      <MetricProgressBar label="Compliance" value={metrics.compliance} />
      {metrics.enrollmentRisk && <MetricProgressBar label="Enrollment Risk" value={metrics.enrollmentRisk} />}
    </div>
  );
}

function renderQualityMetrics(metrics: RiskMetrics) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <MetricProgressBar label="Data Completeness" value={metrics.dataCompleteness || 80} />
      <MetricProgressBar label="Query Rate" value={metrics.queryRate || 40} />
      <MetricProgressBar label="SDV Errors" value={metrics.sdvErrors || 30} />
      <MetricProgressBar label="Documentation Quality" value={metrics.documentationQuality || 75} />
      <MetricProgressBar label="Data Entry Timeliness" value={metrics.dataEntryTimeliness || 60} />
    </div>
  );
}

function renderComplianceMetrics(metrics: RiskMetrics) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <MetricProgressBar label="Protocol Adherence" value={metrics.protocolAdherence || 85} />
      <MetricProgressBar label="ICF Compliance" value={metrics.icfCompliance || 90} />
      <MetricProgressBar label="Regulatory Submissions" value={metrics.regulatorySubmissions || 70} />
      <MetricProgressBar label="Training Compliance" value={metrics.trainingCompliance || 95} />
      <MetricProgressBar label="Procedure Compliance" value={metrics.procedureCompliance || 80} />
    </div>
  );
}

function renderSafetyMetrics(metrics: RiskMetrics) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <MetricProgressBar label="AE Reporting Timeliness" value={metrics.aeReportingTimeliness || 60} />
      <MetricProgressBar label="SAE Frequency" value={metrics.saeFrequency || 30} />
      <MetricProgressBar label="Safety Signal Detection" value={metrics.safetySignalDetection || 45} />
      <MetricProgressBar label="Protocol Safety Violations" value={metrics.protocolSafetyViolations || 20} />
      <MetricProgressBar label="Safety Monitoring Adherence" value={metrics.safetyMonitoringAdherence || 85} />
    </div>
  );
}

function renderVendorMetrics(metrics: RiskMetrics) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <MetricProgressBar label="Service Quality" value={metrics.serviceQuality || 70} />
      <MetricProgressBar label="Delivery Timeliness" value={metrics.deliveryTimeliness || 65} />
      <MetricProgressBar label="Communication" value={metrics.communication || 80} />
      <MetricProgressBar label="Issue Resolution" value={metrics.issueResolution || 75} />
      <MetricProgressBar label="Contract Compliance" value={metrics.contractCompliance || 90} />
    </div>
  );
}

function renderResourceMetrics(metrics: RiskMetrics) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <MetricProgressBar label="Issue Count" value={metrics.issueCount || 30} />
      <MetricProgressBar label="Performance Quality" value={metrics.performanceQuality || 75} />
      <MetricProgressBar label="Response Timeliness" value={metrics.responseTimeliness || 65} />
      <MetricProgressBar label="Documentation Accuracy" value={metrics.documentationAccuracy || 80} />
      <MetricProgressBar label="Protocol Compliance" value={metrics.protocolCompliance || 70} />
      <MetricProgressBar label="Task Completion Rate" value={metrics.taskCompletionRate || 85} />
    </div>
  );
}

function renderGenericMetrics(metrics: RiskMetrics) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Object.entries(metrics).map(([key, value]) => (
        <MetricProgressBar 
          key={key} 
          label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())} 
          value={value} 
        />
      ))}
    </div>
  );
}

// Generic metric progress bar component
function MetricProgressBar({ label, value }: { label: string; value: number }) {
  // Determine color based on the value
  const getColorClass = (value: number) => {
    if (value <= 30) return "bg-green-500";
    if (value <= 50) return "bg-green-500";
    if (value <= 70) return "bg-yellow-500";
    if (value <= 85) return "bg-orange-500";
    return "bg-red-500";
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-neutral-700">{label}</span>
        <span className="text-sm text-neutral-500">{value}%</span>
      </div>
      <Progress value={value} className="h-2">
        <div className={cn("h-full", getColorClass(value))} style={{ width: `${value}%` }} />
      </Progress>
    </div>
  );
}

// Render recent signals related to this profile
function renderRecentSignals(signalDetections: any[], isLoading: boolean) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <span className="material-icons animate-spin mr-2">refresh</span>
        Loading signals...
      </div>
    );
  }

  if (!signalDetections || signalDetections.length === 0) {
    return (
      <div className="text-center py-6 text-neutral-500">
        <p className="text-sm">No recent signals detected</p>
      </div>
    );
  }

  // Sort by creation date and take most recent 2
  const recentSignals = [...signalDetections]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 2);
  
  return (
    <div className="space-y-4">
      {recentSignals.map((signal) => (
        <div key={signal.id} className="flex items-start p-3 bg-neutral-50 rounded-md">
          <span className={cn(
            "material-icons mr-2",
            signal.priority === "Critical" ? "text-red-500" :
            signal.priority === "High" ? "text-orange-500" :
            signal.priority === "Medium" ? "text-yellow-500" : "text-blue-500"
          )}>
            {signal.priority === "Critical" || signal.priority === "High" ? "warning" : "info"}
          </span>
          <div>
            <p className="text-sm font-medium">{signal.observation}</p>
            <p className="text-xs text-neutral-500 mt-1">
              {new Date(signal.createdAt).toLocaleDateString()} - {signal.priority} priority
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Render recommendations based on data from API or fallback to defaults by profile type
function renderRecommendations(apiRecommendations: any[] | undefined | null, riskLevel: string, profileType: string) {
  // If we have API recommendations, use those
  if (apiRecommendations && Array.isArray(apiRecommendations) && apiRecommendations.length > 0) {
    return (
      <ul className="space-y-2">
        {apiRecommendations.map((recommendation, index) => (
          <li key={index} className="flex items-start">
            <span className="material-icons text-primary-500 mr-2 text-sm">arrow_right</span>
            <span className="text-sm">{recommendation}</span>
          </li>
        ))}
      </ul>
    );
  }
  
  // Otherwise fall back to generated recommendations based on risk level and profile type
  let recommendations: string[] = [];
  
  if (riskLevel === 'High' || riskLevel === 'Critical') {
    if (profileType === ProfileType.RISK) {
      recommendations = [
        "Conduct urgent site audit",
        "Increase monitoring frequency",
        "Schedule investigator meeting",
        "Review enrollment criteria compliance"
      ];
    } else if (profileType === ProfileType.QUALITY) {
      recommendations = [
        "Implement additional data review",
        "Provide data entry retraining",
        "Increase SDV percentage",
        "Conduct quality audit"
      ];
    } else if (profileType === ProfileType.COMPLIANCE) {
      recommendations = [
        "Review protocol adherence",
        "Conduct protocol retraining",
        "Perform regulatory document review",
        "Verify informed consent procedures"
      ];
    } else if (profileType === ProfileType.SAFETY) {
      recommendations = [
        "Conduct safety data review meeting",
        "Implement additional safety monitoring",
        "Review dosing protocols",
        "Reassess safety reporting procedures"
      ];
    } else if (profileType === ProfileType.VENDOR) {
      recommendations = [
        "Schedule vendor performance review",
        "Implement corrective action plan",
        "Increase oversight of deliverables",
        "Reassess contract terms and conditions"
      ];
    } else if (profileType === ProfileType.FINANCIAL) {
      recommendations = [
        "Conduct financial audit",
        "Review budget allocations",
        "Implement cost control measures",
        "Reassess financial projections"
      ];
    } else if (profileType === ProfileType.RESOURCE) {
      recommendations = [
        "Reassess resource allocation",
        "Implement resource optimization plan",
        "Consider additional staffing",
        "Review workload distribution"
      ];
    }
  } else {
    if (profileType === ProfileType.RISK) {
      recommendations = [
        "Continue standard monitoring",
        "Maintain current oversight level",
        "Review at next scheduled meeting"
      ];
    } else if (profileType === ProfileType.QUALITY) {
      recommendations = [
        "Maintain current data review schedule",
        "Continue existing quality checks",
        "Regular review of metrics"
      ];
    } else if (profileType === ProfileType.COMPLIANCE) {
      recommendations = [
        "Maintain current compliance monitoring",
        "Continue routine document checks",
        "Standard protocol adherence review"
      ];
    } else if (profileType === ProfileType.SAFETY) {
      recommendations = [
        "Continue standard safety monitoring",
        "Review safety metrics at scheduled meetings",
        "Maintain current reporting procedures"
      ];
    } else if (profileType === ProfileType.VENDOR) {
      recommendations = [
        "Maintain current vendor oversight",
        "Regular performance review",
        "Continue standardized communication protocols"
      ];
    } else if (profileType === ProfileType.FINANCIAL) {
      recommendations = [
        "Continue regular financial reporting",
        "Maintain current budget controls",
        "Review at quarterly financial meeting"
      ];
    } else if (profileType === ProfileType.RESOURCE) {
      recommendations = [
        "Maintain current resource allocation",
        "Review workload at scheduled meetings",
        "Continue resource utilization monitoring"
      ];
    }
  }
  
  return (
    <ul className="space-y-2">
      {recommendations.map((recommendation, index) => (
        <li key={index} className="flex items-start">
          <span className="material-icons text-primary-500 mr-2 text-sm">arrow_right</span>
          <span className="text-sm">{recommendation}</span>
        </li>
      ))}
    </ul>
  );
}
