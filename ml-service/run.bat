@echo off
echo Creating virtual environment if it doesn't exist...
if not exist venv (
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing dependencies...
pip install -r requirements.txt

echo Starting ML service...
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

echo Deactivating virtual environment...
deactivate 