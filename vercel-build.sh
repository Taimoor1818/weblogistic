#!/bin/bash
# Install dependencies if not already installed
if ! command -v next &> /dev/null; then
  echo "Installing dependencies..."
  npm install
fi

echo "Building Next.js application..."
npm run build