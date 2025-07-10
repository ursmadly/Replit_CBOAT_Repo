import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FileJson, GitCompare, ArrowRight, Database, Map, PlayCircle, Save, Code, CheckCircle, XCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface DataMappingEditorProps {
  integrationSource: {
    id: number;
    name: string;
    type: string;
    vendor: string;
  };
  onClose: () => void;
}

export default function DataMappingEditor({ integrationSource, onClose }: DataMappingEditorProps) {
  const [activeTab, setActiveTab] = useState("field-mapping");
  const [testResults, setTestResults] = useState<null | { success: boolean; message: string }>(null);
  
  // Sample mapping configuration
  const [mappings, setMappings] = useState([
    { sourceField: "patno", targetField: "USUBJID", description: "Patient Number", enabled: true, transform: "" },
    { sourceField: "siteid", targetField: "SITEID", description: "Site ID", enabled: true, transform: "" },
    { sourceField: "visit_dt", targetField: "VISITDT", description: "Visit Date", enabled: true, transform: "YYYY-MM-DD" },
    { sourceField: "gender", targetField: "SEX", description: "Patient Gender", enabled: true, transform: "UPPERCASE" },
    { sourceField: "dob", targetField: "BRTHDTC", description: "Date of Birth", enabled: true, transform: "YYYY-MM-DD" },
    { sourceField: "race", targetField: "RACE", description: "Patient Race", enabled: true, transform: "" },
    { sourceField: "wt", targetField: "WEIGHT", description: "Weight", enabled: true, transform: "# UNIT:kg" },
    { sourceField: "ht", targetField: "HEIGHT", description: "Height", enabled: true, transform: "# UNIT:cm" },
  ]);

  // Sample source data for preview
  const sampleSourceData = [
    { patno: "001-001", siteid: "001", visit_dt: "2023-01-15", gender: "m", dob: "1980-05-22", race: "white", wt: 75.5, ht: 182 },
    { patno: "001-002", siteid: "001", visit_dt: "2023-01-16", gender: "f", dob: "1975-03-11", race: "black", wt: 65.2, ht: 165 },
    { patno: "001-003", siteid: "001", visit_dt: "2023-01-18", gender: "f", dob: "1990-11-30", race: "asian", wt: 58.7, ht: 158 },
  ];

  // Handle field mapping change
  const handleMappingChange = (index: number, field: string, value: any) => {
    const updatedMappings = [...mappings];
    updatedMappings[index] = { ...updatedMappings[index], [field]: value };
    setMappings(updatedMappings);
  };

  // Add new mapping
  const handleAddMapping = () => {
    setMappings([...mappings, { sourceField: "", targetField: "", description: "", enabled: true, transform: "" }]);
  };

  // Remove mapping
  const handleRemoveMapping = (index: number) => {
    const updatedMappings = [...mappings];
    updatedMappings.splice(index, 1);
    setMappings(updatedMappings);
  };

  // Test mapping function
  const handleTestMapping = () => {
    // Simulate a test process
    setTimeout(() => {
      setTestResults({ 
        success: true, 
        message: "Mapping test successful. 3 records processed with no errors." 
      });
    }, 1500);
  };

  // Render a preview of the transformed data
  const renderTransformedPreview = () => {
    return sampleSourceData.map((row, rowIndex) => (
      <TableRow key={rowIndex}>
        {mappings
          .filter(mapping => mapping.enabled)
          .map((mapping, colIndex) => (
            <TableCell key={colIndex} className="px-3 py-2 text-xs">
              {transformValue(row[mapping.sourceField as keyof typeof row], mapping.transform)}
            </TableCell>
          ))}
      </TableRow>
    ));
  };

  // Apply transform to a value
  const transformValue = (value: any, transform: string): string => {
    if (!value) return "";
    
    if (transform === "UPPERCASE") {
      return typeof value === "string" ? value.toUpperCase() : String(value);
    }
    
    if (transform === "YYYY-MM-DD") {
      // Simple date formatting (would be more complex in real app)
      return typeof value === "string" ? value : String(value);
    }
    
    if (transform.startsWith("# UNIT:")) {
      const unit = transform.split(":")[1];
      return `${value} ${unit}`;
    }
    
    return String(value);
  };

  return (
    <Card className="w-full max-w-6xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Data Mapping Configuration</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span>{integrationSource.name}</span>
              <Badge>{integrationSource.type}</Badge>
              <span className="text-muted-foreground">Vendor: {integrationSource.vendor}</span>
            </CardDescription>
          </div>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="field-mapping" className="flex items-center gap-1">
              <Map className="h-4 w-4" />
              <span>Field Mapping</span>
            </TabsTrigger>
            <TabsTrigger value="transform-rules" className="flex items-center gap-1">
              <Code className="h-4 w-4" />
              <span>Transform Rules</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-1">
              <GitCompare className="h-4 w-4" />
              <span>Preview</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="field-mapping">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Field Mappings</h3>
                <Button size="sm" onClick={handleAddMapping}>
                  Add Mapping
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Enabled</TableHead>
                      <TableHead>Source Field</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead>Target Field</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Transform</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mappings.map((mapping, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Checkbox 
                            checked={mapping.enabled} 
                            onCheckedChange={(checked) => 
                              handleMappingChange(index, "enabled", !!checked)
                            } 
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            value={mapping.sourceField} 
                            onChange={(e) => handleMappingChange(index, "sourceField", e.target.value)} 
                            className="h-8 w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell>
                          <Input 
                            value={mapping.targetField} 
                            onChange={(e) => handleMappingChange(index, "targetField", e.target.value)} 
                            className="h-8 w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            value={mapping.description} 
                            onChange={(e) => handleMappingChange(index, "description", e.target.value)} 
                            className="h-8 w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={mapping.transform} 
                            onValueChange={(value) => handleMappingChange(index, "transform", value)}
                          >
                            <SelectTrigger className="h-8 w-full">
                              <SelectValue placeholder="Select transform" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              <SelectItem value="UPPERCASE">UPPERCASE</SelectItem>
                              <SelectItem value="YYYY-MM-DD">Date (YYYY-MM-DD)</SelectItem>
                              <SelectItem value="# UNIT:kg">Number with kg</SelectItem>
                              <SelectItem value="# UNIT:cm">Number with cm</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMapping(index)}
                            className="h-8 px-2 text-muted-foreground hover:text-destructive"
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Test Mapping Button */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleTestMapping}>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Test Mapping
                </Button>
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Mapping
                </Button>
              </div>

              {/* Test Results */}
              {testResults && (
                <Alert variant={testResults.success ? "default" : "destructive"} className="mt-4">
                  <div className="flex items-center gap-2">
                    {testResults.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertTitle>
                      {testResults.success ? "Success" : "Error"}
                    </AlertTitle>
                  </div>
                  <AlertDescription>
                    {testResults.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          <TabsContent value="transform-rules">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Custom Transform Rules</h3>
                <div className="flex gap-2">
                  <Select defaultValue="javascript">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="sql">SQL</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm">Add Rule</Button>
                </div>
              </div>

              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-sm">Demographic Standardization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-mono bg-muted p-4 rounded-md text-sm overflow-auto">
                    <pre>{`// Standardize gender values
function standardizeGender(value) {
  if (!value) return "";
  value = value.toLowerCase().trim();
  
  if (value === "m" || value === "male") return "M";
  if (value === "f" || value === "female") return "F";
  return "U"; // Unknown
}

// Standardize race values
function standardizeRace(value) {
  if (!value) return "";
  value = value.toLowerCase().trim();
  
  const mapping = {
    "white": "WHITE",
    "caucasian": "WHITE", 
    "black": "BLACK",
    "african american": "BLACK",
    "asian": "ASIAN",
    "hispanic": "HISPANIC",
    "latino": "HISPANIC"
  };
  
  return mapping[value] || "OTHER";
}`}</pre>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button variant="outline" size="sm">Edit Rule</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-sm">Date Format Standardization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="font-mono bg-muted p-4 rounded-md text-sm overflow-auto">
                    <pre>{`// Convert various date formats to ISO
function standardizeDate(value) {
  if (!value) return "";
  
  // Handle MM/DD/YYYY
  if (value.includes('/')) {
    const parts = value.split('/');
    if (parts.length === 3) {
      return \`\${parts[2]}-\${parts[0].padStart(2, '0')}-\${parts[1].padStart(2, '0')}\`;
    }
  }
  
  // Handle DD-MMM-YYYY
  const monthMap = {
    'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
    'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
    'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
  };
  
  if (value.includes('-')) {
    const parts = value.split('-');
    if (parts.length === 3 && isNaN(parseInt(parts[1]))) {
      const month = monthMap[parts[1].toUpperCase()];
      if (month) {
        return \`\${parts[2]}-\${month}-\${parts[0].padStart(2, '0')}\`;
      }
    }
  }
  
  return value;
}`}</pre>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button variant="outline" size="sm">Edit Rule</Button>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button>Save All Rules</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Transformation Preview</h3>
                <Select defaultValue="sample">
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select data source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sample">Sample Data (3 records)</SelectItem>
                    <SelectItem value="live">Live Data (10 records)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-8">
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Source Data
                  </h4>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(sampleSourceData[0]).map((key) => (
                            <TableHead key={key} className="px-3 py-2 text-xs">{key}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sampleSourceData.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {Object.values(row).map((value, colIndex) => (
                              <TableCell key={colIndex} className="px-3 py-2 text-xs">{String(value)}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <GitCompare className="h-4 w-4" />
                    Transformed Data
                  </h4>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {mappings
                            .filter(mapping => mapping.enabled)
                            .map((mapping, index) => (
                              <TableHead key={index} className="px-3 py-2 text-xs">{mapping.targetField}</TableHead>
                            ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {renderTransformedPreview()}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">
                  Export Transformed Data
                </Button>
                <Button>
                  Apply Configuration
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}