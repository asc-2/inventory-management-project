from fastapi import FastAPI  # type: ignore[import]

from app.database import engine # type: ignore[import]
from app.models import Base # type: ignore[import]
from app.routers import items

from fastapi.middleware.cors import CORSMiddleware # type: ignore[import]

Base.metadata.create_all(bind=engine)

app = FastAPI()

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

app.include_router(items.router)

@app.get("/")
def read_root():
    return {"message": "Inventory API is running"}
