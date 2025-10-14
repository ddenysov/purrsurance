#!/bin/bash

# Test the Backend API locally using sam local start-api

echo "Starting local API Gateway..."
echo "Endpoint will be available at: http://localhost:3000/vet-appointments"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

sam local start-api --env-vars env.json

