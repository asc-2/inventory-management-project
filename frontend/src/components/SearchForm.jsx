// this file renders the simple search form for the inventory list.
// it lets the parent component control the input values and actions.

// this component only renders the search inputs and buttons.
function SearchForm({
  searchName,
  searchCategory,
  onSearchNameChange,
  onSearchCategoryChange,
  onSubmit,
  onClear,
}) {
  return (
    // searches by name and category.
    <form className="inventory-form inventory-search-form" onSubmit={onSubmit}>
      <input
        placeholder="Search by name"
        value={searchName}
        onChange={(event) => onSearchNameChange(event.target.value)}
      />

      <input
        placeholder="Search by category"
        value={searchCategory}
        onChange={(event) => onSearchCategoryChange(event.target.value)}
      />

      <button type="submit">Search</button>
      <button type="button" onClick={onClear}>Clear</button>
    </form>
  )
}

export default SearchForm
