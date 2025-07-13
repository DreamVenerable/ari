class ProcessRecurringTransactionJob < ApplicationJob
  queue_as :default

  def perform(recurring_transaction_id = nil)
    if recurring_transaction_id
      recurring_transaction = RecurringTransaction.find(recurring_transaction_id)
      process_single_transaction(recurring_transaction)
    else
      RecurringTransaction.find_each do |recurring_transaction|
        process_single_transaction(recurring_transaction)
      end
    end
  end

  private

  def process_single_transaction(recurring_transaction)
      if recurring_transaction.due?
        transaction_type = recurring_transaction.transaction_type.capitalize
        Transaction.create!(
          user: recurring_transaction.user,
          amount: recurring_transaction.amount,
          category: recurring_transaction.category,
          transaction_type: transaction_type,
          date: Date.current
        )
        recurring_transaction.update!(last_processed_at: Date.current)
      else
      end
  end
end
