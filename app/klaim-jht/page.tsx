'use client';

import React, { useState } from 'react';
import './styles.css';

interface FormData {
  step2: {
    kpj: string;
    nik: string;
    name: string;
    birthDate: string;
    email: string;
    phone: string;
    address: string;
  };
  step3: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    claimReason: string;
  };
  step4: {
    ktp: File | null;
    kk: File | null;
    bankBook: File | null;
    otherDocs: File | null;
  };
  step5: {
    kpjCard: File | null;
    additionalDocs: File | null;
  };
}

export default function JHTClaimPage() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [agreement, setAgreement] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    step2: {
      kpj: '',
      nik: '',
      name: '',
      birthDate: '',
      email: '',
      phone: '',
      address: '',
    },
    step3: {
      bankName: '',
      accountNumber: '',
      accountHolder: '',
      claimReason: '',
    },
    step4: {
      ktp: null,
      kk: null,
      bankBook: null,
      otherDocs: null,
    },
    step5: {
      kpjCard: null,
      additionalDocs: null,
    },
  });

  // Voice assistant state
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  const toggleStep = (step: number) => {
    setActiveStep(activeStep === step ? 0 : step);
  };

  const nextStep = (currentStep: number) => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    setActiveStep(currentStep + 1);
  };

  const prevStep = (currentStep: number) => {
    setActiveStep(currentStep - 1);
  };

  const handleFileChange = (step: 'step4' | 'step5', field: string, file: File | null) => {
    setFormData({
      ...formData,
      [step]: {
        ...formData[step],
        [field]: file,
      },
    });
  };

  const handleInputChange = (step: 'step2' | 'step3', field: string, value: string) => {
    setFormData({
      ...formData,
      [step]: {
        ...formData[step],
        [field]: value,
      },
    });
  };

  const submitClaim = () => {
    if (!agreement) {
      alert('Silakan centang persetujuan terlebih dahulu');
      return;
    }

    // Here you would typically send data to your API
    console.log('Form Data:', formData);

    alert(
      `Pengajuan klaim JHT Anda telah berhasil dikirim!\n\nNomor Referensi: JHT-2025-${Math.floor(Math.random() * 1000000)}\n\nSilakan cek email Anda untuk informasi lebih lanjut.`
    );

    // Reset form
    setActiveStep(1);
    setCompletedSteps([]);
    setAgreement(false);
  };

  // Voice functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        await sendAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const sendAudio = async (audioBlob: Blob) => {
    const formDataAudio = new FormData();
    formDataAudio.append('file', audioBlob, 'audio.wav');

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        body: formDataAudio,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setTranscript(result.agent_text);

      // Update form data
      if (result.formData) {
        setFormData(prev => ({ ...prev, ...result.formData }));
      }
      // Update agreement
      if (result.agreement !== undefined) {
        setAgreement(result.agreement);
      }
      // Update active step
      if (result.activeStep !== undefined) {
        setActiveStep(result.activeStep);
      }

      // Play audio
      const audioData = atob(result.audio_base64);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }
      const audioBlobResponse = new Blob([audioArray], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlobResponse);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error('Error sending audio:', error);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <header className="header">
        <nav className="nav-container">
          <div className="logo">
            <span className="logo-text">BPJS Ketenagakerjaan</span>
          </div>
          <ul className="nav-links">
            <li><a href="#">Informasi Kepesertaan</a></li>
            <li><a href="#">Cara Klaim</a></li>
            <li><a href="#">Berita</a></li>
            <li><a href="#">Tentang Kami</a></li>
            <li><a href="#">Informasi Publik</a></li>
            <li><a href="#">Kontak</a></li>
          </ul>
          <button className="lang-toggle">🌐 ID</button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Klaim Saldo Jaminan Hari Tua (JHT)</h1>
            <p>
              Peserta yang memenuhi persyaratan dapat melakukan klaim JHT dengan memanfaatkan
              Layanan Tanpa Kontak Fisik (Lapak Asik).
            </p>
          </div>
          <div className="hero-image">
            {/* Add your hero image here */}
          </div>
        </div>
      </section>

      {/* Voice Assistant */}
      <section className="voice-assistant">
        <div className="voice-container">
          <h2>Asisten Suara untuk Mengisi Formulir</h2>
          <p>Katakan data yang ingin Anda isi, seperti "Nama saya John Doe" atau "Nomor KPJ 123456789"</p>
          <div className="voice-controls">
            <button
              className="voice-btn record"
              onClick={startRecording}
              disabled={isRecording}
            >
              {isRecording ? 'Merekam...' : 'Mulai Rekam'}
            </button>
            <button
              className="voice-btn stop"
              onClick={stopRecording}
              disabled={!isRecording}
            >
              Stop
            </button>
          </div>
          {transcript && (
            <div className="transcript">
              <h3>Respons Asisten:</h3>
              <p>{transcript}</p>
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <main className="main-content">
        <div className="steps-container">
          {/* Step 1 */}
          <StepItem
            stepNumber={1}
            title="Syarat dan Ketentuan Pengajuan Lapak Asik"
            active={activeStep === 1}
            completed={completedSteps.includes(1)}
            onToggle={() => toggleStep(1)}
          >
            <div className="step-content-inner">
              <h3 className="section-title">Persyaratan Klaim JHT</h3>
              <ul className="requirements-list">
                <li>Peserta BPJS Ketenagakerjaan yang aktif</li>
                <li>Memiliki saldo JHT yang dapat diklaim</li>
                <li>
                  Memenuhi salah satu kondisi: Mencapai usia 56 tahun, Mengalami cacat total tetap,
                  atau Meninggal dunia (ahli waris)
                </li>
                <li>Memiliki dokumen identitas yang valid (KTP/Paspor)</li>
                <li>Nomor rekening bank aktif atas nama peserta</li>
              </ul>
              <div className="button-group">
                <button className="btn btn-primary" onClick={() => nextStep(1)}>
                  Lanjutkan
                </button>
              </div>
            </div>
          </StepItem>

          {/* Step 2 */}
          <StepItem
            stepNumber={2}
            title="Data Pekerja"
            active={activeStep === 2}
            completed={completedSteps.includes(2)}
            onToggle={() => toggleStep(2)}
          >
            <div className="step-content-inner">
              <form onSubmit={(e) => { e.preventDefault(); nextStep(2); }}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nomor KPJ <span className="required">*</span></label>
                    <input
                      type="text"
                      placeholder="Masukkan Nomor KPJ"
                      value={formData.step2.kpj}
                      onChange={(e) => handleInputChange('step2', 'kpj', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>NIK <span className="required">*</span></label>
                    <input
                      type="text"
                      placeholder="Nomor Induk Kependudukan"
                      value={formData.step2.nik}
                      onChange={(e) => handleInputChange('step2', 'nik', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nama Lengkap <span className="required">*</span></label>
                    <input
                      type="text"
                      placeholder="Sesuai KTP"
                      value={formData.step2.name}
                      onChange={(e) => handleInputChange('step2', 'name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Tanggal Lahir <span className="required">*</span></label>
                    <input
                      type="date"
                      value={formData.step2.birthDate}
                      onChange={(e) => handleInputChange('step2', 'birthDate', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email <span className="required">*</span></label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={formData.step2.email}
                      onChange={(e) => handleInputChange('step2', 'email', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Nomor Telepon <span className="required">*</span></label>
                    <input
                      type="tel"
                      placeholder="08xxxxxxxxxx"
                      value={formData.step2.phone}
                      onChange={(e) => handleInputChange('step2', 'phone', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Alamat Lengkap <span className="required">*</span></label>
                  <textarea
                    placeholder="Alamat sesuai KTP"
                    value={formData.step2.address}
                    onChange={(e) => handleInputChange('step2', 'address', e.target.value)}
                    required
                  />
                </div>
                <div className="button-group">
                  <button type="button" className="btn btn-secondary" onClick={() => prevStep(2)}>
                    Kembali
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Lanjutkan
                  </button>
                </div>
              </form>
            </div>
          </StepItem>

          {/* Step 3 */}
          <StepItem
            stepNumber={3}
            title="Data Pekerja Tambahan"
            active={activeStep === 3}
            completed={completedSteps.includes(3)}
            onToggle={() => toggleStep(3)}
          >
            <div className="step-content-inner">
              <form onSubmit={(e) => { e.preventDefault(); nextStep(3); }}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nama Bank <span className="required">*</span></label>
                    <select
                      value={formData.step3.bankName}
                      onChange={(e) => handleInputChange('step3', 'bankName', e.target.value)}
                      required
                    >
                      <option value="">Pilih Bank</option>
                      <option>Bank BRI</option>
                      <option>Bank BNI</option>
                      <option>Bank Mandiri</option>
                      <option>Bank BCA</option>
                      <option>Bank BTN</option>
                      <option>Bank Syariah Indonesia</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Nomor Rekening <span className="required">*</span></label>
                    <input
                      type="text"
                      placeholder="Nomor Rekening"
                      value={formData.step3.accountNumber}
                      onChange={(e) => handleInputChange('step3', 'accountNumber', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Nama Pemilik Rekening <span className="required">*</span></label>
                  <input
                    type="text"
                    placeholder="Sesuai dengan buku tabungan"
                    value={formData.step3.accountHolder}
                    onChange={(e) => handleInputChange('step3', 'accountHolder', e.target.value)}
                    required
                  />
                  <div className="help-text">Pastikan nama pemilik rekening sama dengan nama peserta</div>
                </div>
                <div className="form-group">
                  <label>Alasan Klaim <span className="required">*</span></label>
                  <select
                    value={formData.step3.claimReason}
                    onChange={(e) => handleInputChange('step3', 'claimReason', e.target.value)}
                    required
                  >
                    <option value="">Pilih Alasan Klaim</option>
                    <option>Mencapai Usia 56 Tahun</option>
                    <option>Meninggal Dunia</option>
                    <option>Cacat Total Tetap</option>
                    <option>Mengundurkan Diri</option>
                    <option>PHK</option>
                  </select>
                </div>
                <div className="button-group">
                  <button type="button" className="btn btn-secondary" onClick={() => prevStep(3)}>
                    Kembali
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Lanjutkan
                  </button>
                </div>
              </form>
            </div>
          </StepItem>

          {/* Step 4 */}
          <StepItem
            stepNumber={4}
            title="Sebab Klaim & Dokumen Pendukung"
            active={activeStep === 4}
            completed={completedSteps.includes(4)}
            onToggle={() => toggleStep(4)}
          >
            <div className="step-content-inner">
              <h3 className="section-title">Upload Dokumen Pendukung</h3>
              <FileUpload
                label="Foto/Scan KTP"
                required
                onChange={(file) => handleFileChange('step4', 'ktp', file)}
              />
              <FileUpload
                label="Foto/Scan Kartu Keluarga"
                required
                onChange={(file) => handleFileChange('step4', 'kk', file)}
              />
              <FileUpload
                label="Buku Tabungan (Halaman Identitas)"
                onChange={(file) => handleFileChange('step4', 'bankBook', file)}
              />
              <FileUpload
                label="Dokumen Pendukung Lainnya"
                helpText="Surat PHK, Surat Keterangan, dll"
                onChange={(file) => handleFileChange('step4', 'otherDocs', file)}
              />
              <div className="button-group">
                <button className="btn btn-secondary" onClick={() => prevStep(4)}>
                  Kembali
                </button>
                <button className="btn btn-primary" onClick={() => nextStep(4)}>
                  Lanjutkan
                </button>
              </div>
            </div>
          </StepItem>

          {/* Step 5 */}
          <StepItem
            stepNumber={5}
            title="KPJ & Dokumen Tambahan (Opsional)"
            active={activeStep === 5}
            completed={completedSteps.includes(5)}
            onToggle={() => toggleStep(5)}
          >
            <div className="step-content-inner">
              <FileUpload
                label="Kartu Peserta BPJS Ketenagakerjaan (KPJ)"
                onChange={(file) => handleFileChange('step5', 'kpjCard', file)}
              />
              <FileUpload
                label="Dokumen Tambahan"
                helpText="Dokumen pendukung lain jika ada"
                onChange={(file) => handleFileChange('step5', 'additionalDocs', file)}
              />
              <div className="button-group">
                <button className="btn btn-secondary" onClick={() => prevStep(5)}>
                  Kembali
                </button>
                <button className="btn btn-primary" onClick={() => nextStep(5)}>
                  Lanjutkan
                </button>
              </div>
            </div>
          </StepItem>

          {/* Step 6 */}
          <StepItem
            stepNumber={6}
            title="Konfirmasi Data Pengajuan"
            active={activeStep === 6}
            completed={completedSteps.includes(6)}
            onToggle={() => toggleStep(6)}
          >
            <div className="step-content-inner">
              <div className="summary-box">
                <h3 className="section-title">Ringkasan Pengajuan</h3>
                <p className="summary-description">
                  Pastikan semua data yang Anda masukkan sudah benar sebelum mengirim pengajuan.
                </p>
                <div className="summary-items">
                  <div className="summary-item">
                    <div className="summary-label">Status Pengajuan</div>
                    <div className="summary-value">Siap untuk diajukan</div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-label">Dokumen Terupload</div>
                    <div className="summary-value">
                      {Object.values(formData.step4).filter(f => f !== null).length +
                        Object.values(formData.step5).filter(f => f !== null).length}{' '}
                      Dokumen
                    </div>
                  </div>
                </div>
              </div>

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="agreement"
                  checked={agreement}
                  onChange={(e) => setAgreement(e.target.checked)}
                />
                <label htmlFor="agreement">
                  Saya menyatakan bahwa data yang saya berikan adalah benar dan dapat
                  dipertanggungjawabkan. Saya memahami bahwa pengajuan klaim yang tidak sesuai dapat
                  ditolak.
                </label>
              </div>

              <div className="button-group">
                <button className="btn btn-secondary" onClick={() => prevStep(6)}>
                  Kembali
                </button>
                <button className="btn btn-primary" onClick={submitClaim}>
                  Kirim Pengajuan
                </button>
              </div>
            </div>
          </StepItem>
        </div>

        {/* Action Section */}
        <div className="action-section">
          <h3>Berikut informasi tambahan terkait Pengajuan Klaim JHT:</h3>
          <div className="action-buttons">
            <button className="action-btn">CETAK ULANG</button>
            <button className="action-btn">LACAK KLAIM JHT</button>
            <button className="action-btn">SURAT PERNYATAAN MENYETUJUI PHK</button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

// StepItem Component
interface StepItemProps {
  stepNumber: number;
  title: string;
  active: boolean;
  completed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function StepItem({ stepNumber, title, active, completed, onToggle, children }: StepItemProps) {
  return (
    <div className={`step-item ${active ? 'active' : ''} ${completed ? 'completed' : ''}`}>
      <div className="step-header" onClick={onToggle}>
        <div className="step-number">{stepNumber}</div>
        <div className="step-title">{title}</div>
        <div className="step-icon">▼</div>
      </div>
      <div className="step-content">{children}</div>
    </div>
  );
}

// FileUpload Component
interface FileUploadProps {
  label: string;
  required?: boolean;
  helpText?: string;
  onChange: (file: File | null) => void;
}

function FileUpload({ label, required, helpText, onChange }: FileUploadProps) {
  const [fileName, setFileName] = useState<string>('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setFileName(file.name);
      onChange(file);
    }
  };

  return (
    <div className="form-group">
      <label>
        {label} {required && <span className="required">*</span>}
      </label>
      <div className="upload-area" onClick={() => inputRef.current?.click()}>
        <p>📄 Klik atau seret file ke sini</p>
        <p className="upload-help">
          {helpText || 'Format: JPG, PNG, PDF (Maks. 2MB)'}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
      {fileName && (
        <div className="file-info active">
          ✓ File terpilih: {fileName}
        </div>
      )}
    </div>
  );
}

// Footer Component
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <div className="footer-logo">
            <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>175</div>
            <div style={{ fontSize: '0.75rem' }}>
              Tahun Indonesia
              <br />
              Merdeka
            </div>
          </div>
          <div className="social-links">
            <a href="#">f</a>
            <a href="#">🐦</a>
            <a href="#">▶</a>
            <a href="#">📷</a>
          </div>
        </div>

        <div className="footer-section">
          <h4>Tentang Kami</h4>
          <ul>
            <li><a href="#">Visi & Misi</a></li>
            <li><a href="#">Sejarah</a></li>
            <li><a href="#">Susunan Direksi</a></li>
            <li><a href="#">Susunan Dewas</a></li>
            <li><a href="#">Penghargaan</a></li>
            <li><a href="#">Struktur Organisasi</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Peserta</h4>
          <ul>
            <li><a href="#">Penerima Upah</a></li>
            <li><a href="#">Bukan Penerima Upah</a></li>
            <li><a href="#">Jasa Konstruksi</a></li>
            <li><a href="#">Pekerja Migran Indonesia</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Peraturan</h4>
          <ul>
            <li><a href="#">Undang-undang</a></li>
            <li><a href="#">Peraturan Pemerintah</a></li>
            <li><a href="#">Peraturan Presiden</a></li>
            <li><a href="#">Keputusan Presiden</a></li>
            <li><a href="#">Peraturan Menteri</a></li>
            <li><a href="#">Peraturan BPJS Ketenagakerjaan</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Aplikasi</h4>
          <ul>
            <li><a href="#">Perisai</a></li>
            <li><a href="#">GN-Lingkaran</a></li>
            <li><a href="#">e-Procurement</a></li>
            <li><a href="#">Mitra Pusat Layanan Kecelakaan Kerja</a></li>
            <li><a href="#">WBS</a></li>
            <li><a href="#">Karir</a></li>
            <li><a href="#">SiDewas</a></li>
          </ul>
        </div>
      </div>

      <div style={{ textAlign: 'center', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
        © 2025 BPJS Ketenagakerjaan. All rights reserved.
      </div>
    </footer>
  );
}