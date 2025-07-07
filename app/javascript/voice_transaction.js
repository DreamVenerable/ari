document.addEventListener("turbo:load", () => {
  const recordBtn = document.getElementById("recordButton");
  const recordingStatus = document.getElementById("recordingStatus");
  const transcriptionText = document.getElementById("transcriptionText");
  const transcriptionSection = document.getElementById("transcriptionSection");
  const previewSection = document.getElementById("transactionPreview");
  const recordAgainBtn = document.getElementById("recordAgainBtn");
  const editTransactionBtn = document.getElementById("editTransactionBtn");

  let recognition;
  let isRecording = false;
  let transcriptBuffer = "";
  let silenceTimeout;

  function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Sorry, your browser does not support Speech Recognition.");
      return;
    }
    recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true; // Keep listening until stopped
    recognition.interimResults = true; // Get partial results

    recognition.onstart = () => {
      isRecording = true;
      transcriptBuffer = "";
      recordBtn.classList.add("bg-red-600", "hover:bg-red-700");
      recordingStatus.classList.remove("hidden");
      transcriptionSection.classList.add("hidden");
      transcriptionText.textContent = "";
      previewSection.classList.add("hidden");
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          transcriptBuffer += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Reset silence timeout each time speech is detected
      clearTimeout(silenceTimeout);
      silenceTimeout = setTimeout(() => {
        if (isRecording) {
          recognition.stop(); // Triggers onend
        }
      }, 1000); // 2 seconds of silence

      transcriptionSection.classList.remove("hidden");
      transcriptionText.textContent = transcriptBuffer + interimTranscript;
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event);
      alert("Error recognizing speech. Try again.");
    };

    recognition.onend = () => {
      clearTimeout(silenceTimeout);
      isRecording = false;
      recordBtn.classList.remove("bg-red-600", "hover:bg-red-700");
      recordingStatus.classList.add("hidden");

      if (transcriptBuffer.trim().length > 0) {
        processTranscription(transcriptBuffer.trim());
      } else {
        alert("No speech was detected. Please try again.");
      }
    };
  }

  async function processTranscription(text) {
    try {
      const res = await fetch("/voice_transactions/process_audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken(),
        },
        body: JSON.stringify({ transcription: text }),
      });

      const data = await res.json();

      if (data.success) {
        fillTransactionPreview(data.transaction_data);
        previewSection.classList.remove("hidden");
      } else {
        alert(data.error || "Could not process transcription.");
      }
    } catch (err) {
      console.error("Error processing transcription:", err);
      alert("Error occurred while processing your voice input.");
    }
  }

  function fillTransactionPreview(data) {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };

    setVal("previewAmount", data.amount);
    setVal("previewType", data.transaction_type);
    setVal("previewCategory", data.category);
    setVal("previewDescription", data.description);
    setVal("previewDate", data.date);
  }

  function getCsrfToken() {
    return document.querySelector("meta[name='csrf-token']")?.getAttribute("content");
  }

  if (recordBtn) {
    initSpeechRecognition();

    recordBtn.addEventListener("click", () => {
      if (isRecording) {
        clearTimeout(silenceTimeout);
        recognition.stop();
      } else {
        recognition.start();
      }
    });
  }

  if (recordAgainBtn) {
    recordAgainBtn.addEventListener("click", () => {
      transcriptBuffer = "";
      transcriptionText.textContent = "";
      transcriptionSection.classList.add("hidden");
      previewSection.classList.add("hidden");
    });
  }

  if (editTransactionBtn) {
    editTransactionBtn.addEventListener("click", () => {
      document.getElementById("previewAmount")?.focus();
    });
  }
});
