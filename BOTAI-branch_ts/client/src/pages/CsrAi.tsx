import React, { useState } from "react";
import { useLocation } from "wouter";
import AppLayout from "@/components/layout/AppLayout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, FileText, Send, Cpu, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function CsrAi() {
  const [_, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [selectedTrial, setSelectedTrial] = useState<string>("");
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [processingRequest, setProcessingRequest] = useState(false);
  const [responseMessages, setResponseMessages] = useState<{type: string, content: string}[]>([]);
  const { toast } = useToast();

  const { data: trials = [] } = useQuery<any[]>({
    queryKey: ["/api/trials"],
  });

  // CSR domains for clinical study reporting
  const csrDomains = [
    { id: "efficacy", name: "Efficacy" },
    { id: "safety", name: "Safety" },
    { id: "demographics", name: "Demographics" },
    { id: "adverse_events", name: "Adverse Events" },
    { id: "lab_results", name: "Laboratory Results" },
    { id: "dosing", name: "Dosing Information" },
    { id: "study_design", name: "Study Design" },
    { id: "inclusion_exclusion", name: "Inclusion/Exclusion" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast({
        title: "Query Required",
        description: "Please enter a query for the CSR.AI agent",
        variant: "destructive"
      });
      return;
    }

    if (!selectedTrial) {
      toast({
        title: "Trial Selection Required",
        description: "Please select a trial for analysis",
        variant: "destructive"
      });
      return;
    }

    setProcessingRequest(true);
    
    // Add user query to messages
    setResponseMessages(prev => [...prev, {
      type: 'user',
      content: query
    }]);

    try {
      // Simulate response - in a real implementation, this would be an API call
      setTimeout(() => {
        setResponseMessages(prev => [...prev, {
          type: 'agent',
          content: generateCsrResponse(query, selectedDomain)
        }]);
        setProcessingRequest(false);
        setQuery("");
      }, 1500);
    } catch (error) {
      toast({
        title: "Request Failed",
        description: "Failed to process your request. Please try again.",
        variant: "destructive"
      });
      setProcessingRequest(false);
    }
  };

  // This is a placeholder function - in a real implementation, this would be replaced with actual API responses
  function generateCsrResponse(query: string, domain: string): string {
    const responses: Record<string, string> = {
      "efficacy": "Based on the efficacy data analysis, the primary endpoint showed statistically significant improvement (p<0.001) in the treatment group compared to placebo. The treatment effect was consistent across all predetermined subgroups.",
      "safety": "Safety analysis indicates that the most common adverse events were mild to moderate in severity. No unexpected safety signals were identified. The benefit-risk assessment remains favorable.",
      "demographics": "The study enrolled a diverse population with appropriate representation across age groups, genders, and ethnicities, consistent with the study's inclusion criteria and the disease prevalence in the general population.",
      "adverse_events": "Analysis of adverse events shows that treatment-emergent adverse events occurred in 45% of the treatment group versus 42% in the placebo group. Most were mild to moderate, with no statistically significant differences in serious adverse events.",
      "lab_results": "Laboratory measurements remained within normal ranges for most participants. Transient elevations in liver enzymes were observed in 3% of subjects but resolved without intervention.",
      "dosing": "The dosing analysis confirms 92% adherence to the study medication regimen. Pharmacokinetic parameters were consistent with phase 1 and 2 studies.",
      "study_design": "The study design followed all prespecified protocols. Minor protocol deviations were documented in 7% of cases but did not impact the overall integrity of the study findings.",
      "inclusion_exclusion": "All enrolled participants met the inclusion/exclusion criteria. Post-hoc sensitivity analyses excluding borderline cases confirmed the robustness of the primary results."
    };

    if (domain && responses[domain]) {
      return responses[domain];
    }

    if (query.toLowerCase().includes("summary")) {
      return "The clinical study demonstrated statistically significant efficacy with an acceptable safety profile. All primary and key secondary endpoints were met, supporting the clinical benefit of the treatment.";
    } else if (query.toLowerCase().includes("recommendation")) {
      return "Based on the comprehensive analysis of efficacy and safety data, the CSR supports proceeding with regulatory submission. The benefit-risk profile is favorable for the studied indication.";
    } else if (query.toLowerCase().includes("population")) {
      return "The study population demographics were well-balanced between treatment arms and representative of the target population for the intended indication.";
    }

    return "I've analyzed the clinical trial data based on your query. The data suggests positive outcomes across primary endpoints with an acceptable safety profile. Would you like more specific information about efficacy, safety, or particular subgroups?";
  }

  return (
    <AppLayout>
      {/* CSR.AI Super Agent Card */}
      <div className="agent-card csr-agent mb-6">
        <div className="agent-icon-wrapper">
          <div className="document-frame">
            <div className="glow-effect blue-glow"></div>
            <FileText className="agent-icon blue-icon" />
            <div className="text-lines"></div>
          </div>
        </div>
        <div className="agent-details">
          <h3 className="agent-title">
            <span className="highlight blue">The Report Architect</span>
          </h3>
          <div className="agent-subtitle">CSR.AI</div>
          <div className="agent-status">
            <span className="status-dot active"></span>
            <span>Analyzing clinical data for report generation</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/ai-agents")} 
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to AI Agents Hub
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">CSR.AI Assistant</h1>
          <p className="text-muted-foreground">
            Clinical Study Report Assistance with AI-powered analysis and report generation
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Generate Full Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Parameters</CardTitle>
              <CardDescription>
                Configure the CSR analysis context
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Trial</label>
                <Select value={selectedTrial} onValueChange={setSelectedTrial}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Trial" />
                  </SelectTrigger>
                  <SelectContent>
                    {trials?.map((trial: any) => (
                      <SelectItem key={trial.id} value={trial.id.toString()}>
                        {trial.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">CSR Domain</label>
                <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {csrDomains.map(domain => (
                      <SelectItem key={domain.id} value={domain.id}>
                        {domain.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2">
                <Button variant="secondary" className="w-full gap-2">
                  <BookOpen className="h-4 w-4" />
                  Browse Templates
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CSR Guidelines</CardTitle>
              <CardDescription>
                Reference ICH E3 guidance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">ICH E3 Structure</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Regulatory Requirements</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Statistical Methodology</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Safety Reporting</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>CSR.AI Assistant</CardTitle>
              <CardDescription>
                Ask questions about clinical data or request assistance with CSR sections
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-auto max-h-[600px] space-y-4">
              {responseMessages.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-center">
                  <div>
                    <p>No conversation history yet.</p>
                    <p className="text-sm">Ask a question about trial data or request help with a CSR section.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {responseMessages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 ${
                        msg.type === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        {msg.type === 'agent' && (
                          <Badge variant="outline" className="mb-2">CSR.AI</Badge>
                        )}
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <div className="p-4 border-t">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask about clinical data or request CSR section help..."
                  disabled={processingRequest}
                />
                <Button type="submit" disabled={processingRequest}>
                  {processingRequest ? "Processing..." : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}