// this file shows the summary parts at the top of the dashboard.
// it displays totals, low stock alerts, and grouped counts.
function InventorySummary({
  totalItems,
  totalUnits,
  totalValue,
  lowStockItems,
  categoryCounts,
  supplierCounts,
}) {
  return (
    <div className="summary-grid">
      {/* shows the main inventory totals. */}
      <section className="summary-card summary-card-primary">
        <h2>Overview</h2>
        <p>Total item types: {totalItems}</p>
        <p>Total units in stock: {totalUnits}</p>
        <p>Total inventory value: ${totalValue.toFixed(2)}</p>
      </section>

      {lowStockItems.length > 0 && (
        <section className="summary-card summary-card-alert">
          {/* warns about items with low stock. */}
          <h2>Low Stock Alerts</h2>

          <ul className="summary-list">
            {lowStockItems.map((item) => (
              <li key={item.id}>
                {item.name} is low on stock: {item.quantity} remaining
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="summary-card">
        {/* groups items by category. */}
        <h2>Inventory by Category</h2>

        <ul className="summary-list">
          {Object.entries(categoryCounts).map(([category, count]) => (
            <li key={category}>
              {category}: {count} item{count !== 1 ? "s" : ""}
            </li>
          ))}
        </ul>
      </section>

      <section className="summary-card">
        {/* groups items by supplier. */}
        <h2>Inventory by Supplier</h2>
        <ul className="summary-list">
          {Object.entries(supplierCounts).map(([supplier, count]) => (
            <li key={supplier}>
              {supplier}: {count} item{count !== 1 ? "s" : ""}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export default InventorySummary
