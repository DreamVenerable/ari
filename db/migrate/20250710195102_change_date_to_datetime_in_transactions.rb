class ChangeDateToDatetimeInTransactions < ActiveRecord::Migration[8.0]
  def change
    change_column :transactions, :date, :datetime
  end
end
