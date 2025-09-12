// frontend/src/components/SubjectSelector.tsx

interface SubjectSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

export function SubjectSelector({ value, onChange }: SubjectSelectorProps) {
    return (
        <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <label htmlFor="subject-select" style={{ display: 'block', marginBottom: '0.5rem', textAlign: 'left' }}>
                Choose a Subject:
            </label>
            <select
                id="subject-select"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: '#1e293b', color: 'var(--text-color)' }}
            >
                <option value="Data Structures">Data Structures</option>
                <option value="Databases">Databases</option>
                <option value="Object-Oriented Programming">Object-Oriented Programming</option>
            </select>
        </div>
    );
}