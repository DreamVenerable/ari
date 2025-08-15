class RecurringTransaction < ApplicationRecord
  belongs_to :user

  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :category, presence: true
  validates :transaction_type, presence: true, inclusion: { in: %w[income expense] }
  validates :frequency, presence: true, inclusion: { in: %w[daily weekly monthly yearly] }
  validates :start_date, presence: true
  validates :description, presence: true

  attribute :no_end_date, :boolean, default: false

  def due?
    return false if end_date && end_date < Date.current

    if last_processed_at.nil?
      start_date <= Date.current
    else
      case frequency
      when "daily"
        last_processed_at < Date.current
      when "weekly"
        last_processed_at < 1.week.ago(Date.current)
      when "monthly"
        last_processed_at < 1.month.ago(Date.current)
      when "yearly"
        last_processed_at < 1.year.ago(Date.current)
      else
        false
      end
    end
  end
end
