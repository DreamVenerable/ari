class CreateRecurringTransactions < ActiveRecord::Migration[8.0]
  def change
    create_table :recurring_transactions do |t|
      t.references :user, null: false, foreign_key: true
      t.decimal :amount
      t.string :category
      t.string :transaction_type
      t.string :frequency
      t.datetime :start_date
      t.datetime :end_date
      t.boolean :no_end_date, default: false
      t.text :description

      t.timestamps
    end
  end
end
