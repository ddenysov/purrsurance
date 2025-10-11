#!/bin/bash
# Test the Lambda function locally

sam local invoke RecommendDoctorVisitFunction \
  -e events/bedrock-agent-event.json \
  --env-vars env.json

