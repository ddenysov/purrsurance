#!/bin/bash

# Script to list AWS Bedrock agents and update configuration
# This allows you to easily sync agent IDs after creating or recreating agents

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/env.json"
SAMCONFIG_FILE="$SCRIPT_DIR/samconfig.toml"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   AWS Bedrock Agents Configuration Sync   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Please install AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is not installed${NC}"
    echo "Please install jq: brew install jq"
    exit 1
fi

# Function to list all agents
list_agents() {
    echo -e "${YELLOW}Fetching AWS Bedrock agents...${NC}"
    echo ""
    
    AGENTS=$(aws bedrock-agent list-agents --query 'agentSummaries[*].[agentName,agentId,agentStatus]' --output json)
    
    if [ "$(echo "$AGENTS" | jq length)" -eq 0 ]; then
        echo -e "${RED}No agents found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Available Agents:${NC}"
    echo "─────────────────────────────────────────────────────────"
    
    INDEX=1
    echo "$AGENTS" | jq -r '.[] | @tsv' | while IFS=$'\t' read -r name id status; do
        printf "%2d. %-40s %s [%s]\n" "$INDEX" "$name" "$id" "$status"
        INDEX=$((INDEX + 1))
    done
    
    echo "─────────────────────────────────────────────────────────"
    echo ""
}

# Function to get agent aliases
get_agent_aliases() {
    local AGENT_ID=$1
    local AGENT_NAME=$2
    
    # Output informational messages to stderr so they don't get captured
    echo -e "${YELLOW}Fetching aliases for $AGENT_NAME...${NC}" >&2
    
    ALIASES=$(aws bedrock-agent list-agent-aliases --agent-id "$AGENT_ID" --query 'agentAliasSummaries[?agentAliasStatus==`PREPARED`] | sort_by(@, &updatedAt) | reverse(@)' --output json)
    
    if [ "$(echo "$ALIASES" | jq length)" -eq 0 ]; then
        echo -e "${RED}  No aliases found for this agent${NC}" >&2
        return 1
    fi
    
    echo -e "${GREEN}  Available Aliases (sorted by latest):${NC}" >&2
    echo "$ALIASES" | jq -r '.[] | "  - \(.agentAliasName): \(.agentAliasId) [updated: \(.updatedAt)]"' >&2
    echo "" >&2
    
    # Get the latest (first in reversed sorted list) PREPARED alias
    ALIAS_ID=$(echo "$ALIASES" | jq -r '.[0].agentAliasId')
    ALIAS_NAME=$(echo "$ALIASES" | jq -r '.[0].agentAliasName')
    
    echo -e "${GREEN}  Selected latest alias: ${ALIAS_NAME} (${ALIAS_ID})${NC}" >&2
    echo "" >&2
    
    echo "$ALIAS_ID"
}

# Function to update env.json
update_env_json() {
    local INTENTION_AGENT_ID=$1
    local INTENTION_ALIAS_ID=$2
    local POLICY_AGENT_ID=$3
    local POLICY_ALIAS_ID=$4
    local VETDOC_AGENT_ID=$5
    local VETDOC_ALIAS_ID=$6
    
    echo -e "${YELLOW}Updating $ENV_FILE...${NC}"
    
    if [ ! -f "$ENV_FILE" ]; then
        echo -e "${RED}Error: $ENV_FILE not found${NC}"
        exit 1
    fi
    
    # Update env.json using jq
    jq --arg iaid "$INTENTION_AGENT_ID" \
       --arg ialias "$INTENTION_ALIAS_ID" \
       --arg paid "$POLICY_AGENT_ID" \
       --arg palias "$POLICY_ALIAS_ID" \
       --arg vaid "$VETDOC_AGENT_ID" \
       --arg valias "$VETDOC_ALIAS_ID" \
       '.ServiceRouterFunction.INTENTION_CLASSIFIER_AGENT_ID = $iaid |
        .ServiceRouterFunction.INTENTION_CLASSIFIER_AGENT_ALIAS_ID = $ialias |
        .ServiceRouterFunction.POLICY_MANAGER_AGENT_ID = $paid |
        .ServiceRouterFunction.POLICY_MANAGER_AGENT_ALIAS_ID = $palias |
        .ServiceRouterFunction.VETDOC_AGENT_ID = $vaid |
        .ServiceRouterFunction.VETDOC_AGENT_ALIAS_ID = $valias |
        .ServiceRouterFunction.BEDROCK_AGENT_ID = $iaid |
        .ServiceRouterFunction.BEDROCK_AGENT_ALIAS_ID = $ialias' \
       "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
    
    echo -e "${GREEN}✓ Updated $ENV_FILE${NC}"
}

# Function to update samconfig.toml
update_samconfig() {
    local INTENTION_AGENT_ID=$1
    local INTENTION_ALIAS_ID=$2
    local POLICY_AGENT_ID=$3
    local POLICY_ALIAS_ID=$4
    local VETDOC_AGENT_ID=$5
    local VETDOC_ALIAS_ID=$6
    
    echo -e "${YELLOW}Updating $SAMCONFIG_FILE...${NC}"
    
    if [ ! -f "$SAMCONFIG_FILE" ]; then
        echo -e "${YELLOW}Warning: $SAMCONFIG_FILE not found, skipping${NC}"
        return
    fi
    
    # Read current values from samconfig.toml
    local CURRENT_LINE=$(grep "^parameter_overrides" "$SAMCONFIG_FILE")
    
    # Extract other parameters that we want to keep
    local ENVIRONMENT=$(echo "$CURRENT_LINE" | grep -o 'Environment="[^"]*"' | cut -d'"' -f2)
    local CHAT_TABLE=$(echo "$CURRENT_LINE" | grep -o 'ChatHistoryTableName="[^"]*"' | cut -d'"' -f2)
    local LOG_LEVEL=$(echo "$CURRENT_LINE" | grep -o 'LogLevel="[^"]*"' | cut -d'"' -f2)
    
    # Set defaults if extraction failed
    ENVIRONMENT=${ENVIRONMENT:-prod}
    CHAT_TABLE=${CHAT_TABLE:-agent-operator-prod-ChatHistory}
    LOG_LEVEL=${LOG_LEVEL:-info}
    
    # Build new parameter_overrides line using printf to avoid newline issues
    local NEW_LINE=$(printf 'parameter_overrides = "Environment=\\"%s\\" IntentionClassifierAgentId=\\"%s\\" IntentionClassifierAgentAliasId=\\"%s\\" PolicyManagerAgentId=\\"%s\\" PolicyManagerAgentAliasId=\\"%s\\" VetDocAgentId=\\"%s\\" VetDocAgentAliasId=\\"%s\\" ChatHistoryTableName=\\"%s\\" LogLevel=\\"%s\\""' \
        "$ENVIRONMENT" "$INTENTION_AGENT_ID" "$INTENTION_ALIAS_ID" "$POLICY_AGENT_ID" "$POLICY_ALIAS_ID" "$VETDOC_AGENT_ID" "$VETDOC_ALIAS_ID" "$CHAT_TABLE" "$LOG_LEVEL")
    
    # Create temporary file and replace the line
    while IFS= read -r line; do
        if [[ "$line" =~ ^parameter_overrides ]]; then
            echo "$NEW_LINE"
        else
            echo "$line"
        fi
    done < "$SAMCONFIG_FILE" > "$SAMCONFIG_FILE.tmp"
    
    mv "$SAMCONFIG_FILE.tmp" "$SAMCONFIG_FILE"
    echo -e "${GREEN}✓ Updated $SAMCONFIG_FILE${NC}"
}

# Main interactive flow
main() {
    list_agents
    
    AGENTS=$(aws bedrock-agent list-agents --query 'agentSummaries[*].[agentName,agentId]' --output json)
    
    # Find Intention Classifier agent
    echo -e "${BLUE}Step 1: Select Intention Classifier Agent${NC}"
    INTENTION_AGENT_ID=$(echo "$AGENTS" | jq -r '.[] | select(.[0] | contains("intention") or contains("classifier") or contains("Intention") or contains("Classifier")) | .[1]' | head -n 1)
    
    if [ -z "$INTENTION_AGENT_ID" ]; then
        echo "Enter Intention Classifier Agent ID (or press Enter to skip):"
        read -r INTENTION_AGENT_ID
    else
        INTENTION_AGENT_NAME=$(echo "$AGENTS" | jq -r ".[] | select(.[1] == \"$INTENTION_AGENT_ID\") | .[0]")
        echo -e "Auto-detected: ${GREEN}$INTENTION_AGENT_NAME${NC} ($INTENTION_AGENT_ID)"
        echo "Press Enter to confirm or enter a different Agent ID:"
        read -r USER_INPUT
        if [ -n "$USER_INPUT" ]; then
            INTENTION_AGENT_ID="$USER_INPUT"
        fi
    fi
    
    INTENTION_ALIAS_ID=""
    if [ -n "$INTENTION_AGENT_ID" ]; then
        INTENTION_ALIAS_ID=$(get_agent_aliases "$INTENTION_AGENT_ID" "Intention Classifier")
    fi
    
    echo ""
    
    # Find Policy Manager agent
    echo -e "${BLUE}Step 2: Select Policy Manager Agent${NC}"
    POLICY_AGENT_ID=$(echo "$AGENTS" | jq -r '.[] | select(.[0] | contains("policy") or contains("Policy")) | .[1]' | head -n 1)
    
    if [ -z "$POLICY_AGENT_ID" ]; then
        echo "Enter Policy Manager Agent ID (or press Enter to skip):"
        read -r POLICY_AGENT_ID
    else
        POLICY_AGENT_NAME=$(echo "$AGENTS" | jq -r ".[] | select(.[1] == \"$POLICY_AGENT_ID\") | .[0]")
        echo -e "Auto-detected: ${GREEN}$POLICY_AGENT_NAME${NC} ($POLICY_AGENT_ID)"
        echo "Press Enter to confirm or enter a different Agent ID:"
        read -r USER_INPUT
        if [ -n "$USER_INPUT" ]; then
            POLICY_AGENT_ID="$USER_INPUT"
        fi
    fi
    
    POLICY_ALIAS_ID=""
    if [ -n "$POLICY_AGENT_ID" ]; then
        POLICY_ALIAS_ID=$(get_agent_aliases "$POLICY_AGENT_ID" "Policy Manager")
    fi
    
    echo ""
    
    # Find VetDoc agent
    echo -e "${BLUE}Step 3: Select VetDoc Agent${NC}"
    VETDOC_AGENT_ID=$(echo "$AGENTS" | jq -r '.[] | select(.[0] | contains("vet") or contains("Vet") or contains("doctor") or contains("Doctor")) | .[1]' | head -n 1)
    
    if [ -z "$VETDOC_AGENT_ID" ]; then
        echo "Enter VetDoc Agent ID (or press Enter to skip):"
        read -r VETDOC_AGENT_ID
    else
        VETDOC_AGENT_NAME=$(echo "$AGENTS" | jq -r ".[] | select(.[1] == \"$VETDOC_AGENT_ID\") | .[0]")
        echo -e "Auto-detected: ${GREEN}$VETDOC_AGENT_NAME${NC} ($VETDOC_AGENT_ID)"
        echo "Press Enter to confirm or enter a different Agent ID:"
        read -r USER_INPUT
        if [ -n "$USER_INPUT" ]; then
            VETDOC_AGENT_ID="$USER_INPUT"
        fi
    fi
    
    VETDOC_ALIAS_ID=""
    if [ -n "$VETDOC_AGENT_ID" ]; then
        VETDOC_ALIAS_ID=$(get_agent_aliases "$VETDOC_AGENT_ID" "VetDoc")
    fi
    
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${GREEN}Configuration Summary:${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo "Intention Classifier Agent ID:    $INTENTION_AGENT_ID"
    echo "Intention Classifier Alias ID:    $INTENTION_ALIAS_ID"
    echo "Policy Manager Agent ID:          $POLICY_AGENT_ID"
    echo "Policy Manager Alias ID:          $POLICY_ALIAS_ID"
    echo "VetDoc Agent ID:                  $VETDOC_AGENT_ID"
    echo "VetDoc Alias ID:                  $VETDOC_ALIAS_ID"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo ""
    
    echo "Update configuration files? (y/n)"
    read -r CONFIRM
    
    if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
        update_env_json "$INTENTION_AGENT_ID" "$INTENTION_ALIAS_ID" "$POLICY_AGENT_ID" "$POLICY_ALIAS_ID" "$VETDOC_AGENT_ID" "$VETDOC_ALIAS_ID"
        update_samconfig "$INTENTION_AGENT_ID" "$INTENTION_ALIAS_ID" "$POLICY_AGENT_ID" "$POLICY_ALIAS_ID" "$VETDOC_AGENT_ID" "$VETDOC_ALIAS_ID"
        echo ""
        echo -e "${GREEN}✓ Configuration updated successfully!${NC}"
    else
        echo -e "${YELLOW}Configuration update cancelled${NC}"
    fi
}

# Run main function
main

