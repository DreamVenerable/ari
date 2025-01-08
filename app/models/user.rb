class User < ApplicationRecord
  has_secure_password
  has_many :sessions, dependent: :destroy
  has_many :transactions, dependent: :destroy

  normalizes :email_address, with: ->(e) { e.strip.downcase }

  def update_balance
    income = transactions.where(transaction_type: "Income").sum(:amount)
    expense = transactions.where(transaction_type: "Expense").sum(:amount)
    self.update(balance: income - expense)
  end
end
