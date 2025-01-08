class Transaction < ApplicationRecord
  belongs_to :user

  # Validations
  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :category, presence: true
  validates :date, presence: true
  validates :transaction_type, presence: true, inclusion: { in: %w[Income Expense], message: "%{value} is not a valid transaction type" }

  # Actions
  after_create :update_user_balance
  after_update :update_user_balance
  after_destroy :update_user_balance

  private

  def update_user_balance
    user.update_balance
  end
end
