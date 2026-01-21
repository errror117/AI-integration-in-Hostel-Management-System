# 🚀 Quick Start Guide

## Start the Application

### 1. Start Backend Server
```bash
cd backend
npm run dev
```

Server will start on: `http://localhost:3000`

### 2. Start Frontend (in a new terminal)
```bash
cd client
npm run dev
```

Frontend will start on: `http://localhost:5173`

---

## Test Logins Immediately

### Super Admin Test:
1. Open: http://localhost:5173/auth/admin-login
2. Login: `superadmin@hostelease.com` / `admin123`
3. Navigate to: http://localhost:5173/superadmin
4. ✅ You should see 4 organizations!

### Organization Admin Test:
1. Open: http://localhost:5173/auth/admin-login
2. Login: `admin@abc-eng.edu` / `admin123`
3. ✅ Should redirect to ABC Engineering admin dashboard

### Student Test:
1. Get student email: `npm run show-students` (in backend folder)
2. Open: http://localhost:5173/auth/student-login  
3. Login with any student email / `student123`
4. ✅ Should see student dashboard

---

## Troubleshooting

### Backend won't start:
- Check MongoDB is running (connection string in `.env`)
- Verify `MONGO_URI` and `JWT_SECRET` in `.env`
- Run `npm install` if dependencies missing

### Frontend won't start:
- Run `npm install` in client folder
- Check if port 5173 is available

### Login fails:
- Run `npm run fix-logins` in backend folder
- Check backend console for errors
- Verify backend is running on port 3000

---

## Useful Commands

```bash
# Fix all logins
cd backend && npm run fix-logins

# Show student credentials
cd backend && npm run show-students

# Restart backend
cd backend && npm run dev

# Restart frontend  
cd client && npm run dev
```

---

**Everything is ready! Just start the servers and login.** 🎉
