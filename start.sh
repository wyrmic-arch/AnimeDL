#!/bin/bash
# Start Anime Downloader
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Starting backend..."
setsid python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &
echo "  PID: $!"

echo "Starting frontend..."
setsid npx vite --host 0.0.0.0 --port 5173 > /tmp/frontend.log 2>&1 &
echo "  PID: $!"

sleep 2
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:8000"
echo "API docs: http://localhost:8000/docs"
echo ""
echo "Logs:"
echo "  Backend:  cat /tmp/backend.log"
echo "  Frontend: cat /tmp/frontend.log"
