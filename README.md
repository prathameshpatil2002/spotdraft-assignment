# PDF Management & Collaboration System

A collaborative PDF management application built with FastAPI and React. This application allows users to upload, manage, and collaborate on PDF documents.

## Features

- User authentication and authorization
- PDF document upload and management
- Comment system for collaboration
- User profiles
- Topic organization
- Document sharing
- Search functionality

## Tech Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **SQLAlchemy**: SQL toolkit and ORM
- **Pydantic**: Data validation and settings management
- **PostgreSQL**: Primary database
- **JWT Authentication**: For secure user authentication
- **Python 3.8+**: Core programming language

### Frontend
- **React 19**: UI library
- **TypeScript**: For type-safe code
- **Material UI**: Component library for modern UI design
- **React Router**: For navigation and routing
- **React-PDF**: For PDF rendering and manipulation
- **Axios**: For API communication
- **React-Toastify**: For notifications
- **Zod**: For runtime type validation

### DevOps
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration

## Project Structure

```
/
├── app/                    # Backend FastAPI application
│   ├── auth/               # Authentication functionality
│   ├── database/           # Database configuration
│   ├── models/             # SQLAlchemy models
│   ├── routers/            # API route definitions
│   ├── schemas/            # Pydantic schemas
│   └── main.py             # FastAPI application entry point
├── frontend/               # React frontend application
│   ├── public/             # Public assets
│   ├── src/                # Source code
│   ├── package.json        # NPM dependencies
│   └── tsconfig.json       # TypeScript configuration
├── static/                 # Static files (built frontend)
├── Dockerfile              # Docker image definition
├── docker-compose.yml      # Docker Compose configuration
└── requirements.txt        # Python dependencies
```

## Getting Started

### Option 1: Docker Deployment (Recommended)

The easiest way to run the application is using Docker and Docker Compose.

1. Make sure you have [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed

2. Clone the repository
   ```
   git clone <repository-url>
   cd spotdraft-assignment
   ```

3. Start the application
   ```
   docker-compose up -d
   ```

4. Access the application at http://localhost:8000

### Option 2: Manual Setup

#### Backend Setup

1. Clone the repository
   ```
   git clone <repository-url>
   cd spotdraft-assignment
   ```

2. Create a virtual environment
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies
   ```
   pip install -r requirements.txt
   ```

4. Run the backend server
   ```
   uvicorn app.main:app --reload
   ```

#### Frontend Setup

1. Navigate to the frontend directory
   ```
   cd frontend
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Run the development server
   ```
   npm start
   ```

## Docker Configuration

### Dockerfile

Our multi-stage Dockerfile:
- First stage: Builds the React frontend application
- Second stage: Sets up the Python environment and combines frontend and backend

```dockerfile
# Stage 1: Build the frontend
FROM node:20-alpine AS frontend-build
# ... frontend build process ...

# Stage 2: Set up the Python environment
FROM python:3.11-slim
# ... backend setup and configuration ...
```

### Docker Compose

The `docker-compose.yml` file configures:
- Web service running our application
- PostgreSQL database service
- Volumes for persistent data storage
- Network connections between services
- Environment variables

### Environment Variables

When deploying with Docker, you can configure the application using these environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@db:5432/pdf_app` |
| `SECRET_KEY` | Secret key for JWT token generation | `your_secret_key_here` (change in production!) |
| `ALGORITHM` | Algorithm used for JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration time in minutes | `30` |

### Development with Docker

For development using Docker:

1. Start the database only:
   ```
   docker-compose up db -d
   ```

2. Run frontend and backend locally with hot-reloading:
   ```
   # Terminal 1
   cd frontend
   npm start
   
   # Terminal 2
   uvicorn app.main:app --reload
   ```

3. Set your local `DATABASE_URL` to:
   ```
   postgresql://postgres:postgres@localhost:5432/pdf_app
   ```

### Docker Troubleshooting

- **Database connection issues**: Ensure the database service is running with `docker-compose ps`
- **Frontend not loading**: Check if the frontend build was successful during Docker build
- **File permissions**: If you're on Linux, you might need to adjust permissions for the mounted volumes
- **Port conflicts**: If port 8000 or 5432 is already in use, change them in the `docker-compose.yml` file

## Building for Production

For a manual production build:

1. Build the frontend
   ```
   cd frontend
   npm run build
   ```

2. Copy the build files to the static directory
   ```
   mkdir -p ../static/static
   cp -r build/* ../static/
   ```

3. Run the backend server
   ```
   uvicorn app.main:app --host 0.0.0.0
   ```

# Live Application Link

https://pdf-collaboration-system.onrender.com

## API Documentation

FastAPI automatically generates interactive API documentation. When running the combined application (serving both frontend and backend):

- Swagger UI: [https://pdf-collaboration-system.onrender.com/docs](https://pdf-collaboration-system.onrender.com/docs)
- ReDoc: [https://pdf-collaboration-system.onrender.com/redoc](https://pdf-collaboration-system.onrender.com/redoc)

