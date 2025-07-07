// Full standalone implementation follows:
class VoiceTransactionRecorder {
  constructor() {
    // State
    this.isRecording = false;
    this.finalTranscript = '';
    this.interimTranscript = '';
    this.recognition = null;
    this.silenceTimer = null;
    this.forceEndTimer = null;
    this.visualizationInterval = null;
    this.silenceTimeout = 2500; // 2.5s silence threshold

    // Elements
    this.recordButton = document.getElementById('recordButton');
    this.recordingStatus = document.getElementById('recordingStatus');
    this.audioVisualization = document.getElementById('audioVisualization');
    this.transcriptionSection = document.getElementById('transcriptionSection');
    this.transcriptionText = document.getElementById('transcriptionText');
    this.transactionPreview = document.getElementById('transactionPreview');
    this.transactionForm = document.getElementById('transactionForm');
    this.canvas = document.getElementById('visualizer');
    if (this.canvas) this.canvasContext = this.canvas.getContext('2d');

    // Bind UI events
    this.bindEvents();
  }

  bindEvents() {
    if (this.recordButton) {
      this.recordButton.addEventListener('click', () => this.toggleRecording());
    }
    document.getElementById('recordAgainBtn')?.addEventListener('click', () => this.resetInterface());
    document.getElementById('editTransactionBtn')?.addEventListener('click', () => this.enableEditing());
    this.transactionForm?.addEventListener('submit', e => this.handleFormSubmit(e));
  }

  toggleRecording() {
    if (!this.isRecording) this.startRecording();
    else this.stopRecording();
  }

  startRecording() {
    if (this.isRecording) return;
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) { this.showError('Speech API not supported'); return; }
    if (!this.recognition) {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      // Handlers
      this.recognition.onstart = () => {
        this.isRecording = true;
        this.updateUI('recording');
        this.finalTranscript = '';
      };

      this.recognition.onresult = e => {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = setTimeout(() => this.stopRecording(), this.silenceTimeout);
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const item = e.results[i][0];
          if (e.results[i].isFinal) this.finalTranscript += item.transcript + ' ';
          else interim += item.transcript;
        }
        this.interimTranscript = interim;
        this.transcriptionText.textContent = this.finalTranscript + interim;
      };

      this.recognition.onerror = e => {
        this.showError(`Error: ${e.error}`);
        this.stopRecording();
      };

      this.recognition.onend = () => this.handleEnd();
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        stream.getTracks().forEach(t => t.stop());
        this.recognition.start();
        this.transcriptionSection.style.display = 'block';
        this.simulateAudioVisualization();
        this.forceEndTimer = setTimeout(() => this.handleEnd(), this.silenceTimeout + 5500);
      })
      .catch(() => this.showError('Microphone access denied'));
  }

  stopRecording() {
    if (!this.isRecording || !this.recognition) return;
    this.isRecording = false;
    clearTimeout(this.silenceTimer);
    this.recognition.stop();
  }

  handleEnd() {
    clearTimeout(this.forceEndTimer);
    this.updateUI('processing');
    const text = (this.finalTranscript + this.interimTranscript).trim();
    if (this.visualizationInterval) clearInterval(this.visualizationInterval);

    if (text) this.processTranscription(text);
    else {
      this.updateUI('ready');
      this.showError('No speech detected');
    }

    // Teardown recognition so next session is fresh
    if (this.recognition) {
      this.recognition.onstart = null;
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onend = null;
      this.recognition = null;
    }
  }

  simulateAudioVisualization() {
    if (!this.canvasContext) return;
    clearInterval(this.visualizationInterval);
    const { width, height } = this.canvas;
    this.visualizationInterval = setInterval(() => {
      if (!this.isRecording) return clearInterval(this.visualizationInterval);
      this.canvasContext.clearRect(0, 0, width, height);
      const bars = 20;
      const w = width / bars;
      for (let i = 0; i < bars; i++) {
        const h = Math.random() * height;
        this.canvasContext.fillRect(i * w, height - h, w * 0.8, h);
      }
    }, 100);
  }

  async processTranscription(text) {
    this.transcriptionText.textContent = text;
    const data = new FormData(); data.append('transcription', text);
    try {
      const res = await fetch('/voice_transactions/process_audio', { method: 'POST', body: data,
        headers: { 'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content') }});
      const json = await res.json();
      if (json.success) this.displayPreview(json.transaction_data);
      else this.showError(json.error || 'Process failed');
    } catch {
      this.showError('Network error');
    } finally {
      this.updateUI('ready');
    }
  }

  displayPreview(data) {
    const fill = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    fill('previewAmount', data.amount);
    fill('previewType', data.transaction_type);
    fill('previewCategory', data.category);
    fill('previewDescription', data.description);
    fill('previewDate', data.date);
    this.transactionPreview.style.display = 'block';
    this.transactionPreview.scrollIntoView({ behavior: 'smooth' });
  }

  async handleFormSubmit(e) {
    e.preventDefault();
    const form = new FormData(this.transactionForm);
    try {
      const res = await fetch('/voice_transactions/create_from_voice', { method: 'POST', body: form,
        headers: { 'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content') }});
      const json = await res.json();
      if (json.success) { this.showSuccess(json.message); setTimeout(()=>window.location=json.redirect_url,1500); }
      else if (json.redirect_url) window.location = json.redirect_url;
      else this.showError((json.errors||[]).join(', ')||json.error||'Save failed');
    } catch {
      this.showError('Network error');
    }
  }

  updateUI(state) {
    const txt = this.recordButton.querySelector('.record-text');
    if (state === 'recording') {
      this.recordButton.classList.add('recording'); txt.textContent = 'Recording...';
      this.recordingStatus.style.display = 'flex'; this.audioVisualization.style.display = 'block';
    } else if (state === 'processing') {
      this.recordButton.classList.remove('recording'); txt.textContent = 'Processing...';
      this.recordButton.disabled = true; this.recordingStatus.style.display = 'none'; this.audioVisualization.style.display = 'none';
    } else {
      this.recordButton.classList.remove('recording'); txt.textContent = 'Click to Record';
      this.recordButton.disabled = false; this.recordingStatus.style.display = 'none'; this.audioVisualization.style.display = 'none';
    }
  }

  resetInterface() {
    this.transcriptionSection.style.display = 'none';
    this.transactionPreview.style.display = 'none';
    this.transactionForm.reset();
    this.updateUI('ready');
    this.clearMessages();
  }

  enableEditing() {
    this.transactionForm.querySelectorAll('input,select,textarea').forEach(f=>{f.disabled=false;});
  }

  showError(msg) { this._message(msg,'error-message'); this.updateUI('ready'); }
  showSuccess(msg) { this._message(msg,'success-message'); }
  _message(msg,cls){ this.clearMessages(); const d=document.createElement('div'); d.className=cls; d.textContent=msg; document.querySelector('.voice-transaction-container').prepend(d);} 
  clearMessages(){document.querySelectorAll('.error-message,.success-message').forEach(e=>e.remove());}
}

document.addEventListener('turbo:load',()=>{ if(document.querySelector('.voice-transaction-container')) new VoiceTransactionRecorder(); });
