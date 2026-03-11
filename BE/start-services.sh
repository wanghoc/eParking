#!/bin/bash
# Start WebSocket Detector alongside Backend Server
# Chạy PERSISTENT detector với YOLO + CNN-LSTM PlateRecognizer loaded 1 lần

set -e

echo "========================================="
echo "🚀 Starting eParking Backend Services"
echo "========================================="

# Check if running in Docker
if [ -f /.dockerenv ]; then
    echo "📦 Running in Docker container"
    echo ""
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Change to backend directory
cd /app || cd BE

echo ""
echo "[1/3] 🔧 Installing Python ML dependencies..."
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null || true

pip install -q --no-cache-dir -r requirements_ml.txt
echo "✅ Python dependencies installed"

echo ""
echo "[2/3] 🚀 Starting WebSocket Detector Server..."
echo "    - Port: 5555"
echo "    - Protocol: WebSocket + HTTP"
echo "    - Model: YOLO OBB + CNN-LSTM PlateRecognizer"
echo ""

# Start WebSocket detector in background
cd ml_models/utils
python websocket_detector.py &
WS_PID=$!
echo "✅ WebSocket Detector started (PID: $WS_PID)"

# Wait for WebSocket server to be ready
sleep 5

echo ""
echo "[3/3] 🚀 Starting Express API Server..."
echo "    - Port: 3001"
echo "    - API: REST + Prisma"
echo ""

# Go back to app directory
cd /app || cd ../..

# Start Express server in foreground
npm run dev

# This line should never be reached, but just in case
wait
