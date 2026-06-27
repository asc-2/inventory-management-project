# this file contains the main inventory routes and stock movement logic.
# it handles items, suppliers, and transaction history endpoints.
from fastapi import APIRouter, Depends, HTTPException, Response, status # type: ignore

from sqlalchemy.orm import Session # type: ignore

from app.database import get_db
from app import models, schemas
router = APIRouter()

def _normalize_quantity_delta(change_type: schemas.TransactionType, quantity_delta: int) -> int:
    # this makes sure the quantity change matches the selected movement type.
    if quantity_delta == 0:
        raise HTTPException(
            status_code=400,
            detail="quantity_delta must not be zero"
        )

    if change_type == "initial" and quantity_delta < 0:
        raise HTTPException(
            status_code=400,
            detail="Initial inventory must be positive"
        )

    if change_type == "stock_in":
        return abs(quantity_delta)

    if change_type == "stock_out":
        return -abs(quantity_delta)

    return quantity_delta


def _get_item_or_404(item_id: int, db: Session) -> models.Item:
    # this finds one item or raises a 404 error.
    item = db.query(models.Item).filter(models.Item.id == item_id).first()

    if item is None:
        raise HTTPException(
            status_code=404,
            detail="Item not found"
        )

    return item


def _get_transaction_or_404(
    item_id: int,
    transaction_id: int,
    db: Session
) -> models.InventoryTransaction:
    # this finds one transaction for an item or raises a 404 error.
    transaction = (
        db.query(models.InventoryTransaction)
        .filter(
            models.InventoryTransaction.id == transaction_id,
            models.InventoryTransaction.item_id == item_id,
        )
        .first()
    )

    if transaction is None:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    return transaction


def _create_transaction(
    *,
    db: Session,
    item: models.Item,
    change_type: schemas.TransactionType,
    quantity_delta: int,
    note: str | None = None
) -> models.InventoryTransaction:
    # this creates one stock movement and updates the current item quantity.
    quantity_delta = _normalize_quantity_delta(change_type, quantity_delta)

    # these values let us store the before and after quantity.
    previous_quantity = item.quantity
    new_quantity = previous_quantity + quantity_delta

    if new_quantity < 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity cannot be negative"
        )

    # this updates the item snapshot after the movement is accepted.
    item.quantity = new_quantity

    # this saves the full movement record in the history table.
    transaction = models.InventoryTransaction(
        item=item,
        change_type=change_type,
        quantity_delta=quantity_delta,
        previous_quantity=previous_quantity,
        new_quantity=new_quantity,
        note=note,
    )
    db.add(transaction)

    return transaction


@router.post("/items", response_model=schemas.ItemResponse)
def create_item(item: schemas.ItemCreate, db: Session = Depends(get_db)):
    # this creates a new item record with quantity starting at zero.
    new_item = models.Item(
        name=item.name,
        quantity=0,
        price=item.price,
        category=item.category,
        supplier=item.supplier,
    )

    # this saves the item first so it gets an id.
    db.add(new_item)
    db.flush()

    # this records the opening stock as the first transaction.
    if item.quantity > 0:
        _create_transaction(
            db=db,
            item=new_item,
            change_type="initial",
            quantity_delta=item.quantity,
            note="Initial inventory"
        )

    db.commit()
    db.refresh(new_item)

    return new_item

@router.get("/items", response_model=list[schemas.ItemResponse])
def get_items(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    # this returns a paginated list of items.
    items = db.query(models.Item).offset(skip).limit(limit).all()
    return items

@router.get("/items/search", response_model=list[schemas.ItemResponse])
def search_items(
    name: str | None = None,
    category: str | None = None,
    db: Session = Depends(get_db)
):
    # this starts with all items and then applies any search filters.
    query = db.query(models.Item)

    # this filters by item name if a name was provided.
    if name:
        query = query.filter(models.Item.name.ilike(f"%{name}%"))

    # this filters by category if a category was provided.
    if category:
        query = query.filter(models.Item.category.ilike(f"%{category}%"))

    return query.all()

@router.get("/items/suppliers", response_model=list[str])
def get_suppliers(db: Session = Depends(get_db)):
    # this returns a unique list of supplier names for frontend suggestions.
    suppliers = (
        db.query(models.Item.supplier)
        .distinct()
        .order_by(models.Item.supplier.asc())
        .all()
    )

    return [supplier for supplier, in suppliers if supplier]

@router.get("/items/{item_id}", response_model=schemas.ItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    # this returns one item by id.
    item = _get_item_or_404(item_id, db)
    return item

@router.put("/items/{item_id}", response_model=schemas.ItemResponse)
def update_item(
    item_id: int,
    updated_item: schemas.ItemUpdate,
    db: Session = Depends(get_db)
):
    # this updates item details but leaves quantity alone.
    item = _get_item_or_404(item_id, db)

    item.name = updated_item.name
    item.price = updated_item.price
    item.category = updated_item.category
    item.supplier = updated_item.supplier

    db.commit()
    db.refresh(item)

    return item


@router.post(
    "/items/{item_id}/transactions",
    response_model=schemas.InventoryTransactionResponse,
    status_code=status.HTTP_201_CREATED
)
def create_inventory_transaction(
    item_id: int,
    transaction_input: schemas.InventoryTransactionCreate,
    db: Session = Depends(get_db)
):
    # this records a stock movement for one item.
    item = _get_item_or_404(item_id, db)

    transaction = _create_transaction(
        db=db,
        item=item,
        change_type=transaction_input.change_type,
        quantity_delta=transaction_input.quantity_delta,
        note=transaction_input.note
    )

    db.commit()
    db.refresh(transaction)

    return transaction


@router.put(
    "/items/{item_id}/transactions/{transaction_id}",
    response_model=schemas.InventoryTransactionResponse
)
def update_inventory_transaction(
    item_id: int,
    transaction_id: int,
    transaction_update: schemas.InventoryTransactionUpdate,
    db: Session = Depends(get_db)
):
    # this lets the user fix the note without changing stock math.
    _get_item_or_404(item_id, db)
    transaction = _get_transaction_or_404(item_id, transaction_id, db)

    transaction.note = transaction_update.note

    db.commit()
    db.refresh(transaction)

    return transaction


@router.get(
    "/items/{item_id}/transactions",
    response_model=list[schemas.InventoryTransactionResponse]
)
def get_item_transactions(
    item_id: int,
    skip: int = 0,
    limit: int = 10,
    change_type: schemas.TransactionType | None = None,
    db: Session = Depends(get_db)
):
    # this loads transaction history for one item.
    _get_item_or_404(item_id, db)

    # this starts with all transactions for the selected item.
    query = db.query(models.InventoryTransaction).filter(
        models.InventoryTransaction.item_id == item_id
    )

    # this optionally filters the history by movement type.
    if change_type:
        query = query.filter(models.InventoryTransaction.change_type == change_type)

    # this sorts newest first and applies pagination.
    transactions = (
        query
        .order_by(models.InventoryTransaction.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return transactions

@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    # this deletes an item and its related transactions.
    item = _get_item_or_404(item_id, db)

    db.delete(item)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)
