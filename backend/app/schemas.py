from pydantic import BaseModel, Field  # type: ignore

from datetime import datetime  # type: ignore

class ItemBase(BaseModel):
    name: str = Field(..., min_length=1)
    quantity: int = Field(..., ge=0)
    price: float = Field(..., ge=0)
    category: str = Field(..., min_length=1)
    supplier: str = Field(..., min_length=1)

class ItemCreate(ItemBase):
    pass

class ItemResponse(ItemBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
