from fastapi import FastAPI, APIRouter, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .database.database import engine
from .models.models import Base
from .routers import auth, feeds, comments, topics, users, shares
import os

# Create the database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="PDF Management & Collaboration System API",
    description="PDF Management & Collaboration System API",
    version="1.0.0",
    openapi_version="3.0.2",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create API router with prefix
api_router = APIRouter(prefix="/api")

# Include API routers
api_router.include_router(auth.router)
api_router.include_router(feeds.router)
api_router.include_router(comments.router)
api_router.include_router(topics.router)
api_router.include_router(users.router)
api_router.include_router(shares.router)

@api_router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

# Include API router
app.include_router(api_router)

# Mount static files
app.mount("/static", StaticFiles(directory="static/static"), name="static")

# Custom middleware to handle routing
@app.middleware("http")
async def custom_middleware(request: Request, call_next):
    path = request.url.path
    # If it's an API request, let it pass through
    if path.startswith("/api/") or path.startswith("/docs") or path.startswith("/redoc") or path.startswith("/openapi.json"):
        response = await call_next(request)
        return response
    
    # For all other paths, serve the frontend
    if path == "/" or not path.startswith("/static/"):
        return FileResponse("static/index.html")
    
    # Let other requests pass through (like static files)
    response = await call_next(request)
    return response

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", reload=True) 
