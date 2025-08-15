class VoiceController < ApplicationController
  def new
    # Build a blank transaction regardless of login status, JS will handle auth if needed
    @transaction = Current.user ? Current.user.transactions.build : Transaction.new
  end

  def process_audio
    transcription = params[:transcription].to_s.strip
    puts "DEBUG: Received transcription: #{transcription}"
    if transcription.blank?
      return render json: { success: false, error: "No transcription provided" }, status: :bad_request
    end

    parsed_data = parse_transaction_from_text(transcription)
    puts "DEBUG: Parsed data: #{parsed_data.inspect}"
    form_type = parsed_data[:is_recurring] ? "recurring_transaction" : "transaction"
    puts "DEBUG: Inferred form_type: #{form_type}"
    render json: { success: true, transaction_data: parsed_data.merge(is_recurring: parsed_data[:is_recurring]), form_type: form_type }
  rescue => e
    render json: { success: false, error: "Processing failed: #{e.message}" }, status: :internal_server_error
  end

  def create_from_voice
    puts "DEBUG: create_from_voice params: #{params.inspect}"
    unless Current.user
      return render json: {
        success: false,
        error: "Authentication required",
        redirect_url: new_session_path
      }, status: :unauthorized
    end

    if params[:recurring_transaction].present?
      puts "DEBUG: Attempting to create recurring transaction."
      @recurring_transaction = Current.user.recurring_transactions.build(recurring_transaction_form_params)

      respond_to do |format|
        if @recurring_transaction.save
          format.html { redirect_to recurring_transactions_path, notice: "Recurring transaction was successfully created." }
          format.json { render json: @recurring_transaction, status: :created, location: @recurring_transaction }
        else
          puts "DEBUG: Recurring transaction save failed: #{@recurring_transaction.errors.full_messages.join(', ')}"
          format.html { render :new, status: :unprocessable_entity }
          format.json { render json: @recurring_transaction.errors, status: :unprocessable_entity }
        end
      end
    elsif params[:transaction].present?
      puts "DEBUG: Attempting to create regular transaction."
      @transaction = Current.user.transactions.build(transaction_form_params)

      respond_to do |format|
        if @transaction.save
          format.html { redirect_to root_path, notice: "Transaction was successfully created." }
          format.json { render json: @transaction, status: :created, location: @transaction }
        else
          puts "DEBUG: Regular transaction save failed: #{@transaction.errors.full_messages.join(', ')}"
          format.html { render :new, status: :unprocessable_entity }
          format.json { render json: @transaction.errors, status: :unprocessable_entity }
        end
      end
    else
      puts "DEBUG: No transaction or recurring_transaction parameters found."
      render json: { success: false, error: "Invalid parameters" }, status: :bad_request
    end
  end

  private

  def transaction_form_params
    params.require(:transaction).permit(:amount, :transaction_type, :description, :category, :date)
  end

  def recurring_transaction_form_params
    params.require(:recurring_transaction).permit(:amount, :transaction_type, :description, :category, :frequency, :start_date, :end_date, :no_end_date)
  end

  # This method is used by process_audio to pre-fill the form data


  def parse_transaction_from_text(text)
    puts "DEBUG: parse_transaction_from_text input: #{text}"
    text = text.downcase.strip
    amount = text[/\$?(\d+(?:\.\d{1,2})?)/, 1]&.to_f

    is_recurring = recurring_keywords.any? { |keyword| text.include?(keyword) }
    puts "DEBUG: is_recurring: #{is_recurring}"

    data = {
      amount: amount,
      transaction_type: infer_type(text),
      category: infer_category(text),
      description: text.presence || "", # Ensure description is always present
      is_recurring: is_recurring
    }

    if is_recurring
      data[:date] = Date.current.to_s # Set date as a date string for recurring transactions
      data[:frequency] = infer_frequency(text)
      end_date_info = infer_end_date(text)
      data[:end_date] = end_date_info[:date]
      data[:no_end_date] = end_date_info[:no_end_date]
    else
      data[:date] = Time.current.strftime("%Y-%m-%dT%H:%M") # Keep datetime for regular transactions
    end

    data
  end

  def infer_type(text)
    income = %w[earned received income salary bonus refund gift found gained gave\ me]
    expense = %w[spent bought paid purchase cost expense lost donated gave]
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

  def recurring_keywords
    %w[every each recurring monthly weekly daily yearly annually]
  end

  def infer_frequency(text)
    if text.include?("daily") || text.include?("every day")
      "daily"
    elsif text.include?("weekly") || text.include?("every week")
      "weekly"
    elsif text.include?("monthly") || text.include?("every month")
      "monthly"
    elsif text.include?("yearly") || text.include?("annually") || text.include?("every year")
      "yearly"
    else
      "monthly" # Default to monthly if no specific frequency is mentioned
    end
  end

  def infer_end_date(text)
    # Basic implementation for now. Can be expanded with more sophisticated NLP for dates.
    # Examples: "until next week", "for this month", "until September 3rd"

    if text.include?("no end date") || text.include?("indefinitely")
      return { date: nil, no_end_date: true }
    end

    # Simple date parsing (e.g., "September 3rd", "next week", "next month")
    # This is a very basic example and would need a robust date parsing library (e.g., Chronic) for production.
    if text.match(/until (\w+ \d{1,2}(?:st|nd|rd|th)?)/i)
      date_str = text.match(/until (\w+ \d{1,2}(?:st|nd|rd|th)?)/i)[1]
      begin
        date = Date.parse(date_str)
        # Assume upcoming date if year is not specified and parsed date is in the past
        date = date.next_year if date < Date.current
        return { date: date.end_of_day, no_end_date: false }
      rescue ArgumentError
        # Fallback if date parsing fails
      end
    elsif text.include?("until next week")
      return { date: Date.current.end_of_week.end_of_day, no_end_date: false }
    elsif text.include?("for this month") || text.include?("until end of month")
      return { date: Date.current.end_of_month.end_of_day, no_end_date: false }
    elsif text.include?("until next month")
      return { date: Date.current.next_month.end_of_month.end_of_day, no_end_date: false }
    end

    { date: nil, no_end_date: true } # Default to no end date if not specified or parsed
  end
end
