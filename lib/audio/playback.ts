import { base64ToUint8Array, int16ToFloat32, rms } from "./pcm";

const OUTPUT_SAMPLE_RATE = 24000;

export class PcmPlayer {
  private ctx: AudioContext;
  private nextStartTime = 0;
  private onLevel: (level: number) => void;

  constructor(ctx: AudioContext, onLevel: (level: number) => void) {
    this.ctx = ctx;
    this.onLevel = onLevel;
  }

  enqueue(base64Pcm16: string): void {
    const bytes = base64ToUint8Array(base64Pcm16);
    const int16 = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
    const float32 = int16ToFloat32(int16);

    const buffer = this.ctx.createBuffer(1, float32.length, OUTPUT_SAMPLE_RATE);
    buffer.copyToChannel(float32 as Float32Array<ArrayBuffer>, 0);

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.ctx.destination);

    const now = this.ctx.currentTime;
    const startAt = Math.max(now, this.nextStartTime);
    source.start(startAt);
    this.nextStartTime = startAt + buffer.duration;

    this.onLevel(rms(float32));
  }

  reset(): void {
    this.nextStartTime = 0;
  }
}
