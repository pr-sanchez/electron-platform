import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLogger } from './hooks/useLogger';

interface Recording {
  id: string;
  blob: Blob;
  url: string;
  timestamp: number;
  duration: number;
}

const VoiceRecordingView: React.FC = () => {
  const logger = useLogger();
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);

  // Load recordings from localStorage on mount
  useEffect(() => {
    const savedRecordings = localStorage.getItem('voice-recordings');
    if (savedRecordings) {
      try {
        const parsed = JSON.parse(savedRecordings);
        const recordingsWithUrls = parsed.map(
          (
            rec: Omit<Recording, 'url'> & { data: string; mimeType?: string }
          ) => {
            const byteCharacters = atob(rec.data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], {
              type: rec.mimeType || 'audio/webm',
            });
            const url = URL.createObjectURL(blob);
            return {
              id: rec.id,
              blob,
              url,
              timestamp: rec.timestamp,
              duration: rec.duration,
            };
          }
        );
        setRecordings(recordingsWithUrls);
      } catch (error) {
        logger.error('Failed to load recordings', { error });
      }
    }
  }, [logger]);

  // Save recordings to localStorage
  const saveRecordings = useCallback(
    (newRecordings: Recording[]) => {
      try {
        const recordingsToSave = newRecordings.map((rec) => {
          return new Promise<
            Omit<Recording, 'url' | 'blob'> & { data: string; mimeType: string }
          >((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64data = (reader.result as string).split(',')[1];
              resolve({
                id: rec.id,
                data: base64data,
                timestamp: rec.timestamp,
                duration: rec.duration,
                mimeType: rec.blob.type || 'audio/webm',
              });
            };
            reader.readAsDataURL(rec.blob);
          });
        });

        Promise.all(recordingsToSave).then((saved) => {
          localStorage.setItem('voice-recordings', JSON.stringify(saved));
        });
      } catch (error) {
        logger.error('Failed to save recordings', { error });
      }
    },
    [logger]
  );

  // Analyze audio levels
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !isRecording) {
      return;
    }

    const analyser = analyserRef.current;
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(frequencyData);

    const average =
      frequencyData.reduce((sum, value) => sum + value, 0) /
      frequencyData.length;
    const normalizedLevel = Math.min(average / 128, 1);
    setAudioLevel(normalizedLevel);

    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    }
  }, [isRecording]);

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up audio context for audio level visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Set up MediaRecorder
      let options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options.mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options.mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options.mimeType = 'audio/mp4';
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const duration = (Date.now() - startTimeRef.current) / 1000;

        const newRecording: Recording = {
          id: `recording-${Date.now()}`,
          blob,
          url,
          timestamp: startTimeRef.current,
          duration,
        };

        setRecordings((prevRecordings) => {
          const updatedRecordings = [newRecording, ...prevRecordings];
          saveRecordings(updatedRecordings);
          return updatedRecordings;
        });

        logger.info('recording-completed', { duration, size: blob.size });
      };

      startTimeRef.current = Date.now();
      mediaRecorder.start();
      setIsRecording(true);
      setAudioLevel(0);

      analyzeAudio();

      logger.info('recording-started', {});
    } catch (error) {
      logger.error('recording-failed', { error: String(error) });
      alert('Failed to access microphone. Please check permissions.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      logger.info('recording-stopped', {});
    }
  };

  // Toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Play recording
  const playRecording = (recording: Recording) => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
      setPlayingId(null);
    }

    const audio = new Audio(recording.url);
    audioElementRef.current = audio;
    setPlayingId(recording.id);

    audio.onended = () => {
      setPlayingId(null);
      audioElementRef.current = null;
    };

    audio.onerror = () => {
      setPlayingId(null);
      audioElementRef.current = null;
      logger.error('playback-failed', { recordingId: recording.id });
    };

    audio.play().catch((error) => {
      logger.error('playback-error', { error: String(error) });
      setPlayingId(null);
    });
  };

  // Delete recording
  const deleteRecording = (id: string) => {
    const updatedRecordings = recordings.filter((rec) => rec.id !== id);
    setRecordings(updatedRecordings);
    saveRecordings(updatedRecordings);

    const recording = recordings.find((rec) => rec.id === id);
    if (recording) {
      URL.revokeObjectURL(recording.url);
    }

    logger.info('recording-deleted', { recordingId: id });
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording();
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      recordings.forEach((rec) => URL.revokeObjectURL(rec.url));
    };
  }, []);

  return (
    <div className="voice-recording-view">
      <div className="recording-controls">
        <div className="microphone-container">
          <button
            className={`microphone-button ${isRecording ? 'recording' : ''}`}
            onClick={toggleRecording}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            <svg
              width="120"
              height="120"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z"
                fill="currentColor"
              />
              <path
                d="M19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10H7V12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12V10H19Z"
                fill="currentColor"
              />
              <path d="M11 22H13V20H11V22Z" fill="currentColor" />
            </svg>
          </button>
          {isRecording && (
            <div className="audio-level-indicator">
              <div
                className="audio-level-bar"
                style={{ width: `${audioLevel * 100}%` }}
              />
            </div>
          )}
        </div>
        <div className="recording-status">
          {isRecording ? (
            <span className="status-text recording-text">Recording...</span>
          ) : (
            <span className="status-text">Click to start recording</span>
          )}
        </div>
      </div>

      <div className="recordings-list">
        <div className="recordings-header">
          <h2>Recordings ({recordings.length})</h2>
        </div>
        <div className="recordings-container">
          {recordings.length === 0 ? (
            <div className="recordings-empty">No recordings yet</div>
          ) : (
            recordings.map((recording) => (
              <div key={recording.id} className="recording-item">
                <div className="recording-info">
                  <div className="recording-title">
                    Recording {new Date(recording.timestamp).toLocaleString()}
                  </div>
                  <div className="recording-meta">
                    {formatDuration(recording.duration)} •{' '}
                    {formatDate(recording.timestamp)}
                  </div>
                </div>
                <div className="recording-actions">
                  <button
                    className={`play-button ${
                      playingId === recording.id ? 'playing' : ''
                    }`}
                    onClick={() => playRecording(recording)}
                    aria-label="Play recording"
                  >
                    {playingId === recording.id ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M6 4H10V20H6V4ZM14 4H18V20H14V4Z" />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M8 5V19L19 12L8 5Z" />
                      </svg>
                    )}
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => deleteRecording(recording.id)}
                    aria-label="Delete recording"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceRecordingView;
