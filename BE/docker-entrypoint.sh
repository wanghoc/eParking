#!/bin/sh

# Wait for database to be ready
echo "Waiting for database to be ready..."
until nc -z postgres 5432; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is ready - continuing"

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "Running database migrations..."
npx prisma db push

# Seed database with demo data
echo "Seeding database with demo data..."
npx prisma db seed

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Check if ML is enabled
if [ "$USE_ML" = "true" ]; then
    echo ""
    echo "========================================="
    echo "🚀 Starting WebSocket Detector Service"
    echo "========================================="
    echo "Port: 5001"
    echo "Protocol: WebSocket + HTTP"
    echo "Model: YOLO OBB + CNN-LSTM PlateRecognizer (PERSISTENT)"
    echo ""
    
    # Start WebSocket detector in background
    python3 ml_models/utils/websocket_detector.py &
    WS_PID=$!
    echo "✅ WebSocket Detector started (PID: $WS_PID)"
    
    # Wait a bit for WebSocket server to be ready
    sleep 3
else
    echo "⚠️ ML detection disabled (USE_ML=false)"
fi

# Start the application (Express server) in foreground
echo ""
echo "========================================="
echo "🚀 Starting Express API Server"
echo "========================================="
echo "Port: 5000"
echo ""

exec "$@"
