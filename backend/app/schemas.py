# this file defines the request and response shapes for the api.
# it helps validate data coming in and format data going out.
from pydantic import BaseModel, Field  # type: ignore
from typing import Literal

from datetime import datetime  # type: ignore

class ItemDetails(BaseModel):
    # these are the shared fields used for item details.
    name: str = Field(..., min_length=1)
    price: float = Field(..., ge=0)
    category: str = Field(..., min_length=1)
    supplier: str = Field(..., min_length=1)


class ItemBase(ItemDetails):
    # this adds quantity for item payloads that need stock.
    quantity: int = Field(..., ge=0)


class ItemCreate(ItemBase):
    # this is used when creating a new item.
    pass


class ItemUpdate(ItemDetails):
    # this is used when updating item details without changing quantity.
    pass

class ItemResponse(ItemBase):
    # this is the item data returned by the api.
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# these are the allowed transaction types in the app.
TransactionType = Literal["initial", "stock_in", "stock_out", "adjustment"]


class InventoryTransactionBase(BaseModel):
    # these are the shared fields for transaction payloads.
    change_type: TransactionType
    note: str | None = None


class InventoryTransactionCreate(InventoryTransactionBase):
    # this adds the quantity change for new transactions.
    quantity_delta: int


class InventoryTransactionUpdate(BaseModel):
    # this is used to edit only the note on a transaction.
    note: str | None = None


class InventoryTransactionResponse(InventoryTransactionBase):
    # this is the transaction data returned by the api.
    id: int
    item_id: int
    quantity_delta: int
    previous_quantity: int
    new_quantity: int
    created_at: datetime

    class Config:
        from_attributes = True
