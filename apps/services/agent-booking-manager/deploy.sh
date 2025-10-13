#!/bin/bash

# Deploy script for AgentBookingManager
# This script reads the instruction from instruction.txt and passes it as a parameter

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🚀 Deploying Agent Booking Manager..."
echo ""

# Check if instruction.txt exists
if [ ! -f "instruction.txt" ]; then
    echo "❌ Error: instruction.txt not found!"
    exit 1
fi

# Read instruction from file
INSTRUCTION_CONTENT=$(cat instruction.txt)
INSTRUCTION_LENGTH=${#INSTRUCTION_CONTENT}

echo "📝 Instruction file loaded (${INSTRUCTION_LENGTH} characters)"
echo ""

echo "📦 Deploying to AWS..."

# Deploy with default parameters (instruction will be updated later via AWS CLI)
sam deploy \
  --no-confirm-changeset \
  --parameter-overrides \
    Environment=prod

echo ""
echo "✅ CloudFormation deployment complete!"
echo ""

echo ""
echo "🎉 Full deployment complete!"
echo ""
echo "📊 To view stack outputs:"
echo "   make status"
echo ""
echo "💡 To update only the instruction (fast):"
echo "   make update-instruction"

