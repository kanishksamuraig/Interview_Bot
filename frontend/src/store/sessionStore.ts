import { create } from 'zustand';

// Defines the shape of a single metric's feedback
export interface MetricFeedback {
    feedback: string;
    score: number;
}

// Defines the new, detailed feedback structure from the AI
export interface DetailedFeedback {
    problemUnderstanding: MetricFeedback;
    vocabulary: MetricFeedback;
    analyticalThinking: MetricFeedback;
    professionalism: MetricFeedback;
    correctness: MetricFeedback;
    overallScore: number;
}

// Defines the shape of a single interview "turn"
export interface InterviewTurn {
    question: string;
    answer: string;
    timeTaken: number;
    feedback: DetailedFeedback | null; // Feedback is now the detailed object or null
}

// Defines the shape of the entire store's state and its actions
interface SessionState {
    subject: string | null;
    voice: string | null;
    turns: InterviewTurn[];
    isSessionActive: boolean;
    startSession: (subject: string, voice: string) => void;
    addTurn: (turn: Omit<InterviewTurn, 'feedback'>) => void;
    endSession: () => void;
    setFeedbackForTurn: (index: number, feedback: DetailedFeedback) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
    // Initial state
    subject: null,
    voice: null,
    turns: [],
    isSessionActive: false,

    // Action to begin an interview session
    startSession: (subject, voice) => set({
        isSessionActive: true,
        subject,
        voice,
        turns: []
    }),

    // Action to add a completed question/answer turn to the session
    addTurn: (newTurn) => set((state) => ({
        // Initialize feedback as null to match the new type
        turns: [...state.turns, { ...newTurn, feedback: null }]
    })),

    // Action to mark the session as ended
    endSession: () => set({ isSessionActive: false }),

    // Action to update a turn with the detailed feedback object after evaluation
    setFeedbackForTurn: (index, feedback) => set((state) => {
        const newTurns = [...state.turns];
        if (newTurns[index]) {
            newTurns[index].feedback = feedback;
        }
        return { turns: newTurns };
    }),
}));