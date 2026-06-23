import { useEffect, useState } from "react" 

function App() {
  const [items, setItems] = useState([])

  useEffect(() => {
    fetch("http://127.0.0.1:8000/items")
      .then((response) => response.json())
      .then((data) => {
        setItems(data)
      })
      .catch((error) => {
        console.error(error)
      })
  }, [])

  return (
    <div>
      <h1>Inventory Management</h1>

        <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Category</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App