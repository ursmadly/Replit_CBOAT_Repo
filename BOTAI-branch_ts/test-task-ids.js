
async function testTaskUpdateWithIds() {
  // We want to create or detect a discrepancy in LB data
  // This should create tasks with IDs that are stored in agent details
  try {
    const response = await fetch("http://localhost:3000/api/domain-data/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        trialId: 1,
        domain: "LB",
        source: "Central Laboratory"
      })
    });
    
    const result = await response.json();
    console.log("Analysis result:", result);
    
    // Wait a bit and then check agent status
    setTimeout(async () => {
      const agentResponse = await fetch("http://localhost:3000/api/agent-status");
      const agents = await agentResponse.json();
      const taskManager = agents.find(a => a.agentType === "TaskManager");
      console.log("Task manager agent status:", JSON.stringify(taskManager, null, 2));
    }, 3000);
    
  } catch (error) {
    console.error("Error testing task update with IDs:", error);
  }
}

testTaskUpdateWithIds();

