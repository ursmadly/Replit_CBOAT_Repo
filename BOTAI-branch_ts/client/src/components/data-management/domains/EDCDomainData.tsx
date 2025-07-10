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
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Filter
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

interface EDCDomainDataProps {
  studyId: number;
  domain: string;
  vendor: string;
}

// Mock function to generate domain-specific data
function generateDomainData(domain: string, count: number = 15) {
  const data: Record<string, any>[] = [];
  
  // Common metadata fields for all domains
  const statuses = ["complete", "incomplete", "query", "missing"];
  const subjectIds = Array.from({ length: 10 }, (_, i) => `S-${String(i + 1).padStart(3, '0')}`);
  const visitNames = ["Screening", "Baseline", "Week 1", "Week 2", "Week 4", "Week 8", "Week 12", "End of Treatment"];
  
  // Domain-specific field generators
  const domainSpecificFields: Record<string, () => Record<string, any>> = {
    "DM": () => ({
      subjectId: subjectIds[Math.floor(Math.random() * subjectIds.length)],
      sex: Math.random() > 0.5 ? "M" : "F",
      age: Math.floor(Math.random() * 40) + 25,
      race: ["White", "Black", "Asian", "Other"][Math.floor(Math.random() * 4)],
      ethnicity: ["Hispanic or Latino", "Not Hispanic or Latino"][Math.floor(Math.random() * 2)],
      status: statuses[Math.floor(Math.random() * statuses.length)]
    }),
    "AE": () => ({
      subjectId: subjectIds[Math.floor(Math.random() * subjectIds.length)],
      aeterm: ["Headache", "Nausea", "Fatigue", "Dizziness", "Rash", "Pain"][Math.floor(Math.random() * 6)],
      aeseverity: ["Mild", "Moderate", "Severe"][Math.floor(Math.random() * 3)],
      aestart: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      aeend: Math.random() > 0.3 ? new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : "",
      aerelated: ["Yes", "No", "Possibly"][Math.floor(Math.random() * 3)],
      status: statuses[Math.floor(Math.random() * statuses.length)]
    }),
    "SAE": () => ({
      subjectId: subjectIds[Math.floor(Math.random() * subjectIds.length)],
      aeterm: ["Hospitalization", "Life-threatening condition", "Severe reaction", "Disability"][Math.floor(Math.random() * 4)],
      aeseverity: ["Severe", "Life-threatening"][Math.floor(Math.random() * 2)],
      aestart: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      aeend: Math.random() > 0.3 ? new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : "",
      aerelated: ["Yes", "No", "Possibly"][Math.floor(Math.random() * 3)],
      saeoutcome: ["Resolved", "Ongoing", "Death", "Unknown"][Math.floor(Math.random() * 4)],
      status: statuses[Math.floor(Math.random() * statuses.length)]
    }),
    "DS": () => ({
      subjectId: subjectIds[Math.floor(Math.random() * subjectIds.length)],
      dsterm: ["RANDOMIZED", "COMPLETED", "ADVERSE EVENT", "PROTOCOL VIOLATION", "WITHDRAWAL BY SUBJECT"][Math.floor(Math.random() * 5)],
      dsdecod: ["Randomized", "Completed", "Adverse Event", "Protocol Violation", "Withdrawal by Subject"][Math.floor(Math.random() * 5)],
      dsstdtc: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dsendtc: Math.random() > 0.5 ? new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : "",
      status: statuses[Math.floor(Math.random() * statuses.length)]
    }),
    "MH": () => ({
      subjectId: subjectIds[Math.floor(Math.random() * subjectIds.length)],
      mhterm: ["Hypertension", "Diabetes", "Asthma", "Depression", "Hyperlipidemia"][Math.floor(Math.random() * 5)],
      mhstdtc: new Date(Date.now() - Math.floor(Math.random() * 365 * 5) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      mhendtc: Math.random() > 0.6 ? new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : "",
      mhongo: Math.random() > 0.6 ? "Y" : "N",
      status: statuses[Math.floor(Math.random() * statuses.length)]
    }),
    "CM": () => ({
      subjectId: subjectIds[Math.floor(Math.random() * subjectIds.length)],
      cmtrt: ["Acetaminophen", "Ibuprofen", "Lisinopril", "Metformin", "Atorvastatin", "Amoxicillin"][Math.floor(Math.random() * 6)],
      cmstdtc: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      cmendtc: Math.random() > 0.4 ? new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : "",
      cmdose: `${Math.floor(Math.random() * 500) + 100} mg`,
      cmroute: ["ORAL", "INTRAVENOUS", "TOPICAL", "SUBCUTANEOUS"][Math.floor(Math.random() * 4)],
      cmongo: Math.random() > 0.4 ? "Y" : "N",
      status: statuses[Math.floor(Math.random() * statuses.length)]
    }),
    "PD": () => ({
      subjectId: subjectIds[Math.floor(Math.random() * subjectIds.length)],
      visitName: visitNames[Math.floor(Math.random() * visitNames.length)],
      pdtest: ["Glucose", "Insulin", "HbA1c", "C-peptide"][Math.floor(Math.random() * 4)],
      pdorres: `${(Math.random() * 10 + 5).toFixed(2)}`,
      pdorresu: ["mmol/L", "pmol/L", "%", "ng/mL"][Math.floor(Math.random() * 4)],
      pddtc: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: statuses[Math.floor(Math.random() * statuses.length)]
    }),
    "VS": () => ({
      subjectId: subjectIds[Math.floor(Math.random() * subjectIds.length)],
      visitName: visitNames[Math.floor(Math.random() * visitNames.length)],
      vstest: ["Systolic Blood Pressure", "Diastolic Blood Pressure", "Heart Rate", "Respiratory Rate", "Temperature"][Math.floor(Math.random() * 5)],
      vsorres: `${Math.floor(Math.random() * 50) + 60}`,
      vsorresu: ["mmHg", "bpm", "brpm", "C"][Math.floor(Math.random() * 4)],
      vsdtc: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: statuses[Math.floor(Math.random() * statuses.length)]
    }),
    "LB": () => ({
      subjectId: subjectIds[Math.floor(Math.random() * subjectIds.length)],
      visitName: visitNames[Math.floor(Math.random() * visitNames.length)],
      lbtest: ["Hemoglobin", "Hematocrit", "Red Blood Cells", "White Blood Cells", "Platelets", "Glucose"][Math.floor(Math.random() * 6)],
      lborres: `${(Math.random() * 15 + 5).toFixed(2)}`,
      lborresu: ["g/dL", "%", "x10^6/µL", "x10^3/µL", "mmol/L"][Math.floor(Math.random() * 5)],
      lbdtc: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: statuses[Math.floor(Math.random() * statuses.length)]
    }),
    "EX": () => ({
      subjectId: subjectIds[Math.floor(Math.random() * subjectIds.length)],
      visitName: visitNames[Math.floor(Math.random() * visitNames.length)],
      extrt: ["Study Drug", "Placebo"][Math.floor(Math.random() * 2)],
      exdose: `${Math.floor(Math.random() * 500) + 100}`,
      exdosu: "mg",
      exstdtc: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      exendtc: Math.random() > 0.3 ? new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : "",
      status: statuses[Math.floor(Math.random() * statuses.length)]
    })
  };
  
  // Generate data specific to the requested domain
  const generator = domainSpecificFields[domain] || domainSpecificFields["DM"];
  
  for (let i = 0; i < count; i++) {
    data.push({
      id: `${domain}-${i + 1}`,
      ...generator()
    });
  }
  
  return data;
}

export function EDCDomainData({ studyId, domain, vendor }: EDCDomainDataProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Generate domain data with our mock function
  const domainData = generateDomainData(domain);
  
  // Common columns for all domains
  const commonColumns: Record<string, string> = {
    "id": "Record ID",
    "subjectId": "Subject ID",
    "status": "Status"
  };
  
  // Domain-specific column definitions
  const domainColumns: Record<string, Record<string, string>> = {
    "DM": {
      ...commonColumns,
      "sex": "Sex",
      "age": "Age",
      "race": "Race",
      "ethnicity": "Ethnicity"
    },
    "AE": {
      ...commonColumns,
      "aeterm": "Term",
      "aeseverity": "Severity",
      "aestart": "Start Date",
      "aeend": "End Date",
      "aerelated": "Related"
    },
    "SAE": {
      ...commonColumns,
      "aeterm": "Term",
      "aeseverity": "Severity",
      "aestart": "Start Date",
      "aeend": "End Date",
      "aerelated": "Related",
      "saeoutcome": "Outcome"
    },
    "DS": {
      ...commonColumns,
      "dsterm": "Term",
      "dsdecod": "Decoded Term",
      "dsstdtc": "Start Date",
      "dsendtc": "End Date"
    },
    "MH": {
      ...commonColumns,
      "mhterm": "Term",
      "mhstdtc": "Start Date",
      "mhendtc": "End Date",
      "mhongo": "Ongoing"
    },
    "CM": {
      ...commonColumns,
      "cmtrt": "Treatment",
      "cmstdtc": "Start Date",
      "cmendtc": "End Date",
      "cmdose": "Dose",
      "cmroute": "Route",
      "cmongo": "Ongoing"
    },
    "PD": {
      ...commonColumns,
      "visitName": "Visit",
      "pdtest": "Test",
      "pdorres": "Result",
      "pdorresu": "Units",
      "pddtc": "Date"
    },
    "VS": {
      ...commonColumns,
      "visitName": "Visit",
      "vstest": "Test",
      "vsorres": "Result",
      "vsorresu": "Units",
      "vsdtc": "Date"
    },
    "LB": {
      ...commonColumns,
      "visitName": "Visit",
      "lbtest": "Test",
      "lborres": "Result",
      "lborresu": "Units",
      "lbdtc": "Date"
    },
    "EX": {
      ...commonColumns,
      "visitName": "Visit",
      "extrt": "Treatment",
      "exdose": "Dose",
      "exdosu": "Units",
      "exstdtc": "Start Date",
      "exendtc": "End Date"
    }
  };
  
  // Get the columns for the current domain
  const columns = domainColumns[domain] || domainColumns["DM"];
  
  // Filter data based on search query and status filter
  const filteredData = domainData.filter((item) => {
    // Check if any field contains the search query
    const matchesSearch = Object.values(item).some(
      (value) => 
        value && 
        value.toString().toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Check if status matches the filter
    const matchesStatus = 
      statusFilter === "all" || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Function to render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "complete":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            <span>Complete</span>
          </Badge>
        );
      case "incomplete":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Incomplete</span>
          </Badge>
        );
      case "query":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-200 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            <span>Query</span>
          </Badge>
        );
      case "missing":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-200 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            <span>Missing</span>
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Get domain-specific statistics
  const stats = {
    total: domainData.length,
    complete: domainData.filter(item => item.status === "complete").length,
    incomplete: domainData.filter(item => item.status === "incomplete").length,
    query: domainData.filter(item => item.status === "query").length,
    missing: domainData.filter(item => item.status === "missing").length
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <Card className="p-3 flex flex-col items-center justify-center">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-2xl font-semibold">{stats.total}</span>
          </Card>
          <Card className="p-3 flex flex-col items-center justify-center bg-green-50">
            <span className="text-sm text-green-700">Complete</span>
            <span className="text-2xl font-semibold text-green-700">{stats.complete}</span>
          </Card>
          <Card className="p-3 flex flex-col items-center justify-center bg-amber-50">
            <span className="text-sm text-amber-700">Incomplete</span>
            <span className="text-2xl font-semibold text-amber-700">{stats.incomplete}</span>
          </Card>
          <Card className="p-3 flex flex-col items-center justify-center bg-blue-50">
            <span className="text-sm text-blue-700">Query</span>
            <span className="text-2xl font-semibold text-blue-700">{stats.query}</span>
          </Card>
          <Card className="p-3 flex flex-col items-center justify-center bg-red-50">
            <span className="text-sm text-red-700">Missing</span>
            <span className="text-2xl font-semibold text-red-700">{stats.missing}</span>
          </Card>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative w-full sm:w-52">
            <Input
              placeholder="Search records..."
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
          
          <Select 
            value={statusFilter} 
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
              <SelectItem value="incomplete">Incomplete</SelectItem>
              <SelectItem value="query">Queries</SelectItem>
              <SelectItem value="missing">Missing</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableCaption>
            {domain} domain data for Study {studyId > 0 ? studyId : "All"} {vendor ? `- ${vendor}` : ""}
          </TableCaption>
          <TableHeader>
            <TableRow>
              {Object.entries(columns).map(([key, label]) => (
                <TableHead key={key}>{label}</TableHead>
              ))}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <TableRow key={item.id}>
                  {Object.keys(columns).map((key) => (
                    <TableCell key={`${item.id}-${key}`}>
                      {key === "status" ? (
                        renderStatusBadge(item[key])
                      ) : (
                        item[key]
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={Object.keys(columns).length + 1} className="text-center h-24">
                  No records found matching your criteria
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}