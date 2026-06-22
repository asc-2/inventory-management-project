from sqlalchemy import Column, Integer, String, Float # type: ignore
from sqlalchemy.orm import declarative_base # type: ignore
from sqlalchemy import Column, Integer, String, Float, DateTime # type: ignore

from datetime import datetime # type: ignore

Base = declarative_base()


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    quantity = Column(Integer)
    price = Column(Float)
    category = Column(String)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )