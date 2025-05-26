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
└── requirements.txt        # Python dependencies
```

## Getting Started

### Backend Setup

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

### Frontend Setup

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

## Building for Production

1. Build the frontend
   ```
   cd frontend
   npm run build
   ```

2. Copy the build files to the static directory
   ```
   cp -r build/* ../static/
   ```

3. Run the backend server
   ```
   uvicorn app.main:app
   ```
# Live Application Link : https://pdf-collaboration-system.onrender.com

## API Documentation

FastAPI automatically generates interactive API documentation. When running the combined application (serving both frontend and backend):

- Swagger UI: [https://pdf-collaboration-system.onrender.com](https://pdf-collaboration-system.onrender.com)/docs
- ReDoc: [https://pdf-collaboration-system.onrender.com](https://pdf-collaboration-system.onrender.com)/redoc

> **Note:** The application is now configured to allow direct access to these documentation endpoints even when serving the frontend application.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
