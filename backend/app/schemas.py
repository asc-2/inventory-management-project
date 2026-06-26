from pydantic import BaseModel, Field  # type: ignore
from typing import Literal

from datetime import datetime  # type: ignore

class ItemDetails(BaseModel):
    name: str = Field(..., min_length=1)
    price: float = Field(..., ge=0)
    category: str = Field(..., min_length=1)
    supplier: str = Field(..., min_length=1)


class ItemBase(ItemDetails):
    quantity: int = Field(..., ge=0)


class ItemCreate(ItemBase):
    pass


class ItemUpdate(ItemDetails):
    pass

class ItemResponse(ItemBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


TransactionType = Literal["initial", "stock_in", "stock_out", "adjustment"]


class InventoryTransactionBase(BaseModel):
    change_type: TransactionType
    note: str | None = None


class InventoryTransactionCreate(InventoryTransactionBase):
    quantity_delta: int


class InventoryTransactionResponse(InventoryTransactionBase):
    id: int
    item_id: int
    quantity_delta: int
    previous_quantity: int
    new_quantity: int
    created_at: datetime

    class Config:
        from_attributes = True
