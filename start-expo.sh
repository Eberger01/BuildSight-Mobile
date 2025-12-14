#!/bin/bash
# Diagnostic script to start Expo and capture output

cd "$(dirname "$0")"

echo "=== Starting Expo Diagnostic ==="
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Working directory: $(pwd)"
echo ""

# Kill any existing Expo processes
echo "Cleaning up existing processes..."
pkill -f "expo.*start" 2>/dev/null
sleep 2

# Check if port is free
if lsof -ti:8081 > /dev/null 2>&1; then
    echo "WARNING: Port 8081 is already in use!"
    lsof -ti:8081 | xargs kill -9 2>/dev/null
    sleep 1
fi

echo "Starting Expo..."
echo ""

# Run Expo with explicit output
npx expo start 2>&1

