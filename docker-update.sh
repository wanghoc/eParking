#!/bin/bash
# Script to update and rebuild Docker containers with latest code

echo "=========================================="
echo "eParking - Docker Update Script"
echo "=========================================="
echo ""

# Stop all containers
echo "🛑 Stopping all containers..."
docker-compose down

# Remove old images (optional - uncomment if you want to force rebuild)
# echo "🗑️  Removing old images..."
# docker-compose down --rmi all

# Rebuild containers
echo "🔨 Building containers with latest code..."
docker-compose build --no-cache

# Copy ML model to volume (first time setup)
echo "📦 Setting up ML models..."
if [ -f "BE/ml_models/plate_detector/best.pt" ]; then
    echo "✅ ML model found"
else
    echo "⚠️  ML model not found at BE/ml_models/plate_detector/best.pt"
    echo "   If you have the model, please copy it manually"
fi

# Start containers
echo "🚀 Starting containers..."
docker-compose up -d

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check status
echo ""
echo "📊 Container Status:"
docker-compose ps

# Show logs
echo ""
echo "📝 Recent logs:"
docker-compose logs --tail=20

echo ""
echo "=========================================="
echo "✅ Update Complete!"
echo "=========================================="
echo ""
echo "Services running at:"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:5000"
echo "  Prisma:    http://localhost:5555"
echo "  Adminer:   http://localhost:8080 (if enabled with --profile tools)"
echo ""
echo "Useful commands:"
echo "  View logs:     docker-compose logs -f"
echo "  Stop:          docker-compose down"
echo "  Restart:       docker-compose restart"
echo "  Shell access:  docker exec -it eparking_backend sh"
echo ""
