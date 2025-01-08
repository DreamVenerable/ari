class AddTransactionTypeToTransactions < ActiveRecord::Migration[8.0]
  def change
    add_column :transactions, :transaction_type, :string
  end
end
