/**
 * useVoiceInput Hook
 *
 * Provides speech-to-text functionality using the Web Speech API.
 * Per 00-overview.md: "Voice input (speech-to-text)"
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseVoiceInputOptions {
  /** Language for speech recognition (default: browser locale) */
  language?: string;
  /** Whether to use continuous recognition */
  continuous?: boolean;
  /** Whether to return interim results */
  interimResults?: boolean;
  /** Callback when transcript is received */
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  /** Callback when error occurs */
  onError?: (error: string) => void;
  /** Callback when recognition starts */
  onStart?: () => void;
  /** Callback when recognition ends */
  onEnd?: () => void;
}

export interface UseVoiceInputReturn {
  /** Whether voice input is supported */
  isSupported: boolean;
  /** Whether currently listening */
  isListening: boolean;
  /** Current transcript (interim) */
  transcript: string;
  /** Final transcript */
  finalTranscript: string;
  /** Error message if any */
  error: string | null;
  /** Start listening */
  startListening: () => void;
  /** Stop listening */
  stopListening: () => void;
  /** Toggle listening state */
  toggleListening: () => void;
  /** Clear transcript */
  clearTranscript: () => void;
}

// Check for Web Speech API support
const SpeechRecognition =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

/**
 * Hook for voice input using Web Speech API
 */
export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const {
    language,
    continuous = false,
    interimResults = true,
    onTranscript,
    onError,
    onStart,
    onEnd,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isSupported = !!SpeechRecognition;

  // Initialize recognition
  useEffect(() => {
    if (!isSupported) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language || navigator.language || 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      onStart?.();
    };

    recognition.onend = () => {
      setIsListening(false);
      onEnd?.();
    };

    recognition.onresult = (event: any) => {
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;

        if (result.isFinal) {
          finalText += text;
        } else {
          interimText += text;
        }
      }

      if (finalText) {
        setFinalTranscript((prev) => prev + finalText);
        onTranscript?.(finalText, true);
      }

      setTranscript(interimText);
      if (interimText) {
        onTranscript?.(interimText, false);
      }
    };

    recognition.onerror = (event: any) => {
      let errorMessage = 'Speech recognition error';

      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech was detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone was found. Please ensure a microphone is connected.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission was denied. Please allow access to use voice input.';
          break;
        case 'network':
          errorMessage = 'Network error occurred. Please check your connection.';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition was aborted.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }

      setError(errorMessage);
      setIsListening(false);
      onError?.(errorMessage);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isSupported, language, continuous, interimResults, onTranscript, onError, onStart, onEnd]);

  // Start listening
  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser.');
      onError?.('Speech recognition is not supported in this browser.');
      return;
    }

    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setError(null);

      try {
        recognitionRef.current.start();
      } catch (err) {
        // Recognition might already be running
        console.warn('Speech recognition start error:', err);
      }
    }
  }, [isSupported, isListening, onError]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setTranscript('');
    setFinalTranscript('');
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    finalTranscript,
    error,
    startListening,
    stopListening,
    toggleListening,
    clearTranscript,
  };
}

export default useVoiceInput;
