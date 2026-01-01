/**
 * Voice Input Hook for n8n Chat Widget
 * Handles speech-to-text functionality using Web Speech API
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseVoiceInputOptions {
  enabled: boolean;
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export interface UseVoiceInputReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  resetTranscript: () => void;
  error: string | null;
}

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onspeechend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

/**
 * Check if speech recognition is supported in the browser
 */
function isSpeechRecognitionSupported(): boolean {
  return !!(
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)
  );
}

/**
 * Create a speech recognition instance
 */
function createSpeechRecognition(): SpeechRecognition | null {
  if (typeof window === 'undefined') return null;

  const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognitionClass) return null;

  return new SpeechRecognitionClass();
}

/**
 * Hook for voice input functionality
 */
export function useVoiceInput({
  enabled,
  language = 'en-US',
  continuous = false,
  interimResults = true,
  onTranscript,
  onError,
}: UseVoiceInputOptions): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(() => isSpeechRecognitionSupported());

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);

  // Initialize speech recognition
  useEffect(() => {
    if (!enabled || !isSupported) return;

    const recognition = createSpeechRecognition();
    if (!recognition) return;

    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript);
        setInterimTranscript('');
        onTranscript?.(finalTranscript, true);
      } else if (interim) {
        setInterimTranscript(interim);
        onTranscript?.(interim, false);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMessage = getErrorMessage(event.error);
      setError(errorMessage);
      setIsListening(false);
      isListeningRef.current = false;
      onError?.(errorMessage);
    };

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
      isListeningRef.current = false;
      setInterimTranscript('');
    };

    recognition.onspeechend = () => {
      if (!continuous) {
        recognition.stop();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current && isListeningRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [enabled, isSupported, language, continuous, interimResults, onTranscript, onError]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListeningRef.current) return;

    setError(null);
    setInterimTranscript('');

    try {
      recognitionRef.current.start();
    } catch (e) {
      // Recognition might already be running
      setError('Failed to start voice recognition');
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListeningRef.current) return;

    try {
      recognitionRef.current.stop();
    } catch {
      // Ignore errors when stopping
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    isSupported: enabled && isSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
    error,
  };
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'no-speech':
      return 'No speech was detected. Please try again.';
    case 'audio-capture':
      return 'No microphone was found or microphone access was denied.';
    case 'not-allowed':
      return 'Microphone access was denied. Please allow microphone access and try again.';
    case 'network':
      return 'Network error occurred. Please check your connection.';
    case 'aborted':
      return 'Speech recognition was aborted.';
    case 'service-not-allowed':
      return 'Speech recognition service is not allowed.';
    default:
      return 'An error occurred with voice recognition.';
  }
}

/**
 * Hook to check microphone permission
 */
export function useMicrophonePermission(): {
  permission: 'granted' | 'denied' | 'prompt' | 'unknown';
  requestPermission: () => Promise<boolean>;
} {
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>(
    'unknown'
  );

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions) {
      return;
    }

    navigator.permissions.query({ name: 'microphone' as PermissionName }).then((result) => {
      setPermission(result.state as 'granted' | 'denied' | 'prompt');

      result.onchange = () => {
        setPermission(result.state as 'granted' | 'denied' | 'prompt');
      };
    }).catch(() => {
      // Permission API not supported for microphone
      setPermission('unknown');
    });
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop all tracks after getting permission
      stream.getTracks().forEach((track) => track.stop());
      setPermission('granted');
      return true;
    } catch {
      setPermission('denied');
      return false;
    }
  }, []);

  return { permission, requestPermission };
}
