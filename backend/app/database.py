# this file sets up the database connection and shared session helper.
# it keeps the sqlite path and session creation logic in one place.
from pathlib import Path

from sqlalchemy import create_engine  # type: ignore[import]
from sqlalchemy.orm import sessionmaker  # type: ignore[import]

# this points to the backend folder so the database file stays in one fixed place.
BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_URL = f"sqlite:///{BASE_DIR / 'inventory.db'}"

# this creates the main sqlalchemy engine for sqlite.
engine = create_engine(
    DATABASE_URL,   
    connect_args={"check_same_thread": False}
)

# this creates new database sessions when the app needs them.
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def get_db():
    # this opens a database session for one request.
    db = SessionLocal()
    try:
        # this gives the session to the route that asked for it.
        yield db
    finally:
        # this always closes the session when the request is done.
        db.close()
