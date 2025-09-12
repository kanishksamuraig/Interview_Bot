# # Coqui/backend/app.py
# import os
# import torch
# from fastapi import FastAPI, HTTPException
# from fastapi.responses import FileResponse
# from pydantic import BaseModel
# from TTS.api import TTS
# from dotenv import load_dotenv       # --- NEW ---
# import google.generativeai as genai  # --- NEW ---

# # --- NEW: Load environment variables from .env file ---
# load_dotenv()

# # --- Configuration & Model Loading ---

# # Define the paths for voices and output directories
# VOICES_DIR = "voices"
# OUTPUT_DIR = "out"
# os.makedirs(OUTPUT_DIR, exist_ok=True)

# # Use CUDA if available, otherwise use CPU
# device = "cuda" if torch.cuda.is_available() else "cpu"
# print(f"Device: {device}")

# # Load the Coqui TTS model on startup
# print("Loading Coqui XTTS V2 model...")
# try:
#     tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
#     print("TTS Model loaded successfully.")
# except Exception as e:
#     print(f"Error loading TTS model: {e}")
#     tts = None

# # --- NEW: Configure Gemini API ---
# print("Configuring Gemini API...")
# try:
#     gemini_api_key = os.getenv("GEMINI_API_KEY")
#     if not gemini_api_key:
#         raise ValueError("GEMINI_API_KEY not found in .env file")
#     genai.configure(api_key=gemini_api_key)
#     gemini_model = genai.GenerativeModel('gemini-pro')
#     print("Gemini API configured successfully.")
# except Exception as e:
#     print(f"Error configuring Gemini API: {e}")
#     gemini_model = None

# # --- FastAPI Application ---

# app = FastAPI()

# # --- Pydantic Models for Request Bodies ---
# class TTSRequest(BaseModel):
#     text: str
#     voice: str = "celebrimbor"
#     language: str = "en"

# # --- NEW ---
# class QuestionRequest(BaseModel):
#     subject: str

# # --- API Endpoints ---
# @app.get("/")
# def read_root():
#     return {"status": "Interview Bot Backend is running"}

# # --- NEW: Endpoint to get an interview question ---
# @app.post("/api/get-question/")
# async def get_question(request: QuestionRequest):
#     if gemini_model is None:
#         raise HTTPException(status_code=500, detail="Gemini model is not available.")

#     print(f"Generating question for subject: {request.subject}")
    
#     # We create a specific prompt for the AI
#     prompt = f"""
#     You are an expert interviewer.
#     Generate one, and only one, random, intermediate-level interview question about the topic: {request.subject}.
#     Do not provide the answer or any explanation. Only return the question itself.
#     """
#     #print(prompt)

#     try:
#         response = gemini_model.generate_content(prompt)
#         # Clean up the response text
#         question_text = response.text.strip()
#         #print(question_text)
#         return {"question": question_text}
#     except Exception as e:
#         print(f"An error occurred during Gemini API call: {e}")
#         raise HTTPException(status_code=500, detail="Failed to generate question from Gemini API.")

# @app.post("/api/generate-audio/")
# async def generate_audio(request: TTSRequest):
#     if tts is None:
#         raise HTTPException(status_code=500, detail="TTS model is not available.")

#     speaker_wav_path = os.path.join(VOICES_DIR, f"{request.voice}.wav")
#     output_path = os.path.join(OUTPUT_DIR, "generated_question.wav")

#     if not os.path.exists(speaker_wav_path):
#         raise HTTPException(status_code=400, detail=f"Voice '{request.voice}' not found.")

#     try:
#         tts.tts_to_file(
#             text=request.text,
#             speaker_wav=speaker_wav_path,
#             language=request.language,
#             file_path=output_path
#         )
#         # To play in browser, remove 'filename'. To force download, keep it.
#         return FileResponse(path=output_path, media_type="audio/wav")
#     except Exception as e:
#         raise HTTPException(status_code=500, detail="Failed to generate audio.")

# Coqui/backend/app.py

import os
import torch
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from TTS.api import TTS
from dotenv import load_dotenv
import google.generativeai as genai
from contextlib import asynccontextmanager  # IMPROVEMENT: For lifespan management
from starlette.concurrency import run_in_threadpool # IMPROVEMENT: For running blocking code
# Add these imports at the top
from faster_whisper import WhisperModel
from fastapi import UploadFile, File

# Add this to the global variables section
stt_model = None
# --- Load environment variables ---
load_dotenv()

# --- Global variables for models ---
# IMPROVEMENT: We initialize models as None and load them during the lifespan event.
tts_model = None
gemini_model = None

# --- IMPROVEMENT: Lifespan function to load models on startup ---
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
        # Use a global variable to store the model
        global gemini_model
        gemini_model = genai.GenerativeModel('gemini-1.5-flash-latest')
        print("Gemini API configured successfully.")
    except Exception as e:
        print(f"Error configuring Gemini API: {e}")

    # Load Coqui TTS Model
    print("Loading Coqui XTTS V2 model...")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Device: {device}")
    try:
        # Use a global variable to store the model
        global tts_model
        tts_model = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)
        print("TTS Model loaded successfully.")
    except Exception as e:
        print(f"Error loading TTS model: {e}")

    yield
     # Load Speech-to-Text Model
    print("Loading Faster Whisper model...")
    try:
        global stt_model
        # This will download the model on first run
        stt_model = WhisperModel("base", device="cpu", compute_type="int8")
        print("Faster Whisper model loaded successfully.")
    except Exception as e:
        print(f"Error loading Faster Whisper model: {e}")

    yield
    # This code runs on shutdown (optional)
    print("--- Server Shutting Down ---")

# --- FastAPI Application ---
# IMPROVEMENT: We pass the lifespan manager to the FastAPI app
app = FastAPI(lifespan=lifespan)

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
    You are an expert interviewer.
    Generate one, and only one, random, intermediate-level interview question about the topic: {request.subject}.
    Do not provide the answer or any explanation. Only return the question itself.
    """
    
    try:
        # IMPROVEMENT: Use the async version of the Gemini API call
        response = await gemini_model.generate_content_async(prompt)
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
        # IMPROVEMENT: Run the blocking TTS function in a separate thread
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
@app.post("/api/transcribe-audio/")
async def transcribe_audio(audio_file: UploadFile = File(...)):
    if stt_model is None:
        raise HTTPException(status_code=500, detail="STT model is not available.")

    try:
        # Save the uploaded file temporarily
        file_path = os.path.join(OUTPUT_DIR, "user_answer.wav")
        with open(file_path, "wb") as buffer:
            buffer.write(await audio_file.read())

        # Transcribe the audio file
        segments, info = stt_model.transcribe(file_path, beam_size=5)

        # Combine the transcribed segments into a single text
        transcribed_text = "".join(segment.text for segment in segments).strip()
        print(f"Transcribed Text: {transcribed_text}")
        
        return {"transcription": transcribed_text}
    except Exception as e:
        print(f"An error occurred during transcription: {e}")
        raise HTTPException(status_code=500, detail="Failed to transcribe audio.")