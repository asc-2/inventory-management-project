# this file defines the database tables used by the inventory app.
# it stores both current item data and transaction history records.
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String  # type: ignore
from sqlalchemy.orm import declarative_base, relationship  # type: ignore

from datetime import datetime  # type: ignore

# this is the shared base class for all sqlalchemy models.
Base = declarative_base()


class Item(Base):
    # this table stores the current snapshot for each inventory item.
    __tablename__ = "items"

    # these columns store the main item fields.
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    quantity = Column(Integer)
    price = Column(Float)
    category = Column(String)
    supplier = Column(String)

    # this links each item to its stock movement history.
    transactions = relationship(
        "InventoryTransaction",
        back_populates="item",
        cascade="all, delete-orphan"
    )

    # these timestamps help track when the item was created and changed.
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )


class InventoryTransaction(Base):
    # this table stores every quantity change for an item.
    __tablename__ = "inventory_transactions"

    # these columns store the stock movement details.
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False, index=True)
    change_type = Column(String, nullable=False)
    quantity_delta = Column(Integer, nullable=False)
    previous_quantity = Column(Integer, nullable=False)
    new_quantity = Column(Integer, nullable=False)
    note = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # this links the transaction back to its item.
    item = relationship("Item", back_populates="transactions")
