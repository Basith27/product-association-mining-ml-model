#!/bin/bash

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Run the service
echo "Starting ML service..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Deactivate virtual environment on exit
deactivate 