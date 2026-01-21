#!/bin/bash

# Hostel Management System - Demo Script
# Tests chatbot and AI features using curl

echo "🤖 HOSTEL MANAGEMENT SYSTEM - AI CHATBOT DEMO"
echo "=============================================="
echo ""

BASE_URL="http://localhost:3000/api"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📚 1. Testing FAQ Endpoints${NC}"
echo "Getting all FAQs..."
curl -s "$BASE_URL/faq" | head -c 200
echo ""
echo ""

echo -e "${BLUE}🤖 2. Testing Chatbot - Greetings${NC}"
echo "Query: 'Hello'"
curl -s -X POST "$BASE_URL/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{"query":"Hello","role":"student"}' | head -c 300
echo ""
echo ""

echo -e "${BLUE}🤖 3. Testing Chatbot - FAQ Question${NC}"
echo "Query: 'What are hostel timings?'"
curl -s -X POST "$BASE_URL/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{"query":"What are hostel timings?","role":"student"}' | head -c 500
echo ""
echo ""

echo -e "${BLUE}🤖 4. Testing Chatbot - Mess Info${NC}"
echo "Query: 'What is for lunch today?'"
curl -s -X POST "$BASE_URL/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{"query":"What is for lunch today?","role":"student"}' | head -c 500
echo ""
echo ""

echo -e "${BLUE}🤖 5. Testing Chatbot - Complaint Registration${NC}"
echo "Query: 'WiFi not working, it's an emergency'"
curl -s -X POST "$BASE_URL/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{"query":"WiFi not working in my room, it is an emergency","role":"student"}' | head -c 500
echo ""
echo ""

echo -e "${BLUE}🤖 6. Testing Chatbot - Help Command${NC}"
echo "Query: 'help'"
curl -s -X POST "$BASE_URL/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{"query":"help","role":"student"}' | head -c 500
echo ""
echo ""

echo -e "${BLUE}🤖 7. Testing Chatbot - Unknown Query (RAG Fallback)${NC}"
echo "Query: 'Can I park my car in hostel?'"
curl -s -X POST "$BASE_URL/chatbot/message" \
  -H "Content-Type: application/json" \
  -d '{"query":"Can I park my car in hostel?","role":"student"}' | head -c 500
echo ""
echo ""

echo -e "${YELLOW}✅ Demo completed!${NC}"
echo ""
echo "To see full responses, remove '| head -c 500' from commands"
echo "To test with authentication, add: -H \"Authorization: Bearer YOUR_TOKEN\""
echo ""
echo "📝 Try these queries yourself:"
echo "  - 'Show my room details'"
echo "  - 'I need late night permission'"
echo "  - 'Register a complaint about cleanliness'"
echo "  - 'When is the mess open?'"
echo "  - 'What are quiet hours?'"
