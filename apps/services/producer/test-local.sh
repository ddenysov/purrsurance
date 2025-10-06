#!/bin/bash

# Test script for Event Producer Lambda
# Tests the function locally using SAM CLI

set -e

echo "==================================="
echo "Testing Event Producer Lambda"
echo "==================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Policy Update Event
echo -e "${BLUE}Test 1: Publishing Policy Update Event${NC}"
sam local invoke EventProducerFunction \
  --event events/test.json \
  --env-vars env.json \
  --template ../../template.yaml

echo ""
echo -e "${GREEN}✓ Test 1 completed${NC}"
echo ""

# Test 2: Claim Submitted Event
echo -e "${BLUE}Test 2: Publishing Claim Submitted Event${NC}"
sam local invoke EventProducerFunction \
  --event events/test-claim.json \
  --env-vars env.json \
  --template ../../template.yaml

echo ""
echo -e "${GREEN}✓ Test 2 completed${NC}"
echo ""

echo -e "${GREEN}==================================="
echo "All tests completed!"
echo "===================================${NC}"

