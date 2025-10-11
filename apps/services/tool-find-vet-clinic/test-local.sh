#!/bin/bash
# Test the Lambda function locally

sam local invoke FindVetClinicFunction \
  -e events/bedrock-agent-event.json \
  --env-vars env.json

