# Hostel Management System - API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Most endpoints require JWT authentication. Include token in header:
```
Authorization: Bearer <token>
```

---

## 🤖 Chatbot API

### Process Chat Message
**POST** `/chatbot/message`

Process a user query with AI intent classification and RAG.

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "query": "What are hostel timings?",
  "role": "student"
}
```

**Response:**
```json
{
  "reply": "The hostel gate remains open from 6:00 AM to 10:00 PM...",
  "intent": "RAG_ANSWER",
  "confidence": 0.89,
  "data": {
    "source": "faq"
  }
}
```

**Intents:**
- `GREETING`, `MY_ROOM`, `VACANCY`, `MESS_INFO`
- `REGISTER_COMPLAINT`, `MY_COMPLAINTS`
- `LATE_NIGHT_PERMISSION`, `LEAVE_REQUEST`, `MESS_OFF`
- `GENERATE_NOTICE`, `WEEKLY_SUMMARY`, `HELP`
- `RAG_ANSWER`, `UNKNOWN`

---

### Get Chat Logs
**GET** `/chatbot/logs?limit=50&intent=GREETING&sentiment=positive`

Retrieve chat conversation logs (Admin only).

**Query Parameters:**
- `limit` (optional): Number of logs (default: 50)
- `intent` (optional): Filter by intent
- `sentiment` (optional): Filter by sentiment

**Response:**
```json
{
  "success": true,
  "count": 15,
  "data": [...]
}
```

---

### Get Chatbot Statistics
**GET** `/chatbot/stats`

Get overall chatbot usage statistics (Admin only).

**Response:**
```json
{
  "success": true,
  "todayStats": { "messageCount": 45 },
  "totalMessages": 1250,
  "intentDistribution": [
    { "_id": "MESS_INFO", "count": 234 },
    { "_id": "MY_ROOM", "count": 189 }
  ]
}
```

---

### Provide Feedback
**POST** `/chatbot/feedback`

Provide feedback on chatbot response.

**Request Body:**
```json
{
  "logId": "507f1f77bcf86cd799439011",
  "helpful": true
}
```

---

## 📚 FAQ API

### List All FAQs
**GET** `/faq?category=hostel_rules&isActive=true`

**Query Parameters:**
- `category` (optional): Filter by category
- `isActive` (optional): Filter active/inactive FAQs

**Response:**
```json
{
  "success": true,
  "count": 25,
  "data": [
    {
      "_id": "...",
      "question": "What are the hostel timings?",
      "answer": "The hostel gate remains open from 6:00 AM to 10:00 PM...",
      "category": "hostel_rules",
      "keywords": ["timings", "gate", "hours"],
      "viewCount": 142,
      "helpfulCount": 89
    }
  ]
}
```

---

### Create FAQ
**POST** `/faq` (Admin only)

**Request Body:**
```json
{
  "question": "Can I bring a car to hostel?",
  "answer": "Yes, limited parking is available...",
  "category": "facilities",
  "keywords": ["car", "parking", "vehicle"]
}
```

---

### Update FAQ
**PUT** `/faq/:id` (Admin only)

**Request Body:**
```json
{
  "answer": "Updated answer...",
  "isActive": true
}
```

---

### Bulk Upload FAQs
**POST** `/faq/bulk` (Admin only)

**Request Body:**
```json
{
  "faqs": [
    {
      "question": "...",
      "answer": "...",
      "category": "general",
      "keywords": []
    }
  ]
}
```

---

### Regenerate Embeddings
**POST** `/faq/regenerate-embeddings` (Admin only)

Regenerate vector embeddings for all FAQs.

---

### FAQ Feedback
**POST** `/faq/:id/feedback`

**Request Body:**
```json
{
  "helpful": true
}
```

---

## 📢 Notice API

### AI Generate Notice
**POST** `/notice/generate` (Admin only)

**Request Body:**
```json
{
  "topic": "mess",
  "details": "Menu change from next Monday",
  "priority": "medium",
  "targetAudience": "all"
}
```

**Response:**
```json
{
  "success": true,
  "draft": "NOTICE - MESS FACILITY\n\nDear Students...",
  "topic": "mess",
  "priority": "medium"
}
```

---

### Create Notice
**POST** `/notice` (Admin only)

**Request Body:**
```json
{
  "title": "Mess Menu Change",
  "content": "Notice content...",
  "category": "mess",
  "priority": "medium",
  "targetAudience": "all",
  "status": "published",
  "isAIGenerated": true
}
```

---

### List Notices
**GET** `/notice?status=published&category=mess`

**Query Parameters:**
- `status`: draft, published, archived
- `category`: general, mess, maintenance, fees, event, emergency
- `priority`: low, medium, high, critical

---

### Acknowledge Notice
**POST** `/notice/:id/acknowledge` (Student)

Mark a notice as acknowledged by the student.

---

## 📊 Analytics API

### Get Weekly Summary
**GET** `/analytics/summary?period=week`

**Query Parameters:**
- `period`: week or month

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "week",
    "generatedAt": "2024-01-15T10:30:00Z",
    "chatbot": {
      "totalMessages": 234,
      "intentDistribution": {...},
      "avgResponseTime": 287
    },
    "complaints": {
      "totalComplaints": 45,
      "resolutionRate": 78.5
    },
    "summary": "📊 **Chatbot Activity**: 234 messages this week..."
  }
}
```

---

### Get Chatbot Analytics
**GET** `/analytics/chatbot`

Detailed chatbot usage statistics.

---

### Get Complaint Trends
**GET** `/analytics/complaints?days=30`

Analyze complaint patterns and trends.

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "30 days",
    "totalComplaints": 67,
    "categoryDistribution": {
      "WiFi/Internet": 23,
      "Electrical": 15
    },
    "urgencyDistribution": {
      "critical": 5,
      "high": 12,
      "medium": 35,
      "low": 15
    },
    "avgResolutionTime": 18.5,
    "resolutionRate": 82.3
  }
}
```

---

### Get Mess Crowd Prediction
**GET** `/analytics/mess-prediction?date=2024-01-15T12:00:00Z`

Predict mess crowd for a given time.

**Response:**
```json
{
  "success": true,
  "data": {
    "predictedCrowd": 87,
    "confidence": 0.75,
    "bestTime": "1:45 PM",
    "reasoning": "Based on 12:00 hour and 15 students on mess-off"
  }
}
```

---

### Get Expense Prediction
**GET** `/analytics/expense-prediction`

Predict monthly expenses for logged-in student.

**Response:**
```json
{
  "success": true,
  "data": {
    "predictedAmount": 4590,
    "breakdown": {
      "rent": 3000,
      "mess": 2500,
      "miscellaneous": 500
    },
    "confidence": 0.7,
    "reasoning": "Based on average fees and 2% inflation adjustment"
  }
}
```

---

### Export Report
**GET** `/analytics/export?format=json&type=chatbot`

**Query Parameters:**
- `format`: json or csv
- `type`: chatbot, complaints, or summary

---

## 🛠️ Complaint API

### Register Complaint
**POST** `/complaint`

**Request Body:**
```json
{
  "title": "WiFi not working",
  "description": "Internet connection is very slow in room 302",
  "type": "WiFi/Internet"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "aiPriorityScore": 65,
    "urgencyLevel": "high",
    "status": "pending",
    "category": "WiFi/Internet",
    "sentiment": "negative"
  }
}
```

**AI Features:**
- Automatic priority scoring (0-100)
- Urgency level classification
- Sentiment detection
- Category assignment

---

## 🏠 Student & Room APIs

### Get My Room
**GET** `/student/me/room`

Get room details for logged-in student.

---

### Get Available Rooms
**GET** `/student/rooms/available`

List all vacant rooms.

---

## 🔐 Authentication

### Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "John Doe",
    "role": "student"
  }
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## Rate Limiting

- **Standard**: 100 requests/minute
- **Chatbot**: 30 requests/minute per user
- **Bulk Operations**: 10 requests/minute

---

## Testing Examples

### Using cURL

```bash
# Get FAQs
curl http://localhost:3000/api/faq

# Chat with bot
curl -X POST http://localhost:3000/api/chatbot/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query":"What are hostel timings?","role":"student"}'

# Get analytics
curl http://localhost:3000/api/analytics/summary?period=week \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using JavaScript (Fetch)

```javascript
// Chat with bot
const response = await fetch('http://localhost:3000/api/chatbot/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    query: 'Show my room details',
    role: 'student'
  })
});

const data = await response.json();
console.log(data.reply);
```

---

**Version:** 1.0  
**Last Updated:** December 2024
