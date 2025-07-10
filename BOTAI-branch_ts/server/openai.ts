import OpenAI from "openai";
import { Request, Response } from "express";
import { storage } from "./storage";
import { SignalType, DetectionType, insertSignalDetectionSchema, insertTaskSchema } from "../shared/schema";
import { z } from "zod";

// Helper function to safely parse JSON
function safeJSONParse(text: string | null): any {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return {};
  }
}

// Initialize the OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

/**
 * Generates a unique detection ID based on the signal type
 */
function generateDetectionId(signalType: string): string {
  const prefix = signalType.replace(/ /g, "-").substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().substring(7);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Calculate due date based on priority
 */
function calculateDueDate(priority: string): Date {
  const today = new Date();
  let daysToAdd = 7; // Default for medium
  
  if (priority === 'critical') {
    daysToAdd = 2;
  } else if (priority === 'high') {
    daysToAdd = 4;
  } else if (priority === 'low') {
    daysToAdd = 14;
  }
  
  return new Date(today.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
}

/**
 * Determine notified persons based on data source and priority
 */
function determineNotifiedPersons(dataSource: string, priority: string): string[] {
  const notifiedPersons: string[] = [];
  
  // Add data managers for all signals
  notifiedPersons.push("Sarah Williams");
  
  // Add CRAs for site-related data
  if (dataSource.includes("Site") || dataSource === "EDC") {
    notifiedPersons.push("John Smith");
  }
  
  // Add medical monitors for critical or safety signals
  if (priority === "critical" || dataSource.includes("Safety") || dataSource.includes("AE")) {
    notifiedPersons.push("Dr. Robert Chen");
  }
  
  // Add lab specialists for lab data
  if (dataSource.includes("Lab")) {
    notifiedPersons.push("Emma Rodriguez");
  }
  
  return notifiedPersons;
}

/**
 * Endpoint for analyzing trial data with OpenAI
 */
export async function analyzeTrialData(req: Request, res: Response) {
  const { trialId, dataSource, dataPoints } = req.body;
  
  if (!trialId || !dataSource || !dataPoints) {
    return res.status(400).json({ error: "Missing required parameters" });
  }
  
  try {
    // Get trial information
    const trial = await storage.getTrial(parseInt(trialId));
    if (!trial) {
      return res.status(404).json({ error: "Trial not found" });
    }
    
    // Create analysis prompt
    const prompt = createAnalysisPrompt(trial, dataSource, dataPoints);
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system" as const,
          content: "You are an expert clinical trial data analyst specialized in Risk-Based Quality Management. Analyze the provided clinical trial data to detect significant patterns, anomalies, or risks that may require action. Focus on patient safety, data quality, and protocol compliance issues."
        },
        {
          role: "user" as const,
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });
    
    // Process the AI response
    const analysisResult = safeJSONParse(response.choices[0].message.content);
    
    // Generate signals from the analysis
    const signalDetections = await createSignalsFromAnalysis(analysisResult, trial, dataSource);
    
    return res.json({
      analysis: analysisResult,
      signalDetections
    });
  } catch (error) {
    console.error("Error analyzing trial data with OpenAI:", error);
    return res.status(500).json({
      error: "Failed to analyze trial data",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * Create a detailed analysis prompt for OpenAI
 */
function createAnalysisPrompt(trial: any, dataSource: string, dataPoints: any[]): string {
  return `
    ## Clinical Trial Data Analysis Request
    
    ### Trial Information
    - Protocol ID: ${trial.protocolId}
    - Title: ${trial.title}
    - Phase: ${trial.phase}
    - Indication: ${trial.indication || "Not specified"}
    - Status: ${trial.status}
    
    ### Data Source
    ${dataSource}
    
    ### Data Points for Analysis
    \`\`\`json
    ${JSON.stringify(dataPoints, null, 2)}
    \`\`\`
    
    ### Analysis Requirements
    
    1. Identify any significant patterns, trends, or anomalies in the data
    2. Detect potential risks to:
       - Patient safety
       - Data quality and integrity
       - Protocol compliance
       - Study timelines
    3. Evaluate the severity and impact of each identified issue
    4. Suggest appropriate actions for each finding
    
    Please provide your analysis in the following JSON format:
    \`\`\`
    {
      "findings": [
        {
          "title": "Brief descriptive title of the finding",
          "description": "Detailed description of the issue identified",
          "dataPoints": ["Specific data points or identifiers related to this finding"],
          "signalType": "One of: Site Risk, Safety Risk, PD Risk, LAB Testing Risk, Enrollment Risk, AE Risk",
          "priority": "critical|high|medium|low",
          "impact": "Description of potential impact on the study or patients",
          "recommendedAction": "Suggested action to address the issue"
        }
      ],
      "overallAssessment": "Summary of all findings and their collective significance"
    }
    \`\`\`
  `;
}

/**
 * Create signal detections from OpenAI analysis
 */
async function createSignalsFromAnalysis(analysis: any, trial: any, dataSource: string): Promise<any[]> {
  if (!analysis.findings || !Array.isArray(analysis.findings)) {
    return [];
  }
  
  const signalDetections = [];
  
  for (const finding of analysis.findings) {
    try {
      // Map the signal type string to our enum values
      let signalTypeValue: string;
      if (finding.signalType === 'Site Risk') {
        signalTypeValue = 'Site Risk';
      } else if (finding.signalType === 'Safety Risk') {
        signalTypeValue = 'Safety Risk';
      } else if (finding.signalType === 'PD Risk') {
        signalTypeValue = 'PD Risk';
      } else if (finding.signalType === 'LAB Testing Risk') {
        signalTypeValue = 'LAB Testing Risk';
      } else if (finding.signalType === 'Enrollment Risk') {
        signalTypeValue = 'Enrollment Risk';
      } else if (finding.signalType === 'AE Risk') {
        signalTypeValue = 'AE Risk';
      } else {
        signalTypeValue = 'Site Risk'; // Default
      }
      
      const detectionId = generateDetectionId(signalTypeValue);
      
      // Create signal detection entry with required fields
      const signalDetection = {
        detectionId: detectionId,
        trialId: trial.id,
        observation: finding.description || "AI detected observation",
        priority: finding.priority || "Medium",
        title: finding.title || `AI Finding: ${detectionId}`,
        status: "open",
        signalType: signalTypeValue,
        detectionType: DetectionType.AUTOMATED, // Use existing enum value
        detectionDate: new Date(),
        createdBy: "AI Assistant",
        assignedTo: determineNotifiedPersons(dataSource, finding.priority)[0] || "Sarah Williams",
        notifiedPersons: determineNotifiedPersons(dataSource, finding.priority),
        dataReference: JSON.stringify({
          dataSource: dataSource,
          dataPoints: finding.dataPoints,
          impact: finding.impact,
          recommendedAction: finding.recommendedAction
        })
      };
      
      // Validate against schema before saving
      const validatedData = insertSignalDetectionSchema.parse(signalDetection);
      
      // Save to database
      const savedSignal = await storage.createSignalDetection(validatedData);
      signalDetections.push(savedSignal);
      
      // Create associated task
      await createTaskFromSignal(savedSignal);
    } catch (error) {
      console.error("Error processing finding:", error);
    }
  }
  
  return signalDetections;
}

/**
 * Create a task from a signal detection
 */
async function createTaskFromSignal(signal: any) {
  try {
    // Generate prefix based on signal type string
    let prefix = "TASK";
    if (signal.signalType === 'Site Risk') {
      prefix = "SITE";
    } else if (signal.signalType === 'Safety Risk') {
      prefix = "SAFETY";
    } else if (signal.signalType === 'PD Risk') {
      prefix = "PD";
    } else if (signal.signalType === 'LAB Testing Risk') {
      prefix = "LAB";
    } else if (signal.signalType === 'Enrollment Risk') {
      prefix = "ENROLL";
    } else if (signal.signalType === 'AE Risk') {
      prefix = "AE";
    }
                
    const taskId = `${prefix}_${signal.trialId}_${Date.now().toString().substring(7)}`;
    
    // Create task with required fields
    const task = {
      taskId,
      detectionId: signal.id,
      trialId: signal.trialId,
      title: `Investigate ${signal.title || 'AI finding'}`,
      description: `Review and address the following signal: ${signal.observation || signal.description || 'AI detected issue'}`,
      priority: signal.priority,
      status: "open",
      assignedTo: signal.assignedTo,
      createdBy: "AI Assistant",
      dueDate: calculateDueDate(signal.priority)
    };
    
    // Validate against schema
    const validatedTask = insertTaskSchema.parse(task);
    
    await storage.createTask(validatedTask);
  } catch (error) {
    console.error("Error creating task from signal:", error);
  }
}

/**
 * Endpoint for data consistency analysis across sources
 */
export async function analyzeDataConsistency(req: Request, res: Response) {
  const { trialId, dataSources } = req.body;
  
  if (!trialId || !dataSources || !Array.isArray(dataSources)) {
    return res.status(400).json({ error: "Missing required parameters" });
  }
  
  try {
    // Get trial information
    const trial = await storage.getTrial(parseInt(trialId));
    if (!trial) {
      return res.status(404).json({ error: "Trial not found" });
    }
    
    // Create analysis prompt
    const prompt = createConsistencyAnalysisPrompt(trial, dataSources);
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system" as const,
          content: "You are an expert in clinical trial data management with specialization in data reconciliation and cross-source verification. Analyze the provided data sources to identify potential inconsistencies, missing data, or discrepancies that need resolution."
        },
        {
          role: "user" as const,
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });
    
    // Process the AI response
    const analysisResult = safeJSONParse(response.choices[0].message.content);
    
    return res.json({
      analysis: analysisResult
    });
  } catch (error) {
    console.error("Error analyzing data consistency with OpenAI:", error);
    return res.status(500).json({
      error: "Failed to analyze data consistency",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * Create a prompt for data consistency analysis
 */
function createConsistencyAnalysisPrompt(trial: any, dataSources: string[]): string {
  return `
    ## Clinical Trial Data Consistency Analysis Request
    
    ### Trial Information
    - Protocol ID: ${trial.protocolId}
    - Title: ${trial.title}
    - Phase: ${trial.phase}
    - Indication: ${trial.indication || "Not specified"}
    - Status: ${trial.status}
    
    ### Data Sources to Compare
    ${dataSources.join(", ")}
    
    ### Analysis Requirements
    
    1. Identify potential inconsistencies between these data sources
    2. Detect common issues such as:
       - Missing data in one source that exists in another
       - Conflicting values for the same data element across sources
       - Timing differences in data updates between sources
       - Format inconsistencies for the same types of data
    3. Evaluate the impact of each identified issue on data quality
    
    Based on your experience with clinical trial data management, please:
    1. Describe typical inconsistencies found between these specific data sources
    2. Provide recommendations for reconciliation procedures
    3. Suggest metrics to monitor ongoing data consistency
    
    Please provide your analysis in the following JSON format:
    \`\`\`
    {
      "potentialInconsistencies": [
        {
          "issue": "Brief description of the potential inconsistency",
          "affectedSources": ["Sources involved in this inconsistency"],
          "impact": "Impact on data quality or trial outcomes",
          "reconciliationApproach": "Recommended approach to reconcile this issue",
          "detectionMethod": "How to detect this issue systematically"
        }
      ],
      "recommendedMetrics": [
        {
          "metricName": "Name of the metric",
          "description": "What this metric measures and why it's important",
          "calculationMethod": "How to calculate this metric",
          "thresholds": "Suggested acceptable thresholds"
        }
      ],
      "overallAssessment": "Summary of consistency risks and recommendations"
    }
    \`\`\`
  `;
}

/**
 * Process and digitize protocol documents using OpenAI
 */
export async function processProtocolDocument(req: Request, res: Response) {
  try {
    // In a real implementation, you would:
    // 1. Receive the uploaded document file
    // 2. Extract text from the document (PDF/Word) using a library like pdf-parse or mammoth
    // 3. Process the text with OpenAI to extract structured data
    
    const { documentText, documentName, documentType } = req.body;

    if (!documentText) {
      return res.status(400).json({ error: "Document text is required" });
    }

    // Prepare the prompt for OpenAI
    const prompt = `
      You are an expert in clinical trial protocols and documentation.
      Please analyze the following ${documentType || "protocol"} document text and extract structured information
      organized into these sections:
      
      1. Study Title
      2. Protocol ID
      3. Study Phase
      4. Background
      5. Objectives
      6. Study Design
      7. Study Population
      8. Inclusion Criteria (in list format)
      9. Exclusion Criteria (in list format)
      10. Treatment Plan
      11. Endpoints
      12. Statistical Considerations
      13. Safety Assessments
      14. Data Management
      15. Ethical Considerations
      
      For each section, extract the most relevant information from the document.
      If a section is not found in the document, write "Not specified in document" for that section.
      Format your response as a JSON object with each section as a property.
      Each property should be an object with 'title' and 'content' fields.
    `;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: documentText }
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000
    });

    // Extract and parse the response
    const extractedContent = safeJSONParse(response.choices[0].message.content);
    
    return res.json({
      success: true,
      extractedSections: extractedContent
    });
  } catch (error) {
    console.error("Error processing protocol document:", error);
    return res.status(500).json({ 
      error: "Failed to process document", 
      details: error instanceof Error ? error.message : "Unknown error" 
    });
  }
}

/**
 * AI Chat Assistant for answering questions about the clinical trial data
 */
export async function aiChatAssistant(req: Request, res: Response) {
  const { question, context } = req.body;
  
  if (!question) {
    return res.status(400).json({ error: "Missing question parameter" });
  }
  
  try {
    // Construct the prompt with context if available
    let systemPrompt = "You are an expert clinical trial management assistant. Provide concise, accurate information about clinical trials, risk management, and data analysis.";
    
    if (context) {
      systemPrompt += " Use the provided context to inform your responses but don't reference the fact that context was provided.";
    }
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system" as const, content: systemPrompt },
        ...(context ? [{ role: "user" as const, content: `Context: ${JSON.stringify(context)}` }] : []),
        { role: "user" as const, content: question }
      ]
    });
    
    return res.json({
      answer: response.choices[0].message.content
    });
  } catch (error) {
    console.error("Error with AI chat assistant:", error);
    return res.status(500).json({
      error: "Failed to process your question",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}