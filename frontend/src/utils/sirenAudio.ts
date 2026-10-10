// High-fidelity industrial emergency siren audio engine using Web Audio API

class MiningSirenEngine {
  private ctx: AudioContext | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;

  start() {
    if (this.isPlaying) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master volume node
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(0.22, this.ctx.currentTime + 0.3);
      this.masterGain.connect(this.ctx.destination);

      // Primary horn oscillator (sawtooth for brassy industrial timbre)
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = "sawtooth";
      this.osc1.frequency.setValueAtTime(620, this.ctx.currentTime);

      // Secondary detuned oscillator (+6Hz) for acoustic beating
      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = "sawtooth";
      this.osc2.frequency.setValueAtTime(626, this.ctx.currentTime);

      // LFO for authentic undulating rise-and-fall wail (0.65 Hz)
      this.lfo = this.ctx.createOscillator();
      this.lfo.type = "sine";
      this.lfo.frequency.setValueAtTime(0.65, this.ctx.currentTime);

      this.lfoGain = this.ctx.createGain();
      this.lfoGain.gain.setValueAtTime(220, this.ctx.currentTime); // frequency swing +/- 220Hz

      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.osc1.frequency);
      this.lfoGain.connect(this.osc2.frequency);

      this.osc1.connect(this.masterGain);
      this.osc2.connect(this.masterGain);

      this.osc1.start();
      this.osc2.start();
      this.lfo.start();
      this.isPlaying = true;
    } catch {
      // AudioContext restricted or unavailable
    }
  }

  stop() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      this.masterGain.gain.linearRampToValueAtTime(0.001, now + 0.35);
      setTimeout(() => {
        try {
          this.osc1?.stop();
          this.osc2?.stop();
          this.lfo?.stop();
          this.ctx?.close();
        } catch {}
        this.isPlaying = false;
        this.ctx = null;
      }, 380);
    } catch {
      this.isPlaying = false;
      this.ctx = null;
    }
  }

  // Play a quick two-tone warning chimes for broadcast dispatch
  playBroadcastChime() {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      gain.connect(ctx.destination);

      // First tone (880Hz - A5)
      const oscA = ctx.createOscillator();
      oscA.type = "sine";
      oscA.frequency.setValueAtTime(880, ctx.currentTime);
      oscA.connect(gain);
      oscA.start(ctx.currentTime);
      oscA.stop(ctx.currentTime + 0.35);

      // Second tone (1174Hz - D6)
      const oscB = ctx.createOscillator();
      oscB.type = "sine";
      oscB.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.3);
      oscB.connect(gain);
      oscB.start(ctx.currentTime + 0.3);
      oscB.stop(ctx.currentTime + 1.0);
    } catch {}
  }
}

export const sirenEngine = new MiningSirenEngine();
