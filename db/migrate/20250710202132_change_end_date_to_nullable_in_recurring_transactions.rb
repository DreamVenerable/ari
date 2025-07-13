class ChangeEndDateToNullableInRecurringTransactions < ActiveRecord::Migration[8.0]
  def change
    change_column_null :recurring_transactions, :end_date, true
  end
end
