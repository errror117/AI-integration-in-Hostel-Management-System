@echo off
REM Hostel Management System - Demo Script for Windows
REM Tests chatbot and AI features using curl

echo ========================================
echo HOSTEL MANAGEMENT SYSTEM - AI CHATBOT DEMO  
echo ========================================
echo.

set BASE_URL=http://localhost:3000/api

echo [1/7] Testing FAQ Endpoints...
curl -s "%BASE_URL%/faq" 
echo.
echo.

echo [2/7] Testing Chatbot - Greetings
curl -s -X POST "%BASE_URL%/chatbot/message" -H "Content-Type: application/json" -d "{\"query\":\"Hello\",\"role\":\"student\"}"
echo.
echo.

echo [3/7] Testing Chatbot - FAQ Question
curl -s -X POST "%BASE_URL%/chatbot/message" -H "Content-Type: application/json" -d "{\"query\":\"What are hostel timings?\",\"role\":\"student\"}"
echo.
echo.

echo [4/7] Testing Chatbot - Mess Info
curl -s -X POST "%BASE_URL%/chatbot/message" -H "Content-Type: application/json" -d "{\"query\":\"What is for lunch today?\",\"role\":\"student\"}"
echo.
echo.

echo [5/7] Testing Chatbot - Complaint Registration
curl -s -X POST "%BASE_URL%/chatbot/message" -H "Content-Type: application/json" -d "{\"query\":\"WiFi not working in my room, it is an emergency\",\"role\":\"student\"}"
echo.
echo.

echo [6/7] Testing Chatbot - Help Command
curl -s -X POST "%BASE_URL%/chatbot/message" -H "Content-Type: application/json" -d "{\"query\":\"help\",\"role\":\"student\"}"
echo.
echo.

echo [7/7] Testing Chatbot - Unknown Query (RAG Fallback)
curl -s -X POST "%BASE_URL%/chatbot/message" -H "Content-Type: application/json" -d "{\"query\":\"When does the library open?\",\"role\":\"student\"}"
echo.
echo.

echo ========================================
echo Demo completed!
echo ========================================
echo.
echo Try these queries yourself:
echo   - Show my room details
echo   - I need late night permission
echo   - Register a complaint about cleanliness
echo   - What are quiet hours?
echo.
pause
