#!/bin/bash
# Startup script for SCEAP frontend and backend servers

echo "🚀 Starting SCEAP Servers..."
echo "================================"

# Kill any existing processes
echo "Cleaning up old processes..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "dotnet run" 2>/dev/null || true
sleep 2

# Start Frontend
echo "Starting Frontend (Vite on port 5173)..."
cd /workspaces/SCEAP2026_2/sceap-frontend
npm run dev 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait for frontend to start
sleep 8

# Start Backend
echo "Starting Backend (ASP.NET on port 5000)..."
cd /workspaces/SCEAP2026_2/sceap-backend
export ASPNETCORE_URLS="http://0.0.0.0:5000"
export ASPNETCORE_ENVIRONMENT="Production"
dotnet run 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 10

# Verify servers
echo ""
echo "✅ Server Status:"
echo "================================"
ps -p $FRONTEND_PID > /dev/null && echo "✅ Frontend (PID $FRONTEND_PID) RUNNING" || echo "❌ Frontend FAILED"
ps -p $BACKEND_PID > /dev/null && echo "✅ Backend (PID $BACKEND_PID) RUNNING" || echo "❌ Backend FAILED"

echo ""
echo "🌐 Access URLs:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:5000"
echo ""
echo "Servers are ready! Press Ctrl+C to stop."

# Keep script running
wait
