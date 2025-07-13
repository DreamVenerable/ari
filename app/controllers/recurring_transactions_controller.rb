class RecurringTransactionsController < ApplicationController
  before_action :set_recurring_transaction, only: [:show, :edit, :update, :destroy]

  def index
    @recurring_transactions = Current.user.recurring_transactions
  end

  def show
  end

  def new
    @recurring_transaction = Current.user.recurring_transactions.build
  end

  def create
    @recurring_transaction = Current.user.recurring_transactions.build(recurring_transaction_params)

    respond_to do |format|
      if @recurring_transaction.save
        format.html { redirect_to @recurring_transaction, notice: "Recurring transaction was successfully created." }
        format.json { render :show, status: :created, location: @recurring_transaction }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @recurring_transaction.errors, status: :unprocessable_entity }
      end
    end
  end

  def edit
  end

  def update
    if @recurring_transaction.update(recurring_transaction_params)
      redirect_to @recurring_transaction, notice: 'Recurring transaction was successfully updated.'
    else
      render :edit
    end
  end

  def destroy
    @recurring_transaction.destroy
    redirect_to recurring_transactions_url, notice: 'Recurring transaction was successfully destroyed.'
  end

  private
    def set_recurring_transaction
      @recurring_transaction = Current.user.recurring_transactions.find(params[:id])
    end

    def recurring_transaction_params
      params.require(:recurring_transaction).permit(:amount, :category, :transaction_type, :frequency, :start_date, :end_date, :description, :no_end_date).tap do |whitelisted_params|
        if whitelisted_params[:no_end_date] == '1'
          whitelisted_params[:end_date] = nil
        end

      end
    end
end
