from fastapi import FastAPI

app = FastAPI(title="FairPact API")

@app.get("/")
def read_root():
    return {"message": "Welcome to FairPact API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
