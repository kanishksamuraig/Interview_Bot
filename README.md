## AI Interview Bot

This is a full-stack web application designed to help users practice for technical interviews. It leverages a suite of modern AI models to create a realistic, interactive, and session-based interview experience, providing detailed, multi-metric feedback on user performance.

### Key Features 🚀

* **AI-Generated Questions**: Utilizes the Gemini API (`gemini-1.5-flash-latest`) and also (`gemini-2.5-flash-latest`) to generate a unique and varied set of interview questions on topics like Data Structures, Databases, and OOPs.
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


## Setup & Installation

Follow these steps to set up and run the project locally.

### Prerequisites

* **Git**: [Download Git](https://git-scm.com/downloads)
* **Python**: Version 3.10 or 3.11 recommended. [Download Python](https://www.python.org/downloads/)
* **Node.js**: Version 18.x or later. [Download Node.js](https://nodejs.org/)

### 1. Clone the Repository
```bash
git clone https://github.com/kanishksamuraig/Interview_Bot.git
cd Interview_Bot
```

### 2. Backend Setup (FastAPI)

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create a Python virtual environment:**
    * **Windows (PowerShell):**
        ```powershell
        python -m venv venv
        ```
    * **Linux / macOS:**
        ```bash
        python3 -m venv venv
        ```

3.  **Activate the virtual environment:**
    * **Windows (PowerShell):**
        ```powershell
        .\venv\Scripts\activate
        ```
    * **Linux / macOS:**
        ```bash
        source venv/bin/activate
        ```

4.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

### 3. Frontend Setup (Next.js)

1.  **Navigate to the frontend directory:**
    ```bash
    cd ../frontend
    ```

2.  **Install Node.js dependencies:**
    ```bash
    npm install
    ```

### 4. Environment Variables

You need to create `.env` files to store your secret API keys.

1.  **Backend**: In the `backend/` directory, create a file named `.env` and add your Gemini API key:
    ```
    # backend/.env
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
    ```
2.  **Frontend**: The frontend does not require any environment variables for the current setup.

---

## Running the Application

You must have **two separate terminals** open to run both the backend and frontend servers simultaneously.

### 1. Start the Backend Server
* Navigate to the `backend/` directory.
* Make sure your virtual environment is activated.
* Run the following command:
    ```bash
    uvicorn app:app --reload --reload-dir . --reload-exclude venv
    ```
    The backend will be running at `http://localhost:8000`.

### 2. Start the Frontend Server
* Navigate to the `frontend/` directory in a new terminal.
* Run the following command:
    ```bash
    npm run dev
    ```
    The frontend will be running at `http://localhost:3000`.

You can now open your browser and navigate to **`http://localhost:3000`** to use the application.


### How It Works

1.  The user selects an interview topic and a preferred voice on the homepage.
2.  An interview session begins, and the backend calls the Gemini API to generate the first question.
3.  The question text is converted to speech by the Coqui TTS model and played back to the user with a waveform visualizer.
4.  A timer starts, and the user records their answer, with a microphone visualizer providing real-time feedback.
5.  The user's audio is transcribed by the Whisper model. The user can review the transcribed text and choose to either re-record or accept the answer and continue to the next question.
6.  This cycle repeats until the user ends the session.
7.  On the results page, all recorded answers are sent to the Gemini API for a detailed, multi-metric evaluation, which is then displayed in a comprehensive table.

