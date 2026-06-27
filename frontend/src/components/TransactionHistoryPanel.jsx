// this file shows the selected item's transaction history panel.
// it also renders stock movement controls and note editing ui.

// this component renders history, movement controls, and note editing.
function TransactionHistoryPanel({
  selectedItem,
  transactions,
  historyLoading,
  historyError,
  historyTypeFilter,
  historyPage,
  historyHasMore,
  stockAction,
  stockAmount,
  stockNote,
  stockLoading,
  editingTransactionId,
  editingTransactionNote,
  transactionSaving,
  movementReasonOptions,
  editingReasonOptions,
  formatTransactionType,
  formatDelta,
  onClose,
  onHistoryFilterChange,
  onStockActionChange,
  onStockAmountChange,
  onStockNoteChange,
  onStockSubmit,
  onEditTransaction,
  onEditingTransactionNoteChange,
  onSaveTransactionNote,
  onCancelTransactionEdit,
  onHistoryPageChange,
}) {
  return (
    // wraps the whole history area on the page.
    <section className="history-panel">
      <div className="history-header">
        <div>
          <h2>Transaction History</h2>
          <p>Review stock changes and record new movements here.</p>
        </div>

        {selectedItem && (
          <button type="button" onClick={onClose}>
            Close
          </button>
        )}
      </div>

      {!selectedItem && (
        // shown before an item is selected.
        <p>Select an item to inspect its quantity changes.</p>
      )}

      {selectedItem && (
        <>
          {/* tells the user which item's history is being viewed. */}
          <p className="history-selected-item">
            Showing history for <strong>{selectedItem.name}</strong> with current stock of{" "}
            <strong>{selectedItem.quantity}</strong>.
          </p>

          <div className="history-controls">
            {/* narrows the history list by movement type. */}
            <label>
              Filter
              <select
                value={historyTypeFilter}
                onChange={onHistoryFilterChange}
              >
                <option value="all">All Types</option>
                <option value="initial">Initial</option>
                <option value="stock_in">Stock In</option>
                <option value="stock_out">Stock Out</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </label>
          </div>

          {/* records new stock movements for the selected item. */}
          <form className="stock-form" onSubmit={onStockSubmit}>
            <label>
              Movement Type
              <select
                value={stockAction}
                onChange={(event) => onStockActionChange(event.target.value)}
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
                onChange={(event) => onStockAmountChange(event.target.value)}
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
                onChange={(event) => onStockNoteChange(event.target.value)}
                placeholder="Reason for this change"
                list="movement-reason-options"
              />
            </label>

            <button type="submit" disabled={stockLoading}>
              {stockLoading ? "Saving..." : "Record Movement"}
            </button>
          </form>

          {/* suggests common and past movement reasons. */}
          <datalist id="movement-reason-options">
            {movementReasonOptions.map((reasonOption) => (
              <option key={reasonOption} value={reasonOption} />
            ))}
          </datalist>

          {historyLoading && <p>Loading transaction history...</p>}
          {historyError && <p>{historyError}</p>}

          {/* shown when the item has no history on the current filter. */}
          {!historyLoading && !historyError && transactions.length === 0 && (
            <p>No transactions recorded for this item yet.</p>
          )}

          {!historyLoading && !historyError && transactions.length > 0 && (
            <>
              {/* shows the current page of transaction history. */}
              <table className="inventory-table transaction-table">
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
                    // creates one row for each transaction.
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
                            {/* lets the user fix a saved note. */}
                            <input
                              value={editingTransactionNote}
                              onChange={(event) => onEditingTransactionNoteChange(event.target.value)}
                              placeholder="Add a reason"
                              list="edit-movement-reason-options"
                            />
                            <button
                              type="button"
                              onClick={() => onSaveTransactionNote(transaction)}
                              disabled={transactionSaving}
                            >
                              {transactionSaving ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={onCancelTransactionEdit}
                              disabled={transactionSaving}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="transaction-note-display">
                            {/* shows the note and an edit button. */}
                            <span>{transaction.note || "No note"}</span>
                            <button
                              type="button"
                              onClick={() => onEditTransaction(transaction)}
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

              {/* suggests note values while editing a transaction. */}
              <datalist id="edit-movement-reason-options">
                {editingReasonOptions.map((reasonOption) => (
                  <option key={reasonOption} value={reasonOption} />
                ))}
              </datalist>

              <div className="history-pagination">
                {/* switches between history pages. */}
                <button
                  type="button"
                  onClick={() => onHistoryPageChange(historyPage - 1)}
                  disabled={historyPage === 0}
                >
                  Previous
                </button>
                <span>Page {historyPage + 1}</span>
                <button
                  type="button"
                  onClick={() => onHistoryPageChange(historyPage + 1)}
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
  )
}

export default TransactionHistoryPanel
