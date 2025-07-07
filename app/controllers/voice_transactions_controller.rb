class VoiceTransactionsController < ApplicationController

  def new
    # Build a blank transaction regardless of login status, JS will handle auth if needed
    @transaction = Current.user ? Current.user.transactions.build : Transaction.new
  end

  def process_audio
    transcription = params[:transcription].to_s.strip
    if transcription.blank?
      return render json: { success: false, error: "No transcription provided" }, status: :bad_request
    end

    parsed_data = parse_transaction_from_text(transcription)
    render json: { success: true, transaction_data: parsed_data }
  rescue => e
    render json: { success: false, error: "Processing failed: #{e.message}" }, status: :internal_server_error
  end

  def create_from_voice
    unless Current.user
      return render json: {
        success: false,
        error: "Authentication required",
        redirect_url: new_session_path
      }, status: :unauthorized
    end

    @transaction = Current.user.transactions.build(transaction_params)

    if @transaction.save
      render json: {
        success: true,
        transaction: @transaction,
        message: "Transaction created successfully",
        redirect_url: transaction_path(@transaction)
      }
    else
      render json: { success: false, errors: @transaction.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def transaction_params
    params.require(:transaction).permit(:amount, :transaction_type, :description, :category, :date)
  end

  def parse_transaction_from_text(text)
    text = text.downcase.strip
    amount = text[/\$?(\d+(?:\.\d{1,2})?)/, 1]&.to_f

    data = {
      amount: amount,
      transaction_type: infer_type(text),
      category: infer_category(text),
      description: text,
      date: Date.current.to_s
    }

    data
  end

  def infer_type(text)
    income = %w[earned received income salary bonus refund gift found gained]
    expense = %w[spent bought paid purchase cost expense lost donated]
    text_down = text.downcase

    return "Income" if income.any? { |w| text_down.include?(w) }
    return "Expense" if expense.any? { |w| text_down.include?(w) }
    "Unknown"
  end

  def infer_category(text)
    categories = {
      "Food" => %w[food restaurant lunch dinner breakfast coffee grocery],
      "Transport" => %w[gas fuel uber taxi bus train parking],
      "Entertainment" => %w[movie cinema game concert show],
      "Shopping" => %w[clothes shirt shoes shopping store],
      "Bills" => %w[bill electricity water internet phone rent],
      "Health" => %w[doctor medicine pharmacy hospital medical]
    }
    categories.each do |name, keywords|
      return name if keywords.any? { |w| text.include?(w) }
    end
    "Other"
  end
end
