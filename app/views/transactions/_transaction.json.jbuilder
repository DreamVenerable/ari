json.extract! transaction, :id, :user_id, :amount, :description, :category, :date, :created_at, :updated_at
json.url transaction_url(transaction, format: :json)
