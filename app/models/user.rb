class User < ApplicationRecord
  has_secure_password
  has_many :sessions, dependent: :destroy
  has_many :transactions, dependent: :destroy
  has_many :recurring_transactions, dependent: :destroy

  normalizes :email_address, with: ->(e) { e.strip.downcase }

  def update_balance
    income = transactions.where(transaction_type: "Income").sum(:amount)
    expense = transactions.where(transaction_type: "Expense").sum(:amount)
    self.update(balance: income - expense)
  end

  def month_income
    transactions.where(transaction_type: "Income", created_at: Time.current.beginning_of_month..Time.current).sum(:amount)
  end

  def month_expense
    transactions.where(transaction_type: "Expense", created_at: Time.current.beginning_of_month..Time.current).sum(:amount)
  end
end
