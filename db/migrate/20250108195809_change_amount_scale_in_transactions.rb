class ChangeAmountScaleInTransactions < ActiveRecord::Migration[8.0]
  def change
    change_column :transactions, :amount, :decimal, precision: 10, scale: 2
  end
end
