import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export const useVoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    try {
      // Clear previous recording
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      setAudioBlob(null);
      setRecordingDuration(0);
      setTranscription('');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Start recording timer
      startTimeRef.current = Date.now();
      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingDuration(elapsed);
      }, 100);

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Speak clearly into your microphone...",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [audioUrl]);

  const transcribeAudioBlob = useCallback(async (blob: Blob) => {
    setIsProcessing(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64Audio = reader.result?.toString().split(',')[1];
          if (!base64Audio) {
            reject(new Error('Failed to convert audio'));
          } else {
            resolve(base64Audio);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read audio file'));
      });

      reader.readAsDataURL(blob);
      const base64Audio = await base64Promise;

      // Send to speech-to-text function
      console.log('Sending audio for transcription in background...');
      const { data, error } = await supabase.functions.invoke('speech-to-text', {
        body: { audio: base64Audio }
      });

      if (error) {
        console.error('Transcription error:', error);
        throw error;
      }

      const text = data?.text || '';
      
      if (!text) {
        throw new Error('No transcription received. Please speak more clearly.');
      }
      
      console.log('Transcription complete:', text);
      setTranscription(text);
      
      toast({
        title: "Transcription Complete",
        description: `Transcribed ${text.split(' ').length} words.`,
      });

      return text;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      toast({
        title: "Transcription Error",
        description: error instanceof Error ? error.message : "Failed to transcribe audio",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const stopRecording = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        reject(new Error('No active recording'));
        return;
      }

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      mediaRecorder.onstop = async () => {
        setIsRecording(false);

        try {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setAudioBlob(blob);
          
          // Create URL for playback
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          
          toast({
            title: "Recording Saved",
            description: `${recordingDuration}s recorded. Transcribing in background...`,
          });
          
          // Stop all tracks
          mediaRecorder.stream.getTracks().forEach(track => track.stop());
          
          // Start background transcription
          transcribeAudioBlob(blob).catch(err => {
            console.error('Background transcription failed:', err);
          });
          
          resolve();
        } catch (error) {
          console.error('Error saving audio:', error);
          toast({
            title: "Save Error",
            description: "Failed to save recording",
            variant: "destructive",
          });
          reject(error);
        }
      };

      mediaRecorder.stop();
    });
  }, [recordingDuration, transcribeAudioBlob]);

  const transcribeAudio = useCallback(async (): Promise<string> => {
    if (!audioBlob) {
      throw new Error('No audio to transcribe');
    }

    return transcribeAudioBlob(audioBlob);
  }, [audioBlob, transcribeAudioBlob]);

  const cancelRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setIsRecording(false);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
    setTranscription('');
    audioChunksRef.current = [];
    
    toast({
      title: "Recording Cancelled",
      description: "Your recording was discarded.",
    });
  }, [audioUrl]);

  return {
    isRecording,
    isProcessing,
    recordingDuration,
    audioUrl,
    hasRecording: !!audioBlob,
    transcription,
    startRecording,
    stopRecording,
    transcribeAudio,
    cancelRecording,
  };
};
