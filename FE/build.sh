#!/bin/bash

# Build script for eParking Frontend
echo "Building eParking Frontend..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build the project
echo "Building project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "Build successful! Build folder is ready for deployment."
    echo "Build folder location: ./build/"
    echo "You can now copy the build folder to your server."
else
    echo "Build failed!"
    exit 1
fi
