#!/bin/bash
# FaceSync — Start both frontend and backend

echo "═══════════════════════════════════════"
echo "  FaceSync — AI Attendance System"
echo "═══════════════════════════════════════"
echo ""

# Backend
echo "[1/2] Starting FastAPI backend on http://localhost:8000..."
cd backend
if [ ! -d "venv" ]; then
    echo "  Creating Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    echo "  Installing dependencies..."
    pip install -r requirements.txt
else
    source venv/bin/activate
fi
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# Frontend
echo "[2/2] Starting React frontend on http://localhost:5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "═══════════════════════════════════════"
echo "  Frontend:  http://localhost:5173"
echo "  Backend:   http://localhost:8000"
echo "  API Docs:  http://localhost:8000/docs"
echo "═══════════════════════════════════════"
echo ""
echo "Press Ctrl+C to stop both servers"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
