class AddLastProcessedAtToRecurringTransactions < ActiveRecord::Migration[8.0]
  def change
    add_column :recurring_transactions, :last_processed_at, :date
  end
end
