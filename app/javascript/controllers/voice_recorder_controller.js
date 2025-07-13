import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [
    "recordButton",
    "recordingStatus",
    "transcriptionSection",
    "transcriptionText",
    "previewSection",
    "recordAgainButton",
    "editTransactionButton",
    "previewAmount",
    "previewType",
    "previewCategory",
    "previewDescription",
    "previewDate"
  ]

  connect() {
    this.recognition = null
    this.isRecording = false
    this.transcriptBuffer = ""
    this.silenceTimeout = null
  }

  startOrStopRecording() {
    if (!this.recognition || typeof this.recognition.stop !== "function") {
      this.recognition = this.initSpeechRecognition()
    }

    if (this.isRecording) {
      clearTimeout(this.silenceTimeout)
      this.recognition.stop()
    } else {
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

  recordAgain() {
    this.transcriptBuffer = ""
    this.transcriptionTextTarget.textContent = ""
    this.transcriptionSectionTarget.classList.add("hidden")
    this.previewSectionTarget.classList.add("hidden")
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
    recognition.lang = "en-US"
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onstart = () => {
      this.isRecording = true
      this.transcriptBuffer = ""
      this.recordButtonTarget.classList.add("bg-red-600", "hover:bg-red-700")
      this.recordingStatusTarget.classList.remove("hidden")
      this.transcriptionSectionTarget.classList.add("hidden")
      this.transcriptionTextTarget.textContent = ""
      this.previewSectionTarget.classList.add("hidden")
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

      this.transcriptionSectionTarget.classList.remove("hidden")
      this.transcriptionTextTarget.textContent = this.transcriptBuffer + interimTranscript
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
    this.previewAmountTarget.value = data.amount
    this.previewTypeTarget.value = data.transaction_type
    this.previewCategoryTarget.value = data.category
    this.previewDescriptionTarget.value = data.description
    this.previewDateTarget.value = data.date
  }

  getCsrfToken() {
    return document.querySelector("meta[name='csrf-token']")?.getAttribute("content")
  }
}
