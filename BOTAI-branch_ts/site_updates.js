// Script to add dbLockStatus and outstandingLockIssues to all sites
const fs = require('fs');
const path = require('path');

const filePath = 'client/src/components/ai-assistants/CentralMonitorBot.tsx';
const content = fs.readFileSync(filePath, 'utf8');

// Regular expression to find all site objects in the file
const siteRegex = /{\s+siteId:\s+\d+,\s+siteName:\s+"[^"]+",\s+status:\s+'[^']+',\s+subjectCount:\s+\d+,\s+performanceScore:\s+\d+,\s+riskLevel:\s+'[^']+',\s+openQueries:\s+\d+,\s+openTasks:\s+\d+,\s+lastMonitored:\s+new Date\([^)]+\)(?!,\s+dbLockStatus)/g;

// Replace each site object to add dbLockStatus and outstandingLockIssues
const updatedContent = content.replace(siteRegex, (match) => {
  const statuses = ['pending', 'in_progress', 'ready', 'complete'];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  const randomIssues = Math.floor(Math.random() * 10);
  
  return `${match},
        dbLockStatus: '${randomStatus}',
        outstandingLockIssues: ${randomIssues}`;
});

fs.writeFileSync(filePath, updatedContent);
console.log('Updated all sites with dbLockStatus and outstandingLockIssues');
