import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface WaveformPlayerProps {
    audioUrl: string;
    onEnded?: () => void;
}

export function WaveformPlayer({ audioUrl, onEnded }: WaveformPlayerProps) {
    const waveformRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (!waveformRef.current || !audioUrl) return;

        // Destroy previous instance if it exists
        wavesurferRef.current?.destroy();

        const ws = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#4f4f4f',
            progressColor: 'var(--primary-accent)',
            cursorColor: 'var(--primary-accent)',
            barWidth: 3,
            barRadius: 3,
            cursorWidth: 1,
            height: 80,
            barGap: 3,
        });
        wavesurferRef.current = ws;

        ws.load(audioUrl);

        ws.on('ready', () => {
            ws.play();
        });

        ws.on('play', () => setIsPlaying(true));
        ws.on('pause', () => setIsPlaying(false));
        ws.on('finish', () => {
            setIsPlaying(false);
            if (onEnded) {
                onEnded();
            }
        });

        return () => {
            ws.destroy();
        };
    }, [audioUrl, onEnded]);

    const handlePlayPause = () => {
        wavesurferRef.current?.playPause();
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
            <button onClick={handlePlayPause} style={{ padding: '10px 20px', minWidth: '80px' }}>
                {isPlaying ? 'Pause' : 'Play'}
            </button>
            <div ref={waveformRef} style={{ width: '100%' }} />
        </div>
    );
}