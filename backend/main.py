import os
import uuid
import docx
import chromadb
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Load environment variables from .env file
load_dotenv()

# --- Clients Initialization ---
# OpenAI Client
client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key=os.getenv("OPENROUTER_API_KEY"),
)

# ChromaDB Client
# Construct an absolute path for the database directory
backend_dir = os.path.dirname(os.path.realpath(__file__))
db_path = os.path.join(backend_dir, "chroma_db")

# This will create a persistent database in the 'chroma_db' directory within the backend folder
chroma_client = chromadb.PersistentClient(path=db_path)
# Get or create a collection
collection = chroma_client.get_or_create_collection(name="legal_documents")


# --- Pydantic Models ---
class ChatMessage(BaseModel):
    message: str

# --- FastAPI App Initialization ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Helper Functions ---
def read_docx(file_path: str) -> str:
    try:
        doc = docx.Document(file_path)
        full_text = []
        for para in doc.paragraphs:
            full_text.append(para.text)
        return '\n'.join(full_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading docx file: {e}")

# --- API Endpoints ---
@app.get("/")
def read_root():
    return {"message": "Привіт від FastAPI!"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith('.docx'):
        raise HTTPException(status_code=400, detail="Invalid file type. Only .docx files are allowed.")

    # Save the uploaded file temporarily
    temp_file_path = f"temp_{file.filename}"
    with open(temp_file_path, "wb") as buffer:
        buffer.write(await file.read())

    try:
        # Read text from the docx file
        document_text = read_docx(temp_file_path)

        # Split the text into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        chunks = text_splitter.split_text(document_text)

        # Create unique IDs for each chunk
        ids = [str(uuid.uuid4()) for _ in chunks]

        # Add chunks to the ChromaDB collection
        collection.add(
            documents=chunks,
            ids=ids
        )

        return {"filename": file.filename, "status": "processed", "chunks_added": len(chunks)}

    except Exception as e:
        # Ensure the temp file is deleted even if an error occurs
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=f"An error occurred during file processing: {e}")
    finally:
        # Clean up the temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)


@app.post("/chat")
def chat_endpoint(body: ChatMessage):
    if not client.api_key or client.api_key == "YOUR_API_KEY_HERE":
        return {"reply": "Помилка: Ключ OpenRouter API не налаштовано на сервері."}

    try:
        completion = client.chat.completions.create(
            model="x-ai/grok-4-fast:free",
            messages=[
                {
                    "role": "user",
                    "content": body.message,
                },
            ],
            max_tokens=1024, # Limit the response length
            temperature=0.7, # Adjust creativity
        )
        
        reply = completion.choices[0].message.content
        print(f"Successfully received reply from Grok: {reply[:100]}...")
        return {"reply": reply}

    except Exception as e:
        print(f"[ERROR] An error occurred while calling the model: {e}")
        return {"reply": f"Вибачте, сталася помилка при зверненні до мовної моделі: {e}"}