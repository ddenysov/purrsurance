#!/bin/bash

# Start BookVetClinic service locally without SAM
# This script loads environment variables from env.json and starts the server

echo "🚀 Starting BookVetClinic service locally..."
echo "======================================"

# Check if env.json exists
if [ ! -f env.json ]; then
    echo "⚠️  Warning: env.json not found. Creating from example..."
    cp env.json.example env.json
    echo "✅ Created env.json from example"
    echo ""
fi

# Extract environment variables from env.json and export them
# This uses jq to parse JSON, but falls back to node if jq is not available
if command -v jq &> /dev/null; then
    # Using jq
    echo "Loading environment variables from env.json using jq..."
    export $(jq -r '.BookVetClinicFunction | to_entries | .[] | "\(.key)=\(.value)"' env.json)
else
    # Fallback to node
    echo "Loading environment variables from env.json using node..."
    eval $(node -e "
        const config = require('./env.json');
        const vars = config.BookVetClinicFunction;
        for (const key in vars) {
            console.log('export ' + key + '=\"' + vars[key] + '\"');
        }
    ")
fi

# Set local development flag
export IS_LOCAL=true
export PORT=${PORT:-3004}

echo "✅ Environment variables loaded"
echo ""

# Start the server
echo "Starting server on port ${PORT}..."
echo ""
node app.mjs

