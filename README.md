# FairPact

FairPact is a web application designed to analyze contracts and identify prohibited clauses using OCR and NLP.

## Project Structure

- `frontend/`: Next.js application (React, TailwindCSS)
- `backend/`: FastAPI application (Python)
- `docs/`: Documentation (Implementation Plan, Visual Concepts)

## Setup Instructions

### Quick Start (Recommended)

For automatic setup on a new machine, use the provided automation scripts:

1. **Install system dependencies** (requires sudo):

   ```bash
   ./install-dependencies.sh
   ```

   This will install Podman, Python, Node.js, and all required development libraries.

2. **Start the application**:

   ```bash
   ./start-app.sh
   ```

   This script will:

   - Check for required packages
   - Create and activate Python virtual environment
   - Install Python and npm dependencies
   - Start all containers (PostgreSQL, Redis, MinIO, Celery workers)

3. **Run Backend API** (in a separate terminal):

   ```bash
   cd backend
   source venv/bin/activate
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

4. **Run Frontend** (in another terminal):

   ```bash
   cd frontend
   npm run dev
   ```

The application will be available at:

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:8000>
- API Documentation: <http://localhost:8000/docs>


### Manual Setup

If you prefer manual setup or the automation scripts don't work on your system:

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
