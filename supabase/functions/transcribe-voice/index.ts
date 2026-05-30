import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { requireUser, isSafePublicUrl } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { audioUrl, audioBase64 } = await req.json()
    
    let audioData: Uint8Array;
    let filename = 'audio.webm';

    if (audioBase64) {
      // Handle base64 audio data
      audioData = processBase64Chunks(audioBase64);
    } else if (audioUrl) {
      // Fetch audio from URL
      console.log('[transcribe-voice] Fetching audio from URL:', audioUrl);
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        throw new Error(`Failed to fetch audio: ${audioResponse.status}`);
      }
      const arrayBuffer = await audioResponse.arrayBuffer();
      audioData = new Uint8Array(arrayBuffer);
      
      // Extract filename from URL
      const urlParts = audioUrl.split('/');
      filename = urlParts[urlParts.length - 1] || 'audio.webm';
    } else {
      throw new Error('Either audioUrl or audioBase64 is required');
    }

    console.log('[transcribe-voice] Audio data size:', audioData.length);

    // Prepare form data for OpenAI Whisper API
    const formData = new FormData();
    const blob = new Blob([audioData], { type: 'audio/webm' });
    formData.append('file', blob, filename);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en'); // Can be made configurable

    // Send to OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[transcribe-voice] OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const result = await response.json();
    console.log('[transcribe-voice] Transcription successful:', result.text?.substring(0, 50));

    return new Response(
      JSON.stringify({ text: result.text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[transcribe-voice] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
