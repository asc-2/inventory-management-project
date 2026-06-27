// this file renders the item create and edit form.
// it stays presentational and uses props from the parent container.

// this component handles the add and edit item form ui.
function ItemForm({
  name,
  quantity,
  price,
  category,
  supplier,
  editingId,
  supplierOptions,
  onNameChange,
  onQuantityChange,
  onPriceChange,
  onCategoryChange,
  onSupplierChange,
  onSubmit,
  onCancelEdit,
}) {
  return (
    // handles both adding new items and editing old ones.
    <form className="inventory-form item-form" onSubmit={onSubmit}>
      <input
        placeholder="Name"
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
      />

      <input
        placeholder={editingId ? "Use stock movement below" : "Quantity"}
        type="number"
        value={quantity}
        onChange={(event) => onQuantityChange(event.target.value)}
        disabled={Boolean(editingId)}
      />

      <input
        placeholder="Price"
        type="number"
        step="0.01"
        value={price}
        onChange={(event) => onPriceChange(event.target.value)}
      />

      <input
        placeholder="Category"
        value={category}
        onChange={(event) => onCategoryChange(event.target.value)}
      />

      <input
        placeholder="Supplier"
        value={supplier}
        onChange={(event) => onSupplierChange(event.target.value)}
        list="supplier-options"
      />

      <datalist id="supplier-options">
        {/* lets users pick or type a supplier name. */}
        {supplierOptions.map((supplierOption) => (
          <option key={supplierOption} value={supplierOption} />
        ))}
      </datalist>

      <button type="submit">
        {editingId ? "Update Item" : "Add Item"}
      </button>

      {editingId && (
        <>
          {/* reminds the user that stock changes happen elsewhere. */}
          <span className="form-helper-text">Quantity changes now use the stock movement form below.</span>
          <button type="button" onClick={onCancelEdit}>
            Cancel Edit
          </button>
        </>
      )}
    </form>
  )
}

export default ItemForm
