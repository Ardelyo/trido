
// utils/sounds.ts
class SoundManager {
  private sounds: Record<string, HTMLAudioElement> = {};
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      // Using public CDN sounds for demo purposes
      this.sounds = {
        'mic_on': new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
        'mic_off': new Audio('https://assets.mixkit.co/active_storage/sfx/2567/2567-preview.mp3'),
        'success': new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'),
        'thinking': new Audio('https://assets.mixkit.co/active_storage/sfx/2053/2053-preview.mp3'),
        'pop': new Audio('https://assets.mixkit.co/active_storage/sfx/2045/2045-preview.mp3'),
      };

      // Set volumes
      Object.values(this.sounds).forEach(s => { s.volume = 0.3; });
      if (this.sounds['thinking']) this.sounds['thinking'].loop = true;
    }
  }

  play(name: string) {
    if (!this.enabled || !this.sounds[name]) return;
    this.sounds[name].currentTime = 0;
    this.sounds[name].play().catch(() => {});
  }

  stop(name: string) {
    if (!this.sounds[name]) return;
    this.sounds[name].pause();
    this.sounds[name].currentTime = 0;
  }

  toggle(enabled: boolean) {
    this.enabled = enabled;
  }
}

export const sounds = new SoundManager();
