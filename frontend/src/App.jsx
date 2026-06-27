// this file is the main frontend container for the inventory app.
// it keeps the app state and passes data into smaller ui components.
import { useEffect, useState } from "react"
import "./App.css"
import InventorySummary from "./components/InventorySummary"
import SearchForm from "./components/SearchForm"
import ItemForm from "./components/ItemForm"
import InventoryTable from "./components/InventoryTable"
import TransactionHistoryPanel from "./components/TransactionHistoryPanel"

const API_URL = "http://127.0.0.1:8000"
const LOW_STOCK_THRESHOLD = 5
const HISTORY_PAGE_SIZE = 5
const THEME_STORAGE_KEY = "inventory-theme"
const THEME_OPTIONS = ["day", "grey", "night"]
const DEFAULT_MOVEMENT_REASONS = {
  stock_in: ["Restock", "Purchase", "Returned"],
  stock_out: ["Sale", "Returned", "Stolen/Broken"],
  adjustment: ["Count correction", "Returned", "Stolen/Broken"],
}

function App() {
  // these state values manage item data and supplier suggestions.
  const [items, setItems] = useState([])
  const [supplierOptions, setSupplierOptions] = useState([])

  // these state values manage the selected item history panel.
  const [selectedItem, setSelectedItem] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState("")
  const [historyTypeFilter, setHistoryTypeFilter] = useState("all")
  const [historyPage, setHistoryPage] = useState(0)
  const [historyHasMore, setHistoryHasMore] = useState(false)

  // these state values manage the stock movement form.
  const [stockAction, setStockAction] = useState("stock_in")
  const [stockAmount, setStockAmount] = useState("")
  const [stockNote, setStockNote] = useState("")
  const [stockLoading, setStockLoading] = useState(false)

  // these state values manage inline note editing in the history table.
  const [editingTransactionId, setEditingTransactionId] = useState(null)
  const [editingTransactionNote, setEditingTransactionNote] = useState("")
  const [transactionSaving, setTransactionSaving] = useState(false)

  // these state values manage the item create and edit form.
  const [name, setName] = useState("")
  const [quantity, setQuantity] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("")
  const [supplier, setSupplier] = useState("")
  const [editingId, setEditingId] = useState(null)

  // these state values manage search, sorting, and general ui feedback.
  const [searchName, setSearchName] = useState("")
  const [searchCategory, setSearchCategory] = useState("")
  const [sortField, setSortField] = useState(null)
  const [sortDirection, setSortDirection] = useState("asc")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [themeMode, setThemeMode] = useState(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    return THEME_OPTIONS.includes(savedTheme) ? savedTheme : "day"
  })

  // loads the current item list from the backend.
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

  // loads unique supplier names for the supplier suggestion list.
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

  // runs once when the page first loads.
  useEffect(() => {
    fetchItems()
    fetchSupplierOptions()
  }, [])

  // applies the selected theme to the page and saves it for later.
  useEffect(() => {
    document.documentElement.dataset.theme = themeMode
    localStorage.setItem(THEME_STORAGE_KEY, themeMode)
  }, [themeMode])

  // loads one page of transaction history for the selected item.
  const fetchTransactions = async (item, options = {}) => {
    const nextPage = options.page ?? historyPage
    const nextTypeFilter = options.typeFilter ?? historyTypeFilter

    // resets history ui state before loading new data.
    setSelectedItem(item)
    setHistoryLoading(true)
    setHistoryError("")
    setEditingTransactionId(null)
    setEditingTransactionNote("")

    try {
      // builds the query string for paging and filtering.
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

      // saves the new history data and page info.
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

  // deletes one item from the backend.
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
        // clears the history panel if the selected item was deleted.
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

  // fills the form with item details for editing.
  const handleEdit = (item) => {
    setEditingId(item.id)
    setName(item.name)
    setQuantity("")
    setPrice(item.price)
    setCategory(item.category)
    setSupplier(item.supplier)
  }

  // opens the history panel for one item and resets stock form state.
  const handleSelectItem = async (item) => {
    setStockAction("stock_in")
    setStockAmount("")
    setStockNote("")
    setEditingTransactionId(null)
    setEditingTransactionNote("")
    await fetchTransactions(item, { page: 0, typeFilter: "all" })
  }

  // saves a new item or updates an existing one.
  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")

    // checks that the main item form is filled in.
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

    // blocks negative values before sending to the backend.
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
        // updates item details without changing quantity.
        response = await fetch(`${API_URL}/items/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(itemData),
        })
      } else {
        // creates a new item with its starting quantity.
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
        // tries to show the backend error message if one exists.
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

      // clears the form after a successful save.
      setName("")
      setQuantity("")
      setPrice("")
      setCategory("")
      setSupplier("")
      setEditingId(null)

      // refreshes the list and supplier suggestions.
      await fetchItems()
      await fetchSupplierOptions()

      if (selectedItem && selectedItem.id === editingId) {
        // refreshes history if the edited item is currently selected.
        await fetchTransactions(savedItem)
      }
    } catch (error) {
      console.error(error)
      setError(error.message || "Could not save item.")
    }
  } 

  // records a stock movement for the selected item.
  const handleStockSubmit = async (event) => {
    event.preventDefault()
    setError("")

    // makes sure a user selected an item first.
    if (!selectedItem) {
      setError("Select an item before recording stock movement.")
      return
    }

    // checks that some amount was entered.
    if (stockAmount === "") {
      setError("Enter a stock movement amount.")
      return
    }

    // makes sure an adjustment is not zero.
    if (
      stockAction === "adjustment" &&
      Number(stockAmount) === 0
    ) {
      setError("Adjustment amount must not be zero.")
      return
    }

    // makes sure stock in and stock out use positive amounts.
    if (
      stockAction !== "adjustment" &&
      Number(stockAmount) <= 0
    ) {
      setError("Enter a stock movement amount greater than zero.")
      return
    }

    setStockLoading(true)

    try {
      // sends the stock movement to the backend.
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

      // updates the selected item quantity using the new transaction result.
      const updatedSelectedItem = {
        ...selectedItem,
        quantity: savedTransaction.new_quantity,
      }

      setStockAmount("")
      setStockNote("")

      // refreshes the list, suggestions, and history panel.
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

  // searches the inventory using the current search inputs.
  const handleSearch = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError("")

    const params = new URLSearchParams()

    // only sends the name filter if the user typed one.
    if (searchName) {
      params.append("name", searchName)
    }

    // only sends the category filter if the user typed one.
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
    // this clears the search fields and reloads the full list.
    setSearchName("")
    setSearchCategory("")
    fetchItems()
  }

  const handleCancelEdit = () => {
    // this resets the item form when edit mode is canceled.
    setName("")
    setQuantity("")
    setPrice("")
    setCategory("")
    setSupplier("")
    setEditingId(null)
  }

  const handleSort = (field) => {
    // this toggles the sort field and direction for the table.
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getSortLabel = (field, label) => {
    // this adds an arrow to the active sort column label.
    if (sortField !== field) {
      return label
    }

    return `${label} ${sortDirection === "asc" ? "↑" : "↓"}`
  }

  const formatTransactionType = (changeType) => (
    // this turns values like stock_in into stock in for the ui.
    changeType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  )

  const formatDelta = (quantityDelta) => (
    // this adds a plus sign to positive stock changes.
    quantityDelta > 0 ? `+${quantityDelta}` : `${quantityDelta}`
  )

  const handleHistoryFilterChange = async (event) => {
    // this changes the history type filter and goes back to page one.
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
    // this loads the next or previous page of history.
    if (!selectedItem || nextPage < 0) {
      return
    }

    await fetchTransactions(selectedItem, {
      page: nextPage,
      typeFilter: historyTypeFilter,
    })
  }

  const handleEditTransaction = (transaction) => {
    // this opens inline edit mode for one transaction note.
    setEditingTransactionId(transaction.id)
    setEditingTransactionNote(transaction.note || "")
  }

  const handleCancelTransactionEdit = () => {
    // this closes inline note editing without saving.
    setEditingTransactionId(null)
    setEditingTransactionNote("")
  }

  const handleSaveTransactionNote = async (transaction) => {
    // this saves an edited transaction note.
    if (!selectedItem) {
      return
    }

    setError("")
    setTransactionSaving(true)

    try {
      // this sends only the note update to the backend.
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

      // this swaps the updated transaction into the current history list.
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
  
  // this sorts items on the client using the active sort settings.
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

  // these values are used by the summary cards and alerts.
  const totalItems = items.length
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalValue = items.reduce( (sum, item) => sum + item.quantity * item.price, 0)
  const lowStockItems = items.filter(
  (item) => item.quantity <= LOW_STOCK_THRESHOLD
)

  // this counts items by category for the summary section.
  const categoryCounts = items.reduce((counts, item) => {
    if (counts[item.category]) {
      counts[item.category]++
    } else {
      counts[item.category] = 1
    }

    return counts
  }, {})

  // this counts items by supplier for the summary section.
  const supplierCounts = items.reduce((counts, item) => {
    if (counts[item.supplier]) {
      counts[item.supplier]++
    } else {
      counts[item.supplier] = 1
    }

    return counts
  }, {})

  // these are past note values used in the movement suggestion list.
  const historicalReasonOptions = [...new Set(
    transactions
      .map((transaction) => transaction.note?.trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b))

  // these suggestions combine defaults with reasons already used before.
  const movementReasonOptions = [...new Set([
    ...(DEFAULT_MOVEMENT_REASONS[stockAction] || []),
    ...historicalReasonOptions,
  ])]

  // this finds the transaction currently being edited.
  const editingTransaction = transactions.find(
    (transaction) => transaction.id === editingTransactionId
  )

  // these note suggestions change based on the transaction being edited.
  const editingReasonOptions = editingTransaction
    ? [...new Set([
        ...(DEFAULT_MOVEMENT_REASONS[editingTransaction.change_type] || []),
        ...historicalReasonOptions,
      ])]
    : historicalReasonOptions


  return (
    <div className="app-shell">
      <div className="app-topbar">
        <div>
          {/* this is the main page heading. */}
          <h1 className="app-title">Inventory Management</h1>
        </div>

        <label className="theme-switcher">
          <span>Theme</span>
          <select
            value={themeMode}
            onChange={(event) => setThemeMode(event.target.value)}
          >
            <option value="day">Day</option>
            <option value="grey">Grey</option>
            <option value="night">Night</option>
          </select>
        </label>
      </div>

      {/* these show general app messages near the top. */}
      {error && <p className="app-message app-message-error">{error}</p>}
      {loading && <p className="app-message app-message-loading">Loading...</p>}

      {/* this shows the dashboard summary sections. */}
      <InventorySummary
        totalItems={totalItems}
        totalUnits={totalUnits}
        totalValue={totalValue}
        lowStockItems={lowStockItems}
        categoryCounts={categoryCounts}
        supplierCounts={supplierCounts}
      />

      {/* this shows the search controls for name and category. */}
      <SearchForm
        searchName={searchName}
        searchCategory={searchCategory}
        onSearchNameChange={setSearchName}
        onSearchCategoryChange={setSearchCategory}
        onSubmit={handleSearch}
        onClear={handleClearSearch}
      />

      {/* this shows the item create and edit form. */}
      <ItemForm
        name={name}
        quantity={quantity}
        price={price}
        category={category}
        supplier={supplier}
        editingId={editingId}
        supplierOptions={supplierOptions}
        onNameChange={setName}
        onQuantityChange={setQuantity}
        onPriceChange={setPrice}
        onCategoryChange={setCategory}
        onSupplierChange={setSupplier}
        onSubmit={handleSubmit}
        onCancelEdit={handleCancelEdit}
      />

      {/* this shows the main inventory table. */}
      <InventoryTable
        loading={loading}
        items={sortedItems}
        lowStockThreshold={LOW_STOCK_THRESHOLD}
        getSortLabel={getSortLabel}
        onSort={handleSort}
        onEdit={handleEdit}
        onShowHistory={handleSelectItem}
        onDelete={handleDelete}
      />

      {/* this shows transaction history and stock movement tools. */}
      <TransactionHistoryPanel
        selectedItem={selectedItem}
        transactions={transactions}
        historyLoading={historyLoading}
        historyError={historyError}
        historyTypeFilter={historyTypeFilter}
        historyPage={historyPage}
        historyHasMore={historyHasMore}
        stockAction={stockAction}
        stockAmount={stockAmount}
        stockNote={stockNote}
        stockLoading={stockLoading}
        editingTransactionId={editingTransactionId}
        editingTransactionNote={editingTransactionNote}
        transactionSaving={transactionSaving}
        movementReasonOptions={movementReasonOptions}
        editingReasonOptions={editingReasonOptions}
        formatTransactionType={formatTransactionType}
        formatDelta={formatDelta}
        onClose={() => {
          setSelectedItem(null)
          setTransactions([])
          setHistoryError("")
          setHistoryPage(0)
          setHistoryTypeFilter("all")
          setHistoryHasMore(false)
          setEditingTransactionId(null)
          setEditingTransactionNote("")
        }}
        onHistoryFilterChange={handleHistoryFilterChange}
        onStockActionChange={setStockAction}
        onStockAmountChange={setStockAmount}
        onStockNoteChange={setStockNote}
        onStockSubmit={handleStockSubmit}
        onEditTransaction={handleEditTransaction}
        onEditingTransactionNoteChange={setEditingTransactionNote}
        onSaveTransactionNote={handleSaveTransactionNote}
        onCancelTransactionEdit={handleCancelTransactionEdit}
        onHistoryPageChange={handleHistoryPageChange}
      />
    </div>
  )
}

export default App
