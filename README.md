# PDFCollab FastAPI

A collaborative PDF management application built with FastAPI. This application allows users to upload, manage, and collaborate on PDF documents.

## Features

- User authentication and authorization
- PDF document upload and management
- Document categorization by topics
- Comment system for collaboration
- User profiles
- Search functionality

## Tech Stack

- FastAPI: Modern, fast web framework for building APIs
- SQLAlchemy: SQL toolkit and ORM
- Pydantic: Data validation and settings management
- Jinja2: Template engine
- PostgreSQL/SQLite: Database

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/PDFCollab_FastAPI.git
cd PDFCollab_FastAPI
```

2. Create a virtual environment and activate it:
```bash
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the project root directory with the following variables:
```
DATABASE_URL=sqlite:///./app.db
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

5. Run the application:
```bash
uvicorn app.main:app --reload
```

6. Open your browser and navigate to http://127.0.0.1:8000

## API Documentation

FastAPI automatically generates interactive API documentation:
- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## License

This project is licensed under the MIT License - see the LICENSE file for details. 