// AudioWorklet processor - replaces deprecated ScriptProcessor
// Runs in worklet context, sends PCM chunks via postMessage

const SAMPLES_PER_CHUNK = 16000; // 1 second at 16kHz

class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(SAMPLES_PER_CHUNK * 2);
    this.bufferLength = 0;
  }

  process(inputs, outputs) {
    const input = inputs[0]?.[0];
    if (!input || input.length === 0) return true;

    for (let i = 0; i < input.length; i++) {
      this.buffer[this.bufferLength++] = input[i];
    }

    while (this.bufferLength >= SAMPLES_PER_CHUNK) {
      const int16 = new Int16Array(SAMPLES_PER_CHUNK);
      for (let j = 0; j < SAMPLES_PER_CHUNK; j++) {
        int16[j] = Math.max(-32768, Math.min(32767, Math.round(this.buffer[j] * 32767)));
      }
      this.buffer.copyWithin(0, SAMPLES_PER_CHUNK, this.bufferLength);
      this.bufferLength -= SAMPLES_PER_CHUNK;

      this.port.postMessage({ type: 'pcm', data: int16.buffer }, [int16.buffer]);
    }
    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
