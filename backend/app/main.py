# this file creates the fastapi app and connects the main app pieces.
# it also sets up cors and creates tables on startup for local development.
from fastapi import FastAPI  # type: ignore[import]

from app.database import engine # type: ignore[import]
from app.models import Base # type: ignore[import]
from app.routers import items
from fastapi.middleware.cors import CORSMiddleware # type: ignore[import]

# this creates any missing tables from the current models.
Base.metadata.create_all(bind=engine)

# this is the main fastapi application object.
app = FastAPI()

# this lets the vite frontend call the backend during local development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# this attaches the item routes to the app.
app.include_router(items.router)

@app.get("/")
def read_root():
    # this is a simple health check route.
    return {"message": "Inventory API is running"}
