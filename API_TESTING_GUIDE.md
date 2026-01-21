# 🧪 API Testing Collection for Multi-Tenancy

**Tool**: Postman or Thunder Client  
**Base URL**: http://localhost:3000

---

## 🔑 **TEST CREDENTIALS**

### **Organization A: ABC College**
- **Admin**: admin@abc.edu / admin123
- **Student**: student1@abc.edu / student123

### **Organization B: XYZ University**
- **Admin**: admin@xyz.edu / admin123
- **Student**: student1@xyz.edu / student123

---

## 📋 **API TEST SEQUENCE**

### **Step 1: Login as Org A Admin**

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@abc.edu",
  "password": "admin123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "token": "JWT_TOKEN_HERE",
  "user": {
    "id": "...",
    "email": "admin@abc.edu",
    "role": "org_admin",
    "organizationId": "ORG_A_ID"
  }
}
```

**Action**: Save the token as `ORG_A_ADMIN_TOKEN`

---

### **Step 2: Get Org A Students**

```http
GET http://localhost:3000/api/students
Authorization: Bearer ORG_A_ADMIN_TOKEN
```

**Expected**: Should return only Org A students

---

### **Step 3: Create Student in Org A**

```http
POST http://localhost:3000/api/students/register
Authorization: Bearer ORG_A_ADMIN_TOKEN
Content-Type: application/json

{
  "name": "Test Student A2",
  "cms_id": "ABC002",
  "email": "student2@abc.edu",
  "password": "student123",
  "batch": "2024",
  "dept": "Computer Science",
  "course": "BS CS",
  "room_no": "102",
  "contact": "+91 98765 00003",
  "cnic": "12345-1234567-3"
}
```

**Expected**: Student created with Org A's organizationId

---

### **Step 4: Login as Org B Admin**

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@xyz.edu",
  "password": "admin123"
}
```

**Action**: Save the token as `ORG_B_ADMIN_TOKEN`

---

### **Step 5: Get Org B Students**

```http
GET http://localhost:3000/api/students
Authorization: Bearer ORG_B_ADMIN_TOKEN
```

**Expected**: Should return only Org B students (NOT the student created in Step 3!)

**✅ TEST PASS IF**: Response does NOT include "Test Student A2"

---

### **Step 6: Test Cross-Organization Security**

Try to access Org A data with Org B token:

```http
GET http://localhost:3000/api/students
Authorization: Bearer ORG_B_ADMIN_TOKEN
```

**Expected**: Should return ONLY Org B students, NOT Org A students

**✅ DATA ISOLATION VERIFIED!**

---

## 🧪 **COMPREHENSIVE TEST SUITE**

### **Test 1: Complaints Isolation**

**Create complaint in Org A:**
```http
POST http://localhost:3000/api/complaints
Authorization: Bearer ORG_A_ADMIN_TOKEN
Content-Type: application/json

{
  "title": "WiFi Issue in Room 101",
  "description": "WiFi not working",
  "category": "WiFi/Internet",
  "urgencyLevel": "high"
}
```

**Get complaints as Org B:**
```http
GET http://localhost:3000/api/complaints
Authorization: Bearer ORG_B_ADMIN_TOKEN
```

**Expected**: Should NOT see the WiFi complaint from Org A

---

### **Test 2: Analytics Isolation**

**Get dashboard stats for Org A:**
```http
GET http://localhost:3000/api/analytics/summary
Authorization: Bearer ORG_A_ADMIN_TOKEN
```

**Get analytics stats for Org B:**
```http
GET http://localhost:3000/api/analytics/summary
Authorization: Bearer ORG_B_ADMIN_TOKEN
```

**Expected**: Different numbers for each organization

---

### **Test 3: Chatbot Isolation**

**Test Org A chatbot:**
```http
POST http://localhost:3000/api/chatbot/message
Authorization: Bearer ORG_A_ADMIN_TOKEN
Content-Type: application/json

{
  "query": "give me summary",
  "role": "admin"
}
```

**Expected**: Summary should show only Org A stats

**Test Org B chatbot:**
```http
POST http://localhost:3000/api/chatbot/message
Authorization: Bearer ORG_B_ADMIN_TOKEN
Content-Type: application/json

{
  "query": "give me summary",
  "role": "admin"
}
```

**Expected**: Summary should show only Org B stats (different from Org A!)

---

### **Test 4: CSV Export Isolation**

**Export Org A students:**
```http
GET http://localhost:3000/api/export/students
Authorization: Bearer ORG_A_ADMIN_TOKEN
```

**Expected**: CSV file with only Org A students

**Export Org B students:**
```http
GET http://localhost:3000/api/export/students
Authorization: Bearer ORG_B_ADMIN_TOKEN
```

**Expected**: CSV file with only Org B students

---

## ✅ **SUCCESS CRITERIA**

All tests pass if:

- ✅ **Data Isolation**: Each org only sees its own data
- ✅ **No Leakage**: Org B cannot see Org A data and vice versa
- ✅ **JWT Claims**: Tokens contain correct organizationId
- ✅ **CRUD Works**: Create, Read, Update, Delete work for both orgs
- ✅ **Analytics**: Stats are org-specific
- ✅ **Chatbot**: Responses are org-specific
- ✅ **Exports**: CSV files contain only org data

---

## 🐛 **TROUBLESHOOTING**

**If data leaks between organizations:**
1. Check MongoDB - View raw data and verify organizationId field
2. Decode JWT token - Verify it contains organizationId claim
3. Check controller code - Ensure all queries filter by organizationId
4. Check middleware - Ensure tenantMiddleware extracts organizationId

**Tools to help:**
- **JWT.io** - Decode and inspect JWT tokens
- **MongoDB Compass** - View raw database data
- **Postman Console** - View request/response details

---

## 🎯 **NEXT STEPS**

Once all tests pass:
1. ✅ Document results
2. ✅ Note any issues found
3. ✅ Fix critical bugs
4. ✅ Proceed to SaaS Features (Phase 2)

---

**Happy Testing!** 🚀
