import { NextRequest, NextResponse } from 'next/server';
export async function POST(request: NextRequest) {
  try {
    const { text }: { text: string } = await request.json();

    console.log(`Incoming text to synthesize: ${text}`);
    console.log(`Model used: eleven_turbo_v2`);
    console.log(`Voice used: JBFqnCBsd6RMkjVDRZzb`);

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2',
        output_format: 'mp3_44100_128',
      }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs TTS error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const audioBytes = new Uint8Array(audioBuffer);

    console.log(`Audio buffer size returned: ${audioBytes.length} bytes`);

    return new NextResponse(audioBytes, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error('Error in TTS:', error);
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
  }
}