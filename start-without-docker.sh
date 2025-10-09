#!/bin/bash

echo "========================================"
echo "   eParking - Start without Docker"
echo "========================================"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if PostgreSQL is running
echo "Checking PostgreSQL connection..."
if ! psql -h localhost -U eparking_user -d eParking_db -c "SELECT 1;" &> /dev/null; then
    echo "WARNING: Cannot connect to PostgreSQL!"
    echo "Please ensure PostgreSQL is running and database is set up."
    echo "Run the setup commands in NON_DOCKER_SETUP.md first."
    echo
fi

# Function to cleanup on exit
cleanup() {
    echo "Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

echo "Starting Backend..."
cd BE
npm run dev &
BACKEND_PID=$!
cd ..

sleep 5

echo "Starting Frontend..."
cd FE
npm start &
FRONTEND_PID=$!
cd ..

echo
echo "========================================"
echo "Services starting..."
echo "Backend:  http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo "Prisma Studio: npx prisma studio (in BE folder)"
echo "========================================"
echo
echo "Press Ctrl+C to stop all services..."

# Wait for processes
wait
