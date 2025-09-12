// frontend/src/pages/index.tsx
import Link from 'next/link';
import { useState } from 'react';
import { SubjectSelector } from '../components/SubjectSelector';
import { VoiceSelector } from '../components/VoiceSelector';

function HomePage() {
    const [subject, setSubject] = useState('Data Structures');
    const [voice, setVoice] = useState('aria');

    return (
        <main>
            <div className="home-layout">
                {/* Left Column: Placeholder for future text */}
                <div>
                    {/* You can add your introductory text or an image here later */}
                </div>

                {/* Right Column: The Selection Box */}
                <div className="container">
                    <h1>
                        Ace Any <span className="accent">Interview</span>
                    </h1>
                    <p>Select your topic and preferred voice to start your AI-powered interview practice session.</p>

                    <SubjectSelector value={subject} onChange={setSubject} />
                    <VoiceSelector value={voice} onChange={setVoice} />

                    <Link href={`/interview?subject=${encodeURIComponent(subject)}&voice=${encodeURIComponent(voice)}`}>
                        <button>Start Interview</button>
                    </Link>
                </div>
            </div>
        </main>
    );
}

export default HomePage;