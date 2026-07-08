import { useState, useEffect, useRef, useCallback } from 'react';

export function useVoiceSearch(onResult) {
  const [listening, setListening]     = useState(false);
  const [transcript, setTranscript]   = useState('');
  const [supported, setSupported]     = useState(false);
  const [error, setError]             = useState(null);
  const recognitionRef                = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setSupported(false); return; }

    setSupported(true);
    const rec = new SpeechRecognition();
    rec.continuous      = false;
    rec.interimResults  = true;
    rec.lang            = 'hi-IN'; // Hindi + English (Indian English)
    rec.maxAlternatives = 1;

    rec.onstart = () => { setListening(true); setError(null); setTranscript(''); };

    rec.onresult = (e) => {
      let interim = '';
      let final   = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      const current = final || interim;
      setTranscript(current);
      if (final) {
        onResult?.(final.trim());
        setListening(false);
      }
    };

    rec.onerror = (e) => {
      setListening(false);
      if (e.error === 'not-allowed') setError('Microphone access denied. Allow mic in browser settings.');
      else if (e.error === 'no-speech') setError('No speech detected. Try again.');
      else setError('Voice search error. Try again.');
    };

    rec.onend = () => setListening(false);

    recognitionRef.current = rec;
    return () => { rec.abort(); };
  }, [onResult]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || listening) return;
    setError(null);
    try { recognitionRef.current.start(); }
    catch (_) { recognitionRef.current.stop(); setTimeout(() => recognitionRef.current?.start(), 200); }
  }, [listening]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, transcript, supported, error, startListening, stopListening };
}
