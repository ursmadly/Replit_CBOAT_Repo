import OpenAI from "openai";

// Initialize the OpenAI client with xAI endpoint
const openai = new OpenAI({ 
  baseURL: "https://api.x.ai/v1", 
  apiKey: process.env.XAI_API_KEY 
});

/**
 * Analyze clinical trial data with Grok 2 for insightful signal detection
 * @param trialInfo Object containing trial details
 * @param dataSource String identifying the data source
 * @param dataPoints Array of data records for analysis
 * @returns Analysis results with detected signals
 */
export async function analyzeWithGrok(
  trialInfo: any, 
  dataSource: string, 
  dataPoints: any[]
): Promise<any[]> {
  try {
    // Create a detailed prompt for the model
    const prompt = createAnalysisPrompt(trialInfo, dataSource, dataPoints);
    
    // Call the Grok model
    const response = await openai.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: "You are a clinical trial data analyst specializing in identifying risk signals and data quality issues. Analyze the provided data and return structured insights in the requested format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });
    
    // Parse the response safely
    const contentRaw = response.choices[0]?.message?.content;
    const content = contentRaw ? contentRaw : '{}';
    
    const result = JSON.parse(content);
    
    if (Array.isArray(result.signals)) {
      return result.signals;
    } else if (result.signals) {
      console.warn("Unexpected signals format, converting to array");
      return [result.signals];
    }
    
    console.warn("No signals found in response");
    return [];
    
  } catch (error) {
    console.error("Error in Grok analysis:", error);
    throw new Error(`Grok analysis failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Create a detailed analysis prompt for the Grok model
 */
function createAnalysisPrompt(trialInfo: any, dataSource: string, dataPoints: any[]): string {
  // Basic trial information for context
  const trialContext = `
  Trial: ${trialInfo.title} (Protocol ID: ${trialInfo.protocolId})
  Phase: ${trialInfo.phase}
  Therapeutic Area: ${trialInfo.therapeuticArea || ""}
  Indication: ${trialInfo.indication ? trialInfo.indication : "Not specified"}
  Status: ${trialInfo.status}
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
  Return a JSON object with a "signals" array. Each signal should include:
  1. "title" - A clear title for the signal
  2. "observation" - Detailed description of what was observed
  3. "priority" - Assigned priority (Critical, High, Medium, Low)
  4. "siteId" - If site-specific, provide the site ID or null if it affects multiple sites
  5. "recommendation" - Suggested next steps or action items
  
  Example response:
  {
    "signals": [
      {
        "title": "Elevated Liver Enzyme Pattern",
        "observation": "5 patients at Site 123 showing ALT values >3x ULN within 7 days of dosing",
        "priority": "High",
        "siteId": "Site 123",
        "recommendation": "Investigate dosing procedures at Site 123 and review patient profiles"
      }
    ]
  }
  `;
}

/**
 * Analyze data consistency across multiple sources using Grok
 * @param trialInfo Object containing trial details
 * @param sources Array of data source names
 * @returns Analysis results with detected inconsistencies
 */
export async function analyzeDataConsistencyWithGrok(
  trialInfo: any, 
  sources: string[]
): Promise<any[]> {
  try {
    // Create prompt for cross-source analysis
    const prompt = createConsistencyAnalysisPrompt(trialInfo, sources);
    
    // Call the Grok model
    const response = await openai.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: "You are a data quality expert specializing in clinical trial data integrity. Analyze potential inconsistencies across multiple data sources and identify quality issues."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });
    
    // Parse the response safely
    const contentRaw = response.choices[0]?.message?.content;
    const content = contentRaw ? contentRaw : '{}';
    
    const result = JSON.parse(content);
    
    if (Array.isArray(result.inconsistencies)) {
      return result.inconsistencies;
    } else if (result.inconsistencies) {
      console.warn("Unexpected inconsistencies format, converting to array");
      return [result.inconsistencies];
    }
    
    console.warn("No inconsistencies found in response");
    return [];
    
  } catch (error) {
    console.error("Error in Grok data consistency analysis:", error);
    throw new Error(`Grok analysis failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Create a prompt for data consistency analysis
 */
function createConsistencyAnalysisPrompt(trialInfo: any, sources: string[]): string {
  // Trial context
  const trialContext = `
  Trial: ${trialInfo.title} (Protocol ID: ${trialInfo.protocolId})
  Phase: ${trialInfo.phase}
  Status: ${trialInfo.status}
  `;
  
  // Source combinations
  const sourceCombinations = [];
  
  for (let i = 0; i < sources.length; i++) {
    for (let j = i + 1; j < sources.length; j++) {
      sourceCombinations.push(`${sources[i]} vs ${sources[j]}`);
    }
  }
  
  // Prompt
  return `
  DATA CONSISTENCY ANALYSIS
  
  ${trialContext}
  
  TASK: Analyze potential data consistency issues across these data sources:
  ${sources.join(", ")}
  
  Consider these source combinations:
  ${sourceCombinations.join("\n")}
  
  Based on common clinical trial data issues, identify potential inconsistencies that might occur
  with these data source combinations. For each potential issue:
  
  1. Identify what type of inconsistency might occur
  2. Explain how it would manifest
  3. Assess its impact on data quality
  4. Recommend mitigation steps
  
  RESPONSE FORMAT:
  Return a JSON object with an "inconsistencies" array. Each inconsistency should include:
  1. "title" - A clear title for the inconsistency
  2. "observation" - Description of the potential issue
  3. "priority" - Assigned priority (Critical, High, Medium, Low)
  4. "siteId" - Site ID if site-specific, or null if it affects multiple sites
  5. "recommendation" - Suggested remediation steps
  
  Example response:
  {
    "inconsistencies": [
      {
        "title": "Visit Date Discrepancies",
        "observation": "Visit dates recorded in CTMS differ from those in EDC for multiple patients",
        "priority": "High",
        "siteId": null,
        "recommendation": "Implement data reconciliation process between CTMS and EDC systems"
      }
    ]
  }
  `;
}