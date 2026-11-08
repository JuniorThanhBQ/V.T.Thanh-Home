const SAMPLE_RATE = 24000;
const BLOCK_BYTES = 5760;
const MAX_AUDIO_BYTES = 16500000;
const MAX_FRAME_CHARS = 16000;

export class SpeechPlayback {
  private readonly context = new AudioContext();
  private readonly pending: Uint8Array[] = [];
  private readonly sources = new Set<AudioBufferSourceNode>();
  private block = new Uint8Array(BLOCK_BYTES);
  private filled = 0;
  private received = 0;
  private nextTime = 0;
  private complete = false;
  private closed = false;
  private started = false;

  constructor(
    private readonly onStart: () => void,
    private readonly onEnd: () => void,
  ) {}

  public resume(): Promise<void> {
    return this.context.resume();
  }

  public push(bytes: Uint8Array): void {
    this.received += bytes.length;
    if (this.received > MAX_AUDIO_BYTES) throw new Error('Speech response too large');
    for (let offset = 0; offset < bytes.length;) {
      const count = Math.min(bytes.length - offset, BLOCK_BYTES - this.filled);
      this.block.set(bytes.subarray(offset, offset + count), this.filled);
      offset += count;
      this.filled += count;
      if (this.filled === BLOCK_BYTES) {
        this.pending.push(this.block);
        this.block = new Uint8Array(BLOCK_BYTES);
        this.filled = 0;
      }
    }
    this.schedule();
  }

  public finish(): void {
    if (!this.received || this.filled % 2) throw new Error('Incomplete PCM sample');
    if (this.filled) this.pending.push(this.block.subarray(0, this.filled));
    this.complete = true;
    this.schedule();
  }

  private schedule(): void {
    if (this.closed) return;
    while (this.pending.length && this.nextTime < this.context.currentTime + 0.75) {
      const bytes = this.pending.shift()!;
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const buffer = this.context.createBuffer(1, bytes.length / 2, SAMPLE_RATE);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = view.getInt16(i * 2, true) / 32768;
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.context.destination);
      source.onended = () => {
        this.sources.delete(source);
        source.disconnect();
        this.schedule();
      };
      this.sources.add(source);
      if (this.nextTime <= this.context.currentTime)
        this.nextTime = this.context.currentTime + 0.02;
      source.start(this.nextTime);
      this.nextTime += buffer.duration;
      if (!this.started) {
        this.started = true;
        this.onStart();
      }
    }
    if (this.complete && !this.sources.size) this.onEnd();
  }

  public close(): void {
    this.closed = true;
    this.pending.length = 0;
    for (const source of this.sources) {
      source.onended = null;
      source.stop();
      source.disconnect();
    }
    this.sources.clear();
    void this.context.close().catch(() => undefined);
  }
}

export async function readSpeechStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  playback: SpeechPlayback,
  onError: (status: number) => never,
): Promise<void> {
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let tail = '';
  let data = '';
  let started = false;
  let sequence = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) throw new Error('Incomplete speech stream');
    tail += decoder.decode(value, { stream: true });
    let newline: number;
    while ((newline = tail.indexOf('\n')) >= 0) {
      if (newline > MAX_FRAME_CHARS) throw new Error('Speech frame too large');
      const line = tail.slice(0, newline).replace(/\r$/, '');
      tail = tail.slice(newline + 1);
      if (line.startsWith('data:')) {
        data += line.slice(5) + '\n';
        if (data.length > MAX_FRAME_CHARS) throw new Error('Speech frame too large');
      }
      if (line || !data) continue;
      const frame = JSON.parse(data);
      data = '';
      if (frame?.type === 'error') onError(frame.status === 429 ? 429 : 503);
      if (!started) {
        if (
          frame?.type !== 'start' ||
          frame.format !== 's16le' ||
          frame.rate !== SAMPLE_RATE ||
          frame.channels !== 1
        ) {
          throw new Error('Unsupported speech format');
        }
        started = true;
      } else if (
        frame?.type === 'audio' &&
        frame.seq === sequence &&
        typeof frame.data === 'string'
      ) {
        const pcm = atob(frame.data);
        if (!pcm.length || pcm.length > 9600) throw new Error('Invalid PCM chunk');
        playback.push(Uint8Array.from(pcm, (byte) => byte.charCodeAt(0)));
        sequence++;
      } else if (frame?.type === 'done' && frame.chunks === sequence) {
        playback.finish();
        return;
      } else {
        throw new Error('Invalid speech frame');
      }
    }
    if (tail.length > MAX_FRAME_CHARS) throw new Error('Speech frame too large');
  }
}
