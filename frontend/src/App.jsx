import { useEffect, useState } from "react"

function App() {
  const [items, setItems] = useState([])

  const [name, setName] = useState("")
  const [quantity, setQuantity] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("")
  const [editingId, setEditingId] = useState(null)

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

  return (
    <div>
      <h1>Inventory Management</h1>

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
            <th>ID</th>
            <th>Name</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => (
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