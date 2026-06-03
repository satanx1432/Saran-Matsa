// test_nvidia.ts
async function test() {
  const key = process.env.SPEECH_TO_TEXT_API_KEY || process.env.NVIDIA_API_KEY || process.env.RAG_LLM_API_KEY;
  console.log("Using API Key of length:", key ? key.length : 0);
  if (!key) {
    console.log("No key found in environment.");
    return;
  }

  // Create a minimal 1-second dummy WAV binary buffer (header + silence)
  const dummyWav = Buffer.alloc(1000);
  // Simple RIFF header for wave format
  dummyWav.write("RIFF", 0);
  dummyWav.writeUInt32LE(992, 4);
  dummyWav.write("WAVE", 8);
  dummyWav.write("fmt ", 12);
  dummyWav.writeUInt32LE(16, 16);
  dummyWav.writeUInt16LE(1, 20); // Mono PCM
  dummyWav.writeUInt16LE(1, 22); // 1 channel
  dummyWav.writeUInt32LE(16000, 24); // 16000Hz samplerate
  dummyWav.writeUInt32LE(32000, 28); // byte rate
  dummyWav.writeUInt16LE(2, 32); // block align
  dummyWav.writeUInt16LE(16, 34); // 16 bits per sample
  dummyWav.write("data", 36);
  dummyWav.writeUInt32LE(956, 40);

  const audioBlob = new Blob([dummyWav], { type: "audio/wav" });

  const endpoints = [
    "https://ai.api.nvidia.com/v1/audio/transcriptions",
    "https://integrate.api.nvidia.com/v1/audio/transcriptions"
  ];

  const models = [
    "openai/whisper-large-v3",
    "nvidia/whisper-large-v3",
    "whisper-large-v3"
  ];

  for (const endpoint of endpoints) {
    for (const model of models) {
      console.log(`\n--- Testing ${endpoint} with model "${model}" ---`);
      
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.wav");
      formData.append("model", model);

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${key}`
          },
          body: formData
        });

        console.log(`Status Code: ${res.status}`);
        const text = await res.text();
        console.log(`Response Text (first 500 chars):`, text.slice(0, 500));
      } catch (err: any) {
        console.error(`Fetch exception for ${model}:`, err.message);
      }
    }
  }
}

test();




