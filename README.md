## AI Interview Bot

This is a full-stack web application designed to help users practice for technical interviews. It leverages a suite of modern AI models to create a realistic, interactive, and session-based interview experience, providing detailed, multi-metric feedback on user performance.

### Key Features 🚀

* **AI-Generated Questions**: Utilizes the Gemini API (`gemini-1.5-flash-latest`) to generate a unique and varied set of interview questions on topics like Data Structures, Databases, and OOPs.
* **Text-to-Speech (TTS)**: Reads questions aloud using Coqui's high-quality `xtts_v2` model, with multiple voice options for the user to choose from.
* **Speech-to-Text (STT)**: Transcribes the user's spoken answers in real-time using the `faster-whisper` model.
* **Session-Based Flow**: Supports multi-question interview sessions where users can answer, re-record if unsatisfied, and continue until they choose to end the session.
* **Detailed Performance Analysis**: After the session, the user's answers are evaluated by the Gemini API against multiple performance metrics: Problem Understanding, Vocabulary, Analytical Thinking, Professionalism, and Correctness, each with its own score.
* **Interactive UI**: A clean, modern, and responsive user interface built with Next.js and React, featuring an animated waveform visualizer for audio recording and playback.

### Tech Stack 🛠️

#### Backend
* **Framework**: FastAPI
* **AI Models**:
    * Google Gemini (`gemini-1.5-flash-latest`) for question generation & evaluation.
    * Coqui TTS (`xtts_v2`) for voice generation.
    * `faster-whisper` for speech-to-text transcription.
* **Async**: `asyncio`, `run_in_threadpool` for non-blocking AI model execution.

#### Frontend
* **Framework**: Next.js & React
* **State Management**: Zustand
* **Styling**: Custom CSS
* **Audio Visualization**: Wavesurfer.js, react-mic
* **Deployment**: (Ready for Vercel/Netlify)

### How It Works

1.  The user selects an interview topic and a preferred voice on the homepage.
2.  An interview session begins, and the backend calls the Gemini API to generate the first question.
3.  The question text is converted to speech by the Coqui TTS model and played back to the user with a waveform visualizer.
4.  A timer starts, and the user records their answer, with a microphone visualizer providing real-time feedback.
5.  The user's audio is transcribed by the Whisper model. The user can review the transcribed text and choose to either re-record or accept the answer and continue to the next question.
6.  This cycle repeats until the user ends the session.
7.  On the results page, all recorded answers are sent to the Gemini API for a detailed, multi-metric evaluation, which is then displayed in a comprehensive table.