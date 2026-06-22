from fastapi import APIRouter, Depends, HTTPException, Response, status # type: ignore

from sqlalchemy.orm import Session # type: ignore

from app.database import get_db
from app import models, schemas

router = APIRouter()


@router.post("/items", response_model=schemas.ItemResponse)
def create_item(item: schemas.ItemCreate, db: Session = Depends(get_db)):
    new_item = models.Item(
        name=item.name,
        quantity=item.quantity,
        price=item.price,
        category=item.category,
    )

    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return new_item

@router.get("/items", response_model=list[schemas.ItemResponse])
def get_items(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    items = db.query(models.Item).offset(skip).limit(limit).all()
    return items

@router.get("/items/search", response_model=list[schemas.ItemResponse])
def search_items(
    name: str | None = None,
    category: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Item)

    if name:
        query = query.filter(models.Item.name.ilike(f"%{name}%"))

    if category:
        query = query.filter(models.Item.category.ilike(f"%{category}%"))

    return query.all()

@router.get("/items/{item_id}", response_model=schemas.ItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.Item).filter(models.Item.id == item_id).first()

    if item is None:
        raise HTTPException(
            status_code=404,
            detail="Item not found"
        )

    return item

@router.put("/items/{item_id}", response_model=schemas.ItemResponse)
def update_item(
    item_id: int,
    updated_item: schemas.ItemCreate,
    db: Session = Depends(get_db)
):
    item = db.query(models.Item).filter(models.Item.id == item_id).first()

    if item is None:
        raise HTTPException(
            status_code=404,
            detail="Item not found"
        )

    item.name = updated_item.name
    item.quantity = updated_item.quantity
    item.price = updated_item.price
    item.category = updated_item.category

    db.commit()
    db.refresh(item)

    return item

@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.Item).filter(models.Item.id == item_id).first()

    if item is None:
        raise HTTPException(
            status_code=404,
            detail="Item not found"
        )

    db.delete(item)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)