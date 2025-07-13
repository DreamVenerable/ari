require "test_helper"

class ProcessRecurringTransactionJobTest < ActiveJob::TestCase
  include ActiveJob::TestHelper

  setup do
    RecurringTransaction.delete_all
    Transaction.delete_all
    @user = users(:one)
    @recurring_transaction = RecurringTransaction.create!(
      user: @user,
      amount: 50.00,
      category: "Utilities",
      transaction_type: "expense",
      frequency: "daily",
      start_date: Date.current - 1.day,
      last_processed_at: Date.current - 1.day
    )
  end

  test "should process recurring transaction and create new transaction" do
    assert_difference("Transaction.count", 1) do
      perform_enqueued_jobs do
        ProcessRecurringTransactionJob.perform_now(@recurring_transaction.id)
      end
    end

    @recurring_transaction.reload
    assert_equal Date.current, @recurring_transaction.last_processed_at
  end

  test "should not process recurring transaction if not due" do
    @recurring_transaction.update!(last_processed_at: Date.current)

    assert_no_difference("Transaction.count") do
      perform_enqueued_jobs do
        ProcessRecurringTransactionJob.perform_now
      end
    end
  end

  test "should process recurring transaction with no_end_date" do
    recurring_transaction_no_end_date = RecurringTransaction.create!(
      user: @user,
      amount: 100.00,
      category: "Salary",
      transaction_type: "income",
      frequency: "daily",
      start_date: Date.current - 1.day,
      last_processed_at: Date.current - 1.day,
      no_end_date: true
    )

    assert_difference("Transaction.count", 1) do
      perform_enqueued_jobs do
        ProcessRecurringTransactionJob.perform_now(recurring_transaction_no_end_date.id)
      end
    end

    recurring_transaction_no_end_date.reload
    assert_equal Date.current, recurring_transaction_no_end_date.last_processed_at
  end
end
