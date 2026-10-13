import { useState, useEffect, useRef, useCallback } from 'react';

export interface SpeechState {
  isPlaying: boolean;
  isPaused: boolean;
  supported: boolean;
  hasMalayalamVoice: boolean;
  currentText: string;
}

export function useMalayalamSpeech(defaultRate = 0.9) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [supported, setSupported] = useState(false);
  const [hasMalayalamVoice, setHasMalayalamVoice] = useState(false);
  const [speechRate, setSpeechRate] = useState(defaultRate);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check support and load voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);

      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        const mlVoice = voices.some(
          (v) =>
            v.lang.toLowerCase().includes('ml') ||
            v.lang.toLowerCase().includes('malayalam') ||
            v.name.toLowerCase().includes('malayalam')
        );
        setHasMalayalamVoice(mlVoice);
        setVoicesLoaded(true);
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  }, []);

  const pause = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  const speak = useCallback(
    (textToRead: string, onEndCallback?: () => void) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      window.speechSynthesis.cancel();

      // Clean text for speech: remove URLs, markdown, brackets
      const cleanText = textToRead
        .replace(/https?:\/\/\S+/g, '')
        .replace(/[*_#`[\]()]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utteranceRef.current = utterance;
      utterance.rate = speechRate;
      utterance.pitch = 1.0;

      // Select voice: Malayalam or Indian English / fallback
      const voices = window.speechSynthesis.getVoices();
      const mlVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().includes('ml') ||
          v.lang.toLowerCase().includes('malayalam') ||
          v.name.toLowerCase().includes('malayalam')
      );

      if (mlVoice) {
        utterance.voice = mlVoice;
        utterance.lang = mlVoice.lang;
      } else {
        // Fallback to en-IN or generic
        const inVoice = voices.find((v) => v.lang.toLowerCase().includes('in'));
        if (inVoice) {
          utterance.voice = inVoice;
          utterance.lang = inVoice.lang;
        } else {
          utterance.lang = 'ml-IN';
        }
      }

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
        if (onEndCallback) onEndCallback();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        setIsPlaying(false);
        setIsPaused(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [speechRate]
  );

  return {
    isPlaying,
    isPaused,
    supported,
    hasMalayalamVoice,
    voicesLoaded,
    speechRate,
    setSpeechRate,
    speak,
    pause,
    resume,
    stop,
  };
}
