#!/bin/bash

# Script to trigger domain data validation API

echo "Triggering domain data validation..."

# Call the API to validate domain data for trial 3, LB domain, EDC source
curl -X POST https://${REPL_SLUG}.${REPL_OWNER}.repl.co/api/domain-data/analyze \
  -H "Content-Type: application/json" \
  -d '{"trialId": 3, "domain": "LB", "source": "EDC"}' \
  -w "\n"

echo "Check the Tasks page to see if new tasks were created"