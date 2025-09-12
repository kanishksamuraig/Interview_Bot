import { useState, useRef, useEffect } from 'react';

type RecorderProps = {
    onTranscriptionComplete: (text: string, timeTaken: number) => void;
    stopTimer: () => number;
    startTimer: () => void;
};

export function Recorder({ onTranscriptionComplete, stopTimer, startTimer }: RecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);

    const handleStartRecording = async () => {
        // Start the timer as soon as recording begins
        startTimer();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please check permissions.');
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current) {
            // Stop the timer immediately and capture the time
            const timeTaken = stopTimer();

            // Define what happens after the recorder has finished stopping
            mediaRecorderRef.current.onstop = async () => {
                setIsTranscribing(true);
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });

                const formData = new FormData();
                formData.append('audio_file', audioBlob, 'user_answer.wav');

                try {
                    const response = await fetch('http://127.0.0.1:8000/api/transcribe-audio/', {
                        method: 'POST',
                        body: formData,
                    });
                    const result = await response.json();
                    // Pass both the text and the captured time back to the parent page
                    onTranscriptionComplete(result.transcription, timeTaken);
                } catch (error) {
                    console.error('Error transcribing audio:', error);
                } finally {
                    setIsTranscribing(false);
                    // Stop the media stream tracks after processing is complete
                    streamRef.current?.getTracks().forEach(track => track.stop());
                }
            };

            // Trigger the stop event
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    // Cleanup effect to stop the stream if the component unmounts unexpectedly
    useEffect(() => {
        return () => {
            streamRef.current?.getTracks().forEach(track => track.stop());
        };
    }, []);

    return (
        <div>
            <button onClick={isRecording ? handleStopRecording : handleStartRecording} disabled={isTranscribing}>
                {isRecording ? 'Stop Recording' : 'Record Answer'}
            </button>
            {isTranscribing && <p>Transcribing your answer...</p>}
        </div>
    );
}