import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RiskCategory = "patient" | "protocol" | "site" | "data";

type ThresholdField = {
  category: RiskCategory;
  metric: string;
  threshold: number;
  severity: "low" | "medium" | "high";
};

interface ThresholdConfigFormProps {
  trialId: number;
  initialThresholds?: ThresholdField[];
  onSave?: (thresholds: ThresholdField[]) => void;
}

export default function ThresholdConfigForm({ 
  trialId, 
  initialThresholds = [], 
  onSave 
}: ThresholdConfigFormProps) {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<RiskCategory>("patient");
  const [thresholds, setThresholds] = useState<ThresholdField[]>(initialThresholds);
  
  // Fetch existing thresholds if needed
  const { data: savedThresholds = [], isLoading } = useQuery({ 
    queryKey: ['/api/trials', trialId, 'thresholds'],
    enabled: initialThresholds.length === 0 && trialId > 0
  });
  
  useEffect(() => {
    if (savedThresholds.length > 0 && thresholds.length === 0) {
      setThresholds(savedThresholds);
    } else if (initialThresholds.length > 0 && thresholds.length === 0) {
      setThresholds(initialThresholds);
    }
  }, [savedThresholds, initialThresholds, thresholds]);
  
  const getCategoryLabel = (category: RiskCategory) => {
    switch(category) {
      case "patient": return "Patient Risk";
      case "protocol": return "Protocol Deviation";
      case "site": return "Site Performance";
      case "data": return "Data Quality";
      default: return "Risk Category";
    }
  };

  // If there are no thresholds yet, populate with defaults
  useEffect(() => {
    if (!isLoading && thresholds.length === 0) {
      // Set up some default thresholds for each category
      const defaultThresholds: ThresholdField[] = [
        // Patient risk metrics
        { category: "patient", metric: "Adverse Event Rate", threshold: 10, severity: "medium" },
        { category: "patient", metric: "Severe AE Rate", threshold: 5, severity: "high" },
        { category: "patient", metric: "Protocol Violation Per Patient", threshold: 2, severity: "medium" },
        { category: "patient", metric: "Dropout Rate", threshold: 15, severity: "medium" },
        
        // Protocol deviation metrics
        { category: "protocol", metric: "Major Deviations", threshold: 8, severity: "high" },
        { category: "protocol", metric: "Minor Deviations", threshold: 20, severity: "low" },
        { category: "protocol", metric: "Eligibility Violations", threshold: 3, severity: "high" },
        { category: "protocol", metric: "Visit Window Violations", threshold: 12, severity: "medium" },
        
        // Site performance metrics
        { category: "site", metric: "Enrollment Rate", threshold: 75, severity: "medium" },
        { category: "site", metric: "Query Response Time (days)", threshold: 7, severity: "medium" },
        { category: "site", metric: "Staff Turnover Rate", threshold: 25, severity: "medium" },
        { category: "site", metric: "Protocol Compliance Score", threshold: 85, severity: "high" },
        
        // Data quality metrics
        { category: "data", metric: "Missing Data Rate", threshold: 5, severity: "high" },
        { category: "data", metric: "Query Rate", threshold: 15, severity: "medium" },
        { category: "data", metric: "Data Entry Lag (days)", threshold: 10, severity: "medium" },
        { category: "data", metric: "eCRF Completion Rate", threshold: 90, severity: "high" },
      ];
      
      setThresholds(defaultThresholds);
    }
  }, [isLoading, thresholds.length]);
  
  const handleSave = async () => {
    try {
      // In a real app, we'd send the thresholds to the server
      if (onSave) {
        onSave(thresholds);
      } else {
        // Simulate API call 
        await new Promise(resolve => setTimeout(resolve, 500));
        
        toast({
          title: "Thresholds saved",
          description: "Risk thresholds have been updated successfully."
        });
      }
    } catch (error) {
      toast({
        title: "Error saving thresholds",
        description: "There was a problem saving your threshold configuration.",
        variant: "destructive"
      });
    }
  };
  
  const handleThresholdChange = (
    index: number, 
    field: keyof ThresholdField, 
    value: string | number
  ) => {
    const updatedThresholds = [...thresholds];
    
    if (field === 'threshold') {
      updatedThresholds[index][field] = Number(value);
    } else {
      // @ts-ignore: Type 'string' is not assignable to type...
      updatedThresholds[index][field] = value;
    }
    
    setThresholds(updatedThresholds);
  };
  
  const filteredThresholds = thresholds.filter(
    threshold => threshold.category === activeCategory
  );
  
  if (isLoading) {
    return <div className="p-4">Loading threshold configuration...</div>;
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Risk Assessment Thresholds</h3>
        <p className="text-neutral-600 mb-6">
          Configure the threshold values that determine risk severity levels for each category.
          These settings will be used to calculate risk scores and trigger alerts.
        </p>
      </div>
      
      <Tabs 
        defaultValue="patient" 
        value={activeCategory}
        onValueChange={(value) => setActiveCategory(value as RiskCategory)}
      >
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="patient">Patient Risk</TabsTrigger>
          <TabsTrigger value="protocol">Protocol Deviation</TabsTrigger>
          <TabsTrigger value="site">Site Performance</TabsTrigger>
          <TabsTrigger value="data">Data Quality</TabsTrigger>
        </TabsList>
        
        {/* We'll render the same form component for each tab, just filtering by category */}
        {["patient", "protocol", "site", "data"].map((category) => (
          <TabsContent key={category} value={category}>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-4 font-medium text-sm text-neutral-600 mb-2">
                    <div className="col-span-5">Metric</div>
                    <div className="col-span-3">Threshold</div>
                    <div className="col-span-4">Severity Level</div>
                  </div>
                  
                  {filteredThresholds.map((threshold, index) => {
                    const thresholdIndex = thresholds.findIndex(t => 
                      t.category === threshold.category && t.metric === threshold.metric
                    );
                    
                    return (
                      <div key={`${threshold.category}-${threshold.metric}`} className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-5">
                          <Label>{threshold.metric}</Label>
                        </div>
                        <div className="col-span-3">
                          <div className="flex items-center">
                            <Input
                              type="number"
                              value={threshold.threshold}
                              onChange={(e) => 
                                handleThresholdChange(thresholdIndex, 'threshold', e.target.value)
                              }
                              className="w-20 mr-2"
                            />
                            <span className="text-sm text-neutral-500">%</span>
                          </div>
                        </div>
                        <div className="col-span-4">
                          <Select
                            value={threshold.severity}
                            onValueChange={(value) => 
                              handleThresholdChange(thresholdIndex, 'severity', value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
      
      <div className="flex justify-end">
        <Button variant="outline" className="mr-2">Reset to Defaults</Button>
        <Button onClick={handleSave}>Save Thresholds</Button>
      </div>
    </div>
  );
}