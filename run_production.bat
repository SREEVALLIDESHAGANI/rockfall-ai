@echo off
title Rockfall-AI Production Server
echo ==============================================================================
echo   Rockfall-AI: AI-Based Rockfall Prediction and Alert System for Open-Pit Mines
echo   Department of AIML - Anurag University (Team No: 19)
echo ==============================================================================
echo.
echo Starting Unified Production Application on http://127.0.0.1:8000 ...
echo (Serving Frontend Web App + Machine Learning REST API)
echo.

start "" http://127.0.0.1:8000

python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
pause
