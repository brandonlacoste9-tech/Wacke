/**
 * audio.ts
 * Synthesizes classic arcade chimes using the browser's native Web Audio API.
 * 100% network-free and instant audio playback.
 */

export function playSyntheticSound(type: string) {
  if (typeof window === "undefined") return;

  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === "bell") {
      // Cling-Cling door chime
      const playChime = (time: number, freq: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, time);
        
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(time);
        osc.stop(time + 0.5);
      };
      
      playChime(ctx.currentTime, 987.77); // B5 note
      playChime(ctx.currentTime + 0.12, 1318.51); // E6 note
    } else if (type === "coin") {
      // Retro double arcade chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === "alarm") {
      // Siren pulse alert
      const duration = 0.6;
      for (let i = 0; i < 3; i++) {
        const time = ctx.currentTime + i * 0.18;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "square";
        osc.frequency.setValueAtTime(i % 2 === 0 ? 550 : 700, time);
        
        gain.gain.setValueAtTime(0.08, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(time);
        osc.stop(time + 0.16);
      }
    } else if (type === "laser") {
      // Decreasing frequency retro zap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.35);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {
    console.warn("Web Audio API not supported or user interaction required:", e);
  }
}

/**
 * Browser-native speech synthesis for Grok voice output.
 * Uses device voices (great French support on modern OS).
 * Complements the paid Grok xAI cloud TTS for user messages.
 * Auto-loads voices and prefers French voices.
 */
export function speakWithGrokVoice(text: string, lang = "fr-FR") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  const speak = () => {
    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 1.1;   // energetic hype delivery
      utterance.pitch = 1.08;
      utterance.volume = 0.95;

      // Prefer French voice
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.lang.toLowerCase().includes("fr-ca") ||
          v.lang.toLowerCase().includes("fr-fr") ||
          v.name.toLowerCase().includes("french") ||
          v.name.toLowerCase().includes("quebec") ||
          v.name.toLowerCase().includes("canadian")
      );
      if (preferred) {
        utterance.voice = preferred;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis failed:", e);
    }
  };

  // Voices may load asynchronously
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    window.speechSynthesis.onvoiceschanged = speak;
    // Fallback speak after short delay
    setTimeout(speak, 300);
  } else {
    speak();
  }
}

/** Stop any ongoing Grok voice */
export function stopGrokVoice() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Cloud Grok xAI Voice (real AI TTS) for system outputs (CoHost, HotTakes, Fire, events...).
 * Calls /api/tts/system (no user tokens deducted). Falls back to browser synth on failure.
 * Use for premium "Grok is really speaking" feel on key AI moments.
 */
export async function speakWithCloudGrokVoice(text: string, lang: "fr" | "en" = "fr") {
  if (typeof window === "undefined") return;

  try {
    const res = await fetch("/api/tts/system", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.replace(/— Grok xAI/g, "").trim(), lang }),
    });

    if (!res.ok) throw new Error(await res.text());

    const { audioUrl } = await res.json();
    if (audioUrl) {
      // Stop any browser synth that might be running
      stopGrokVoice();
      const audio = new Audio(audioUrl);
      // slightly boost for hype
      audio.volume = 0.95;
      await audio.play();
    }
  } catch (e) {
    console.warn("[CLOUD_GROK_TTS] falling back to browser voice:", e);
    // Fallback keeps the experience alive
    speakWithGrokVoice(text, lang === "fr" ? "fr-FR" : "en-US");
  }
}
