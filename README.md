# Attendance

Face recognition attendance system with React frontend and FastAPI backend.

## Setup

**Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

Backend runs on http://localhost:8000, frontend on http://localhost:5173.
