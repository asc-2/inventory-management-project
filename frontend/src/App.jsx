import { useEffect, useState } from "react"
import "./App.css"

const API_URL = "http://127.0.0.1:8000"
const LOW_STOCK_THRESHOLD = 5
const HISTORY_PAGE_SIZE = 5
const DEFAULT_MOVEMENT_REASONS = {
  stock_in: ["Restock", "Purchase", "Returned"],
  stock_out: ["Sale", "Returned", "Stolen/Broken"],
  adjustment: ["Count correction", "Returned", "Stolen/Broken"],
}

function App() {
  const [items, setItems] = useState([])
  const [supplierOptions, setSupplierOptions] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState("")
  const [historyTypeFilter, setHistoryTypeFilter] = useState("all")
  const [historyPage, setHistoryPage] = useState(0)
  const [historyHasMore, setHistoryHasMore] = useState(false)
  const [stockAction, setStockAction] = useState("stock_in")
  const [stockAmount, setStockAmount] = useState("")
  const [stockNote, setStockNote] = useState("")
  const [stockLoading, setStockLoading] = useState(false)
  const [editingTransactionId, setEditingTransactionId] = useState(null)
  const [editingTransactionNote, setEditingTransactionNote] = useState("")
  const [transactionSaving, setTransactionSaving] = useState(false)

  const [name, setName] = useState("")
  const [quantity, setQuantity] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("")
  const [supplier, setSupplier] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [searchName, setSearchName] = useState("")
  const [searchCategory, setSearchCategory] = useState("")
  const [sortField, setSortField] = useState(null)
  const [sortDirection, setSortDirection] = useState("asc")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const fetchItems = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`${API_URL}/items`)

      if (!response.ok) {
        throw new Error("Failed to fetch items")
      }

      const data = await response.json()
      setItems(data)
    } catch (error) {
      console.error(error)
      setError("Could not load inventory items.")
    } finally {
      setLoading(false)
    }
  }

  const fetchSupplierOptions = async () => {
    try {
      const response = await fetch(`${API_URL}/items/suppliers`)

      if (!response.ok) {
        throw new Error("Failed to fetch suppliers")
      }

      const data = await response.json()
      setSupplierOptions(data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchItems()
    fetchSupplierOptions()
  }, [])

  const fetchTransactions = async (item, options = {}) => {
    const nextPage = options.page ?? historyPage
    const nextTypeFilter = options.typeFilter ?? historyTypeFilter

    setSelectedItem(item)
    setHistoryLoading(true)
    setHistoryError("")
    setEditingTransactionId(null)
    setEditingTransactionNote("")

    try {
      const params = new URLSearchParams({
        skip: String(nextPage * HISTORY_PAGE_SIZE),
        limit: String(HISTORY_PAGE_SIZE),
      })

      if (nextTypeFilter !== "all") {
        params.append("change_type", nextTypeFilter)
      }

      const response = await fetch(`${API_URL}/items/${item.id}/transactions?${params}`)

      if (!response.ok) {
        throw new Error("Failed to fetch transaction history")
      }

      const data = await response.json()
      setTransactions(data)
      setHistoryPage(nextPage)
      setHistoryTypeFilter(nextTypeFilter)
      setHistoryHasMore(data.length === HISTORY_PAGE_SIZE)
    } catch (error) {
      console.error(error)
      setTransactions([])
      setHistoryError("Could not load transaction history.")
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleDelete = async (id) => {
    setError("")

    try {
      const response = await fetch(`${API_URL}/items/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete item")
      }

      if (selectedItem && selectedItem.id === id) {
        setSelectedItem(null)
        setTransactions([])
        setHistoryError("")
      }

      fetchItems()
      fetchSupplierOptions()
    } catch (error) {
      console.error(error)
      setError("Could not delete item.")
    }
  }
  const handleEdit = (item) => {
    setEditingId(item.id)
    setName(item.name)
    setQuantity("")
    setPrice(item.price)
    setCategory(item.category)
    setSupplier(item.supplier)
  }

  const handleSelectItem = async (item) => {
    setStockAction("stock_in")
    setStockAmount("")
    setStockNote("")
    setEditingTransactionId(null)
    setEditingTransactionNote("")
    await fetchTransactions(item, { page: 0, typeFilter: "all" })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")

    if (
      !name.trim() ||
      (!editingId && quantity === "") ||
      price === "" ||
      !category.trim() ||
      !supplier.trim()
    ) {
      setError("Please fill out all item fields.")
      return
    }

    if (Number(quantity) < 0 || Number(price) < 0) {
      setError("Quantity and price cannot be negative.")
      return
    }

    const itemData = {
      name: name.trim(),
      price: Number(price),
      category: category.trim(),
      supplier: supplier.trim(),
    }

    try {
      let response

      if (editingId) {
        response = await fetch(`${API_URL}/items/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(itemData),
        })
      } else {
        response = await fetch(`${API_URL}/items`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...itemData,
            quantity: Number(quantity),
          }),
        })
      }

      if (!response.ok) {
        let message = "Failed to save item"

        try {
          const errorData = await response.json()
          if (typeof errorData.detail === "string") {
            message = errorData.detail
          }
        } catch {
          // Keep the fallback message when the response is not JSON.
        }

        throw new Error(message)
      }

      const savedItem = await response.json()

      setName("")
      setQuantity("")
      setPrice("")
      setCategory("")
      setSupplier("")
      setEditingId(null)

      await fetchItems()
      await fetchSupplierOptions()

      if (selectedItem && selectedItem.id === editingId) {
        await fetchTransactions(savedItem)
      }
    } catch (error) {
      console.error(error)
      setError(error.message || "Could not save item.")
    }
  } 

  const handleStockSubmit = async (event) => {
    event.preventDefault()
    setError("")

    if (!selectedItem) {
      setError("Select an item before recording stock movement.")
      return
    }

    if (stockAmount === "") {
      setError("Enter a stock movement amount.")
      return
    }

    if (
      stockAction === "adjustment" &&
      Number(stockAmount) === 0
    ) {
      setError("Adjustment amount must not be zero.")
      return
    }

    if (
      stockAction !== "adjustment" &&
      Number(stockAmount) <= 0
    ) {
      setError("Enter a stock movement amount greater than zero.")
      return
    }

    setStockLoading(true)

    try {
      const response = await fetch(`${API_URL}/items/${selectedItem.id}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          change_type: stockAction,
          quantity_delta: Number(stockAmount),
          note: stockNote.trim() || null,
        }),
      })

      if (!response.ok) {
        let message = "Failed to record stock movement"

        try {
          const errorData = await response.json()
          if (typeof errorData.detail === "string") {
            message = errorData.detail
          }
        } catch {
          // Keep fallback error.
        }

        throw new Error(message)
      }

      const savedTransaction = await response.json()
      const updatedSelectedItem = {
        ...selectedItem,
        quantity: savedTransaction.new_quantity,
      }

      setStockAmount("")
      setStockNote("")
      await fetchItems()
      await fetchSupplierOptions()
      await fetchTransactions(updatedSelectedItem, {
        page: 0,
        typeFilter: historyTypeFilter,
      })
    } catch (error) {
      console.error(error)
      setError(error.message || "Could not record stock movement.")
    } finally {
      setStockLoading(false)
    }
  }

  const handleSearch = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError("")

    const params = new URLSearchParams()

    if (searchName) {
      params.append("name", searchName)
    }

    if (searchCategory) {
      params.append("category", searchCategory)
    }

    try {
      const response = await fetch(`${API_URL}/items/search?${params}`)

      if (!response.ok) {
        throw new Error("Failed to search items")
      }

      const data = await response.json()
      setItems(data)
    } catch (error) {
      console.error(error)
      setError("Could not search inventory items.")
    } finally {
      setLoading(false)
    }
  }

  const handleClearSearch = () => {
    setSearchName("")
    setSearchCategory("")
    fetchItems()
  }

  const handleCancelEdit = () => {
    setName("")
    setQuantity("")
    setPrice("")
    setCategory("")
    setSupplier("")
    setEditingId(null)
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getSortLabel = (field, label) => {
    if (sortField !== field) {
      return label
    }

    return `${label} ${sortDirection === "asc" ? "↑" : "↓"}`
  }

  const formatTransactionType = (changeType) => (
    changeType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  )

  const formatDelta = (quantityDelta) => (
    quantityDelta > 0 ? `+${quantityDelta}` : `${quantityDelta}`
  )

  const handleHistoryFilterChange = async (event) => {
    const nextTypeFilter = event.target.value

    if (!selectedItem) {
      return
    }

    await fetchTransactions(selectedItem, {
      page: 0,
      typeFilter: nextTypeFilter,
    })
  }

  const handleHistoryPageChange = async (nextPage) => {
    if (!selectedItem || nextPage < 0) {
      return
    }

    await fetchTransactions(selectedItem, {
      page: nextPage,
      typeFilter: historyTypeFilter,
    })
  }

  const handleEditTransaction = (transaction) => {
    setEditingTransactionId(transaction.id)
    setEditingTransactionNote(transaction.note || "")
  }

  const handleCancelTransactionEdit = () => {
    setEditingTransactionId(null)
    setEditingTransactionNote("")
  }

  const handleSaveTransactionNote = async (transaction) => {
    if (!selectedItem) {
      return
    }

    setError("")
    setTransactionSaving(true)

    try {
      const response = await fetch(
        `${API_URL}/items/${selectedItem.id}/transactions/${transaction.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            note: editingTransactionNote.trim() || null,
          }),
        }
      )

      if (!response.ok) {
        let message = "Failed to update transaction note"

        try {
          const errorData = await response.json()
          if (typeof errorData.detail === "string") {
            message = errorData.detail
          }
        } catch {
          // Keep fallback error.
        }

        throw new Error(message)
      }

      const updatedTransaction = await response.json()
      setTransactions((currentTransactions) =>
        currentTransactions.map((currentTransaction) =>
          currentTransaction.id === updatedTransaction.id
            ? updatedTransaction
            : currentTransaction
        )
      )
      setEditingTransactionId(null)
      setEditingTransactionNote("")
    } catch (error) {
      console.error(error)
      setError(error.message || "Could not update transaction note.")
    } finally {
      setTransactionSaving(false)
    }
  }
  
  const sortedItems = [...items].sort((a, b) => {
    if (!sortField) {
      return 0
    }

    const aValue = a[sortField]
    const bValue = b[sortField]

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc"
        ? aValue - bValue
        : bValue - aValue
    }

    return sortDirection === "asc"
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue))
  })

  const totalItems = items.length
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalValue = items.reduce( (sum, item) => sum + item.quantity * item.price, 0)
  const lowStockItems = items.filter(
  (item) => item.quantity <= LOW_STOCK_THRESHOLD
)

  const categoryCounts = items.reduce((counts, item) => {
    if (counts[item.category]) {
      counts[item.category]++
    } else {
      counts[item.category] = 1
    }

    return counts
  }, {})

  const supplierCounts = items.reduce((counts, item) => {
    if (counts[item.supplier]) {
      counts[item.supplier]++
    } else {
      counts[item.supplier] = 1
    }

    return counts
  }, {})

  const historicalReasonOptions = [...new Set(
    transactions
      .map((transaction) => transaction.note?.trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b))

  const movementReasonOptions = [...new Set([
    ...(DEFAULT_MOVEMENT_REASONS[stockAction] || []),
    ...historicalReasonOptions,
  ])]

  const editingTransaction = transactions.find(
    (transaction) => transaction.id === editingTransactionId
  )
  const editingReasonOptions = editingTransaction
    ? [...new Set([
        ...(DEFAULT_MOVEMENT_REASONS[editingTransaction.change_type] || []),
        ...historicalReasonOptions,
      ])]
    : historicalReasonOptions


  return (
    <div>
      <h1>Inventory Management</h1>

      {error && <p>{error}</p>}
      {loading && <p>Loading...</p>}

      <section>
        <p>Total item types: {totalItems}</p>
        <p>Total units in stock: {totalUnits}</p>
        <p>Total inventory value: ${totalValue.toFixed(2)}</p>
      </section>

      {lowStockItems.length > 0 && (
        <section>
          <h2>Low Stock Alerts</h2>

          <ul>
            {lowStockItems.map((item) => (
              <li key={item.id}>
                {item.name} is low on stock: {item.quantity} remaining
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>

        <h2>Inventory by Category</h2>

        <ul>

          {Object.entries(categoryCounts).map(([category, count]) => (

            <li key={category}>

              {category}: {count} item{count !== 1 ? "s" : ""}

            </li>

          ))}

        </ul>

      </section>

      <section>
        <h2>Inventory by Supplier</h2>
        <ul>
          {Object.entries(supplierCounts).map(([supplier, count]) => (
            <li key={supplier}>
              {supplier}: {count} item{count !== 1 ? "s" : ""}
            </li>
          ))}
        </ul>
      </section>

      <form onSubmit={handleSearch}>
        <input
          placeholder="Search by name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />

        <input
          placeholder="Search by category"
          value={searchCategory}
          onChange={(e) => setSearchCategory(e.target.value)}
        />

        <button type="submit">Search</button>
        <button type="button" onClick={handleClearSearch}>Clear</button>
      </form>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder={editingId ? "Use stock movement below" : "Quantity"}
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          disabled={Boolean(editingId)}
        />

        <input
          placeholder="Price"
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <input
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <input
          placeholder="Supplier"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          list="supplier-options"
        />

        <datalist id="supplier-options">
          {supplierOptions.map((supplierOption) => (
            <option key={supplierOption} value={supplierOption} />
          ))}
        </datalist>

        <button type="submit">
          {editingId ? "Update Item" : "Add Item"}
        </button>

        {editingId && (
          <>
            <span>Quantity changes now use the stock movement form below.</span>
            <button type="button" onClick={handleCancelEdit}>
              Cancel Edit
            </button>
          </>
        )}
      </form>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th onClick={() => handleSort("id")}>{getSortLabel("id", "ID")}</th>
            <th onClick={() => handleSort("name")}>{getSortLabel("name", "Name")}</th>
            <th onClick={() => handleSort("quantity")}>{getSortLabel("quantity", "Quantity")}</th>
            <th onClick={() => handleSort("price")}>{getSortLabel("price", "Price")}</th>
            <th onClick={() => handleSort("category")}>{getSortLabel("category", "Category")}</th>
            <th onClick={() => handleSort("supplier")}>{getSortLabel("supplier", "Supplier")}</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {!loading && sortedItems.length === 0 && (
            <tr>
              <td colSpan="7">No items found.</td>
            </tr>
          )}

          {sortedItems.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td
                className={
                  item.quantity <= LOW_STOCK_THRESHOLD
                    ? "low-stock"
                    : ""
                }
              >
                {item.quantity}
              </td>
              <td>${item.price}</td>
              <td>{item.category}</td>
              <td>{item.supplier}</td>
              <td>
                <button onClick={() => handleEdit(item)}>
                  Edit
                </button>

                <button onClick={() => handleSelectItem(item)}>
                  History
                </button>

                <button onClick={() => handleDelete(item.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="history-panel">
        <div className="history-header">
          <h2>Transaction History</h2>

          {selectedItem && (
            <button
              type="button"
              onClick={() => {
                setSelectedItem(null)
                setTransactions([])
                setHistoryError("")
                setHistoryPage(0)
                setHistoryTypeFilter("all")
                setHistoryHasMore(false)
                setEditingTransactionId(null)
                setEditingTransactionNote("")
              }}
            >
              Close
            </button>
          )}
        </div>

        {!selectedItem && (
          <p>Select an item to inspect its quantity changes.</p>
        )}

        {selectedItem && (
          <>
            <p>
              Showing history for <strong>{selectedItem.name}</strong> with current stock of{" "}
              <strong>{selectedItem.quantity}</strong>.
            </p>

            <div className="history-controls">
              <label>
                Filter
                <select
                  value={historyTypeFilter}
                  onChange={handleHistoryFilterChange}
                >
                  <option value="all">All Types</option>
                  <option value="initial">Initial</option>
                  <option value="stock_in">Stock In</option>
                  <option value="stock_out">Stock Out</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </label>
            </div>

            <form className="stock-form" onSubmit={handleStockSubmit}>
              <label>
                Movement Type
                <select
                  value={stockAction}
                  onChange={(event) => setStockAction(event.target.value)}
                >
                  <option value="stock_in">Stock In</option>
                  <option value="stock_out">Stock Out</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </label>

              <label>
                Amount
                <input
                  type="number"
                  min={stockAction === "adjustment" ? undefined : "1"}
                  value={stockAmount}
                  onChange={(event) => setStockAmount(event.target.value)}
                  placeholder={
                    stockAction === "adjustment"
                      ? "Use positive or negative units"
                      : "Enter units"
                  }
                />
              </label>

              <label>
                Note
                <input
                  value={stockNote}
                  onChange={(event) => setStockNote(event.target.value)}
                  placeholder="Reason for this change"
                  list="movement-reason-options"
                />
              </label>

              <button type="submit" disabled={stockLoading}>
                {stockLoading ? "Saving..." : "Record Movement"}
              </button>
            </form>

            <datalist id="movement-reason-options">
              {movementReasonOptions.map((reasonOption) => (
                <option key={reasonOption} value={reasonOption} />
              ))}
            </datalist>

            {historyLoading && <p>Loading transaction history...</p>}
            {historyError && <p>{historyError}</p>}

            {!historyLoading && !historyError && transactions.length === 0 && (
              <p>No transactions recorded for this item yet.</p>
            )}

            {!historyLoading && !historyError && transactions.length > 0 && (
              <>
                <table border="1" cellPadding="8">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Type</th>
                      <th>Delta</th>
                      <th>Previous</th>
                      <th>New</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>{new Date(transaction.created_at).toLocaleString()}</td>
                        <td>{formatTransactionType(transaction.change_type)}</td>
                        <td
                          className={
                            transaction.quantity_delta > 0
                              ? "transaction-positive"
                              : "transaction-negative"
                          }
                        >
                          {formatDelta(transaction.quantity_delta)}
                        </td>
                        <td>{transaction.previous_quantity}</td>
                        <td>{transaction.new_quantity}</td>
                        <td>
                          {editingTransactionId === transaction.id ? (
                            <div className="transaction-note-editor">
                              <input
                                value={editingTransactionNote}
                                onChange={(event) => setEditingTransactionNote(event.target.value)}
                                placeholder="Add a reason"
                                list="edit-movement-reason-options"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveTransactionNote(transaction)}
                                disabled={transactionSaving}
                              >
                                {transactionSaving ? "Saving..." : "Save"}
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelTransactionEdit}
                                disabled={transactionSaving}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="transaction-note-display">
                              <span>{transaction.note || "No note"}</span>
                              <button
                                type="button"
                                onClick={() => handleEditTransaction(transaction)}
                              >
                                Edit Note
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <datalist id="edit-movement-reason-options">
                  {editingReasonOptions.map((reasonOption) => (
                    <option key={reasonOption} value={reasonOption} />
                  ))}
                </datalist>

                <div className="history-pagination">
                  <button
                    type="button"
                    onClick={() => handleHistoryPageChange(historyPage - 1)}
                    disabled={historyPage === 0}
                  >
                    Previous
                  </button>
                  <span>Page {historyPage + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleHistoryPageChange(historyPage + 1)}
                    disabled={!historyHasMore}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  )
}

export default App
