import { NextRequest, NextResponse } from 'next/server';
import * as chrono from 'chrono-node';
// No client needed, using fetch

// Simple conversation state (in production, use database or session)
let conversationState = {
  currentStep: 1,
  agreement: false,
  formData: {
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
  },
  missingFields: [] as string[],
};

const INTENTS = {
  fill_kpj: { keywords: ['kpj', 'nomor kpj'], field: 'step2.kpj' },
  fill_nik: { keywords: ['nik', 'nomor induk'], field: 'step2.nik' },
  fill_name: { keywords: ['nama', 'nama lengkap'], field: 'step2.name' },
  fill_birthdate: { keywords: ['tanggal lahir', 'lahir'], field: 'step2.birthDate' },
  fill_email: { keywords: ['email', 'surel'], field: 'step2.email' },
  fill_phone: { keywords: ['telepon', 'nomor telepon'], field: 'step2.phone' },
  fill_address: { keywords: ['alamat'], field: 'step2.address' },
  fill_bank: { keywords: ['bank', 'nama bank'], field: 'step3.bankName' },
  fill_account_number: { keywords: ['nomor rekening', 'rekening'], field: 'step3.accountNumber' },
  fill_account_holder: { keywords: ['nama pemilik', 'pemilik rekening'], field: 'step3.accountHolder' },
  fill_claim_reason: { keywords: ['alasan klaim', 'klaim'], field: 'step3.claimReason' },
  next_step: { keywords: ['lanjut', 'next', 'selanjutnya'] },
  prev_step: { keywords: ['kembali', 'previous', 'sebelumnya'] },
  submit: { keywords: ['kirim', 'submit', 'ajukan'] },
  confirm: { keywords: ['konfirmasi', 'setuju', 'saya setuju'] },
  smalltalk: { keywords: ['halo', 'hai', 'terima kasih'] },
};

function parseIntent(text: string) {
  const lowerText = text.toLowerCase();
  for (const [intent, data] of Object.entries(INTENTS)) {
    if (data.keywords.some(k => lowerText.includes(k))) {
      return { intent, field: (data as any).field };
    }
  }
  return { intent: 'smalltalk' };
}

function handleConversation(intent: string, field: string | undefined, value: string) {
  if (intent === 'smalltalk') {
    return 'Halo! Saya akan membantu Anda mengisi formulir klaim JHT. Silakan sebutkan data yang ingin Anda isi.';
  }

  if (intent === 'confirm') {
    conversationState.agreement = true;
    return 'Persetujuan telah dicentang. Sekarang Anda dapat mengirim pengajuan.';
  }

  if (intent.startsWith('fill_') && field) {
    let extractedValue = value.replace(new RegExp(INTENTS[intent as keyof typeof INTENTS].keywords.join('|'), 'gi'), '').trim();

    // Special processing
    if (field === 'step2.kpj' || field === 'step2.nik' || field === 'step2.phone') {
      extractedValue = convertIndonesianNumbersToDigits(extractedValue);
      console.log(`Converted numbers: "${extractedValue}"`);
    } else if (field === 'step2.email') {
      extractedValue = convertSpokenEmail(extractedValue);
      console.log(`Converted email: "${extractedValue}"`);
    } else if (field === 'step2.birthDate') {
      console.log(`Parsing date from: "${extractedValue}"`);
      extractedValue = parseIndonesianDate(extractedValue);
      console.log(`Parsed date: "${extractedValue}"`);
    } else if (field === 'step3.bankName') {
      extractedValue = mapBankName(extractedValue);
      console.log(`Mapped bank: "${extractedValue}"`);
    }

    const [step, f] = field.split('.');
    (conversationState.formData as any)[step][f] = extractedValue;
    return `Baik, ${f} telah diisi dengan ${extractedValue}. Apa lagi yang ingin Anda isi?`;
  }

  if (intent === 'next_step') {
    if (conversationState.currentStep < 6) {
      conversationState.currentStep++;
      return `Langkah ${conversationState.currentStep} dibuka.`;
    }
    return 'Anda sudah di langkah terakhir.';
  }

  if (intent === 'prev_step') {
    if (conversationState.currentStep > 1) {
      conversationState.currentStep--;
      return `Kembali ke langkah ${conversationState.currentStep}.`;
    }
    return 'Anda sudah di langkah pertama.';
  }

  if (intent === 'submit') {
    return 'Formulir telah dikirim. Terima kasih!';
  }

  return 'Maaf, saya tidak mengerti. Silakan ulangi.';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // STT
    const audioBuffer = await file.arrayBuffer();

    const elevenlabsFormData = new FormData();
    elevenlabsFormData.append('file', new Blob([audioBuffer], { type: 'audio/wav' }), 'audio.wav');
    elevenlabsFormData.append('model_id', 'scribe_v1');
    elevenlabsFormData.append('tag_audio_events', 'true');
    elevenlabsFormData.append('language_code', 'ind');
    elevenlabsFormData.append('diarize', 'true');

    const sttResponse = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
      body: elevenlabsFormData,
    });

    if (!sttResponse.ok) {
      throw new Error(`ElevenLabs STT error: ${sttResponse.status}`);
    }

    const sttResult = await sttResponse.json();
    const transcript = sttResult.text || '';

    // NLU
    const { intent, field } = parseIntent(transcript);
    console.log(`Transcript: "${transcript}"`);
    console.log(`Matched intent: ${intent}, field: ${field}`);

    // Handle conversation
    const agentText = handleConversation(intent, field, transcript);

    // TTS
    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text: agentText,
        model_id: 'eleven_turbo_v2',
        output_format: 'mp3_44100_128',
      }),
    });

    if (!ttsResponse.ok) {
      throw new Error(`ElevenLabs TTS error: ${ttsResponse.status}`);
    }

    const audioBufferResponse = await ttsResponse.arrayBuffer();
    const audioBytesResponse = new Uint8Array(audioBufferResponse);
    const audioBase64 = Buffer.from(audioBytesResponse).toString('base64');

    return NextResponse.json({
      agent_text: agentText,
      audio_base64: audioBase64,
      formData: conversationState.formData,
      agreement: conversationState.agreement,
    });
  } catch (error) {
    console.error('Error in agent:', error);
    return NextResponse.json({ error: 'Agent failed' }, { status: 500 });
  }
}

function convertIndonesianNumbersToDigits(text: string): string {
  const numberMap: Record<string, string> = {
    'nol': '0', 'satu': '1', 'dua': '2', 'tiga': '3', 'empat': '4',
    'lima': '5', 'enam': '6', 'tujuh': '7', 'delapan': '8', 'sembilan': '9',
    'sepuluh': '10', 'sebelas': '11', 'dua belas': '12', 'tiga belas': '13',
    'empat belas': '14', 'lima belas': '15', 'enam belas': '16', 'tujuh belas': '17',
    'delapan belas': '18', 'sembilan belas': '19', 'dua puluh': '20', 'tiga puluh': '30',
    'empat puluh': '40', 'lima puluh': '50', 'enam puluh': '60', 'tujuh puluh': '70',
    'delapan puluh': '80', 'sembilan puluh': '90',
    'seratus': '100', 'dua ratus': '200', 'tiga ratus': '300', 'empat ratus': '400',
    'lima ratus': '500', 'enam ratus': '600', 'tujuh ratus': '700', 'delapan ratus': '800',
    'sembilan ratus': '900', 'seribu': '1000'
  };
  let result = text;
  // Sort by length descending to match longer phrases first
  const sortedKeys = Object.keys(numberMap).sort((a, b) => b.length - a.length);
  for (const word of sortedKeys) {
    result = result.replace(new RegExp(`\\b${word}\\b`, 'gi'), numberMap[word]);
  }
  return result.replace(/\s+/g, ''); // Remove spaces
}

function convertSpokenEmail(text: string): string {
  return text.replace(/\bat\b/gi, '@').replace(/\bdot\b/gi, '.').replace(/\s+/g, '').replace(/\.$/, '');
}

function parseIndonesianDate(text: string): string {
  // 🟩 STEP 1 — CLEANING PHASE
  let cleaned = text
    .replace(/\(suara.*?\)/gi, "")
    .replace(/^\s+|\s+$/g, "");

  // 🟩 STEP 2 — LOWERCASE + UNIFORM SPACING
  cleaned = cleaned.toLowerCase().replace(/\s+/g, " ");

  // 🟩 STEP 3 — NORMALIZE MONTH NAMES
  const monthMappings: Record<string, string> = {
    "januari": "january",
    "februari": "february",
    "maret": "march",
    "april": "april",
    "mei": "may",
    "juni": "june",
    "juli": "july",
    "agustus": "august",
    "agu": "august",
    "oktober": "october",
    "nopember": "november",
    "november": "november",
    "desember": "december",
    "des": "december"
  };
  for (const [indo, eng] of Object.entries(monthMappings)) {
    cleaned = cleaned.replace(new RegExp(`\\b${indo}\\b`, 'g'), eng);
  }

  // Error corrections
  cleaned = cleaned
    .replace(/\bagus\b/g, "agustus")
    .replace(/\bagusta\b/g, "agustus");

  // 🟩 STEP 4 — NUMBER WORD NORMALIZER
  const NUMBERS: Record<string, number> = {
    "nol": 0, "kosong": 0,
    "satu": 1,
    "dua": 2,
    "tiga": 3,
    "empat": 4,
    "lima": 5,
    "enam": 6,
    "tujuh": 7,
    "delapan": 8,
    "sembilan": 9,
    "sepuluh": 10,
    "sebelas": 11,
    "duabelas": 12, "dua belas": 12,
    "tiga belas": 13,
    "empat belas": 14,
    "lima belas": 15,
    "enam belas": 16,
    "tujuh belas": 17,
    "delapan belas": 18,
    "sembilan belas": 19,
    "puluh": 10,
    "belas": 10,
    "seratus": 100,
    "ratus": 100,
    "seribu": 1000
  };

  // Error corrections
  cleaned = cleaned
    .replace(/\btulus\b/g, "seribu")
    .replace(/\bseram\b/g, "se")
    .replace(/\b9puluh\b/g, "sembilan puluh")
    .replace(/\bpuluh\b/g, " puluh ")
    .replace(/\bbelas\b/g, " belas ");

  // Convert number words to digits
  const sortedNumKeys = Object.keys(NUMBERS).sort((a, b) => b.length - a.length);
  for (const word of sortedNumKeys) {
    cleaned = cleaned.replace(new RegExp(`\\b${word}\\b`, 'g'), NUMBERS[word].toString());
  }

  // 🟩 STEP 5 — INDONESIAN YEAR PARSER
  function parseIndoYear(text: string): number | null {
    const parts = text.split(/\s+/).filter(p => /^\d+$/.test(p)).map(p => parseInt(p));
    if (parts.length >= 2) {
      const [first, second] = parts;
      if (first === 19 && second < 100) {
        return 1900 + second;
      }
      if (first >= 19 && first <= 21 && second >= 0 && second < 100) {
        return first * 100 + second;
      }
    }
    return null;
  }

  // 🟩 STEP 6 — RECONSTRUCTION → CHRONO STRING
  const words = cleaned.split(/\s+/);
  let monthIndex = -1;
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  for (let i = 0; i < words.length; i++) {
    if (monthNames.includes(words[i])) {
      monthIndex = i;
      break;
    }
  }

  if (monthIndex !== -1) {
    const dayPart = words.slice(0, monthIndex).join('').replace(/\D/g, '');
    const yearPart = words.slice(monthIndex + 1).join(' ');
    const day = dayPart ? parseInt(dayPart) : 1;
    const month = words[monthIndex];
    const year = parseIndoYear(yearPart) || new Date().getFullYear();

    const chronoString = `${day} ${month} ${year}`;
    console.log(`Chrono string: "${chronoString}"`);

    const parsed = chrono.parseDate(chronoString);
    if (parsed) {
      const formatted = parsed.toISOString().split('T')[0];
      console.log(`Parsed date: ${formatted}`);
      return formatted;
    }
  }

  console.log('Date parsing failed');
  return text; // Fallback
}

function mapBankName(text: string): string {
  const bankMap: Record<string, string> = {
    'bri': 'Bank BRI',
    'bni': 'Bank BNI',
    'mandiri': 'Bank Mandiri',
    'bca': 'Bank BCA',
    'btn': 'Bank BTN',
    'bsi': 'Bank Syariah Indonesia'
  };
  const lower = text.toLowerCase();
  for (const [key, value] of Object.entries(bankMap)) {
    if (lower.includes(key)) {
      return value;
    }
  }
  return text; // Fallback
}