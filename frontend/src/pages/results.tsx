import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSessionStore, DetailedFeedback } from '../store/sessionStore';
import { evaluateAnswer } from '../utils/api';

// A helper component to render the detailed metrics
const MetricsDisplay = ({ feedback }: { feedback: DetailedFeedback }) => (
    <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'none' }}>
        <li><strong>Understanding:</strong> {feedback.problemUnderstanding.feedback} <em>({feedback.problemUnderstanding.score}/10)</em></li>
        <li><strong>Vocabulary:</strong> {feedback.vocabulary.feedback} <em>({feedback.vocabulary.score}/10)</em></li>
        <li><strong>Thinking:</strong> {feedback.analyticalThinking.feedback} <em>({feedback.analyticalThinking.score}/10)</em></li>
        <li><strong>Professionalism:</strong> {feedback.professionalism.feedback} <em>({feedback.professionalism.score}/10)</em></li>
        <li><strong>Correctness:</strong> {feedback.correctness.feedback} <em>({feedback.correctness.score}/10)</em></li>
    </ul>
);

function ResultsPage() {
    const { turns, subject, setFeedbackForTurn } = useSessionStore();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const evaluationStarted = useRef(false);

    useEffect(() => {
        const evaluateAllTurns = async () => {
            evaluationStarted.current = true;

            const turnsToEvaluate = turns.filter(turn => !turn.feedback);
            if (turnsToEvaluate.length === 0) {
                setIsLoading(false);
                return;
            }

            const evaluationPromises = turns.map((turn, index) => {
                if (turn.feedback) return Promise.resolve();

                return evaluateAnswer(turn.question, turn.answer)
                    .then(result => {
                        // This checks for the 'evaluation' key, but falls back to the 'feedback' key.
                        const feedbackData = result.evaluation || result.feedback;

                        if (feedbackData) {
                            setFeedbackForTurn(index, feedbackData);
                        } else {
                            console.error("Could not find 'evaluation' or 'feedback' key in API response:", result);
                        }
                    })
                    .catch(err => {
                        console.error(`Failed to evaluate question #${index + 1}:`, err);
                    });
            });

            try {
                await Promise.all(evaluationPromises);
            } catch (err) {
                console.error("An error occurred during bulk evaluation:", err);
                setError("An error occurred while evaluating answers.");
            } finally {
                setIsLoading(false);
            }
        };

        if (turns.length > 0 && !evaluationStarted.current) {
            evaluateAllTurns();
        } else {
            setIsLoading(false);
        }
    }, [turns, setFeedbackForTurn]);

    const averageScore = useMemo(() => {
        const validTurns = turns.filter(turn => turn.feedback && typeof turn.feedback.overallScore === 'number');
        if (validTurns.length === 0) return 0;
        const totalScore = validTurns.reduce((acc, turn) => acc + (turn.feedback?.overallScore || 0), 0);
        return totalScore / validTurns.length;
    }, [turns]);

    return (
        <main>
            <div className="container" style={{ textAlign: 'left', maxWidth: '1000px' }}>
                <h1>Interview Results</h1>
                <p><strong>Topic:</strong> {subject || 'N/A'}</p>

                {turns.length > 0 && (
                    <p><strong>Average Score:</strong> {averageScore.toFixed(1)} / 10</p>
                )}

                <hr />

                {isLoading && <p>Evaluating your answers, please wait...</p>}
                {error && <p style={{ color: 'var(--error-color)' }}>{error}</p>}

                {!isLoading && turns.length === 0 && (
                    <div style={{ textAlign: 'center' }}>
                        <p>No interview data found. Would you like to start a new session?</p>
                        <Link href="/">
                            <button>Start New Interview</button>
                        </Link>
                    </div>
                )}

                {!isLoading && turns.length > 0 && (
                    <>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1.5rem' }}>
                            <thead>
                                <tr>
                                    <th style={{ border: '1px solid var(--border-color)', padding: '12px', textAlign: 'left' }}>Question & Answer</th>
                                    <th style={{ border: '1px solid var(--border-color)', padding: '12px', textAlign: 'left' }}>Performance Metrics</th>
                                    <th style={{ border: '1px solid var(--border-color)', padding: '12px', textAlign: 'left', width: '100px' }}>Overall Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {turns.map((turn, index) => (
                                    <tr key={index}>
                                        <td style={{ border: '1px solid var(--border-color)', padding: '12px', verticalAlign: 'top' }}>
                                            <p style={{ margin: 0 }}><strong>Q:</strong> {turn.question}</p>
                                            <p style={{ marginTop: '1rem' }}><strong>A:</strong> <em>"{turn.answer}"</em></p>
                                            <p style={{ marginTop: '1rem', fontSize: '0.9em', color: '#888' }}>Time Taken: {turn.timeTaken} seconds</p>
                                        </td>
                                        <td style={{ border: '1px solid var(--border-color)', padding: '12px', verticalAlign: 'top', fontSize: '0.9em' }}>
                                            {turn.feedback ? <MetricsDisplay feedback={turn.feedback} /> : "Evaluating..."}
                                        </td>
                                        <td style={{ border: '1px solid var(--border-color)', padding: '12px', verticalAlign: 'middle', textAlign: 'center', fontSize: '1.5em', fontWeight: 'bold' }}>
                                            {turn.feedback?.overallScore !== undefined ? turn.feedback.overallScore : "..."}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                            <Link href="/">
                                <button>Start New Interview</button>
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}

export default ResultsPage;

// import { useEffect, useState, useMemo, useRef } from 'react';
// import Link from 'next/link';
// import { useSessionStore, DetailedFeedback } from '../store/sessionStore';
// import { evaluateAnswer } from '../utils/api';

// // A helper component to render the detailed metrics
// const MetricsDisplay = ({ feedback }: { feedback: DetailedFeedback }) => (
//     <ul style={{ margin: 0, paddingLeft: '20px', listStyleType: 'none' }}>
//         <li><strong>Understanding:</strong> {feedback.problemUnderstanding.feedback} <em>({feedback.problemUnderstanding.score}/10)</em></li>
//         <li><strong>Vocabulary:</strong> {feedback.vocabulary.feedback} <em>({feedback.vocabulary.score}/10)</em></li>
//         <li><strong>Thinking:</strong> {feedback.analyticalThinking.feedback} <em>({feedback.analyticalThinking.score}/10)</em></li>
//         <li><strong>Professionalism:</strong> {feedback.professionalism.feedback} <em>({feedback.professionalism.score}/10)</em></li>
//         <li><strong>Correctness:</strong> {feedback.correctness.feedback} <em>({feedback.correctness.score}/10)</em></li>
//     </ul>
// );


// function ResultsPage() {
//     const { turns, subject, setFeedbackForTurn } = useSessionStore();
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState('');
//     const evaluationStarted = useRef(false);

//     useEffect(() => {
//         const evaluateAllTurns = async () => {
//             evaluationStarted.current = true;

//             const turnsToEvaluate = turns.filter(turn => !turn.feedback);
//             if (turnsToEvaluate.length === 0) {
//                 setIsLoading(false);
//                 return;
//             }

//             const evaluationPromises = turns.map((turn, index) => {
//                 if (turn.feedback) return Promise.resolve();

//                 return evaluateAnswer(turn.question, turn.answer)
//                     .then(result => {
//                         // The backend returns { "evaluation": { ... } }, so we pass result.evaluation
//                         setFeedbackForTurn(index, result.evaluation);
//                     })
//                     .catch(err => {
//                         console.error(`Failed to evaluate question #${index + 1}:`, err);
//                     });
//             });

//             try {
//                 await Promise.all(evaluationPromises);
//             } catch (err) {
//                 console.error("An error occurred during bulk evaluation:", err);
//                 setError("An error occurred while evaluating answers.");
//             } finally {
//                 setIsLoading(false);
//             }
//         };

//         if (turns.length > 0 && !evaluationStarted.current) {
//             evaluateAllTurns();
//         } else {
//             setIsLoading(false);
//         }
//     }, [turns, setFeedbackForTurn]);

//     const averageScore = useMemo(() => {
//         const validTurns = turns.filter(turn => turn.feedback && typeof turn.feedback.overallScore === 'number');
//         if (validTurns.length === 0) return 0;
//         const totalScore = validTurns.reduce((acc, turn) => acc + (turn.feedback?.overallScore || 0), 0);
//         return totalScore / validTurns.length;
//     }, [turns]);

//     return (
//         <main>
//             <div className="container" style={{ textAlign: 'left', maxWidth: '1000px' }}>
//                 <h1>Interview Results</h1>
//                 <p><strong>Topic:</strong> {subject || 'N/A'}</p>

//                 {turns.length > 0 && (
//                     <p><strong>Average Score:</strong> {averageScore.toFixed(1)} / 10</p>
//                 )}

//                 <hr />

//                 {isLoading && <p>Evaluating your answers, please wait...</p>}
//                 {error && <p style={{ color: 'var(--error-color)' }}>{error}</p>}

//                 {!isLoading && turns.length === 0 && (
//                     <div style={{ textAlign: 'center' }}>
//                         <p>No interview data found. Would you like to start a new session?</p>
//                         <Link href="/">
//                             <button>Start New Interview</button>
//                         </Link>
//                     </div>
//                 )}

//                 {!isLoading && turns.length > 0 && (
//                     <>
//                         <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1.5rem' }}>
//                             <thead>
//                                 <tr>
//                                     <th style={{ border: '1px solid var(--border-color)', padding: '12px', textAlign: 'left' }}>Question & Answer</th>
//                                     <th style={{ border: '1px solid var(--border-color)', padding: '12px', textAlign: 'left' }}>Performance Metrics</th>
//                                     <th style={{ border: '1px solid var(--border-color)', padding: '12px', textAlign: 'left', width: '100px' }}>Overall Score</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {turns.map((turn, index) => (
//                                     <tr key={index}>
//                                         <td style={{ border: '1px solid var(--border-color)', padding: '12px', verticalAlign: 'top' }}>
//                                             <p style={{ margin: 0 }}><strong>Q:</strong> {turn.question}</p>
//                                             <p style={{ marginTop: '1rem' }}><strong>A:</strong> <em>"{turn.answer}"</em></p>
//                                             <p style={{ marginTop: '1rem', fontSize: '0.9em', color: '#888' }}>Time Taken: {turn.timeTaken} seconds</p>
//                                         </td>
//                                         <td style={{ border: '1px solid var(--border-color)', padding: '12px', verticalAlign: 'top', fontSize: '0.9em' }}>
//                                             {turn.feedback ? <MetricsDisplay feedback={turn.feedback} /> : "Evaluating..."}
//                                         </td>
//                                         <td style={{ border: '1px solid var(--border-color)', padding: '12px', verticalAlign: 'middle', textAlign: 'center', fontSize: '1.5em', fontWeight: 'bold' }}>
//                                             {turn.feedback?.overallScore !== undefined ? turn.feedback.overallScore : "..."}
//                                         </td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                         <div style={{ textAlign: 'center', marginTop: '2rem' }}>
//                             <Link href="/">
//                                 <button>Start New Interview</button>
//                             </Link>
//                         </div>
//                     </>
//                 )}
//             </div>
//         </main>
//     );
// }

// export default ResultsPage;

// import { useEffect, useState, useMemo } from 'react';
// import Link from 'next/link';
// import { useSessionStore } from '../store/sessionStore';
// import { evaluateAnswer } from '../utils/api';

// function ResultsPage() {
//     // We still get the state here to display it in the JSX
//     const { turns, subject, setFeedbackForTurn } = useSessionStore();

//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState('');

//     // --- THIS IS THE FINAL FIX ---
//     useEffect(() => {
//         const evaluateAllTurns = async () => {
//             // Get the most current state directly from the store inside the effect
//             const turnsFromStore = useSessionStore.getState().turns;
//             const turnsToEvaluate = turnsFromStore.filter(turn => !turn.feedback);

//             if (turnsToEvaluate.length === 0) {
//                 setIsLoading(false);
//                 return;
//             }

//             const evaluationPromises = turnsFromStore.map((turn, index) => {
//                 if (turn.feedback) return Promise.resolve();

//                 return evaluateAnswer(turn.question, turn.answer)
//                     .then(result => {
//                         // Use the dedicated action to update the store
//                         useSessionStore.getState().setFeedbackForTurn(index, result.feedback);
//                     });
//             });

//             try {
//                 await Promise.all(evaluationPromises);
//             } catch (err) {
//                 console.error("An error occurred during bulk evaluation:", err);
//                 setError("An error occurred while evaluating some answers.");
//             } finally {
//                 setIsLoading(false);
//             }
//         };

//         evaluateAllTurns();

//         // By providing an empty dependency array [], this effect will only run ONCE
//         // when the component first mounts, which permanently breaks the infinite loop.
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, []);
//     // -------------------------

//     const averageScore = useMemo(() => {
//         const validTurns = turns.filter(turn => turn.feedback && typeof turn.feedback.score === 'number');
//         if (validTurns.length === 0) return 0;
//         const totalScore = validTurns.reduce((acc, turn) => acc + (turn.feedback?.score || 0), 0);
//         return totalScore / validTurns.length;
//     }, [turns]);

//     return (
//         <main>
//             {/* The rest of your JSX is correct and does not need to be changed */}
//             <div className="container" style={{ textAlign: 'left', maxWidth: '1000px' }}>
//                 <h1>Interview Results</h1>
//                 <p><strong>Topic:</strong> {subject || 'N/A'}</p>

//                 {turns.length > 0 && (
//                     <p><strong>Average Score:</strong> {averageScore.toFixed(1)} / 10</p>
//                 )}

//                 <hr />

//                 {isLoading && <p>Evaluating your answers, please wait...</p>}
//                 {error && <p style={{ color: 'var(--error-color)' }}>{error}</p>}

//                 {!isLoading && turns.length === 0 && (
//                     <div style={{ textAlign: 'center' }}>
//                         <p>No interview data found. Would you like to start a new session?</p>
//                         <Link href="/">
//                             <button>Start New Interview</button>
//                         </Link>
//                     </div>
//                 )}

//                 {!isLoading && turns.length > 0 && (
//                     <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1.5rem' }}>
//                         <thead>
//                             <tr>
//                                 <th style={{ border: '1px solid var(--border-color)', padding: '12px', textAlign: 'left' }}>Question & Answer</th>
//                                 <th style={{ border: '1px solid var(--border-color)', padding: '12px', textAlign: 'left' }}>Performance Metrics</th>
//                                 <th style={{ border: '1px solid var(--border-color)', padding: '12px', textAlign: 'left', width: '80px' }}>Score</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {turns.map((turn, index) => (
//                                 <tr key={index}>
//                                     <td style={{ border: '1px solid var(--border-color)', padding: '12px', verticalAlign: 'top' }}>
//                                         <p style={{ margin: 0 }}><strong>Q:</strong> {turn.question}</p>
//                                         <p style={{ marginTop: '1rem' }}><strong>A:</strong> <em>"{turn.answer}"</em></p>
//                                         <p style={{ marginTop: '1rem', fontSize: '0.9em', color: '#888' }}>Time Taken: {turn.timeTaken} seconds</p>
//                                     </td>
//                                     <td style={{ border: '1px solid var(--border-color)', padding: '12px', verticalAlign: 'top', fontSize: '0.9em' }}>
//                                         {turn.feedback ? (
//                                             <ul style={{ margin: 0, paddingLeft: '20px' }}>
//                                                 <li><strong>Understanding:</strong> {turn.feedback.problemUnderstanding}</li>
//                                                 <li><strong>Vocabulary:</strong> {turn.feedback.vocabulary}</li>
//                                                 <li><strong>Thinking:</strong> {turn.feedback.analyticalThinking}</li>
//                                                 <li><strong>Professionalism:</strong> {turn.feedback.professionalism}</li>
//                                                 <li><strong>Correctness:</strong> {turn.feedback.correctness}</li>
//                                             </ul>
//                                         ) : "Evaluating..."}
//                                     </td>
//                                     <td style={{ border: '1px solid var(--border-color)', padding: '12px', verticalAlign: 'middle', textAlign: 'center', fontSize: '1.5em', fontWeight: 'bold' }}>
//                                         {turn.feedback?.score !== undefined ? turn.feedback.score : "..."}
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 )}

//                 {!isLoading && turns.length > 0 && (
//                     <div style={{ textAlign: 'center', marginTop: '2rem' }}>
//                         <Link href="/">
//                             <button>Start New Interview</button>
//                         </Link>
//                     </div>
//                 )}
//             </div>
//         </main>
//     );
// }

// export default ResultsPage;



// import { useEffect, useState, useMemo } from 'react';
// import { useRouter } from 'next/router';
// import Link from 'next/link';
// import { useSessionStore } from '../store/sessionStore';
// import { evaluateAnswer } from '../utils/api';

// function ResultsPage() {
//     const router = useRouter();
//     // Select specific state and actions from the store
//     const { turns, subject, setFeedbackForTurn } = useSessionStore(state => ({
//         turns: state.turns,
//         subject: state.subject,
//         setFeedbackForTurn: state.setFeedbackForTurn,
//     }));
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState('');

//     // This useEffect now has an empty dependency array `[]` to prevent infinite loops.
//     // It will run only once when the component first mounts.
//     useEffect(() => {
//         const evaluateAllTurns = async () => {
//             const turnsToEvaluate = turns.filter(turn => !turn.feedback);

//             if (turnsToEvaluate.length === 0) {
//                 setIsLoading(false);
//                 return;
//             }

//             const evaluationPromises = turns.map((turn, index) => {
//                 if (turn.feedback) {
//                     return Promise.resolve();
//                 }
//                 return evaluateAnswer(turn.question, turn.answer)
//                     .then(result => {
//                         setFeedbackForTurn(index, result.feedback);
//                     })
//                     .catch(err => {
//                         console.error(`Failed to evaluate question #${index + 1}:`, err);
//                     });
//             });

//             try {
//                 await Promise.all(evaluationPromises);
//             } catch (err) {
//                 console.error("An error occurred during bulk evaluation:", err);
//                 setError("An error occurred while evaluating some answers. Please check the console.");
//             } finally {
//                 setIsLoading(false);
//             }
//         };

//         if (turns.length > 0) {
//             evaluateAllTurns();
//         } else {
//             setIsLoading(false);
//         }
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, []); // The empty array `[]` is the key fix.

//     // useMemo recalculates the average score only when the turns data changes
//     const averageScore = useMemo(() => {
//         const validTurns = turns.filter(turn => turn.feedback && typeof turn.feedback.score === 'number');
//         if (validTurns.length === 0) return 0;
//         const totalScore = validTurns.reduce((acc, turn) => acc + (turn.feedback?.score || 0), 0);
//         return totalScore / validTurns.length;
//     }, [turns]);

//     return (
//         <main>
//             <div className="container" style={{ textAlign: 'left', maxWidth: '1000px' }}>
//                 <h1>Interview Results</h1>
//                 <p><strong>Topic:</strong> {subject || 'N/A'}</p>

//                 {turns.length > 0 && (
//                     <p><strong>Average Score:</strong> {averageScore.toFixed(1)} / 10</p>
//                 )}

//                 <hr />

//                 {isLoading && <p>Evaluating your answers, please wait...</p>}
//                 {error && <p style={{ color: 'var(--error-color)' }}>{error}</p>}

//                 {!isLoading && turns.length === 0 && (
//                     <div style={{ textAlign: 'center' }}>
//                         <p>No interview data found. Would you like to start a new session?</p>
//                         <Link href="/">
//                             <button>Start New Interview</button>
//                         </Link>
//                     </div>
//                 )}

//                 {!isLoading && turns.length > 0 && (
//                     <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1.5rem' }}>
//                         <thead>
//                             <tr>
//                                 <th style={{ border: '1px solid var(--border-color)', padding: '12px', textAlign: 'left' }}>Question & Answer</th>
//                                 <th style={{ border: '1px solid var(--border-color)', padding: '12px', textAlign: 'left' }}>Performance Metrics</th>
//                                 <th style={{ border: '1px solid var(--border-color)', padding: '12px', textAlign: 'left', width: '80px' }}>Score</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {turns.map((turn, index) => (
//                                 <tr key={index}>
//                                     <td style={{ border: '1px solid var(--border-color)', padding: '12px', verticalAlign: 'top' }}>
//                                         <p style={{ margin: 0 }}><strong>Q:</strong> {turn.question}</p>
//                                         <p style={{ marginTop: '1rem' }}><strong>A:</strong> <em>"{turn.answer}"</em></p>
//                                         <p style={{ marginTop: '1rem', fontSize: '0.9em', color: '#888' }}>Time Taken: {turn.timeTaken} seconds</p>
//                                     </td>
//                                     <td style={{ border: '1px solid var(--border-color)', padding: '12px', verticalAlign: 'top', fontSize: '0.9em' }}>
//                                         {turn.feedback ? (
//                                             <ul style={{ margin: 0, paddingLeft: '20px' }}>
//                                                 <li><strong>Understanding:</strong> {turn.feedback.problemUnderstanding}</li>
//                                                 <li><strong>Vocabulary:</strong> {turn.feedback.vocabulary}</li>
//                                                 <li><strong>Thinking:</strong> {turn.feedback.analyticalThinking}</li>
//                                                 <li><strong>Professionalism:</strong> {turn.feedback.professionalism}</li>
//                                                 <li><strong>Correctness:</strong> {turn.feedback.correctness}</li>
//                                             </ul>
//                                         ) : "Evaluating..."}
//                                     </td>
//                                     <td style={{ border: '1px solid var(--border-color)', padding: '12px', verticalAlign: 'middle', textAlign: 'center', fontSize: '1.5em', fontWeight: 'bold' }}>
//                                         {turn.feedback?.score !== undefined ? turn.feedback.score : "..."}
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 )}

//                 {!isLoading && turns.length > 0 && (
//                     <div style={{ textAlign: 'center', marginTop: '2rem' }}>
//                         <Link href="/">
//                             <button>Start New Interview</button>
//                         </Link>
//                     </div>
//                 )}
//             </div>
//         </main>
//     );
// }

// export default ResultsPage;