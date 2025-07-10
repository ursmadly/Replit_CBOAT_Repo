import { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  ArrowDownUp,
  ArrowUp,
  ArrowDown,
  Filter,
  FileText
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface LabDataProps {
  studyId: number;
  vendor: string;
}

interface LabTest {
  id: string;
  name: string;
  category: string;
  unit: string;
  normalRangeLow: number;
  normalRangeHigh: number;
  clinicalSignificance: string;
}

interface LabSampleData {
  subjectId: string;
  visitName: string;
  visitDate: string;
  sampleId: string;
  collectionDate: string;
  testResults: {
    testId: string;
    result: number;
    unit: string;
    flag: "normal" | "low" | "high" | "missing";
  }[];
}

function generateLabSampleData(count: number = 5): LabSampleData[] {
  const data: LabSampleData[] = [];
  const subjectIds = Array.from({ length: 10 }, (_, i) => `S-${String(i + 1).padStart(3, '0')}`);
  const visitNames = ["Screening", "Baseline", "Week 1", "Week 2", "Week 4", "Week 8", "Week 12", "End of Treatment"];
  const sampleTypes = ["Blood", "Urine", "CSF", "Tissue"];
  
  const labTests: LabTest[] = [
    {
      id: "CBC-HGB",
      name: "Hemoglobin",
      category: "Hematology",
      unit: "g/dL",
      normalRangeLow: 12.0,
      normalRangeHigh: 16.0,
      clinicalSignificance: "Oxygen-carrying capacity"
    },
    {
      id: "CBC-PLT",
      name: "Platelets",
      category: "Hematology",
      unit: "x10^3/µL",
      normalRangeLow: 150,
      normalRangeHigh: 450,
      clinicalSignificance: "Bleeding risk"
    },
    {
      id: "CHEM-GLU",
      name: "Glucose",
      category: "Chemistry",
      unit: "mg/dL",
      normalRangeLow: 70,
      normalRangeHigh: 99,
      clinicalSignificance: "Diabetes monitoring"
    },
    {
      id: "CHEM-CREA",
      name: "Creatinine",
      category: "Chemistry",
      unit: "mg/dL",
      normalRangeLow: 0.6,
      normalRangeHigh: 1.2,
      clinicalSignificance: "Renal function"
    },
    {
      id: "LFT-ALT",
      name: "ALT",
      category: "Liver Function",
      unit: "U/L",
      normalRangeLow: 7,
      normalRangeHigh: 55,
      clinicalSignificance: "Liver damage"
    },
    {
      id: "LFT-AST",
      name: "AST",
      category: "Liver Function",
      unit: "U/L",
      normalRangeLow: 8,
      normalRangeHigh: 48,
      clinicalSignificance: "Liver damage"
    },
    {
      id: "LIPID-CHOL",
      name: "Total Cholesterol",
      category: "Lipids",
      unit: "mg/dL",
      normalRangeLow: 125,
      normalRangeHigh: 200,
      clinicalSignificance: "Cardiovascular risk"
    },
    {
      id: "LIPID-TG",
      name: "Triglycerides",
      category: "Lipids",
      unit: "mg/dL",
      normalRangeLow: 0,
      normalRangeHigh: 150,
      clinicalSignificance: "Cardiovascular risk"
    }
  ];
  
  for (let i = 0; i < count; i++) {
    const subjectId = subjectIds[Math.floor(Math.random() * subjectIds.length)];
    const visitName = visitNames[Math.floor(Math.random() * visitNames.length)];
    const visitDate = new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const sampleId = `${subjectId}-${sampleTypes[Math.floor(Math.random() * sampleTypes.length)]}-${Math.floor(Math.random() * 1000)}`;
    const collectionDate = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const testResults = labTests.map(test => {
      // Generate result within or out of range
      const isNormal = Math.random() > 0.3;
      let result: number;
      
      if (isNormal) {
        // Generate normal result
        result = test.normalRangeLow + (Math.random() * (test.normalRangeHigh - test.normalRangeLow));
      } else {
        // Generate abnormal result (high or low)
        const isHigh = Math.random() > 0.5;
        if (isHigh) {
          result = test.normalRangeHigh + (Math.random() * test.normalRangeHigh * 0.5);
        } else {
          result = test.normalRangeLow - (Math.random() * test.normalRangeLow * 0.5);
          result = Math.max(0, result); // Ensure no negative values
        }
      }
      
      // Determine flag based on result
      let flag: "normal" | "low" | "high" | "missing";
      if (result < test.normalRangeLow) {
        flag = "low";
      } else if (result > test.normalRangeHigh) {
        flag = "high";
      } else {
        flag = "normal";
      }
      
      // Small chance of missing value
      if (Math.random() < 0.1) {
        result = 0;
        flag = "missing";
      }
      
      return {
        testId: test.id,
        result: parseFloat(result.toFixed(2)),
        unit: test.unit,
        flag
      };
    });
    
    data.push({
      subjectId,
      visitName,
      visitDate,
      sampleId,
      collectionDate,
      testResults
    });
  }
  
  return data;
}

export function LabData({ studyId, vendor }: LabDataProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("samples");
  const [flagFilter, setFlagFilter] = useState<string>("all");
  
  // Generate sample data
  const labTests: LabTest[] = [
    {
      id: "CBC-HGB",
      name: "Hemoglobin",
      category: "Hematology",
      unit: "g/dL",
      normalRangeLow: 12.0,
      normalRangeHigh: 16.0,
      clinicalSignificance: "Oxygen-carrying capacity"
    },
    {
      id: "CBC-PLT",
      name: "Platelets",
      category: "Hematology",
      unit: "x10^3/µL",
      normalRangeLow: 150,
      normalRangeHigh: 450,
      clinicalSignificance: "Bleeding risk"
    },
    {
      id: "CHEM-GLU",
      name: "Glucose",
      category: "Chemistry",
      unit: "mg/dL",
      normalRangeLow: 70,
      normalRangeHigh: 99,
      clinicalSignificance: "Diabetes monitoring"
    },
    {
      id: "CHEM-CREA",
      name: "Creatinine",
      category: "Chemistry",
      unit: "mg/dL",
      normalRangeLow: 0.6,
      normalRangeHigh: 1.2,
      clinicalSignificance: "Renal function"
    },
    {
      id: "LFT-ALT",
      name: "ALT",
      category: "Liver Function",
      unit: "U/L",
      normalRangeLow: 7,
      normalRangeHigh: 55,
      clinicalSignificance: "Liver damage"
    },
    {
      id: "LFT-AST",
      name: "AST",
      category: "Liver Function",
      unit: "U/L",
      normalRangeLow: 8,
      normalRangeHigh: 48,
      clinicalSignificance: "Liver damage"
    },
    {
      id: "LIPID-CHOL",
      name: "Total Cholesterol",
      category: "Lipids",
      unit: "mg/dL",
      normalRangeLow: 125,
      normalRangeHigh: 200,
      clinicalSignificance: "Cardiovascular risk"
    },
    {
      id: "LIPID-TG",
      name: "Triglycerides",
      category: "Lipids",
      unit: "mg/dL",
      normalRangeLow: 0,
      normalRangeHigh: 150,
      clinicalSignificance: "Cardiovascular risk"
    }
  ];
  
  const labSamples = generateLabSampleData(10);
  
  // Filter samples based on search query
  const filteredSamples = labSamples.filter(sample => {
    // Check if any field contains the search query
    const matchesSearch = 
      sample.subjectId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.visitName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.sampleId.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Check if any test result matches flag filter
    const matchesFlag = 
      flagFilter === "all" ||
      sample.testResults.some(test => test.flag === flagFilter);
    
    return matchesSearch && matchesFlag;
  });
  
  // Flatten test results for trends analysis
  const allTestResults = labSamples.flatMap(sample => 
    sample.testResults.map(test => ({
      subjectId: sample.subjectId,
      visitName: sample.visitName,
      visitDate: sample.visitDate,
      sampleId: sample.sampleId,
      collectionDate: sample.collectionDate,
      ...test
    }))
  );
  
  // Count abnormal results
  const abnormalResults = {
    high: allTestResults.filter(r => r.flag === "high").length,
    low: allTestResults.filter(r => r.flag === "low").length,
    missing: allTestResults.filter(r => r.flag === "missing").length,
    normal: allTestResults.filter(r => r.flag === "normal").length,
    total: allTestResults.length
  };
  
  // Function to render a flag indicator
  const renderFlag = (flag: "normal" | "low" | "high" | "missing") => {
    switch (flag) {
      case "high":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 flex items-center gap-1">
            <ArrowUp className="h-3 w-3" />
            <span>High</span>
          </Badge>
        );
      case "low":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 flex items-center gap-1">
            <ArrowDown className="h-3 w-3" />
            <span>Low</span>
          </Badge>
        );
      case "normal":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 flex items-center gap-1">
            <span>Normal</span>
          </Badge>
        );
      case "missing":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            <span>Missing</span>
          </Badge>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Lab Data Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <Card className="p-3 flex flex-col items-center justify-center">
          <span className="text-sm text-muted-foreground">Total Results</span>
          <span className="text-2xl font-semibold">{abnormalResults.total}</span>
        </Card>
        <Card className="p-3 flex flex-col items-center justify-center bg-green-50">
          <span className="text-sm text-green-700">Normal</span>
          <span className="text-2xl font-semibold text-green-700">{abnormalResults.normal}</span>
        </Card>
        <Card className="p-3 flex flex-col items-center justify-center bg-red-50">
          <span className="text-sm text-red-700">High</span>
          <span className="text-2xl font-semibold text-red-700">{abnormalResults.high}</span>
        </Card>
        <Card className="p-3 flex flex-col items-center justify-center bg-blue-50">
          <span className="text-sm text-blue-700">Low</span>
          <span className="text-2xl font-semibold text-blue-700">{abnormalResults.low}</span>
        </Card>
        <Card className="p-3 flex flex-col items-center justify-center bg-gray-50">
          <span className="text-sm text-gray-700">Missing</span>
          <span className="text-2xl font-semibold text-gray-700">{abnormalResults.missing}</span>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="samples">Lab Samples</TabsTrigger>
          <TabsTrigger value="tests">Test Definitions</TabsTrigger>
          <TabsTrigger value="trends">Trends Analysis</TabsTrigger>
        </TabsList>
        
        {/* Lab Samples Tab */}
        <TabsContent value="samples" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full sm:w-64">
              <Input
                placeholder="Search by subject, visit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
              <span className="absolute left-2.5 top-2.5 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
              </span>
            </div>
            
            <div className="flex gap-2">
              <Select
                value={flagFilter}
                onValueChange={setFlagFilter}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by flag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="missing">Missing</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="icon">
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableCaption>
                Lab samples for Study {studyId > 0 ? studyId : "All"} {vendor ? `- ${vendor}` : ""}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject ID</TableHead>
                  <TableHead>Visit</TableHead>
                  <TableHead>Sample ID</TableHead>
                  <TableHead>Collection Date</TableHead>
                  <TableHead className="text-right">Tests</TableHead>
                  <TableHead className="text-right">Flags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSamples.length > 0 ? (
                  filteredSamples.map((sample) => (
                    <TableRow key={sample.sampleId}>
                      <TableCell className="font-medium">{sample.subjectId}</TableCell>
                      <TableCell>{sample.visitName}</TableCell>
                      <TableCell>{sample.sampleId}</TableCell>
                      <TableCell>{sample.collectionDate}</TableCell>
                      <TableCell className="text-right">{sample.testResults.length}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {sample.testResults.some(t => t.flag === "high") && (
                            <Badge variant="outline" className="bg-red-100 text-red-800">
                              <ArrowUp className="h-3 w-3 mr-1" />
                              {sample.testResults.filter(t => t.flag === "high").length}
                            </Badge>
                          )}
                          
                          {sample.testResults.some(t => t.flag === "low") && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              <ArrowDown className="h-3 w-3 mr-1" />
                              {sample.testResults.filter(t => t.flag === "low").length}
                            </Badge>
                          )}
                          
                          {sample.testResults.some(t => t.flag === "missing") && (
                            <Badge variant="outline" className="bg-gray-100 text-gray-800">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {sample.testResults.filter(t => t.flag === "missing").length}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      No lab samples found matching your criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        {/* Test Definitions Tab */}
        <TabsContent value="tests">
          <div className="rounded-md border">
            <Table>
              <TableCaption>
                Lab Test Definitions for Study {studyId > 0 ? studyId : "All"} {vendor ? `- ${vendor}` : ""}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Test ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Normal Range</TableHead>
                  <TableHead>Clinical Significance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {labTests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">{test.id}</TableCell>
                    <TableCell>{test.name}</TableCell>
                    <TableCell>{test.category}</TableCell>
                    <TableCell>{test.unit}</TableCell>
                    <TableCell>{`${test.normalRangeLow} - ${test.normalRangeHigh}`}</TableCell>
                    <TableCell>{test.clinicalSignificance}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        {/* Trends Analysis Tab */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Lab Test Result Trends</CardTitle>
              <CardDescription>
                Visualization and analysis of lab test results over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center h-60 border rounded-md bg-gray-50">
                <div className="text-muted-foreground mb-2">Trend Visualization</div>
                <p className="text-sm text-center max-w-md text-muted-foreground">
                  Trend visualization for lab test results would appear here, showing temporal patterns and 
                  highlighting outliers or concerning trends across patient cohorts.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}