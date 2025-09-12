// frontend/src/pages/interview.tsx

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { getQuestion, getAudio } from '../utils/api';
import { Recorder } from '../components/Recorder';
import { AudioPlayer } from '../components/AudioPlayer';
import { useSessionStore } from '../store/sessionStore';
import { useStopwatch } from '../hooks/useStopwatch';

function InterviewPage() {
    const router = useRouter();

    // Get session state and actions from the global store
    const { addTurn, endSession, startSession, turns } = useSessionStore();

    // Local state for the current question cycle
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [audioUrl, setAudioUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [userAnswer, setUserAnswer] = useState('');
    const [timeTaken, setTimeTaken] = useState(0);
    const [isConfirming, setIsConfirming] = useState(false);

    const { time, start, stop, reset } = useStopwatch();

    const fetchNewQuestion = useCallback(async (subject: string, voice: string) => {
        setIsLoading(true);
        setError('');
        setAudioUrl('');
        reset();

        try {
            const questionData = await getQuestion(subject);
            setCurrentQuestion(questionData.question);

            if (voice) {
                const audioBlob = await getAudio(questionData.question, voice);
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);
            }
        } catch (err) {
            setError('Failed to fetch a new question. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [reset]);

    const handleTranscriptionComplete = (transcribedText: string, finalTime: number) => {
        setUserAnswer(transcribedText);
        setTimeTaken(finalTime);
        setIsConfirming(true);
    };

    const handleAcceptAnswer = () => {
        const { subject, voice } = useSessionStore.getState();
        addTurn({
            question: currentQuestion,
            answer: userAnswer,
            timeTaken: timeTaken,
        });
        setIsConfirming(false);
        setUserAnswer('');
        if (subject && voice) {
            fetchNewQuestion(subject, voice);
        }
    };

    const handleRerecord = () => {
        setIsConfirming(false);
        setUserAnswer('');
        reset();
    };

    const handleEndSession = () => {
        endSession();
        router.push('/results');
    };


    const { subject, voice } = router.query;

    useEffect(() => {
        // router.isReady ensures the query parameters are loaded
        if (router.isReady) {
            if (typeof subject === 'string' && typeof voice === 'string') {
                // Start the session and fetch the first question
                startSession(subject, voice);
                fetchNewQuestion(subject, voice);
            } else {
                // Redirect home if the URL parameters are missing
                router.push('/');
            }
        }

    }, [router.isReady, subject, voice]);
    // ------------------------------------

    // Cleanup for the audio URL
    useEffect(() => {
        return () => {
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [audioUrl]);


    return (
        <main>
            <div className="container">
                <h1>Interview in Progress</h1>
                <p><strong>Topic:</strong> {subject} | <strong>Question #{turns.length + 1}</strong></p>

                <div className="question-card">
                    {isLoading && <p>Generating question...</p>}
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    {!isLoading && !error && <p>{currentQuestion}</p>}
                </div>

                <AudioPlayer audioUrl={audioUrl} onEnded={start} />

                <p style={{ fontSize: '2rem', margin: '1rem 0', color: 'var(--primary-accent)' }}>
                    {String(Math.floor(time / 60)).padStart(2, '0')}:{String(time % 60).padStart(2, '0')}
                </p>

                <hr />

                <h3>Your Answer:</h3>

                {!isConfirming && (
                    <div style={{ opacity: isLoading ? 0.5 : 1, pointerEvents: isLoading ? 'none' : 'auto' }}>
                        <Recorder
                            onTranscriptionComplete={handleTranscriptionComplete}
                            stopTimer={stop}
                            startTimer={start} // --- ADD THIS PROP ---
                        />
                    </div>
                )}

                {userAnswer && (
                    <div className="question-card" style={{ marginTop: '1rem' }}>
                        <p><em>"{userAnswer}"</em></p>
                    </div>
                )}

                {isConfirming && (
                    <div style={{ marginTop: '1rem' }}>
                        <button onClick={handleAcceptAnswer} style={{ marginRight: '1rem' }}>
                            Accept & Continue
                        </button>
                        <button onClick={handleRerecord} style={{ backgroundColor: '#555' }}>
                            Re-record
                        </button>
                    </div>
                )}

                <button
                    onClick={handleEndSession}
                    style={{ backgroundColor: 'var(--error-color)', marginTop: '2rem' }}
                >
                    End Session & See Results
                </button>
            </div>
        </main>
    );
}

export default InterviewPage;
// frontend/src/pages/interview.tsx

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/router';
// import { getQuestion, getAudio, evaluateAnswer } from '../utils/api'; // Import evaluateAnswer
// import { Recorder } from '../components/Recorder';
// import { AudioPlayer } from '../components/AudioPlayer';

// function InterviewPage() {
//     const [questionText, setQuestionText] = useState('');
//     const [audioUrl, setAudioUrl] = useState('');
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState('');
//     const [userAnswer, setUserAnswer] = useState('');

//     // --- NEW STATE FOR FEEDBACK ---
//     const [feedback, setFeedback] = useState('');
//     const [score, setScore] = useState<number | null>(null);
//     const [isEvaluating, setIsEvaluating] = useState(false);
//     // ------------------------------

//     const router = useRouter();
//     const { subject, voice } = router.query;

//     const fetchInterviewData = async (currentSubject: string, currentVoice: string) => {
//         setIsLoading(true);
//         setError('');
//         setAudioUrl('');
//         setUserAnswer('');
//         setFeedback(''); // Clear old feedback
//         setScore(null);   // Clear old score

//         try {
//             const questionData = await getQuestion(currentSubject);
//             const text = questionData.question;
//             setQuestionText(text);

//             const audioBlob = await getAudio(text, currentVoice);
//             const url = URL.createObjectURL(audioBlob);
//             setAudioUrl(url);
//         } catch (err) {
//             setError('Failed to fetch interview data. Please try again.');
//             console.error(err);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     // --- NEW FUNCTION TO HANDLE TRANSCRIPTION AND TRIGGER EVALUATION ---
//     const handleTranscriptionComplete = async (transcribedText: string) => {
//         setUserAnswer(transcribedText);
//         setIsEvaluating(true);
//         setFeedback('');
//         setScore(null);

//         try {
//             // Call the new evaluate API endpoint
//             const result = await evaluateAnswer(questionText, transcribedText);
//             setFeedback(result.feedback);
//             setScore(result.score);
//         } catch (error) {
//             console.error("Evaluation failed:", error);
//             setFeedback("Sorry, an error occurred during evaluation.");
//         } finally {
//             setIsEvaluating(false);
//         }
//     };
//     // ----------------------------------------------------------------

//     useEffect(() => {
//         if (subject && typeof subject === 'string' && voice && typeof voice === 'string') {
//             fetchInterviewData(subject, voice);
//         }
//     }, [subject, voice]);

//     useEffect(() => {
//         return () => {
//             if (audioUrl) {
//                 URL.revokeObjectURL(audioUrl);
//             }
//         };
//     }, [audioUrl]);

//     return (
//         <main>
//             <div className="container">
//                 <h1>Interview in Progress</h1>
//                 <p><strong>Topic:</strong> {subject || 'Loading...'}</p>

//                 <div className="question-card">
//                     {isLoading && <p>Generating question...</p>}
//                     {error && <p style={{ color: 'red' }}>{error}</p>}
//                     {!isLoading && !error && <p>{questionText}</p>}
//                 </div>

//                 <AudioPlayer audioUrl={audioUrl} />

//                 <button
//                     onClick={() => {
//                         if (subject && typeof subject === 'string' && voice && typeof voice === 'string') {
//                             fetchInterviewData(subject, voice);
//                         }
//                     }}
//                     disabled={isLoading}
//                 >
//                     {isLoading ? 'Generating...' : 'Ask New Question'}
//                 </button>

//                 <hr />

//                 <h3>Your Answer:</h3>
//                 {/* Pass the new handler function to the Recorder */}
//                 <Recorder onTranscriptionComplete={handleTranscriptionComplete} />

//                 {userAnswer && (
//                     <div className="question-card" style={{ marginTop: '1rem' }}>
//                         <p><em>"{userAnswer}"</em></p>
//                     </div>
//                 )}

//                 {/* --- NEW SECTION TO DISPLAY FEEDBACK --- */}
//                 {isEvaluating && <p style={{ marginTop: '1rem' }}>Evaluating your answer...</p>}
//                 {feedback && (
//                     <div className="question-card" style={{ marginTop: '1rem', textAlign: 'left' }}>
//                         <h4>Feedback:</h4>
//                         <p>{feedback}</p>
//                         {score !== null && <p><strong>Score: {score} / 10</strong></p>}
//                     </div>
//                 )}
//                 {/* ------------------------------------ */}
//             </div>
//         </main>
//     );
// }

// export default InterviewPage;

// // frontend/src/pages/interview.tsx
// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/router';
// import { getQuestion, getAudio } from '../utils/api';
// import { Recorder } from '../components/Recorder';
// import { AudioPlayer } from '../components/AudioPlayer'; // Import the new component

// function InterviewPage() {
//     // ... (all your existing state variables) ...
//     const [questionText, setQuestionText] = useState('');
//     const [audioUrl, setAudioUrl] = useState('');
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState('');
//     const [userAnswer, setUserAnswer] = useState('');

//     const router = useRouter();
//     const { subject, voice } = router.query; // Get both subject and voice

//     const fetchInterviewData = async (currentSubject: string, currentVoice: string) => {
//         setIsLoading(true);
//         // ... (rest of the state resets)
//         setError('');
//         setAudioUrl('');
//         setUserAnswer('');

//         try {
//             const questionData = await getQuestion(currentSubject);
//             const text = questionData.question;
//             setQuestionText(text);

//             const audioBlob = await getAudio(text, currentVoice); // Use the selected voice
//             const url = URL.createObjectURL(audioBlob);
//             setAudioUrl(url);
//         } catch (err) {
//             setError('Failed to fetch interview data. Please try again.');
//             console.error(err);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     useEffect(() => {
//         if (subject && typeof subject === 'string' && voice && typeof voice === 'string') {
//             fetchInterviewData(subject, voice);
//         }
//     }, [subject, voice]); // Re-fetch if subject or voice changes

//     // ... (useEffect for cleaning up audioUrl) ...
//     useEffect(() => {
//         return () => {
//             if (audioUrl) {
//                 URL.revokeObjectURL(audioUrl);
//             }
//         };
//     }, [audioUrl]);

//     return (
//         <main>
//             <div className="container">
//                 <h1>Interview in Progress</h1>
//                 <p><strong>Topic:</strong> {subject || 'Loading...'}</p>

//                 <div className="question-card">
//                     {isLoading && <p>Generating question...</p>}
//                     {error && <p style={{ color: 'red' }}>{error}</p>}
//                     {!isLoading && !error && <p>{questionText}</p>}
//                 </div>

//                 <AudioPlayer audioUrl={audioUrl} /> {/* Use the new component */}

//                 <button
//                     onClick={() => {
//                         if (subject && typeof subject === 'string' && voice && typeof voice === 'string') {
//                             fetchInterviewData(subject, voice);
//                         }
//                     }}
//                     disabled={isLoading}
//                 >
//                     {isLoading ? 'Generating...' : 'Ask New Question'}
//                 </button>

//                 <hr />

//                 {/* ... (rest of the JSX for Recorder and answer display) ... */}
//                 <h3>Your Answer:</h3>
//                 <Recorder
//                     onTranscriptionComplete={(text) => setUserAnswer(text)}
//                 />
//                 {userAnswer && (
//                     <div className="question-card" style={{ marginTop: '1rem' }}>
//                         <p><em>{userAnswer}</em></p>
//                     </div>
//                 )}
//             </div>
//         </main>
//     );
// }

// export default InterviewPage;