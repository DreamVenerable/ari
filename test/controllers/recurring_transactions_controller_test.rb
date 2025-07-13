require "test_helper"

class RecurringTransactionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    sign_in @user
    @recurring_transaction = recurring_transactions(:one)
  end

  test "should get index" do
    get recurring_transactions_url
    assert_response :success
  end

  test "should get new" do
    get new_recurring_transaction_url
    assert_response :success
  end

  test "should create recurring_transaction" do
    assert_difference('RecurringTransaction.count') do
      post recurring_transactions_url, params: { recurring_transaction: { amount: @recurring_transaction.amount, category: @recurring_transaction.category, description: @recurring_transaction.description, end_date: @recurring_transaction.end_date, frequency: @recurring_transaction.frequency, start_date: @recurring_transaction.start_date, transaction_type: @recurring_transaction.transaction_type, user_id: users(:one).id } }
    end

    assert_redirected_to recurring_transaction_url(RecurringTransaction.last)
  end

  test "should show recurring_transaction" do
    get recurring_transaction_url(@recurring_transaction)
    assert_response :success
  end

  test "should get edit" do
    get edit_recurring_transaction_url(@recurring_transaction)
    assert_response :success
  end

  test "should update recurring_transaction" do
    patch recurring_transaction_url(@recurring_transaction), params: { recurring_transaction: { amount: @recurring_transaction.amount, category: @recurring_transaction.category, description: @recurring_transaction.description, end_date: @recurring_transaction.end_date, frequency: @recurring_transaction.frequency, start_date: @recurring_transaction.start_date, transaction_type: @recurring_transaction.transaction_type, user_id: users(:one).id } }
    assert_redirected_to recurring_transaction_url(@recurring_transaction)
  end

  test "should destroy recurring_transaction" do
    assert_difference('RecurringTransaction.count', -1) do
      delete recurring_transaction_url(@recurring_transaction)
    end

    assert_redirected_to recurring_transactions_url
  end
end
