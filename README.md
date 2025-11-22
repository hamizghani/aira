# Aplikasi Pengisian Formulir JHT dengan Suara

Aplikasi web modern untuk mengisi formulir klaim Jaminan Hari Tua (JHT) BPJS Ketenagakerjaan dengan dukungan pengisian formulir menggunakan suara, OCR untuk KTP, dan antarmuka yang mudah digunakan.

## 🚀 Fitur Utama

- **Pengisian Formulir dengan Suara**: Gunakan perintah suara untuk mengisi kolom formulir
- **Pengenalan Suara Bahasa Indonesia**: STT dan TTS dengan ElevenLabs
- **Antarmuka Responsif**: Desain modern dengan navigasi yang intuitif
- **Validasi Real-time**: Validasi data dan umpan balik langsung

## 📋 Prasyarat

- Node.js 18+ dan npm
- API Key ElevenLabs (untuk STT/TTS)

## 🛠️ Instalasi dan Setup

### 1. Clone atau Ekstrak Proyek

```bash
# Ekstrak file zip ke folder
unzip nama-file.zip
cd nama-folder-proyek
```

### 2. Install Dependencies Node.js

```bash
npm install
```

### 3. Setup Environment Variables

Buat file `.env.local` di root folder:

```env
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```
(sudah kami setup, langsung saja run project ini)

**Cara mendapatkan API Key ElevenLabs:**
1. Daftar di [elevenlabs.io](https://elevenlabs.io)
2. Pergi ke Settings > API Keys
3. Buat API key baru
4. Copy dan paste ke `.env.local`


**Catatan:** OCR menggunakan model YOLO dan Tesseract/EasyOCR. Jika Tesseract tidak tersedia, sistem akan otomatis menggunakan EasyOCR sebagai fallback.

### 4. Jalankan Aplikasi

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

## 🎯 Cara Penggunaan

### Pengisian Formulir dengan Suara

1. **Buka halaman Klaim JHT**: Kunjungi `/klaim-jht`
2. **Gunakan Kontrol Suara**:
   - Klik "Mulai Rekam" atau tekan **spasi**
   - Katakan perintah seperti:
     - "Nama saya Ahmad Rahman"
     - "NIK 1234567890123456"
     - "Tanggal lahir 15 Agustus 1985"
     - "Alamat Jalan Sudirman No 1 Jakarta"
     - "Bank BRI"
3. **Formulir akan terisi otomatis** berdasarkan perintah suara
4. **Navigasi**: Katakan "lanjut" untuk ke langkah berikutnya atau bisa langusng tekan tombol rekam suara juga


### Keyboard Shortcuts

- **Spasi**: Mulai/stop recording
- **Enter**: Submit form

## 🔧 Troubleshooting

### Error: "ELEVENLABS_API_KEY is not defined"

**Solusi:**
1. Pastikan file `.env.local` ada di root folder
2. Pastikan API key benar dan tidak ada spasi
3. Restart server: `Ctrl+C` lalu `npm run dev`

### Error: "tesseract is not installed"

**Solusi:**
- OCR akan otomatis menggunakan EasyOCR sebagai fallback
- Tidak perlu tindakan, aplikasi tetap berfungsi

### Error: "Module not found" atau dependency errors

**Solusi:**
```bash
# Hapus node_modules dan install ulang
rm -rf node_modules package-lock.json
npm install
```

### Error OCR: Model tidak ditemukan

**Solusi:**
- Pastikan folder `ocr-ktp-main/models/best.pt` ada
- Install dependencies Python di folder `ocr-ktp-main`
- Jika error berlanjut, OCR akan menggunakan data mock

### Aplikasi tidak bisa diakses di browser

**Solusi:**
- Pastikan port 3000 tidak digunakan aplikasi lain
- Coba port berbeda: `npm run dev -- -p 3001`
- Periksa firewall/antivirus

### Voice tidak berfungsi

**Solusi:**
- Pastikan microphone diizinkan di browser
- Coba browser Chrome/Firefox terbaru
- Periksa koneksi internet (diperlukan untuk ElevenLabs API)

### Form tidak tersimpan

**Solusi:**
- Data disimpan di state browser
- Jika browser di-refresh, data akan hilang
- Gunakan tombol "Kirim Pengajuan" untuk submit

## 📁 Struktur Proyek

```
aira/
├── app/
│   ├── api/
│   │   ├── agent/     # Voice agent pipeline
│   │   ├── stt/       # Speech-to-text
│   │   ├── tts/       # Text-to-speech
│   ├── klaim-jht/     # Main form page
│   └── globals.css
├── public/            # Static assets
├── .env.local         # Environment variables
└── package.json
```

## 🛡️ Keamanan

- API keys disimpan di environment variables
- Tidak ada penyimpanan data sensitif di client-side
- Semua komunikasi menggunakan HTTPS di production

## 📞 Dukungan

Jika mengalami masalah:

1. Periksa console browser (F12 > Console)
2. Periksa terminal yang menjalankan `npm run dev`
3. Pastikan semua prasyarat terinstall
4. Coba restart aplikasi

## 📝 Catatan Pengembangan

- Aplikasi menggunakan Next.js 14 dengan App Router
- Voice processing menggunakan ElevenLabs API
- OCR menggunakan YOLO + Tesseract/EasyOCR
- UI menggunakan Tailwind CSS

## Tambahan

Berikut terminal jika aplikasi berhasil berjalan

```
C:\Users\Fadil\Downloads\Universitaet\Lomba\Technical\Healthkathon\aira>npm run dev

> aira@0.1.0 dev
> next dev

   ▲ Next.js 16.0.3 (Turbopack)
   - Local:         http://localhost:3000
   - Network:       http://192.168.56.1:3000
   - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 1204ms
 GET /klaim-jht 200 in 2.3s (compile: 2.1s, render: 172ms)
Transcript: "Nama Budi"
Matched intent: fill_name, field: step2.name
 POST /api/agent 200 in 3.0s (compile: 716ms, render: 2.2s)
 ```

---

**Dibuat untuk Healthkathon 2025**  
Aplikasi inovatif untuk memudahkan akses layanan BPJS Ketenagakerjaan melalui teknologi suara dan AI.
