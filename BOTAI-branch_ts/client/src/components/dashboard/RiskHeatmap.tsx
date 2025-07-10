import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

type RiskLevel = 'Low' | 'Medium' | 'High';

type SiteRiskData = {
  siteId: string;
  piName: string;
  patientRisk: number;
  protocolDeviation: number;
  dataQuality: number;
  adverseEvents: number;
  compliance: number;
  overallRisk: RiskLevel;
};

const getRiskColor = (value: number) => {
  if (value <= 30) return "bg-green-500";
  if (value <= 50) return "bg-yellow-400";
  if (value <= 70) return "bg-orange-400";
  return "bg-red-500";
};

const getRiskBgColor = (value: number) => {
  if (value <= 30) return "bg-green-100";
  if (value <= 50) return "bg-yellow-100";
  if (value <= 70) return "bg-orange-100";
  return "bg-red-100";
};

const getBadgeColor = (risk: RiskLevel) => {
  switch (risk) {
    case 'Low':
      return 'bg-green-100 text-green-800';
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'High':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-neutral-100 text-neutral-800';
  }
};

export default function RiskHeatmap() {
  const { data: sites = [], isLoading } = useQuery({
    queryKey: ['/api/sites'],
    select: (data) => {
      // Transform API data to the format we need
      return data.map((site: any) => {
        // In a real implementation, we'd fetch the associated risk profile
        // For now, we'll use the demo data from the design
        
        let riskData: SiteRiskData;
        
        if (site.siteId === "Site 123") {
          riskData = {
            siteId: site.siteId,
            piName: site.principalInvestigator,
            patientRisk: 80,
            protocolDeviation: 90,
            dataQuality: 70,
            adverseEvents: 50,
            compliance: 60,
            overallRisk: 'High'
          };
        } else if (site.siteId === "Site 145") {
          riskData = {
            siteId: site.siteId,
            piName: site.principalInvestigator,
            patientRisk: 20,
            protocolDeviation: 30,
            dataQuality: 50,
            adverseEvents: 20,
            compliance: 10,
            overallRisk: 'Low'
          };
        } else {
          riskData = {
            siteId: site.siteId,
            piName: site.principalInvestigator,
            patientRisk: 50,
            protocolDeviation: 60,
            dataQuality: 70,
            adverseEvents: 40,
            compliance: 50,
            overallRisk: 'Medium'
          };
        }
        
        return riskData;
      });
    }
  });

  return (
    <Card className="col-span-2">
      <CardHeader className="border-b border-neutral-200 px-4 py-4 flex-row justify-between items-center">
        <CardTitle className="text-base font-medium text-neutral-800">Risk Heatmap by Site</CardTitle>
        <div className="flex space-x-2">
          <button className="p-1 rounded hover:bg-neutral-100">
            <span className="material-icons text-neutral-500">more_vert</span>
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex justify-between text-sm text-neutral-600 mb-2">
          <span>Low Risk</span>
          <span>High Risk</span>
        </div>
        <div className="flex space-x-1 mb-4">
          <div className="h-2 w-1/5 bg-green-100 rounded-l"></div>
          <div className="h-2 w-1/5 bg-green-300"></div>
          <div className="h-2 w-1/5 bg-yellow-300"></div>
          <div className="h-2 w-1/5 bg-orange-300"></div>
          <div className="h-2 w-1/5 bg-red-500 rounded-r"></div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-neutral-600 border-b border-neutral-200">
                <th className="px-4 py-2 text-left font-medium">Site ID</th>
                <th className="px-4 py-2 text-left font-medium">PI Name</th>
                <th className="px-4 py-2 text-left font-medium">Patients</th>
                <th className="px-4 py-2 text-left font-medium">Protocol Dev.</th>
                <th className="px-4 py-2 text-left font-medium">Data Quality</th>
                <th className="px-4 py-2 text-left font-medium">AE Reports</th>
                <th className="px-4 py-2 text-left font-medium">Compliance</th>
                <th className="px-4 py-2 text-left font-medium">Overall Risk</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">Loading risk data...</td>
                </tr>
              ) : (
                sites.map((site: SiteRiskData) => (
                  <tr key={site.siteId} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="px-4 py-3">{site.siteId}</td>
                    <td className="px-4 py-3">{site.piName}</td>
                    <td className="px-4 py-3">
                      <div className={cn("h-6 w-full", getRiskBgColor(site.patientRisk), "rounded")}>
                        <div 
                          className={cn("h-6", getRiskColor(site.patientRisk), "rounded")} 
                          style={{ width: `${site.patientRisk}%` }} 
                          title={`${site.patientRisk}% Risk`}
                        ></div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={cn("h-6 w-full", getRiskBgColor(site.protocolDeviation), "rounded")}>
                        <div 
                          className={cn("h-6", getRiskColor(site.protocolDeviation), "rounded")} 
                          style={{ width: `${site.protocolDeviation}%` }} 
                          title={`${site.protocolDeviation}% Risk`}
                        ></div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={cn("h-6 w-full", getRiskBgColor(site.dataQuality), "rounded")}>
                        <div 
                          className={cn("h-6", getRiskColor(site.dataQuality), "rounded")} 
                          style={{ width: `${site.dataQuality}%` }} 
                          title={`${site.dataQuality}% Risk`}
                        ></div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={cn("h-6 w-full", getRiskBgColor(site.adverseEvents), "rounded")}>
                        <div 
                          className={cn("h-6", getRiskColor(site.adverseEvents), "rounded")} 
                          style={{ width: `${site.adverseEvents}%` }} 
                          title={`${site.adverseEvents}% Risk`}
                        ></div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={cn("h-6 w-full", getRiskBgColor(site.compliance), "rounded")}>
                        <div 
                          className={cn("h-6", getRiskColor(site.compliance), "rounded")} 
                          style={{ width: `${site.compliance}%` }} 
                          title={`${site.compliance}% Risk`}
                        ></div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", getBadgeColor(site.overallRisk))}>
                        {site.overallRisk}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
