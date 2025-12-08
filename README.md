# FairPact

FairPact is a web application designed to analyze contracts and identify prohibited clauses using OCR and NLP.

## Project Structure
- `frontend/`: Next.js application (React, TailwindCSS)
- `backend/`: FastAPI application (Python)
- `docs/`: Documentation (Implementation Plan, Visual Concepts)

## Setup Instructions

### Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment (if not already done):
   ```bash
   python3 -m venv venv
   ```
   *Note: If you encounter an error about `ensurepip`, you may need to install `python3-venv` on your system.*
3. Activate the virtual environment:
   ```bash
   source venv/bin/activate
   ```
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

## Documentation
- [Implementation Plan](docs/implementation_plan.md)
- [UI Mockup](docs/mockup.png)
