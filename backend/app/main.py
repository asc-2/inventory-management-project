from fastapi import FastAPI  # type: ignore[import]
from fastapi.middleware.cors import CORSMiddleware # type: ignore[import]

from app.database import engine # type: ignore[import]
from app.models import Base # type: ignore[import]
from app.routers import items


Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(items.router)

@app.get("/")
def read_root():
    return {"message": "Inventory API is running"}