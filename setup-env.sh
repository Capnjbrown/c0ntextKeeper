#!/bin/bash

# c0ntextKeeper Environment Setup Script
# This script loads environment variables from .env file for MCP servers

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found in current directory"
    echo "Please create a .env file from .env.example first"
    exit 1
fi

# Load environment variables from .env file
echo "Loading environment variables from .env..."
set -o allexport
source .env
set +o allexport

# Verify critical environment variables
if [ -z "$GITHUB_TOKEN" ]; then
    echo "Warning: GITHUB_TOKEN is not set in .env file"
    echo "The github-mcp server will not work without it"
else
    echo "✓ GITHUB_TOKEN loaded successfully"
fi

# Start Claude Code with environment variables loaded
echo ""
echo "Environment variables loaded. Starting Claude Code..."
echo "You can now use MCP servers with proper authentication."
echo ""

# Start Claude Code CLI
claude "$@"