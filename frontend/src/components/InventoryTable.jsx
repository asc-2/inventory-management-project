// this file renders the main inventory table.
// it shows sorted items and action buttons for each row.
function InventoryTable({
  loading,
  items,
  lowStockThreshold,
  getSortLabel,
  onSort,
  onEdit,
  onShowHistory,
  onDelete,
}) {
  return (
    <section className="table-card">
      <div className="table-header">
        <h2>Inventory Items</h2>
        <p>Click any column title to sort the table.</p>
      </div>

      {/* shows the main inventory list. */}
      <table className="inventory-table">
        <thead>
          <tr>
            <th onClick={() => onSort("id")}>{getSortLabel("id", "ID")}</th>
            <th onClick={() => onSort("name")}>{getSortLabel("name", "Name")}</th>
            <th onClick={() => onSort("quantity")}>{getSortLabel("quantity", "Quantity")}</th>
            <th onClick={() => onSort("price")}>{getSortLabel("price", "Price")}</th>
            <th onClick={() => onSort("category")}>{getSortLabel("category", "Category")}</th>
            <th onClick={() => onSort("supplier")}>{getSortLabel("supplier", "Supplier")}</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {/* this row appears when there are no items to show. */}
          {!loading && items.length === 0 && (
            <tr>
              <td className="table-empty" colSpan="7">No items found.</td>
            </tr>
          )}

          {items.map((item) => (
            // this creates one row for each item in the list.
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td className={item.quantity <= lowStockThreshold ? "low-stock" : ""}>
                {item.quantity}
              </td>
              <td>${item.price}</td>
              <td>{item.category}</td>
              <td>{item.supplier}</td>
              <td className="table-actions">
                <button onClick={() => onEdit(item)}>
                  Edit
                </button>

                <button onClick={() => onShowHistory(item)}>
                  History
                </button>

                <button onClick={() => onDelete(item.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default InventoryTable
