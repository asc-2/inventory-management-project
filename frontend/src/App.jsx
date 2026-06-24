import { useEffect, useState } from "react"

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

  const fetchItems = () => {
    fetch("http://127.0.0.1:8000/items")
      .then((response) => response.json())
      .then((data) => {
        setItems(data)
      })
      .catch((error) => {
        console.error(error)
      })
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleDelete = async (id) => {
    await fetch(`http://127.0.0.1:8000/items/${id}`, {
      method: "DELETE",
    })

    fetchItems()
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

    const itemData = {
      name,
      quantity: Number(quantity),
      price: Number(price),
      category,
    }

    if (editingId) {
      await fetch(`http://127.0.0.1:8000/items/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(itemData),
      })
    } else {
      await fetch("http://127.0.0.1:8000/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(itemData),
      })
    }

    setName("")
    setQuantity("")
    setPrice("")
    setCategory("")
    setEditingId(null)

    fetchItems()
  } 

  const handleSearch = async (event) => {
    event.preventDefault()

    const params = new URLSearchParams()

    if (searchName) {
      params.append("name", searchName)
    }

    if (searchCategory) {
      params.append("category", searchCategory)
    }

    const response = await fetch(`http://127.0.0.1:8000/items/search?${params}`)
    const data = await response.json()

    setItems(data)
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
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

  return (
    <div>
      <h1>Inventory Management</h1>

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
        <button type="button" onClick={fetchItems}>Clear</button>
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
      </form>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th onClick={() => handleSort("id")}>ID</th>
            <th onClick={() => handleSort("name")}>Name</th>
            <th onClick={() => handleSort("quantity")}>Quantity</th>
            <th onClick={() => handleSort("price")}>Price</th>
            <th onClick={() => handleSort("category")}>Category</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {sortedItems.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td>{item.quantity}</td>
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