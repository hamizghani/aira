import { NextRequest, NextResponse } from 'next/server';
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`STT request received (size: ${file.size} bytes)`);

    const audioBuffer = await file.arrayBuffer();

    const elevenlabsFormData = new FormData();
    elevenlabsFormData.append('file', new Blob([audioBuffer], { type: 'audio/wav' }), 'audio.wav');
    elevenlabsFormData.append('model_id', 'scribe_v1');
    elevenlabsFormData.append('tag_audio_events', 'true');
    elevenlabsFormData.append('language_code', 'ind');
    elevenlabsFormData.append('diarize', 'true');

    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
      body: elevenlabsFormData,
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs STT error: ${response.status}`);
    }

    const result = await response.json();
    const transcript = result.text || '';

    console.log(`Detected language: ind`);
    console.log(`Final transcript returned: ${transcript}`);

    return NextResponse.json({ text: transcript });
  } catch (error) {
    console.error('Error in STT:', error);
    return NextResponse.json({ error: 'STT failed' }, { status: 500 });
  }
}