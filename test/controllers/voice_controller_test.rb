require "test_helper"

class VoiceControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    sign_in @user
  end

  test "should get new" do
    get new_voice_url
    assert_response :success
  end

  test "should process audio with valid transcription" do
    post process_audio_voice_url, params: { transcription: "spent 10 dollars on food" }, as: :json
    assert_response :success
    json_response = JSON.parse(@response.body)
    assert json_response["success"]
    assert_equal 10.0, json_response["transaction_data"]["amount"]
    assert_equal "Expense", json_response["transaction_data"]["transaction_type"]
    assert_equal "Food", json_response["transaction_data"]["category"]
  end

  test "should not process audio with blank transcription" do
    post process_audio_voice_url, params: { transcription: "" }, as: :json
    assert_response :bad_request
    json_response = JSON.parse(@response.body)
    assert_not json_response["success"]
    assert_equal "No transcription provided", json_response["error"]
  end

  test "should create transaction from voice with valid data" do
    assert_difference("Transaction.count") do
      post create_from_voice_voice_url, params: { transaction: { amount: 20.0, transaction_type: "Expense", description: "test voice transaction", category: "Other", date: Date.current } }, as: :json
    end
    assert_response :created
    json_response = JSON.parse(@response.body)
    assert json_response["id"]
  end

  test "should not create transaction from voice without authentication" do
    sign_out @user # Sign out the user to test unauthenticated access
    post create_from_voice_voice_url, params: { transaction: { amount: 20.0, transaction_type: "Expense", description: "test voice transaction", category: "Other", date: Date.current } }, as: :json
    assert_response :unauthorized
  end

  test "should not create transaction from voice with invalid data" do
    post create_from_voice_voice_url, params: { transaction: { amount: nil, transaction_type: "Expense" } }, as: :json
    assert_response :unprocessable_entity
    json_response = JSON.parse(@response.body)
    assert json_response["amount"].present?
  end
end
