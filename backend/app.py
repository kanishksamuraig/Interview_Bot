import os
import torch
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from TTS.api import TTS
from dotenv import load_dotenv
import google.generativeai as genai
from contextlib import asynccontextmanager
from starlette.concurrency import run_in_threadpool
from faster_whisper import WhisperModel
from fastapi import UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import json # You'll need this for the evaluation endpoint later

# --- Load environment variables ---
load_dotenv()

# --- Global variables for models ---
tts_model = None
gemini_model = None
stt_model = None

# --- CORRECTED Lifespan function ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # This code runs on startup
    print("--- Server Starting Up ---")
    
    # Configure and load Gemini Model
    print("Configuring Gemini API...")
    try:
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            raise ValueError("GEMINI_API_KEY not found in .env file")
        genai.configure(api_key=gemini_api_key)
        global gemini_model
        #gemini_model = genai.GenerativeModel('gemini-2.5-flash-latest')
        gemini_model = genai.GenerativeModel('gemini-1.5-flash-latest')
        #gemini_model = genai.GenerativeModel('gemini-1.5-pro-latest')
        print("Gemini API configured successfully.")
    except Exception as e:
        print(f"Error configuring Gemini API: {e}")

    # Load Coqui TTS Model
    print("Loading Coqui XTTS V2 model...")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Device: {device}")
    try:
        global tts_model
        tts_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
        print("TTS Model loaded successfully.")
    except Exception as e:
        print(f"Error loading TTS model: {e}")
    
    # Load Speech-to-Text Model
    print("Loading Faster Whisper model...")
    try:
        global stt_model
        stt_model = WhisperModel("base", device="cpu", compute_type="int8")
        print("Faster Whisper model loaded successfully.")
    except Exception as e:
        print(f"Error loading Faster Whisper model: {e}")

    # This is the single yield point.
    yield
    
    # This code runs on shutdown (optional)
    print("--- Server Shutting Down ---")

# --- FastAPI Application ---
app = FastAPI(lifespan=lifespan)

# --- ADD THIS MIDDLEWARE CONFIGURATION ---
origins = [
    "http://localhost:3000", # The address of your frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods, including OPTIONS
    allow_headers=["*"], # Allows all headers
)

# --- Configuration ---
VOICES_DIR = "voices"
OUTPUT_DIR = "out"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# --- Pydantic Models ---
class TTSRequest(BaseModel):
    text: str
    voice: str = "celebrimbor"
    language: str = "en"

class QuestionRequest(BaseModel):
    subject: str

# --- NEW Pydantic Models for detailed feedback ---
class MetricFeedback(BaseModel):
    feedback: str
    score: int

class DetailedFeedback(BaseModel):
    problemUnderstanding: MetricFeedback
    vocabulary: MetricFeedback
    analyticalThinking: MetricFeedback
    professionalism: MetricFeedback
    correctness: MetricFeedback
    overallScore: int

class EvaluationResponse(BaseModel):
    evaluation: DetailedFeedback

class EvaluationRequest(BaseModel):
    question: str
    answer: str
# --- API Endpoints ---
@app.get("/")
def read_root():
    return {"status": "Interview Bot Backend is running"}

@app.post("/api/get-question/")
async def get_question(request: QuestionRequest):
    if gemini_model is None:
        raise HTTPException(status_code=500, detail="Gemini model is not available.")

    print(f"Generating question for subject: {request.subject}")
    
    prompt = f"""
You are an expert technical interviewer designing a question bank.
Your goal is to generate a unique, intermediate-level interview question about the topic: {request.subject}.
Ensure the question is distinct and not a simple rephrasing of common questions.
Vary the type of question;The question should not be long. sometimes ask for a definition, sometimes a comparison, and sometimes a practical application.
Return only the question itself, without any introductory text or the answer. Make sure u don't ask to design stuffs as this is a face to face spoken interview rather u can also ask applications
"""
    
    try:
        #response = await gemini_model.generate_content_async(prompt)
        # --- ADD THIS ---
        generation_config = genai.types.GenerationConfig(
            temperature=0.9
        )
        # --- AND MODIFY THIS ---
        response = await gemini_model.generate_content_async(
            prompt,
            generation_config=generation_config
        )
        question_text = response.text.strip()
        return {"question": question_text}
    except Exception as e:
        print(f"An error occurred during Gemini API call: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate question from Gemini API.")

@app.post("/api/generate-audio/")
async def generate_audio(request: TTSRequest):
    if tts_model is None:
        raise HTTPException(status_code=500, detail="TTS model is not available.")

    speaker_wav_path = os.path.join(VOICES_DIR, f"{request.voice}.wav")
    output_path = os.path.join(OUTPUT_DIR, "generated_question.wav")

    if not os.path.exists(speaker_wav_path):
        raise HTTPException(status_code=400, detail=f"Voice '{request.voice}' not found.")

    try:
        await run_in_threadpool(
            tts_model.tts_to_file,
            text=request.text,
            speaker_wav=speaker_wav_path,
            language=request.language,
            file_path=output_path
        )
        return FileResponse(path=output_path, media_type="audio/wav")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to generate audio.")

# --- CORRECTED Transcribe Endpoint ---
@app.post("/api/transcribe-audio/")
async def transcribe_audio(audio_file: UploadFile = File(...)):
    if stt_model is None:
        raise HTTPException(status_code=500, detail="STT model is not available.")

    file_path = os.path.join(OUTPUT_DIR, "user_answer.wav")

    try:
        # Save the uploaded file temporarily
        with open(file_path, "wb") as buffer:
            buffer.write(await audio_file.read())
        
        # This is a helper function to run the blocking transcribe call
        def transcribe_sync():
            segments, info = stt_model.transcribe(file_path, beam_size=5)
            # Combine the transcribed segments into a single text
            return "".join(segment.text for segment in segments).strip()

        # Run the synchronous function in a thread pool
        transcribed_text = await run_in_threadpool(transcribe_sync)
        
        print(f"Transcribed Text: {transcribed_text}")
        
        return {"transcription": transcribed_text}
    except Exception as e:
        print(f"An error occurred during transcription: {e}")
        raise HTTPException(status_code=500, detail="Failed to transcribe audio.")
    
# --- ADD THIS ENTIRE ENDPOINT AT THE END OF YOUR FILE ---
@app.post("/api/evaluate-answer/")
async def evaluate_answer(request: EvaluationRequest):
    if gemini_model is None:
        raise HTTPException(status_code=500, detail="Gemini model is not available.")

    print(f"Evaluating answer for question: {request.question}")

    prompt = f"""
    You are an expert technical interviewer AI. Your task is to evaluate a candidate's answer to a specific question.
    Provide a detailed evaluation by giving feedback and a score from 1 to 10 for EACH of the following five metrics:
    1. Problem Understanding
    2. Vocabulary
    3. Analytical Thinking
    4. Professionalism
    5. Correctness

    Your response MUST be a single, valid JSON object. This object should contain one key, "evaluation", whose value is another object.
    This inner object must contain a key for each of the five metrics, where each value is an object with "feedback" (string) and "score" (integer) keys.
    It must also include an "overallScore" (integer) key for the final score.

    Example response format:
    {{
      "evaluation": {{
        "problemUnderstanding": {{ "feedback": "Candidate grasped the core concept.", "score": 8 }},
        "vocabulary": {{ "feedback": "Used technical terms accurately.", "score": 9 }},
        "analyticalThinking": {{ "feedback": "Logically structured the answer.", "score": 7 }},
        "professionalism": {{ "feedback": "Answer was concise and clear.", "score": 9 }},
        "correctness": {{ "feedback": "The information provided was factually correct.", "score": 8 }},
        "overallScore": 8
      }}
    }}

    ---
    Question: "{request.question}"
    Candidate's Answer: "{request.answer}"
    ---
    """
    
    try:
        response = await gemini_model.generate_content_async(prompt)
        json_response_text = response.text.strip().replace("```json", "").replace("```", "").strip()
        evaluation_data = json.loads(json_response_text)
        
        print(f"Evaluation result: {evaluation_data}")
        return evaluation_data
        
    except Exception as e:
        print(f"An error occurred during evaluation: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse evaluation from AI response.")
