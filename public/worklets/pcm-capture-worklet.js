// Forwards raw mic audio (Float32, native sample rate) to the main thread
// in fixed-size chunks. Downsampling/encoding happens on the main thread —
// keeping this processor trivial avoids doing resampling math on the audio
// thread, which is easy to get wrong under real-time constraints.
class PcmCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.chunkSize = 2048;
    this.buffer = new Float32Array(this.chunkSize);
    this.offset = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (input && input[0]) {
      const channel = input[0];
      for (let i = 0; i < channel.length; i++) {
        this.buffer[this.offset++] = channel[i];
        if (this.offset >= this.chunkSize) {
          this.port.postMessage(this.buffer.slice(0));
          this.offset = 0;
        }
      }
    }
    return true;
  }
}

registerProcessor("pcm-capture-processor", PcmCaptureProcessor);
