class AddBalanceToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :balance, :decimal, precision: 10, scale: 2, default: 0.00
  end
end
