// frontend/src/utils/api.ts

const API_BASE_URL = "http://127.0.0.1:8000";

// This function calls your first endpoint
export const getQuestion = async (subject: string) => {
    const response = await fetch(`${API_BASE_URL}/api/get-question/`, {
        // --- FIX IS HERE ---
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject }),
        // -----------------
    });
    if (!response.ok) {
        // This will help you see more detailed errors in the browser console
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch question');
    }
    return response.json();
};


// This function calls your second endpoint
export const getAudio = async (text: string, voice: string) => {
    const response = await fetch(`${API_BASE_URL}/api/generate-audio/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice }),
    });
    return response.blob(); // Get the raw audio data
};

// --- ADD THIS NEW FUNCTION ---
export const evaluateAnswer = async (question: string, answer: string) => {
    const response = await fetch(`${API_BASE_URL}/api/evaluate-answer/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer }),
    });
    if (!response.ok) {
        throw new Error('Failed to evaluate answer');
    }
    return response.json();
};