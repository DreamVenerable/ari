class TransactionsController < ApplicationController
  before_action :set_transaction, only: %i[ show edit update destroy ]
  before_action :authorize_transaction, only: %i[show edit update destroy]

  # GET /transactions or /transactions.json
  def index
    @transactions = Current.user.transactions
  end

  # GET /transactions/1 or /transactions/1.json
  def show
  end

  # GET /transactions/new
  def new
    @transaction = Current.user.transactions.build
  end

  # GET /transactions/1/edit
  def edit
  end

  # POST /transactions or /transactions.json
  def create
    @transaction = Current.user.transactions.build(transaction_params)

    respond_to do |format|
      if @transaction.save
        format.html { redirect_to @transaction, notice: "Transaction was successfully created." }
        format.json { render :show, status: :created, location: @transaction }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @transaction.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /transactions/1 or /transactions/1.json
  def update
    respond_to do |format|
      if @transaction.update(transaction_params)
        format.html { redirect_to @transaction, notice: "Transaction was successfully updated." }
        format.json { render :show, status: :ok, location: @transaction }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @transaction.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /transactions/1 or /transactions/1.json
  def destroy
    @transaction.destroy!

    respond_to do |format|
      format.html { redirect_to transactions_path, status: :see_other, notice: "Transaction was successfully destroyed." }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_transaction
      begin
        @transaction = Transaction.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        respond_to do |format|
          format.html { redirect_to transactions_path, status: :see_other, notice: "Transaction does not exist" }
          format.json { head :no_content }
        end
      end
    end

    # Verify the transaction belongs to the logged-in user
    def authorize_transaction
      respond_to do |format|
        format.html { redirect_to transactions_path, status: :see_other, notice: "Transaction does not exist" }
        format.json { head :no_content }
      end unless @transaction.user == Current.user
    end

    # Only allow a list of trusted parameters through.
    def transaction_params
      params.expect(transaction: [ :user_id, :amount, :transaction_type, :description, :category, :date ])
    end
end
