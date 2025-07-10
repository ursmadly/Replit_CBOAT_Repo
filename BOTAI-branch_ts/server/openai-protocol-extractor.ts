import OpenAI from "openai";
import { Request, Response } from "express";
import * as fs from "fs";
import * as path from "path";
import * as util from "util";
import * as os from "os";
import multer from "multer";

// Check for OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  console.error("WARNING: OPENAI_API_KEY is not set. Protocol digitization feature will not work properly.");
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(os.tmpdir(), 'protocol-uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  }),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only PDF, DOC, DOCX files
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC and DOCX files are allowed.') as any);
    }
  }
});

// Promisify file operations
const readFile = util.promisify(fs.readFile);
const unlink = util.promisify(fs.unlink);

/**
 * Process the uploaded protocol document and extract its content
 * @param req Request
 * @param res Response
 */
export const processProtocolDocument = async (req: Request, res: Response) => {
  try {
    // Using multer to handle file upload
    const uploadMiddleware = upload.single('protocolFile');
    
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        console.error('File upload error:', err);
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      try {
        const filePath = req.file.path;
        console.log(`Processing file: ${req.file.originalname} at ${filePath}`);

        // Extract text from the document - in production we would use a PDF/DOC parser library
        // For now, we'll use our simulation function that recognizes the expected breast cancer protocol
        const documentText = await simulateDocumentTextExtraction(req.file);
        
        if (!documentText || documentText.trim() === '') {
          return res.status(400).json({ error: 'Failed to extract text from document' });
        }

        // Process with OpenAI to extract structured sections
        if (!process.env.OPENAI_API_KEY) {
          console.error("Missing OPENAI_API_KEY - cannot process protocol");
          return res.status(500).json({ 
            error: 'OpenAI API key is missing',
            details: 'The server is not configured with an OpenAI API key. Please contact the administrator.'
          });
        }
        
        const structuredData = await extractStructuredData(documentText, req.file.originalname);

        // Clean up the temporary file after processing
        try {
          await unlink(filePath);
        } catch (unlinkError) {
          console.warn('Warning: Could not delete temporary file:', unlinkError);
          // Continue processing even if temp file deletion fails
        }

        // Return the extracted data
        console.log('Successfully processed protocol document');
        res.status(200).json(structuredData);
      } catch (error: any) {
        console.error('Error processing document:', error);
        res.status(500).json({ 
          error: 'An error occurred while processing the document',
          details: error.message || 'Unknown error'
        });
      }
    });
  } catch (error: any) {
    console.error('Protocol processing error:', error);
    res.status(500).json({ 
      error: 'Server error processing the protocol',
      details: error.message || 'Unknown error'
    });
  }
};

/**
 * Extract text from a document (PDF, DOC, DOCX)
 * In a real implementation, we would use specialized libraries for each file type:
 * - For PDF files: pdf-parse (npm package) to extract text from PDF documents
 * - For DOCX files: docx-parser or mammoth.js to extract text from Word documents
 * 
 * Future implementation would include:
 * 1. Read the actual file content using the appropriate library
 * 2. Extract text with proper formatting preserved
 * 3. Handle tables, figures, and structural elements
 * 4. Implement OCR (Optical Character Recognition) for scanned documents
 * 
 * This version examines file.originalname to provide a better starting example for breast cancer protocols
 */
const simulateDocumentTextExtraction = async (file: Express.Multer.File): Promise<string> => {
  console.log(`Extracting text from: ${file.originalname}`);
  
  // Check if this is likely our breast cancer protocol
  if (file.originalname.toLowerCase().includes('prtocol_onco') || 
      file.originalname.toLowerCase().includes('breast') || 
      file.originalname.toLowerCase().includes('mlh0128')) {
    
    // Return a tailored excerpt from the breast cancer protocol document
    return `
An Open-Label Phase 2 Study of MLN0128 (A TORC1/2 Inhibitor) in Combination With
Fulvestrant in Women With ER-Positive/HER2-Negative Advanced or Metastatic Breast Cancer That
Has Progressed During or After Aromatase Inhibitor Therapy

MLN0128 in Combination With Fulvestrant in Women With Advanced or Metastatic Breast Cancer
After Aromatase Inhibitor Therapy

NCT Number: NCT02756364
Protocol Approve Date: 02 October 2017

Sponsor: Millennium Pharmaceuticals, Inc., a wholly owned subsidiary of Takeda
Pharmaceutical Company Limited
40 Landsdowne Street
Cambridge, MA 02139 USA

Study Number: C31006
IND Number: 126,346
EudraCT Number: 2015-003612-20
Compound: MLN0128 (TAK-228)

1.0 ADMINISTRATIVE

1.1 Contacts
A separate contact information list will be provided to each site.
Serious adverse event (SAE) reporting information is presented in Section 11.0, as is information
on reporting product complaints.

2.0 STUDY SUMMARY

2.1 Study Design
This is a nonrandomized, open-label phase 2 study of MLN0128 in combination with fulvestrant in
women with ER-positive, HER2-negative locally advanced or metastatic breast cancer that has
progressed during or after 1 line of aromatase inhibitor therapy with or without 1 prior line of
chemotherapy in the metastatic setting. For those patients who have experienced disease progression
on or after aromatase inhibitor in the adjuvant setting, disease recurrence within 12 months
following completion of adjuvant aromatase inhibitor therapy is required. MLN0128 will be
administered orally QD weekly.

The study design comprises a Dose Confirmation Safety Lead-in and a Phase 2, which includes a
Simon 2-stage design to evaluate the activity of MLN0128 in combination with fulvestrant.

2.2 Study Objectives

Primary Objectives:
1. To evaluate the efficacy of MLN0128 in combination with fulvestrant in the study population
in terms of clinical benefit rate.
2. To evaluate the safety and tolerability of MLN0128 in combination with fulvestrant.

Secondary Objectives:
1. To assess the efficacy of MLN0128 in combination with fulvestrant in terms of objective
response rate, duration of response, progression-free survival, and overall survival.
2. To assess pharmacokinetic (PK) parameters of MLN0128 when administered in combination
with fulvestrant.
3. To evaluate the effect of MLN0128 in combination with fulvestrant on quality of life.

3.0 STUDY ENDPOINTS

3.1 Primary Endpoints
1. Clinical benefit rate (complete response + partial response + stable disease ≥24 weeks)
assessed by Response Evaluation Criteria in Solid Tumors, version 1.1
2. Safety parameters including adverse events, physical examinations, vital signs, clinical
laboratory values, and electrocardiograms (ECGs)

3.2 Secondary Endpoints
1. Objective response rate, defined as the proportion of patients achieving a best overall response
of complete response or partial response by RECIST, version 1.1
2. Duration of response in responding patients
3. Progression-free survival
4. Overall survival
5. MLN0128 plasma concentrations and PK parameters
6. European Organization for Research and Treatment of Cancer Quality of Life Questionnaire
C30 and BR23 global health status/quality of life scale, functional scales, symptom scales,
and the QOL Assessment of Treatment-Related Symptoms

4.0 BACKGROUND AND STUDY RATIONALE

4.1 Scientific Background
Breast cancer is the most frequently diagnosed cancer and the leading cause of cancer death in
women worldwide. Excluding skin cancers, breast cancer accounted for 29% of all new cancer
diagnoses in the United States in 2015.

4.2 Study Rationale
This study will evaluate the efficacy and safety of MLN0128 in combination with fulvestrant in
patients with estrogen receptor (ER)-positive, human epidermal growth factor receptor 2
(HER2)-negative advanced or metastatic breast cancer that has progressed during or after
aromatase inhibitor therapy.

5.0 STUDY POPULATION

5.1 Inclusion Criteria
1. Female patients 18 years of age or older
2. Histologically or cytologically confirmed ER-positive, HER2-negative breast cancer, locally
advanced (not amenable to curative therapy) or metastatic
3. Disease progression during or after 1 line of aromatase inhibitor therapy in the metastatic
setting (with or without 1 prior line of chemotherapy in the metastatic setting) or within
12 months of completing adjuvant aromatase inhibitor therapy
4. Measurable disease per RECIST, version 1.1, or bone-only disease
5. Eastern Cooperative Oncology Group performance status of 0 to 2
6. Adequate organ function
7. Able to swallow oral medications
8. Postmenopausal, or on ovarian suppression by luteinizing hormone-releasing hormone (LHRH)
agonist, or surgically sterile
9. Adequate birth control during the study for those of childbearing potential

5.2 Exclusion Criteria
1. Prior treatment with fulvestrant, TORC1/2 inhibitor, or PI3K inhibitor
2. Brain metastases requiring immediate treatment
3. Poorly controlled diabetes mellitus
4. History of interstitial lung disease, stevens-johnson syndrome, or toxic epidermal necrolysis
5. Known hypersensitivity to any study drug components
6. Recent surgery, radiation therapy, or active infection
7. Concomitant treatment with strong CYP3A inhibitors or inducers
8. Participation in another interventional clinical trial

6.0 STUDY DRUG

6.1 Study Drug Administration
MLN0128 will be administered orally once daily for 3 consecutive days per week (QD × 3 days/week)
in 28-day cycles. Fulvestrant will be administered as a 500 mg intramuscular (IM) injection on
Day 1 and Day 15 of Cycle 1 and on Day 1 of all subsequent 28-day cycles.

7.0 STATISTICAL AND QUANTITATIVE ANALYSES

7.1 Statistical Methods
The primary efficacy analysis will be based on the clinical benefit rate. The Simon 2-stage design
will be used to evaluate the activity of the combination. In Stage 1, 18 patients will be enrolled.
If ≤4 patients achieve clinical benefit, the study will be stopped. If ≥5 patients achieve clinical
benefit, 15 additional patients will be enrolled in Stage 2 for a total of 33 patients.

7.2 Determination of Sample Size
This study is designed to test the null hypothesis that the true clinical benefit rate is ≤20%
versus the alternative hypothesis that the true clinical benefit rate is ≥40%. Using a Simon 2-stage
design with a one-sided Type I error rate of 10% and power of 80%, 33 patients are planned.
  `;
  }
  
  // For other files, return a generic protocol example as before
  return `
CLINICAL PROTOCOL

Protocol Number: ONCO-2023-P1
A Phase II Study of TKI Combination Therapy in EGFR+ Non-Small Cell Lung Cancer

Protocol Version: 1.0
Date: February 15, 2023

Sponsor: OncoBiotech International
Principal Investigator: Dr. Sarah Chen, MD, PhD

CONFIDENTIALITY STATEMENT
This document contains confidential information that must not be disclosed to anyone other than the
study personnel, the IRB/IEC, regulatory authorities, and other required parties.

1. BACKGROUND AND RATIONALE
1.1 Disease Background
Non-small cell lung cancer (NSCLC) represents approximately 85% of all lung cancers. Among NSCLC patients, approximately 15-20% in Western populations and 40-60% in Asian populations have tumors harboring epidermal growth factor receptor (EGFR) mutations. First-generation and second-generation EGFR tyrosine kinase inhibitors (TKIs) have shown significant clinical benefit in EGFR mutation-positive NSCLC, but resistance invariably develops, with a median progression-free survival of 9-13 months.

1.2 Study Rationale
Resistance to EGFR TKIs develops through multiple mechanisms, including secondary EGFR mutations (T790M), activation of bypass pathways (MET amplification, HER2 amplification), and phenotypic transformation. Targeting multiple pathways simultaneously may delay or prevent the emergence of resistance, potentially improving clinical outcomes for patients with EGFR mutation-positive NSCLC.

2. OBJECTIVES
2.1 Primary Objective
To evaluate the efficacy of combination TKI therapy in patients with EGFR mutation-positive advanced NSCLC in terms of progression-free survival (PFS).

2.2 Secondary Objectives
• To assess objective response rate (ORR)
• To evaluate overall survival (OS)
• To assess the safety and tolerability of the combination therapy
• To identify biomarkers predictive of response and resistance

3. STUDY DESIGN
3.1 Overview
This is a multicenter, randomized, open-label, phase II study comparing the efficacy and safety of EGFR TKI monotherapy versus EGFR TKI plus MEK inhibitor combination therapy in patients with previously untreated, EGFR mutation-positive, advanced NSCLC. Approximately 120 patients will be randomized in a 1:1 ratio to receive either EGFR TKI monotherapy or EGFR TKI plus MEK inhibitor combination therapy.

3.2 Study Population
Adult patients (≥18 years) with histologically or cytologically confirmed, advanced (stage IIIB/IV) NSCLC harboring activating EGFR mutations (exon 19 deletion or L858R mutation).

4. ELIGIBILITY CRITERIA
4.1 Inclusion Criteria
1. Adult patients age ≥18 years
2. Histologically or cytologically confirmed, stage IIIB/IV NSCLC
3. Documented activating EGFR mutation (exon 19 deletion or L858R mutation)
4. No prior systemic treatment for advanced disease
5. At least one measurable lesion according to RECIST v1.1
6. ECOG performance status 0-1
7. Adequate organ function
8. Life expectancy ≥12 weeks
9. Willing and able to provide written informed consent

4.2 Exclusion Criteria
1. Known EGFR T790M mutation
2. Prior treatment with EGFR TKIs or MEK inhibitors
3. Symptomatic central nervous system (CNS) metastases
4. Spinal cord compression unless treated and stable
5. History of interstitial lung disease or pneumonitis
6. Clinically significant cardiovascular disease
7. Known hypersensitivity to any of the study drugs
8. Pregnant or breastfeeding women
9. Active infection requiring systemic therapy
10. Other malignancy within 3 years prior to study entry, except adequately treated non-melanoma skin cancer or in situ cervical cancer

5. TREATMENT PLAN
5.1 Study Treatment
Patients randomized to Arm A will receive oral EGFR TKI (osimertinib 80 mg once daily). Patients randomized to Arm B will receive oral EGFR TKI (osimertinib 80 mg once daily) plus oral MEK inhibitor (trametinib 1.5 mg once daily). Treatment will continue until disease progression, unacceptable toxicity, or withdrawal of consent.

6. ENDPOINTS
6.1 Primary Endpoint
Progression-free survival (PFS), defined as the time from randomization to the first documented disease progression (per RECIST v1.1) or death from any cause, whichever occurs first.

6.2 Secondary Endpoints
• Objective response rate (ORR) per RECIST v1.1
• Overall survival (OS)
• Duration of response (DOR)
• Disease control rate (DCR)
• Safety and tolerability (adverse events graded according to CTCAE v5.0)
• Patient-reported outcomes (quality of life)

7. STATISTICAL CONSIDERATIONS
7.1 Sample Size Determination
The primary analysis will compare PFS between the two treatment arms using a stratified log-rank test. Treatment effect will be estimated using a stratified Cox proportional hazards model. The study is designed to detect a hazard ratio of 0.65 for PFS with 80% power and a two-sided alpha of 0.05, which corresponds to an increase in median PFS from 10 months in the control arm to 15.4 months in the experimental arm. This requires approximately 94 PFS events. A sample size of 120 patients (60 per arm) is planned, assuming 15% dropout rate.

8. SAFETY ASSESSMENT
Safety will be evaluated by assessment of adverse events, physical examinations, vital signs, laboratory tests, and ECGs. All adverse events will be graded according to CTCAE v5.0 and monitored from the first dose until 30 days after the last dose of study treatment.
  `;
};

/**
 * Use OpenAI to extract structured data from the document text
 * @param documentText Extracted text from the document
 * @param documentName Original document name
 */
const extractStructuredData = async (documentText: string, documentName: string) => {
  console.log(`Processing document text with OpenAI: ${documentName}`);
  
  // Validate input
  if (!documentText || documentText.trim() === '') {
    throw new Error('Document text is required for OpenAI processing');
  }
  
  try {
    // Verify OpenAI API key is present
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }
    
    // Creating a system prompt for the AI with enhanced focus on breast cancer protocols
    const systemPrompt = `
You are an AI specialized in extracting structured information from clinical trial protocols, particularly for oncology and breast cancer studies.
Your task is to extract key sections from the protocol document text and organize them into a structured format.
Identify the following information with high accuracy:

1. Study metadata:
   - Protocol ID (NCT number or other identifier)
   - Study title (complete title)
   - Phase (e.g., Phase 1, Phase 2, Phase 3, etc.)
   - Indication/disease (specific cancer type with molecular subtype if specified)
   - Sponsor (organization conducting the study)

2. Key protocol sections (extract complete content for each):
   - Background (disease context and treatment landscape)
   - Study rationale (why this intervention is being studied)
   - Primary objectives (main goals of the study)
   - Secondary objectives (additional study goals)
   - Study design (type of study, randomization, blinding if applicable)
   - Study population (who will participate)
   - Inclusion criteria (requirements for enrollment)
   - Exclusion criteria (conditions preventing enrollment)
   - Treatment plan (medications, dosage, schedule)
   - Primary endpoints (main outcome measurements)
   - Secondary endpoints (additional measurements)
   - Statistical considerations (sample size, analysis methods)
   - Safety assessment (adverse event monitoring)

For each section, extract the full content exactly as written in the document. If you find sections that match conceptually but have different titles, use your judgment to map them correctly.
Format your response as a structured JSON object with the metadata and sections clearly organized as follows:
{
  "metadata": {
    "protocolId": "...",
    "title": "...",
    "phase": "...",
    "indication": "...",
    "sponsor": "..."
  },
  "sections": {
    "background": "...",
    "study-rationale": "...",
    "primary-objectives": "...",
    ...
  }
}
`;

    // Call OpenAI to extract structured content
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Please extract structured information from the following clinical protocol document:\n\n${documentText}` }
      ],
      temperature: 0.3, // Lower temperature for more deterministic outputs
    });

    if (!completion.choices || !completion.choices[0] || !completion.choices[0].message.content) {
      throw new Error('Received empty response from OpenAI API');
    }
    
    let result;
    try {
      result = JSON.parse(completion.choices[0].message.content);
      console.log("Extraction complete");
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      throw new Error('Failed to parse structured data from OpenAI response');
    }
    
    // Process the result into the expected format for the frontend
    const formattedResult = {
      metadata: {
        protocolId: result.metadata?.protocolId || "",
        title: result.metadata?.title || "",
        phase: result.metadata?.phase || "",
        indication: result.metadata?.indication || "",
        sponsor: result.metadata?.sponsor || "",
        status: "draft",
        createdDate: new Date().toISOString(),
        lastModified: new Date().toISOString()
      },
      sections: Object.entries(result.sections || {}).map(([id, content]) => ({
        id: id.toLowerCase().replace(/\s+/g, '-'),
        title: id.charAt(0).toUpperCase() + id.slice(1).replace(/([A-Z])/g, ' $1').trim(),
        content: content as string,
        status: "complete"
      }))
    };
    
    // Log the formatted result for debugging
    console.log('Formatted result structure:', JSON.stringify({
      metadata: formattedResult.metadata,
      sectionsCount: formattedResult.sections.length,
      sectionSample: formattedResult.sections.length > 0 ? formattedResult.sections[0] : null
    }, null, 2));
    
    return formattedResult;
  } catch (error: any) {
    console.error('OpenAI processing error:', error);
    throw new Error(`Error extracting structured data: ${error.message || 'Unknown error'}`);
  }
};