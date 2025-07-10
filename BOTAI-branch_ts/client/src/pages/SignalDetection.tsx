import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, Clock, Edit, ExternalLink, Filter, MessageSquare, Search, Stethoscope, UserRound, Zap, FileBarChart, Brain, Calendar, ArrowUpDown, ClipboardCheck, AlertTriangle } from "lucide-react";

// Generate random date in the past (between 1-30 days ago)
const getRandomPastDate = (minDays = 1, maxDays = 45) => {
  const today = new Date();
  const randomDays = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
  const pastDate = new Date(today);
  pastDate.setDate(today.getDate() - randomDays);
  return pastDate;
};

// Calculate due date (7 days for Critical, 14 for High, 21 for Medium, 30 for Low)
const calculateDueDate = (detectionDate, priority) => {
  const dueDate = new Date(detectionDate);
  const dueDays = 
    priority === "Critical" ? 7 : 
    priority === "High" ? 14 : 
    priority === "Medium" ? 21 : 30;
  dueDate.setDate(dueDate.getDate() + dueDays);
  return dueDate;
};

// Calculate overdue status based on due date
const isOverdue = (dueDate) => {
  return new Date() > new Date(dueDate);
};

// Format date to display in the table
const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// AI-detected signals data
const aiSignals = [
  { id: "SF_Risk_001", signalType: "Safety Risk", observation: "Elevated liver enzymes (ALT/AST) in 5 patients, 3x ULN", priority: "Critical", trialId: 1, studyName: "PRO001", detectionDate: getRandomPastDate(1, 10), recommendation: "Review patient data immediately, consider dosing adjustment", assignedTo: "Medical Monitor", status: "Open" },
  { id: "LAB_Risk_002", signalType: "LAB Testing Risk", observation: "Creatinine elevation pattern in elderly subjects", priority: "High", trialId: 2, studyName: "PRO002", detectionDate: getRandomPastDate(5, 20), recommendation: "Check renal function across cohort, review concomitant medications", assignedTo: "Medical Monitor", status: "In Progress" },
  { id: "AE_Risk_003", signalType: "AE Risk", observation: "Increased incidence of headache (32% vs 18% in control)", priority: "Medium", trialId: 3, studyName: "PRO003", detectionDate: getRandomPastDate(10, 25), recommendation: "Monitor neurological symptoms, correlate with drug exposure", assignedTo: "Medical Monitor", status: "Closed" },
  { id: "SF_Risk_004", signalType: "Safety Risk", observation: "QTc prolongation >15ms from baseline in drug arm", priority: "Critical", trialId: 1, studyName: "PRO001", detectionDate: getRandomPastDate(1, 5), recommendation: "Immediate cardiac assessment, consider protocol amendment for ECG monitoring", assignedTo: "Medical Monitor", status: "Open" },
  { id: "ST_Risk_005", signalType: "Site Risk", observation: "Site 103 showing reporting delays of SAEs (avg 8 days)", priority: "High", trialId: 4, studyName: "PRO004", detectionDate: getRandomPastDate(7, 14), recommendation: "Site retraining on SAE reporting timeframes, consider targeted monitoring", assignedTo: "Medical Monitor", status: "In Progress" },
  { id: "LAB_Risk_006", signalType: "LAB Testing Risk", observation: "Hemoglobin decrease >2g/dL in 10% of subjects", priority: "Medium", trialId: 2, studyName: "PRO002", detectionDate: getRandomPastDate(15, 25), recommendation: "Monitor for clinical signs of anemia, consider iron panel testing", assignedTo: "Medical Monitor", status: "In Progress" },
  { id: "PD_Risk_007", signalType: "PD Risk", observation: "Drug concentration 40% lower than predicted at steady state", priority: "High", trialId: 3, studyName: "PRO003", detectionDate: getRandomPastDate(7, 12), recommendation: "Review PK/PD model, check drug administration compliance", assignedTo: "Medical Monitor", status: "In Progress" },
  { id: "AE_Risk_008", signalType: "AE Risk", observation: "Rash reported in 15% of subjects on active treatment", priority: "Medium", trialId: 1, studyName: "PRO001", detectionDate: getRandomPastDate(20, 30), recommendation: "Dermatologist consultation, photo documentation protocol implementation", assignedTo: "Medical Monitor", status: "Closed" },
  { id: "SF_Risk_009", signalType: "Safety Risk", observation: "Transient neutropenia (<1000/μL) in 3 subjects", priority: "High", trialId: 4, studyName: "PRO004", detectionDate: getRandomPastDate(5, 15), recommendation: "Increase monitoring frequency, review infection risk", assignedTo: "Medical Monitor", status: "Open" },
  { id: "ENR_Risk_010", signalType: "Enrollment Risk", observation: "Site 105 enrollment 45% below target", priority: "Low", trialId: 2, studyName: "PRO002", detectionDate: getRandomPastDate(25, 40), recommendation: "Site support intervention, recruitment strategy review", assignedTo: "Medical Monitor", status: "Closed" },
  { id: "SF_Risk_011", signalType: "Safety Risk", observation: "Frequent hypoglycemia events in diabetic subjects", priority: "Critical", trialId: 1, studyName: "PRO001", detectionDate: getRandomPastDate(1, 10), recommendation: "Protocol amendment for glucose monitoring, dietary guidance implementation", assignedTo: "Medical Monitor", status: "Open" },
  { id: "LAB_Risk_012", signalType: "LAB Testing Risk", observation: "Elevated CRP levels correlating with joint pain reports", priority: "Medium", trialId: 2, studyName: "PRO002", detectionDate: getRandomPastDate(15, 30), recommendation: "Additional inflammatory markers assessment, rheumatology consult", assignedTo: "Medical Monitor", status: "In Progress" },
  { id: "AE_Risk_013", signalType: "AE Risk", observation: "Increased dizziness reports in elderly population (>70 years)", priority: "High", trialId: 4, studyName: "PRO004", detectionDate: getRandomPastDate(5, 20), recommendation: "Neurological assessment, fall risk mitigation strategies", assignedTo: "Medical Monitor", status: "Open" },
  { id: "PD_Risk_014", signalType: "PD Risk", observation: "Biomarker response shows plateau effect at highest dose", priority: "Low", trialId: 3, studyName: "PRO003", detectionDate: getRandomPastDate(25, 35), recommendation: "Assess dose-response curve, consider intermediate dose cohort", assignedTo: "Medical Monitor", status: "Closed" },
  { id: "SF_Risk_015", signalType: "Safety Risk", observation: "Mild hepatic steatosis on imaging in 4 subjects", priority: "Medium", trialId: 1, studyName: "PRO001", detectionDate: getRandomPastDate(10, 20), recommendation: "Hepatology consultation, follow-up imaging schedule", assignedTo: "Medical Monitor", status: "In Progress" },
  { id: "ST_Risk_016", signalType: "Site Risk", observation: "Data entry errors at Site 107 (22% above threshold)", priority: "High", trialId: 2, studyName: "PRO002", detectionDate: getRandomPastDate(7, 15), recommendation: "Site audit, retraining on data entry procedures", assignedTo: "Medical Monitor", status: "In Progress" },
  { id: "AE_Risk_017", signalType: "AE Risk", observation: "Sleep disturbance reports increasing week 4-8", priority: "Medium", trialId: 3, studyName: "PRO003", detectionDate: getRandomPastDate(15, 25), recommendation: "Sleep quality assessment implementation, evening dosing consideration", assignedTo: "Medical Monitor", status: "Open" },
  { id: "LAB_Risk_018", signalType: "LAB Testing Risk", observation: "Lipid profile worsening trend in treatment arm", priority: "Medium", trialId: 4, studyName: "PRO004", detectionDate: getRandomPastDate(15, 25), recommendation: "Cardiovascular risk assessment, statin use evaluation", assignedTo: "Medical Monitor", status: "In Progress" },
  { id: "SF_Risk_019", signalType: "Safety Risk", observation: "Blood pressure elevation >15 mmHg systolic in 20% subjects", priority: "High", trialId: 1, studyName: "PRO001", detectionDate: getRandomPastDate(5, 15), recommendation: "Implement home BP monitoring, review antihypertensive medications", assignedTo: "Medical Monitor", status: "Open" },
  { id: "PD_Risk_020", signalType: "PD Risk", observation: "Target engagement 25% below predicted level", priority: "High", trialId: 2, studyName: "PRO002", detectionDate: getRandomPastDate(7, 15), recommendation: "Review dosing strategy, assess drug-drug interactions", assignedTo: "Medical Monitor", status: "In Progress" },
  { id: "AE_Risk_021", signalType: "AE Risk", observation: "GI tolerance issues in 30% of subjects", priority: "Medium", trialId: 3, studyName: "PRO003", detectionDate: getRandomPastDate(15, 25), recommendation: "Modified dosing schedule with food, anti-emetic protocol", assignedTo: "Medical Monitor", status: "Closed" },
  { id: "SF_Risk_022", signalType: "Safety Risk", observation: "Increased ALT without AST elevation in 5 subjects", priority: "Medium", trialId: 4, studyName: "PRO004", detectionDate: getRandomPastDate(15, 25), recommendation: "Hepatic safety monitoring, rule out muscle origin", assignedTo: "Medical Monitor", status: "In Progress" },
  { id: "ENR_Risk_023", signalType: "Enrollment Risk", observation: "Screen failure rate 35% above predicted", priority: "Low", trialId: 1, studyName: "PRO001", detectionDate: getRandomPastDate(25, 40), recommendation: "Inclusion/exclusion criteria review, pre-screening implementation", assignedTo: "Medical Monitor", status: "Closed" },
  { id: "LAB_Risk_024", signalType: "LAB Testing Risk", observation: "Urinalysis showing protein pattern in 12% subjects", priority: "Medium", trialId: 2, studyName: "PRO002", detectionDate: getRandomPastDate(15, 25), recommendation: "Renal function monitoring, protein/creatinine ratio assessment", assignedTo: "Medical Monitor", status: "Open" },
  { id: "SF_Risk_025", signalType: "Safety Risk", observation: "ECG T-wave abnormalities in 3 subjects on high dose", priority: "Critical", trialId: 3, studyName: "PRO003", detectionDate: getRandomPastDate(1, 10), recommendation: "Cardiology consultation, continuous ECG monitoring consideration", assignedTo: "Medical Monitor", status: "Open" },
  { id: "ST_Risk_026", signalType: "Site Risk", observation: "Protocol deviations at Site 102 exceeded threshold", priority: "High", trialId: 4, studyName: "PRO004", detectionDate: getRandomPastDate(7, 15), recommendation: "For-cause audit, investigator meeting", assignedTo: "Medical Monitor", status: "In Progress" },
  { id: "AE_Risk_027", signalType: "AE Risk", observation: "Anxiety symptoms reported at 2x the expected rate", priority: "Medium", trialId: 1, studyName: "PRO001", detectionDate: getRandomPastDate(15, 25), recommendation: "Psychiatric assessment tool implementation, anxiolytic use tracking", assignedTo: "Medical Monitor", status: "Open" },
  { id: "PD_Risk_028", signalType: "PD Risk", observation: "Efficacy marker shows minimal change at week 8", priority: "High", trialId: 2, studyName: "PRO002", detectionDate: getRandomPastDate(7, 15), recommendation: "Interim efficacy analysis, dose adjustment consideration", assignedTo: "Medical Monitor", status: "In Progress" },
  { id: "SF_Risk_029", signalType: "Safety Risk", observation: "Cardiac troponin elevation in 2 elderly subjects", priority: "Critical", trialId: 3, studyName: "PRO003", detectionDate: getRandomPastDate(1, 10), recommendation: "Immediate cardiac evaluation, trial suspension for safety review", assignedTo: "Medical Monitor", status: "Open" },
  { id: "LAB_Risk_030", signalType: "LAB Testing Risk", observation: "Hyperkalemia trend in renal impaired subjects", priority: "High", trialId: 4, studyName: "PRO004", detectionDate: getRandomPastDate(7, 15), recommendation: "Electrolyte monitoring increase, medication review", assignedTo: "Medical Monitor", status: "Open" },
  { id: "AE_Risk_031", signalType: "AE Risk", observation: "Injection site reactions in 40% of subjects", priority: "Low", trialId: 1, studyName: "PRO001", detectionDate: getRandomPastDate(25, 40), recommendation: "Injection technique review, topical management protocol", assignedTo: "Medical Monitor", status: "Closed" },
  { id: "SF_Risk_032", signalType: "Safety Risk", observation: "Weight loss >7% in 15% of treatment subjects", priority: "Medium", trialId: 2, studyName: "PRO002", detectionDate: getRandomPastDate(15, 25), recommendation: "Nutritional assessment, caloric intake monitoring", assignedTo: "Medical Monitor", status: "In Progress" },
  { id: "PD_Risk_033", signalType: "PD Risk", observation: "Drug-drug interaction with statins suspected", priority: "High", trialId: 3, studyName: "PRO003", detectionDate: getRandomPastDate(7, 15), recommendation: "PK analysis in statin users, protocol amendment consideration", assignedTo: "Medical Monitor", status: "Open" },
  { id: "ENR_Risk_034", signalType: "Enrollment Risk", observation: "Female participants underrepresented (28% vs 50% target)", priority: "Low", trialId: 4, studyName: "PRO004", detectionDate: getRandomPastDate(25, 40), recommendation: "Gender-specific recruitment strategies, site support", assignedTo: "Medical Monitor", status: "Closed" },
  { id: "SF_Risk_035", signalType: "Safety Risk", observation: "Hypersensitivity reactions in 3 subjects after 3rd dose", priority: "Critical", trialId: 1, studyName: "PRO001", detectionDate: getRandomPastDate(1, 10), recommendation: "Allergy/immunology consultation, premedication protocol development", assignedTo: "Medical Monitor", status: "Open" },
  { id: "LAB_Risk_036", signalType: "LAB Testing Risk", observation: "Thrombocytopenia in 8% of treatment group", priority: "High", trialId: 2, studyName: "PRO002", detectionDate: getRandomPastDate(7, 15), recommendation: "Hematology consultation, bleeding risk assessment", assignedTo: "Medical Monitor", status: "In Progress" },
  { id: "AE_Risk_037", signalType: "AE Risk", observation: "Visual disturbances reported at higher than expected rate", priority: "Medium", trialId: 3, studyName: "PRO003", detectionDate: getRandomPastDate(15, 25), recommendation: "Ophthalmology assessment addition, visual acuity testing", assignedTo: "Medical Monitor", status: "Open" },
  { id: "ST_Risk_038", signalType: "Site Risk", observation: "Site 104 showing inconsistent vital signs measurement", priority: "Medium", trialId: 4, studyName: "PRO004", detectionDate: getRandomPastDate(15, 25), recommendation: "Site retraining, equipment calibration verification", assignedTo: "Medical Monitor", status: "In Progress" },
  { id: "SF_Risk_039", signalType: "Safety Risk", observation: "Prolonged cough in 25% of subjects vs 5% in placebo", priority: "Medium", trialId: 1, studyName: "PRO001", detectionDate: getRandomPastDate(15, 25), recommendation: "Pulmonary function testing, respiratory assessment", assignedTo: "Medical Monitor", status: "Open" },
  { id: "PD_Risk_040", signalType: "PD Risk", observation: "Antibody development in 10% of subjects by week 12", priority: "High", trialId: 2, studyName: "PRO002", detectionDate: getRandomPastDate(7, 15), recommendation: "Immunogenicity assessment, efficacy correlation analysis", assignedTo: "Medical Monitor", status: "In Progress" },
  { id: "SF_Risk_041", signalType: "Safety Risk", observation: "Increased fracture incidence in treatment arm (3 vs 0)", priority: "High", trialId: 3, studyName: "PRO003", detectionDate: getRandomPastDate(7, 15), recommendation: "Bone density assessment, calcium/vitamin D supplementation", assignedTo: "Medical Monitor", status: "Open" },
  { id: "LAB_Risk_042", signalType: "LAB Testing Risk", observation: "Uric acid elevation in 30% of treatment group", priority: "Low", trialId: 4, studyName: "PRO004", detectionDate: getRandomPastDate(25, 40), recommendation: "Gout risk assessment, hydration guidance", assignedTo: "Medical Monitor", status: "Closed" },
  { id: "AE_Risk_043", signalType: "AE Risk", observation: "Fatigue reported by 45% vs 22% in control group", priority: "Medium", trialId: 1, studyName: "PRO001", detectionDate: getRandomPastDate(15, 25), recommendation: "Quality of life assessment, thyroid function testing", assignedTo: "Medical Monitor", status: "In Progress" },
  { id: "SF_Risk_044", signalType: "Safety Risk", observation: "Tinnitus reported by 5 subjects on high dose", priority: "Medium", trialId: 2, studyName: "PRO002", detectionDate: getRandomPastDate(15, 25), recommendation: "Audiology assessment, dose reduction consideration", assignedTo: "Medical Monitor", status: "Open" },
  { id: "PD_Risk_045", signalType: "PD Risk", observation: "Response rate lower in Asian subpopulation (15% vs 40%)", priority: "High", trialId: 3, studyName: "PRO003", detectionDate: getRandomPastDate(7, 15), recommendation: "Pharmacogenomic analysis, dose adjustment for subpopulation", assignedTo: "Medical Monitor", status: "In Progress" },
  { id: "ENR_Risk_046", signalType: "Enrollment Risk", observation: "Elderly subject recruitment at 30% of target", priority: "Low", trialId: 4, studyName: "PRO004", detectionDate: getRandomPastDate(25, 40), recommendation: "Geriatric site outreach, inclusion criteria review", assignedTo: "Medical Monitor", status: "Closed" },
  { id: "SF_Risk_047", signalType: "Safety Risk", observation: "Syncope in 3 subjects with orthostatic hypotension", priority: "Critical", trialId: 1, studyName: "PRO001", detectionDate: getRandomPastDate(1, 10), recommendation: "Orthostatic vital sign protocol, fall prevention guidance", assignedTo: "Medical Monitor", status: "Open" },
  { id: "LAB_Risk_048", signalType: "LAB Testing Risk", observation: "Hypophosphatemia in 12% of subjects on treatment", priority: "Medium", trialId: 2, studyName: "PRO002", detectionDate: getRandomPastDate(15, 25), recommendation: "Mineral supplement consideration, bone metabolism assessment", assignedTo: "Medical Monitor", status: "In Progress" },
  { id: "AE_Risk_049", signalType: "AE Risk", observation: "Peripheral edema in 18% of treatment group", priority: "Medium", trialId: 3, studyName: "PRO003", detectionDate: getRandomPastDate(15, 25), recommendation: "Cardiac evaluation, sodium restriction guidance", assignedTo: "Medical Monitor", status: "Open" },
  { id: "SF_Risk_050", signalType: "Safety Risk", observation: "Hyponatremia in 7% of elderly subjects", priority: "High", trialId: 4, studyName: "PRO004", detectionDate: getRandomPastDate(7, 15), recommendation: "Electrolyte monitoring protocol, fluid intake guidance", assignedTo: "Medical Monitor", status: "In Progress" }
];

// Add due dates and calculate overdue status
const aiSignalsWithDueDates = aiSignals.map(signal => {
  const dueDate = calculateDueDate(signal.detectionDate, signal.priority);
  return {
    ...signal,
    dueDate,
    overdue: isOverdue(dueDate)
  };
});

export default function SignalDetection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortField, setSortField] = useState("detectionDate");
  const [sortDirection, setSortDirection] = useState("desc");
  const [selectedSignal, setSelectedSignal] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  
  // Detailed recommendations data for each signal type
  const detailedRecommendations = {
    "Safety Risk": {
      recommendations: [
        "Immediately review all related safety data for potential patterns",
        "Assess potential impact on benefit-risk profile",
        "Consider protocol amendments if safety concerns persist",
        "Evaluate need for additional monitoring procedures",
        "Determine if regulatory reporting is required (e.g., expedited SAE reporting)"
      ],
      investigationSteps: [
        "Pull all subject-level data related to the safety signal",
        "Perform statistical analysis to confirm signal validity",
        "Review medical literature for similar reported events",
        "Consult with relevant medical specialists for risk assessment",
        "Evaluate correlation with drug exposure/pharmacokinetics"
      ],
      potentialActions: [
        "Implement additional safety monitoring",
        "Modify exclusion criteria to prevent high-risk subjects from enrollment",
        "Consider dosage adjustments if dose-related",
        "Prepare communications to sites, investigators, and regulatory authorities",
        "Update Investigator Brochure with new safety findings"
      ]
    },
    "LAB Testing Risk": {
      recommendations: [
        "Review laboratory parameter trends across all subjects",
        "Identify any demographic patterns in affected subjects",
        "Assess temporal relationship with study drug administration",
        "Evaluate clinical significance with medical team",
        "Consider additional laboratory tests to further characterize the finding"
      ],
      investigationSteps: [
        "Analyze laboratory values by study visit to identify patterns",
        "Check for correlations with concomitant medications",
        "Review sample handling procedures for possible pre-analytical errors",
        "Compare findings between sites to identify site-specific issues",
        "Verify reference ranges used for analysis"
      ],
      potentialActions: [
        "Increase frequency of laboratory monitoring",
        "Implement alert thresholds for real-time notification",
        "Add specialized tests related to the affected parameters",
        "Review and potentially update laboratory manuals",
        "Conduct site-specific training if quality issues identified"
      ]
    },
    "AE Risk": {
      recommendations: [
        "Review all related adverse events for severity patterns",
        "Assess event frequency compared to expected rates",
        "Examine time-to-onset patterns and duration",
        "Evaluate relationship to study drug exposure",
        "Consider impact on patient quality of life and trial continuation"
      ],
      investigationSteps: [
        "Conduct MedDRA-based analysis to group similar events",
        "Perform disproportionality analysis against historical data",
        "Review medical histories for predisposing factors",
        "Analyze events by site to identify reporting patterns",
        "Check for drug-drug interactions that might contribute"
      ],
      potentialActions: [
        "Develop specific monitoring plan for the adverse event",
        "Create supplemental data collection tools if needed",
        "Consider prophylactic measures or concomitant treatments",
        "Update informed consent with new risk information",
        "Modify visit schedule to better capture event evolution"
      ]
    },
    "Site Risk": {
      recommendations: [
        "Evaluate impact on data integrity and subject safety",
        "Assess if findings are isolated or indicate systematic issues",
        "Determine root cause of site performance issues",
        "Review recent monitoring reports for early warning signs",
        "Consider impact on overall study timeline and data quality"
      ],
      investigationSteps: [
        "Analyze key performance indicators across all sites",
        "Review staff qualifications and workload at affected sites",
        "Evaluate adequacy of site training and resources",
        "Examine communication history with site staff",
        "Review protocol deviation patterns and query resolution times"
      ],
      potentialActions: [
        "Schedule targeted monitoring visit or remote audit",
        "Develop site-specific corrective action plan",
        "Provide additional training for site staff",
        "Consider temporary enrollment hold if issues are severe",
        "Implement more frequent site check-ins and reviews"
      ]
    },
    "PD Risk": {
      recommendations: [
        "Evaluate impact on proof of concept and efficacy endpoints",
        "Assess if findings may affect overall trial conclusions",
        "Review dose-response relationships and PK/PD modeling",
        "Consider implications for future dose selection",
        "Determine if efficacy expectations require adjustment"
      ],
      investigationSteps: [
        "Analyze pharmacodynamic data across all dose cohorts",
        "Review pharmacokinetic data for exposure-response relationships",
        "Check for demographic factors affecting drug response",
        "Examine compliance with dosing regimen",
        "Review assay performance and validation parameters"
      ],
      potentialActions: [
        "Adjust sampling schedule if needed for better characterization",
        "Consider additional biomarker assessments",
        "Evaluate need for dose adjustments in current or future cohorts",
        "Reassess statistical power based on observed variability",
        "Update analysis plans to account for new understanding"
      ]
    },
    "Enrollment Risk": {
      recommendations: [
        "Assess impact on study timeline and statistical power",
        "Review eligibility criteria for potential barriers",
        "Evaluate site selection and performance patterns",
        "Consider competitive landscape for similar trials",
        "Determine financial implications of enrollment delays"
      ],
      investigationSteps: [
        "Analyze screen failure reasons across sites",
        "Review recruitment strategies and their effectiveness",
        "Evaluate geographical and seasonal enrollment patterns",
        "Examine protocol complexity as potential barrier",
        "Assess patient population availability at active sites"
      ],
      potentialActions: [
        "Implement targeted recruitment strategies",
        "Consider protocol amendments to adjust eligibility criteria",
        "Evaluate adding new sites or closing underperforming sites",
        "Develop site-specific enrollment plans and targets",
        "Review and potentially enhance patient stipends or convenience measures"
      ]
    }
  };
  
  // Handle sort column click
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  // Filter signals based on search and filters
  const filteredSignals = aiSignalsWithDueDates.filter(signal => {
    // Search filter across multiple fields
    const searchMatch = searchTerm === "" || 
      signal.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      signal.signalType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      signal.observation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      signal.studyName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Priority filter
    const priorityMatch = priorityFilter === "All" || signal.priority === priorityFilter;
    
    // Status filter
    const statusMatch = statusFilter === "All" || signal.status === statusFilter;
    
    return searchMatch && priorityMatch && statusMatch;
  });
  
  // Sort filtered signals
  const sortedSignals = [...filteredSignals].sort((a, b) => {
    if (sortField === "priority") {
      const priorityOrder = { "Critical": 0, "High": 1, "Medium": 2, "Low": 3 };
      if (sortDirection === "asc") {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      } else {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
    }
    
    if (sortField === "detectionDate" || sortField === "dueDate") {
      const dateA = new Date(a[sortField]);
      const dateB = new Date(b[sortField]);
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    }
    
    // Default string comparison
    const valueA = a[sortField]?.toString().toLowerCase() || "";
    const valueB = b[sortField]?.toString().toLowerCase() || "";
    return sortDirection === "asc" 
      ? valueA.localeCompare(valueB) 
      : valueB.localeCompare(valueA);
  });
  
  // Calculate summary statistics
  const totalSignals = filteredSignals.length;
  const criticalSignals = filteredSignals.filter(s => s.priority === "Critical").length;
  const overdueSignals = filteredSignals.filter(s => s.overdue).length;
  const openSignals = filteredSignals.filter(s => s.status === "Open").length;
  
  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Critical": return "bg-red-100 text-red-800";
      case "High": return "bg-orange-100 text-orange-800";
      case "Medium": return "bg-amber-100 text-amber-800";
      case "Low": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Open": return "bg-blue-100 text-blue-800";
      case "In Progress": return "bg-purple-100 text-purple-800";
      case "Closed": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800">Signal Detection</h1>
            <p className="text-neutral-500 mt-1">Monitor and manage risk signals across clinical trials</p>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              size="sm"
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Manual Detection
            </Button>
            <Button 
              size="sm"
            >
              <Zap className="mr-2 h-4 w-4" />
              Auto Detection
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Brain className="mr-2 h-5 w-5 text-blue-600" />
              AI-Detected Signals
            </CardTitle>
            <CardDescription>
              Signals automatically detected by AI analysis across clinical trial data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center">
                    <div className="text-3xl font-bold text-blue-700 mb-1">{totalSignals}</div>
                    <div className="text-sm text-gray-600">Total Signals</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-red-50 to-white border-red-100">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center">
                    <div className="text-3xl font-bold text-red-700 mb-1">{criticalSignals}</div>
                    <div className="text-sm text-gray-600">Critical Signals</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center">
                    <div className="text-3xl font-bold text-amber-700 mb-1">{overdueSignals}</div>
                    <div className="text-sm text-gray-600">Overdue Signals</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center">
                    <div className="text-3xl font-bold text-purple-700 mb-1">{openSignals}</div>
                    <div className="text-sm text-gray-600">Open Signals</div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Filter controls */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-[240px]">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Search signals..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="w-[160px]">
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <div className="flex items-center">
                      <Filter className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{priorityFilter} Priority</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Priorities</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-[160px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <div className="flex items-center">
                      <Filter className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{statusFilter} Status</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Statuses</SelectItem>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button variant="outline" onClick={() => {
                setSearchTerm("");
                setPriorityFilter("All");
                setStatusFilter("All");
              }}>
                Clear Filters
              </Button>
            </div>
            
            {/* Signals table */}
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px] cursor-pointer" onClick={() => handleSort("id")}>
                      <div className="flex items-center">
                        Signal ID
                        {sortField === "id" && (
                          sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("signalType")}>
                      <div className="flex items-center">
                        Type
                        {sortField === "signalType" && (
                          sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort("observation")}>
                      <div className="flex items-center">
                        Observation
                        {sortField === "observation" && (
                          sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="w-[110px] cursor-pointer" onClick={() => handleSort("priority")}>
                      <div className="flex items-center">
                        Priority
                        {sortField === "priority" && (
                          sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="w-[100px] cursor-pointer" onClick={() => handleSort("studyName")}>
                      <div className="flex items-center">
                        Study
                        {sortField === "studyName" && (
                          sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="w-[120px] cursor-pointer" onClick={() => handleSort("detectionDate")}>
                      <div className="flex items-center">
                        Detected
                        {sortField === "detectionDate" && (
                          sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="w-[120px] cursor-pointer" onClick={() => handleSort("dueDate")}>
                      <div className="flex items-center">
                        Due Date
                        {sortField === "dueDate" && (
                          sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="w-[300px]">Recommendation</TableHead>
                    <TableHead className="w-[120px]">Assigned To</TableHead>
                    <TableHead className="w-[120px] cursor-pointer" onClick={() => handleSort("status")}>
                      <div className="flex items-center">
                        Status
                        {sortField === "status" && (
                          sortDirection === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSignals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-6 text-gray-500">
                        No signals found matching your filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedSignals.map((signal) => (
                      <TableRow 
                        key={signal.id} 
                        className="group hover:bg-blue-50 cursor-pointer"
                        onClick={() => {
                          setSelectedSignal(signal);
                          setIsDetailsOpen(true);
                        }}
                      >
                        <TableCell className="font-medium">{signal.id}</TableCell>
                        <TableCell>{signal.signalType}</TableCell>
                        <TableCell className="max-w-[300px] truncate" title={signal.observation}>
                          {signal.observation}
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(signal.priority)}>{signal.priority}</Badge>
                        </TableCell>
                        <TableCell>{signal.studyName}</TableCell>
                        <TableCell>{formatDate(signal.detectionDate)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className={signal.overdue ? "text-red-600 font-medium" : ""}>
                              {formatDate(signal.dueDate)}
                            </span>
                            {signal.overdue && (
                              <Clock className="ml-1 h-4 w-4 text-red-600" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate relative" title={signal.recommendation}>
                          <div className="flex items-center justify-between">
                            <span>{signal.recommendation}</span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 absolute right-2 top-1/2 transform -translate-y-1/2 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSignal(signal);
                                setIsDetailsOpen(true);
                              }}
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-blue-600" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>{signal.assignedTo}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(signal.status)}>
                            {signal.status === "Closed" ? (
                              <div className="flex items-center">
                                <Check className="mr-1 h-3 w-3" />
                                {signal.status}
                              </div>
                            ) : signal.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination placeholder - could be implemented if needed */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {sortedSignals.length} of {totalSignals} signals
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Recommendation Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedSignal && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl font-semibold flex items-center">
                    <span className="mr-3">{selectedSignal.id}</span>
                    <Badge className={getPriorityColor(selectedSignal.priority)}>
                      {selectedSignal.priority}
                    </Badge>
                  </DialogTitle>
                  <Badge className={getStatusColor(selectedSignal.status)}>
                    {selectedSignal.status === "Closed" ? (
                      <div className="flex items-center">
                        <Check className="mr-1 h-3 w-3" />
                        {selectedSignal.status}
                      </div>
                    ) : selectedSignal.status}
                  </Badge>
                </div>
                <DialogDescription className="text-base mt-2">
                  <div className="font-medium text-gray-800">{selectedSignal.signalType}</div>
                  <div className="mt-1">{selectedSignal.observation}</div>
                </DialogDescription>
                <div className="grid grid-cols-2 gap-4 text-sm mt-3 border-t border-b py-3">
                  <div>
                    <span className="text-gray-500 mr-2">Study:</span>
                    <span className="font-medium">{selectedSignal.studyName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 mr-2">Assigned to:</span>
                    <span className="font-medium">{selectedSignal.assignedTo}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 mr-2">Detection Date:</span>
                    <span className="font-medium">{formatDate(selectedSignal.detectionDate)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 mr-2">Due Date:</span>
                    <span className={`font-medium ${selectedSignal.overdue ? "text-red-600" : ""}`}>
                      {formatDate(selectedSignal.dueDate)}
                      {selectedSignal.overdue && (
                        <span className="ml-2 text-red-600 text-xs font-bold">OVERDUE</span>
                      )}
                    </span>
                  </div>
                </div>
              </DialogHeader>

              <Tabs defaultValue="detailed">
                <TabsList className="grid grid-cols-3 mb-2">
                  <TabsTrigger value="detailed">Detailed Recommendations</TabsTrigger>
                  <TabsTrigger value="actions">Action Plan</TabsTrigger>
                  <TabsTrigger value="feedback">Medical Feedback</TabsTrigger>
                </TabsList>

                <TabsContent value="detailed" className="space-y-4">
                  <div className="space-y-6 py-2">
                    <div>
                      <h3 className="text-base font-semibold flex items-center">
                        <ClipboardCheck className="h-4 w-4 mr-2 text-blue-600" />
                        Key Recommendations
                      </h3>
                      <div className="mt-2 space-y-2">
                        {detailedRecommendations[selectedSignal.signalType]?.recommendations.map((rec, i) => (
                          <div key={i} className="flex items-start text-sm">
                            <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold mr-2 mt-0.5 flex-shrink-0">
                              {i + 1}
                            </div>
                            <div>{rec}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-semibold flex items-center">
                        <Stethoscope className="h-4 w-4 mr-2 text-blue-600" />
                        Investigation Steps
                      </h3>
                      <div className="mt-2 space-y-2">
                        {detailedRecommendations[selectedSignal.signalType]?.investigationSteps.map((step, i) => (
                          <div key={i} className="flex items-start text-sm">
                            <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold mr-2 mt-0.5 flex-shrink-0">
                              {i + 1}
                            </div>
                            <div>{step}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-semibold flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-amber-600" />
                        Monitoring Considerations
                      </h3>
                      <div className="mt-2 space-y-2">
                        {detailedRecommendations[selectedSignal.signalType]?.potentialActions.map((action, i) => (
                          <div key={i} className="flex items-start text-sm">
                            <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold mr-2 mt-0.5 flex-shrink-0">
                              {i + 1}
                            </div>
                            <div>{action}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="actions" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold">Current Action Plan</h3>
                      <div className="mt-2 p-3 border rounded-md bg-gray-50">
                        <p className="text-sm">{selectedSignal.recommendation}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-semibold">Action History</h3>
                      <div className="mt-2 space-y-3">
                        <div className="flex items-start p-3 border rounded-md">
                          <UserRound className="h-8 w-8 text-blue-600 mr-3 mt-1" />
                          <div>
                            <div className="flex items-center">
                              <span className="font-medium">Medical Monitor</span>
                              <span className="text-xs text-gray-500 ml-2">2 days ago</span>
                            </div>
                            <p className="text-sm mt-1">
                              I've reviewed the data for all subjects with elevated liver enzymes. Three of the five cases show values above 3x ULN. 
                              I recommend we implement additional hepatic monitoring for all subjects at weekly intervals for the next month.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start p-3 border rounded-md">
                          <UserRound className="h-8 w-8 text-purple-600 mr-3 mt-1" />
                          <div>
                            <div className="flex items-center">
                              <span className="font-medium">Safety Specialist</span>
                              <span className="text-xs text-gray-500 ml-2">3 days ago</span>
                            </div>
                            <p className="text-sm mt-1">
                              Initial review complete. Flag raised for medical monitor attention. Detected ALT/AST values exceeding 3x ULN in 5 patients 
                              from sites 102 and 103. All occurred within 2 weeks of dosing. Please review subject profiles and provide guidance.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-semibold">Add Action Note</h3>
                      <div className="mt-2">
                        <Textarea 
                          placeholder="Add your notes or action plan here..."
                          className="min-h-[100px]"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="feedback" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold">Medical Assessment</h3>
                      <div className="mt-2 p-4 border rounded-md bg-blue-50 text-sm">
                        <p>
                          <span className="font-medium">Clinical Significance:</span> Moderate to High
                        </p>
                        <p className="mt-2">
                          <span className="font-medium">Causality Assessment:</span> Possible relationship to study drug
                        </p>
                        <p className="mt-2">
                          <span className="font-medium">Risk Factors Identified:</span> Age {'>'}60, concurrent use of statins, pre-existing mild hepatic impairment
                        </p>
                        <p className="mt-2">
                          <span className="font-medium">Recommendation Summary:</span> Implement additional liver function monitoring, evaluate dose reduction in high-risk subjects, prepare for DSMB review.
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-semibold">Discussion Thread</h3>
                      <div className="mt-2 space-y-3">
                        <div className="flex items-start p-3 border rounded-md">
                          <UserRound className="h-8 w-8 text-green-600 mr-3 mt-1" />
                          <div>
                            <div className="flex items-center">
                              <span className="font-medium">Principal Investigator</span>
                              <span className="text-xs text-gray-500 ml-2">1 day ago</span>
                            </div>
                            <p className="text-sm mt-1">
                              We've implemented the additional monitoring protocol at site 102. Initial follow-up tests 
                              show stabilization in 2 subjects, but continued elevation in 1 subject who has been withdrawn from treatment.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start p-3 border rounded-md">
                          <UserRound className="h-8 w-8 text-blue-600 mr-3 mt-1" />
                          <div>
                            <div className="flex items-center">
                              <span className="font-medium">Medical Monitor</span>
                              <span className="text-xs text-gray-500 ml-2">2 days ago</span>
                            </div>
                            <p className="text-sm mt-1">
                              I've consulted with our hepatology expert who recommended weekly monitoring of complete 
                              liver panels for affected subjects and biweekly monitoring for all other subjects for the next 4 weeks. 
                              We should also perform a comprehensive review of concomitant medications.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-semibold">Add Feedback</h3>
                      <div className="mt-2">
                        <Textarea 
                          placeholder="Add your medical feedback here..."
                          className="min-h-[100px]"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-4 gap-2">
                <Select defaultValue="open">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Update Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsDetailsOpen(false)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}