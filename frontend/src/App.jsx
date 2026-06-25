import { useEffect, useState } from "react"
import "./App.css"

const API_URL = "http://127.0.0.1:8000"
const LOW_STOCK_THRESHOLD = 5

function App() {
  const [items, setItems] = useState([])

  const [name, setName] = useState("")
  const [quantity, setQuantity] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("")
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

  useEffect(() => {
    fetchItems()
  }, [])

  const handleDelete = async (id) => {
    setError("")

    try {
      const response = await fetch(`${API_URL}/items/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete item")
      }

      fetchItems()
    } catch (error) {
      console.error(error)
      setError("Could not delete item.")
    }
  }
  const handleEdit = (item) => {
    setEditingId(item.id)
    setName(item.name)
    setQuantity(item.quantity)
    setPrice(item.price)
    setCategory(item.category)
  }
  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")

    if (!name.trim() || !quantity || !price || !category.trim()) {
      setError("Please fill out all item fields.")
      return
    }

    if (Number(quantity) < 0 || Number(price) < 0) {
      setError("Quantity and price cannot be negative.")
      return
    }

    const itemData = {
      name: name.trim(),
      quantity: Number(quantity),
      price: Number(price),
      category: category.trim(),
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
          body: JSON.stringify(itemData),
        })
      }

      if (!response.ok) {
        throw new Error("Failed to save item")
      }

      setName("")
      setQuantity("")
      setPrice("")
      setCategory("")
      setEditingId(null)

      fetchItems()
    } catch (error) {
      console.error(error)
      setError("Could not save item. Check that all fields are valid.")
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
          placeholder="Quantity"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
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

        <button type="submit">
          {editingId ? "Update Item" : "Add Item"}
        </button>

        {editingId && (
          <button type="button" onClick={handleCancelEdit}>
            Cancel Edit
          </button>
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
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {!loading && sortedItems.length === 0 && (
            <tr>
              <td colSpan="6">No items found.</td>
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
              <td>
                <button onClick={() => handleEdit(item)}>
                  Edit
                </button>

                <button onClick={() => handleDelete(item.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App
