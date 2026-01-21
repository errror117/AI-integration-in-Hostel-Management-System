# 🎯 Quick Testing Instructions

Since the test data script has a duplicate key issue (organization already exists from previous run), here's what to do:

## **Option 1: Use Existing Test Data** (FASTEST - 0 minutes)

The organizations were partially created! Let's just use what exists and test manually.

**Check in MongoDB Compass if these exist:**
- Organization "ABC College Hostel" (slug: abc-college)
- Email: admin@abc.edu

You can test with this data OR clean and re-run.

---

## **Option 2: Clean & Re-Run** (5 minutes)

### **Step 1: Clean existing test data**

Open MongoDB Compass and delete:
- All documents in `organizations` collection with slug "abc-college" or "xyz-university"
- Related users, students, admins, hostels

**OR use this quick script:**

```javascript
// Run in MongoDB Compass or Mongo Shell
db.organizations.deleteMany({ slug: { $in: ['abc-college', 'xyz-university'] } });
db.users.deleteMany({ email: { $in: ['admin@abc.edu', 'admin@xyz.edu', 'student1@abc.edu', 'student1@xyz.edu'] } });
db.students.deleteMany({ email: { $in: ['student1@abc.edu', 'student1@xyz.edu'] } });
db.admins.deleteMany({ email: { $in: ['admin@abc.edu', 'admin@xyz.edu'] } });
db.hostels.deleteMany({ name: { $in: ['ABC Boys Hostel',  'XYZ Boys Hostel'] } });
```

### **Step 2: Re-run setup script**

```bash
node backend\utils\setupTestData.js
```

---

## **Option 3: Manual Testing** (10 minutes)

**Skip the automated setup and test manually:**

### **Step 1: Create Organizations via API**

```http
POST http://localhost:3000/api/organizations
Content-Type: application/json

{
  "name": "ABC College Hostel",
  "slug": "abc-college",
  "contact": {
    "email": "contact@abc.edu"
  }
}
```

### **Step 2: Register Admins**

```http
POST http://localhost:3000/api/admin/register
Content-Type: application/json

{
  "name": "Admin ABC",
  "email": "admin@abc.edu",
  "password": "admin123",
  "contact": "+91 98765 43210",
  "cnic": "12345-1234567-1"
}
```

### **Step 3: Test Login**

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@abc.edu",
  "password": "admin123"
}
```

---

## ✅ **RECOMMENDED: Option 2**

Clean the database and re-run the setup script. It's the cleanest approach!

---

**Which option would you like to proceed with?**
