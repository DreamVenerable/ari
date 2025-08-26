import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [
    "recordButton",
    "recordingStatus",
    "transcriptionSection",
    "transcriptionText",
    "previewSection",
    "editTransactionButton",
    "previewAmount",
    "previewType",
    "previewCategory",
    "previewDescription",
    "previewDate",
    "transactionForm",
    "recurringTransactionForm",
    "previewFrequency",
    "previewStartDate",
    "previewEndDate",
    "previewNoEndDate",
    "isRecurringField",
    "recurringPreviewAmount",
    "recurringPreviewType",
    "recurringPreviewCategory",
    "recurringPreviewDescription",
    "recurringPreviewFrequency",
    "recurringPreviewStartDate",
    "recurringPreviewEndDate",
    "recurringEndDateField",
    "addRecurringEndDateButton",
    "removeRecurringEndDateButton"
  ]

  connect() {
    this.recognition = null
    this.isRecording = false
    this.transcriptBuffer = ""
    this.silenceTimeout = null
  }

  closeModal() {
    if (this.isRecording) {
      this.stopRecording()
    }
    
    const modal = document.getElementById('transaction-form-modal')
    if (modal) {
      modal.classList.add('hidden')
      if (this.hasTranscriptionSectionTarget) {
        this.transcriptionSectionTarget.classList.add('hidden')
      }
      if (this.hasPreviewSectionTarget) {
        this.previewSectionTarget.classList.add('hidden')
      }
    }
  }

  closeModalOnOutsideClick(event) {
    // Only close if clicking directly on the modal background (not its children)
    if (event.target.id === 'transaction-form-modal') {
      this.closeModal()
    }
  }

  stopPropagation(event) {
    // Prevent clicks inside the modal content from bubbling up to the modal background
    event.stopPropagation()
  }

  stopRecording() {
    if (this.isRecording && this.recognition) {
      clearTimeout(this.silenceTimeout)
      this.recognition.stop()
      this.isRecording = false

      if (this.hasRecordingStatusTarget) {
        this.recordingStatusTarget.textContent = "Ready"
        this.recordingStatusTarget.classList.remove("text-red-500")
        this.recordingStatusTarget.classList.add("text-slate-500")
      }
    }
  }

  startOrStopRecording() {
    if (!this.recognition || typeof this.recognition.stop !== "function") {
      this.recognition = this.initSpeechRecognition()
    }

    if (this.isRecording) {
      this.stopRecording()
    } else {
      // Reset everything to initial state
      this.transcriptBuffer = ""
      if (this.hasTranscriptionTextTarget) {
        this.transcriptionTextTarget.textContent = ""
      }
      
      // Hide modal sections if they're open
      if (this.hasTranscriptionSectionTarget) {
        this.transcriptionSectionTarget.classList.add("hidden")
      }
      if (this.hasPreviewSectionTarget) {
        this.previewSectionTarget.classList.add("hidden")
      }
      
      // Hide the modal overlay
      const modalOverlay = document.querySelector('#transaction-form-modal')
      if (modalOverlay) {
        modalOverlay.classList.add("hidden")
      }
      
      // Start recording
      requestAnimationFrame(() => {
        setTimeout(() => {
          try {
            this.recognition.start()
          } catch (e) {
            console.error("Speech recognition failed to start:", e)
            alert("Speech recognition failed to start. Try reloading.")
          }
        }, 100)
      })
    }
  }



  editTransaction() {
    this.previewAmountTarget?.focus()
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Sorry, your browser does not support Speech Recognition.")
      return null
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "en-CA"
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onstart = () => {
      this.isRecording = true
      this.transcriptBuffer = ""
      this.recordButtonTarget.classList.add("bg-red-600", "hover:bg-red-700")
      this.recordingStatusTarget.classList.remove("hidden")
      
      // Show the modal and transcription section when recording starts
      const modalOverlay = document.querySelector('#transaction-form-modal')
      if (modalOverlay) {
        modalOverlay.classList.remove("hidden")
        // Ensure the transcription section is visible and preview is hidden
        this.transcriptionSectionTarget.classList.remove("hidden")
        this.transcriptionTextTarget.textContent = ""
        this.previewSectionTarget.classList.add("hidden")
      } else {
        console.error("Modal overlay not found")
      }
    }

    recognition.onresult = (event) => {
      let interimTranscript = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          this.transcriptBuffer += transcript
        } else {
          interimTranscript += transcript
        }
      }

      clearTimeout(this.silenceTimeout)
      this.silenceTimeout = setTimeout(() => {
        if (this.isRecording) {
          recognition.stop()
        }
      }, 1000)
      
      // Show transcription in real-time while speaking
      const modalOverlay = document.querySelector('#transaction-form-modal')
      if (modalOverlay) {
        // Ensure the modal is visible
        modalOverlay.classList.remove("hidden")
        // Ensure the transcription section is visible
        this.transcriptionSectionTarget.classList.remove("hidden")
        // Update the transcription text
        this.transcriptionTextTarget.textContent = this.transcriptBuffer + interimTranscript
      } else {
        console.error("Modal overlay not found")
        // Even if modal is not found, try to update the transcription
        this.transcriptionSectionTarget.classList.remove("hidden")
        this.transcriptionTextTarget.textContent = this.transcriptBuffer + interimTranscript
      }
    }

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event)
      alert("Error recognizing speech. Try again.")
    }

    recognition.onend = () => {
      clearTimeout(this.silenceTimeout)
      this.isRecording = false
      this.recordButtonTarget.classList.remove("bg-red-600", "hover:bg-red-700")
      this.recordingStatusTarget.classList.add("hidden")

      if (this.transcriptBuffer.trim().length > 0) {
        this.processTranscription(this.transcriptBuffer.trim())
      } else {
        alert("No speech was detected. Please try again.")
      }
    }

    return recognition
  }

  async processTranscription(text) {
    try {
      const res = await fetch("/voice/process_audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": this.getCsrfToken(),
        },
        body: JSON.stringify({ transcription: text }),
      })

      const data = await res.json()

      if (data.success) {
        if (data.redirect_url) {
          window.location.href = data.redirect_url
        } else {
          // First ensure the modal is visible
          const modalOverlay = document.querySelector('#transaction-form-modal')
          if (modalOverlay) {
            modalOverlay.classList.remove("hidden")
          } else {
            console.error("Modal overlay not found")
          }
          
          // Hide the transcription section and show the preview section
          this.transcriptionSectionTarget.classList.add("hidden")
          this.fillTransactionPreview(data.transaction_data)
          this.previewSectionTarget.classList.remove("hidden")
        }
      } else {
        alert(data.error || "Could not process transcription.")
      }
    } catch (err) {
      console.error("Error processing transcription:", err)
      alert("Error occurred while processing your voice input.")
    }
  }

  fillTransactionPreview(data) {
    console.log("fillTransactionPreview called with data:", data);
    console.log("is_recurring value from data:", data.is_recurring);
    console.log("Type of is_recurring:", typeof data.is_recurring);
    console.log("form_type value from data:", data.form_type);

    if (!!data.is_recurring) {
      console.log("Attempting to show recurring transaction form and hide regular transaction form.");
      this.recurringTransactionFormTarget.classList.remove("hidden")
      this.transactionFormTarget.classList.add("hidden")
      console.log("Recurring transaction form visibility after update:", this.recurringTransactionFormTarget.classList.contains('hidden') ? 'hidden' : 'visible');
      console.log("Regular transaction form visibility after update:", this.transactionFormTarget.classList.contains('hidden') ? 'hidden' : 'visible');
      // Assuming you have targets for recurring transaction fields as well
      // For now, just filling the common ones
      this.recurringPreviewAmountTarget.value = data.amount
      this.recurringPreviewTypeTarget.value = data.transaction_type
      this.recurringPreviewCategoryTarget.value = data.category
      this.recurringPreviewDescriptionTarget.value = data.description
      this.recurringPreviewFrequencyTarget.value = data.frequency
      this.recurringPreviewStartDateTarget.value = data.start_date
      this.recurringPreviewEndDateTarget.value = data.end_date
      this.isRecurringFieldTarget.value = 'true';
      console.log("Recurring transaction form visibility:", this.recurringTransactionFormTarget.classList.contains('hidden') ? 'hidden' : 'visible');
      console.log("Regular transaction form visibility:", this.transactionFormTarget.classList.contains('hidden') ? 'hidden' : 'visible');
    } else {
      console.log("Attempting to show regular transaction form and hide recurring transaction form.");
      this.isRecurringFieldTarget.value = 'false';
      this.transactionFormTarget.classList.remove("hidden");
      this.recurringTransactionFormTarget.classList.add("hidden")
      console.log("Recurring transaction form visibility after update:", this.recurringTransactionFormTarget.classList.contains('hidden') ? 'hidden' : 'visible');
      console.log("Regular transaction form visibility after update:", this.transactionFormTarget.classList.contains('hidden') ? 'hidden' : 'visible');
      this.previewAmountTarget.value = data.amount
      this.previewTypeTarget.value = data.transaction_type
      this.previewCategoryTarget.value = data.category
      this.previewDescriptionTarget.value = data.description
      this.previewDateTarget.value = data.date
    }

    // Handle visibility of recurring end date field
    if (data.is_recurring && (data.end_date === null || data.end_date === "")) {
      this.recurringEndDateFieldTarget.classList.add("hidden");
      this.addRecurringEndDateButtonTarget.classList.remove("hidden");
    } else if (data.is_recurring && data.end_date !== null && data.end_date !== "") {
      this.recurringEndDateFieldTarget.classList.remove("hidden");
      this.addRecurringEndDateButtonTarget.classList.add("hidden");
      this.removeRecurringEndDateButtonTarget.classList.remove("hidden");
    }
  }

  addRecurringEndDate() {
    this.recurringEndDateFieldTarget.classList.remove("hidden");
    this.addRecurringEndDateButtonTarget.classList.add("hidden");
    this.removeRecurringEndDateButtonTarget.classList.remove("hidden");
  }

  removeRecurringEndDate() {
    this.recurringPreviewEndDateTarget.value = "";
    this.recurringEndDateFieldTarget.classList.add("hidden");
    this.addRecurringEndDateButtonTarget.classList.remove("hidden");
    this.removeRecurringEndDateButtonTarget.classList.add("hidden");
  }

  getCsrfToken() {
    return document.querySelector("meta[name='csrf-token']")?.getAttribute("content")
  }
}
