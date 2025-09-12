// frontend/src/components/VoiceSelector.tsx

interface VoiceSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

const availableVoices = [
    { id: 'aria', name: 'Aria (Female)' },
    { id: 'raj', name: 'Raj (Male)' },
    { id: 'oliver', name: 'Oliver (Male)' },
    { id: 'mia', name: 'Mia (Female)' },
];

export function VoiceSelector({ value, onChange }: VoiceSelectorProps) {
    return (
        <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="voice-select" style={{ display: 'block', marginBottom: '0.5rem', textAlign: 'left' }}>
                Choose a Voice:
            </label>
            <select
                id="voice-select"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#1e293b', color: 'var(--text-color)' }}
            >
                {availableVoices.map(voice => (
                    <option key={voice.id} value={voice.id}>{voice.name}</option>
                ))}
            </select>
        </div>
    );
}