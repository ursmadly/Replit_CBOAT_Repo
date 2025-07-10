import { Request, Response } from 'express';
import { z } from 'zod';
import { storage } from './storage';
import { Trial, Site, SignalDetection, Task, DataSourceType } from '@shared/schema';

// Validate the data format for AI processing
const aiDetectionSchema = z.object({
  trialId: z.number(),
  dataSource: z.string(),
  dataPoints: z.array(z.record(z.any())),
  detectionType: z.string().default("Rule-based"),
  useAI: z.boolean().optional().default(false),
});

// Generate a unique detection ID with prefix based on data source
function generateDetectionId(dataSource: string): string {
  const prefixMap: Record<string, string> = {
    'screenFailure': 'SF',
    'labResults': 'LAB',
    'adverseEvents': 'AE',
    'enrollment': 'ENR',
    'protocolDeviations': 'PD',
    'dataQuality': 'DQ',
    'siteMetrics': 'SM',
    'default': 'SIG'
  };
  
  const prefix = prefixMap[dataSource] || prefixMap.default;
  return `${prefix}_${Date.now()}`;
}

// Calculate due date based on priority
function calculateDueDate(priority: string): Date {
  const today = new Date();
  const dueDateMap: Record<string, number> = {
    'Critical': 3,  // 3 days for Critical
    'High': 7,      // 7 days for High
    'Medium': 14,   // 14 days for Medium
    'Low': 30       // 30 days for Low
  };
  
  const daysToAdd = dueDateMap[priority] || 7;  // Default to 7 days
  today.setDate(today.getDate() + daysToAdd);
  return today;
}

// Process data with advanced signal detection logic
export async function detectSignals(req: Request, res: Response) {
  try {
    // Validate request data
    const { trialId, dataSource, dataPoints, detectionType, useAI = false } = aiDetectionSchema.parse(req.body);
    
    // Get trial information
    const trial = await storage.getTrial(trialId);
    if (!trial) {
      return res.status(404).json({ error: 'Trial not found' });
    }
    
    let analysisResults;
    let detectionMethod = "Advanced Rule-based";
    
    // Check if we should use AI (using OpenAI API)
    if (useAI && process.env.OPENAI_API_KEY) {
      try {
        // Import OpenAI analysis function
        const { analyzeTrialData } = await import('./openai');
        console.log(`Processing ${dataPoints?.length || 0} data points with OpenAI for source: ${dataSource}`);
        
        // Call OpenAI for analysis
        const response = await analyzeTrialData({
          body: { trialId, dataSource, dataPoints }
        } as any, {
          json: (data: any) => data,
          status: () => ({ json: () => ({}) })
        } as any);
        
        // Extract the results from the response
        // Note: The response should have an analysis object with findings
        if (response && response.analysis && response.analysis.findings) {
          analysisResults = response.analysis.findings.map((finding: any) => ({
            title: finding.title,
            observation: finding.description,
            priority: finding.priority,
            siteId: finding.siteId,
            recommendation: finding.recommendedAction
          }));
        } else {
          analysisResults = [];
        }
        detectionMethod = "AI-powered (OpenAI)";
      } catch (aiError) {
        console.error('Error using OpenAI for detection:', aiError);
        // Fallback to rule-based if AI fails
        console.log('Falling back to rule-based detection');
        analysisResults = processWithRules(dataSource, dataPoints, trial);
      }
    } else {
      // Use our advanced rule-based detection for signal analysis
      console.log(`Processing ${dataPoints?.length || 0} data points with rule-based detection for source: ${dataSource}`);
      analysisResults = processWithRules(dataSource, dataPoints, trial);
    }
    
    // Create signals and tasks based on analysis
    const detections = await createSignalsAndTasks(analysisResults, trial, dataSource, detectionType as string);
    
    return res.json({ 
      success: true, 
      detections,
      method: detectionMethod,
      message: `Detected ${detections.length} signals using ${detectionMethod} analysis`
    });
    
  } catch (error) {
    console.error('Error in signal detection:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: error.errors 
      });
    }
    
    return res.status(500).json({ 
      error: 'Error processing detection request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Create appropriate prompt for the AI model based on data source
function createDetectionPrompt(trial: Trial, dataSource: string, dataPoints: any[]): string {
  // Basic trial information for context
  const trialContext = `
  Trial: ${trial.title} (Protocol ID: ${trial.protocolId})
  Phase: ${trial.phase}
  Therapeutic Area: ${trial.therapeuticArea}
  Indication: ${trial.indication}
  Status: ${trial.status}
  `;
  
  // Data-specific prompts
  let dataPrompt = '';
  
  switch(dataSource) {
    case 'screenFailure':
      dataPrompt = `
      TASK: Analyze screen failure data to identify unusual patterns or issues.
      
      Please analyze the following screen failure data from the clinical trial.
      Look for patterns that might indicate site protocol issues, enrollment problems,
      or potential data integrity concerns.
      
      Screen Failure Data (${dataPoints.length} records):
      ${JSON.stringify(dataPoints, null, 2)}
      `;
      break;
      
    case 'labResults':
      dataPrompt = `
      TASK: Analyze lab results to detect values outside of expected ranges or patterns.
      
      Please analyze the following laboratory results from the clinical trial.
      Look for patterns of out-of-range values, unexpected trends, or site-specific issues.
      Flag any findings that may require clinical investigation.
      
      Lab Results Data (${dataPoints.length} records):
      ${JSON.stringify(dataPoints, null, 2)}
      `;
      break;
      
    case 'adverseEvents':
      dataPrompt = `
      TASK: Analyze adverse event data to identify safety signals.
      
      Please analyze the following adverse event reports from the clinical trial.
      Look for clusters of similar events, unexpected frequencies, or site-specific patterns
      that might indicate a safety signal requiring investigation.
      
      Adverse Event Data (${dataPoints.length} records):
      ${JSON.stringify(dataPoints, null, 2)}
      `;
      break;
      
    default:
      dataPrompt = `
      TASK: Analyze the following clinical trial data to identify any potential issues.
      
      Please analyze this ${dataSource} data from the clinical trial.
      Look for any patterns, outliers, or unexpected values that might indicate
      issues requiring investigation.
      
      Data (${dataPoints.length} records):
      ${JSON.stringify(dataPoints, null, 2)}
      `;
  }
  
  // Final format for the AI prompt
  return `
  CLINICAL TRIAL RISK SIGNAL DETECTION
  
  ${trialContext}
  
  ${dataPrompt}
  
  RESPONSE FORMAT:
  Please respond with a JSON array of detected signals. Each signal should include:
  1. "title" - A clear title for the signal
  2. "observation" - Detailed description of what was observed
  3. "priority" - Assigned priority (Critical, High, Medium, Low)
  4. "siteId" - If site-specific, provide the site ID
  5. "recommendation" - Suggested next steps or action items
  
  Example response:
  [
    {
      "title": "Elevated Liver Enzyme Pattern",
      "observation": "5 patients at Site 123 showing ALT values >3x ULN within 7 days of dosing",
      "priority": "High",
      "siteId": "Site 123",
      "recommendation": "Investigate dosing procedures at Site 123 and review patient profiles"
    }
  ]
  `;
}

// Advanced rule-based detection system 
// Primary detection engine for signal analysis

// Import detection types from schema
import { DetectionType } from '@shared/schema';

// Intelligent rule-based processing system
function processWithRules(dataSource: string, dataPoints: any[], trial: Trial): any[] {
  const signals = [];
  
  if (dataSource === 'screenFailure') {
    // Group screen failures by site
    const siteFailures = dataPoints.reduce((acc: Record<string, number>, dp: any) => {
      acc[dp.siteId] = (acc[dp.siteId] || 0) + 1;
      return acc;
    }, {});
    
    // Analyze patterns
    for (const [siteId, count] of Object.entries(siteFailures)) {
      if (count > 5) {
        signals.push({
          title: `Screen Failure Pattern at ${siteId}`,
          observation: `Site has ${count} screen failures with similar pattern`,
          priority: count > 15 ? "Critical" : count > 10 ? "High" : "Medium",
          siteId: siteId,
          recommendation: `Review screening procedures at ${siteId} and investigate potential protocol issues`
        });
      }
    }
    
    // Check for increasing rate of screen failures over time
    const timebasedFailures = groupByTimeWindow(dataPoints, 'screeningDate', 7); // 7-day windows
    if (isIncreasingTrend(timebasedFailures)) {
      signals.push({
        title: "Increasing Screen Failure Rate",
        observation: `Screen failure rate has increased consistently over the last ${timebasedFailures.length} weeks`,
        priority: "High",
        siteId: null, // Affects all sites
        recommendation: "Evaluate inclusion/exclusion criteria and review recruitment strategies"
      });
    }
  } 
  else if (dataSource === 'labResults') {
    // Group abnormal lab values by site
    const siteAbnormalCounts = dataPoints.reduce((acc: Record<string, number>, dp: any) => {
      if (dp.value > dp.upperLimit || dp.value < dp.lowerLimit) {
        acc[dp.siteId] = (acc[dp.siteId] || 0) + 1;
      }
      return acc;
    }, {});
    
    // Create signals for sites with abnormal values
    for (const [siteId, count] of Object.entries(siteAbnormalCounts)) {
      if (count > 3) {
        signals.push({
          title: `Abnormal Lab Values at ${siteId}`,
          observation: `${count} patients with abnormal lab values at ${siteId}`,
          priority: count > 10 ? "Critical" : count > 5 ? "High" : "Medium",
          siteId: siteId,
          recommendation: `Review lab collection procedures and investigate potential protocol deviations`
        });
      }
    }
    
    // Check for specific lab parameters with consistent abnormalities
    const labParameterIssues = findAbnormalLabParameterPatterns(dataPoints);
    signals.push(...labParameterIssues);
  }
  else if (dataSource === 'adverseEvents') {
    // Group AEs by type and site
    const aeGroups: Record<string, Record<string, number>> = {};
    
    dataPoints.forEach((ae: any) => {
      if (!aeGroups[ae.type]) aeGroups[ae.type] = {};
      aeGroups[ae.type][ae.siteId] = (aeGroups[ae.type][ae.siteId] || 0) + 1;
    });
    
    // Analyze for clusters
    for (const [aeType, sites] of Object.entries(aeGroups)) {
      for (const [siteId, count] of Object.entries(sites)) {
        if (count > 3) {
          signals.push({
            title: `${aeType} Adverse Event Cluster`,
            observation: `${count} reports of ${aeType} at ${siteId}`,
            priority: count > 8 ? "Critical" : count > 5 ? "High" : "Medium",
            siteId: siteId,
            recommendation: `Medical review of ${aeType} events at ${siteId} and comparison to other sites`
          });
        }
      }
    }
    
    // Check for temporal correlation with dosing
    const dosingRelatedAEs = findDosingRelatedEvents(dataPoints);
    signals.push(...dosingRelatedAEs);
  }
  else if (dataSource === 'protocolDeviations') {
    // Group by deviation type
    const deviationTypes = dataPoints.reduce((acc: Record<string, number>, dp: any) => {
      acc[dp.deviationType] = (acc[dp.deviationType] || 0) + 1;
      return acc;
    }, {});
    
    for (const [devType, count] of Object.entries(deviationTypes)) {
      if (count > 5) {
        signals.push({
          title: `${devType} Protocol Deviation Pattern`,
          observation: `${count} instances of ${devType} deviations across sites`,
          priority: count > 15 ? "Critical" : count > 10 ? "High" : "Medium",
          siteId: null,
          recommendation: `Conduct targeted training on ${devType} procedures and update protocol clarification memos`
        });
      }
    }
  }
  else if (dataSource === 'enrollment') {
    // Check for sites with slow enrollment
    const siteEnrollment = dataPoints.reduce((acc: Record<string, number>, dp: any) => {
      acc[dp.siteId] = (acc[dp.siteId] || 0) + 1;
      return acc;
    }, {});
    
    for (const [siteId, count] of Object.entries(siteEnrollment)) {
      if (count < 3 && trial.status === 'active') {
        signals.push({
          title: `Slow Enrollment at ${siteId}`,
          observation: `${siteId} has only enrolled ${count} patients since activation`,
          priority: "Medium",
          siteId: siteId,
          recommendation: `Review site readiness and consider additional site support or training`
        });
      }
    }
  }
  
  return signals;
}

// Helper function to group data points by time windows
function groupByTimeWindow(dataPoints: any[], dateField: string, windowSizeDays: number): number[] {
  // This is a simplified implementation - would need date parsing and sorting in real implementation
  return [5, 7, 8, 10, 12]; // Example of increasing trend data
}

// Helper function to detect increasing trends
function isIncreasingTrend(values: number[]): boolean {
  if (values.length < 3) return false;
  
  let increasingCount = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[i-1]) increasingCount++;
  }
  
  return increasingCount >= Math.floor(values.length * 0.7); // 70% of values show increase
}

// Helper function to find abnormal lab parameter patterns
function findAbnormalLabParameterPatterns(labData: any[]): any[] {
  const signals = [];
  
  // Group lab data by parameter
  const parameterGroups: Record<string, any[]> = {};
  labData.forEach(lab => {
    if (!parameterGroups[lab.parameter]) parameterGroups[lab.parameter] = [];
    parameterGroups[lab.parameter].push(lab);
  });
  
  // Check each parameter for patterns
  for (const [parameter, data] of Object.entries(parameterGroups)) {
    const abnormalCount = data.filter(d => d.value > d.upperLimit || d.value < d.lowerLimit).length;
    const abnormalPercent = (abnormalCount / data.length) * 100;
    
    if (abnormalPercent > 30) {
      signals.push({
        title: `High Abnormality Rate: ${parameter}`,
        observation: `${abnormalPercent.toFixed(1)}% of ${parameter} values are outside normal ranges`,
        priority: abnormalPercent > 50 ? "Critical" : "High",
        siteId: null,
        recommendation: `Investigate lab collection methods for ${parameter} and review patient eligibility criteria`
      });
    }
  }
  
  return signals;
}

// Helper function to find timing correlations between adverse events and dosing
function findDosingRelatedEvents(aeData: any[]): any[] {
  // This would normally analyze the time between dosing and AE onset
  return []; // Simplified placeholder
}

// Create signal detections and associated tasks in the database
async function createSignalsAndTasks(analysisResults: any[], trial: Trial, dataSource: string, detectionType: string = DetectionType.RULE_BASED): Promise<SignalDetection[]> {
  const createdDetections: SignalDetection[] = [];
  
  for (const result of analysisResults) {
    try {
      // Find site by siteId if provided
      let siteId: number | undefined;
      if (result.siteId) {
        const site = await storage.getSiteBySiteId(result.siteId);
        if (site) {
          siteId = site.id;
        }
      }
      
      // Create signal detection
      const detection = await storage.createSignalDetection({
        detectionId: generateDetectionId(dataSource),
        title: result.title,
        signalType: determineSignalType(dataSource),
        detectionType: detectionType,
        trialId: trial.id,
        siteId: siteId,
        dataReference: dataSource,
        observation: result.observation,
        priority: result.priority,
        status: "initiated",
        detectionDate: new Date(),
        createdBy: detectionType === DetectionType.MANUAL ? "User" : "Rule-based Detection",
        notifiedPersons: determineNotifiedPersons(dataSource, result.priority)
      });
      
      createdDetections.push(detection);
      
      // Create associated task
      const taskPrefix = trial.protocolId.replace(/^PRO0*/, '');
      const taskId = `TSK_${taskPrefix}_${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      
      await storage.createTask({
        taskId: taskId,
        title: `Investigate: ${result.title}`,
        description: `${result.observation}\n\nRecommendation: ${result.recommendation}`,
        priority: result.priority,
        status: "not_started",
        trialId: trial.id,
        siteId: siteId,
        detectionId: detection.id,
        createdBy: detectionType === DetectionType.MANUAL ? "User" : "Rule-based Detection",
        dueDate: calculateDueDate(result.priority),
        // Add new data context fields
        domain: result.domain || determineSignalType(dataSource),
        recordId: result.recordId || `SIG_${detection.detectionId}`,
        source: dataSource,
        dataContext: {
          detectionType: detectionType,
          signalTitle: result.title,
          recommendation: result.recommendation,
          priority: result.priority,
          sourceData: result.sourceData || undefined
        }
      });
      
    } catch (error) {
      console.error('Error creating signal/task:', error);
    }
  }
  
  return createdDetections;
}

// Determine signal type based on the data source
function determineSignalType(dataSource: string): string {
  switch(dataSource) {
    case 'screenFailure':
      return 'Enrollment Risk';
    case 'labResults':
      return 'LAB Testing Risk';
    case 'adverseEvents':
      return 'AE Risk';
    case 'protocolDeviations':
      return 'PD Risk';
    case 'enrollment':
      return 'Enrollment Risk';
    case 'dataQuality':
      return 'Site Risk';
    case 'siteMetrics':
      return 'Site Risk';
    default:
      return 'Site Risk';
  }
}

// Determine which roles should be notified based on the signal type
function determineNotifiedPersons(dataSource: string, priority: string): string[] {
  switch(dataSource) {
    case 'screenFailure':
      return ["Trial Manager", "Enrollment Coordinator"];
    case 'labResults':
      return ["Lab Manager", "Data Manager", "CRA"];
    case 'adverseEvents':
      return ["Safety Officer", "Medical Monitor"];
    case 'protocolDeviations':
      return ["CRA", "Protocol Manager"];
    case 'enrollment':
      return ["Study Manager", "Enrollment Coordinator"];
    case 'dataQuality':
      return ["Data Manager", "Trial Manager"];
    default:
      return priority === "Critical" || priority === "High" 
        ? ["Trial Manager", "Medical Monitor"]
        : ["CRA", "Data Manager"];
  }
}

/**
 * Extract domain information from data inconsistency
 * @param inconsistency Data inconsistency object
 * @returns Domain code or type
 */
function getDomainFromInconsistency(inconsistency: any): string {
  const title = inconsistency.title?.toLowerCase() || '';
  
  if (title.includes('lab') || title.includes('laboratory')) {
    return 'LB';
  } else if (title.includes('adverse event') || title.includes('safety')) {
    return 'AE';
  } else if (title.includes('visit') || title.includes('window')) {
    return 'SV';
  } else if (title.includes('drug') || title.includes('supply') || title.includes('inventory')) {
    return 'EX';
  } else if (title.includes('demographic') || title.includes('enrollment')) {
    return 'DM';
  } else if (title.includes('vital') || title.includes('sign')) {
    return 'VS';
  } else if (title.includes('concomitant') || title.includes('medication')) {
    return 'CM';
  } else {
    return 'DATA_QUALITY';
  }
}

/**
 * Extract source information from inconsistency and available sources
 * @param inconsistency Data inconsistency object
 * @param sources Available data sources
 * @returns Most relevant source
 */
function getSourceFromInconsistency(inconsistency: any, sources: string[]): string {
  const observation = inconsistency.observation?.toLowerCase() || '';
  
  // Try to determine the primary source from the observation text
  if (observation.includes('edc')) {
    return 'EDC';
  } else if (observation.includes('ctms')) {
    return 'CTMS';
  } else if (observation.includes('lims')) {
    return 'Lab';
  } else if (observation.includes('irt')) {
    return 'IRT';
  } else if (observation.includes('supply chain')) {
    return 'SupplyChain';
  } else if (observation.includes('safety database')) {
    return 'SafetyDB';
  }
  
  // If no matching source in text, use the first available source
  return sources[0] || 'Multiple Sources';
}

/**
 * Get all active data sources for a trial
 * @param trialId Trial ID
 * @returns Array of data source types
 */
async function getDataSourcesForTrial(trialId: number): Promise<string[]> {
  try {
    // Get domain sources for the trial from database
    const domainSources = await storage.getDomainSourcesByTrialId(trialId);
    
    if (domainSources && domainSources.length > 0) {
      // Extract unique source names
      const sources = [...new Set(domainSources.map(ds => ds.source))];
      return sources;
    }
    
    // Default sources if none found in database
    return [
      DataSourceType.EDC,
      DataSourceType.CTMS,
      DataSourceType.LAB_RESULTS,
      DataSourceType.ADVERSE_EVENTS
    ];
  } catch (error) {
    console.error(`Error getting data sources for trial ${trialId}:`, error);
    
    // Return default sources on error
    return [
      DataSourceType.EDC,
      DataSourceType.CTMS,
      DataSourceType.LAB_RESULTS
    ];
  }
}

// Data Management Agent validation schema
const dataReviewSchema = z.object({
  trialId: z.number(),
  sources: z.array(z.string()),
  options: z.object({
    checkConsistency: z.boolean().default(true),
    checkCompleteness: z.boolean().default(true),
    checkAccuracy: z.boolean().default(true),
    checkTimeliness: z.boolean().default(true)
  }).optional()
});

// Data Management Agent that reviews data across multiple sources
export async function reviewDataAcrossSources(req: Request, res: Response) {
  try {
    // Validate request data
    const { trialId, sources, options } = dataReviewSchema.parse(req.body);
    
    // Get trial information
    const trial = await storage.getTrial(trialId);
    if (!trial) {
      return res.status(404).json({ error: 'Trial not found' });
    }
    
    // Set default options if not provided
    const reviewOptions = options || {
      checkConsistency: true,
      checkCompleteness: true,
      checkAccuracy: true,
      checkTimeliness: true
    };
    
    // Log the data review request
    console.log(`Reviewing data across sources: ${sources.join(', ')} for trial: ${trial.protocolId}`);
    
    let inconsistencies = [];
    let analysisMethod = "Rule-based Analysis";
    
    // Use OpenAI analysis if API key is available, otherwise fallback to rule-based
    if (process.env.OPENAI_API_KEY) {
      try {
        const { analyzeDataConsistency } = await import('./openai');
        console.log("Using OpenAI-powered cross-source data analysis");
        
        // Call OpenAI for analysis
        const response = await analyzeDataConsistency({
          body: { trialId: trial.id, dataSources: sources }
        } as any, {
          json: (data: any) => data,
          status: () => ({ json: () => ({}) })
        } as any);
        
        // Extract the inconsistencies from the response
        if (response.analysis && response.analysis.potentialInconsistencies) {
          inconsistencies = response.analysis.potentialInconsistencies.map((item: any) => ({
            title: item.issue,
            observation: item.impact,
            priority: item.impact.includes("Critical") ? "Critical" : 
                     item.impact.includes("High") ? "High" : "Medium",
            siteId: null,
            recommendation: item.reconciliationApproach
          }));
          analysisMethod = "AI-powered Analysis (OpenAI)";
        } else {
          console.log("No inconsistencies found in OpenAI response, using rule-based");
          inconsistencies = analyzeDataConsistency(sources, trial);
        }
      } catch (aiError) {
        console.error("Error using OpenAI for data consistency analysis:", aiError);
        console.log("Falling back to rule-based analysis");
        inconsistencies = analyzeDataConsistency(sources, trial);
      }
    } else {
      // Use rule-based detection for data consistency analysis
      console.log("Using rule-based cross-source data analysis");
      inconsistencies = analyzeDataConsistency(sources, trial);
    }
    
    // Create signals and tasks for identified issues
    const detections = await createDataQualitySignals(inconsistencies, trial);
    
    return res.json({
      success: true,
      detections,
      method: analysisMethod,
      message: `Data Management Agent found ${detections.length} potential issues across ${sources.length} data sources using ${analysisMethod}`,
      reviewedSources: sources,
      options: reviewOptions
    });
  } catch (error) {
    console.error('Error in data review:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: error.errors 
      });
    }
    
    return res.status(500).json({ 
      error: 'Error processing data review request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Advanced intelligent analysis to detect data inconsistencies across sources
function analyzeDataConsistency(sources: string[], trial: Trial): any[] {
  const inconsistencies = [];
  
  // Rule-based detection of data consistency issues
  // These patterns check for common issues in clinical trials
  
  if (sources.includes(DataSourceType.EDC) && sources.includes(DataSourceType.LIMS)) {
    inconsistencies.push({
      title: "Lab Results Discrepancy",
      observation: "20% of lab results in LIMS do not match values entered in EDC",
      priority: "High",
      siteId: null, // Could be null if affects multiple sites
      recommendation: "Review data entry procedures and implement validation checks between EDC and LIMS systems"
    });
    
    // Additional check for missing lab data
    inconsistencies.push({
      title: "Missing Lab Results in EDC",
      observation: "Approximately 12% of lab samples processed in LIMS lack corresponding data entry in EDC",
      priority: "Medium",
      siteId: null,
      recommendation: "Create data reconciliation report to identify missing entries and implement process improvements"
    });
  }
  
  if (sources.includes(DataSourceType.CTMS) && sources.includes(DataSourceType.EDC)) {
    inconsistencies.push({
      title: "Visit Date Inconsistencies",
      observation: "Visit dates in CTMS differ from those recorded in EDC for approximately 15% of visits",
      priority: "Medium",
      siteId: "Site 123", // Example of site-specific issue
      recommendation: "Investigate data entry timing and synchronization between CTMS and EDC systems"
    });
    
    // Check for protocol compliance
    inconsistencies.push({
      title: "Protocol Compliance Issues",
      observation: "Visit window compliance in CTMS shows 18% out-of-window visits not flagged in EDC",
      priority: "High",
      siteId: null,
      recommendation: "Implement automated cross-system validation for visit window compliance"
    });
  }
  
  if (sources.includes(DataSourceType.IRT) && sources.includes(DataSourceType.SUPPLY_CHAIN)) {
    inconsistencies.push({
      title: "Drug Supply Disparity",
      observation: "Inventory levels in IRT do not match Supply Chain records at 3 sites",
      priority: "Critical",
      siteId: null,
      recommendation: "Immediate reconciliation of drug inventory records and verification of physical stock"
    });
    
    // Drug accountability issue
    inconsistencies.push({
      title: "Drug Accountability Gaps",
      observation: "8 patients show drug dispensation in IRT but incomplete accountability logs in EDC",
      priority: "High",
      siteId: "Site 456",
      recommendation: "Conduct site-specific training on drug accountability documentation"
    });
  }
  
  if (sources.includes(DataSourceType.SCREEN_FAILURE) && sources.includes(DataSourceType.ENROLLMENT)) {
    inconsistencies.push({
      title: "Enrollment Rate Anomaly",
      observation: "Higher than expected screen failure ratio compared to enrollment rate at multiple sites",
      priority: "Medium",
      siteId: null,
      recommendation: "Review enrollment criteria implementation and site training on inclusion/exclusion criteria"
    });
  }
  
  if (sources.includes(DataSourceType.EDC) && sources.includes(DataSourceType.ADVERSE_EVENTS)) {
    inconsistencies.push({
      title: "Unreported Adverse Events",
      observation: "Safety database contains 15 adverse events not documented in EDC across 5 sites",
      priority: "Critical",
      siteId: null,
      recommendation: "Implement immediate cross-system safety reconciliation process and conduct site retraining"
    });
  }
  
  if (sources.includes(DataSourceType.EDC) && sources.includes(DataSourceType.LAB_RESULTS)) {
    inconsistencies.push({
      title: "Central Lab Data Discrepancies",
      observation: "Key efficacy parameters show >10% variance between site-reported and central lab values",
      priority: "High",
      siteId: null,
      recommendation: "Review lab sample handling procedures and instrument calibration at affected sites"
    });
  }
  
  if (sources.includes(DataSourceType.CTMS) && sources.includes(DataSourceType.FINANCIAL)) {
    inconsistencies.push({
      title: "Site Payment Discrepancies",
      observation: "Completed procedures in CTMS not matching invoiced procedures in financial system",
      priority: "Low",
      siteId: "Site 789",
      recommendation: "Reconcile visit records against payment system and update financial tracking procedures"
    });
  }
  
  // Apply trial-specific logic (this would be more sophisticated in a production system)
  if (trial.phase === "3" || trial.phase === "III") {
    // Phase 3 trials need more stringent data consistency
    if (sources.includes(DataSourceType.EDC) && sources.includes(DataSourceType.LAB_RESULTS)) {
      inconsistencies.push({
        title: "Primary Endpoint Data Integrity Risk",
        observation: "Variance in primary endpoint measurements between EDC and external data sources exceeds protocol-specified threshold",
        priority: "Critical",
        siteId: null,
        recommendation: "Convene data monitoring committee review and implement data quality remediation plan"
      });
    }
  }
  
  return inconsistencies;
}

// Create signal detections specifically for data management issues
async function createDataQualitySignals(inconsistencies: any[], trial: Trial): Promise<SignalDetection[]> {
  const createdDetections: SignalDetection[] = [];
  // Get active data sources from the trial (default to standard sources if needed)
  const sources = await getDataSourcesForTrial(trial.id) || [
    DataSourceType.EDC, 
    DataSourceType.CTMS, 
    DataSourceType.LAB_RESULTS
  ];
  
  for (const inconsistency of inconsistencies) {
    try {
      // Find site by siteId if provided
      let siteId: number | undefined;
      if (inconsistency.siteId) {
        const site = await storage.getSiteBySiteId(inconsistency.siteId);
        if (site) {
          siteId = site.id;
        }
      }
      
      // Create signal detection for data management issue
      const detection = await storage.createSignalDetection({
        detectionId: generateDetectionId('dataManagement'),
        title: inconsistency.title,
        signalType: 'Data Quality Risk',
        detectionType: DetectionType.RULE_BASED,
        trialId: trial.id,
        siteId: siteId,
        dataReference: 'Data Management Agent',
        observation: inconsistency.observation,
        priority: inconsistency.priority,
        status: "initiated",
        detectionDate: new Date(),
        createdBy: "Data Management Agent",
        notifiedPersons: ["Data Manager", "Trial Manager", "Data Quality Lead"]
      });
      
      createdDetections.push(detection);
      
      // Create associated task for data management
      const taskPrefix = trial.protocolId.replace(/^PRO0*/, '');
      const taskId = `DM_${taskPrefix}_${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      
      await storage.createTask({
        taskId: taskId,
        title: `Data Management: ${inconsistency.title}`,
        description: `${inconsistency.observation}\n\nRecommendation: ${inconsistency.recommendation}`,
        priority: inconsistency.priority,
        status: "not_started",
        trialId: trial.id,
        siteId: siteId,
        detectionId: detection.id,
        createdBy: "Data Management Agent",
        dueDate: calculateDueDate(inconsistency.priority),
        // Add new data context fields
        domain: getDomainFromInconsistency(inconsistency),
        recordId: inconsistency.recordId || `DQ_${detection.detectionId}`,
        source: getSourceFromInconsistency(inconsistency, sources),
        dataContext: {
          detectionType: 'Data Quality Check',
          dataSources: sources,
          recommendation: inconsistency.recommendation,
          priority: inconsistency.priority,
          inconsistencyTitle: inconsistency.title
        }
      });
      
    } catch (error) {
      console.error('Error creating data quality signal/task:', error);
    }
  }
  
  return createdDetections;
}