// Web Audio API Ringtone Synthesizer for OURA Alarms & Reminders

let activeAlarmInterval: any = null;

export function playAlarmSound() {
  if (typeof window === 'undefined') return;

  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // Create dual-tone melody chime (C5 -> E5 -> G5 -> C6)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);

      gain.gain.setValueAtTime(0, now + idx * 0.15);
      gain.gain.linearRampToValueAtTime(0.35, now + idx * 0.15 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 0.4);
    });

  } catch (err) {
    console.warn('Audio ringtone playback failed:', err);
  }
}

export function startContinuousAlarmRingtone() {
  if (typeof window === 'undefined') return;

  playAlarmSound();

  if (activeAlarmInterval) clearInterval(activeAlarmInterval);
  activeAlarmInterval = setInterval(() => {
    playAlarmSound();
  }, 1200);
}

export function stopContinuousAlarmRingtone() {
  if (activeAlarmInterval) {
    clearInterval(activeAlarmInterval);
    activeAlarmInterval = null;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function triggerSystemNotification(title: string, options?: NotificationOptions) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        icon: '/logo.svg',
        badge: '/logo.svg',
        ...options,
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (e) {
      console.warn('Notification popup error:', e);
    }
  }
}
