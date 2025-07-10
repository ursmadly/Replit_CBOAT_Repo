import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database, Table, List, Calendar, CalendarDays, Users, Shield, FileBox, Info } from "lucide-react";

interface DatasetMetadataProps {
  studyId: number;
  domain: string;
  vendor: string;
  dataSource: string;
  sourceInfo?: any[];
}

// Domain descriptions for metadata
const DOMAIN_METADATA: Record<string, any> = {
  AUDIT: {
    name: "EDC Audit Trail",
    description: "Electronic Data Capture (EDC) system audit trail records tracking all changes made to study data.",
    structure: [
      { name: "STUDYID", description: "Study identifier", type: "Character", required: true },
      { name: "DOMAIN", description: "Domain abbreviation", type: "Character", required: true },
      { name: "AUDITID", description: "Unique audit record identifier", type: "Character", required: true },
      { name: "AUDITUSER", description: "User who performed the action", type: "Character", required: true },
      { name: "AUDITDTC", description: "Date/time of audit action", type: "ISO 8601", required: true },
      { name: "AUDITACTION", description: "Type of action performed", type: "Character", required: true },
      { name: "AUDITREC", description: "Record identifier that was modified", type: "Character", required: true },
      { name: "AUDITDESC", description: "Description of the change", type: "Character", required: true },
      { name: "AUDITSTATUS", description: "Status of the audit record", type: "Character", required: false },
      { name: "AUDITREAS", description: "Reason for change", type: "Character", required: false },
      { name: "AUDITIP", description: "IP address of user", type: "Character", required: false },
      { name: "AUDITSYS", description: "System where change was made", type: "Character", required: false },
    ],
    sdtmDomain: false,
    versions: ["Custom extension for regulatory compliance"],
    validation: "21 CFR Part 11 compliance",
    references: "ICH GCP, FDA guidance on electronic records"
  },
  FORM_AUDIT: {
    name: "EDC Form Audit Trail",
    description: "Audit trail specifically for tracking form-level changes in the EDC system.",
    structure: [
      { name: "STUDYID", description: "Study identifier", type: "Character", required: true },
      { name: "DOMAIN", description: "Domain abbreviation", type: "Character", required: true },
      { name: "FORMID", description: "Form identifier", type: "Character", required: true },
      { name: "FORMNAME", description: "Name of the form", type: "Character", required: true },
      { name: "FORMUSER", description: "User who performed the action on the form", type: "Character", required: true },
      { name: "FORMDTC", description: "Date/time of form action", type: "ISO 8601", required: true },
      { name: "FORMACTION", description: "Type of action performed on the form", type: "Character", required: true },
      { name: "FORMSTATUS", description: "Current status of the form", type: "Character", required: true },
      { name: "FORMVERSION", description: "Version of the form", type: "Character", required: false },
      { name: "FORMREAS", description: "Reason for form status change", type: "Character", required: false },
    ],
    sdtmDomain: false,
    versions: ["Custom extension for regulatory compliance"],
    validation: "21 CFR Part 11 compliance"
  },
  DM: {
    name: "Demographics",
    description: "Demographics and baseline characteristics data for study subjects.",
    structure: [
      { name: "USUBJID", description: "Unique subject identifier", type: "Character", required: true },
      { name: "SUBJID", description: "Subject identifier", type: "Character", required: true },
      { name: "RFSTDTC", description: "Subject reference start date/time", type: "ISO 8601", required: true },
      { name: "RFENDTC", description: "Subject reference end date/time", type: "ISO 8601", required: false },
      { name: "AGE", description: "Age", type: "Numeric", required: true },
      { name: "AGEU", description: "Age units", type: "Character", required: true },
      { name: "SEX", description: "Sex", type: "Character", required: true },
      { name: "RACE", description: "Race", type: "Character", required: false },
      { name: "ETHNIC", description: "Ethnicity", type: "Character", required: false },
      { name: "ARMCD", description: "Planned arm code", type: "Character", required: true },
      { name: "ARM", description: "Description of planned arm", type: "Character", required: true },
    ],
    sdtmDomain: true,
    versions: ["SDTM 1.4", "SDTM 1.5", "SDTM 1.7"]
  },
  SV: {
    name: "Subject Visits",
    description: "Subject visit and scheduling information.",
    structure: [
      { name: "USUBJID", description: "Unique subject identifier", type: "Character", required: true },
      { name: "VISITNUM", description: "Visit number", type: "Numeric", required: true },
      { name: "VISIT", description: "Visit name", type: "Character", required: true },
      { name: "VISITDY", description: "Planned study day of visit", type: "Numeric", required: false },
      { name: "SVSTDTC", description: "Start date/time of visit", type: "ISO 8601", required: true },
      { name: "SVENDTC", description: "End date/time of visit", type: "ISO 8601", required: false },
      { name: "SVSTATUS", description: "Visit status", type: "Character", required: true },
    ],
    sdtmDomain: true,
    versions: ["SDTM 1.4", "SDTM 1.5", "SDTM 1.7"]
  },
  DS: {
    name: "Disposition",
    description: "Subject disposition events and status.",
    structure: [
      { name: "USUBJID", description: "Unique subject identifier", type: "Character", required: true },
      { name: "DSSEQ", description: "Sequence number", type: "Numeric", required: true },
      { name: "DSTERM", description: "Reported term for disposition event", type: "Character", required: true },
      { name: "DSDECOD", description: "Standardized disposition term", type: "Character", required: true },
      { name: "DSCAT", description: "Category for disposition event", type: "Character", required: true },
      { name: "DSSTDTC", description: "Start date/time of disposition event", type: "ISO 8601", required: true },
    ],
    sdtmDomain: true,
    versions: ["SDTM 1.4", "SDTM 1.5", "SDTM 1.7"]
  },
  AE: {
    name: "Adverse Events",
    description: "Adverse events reported during the study.",
    structure: [
      { name: "USUBJID", description: "Unique subject identifier", type: "Character", required: true },
      { name: "AESEQ", description: "Sequence number", type: "Numeric", required: true },
      { name: "AETERM", description: "Reported term for the adverse event", type: "Character", required: true },
      { name: "AEDECOD", description: "Dictionary-derived term", type: "Character", required: false },
      { name: "AEBODSYS", description: "Body system or organ class", type: "Character", required: false },
      { name: "AESEV", description: "Severity/intensity", type: "Character", required: false },
      { name: "AESER", description: "Serious event flag", type: "Character", required: true },
      { name: "AESTDTC", description: "Start date/time of adverse event", type: "ISO 8601", required: true },
      { name: "AEENDTC", description: "End date/time of adverse event", type: "ISO 8601", required: false },
      { name: "AEOUT", description: "Outcome of adverse event", type: "Character", required: false },
    ],
    sdtmDomain: true,
    versions: ["SDTM 1.4", "SDTM 1.5", "SDTM 1.7"],
    validation: "FDA required domain for safety analysis"
  },
  SAE: {
    name: "Serious Adverse Events",
    description: "Serious adverse events reported during the study.",
    structure: [
      { name: "USUBJID", description: "Unique subject identifier", type: "Character", required: true },
      { name: "AESEQ", description: "Sequence number", type: "Numeric", required: true },
      { name: "AETERM", description: "Reported term for the serious adverse event", type: "Character", required: true },
      { name: "AEDECOD", description: "Dictionary-derived term", type: "Character", required: false },
      { name: "AESEV", description: "Severity/intensity", type: "Character", required: true },
      { name: "AESER", description: "Serious event flag (always 'Y')", type: "Character", required: true },
      { name: "AESDTH", description: "Results in death flag", type: "Character", required: true },
      { name: "AESHOSP", description: "Requires or prolongs hospitalization flag", type: "Character", required: true },
      { name: "AESLIFE", description: "Is life threatening flag", type: "Character", required: true },
      { name: "AESDISAB", description: "Results in disability/incapacity flag", type: "Character", required: true },
    ],
    sdtmDomain: false,
    versions: ["Custom extension of AE domain"],
    validation: "Expedited reporting per regulatory requirements"
  },
  MH: {
    name: "Medical History",
    description: "Medical history of the subject.",
    structure: [
      { name: "USUBJID", description: "Unique subject identifier", type: "Character", required: true },
      { name: "MHSEQ", description: "Sequence number", type: "Numeric", required: true },
      { name: "MHTERM", description: "Reported term for medical history", type: "Character", required: true },
      { name: "MHDECOD", description: "Dictionary-derived term", type: "Character", required: false },
      { name: "MHBODSYS", description: "Body system or organ class", type: "Character", required: false },
      { name: "MHCAT", description: "Category for medical history event", type: "Character", required: true },
      { name: "MHSTDTC", description: "Start date/time of medical history event", type: "ISO 8601", required: false },
      { name: "MHENDTC", description: "End date/time of medical history event", type: "ISO 8601", required: false },
    ],
    sdtmDomain: true,
    versions: ["SDTM 1.4", "SDTM 1.5", "SDTM 1.7"]
  },
  CM: {
    name: "Concomitant Medications",
    description: "Concomitant medications taken during the study.",
    structure: [
      { name: "USUBJID", description: "Unique subject identifier", type: "Character", required: true },
      { name: "CMSEQ", description: "Sequence number", type: "Numeric", required: true },
      { name: "CMTRT", description: "Reported name of medication", type: "Character", required: true },
      { name: "CMDECOD", description: "Standardized medication name", type: "Character", required: false },
      { name: "CMCAT", description: "Category for medication", type: "Character", required: false },
      { name: "CMDOSE", description: "Dose per administration", type: "Character/Numeric", required: false },
      { name: "CMDOSU", description: "Dose units", type: "Character", required: false },
      { name: "CMROUTE", description: "Route of administration", type: "Character", required: false },
      { name: "CMSTDTC", description: "Start date/time of medication", type: "ISO 8601", required: false },
      { name: "CMENDTC", description: "End date/time of medication", type: "ISO 8601", required: false },
    ],
    sdtmDomain: true,
    versions: ["SDTM 1.4", "SDTM 1.5", "SDTM 1.7"]
  },
  VS: {
    name: "Vital Signs",
    description: "Vital signs measurements.",
    structure: [
      { name: "USUBJID", description: "Unique subject identifier", type: "Character", required: true },
      { name: "VSSEQ", description: "Sequence number", type: "Numeric", required: true },
      { name: "VSTESTCD", description: "Vital signs test code", type: "Character", required: true },
      { name: "VSTEST", description: "Name of vital signs test", type: "Character", required: true },
      { name: "VSORRES", description: "Result or finding in original format", type: "Character", required: true },
      { name: "VSORRESU", description: "Original units", type: "Character", required: false },
      { name: "VSSTRESN", description: "Numeric result in standard units", type: "Numeric", required: false },
      { name: "VSSTRESC", description: "Character result in standard format", type: "Character", required: false },
      { name: "VSSTRESU", description: "Standard units", type: "Character", required: false },
      { name: "VSSTAT", description: "Completion status", type: "Character", required: false },
      { name: "VSDTC", description: "Date/time of vital signs measurement", type: "ISO 8601", required: true },
    ],
    sdtmDomain: true,
    versions: ["SDTM 1.4", "SDTM 1.5", "SDTM 1.7"]
  },
  LB: {
    name: "Laboratory Tests",
    description: "Laboratory test results.",
    structure: [
      { name: "USUBJID", description: "Unique subject identifier", type: "Character", required: true },
      { name: "LBSEQ", description: "Sequence number", type: "Numeric", required: true },
      { name: "LBTESTCD", description: "Lab test code", type: "Character", required: true },
      { name: "LBTEST", description: "Lab test name", type: "Character", required: true },
      { name: "LBCAT", description: "Lab test category", type: "Character", required: false },
      { name: "LBORRES", description: "Result in original units", type: "Character", required: true },
      { name: "LBORRESU", description: "Original units", type: "Character", required: false },
      { name: "LBORNRLO", description: "Reference range lower limit in original units", type: "Character", required: false },
      { name: "LBORNRHI", description: "Reference range upper limit in original units", type: "Character", required: false },
      { name: "LBSTRESN", description: "Numeric result in standard units", type: "Numeric", required: false },
      { name: "LBSTRESU", description: "Standard units", type: "Character", required: false },
      { name: "LBSTNRLO", description: "Reference range lower limit in standard units", type: "Numeric", required: false },
      { name: "LBSTNRHI", description: "Reference range upper limit in standard units", type: "Numeric", required: false },
      { name: "LBNRIND", description: "Reference range indicator", type: "Character", required: false },
      { name: "LBSTAT", description: "Completion status", type: "Character", required: false },
      { name: "LBDTC", description: "Date/time of specimen collection", type: "ISO 8601", required: true },
    ],
    sdtmDomain: true,
    versions: ["SDTM 1.4", "SDTM 1.5", "SDTM 1.7"],
    validation: "FDA required domain for safety analysis",
    references: "LOINC, UCUM"
  },
  EX: {
    name: "Exposure",
    description: "Study drug exposure information.",
    structure: [
      { name: "USUBJID", description: "Unique subject identifier", type: "Character", required: true },
      { name: "EXSEQ", description: "Sequence number", type: "Numeric", required: true },
      { name: "EXTRT", description: "Name of actual treatment", type: "Character", required: true },
      { name: "EXDOSE", description: "Dose per administration", type: "Numeric", required: false },
      { name: "EXDOSU", description: "Dose units", type: "Character", required: false },
      { name: "EXROUTE", description: "Route of administration", type: "Character", required: false },
      { name: "EXSTDTC", description: "Start date/time of treatment", type: "ISO 8601", required: true },
      { name: "EXENDTC", description: "End date/time of treatment", type: "ISO 8601", required: false },
    ],
    sdtmDomain: true,
    versions: ["SDTM 1.4", "SDTM 1.5", "SDTM 1.7"]
  },
  PD: {
    name: "Pharmacodynamics",
    description: "Pharmacodynamic measurements and parameters.",
    structure: [
      { name: "USUBJID", description: "Unique subject identifier", type: "Character", required: true },
      { name: "PDSEQ", description: "Sequence number", type: "Numeric", required: true },
      { name: "PDTESTCD", description: "Pharmacodynamic test code", type: "Character", required: true },
      { name: "PDTEST", description: "Pharmacodynamic test name", type: "Character", required: true },
      { name: "PDORRES", description: "Result in original units", type: "Character", required: true },
      { name: "PDORRESU", description: "Original units", type: "Character", required: false },
      { name: "PDSTRESN", description: "Numeric result in standard units", type: "Numeric", required: false },
      { name: "PDSTRESU", description: "Standard units", type: "Character", required: false },
      { name: "PDSTAT", description: "Completion status", type: "Character", required: false },
      { name: "PDDTC", description: "Date/time of assessment", type: "ISO 8601", required: true },
    ],
    sdtmDomain: true,
    versions: ["SDTM 1.4", "SDTM 1.5", "SDTM 1.7"]
  },
  TU: {
    name: "Tumor Results",
    description: "Tumor assessment results (e.g., according to RECIST criteria).",
    structure: [
      { name: "USUBJID", description: "Unique subject identifier", type: "Character", required: true },
      { name: "TUSEQ", description: "Sequence number", type: "Numeric", required: true },
      { name: "TULNKID", description: "Tumor identification", type: "Character", required: true },
      { name: "TUTESTCD", description: "Tumor test code", type: "Character", required: true },
      { name: "TUTEST", description: "Tumor test name", type: "Character", required: true },
      { name: "TUORRES", description: "Result in original units", type: "Character", required: true },
      { name: "TUORRESU", description: "Original units", type: "Character", required: false },
      { name: "TUSTRESC", description: "Character result in standard format", type: "Character", required: false },
      { name: "TUMETHOD", description: "Method of assessment", type: "Character", required: false },
      { name: "TULOC", description: "Location of the tumor", type: "Character", required: false },
      { name: "TUDTC", description: "Date/time of assessment", type: "ISO 8601", required: true },
    ],
    sdtmDomain: true,
    versions: ["SDTM 1.4", "SDTM 1.5", "SDTM 1.7"],
    references: "RECIST 1.1"
  },
  TR: {
    name: "Tumor Response",
    description: "Tumor response assessments (e.g., complete response, partial response, stable disease, progressive disease).",
    structure: [
      { name: "USUBJID", description: "Unique subject identifier", type: "Character", required: true },
      { name: "TRSEQ", description: "Sequence number", type: "Numeric", required: true },
      { name: "TRTESTCD", description: "Response test code", type: "Character", required: true },
      { name: "TRTEST", description: "Response test name", type: "Character", required: true },
      { name: "TRCAT", description: "Category of response", type: "Character", required: false },
      { name: "TRORRES", description: "Result in original units", type: "Character", required: true },
      { name: "TRMETHOD", description: "Method of assessment", type: "Character", required: false },
      { name: "TRDTC", description: "Date/time of assessment", type: "ISO 8601", required: true },
      { name: "TREVAL", description: "Evaluator", type: "Character", required: false },
      { name: "TRSPID", description: "Sponsor-defined identifier", type: "Character", required: false },
    ],
    sdtmDomain: true,
    versions: ["SDTM 1.4", "SDTM 1.5", "SDTM 1.7"],
    references: "RECIST 1.1"
  },
  CTMS_STUDY: {
    name: "CTMS Study Data",
    description: "Clinical Trial Management System (CTMS) study-level data containing key study metrics and information.",
    structure: [
      { name: "STUDYID", description: "Study identifier", type: "Character", required: true },
      { name: "DOMAIN", description: "Domain abbreviation", type: "Character", required: true },
      { name: "PROTOCOL", description: "Protocol identifier", type: "Character", required: true },
      { name: "TITLE", description: "Study title", type: "Character", required: true },
      { name: "PHASE", description: "Study phase", type: "Character", required: true },
      { name: "STATUS", description: "Study status", type: "Character", required: true },
      { name: "DESIGN", description: "Study design", type: "Character", required: false },
      { name: "SPONSORID", description: "Sponsor identifier", type: "Character", required: false },
      { name: "SPONSORNAME", description: "Sponsor name", type: "Character", required: false },
      { name: "INDICATION", description: "Study indication", type: "Character", required: false },
      { name: "STARTDATE", description: "Study start date", type: "ISO 8601", required: true },
      { name: "ENDDATE", description: "Planned or actual study end date", type: "ISO 8601", required: false },
      { name: "ENROLLMENT", description: "Current enrollment count", type: "Numeric", required: false },
      { name: "ENROLLMENTGOAL", description: "Enrollment goal", type: "Numeric", required: false },
    ],
    sdtmDomain: false,
    versions: ["Custom operational domain"],
    validation: "Operational metrics tracking",
    references: "CDISC ODM, Study/Site/Subject Data Model"
  }
};

// Default metadata when domain is not found
const DEFAULT_METADATA = {
  name: "Unknown Domain",
  description: "Metadata for this domain is not available.",
  structure: [],
  sdtmDomain: false,
  versions: []
};

export function DatasetMetadata({ studyId, domain, vendor, dataSource, sourceInfo = [] }: DatasetMetadataProps) {
  // Get metadata for the current domain, or use default if not found
  const metadata = DOMAIN_METADATA[domain] || DEFAULT_METADATA;
  
  return (
    <ScrollArea className="h-[calc(100vh-250px)]">
      <div className="space-y-4 p-2">
        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-blue-700 flex items-center">
              <Database className="h-5 w-5 mr-2 text-blue-500" />
              Dataset Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center text-sm">
                <Info className="h-4 w-4 mr-2 text-blue-500" />
                <span className="font-medium">Domain:</span>
              </div>
              <div className="text-sm">{domain}</div>
              
              <div className="flex items-center text-sm">
                <Table className="h-4 w-4 mr-2 text-blue-500" />
                <span className="font-medium">Dataset Name:</span>
              </div>
              <div className="text-sm">{metadata.name}</div>
              
              <div className="flex items-center text-sm">
                <Users className="h-4 w-4 mr-2 text-blue-500" />
                <span className="font-medium">Vendor:</span>
              </div>
              <div className="text-sm">{vendor}</div>
              
              <div className="flex items-center text-sm">
                <FileBox className="h-4 w-4 mr-2 text-blue-500" />
                <span className="font-medium">Data Source:</span>
              </div>
              <div className="text-sm">{dataSource}</div>
              
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                <span className="font-medium">Last Updated:</span>
              </div>
              <div className="text-sm">{new Date().toLocaleDateString()}</div>
            </div>
            
            <Separator className="my-2" />
            
            <div className="space-y-2">
              <div className="flex items-center text-sm font-medium">
                <Shield className="h-4 w-4 mr-2 text-blue-500" />
                Description
              </div>
              <div className="text-sm">{metadata.description}</div>
            </div>
            
            {metadata.sdtmDomain && (
              <div className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full inline-block">
                SDTM Standard Domain
              </div>
            )}
            
            {metadata.versions && metadata.versions.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Standard Versions:</div>
                <div className="flex flex-wrap gap-1">
                  {metadata.versions.map((version: string) => (
                    <span key={version} className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                      {version}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {metadata.validation && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Validation Note:</div>
                <div className="text-sm">{metadata.validation}</div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-blue-700 flex items-center">
              <List className="h-5 w-5 mr-2 text-blue-500" />
              Variable Structure
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metadata.structure && metadata.structure.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-[1fr_3fr_1fr_80px] gap-2 py-2 px-3 bg-gray-100 rounded text-sm font-medium">
                  <div>Variable</div>
                  <div>Description</div>
                  <div>Type</div>
                  <div>Required</div>
                </div>
                {metadata.structure.map((field: any) => (
                  <div key={field.name} className="grid grid-cols-[1fr_3fr_1fr_80px] gap-2 py-1 px-3 border-b border-gray-100 last:border-0 text-sm">
                    <div className="font-medium">{field.name}</div>
                    <div>{field.description}</div>
                    <div>{field.type}</div>
                    <div>{field.required ? 
                      <span className="text-green-600">Yes</span> : 
                      <span className="text-gray-500">No</span>
                    }</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No structure information available for this domain.</div>
            )}
          </CardContent>
        </Card>
        
        {metadata.references && (
          <Card className="border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-blue-700 flex items-center">
                <CalendarDays className="h-5 w-5 mr-2 text-blue-500" />
                References
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">{metadata.references}</div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}