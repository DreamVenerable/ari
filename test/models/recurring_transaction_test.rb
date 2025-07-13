require "test_helper"

class RecurringTransactionTest < ActiveSupport::TestCase
  test "should create recurring transaction" do
    user = users(:one)
    recurring_transaction = RecurringTransaction.new(
      user: user,
      amount: 10.00,
      category: "Food",
      transaction_type: "expense",
      frequency: "monthly",
      start_date: Date.current,
      end_date: Date.current + 1.year,
      description: "Test recurring transaction"
    )
    assert recurring_transaction.save, "Failed to save recurring transaction: #{recurring_transaction.errors.full_messages.join(', ')}"
  end

  test "should create open-ended recurring transaction without end date" do
    user = users(:one)
    recurring_transaction = RecurringTransaction.new(
      user: user,
      amount: 20.00,
      category: "Rent",
      transaction_type: "expense",
      frequency: "monthly",
      start_date: Date.current,
      description: "Open-ended recurring transaction",
      no_end_date: true
    )
    assert recurring_transaction.save, "Failed to save open-ended recurring transaction: #{recurring_transaction.errors.full_messages.join(', ')}"
    assert_nil recurring_transaction.end_date, "End date should be nil for open-ended transaction"
  end
end