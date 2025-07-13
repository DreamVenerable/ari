require "test_helper"

class RecurringTransactionsRoutingTest < ActionDispatch::IntegrationTest
  test "should route to recurring_transactions index" do
    assert_routing '/recurring_transactions', { controller: 'recurring_transactions', action: 'index' }
  end

  test "should route to new recurring_transaction" do
    assert_routing '/recurring_transactions/new', { controller: 'recurring_transactions', action: 'new' }
  end

  test "should route to create recurring_transaction" do
    assert_routing({ method: 'post', path: '/recurring_transactions' }, { controller: 'recurring_transactions', action: 'create' })
  end

  test "should route to show recurring_transaction" do
    assert_routing '/recurring_transactions/1', { controller: 'recurring_transactions', action: 'show', id: '1' }
  end

  test "should route to edit recurring_transaction" do
    assert_routing '/recurring_transactions/1/edit', { controller: 'recurring_transactions', action: 'edit', id: '1' }
  end

  test "should route to update recurring_transaction" do
    assert_routing({ method: 'patch', path: '/recurring_transactions/1' }, { controller: 'recurring_transactions', action: 'update', id: '1' })
  end

  test "should route to destroy recurring_transaction" do
    assert_routing({ method: 'delete', path: '/recurring_transactions/1' }, { controller: 'recurring_transactions', action: 'destroy', id: '1' })
  end
end