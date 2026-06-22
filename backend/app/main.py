from fastapi import FastAPI  # type: ignore[import]

from app.database import engine # type: ignore[import]
from app.models import Base # type: ignore[import]
from app.routers import items

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(items.router)

@app.get("/")
def read_root():
    return {"message": "Inventory API is running"}