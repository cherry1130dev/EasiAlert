class AudioBeeper {
  private ctx: AudioContext | null = null;
  private isBeeping = false;
  private beepInterval: number | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Play a single short frequency beep
   */
  public playTone(freq = 880, duration = 0.15, type: OscillatorType = 'square') {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio autoplay might be blocked before first user gesture
    }
  }

  /**
   * Start alternating urgent emergency siren beeps for countdown
   */
  public startEmergencySiren() {
    if (this.isBeeping) return;
    this.isBeeping = true;
    let high = true;

    this.beepInterval = window.setInterval(() => {
      this.playTone(high ? 950 : 750, 0.18, 'sawtooth');
      high = !high;
    }, 280);
  }

  /**
   * Stop the siren
   */
  public stopSiren() {
    this.isBeeping = false;
    if (this.beepInterval !== null) {
      clearInterval(this.beepInterval);
      this.beepInterval = null;
    }
  }

  /**
   * Play confirmation alert chime (when alert successfully sent)
   */
  public playDispatchSound() {
    this.playTone(523.25, 0.1, 'sine'); // C5
    setTimeout(() => this.playTone(659.25, 0.1, 'sine'), 100); // E5
    setTimeout(() => this.playTone(783.99, 0.25, 'sine'), 200); // G5
  }

  /**
   * Play cancel tone (when user cancels alert)
   */
  public playCancelSound() {
    this.playTone(440, 0.15, 'sine');
    setTimeout(() => this.playTone(330, 0.2, 'sine'), 120);
  }
}

export const soundManager = new AudioBeeper();
