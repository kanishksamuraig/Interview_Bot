// frontend/src/components/AudioPlayer.tsx

interface AudioPlayerProps {
    audioUrl: string;
    onEnded?: () => void; // Add this line to accept the function
}

export function AudioPlayer({ audioUrl, onEnded }: AudioPlayerProps) {
    if (!audioUrl) {
        return null;
    }

    return (
        <audio
            src={audioUrl}
            autoPlay
            controls
            style={{ width: '100%', marginTop: '1.5rem' }}
            onEnded={onEnded} // And pass the function here
        />
    );
}