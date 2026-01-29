# 🧪 MANUAL TESTING TASK SHEET
## Hostel Ease SaaS - Comprehensive Testing Guide

**Generated:** 2026-01-29  
**Application URL:** http://localhost:5173  
**Backend URL:** http://localhost:3000

---

## 📋 TABLE OF CONTENTS

1. [Login Credentials](#-login-credentials)
2. [Pre-Testing Setup](#-pre-testing-setup)
3. [Student Dashboard Tests](#-student-dashboard-tests)
4. [Admin Dashboard Tests](#-admin-dashboard-tests)
5. [Super Admin Dashboard Tests](#-super-admin-dashboard-tests)
6. [Chatbot Tests](#-chatbot-tests)
7. [Cross-Feature Tests](#-cross-feature-tests)
8. [Error Handling Tests](#-error-handling-tests)
9. [Test Checklist Summary](#-test-checklist-summary)

---

## 🔐 LOGIN CREDENTIALS

### Primary Test Accounts

| Role | Email | Password | Organization |
|------|-------|----------|--------------|
| 👑 **Super Admin** | `superadmin@hostelease.com` | `SuperAdmin@123` | Global (All Organizations) |
| 👨‍💼 **Admin** (MU) | `admin@mu.edu` | `admin123` | Marwadi University |
| 👨‍💼 **Admin** (ABC) | `admin@abc-eng.edu` | `admin123` | ABC Engineering College |
| 👨‍🎓 **Student** (MU) | `kunal.pillai20000@mu.edu` | `student123` | Marwadi University |
| 👨‍🎓 **Student** (ABC) | `rahul.s@abc-eng.edu` | `student123` | ABC Engineering College |

### Additional Test Accounts

| Role | Email | Password | Organization |
|------|-------|----------|--------------|
| 👨‍💼 Admin | `admin@daiict.ac.in` | `admin123` | DA-IICT |
| 👨‍💼 Admin | `admin@pdeu.ac.in` | `admin123` | PDEU |
| 👨‍💼 Admin | `admin@dtu.edu` | `admin123` | Delhi Technical University |
| 👨‍💼 Admin | `admin@mec.edu` | `admin123` | Mumbai Engineering College |
| 👨‍💼 Admin | `admin@bit.edu` | `admin123` | Bangalore Institute of Technology |
| 👨‍🎓 Student | `priya.p@abc-eng.edu` | `student123` | ABC Engineering College |
| 👨‍🎓 Student | `student1@daiict.edu` | `student123` | DA-IICT |
| 👨‍🎓 Student | `student1@pdeu.edu` | `student123` | PDEU |

---

## 🛠 PRE-TESTING SETUP

### Step 1: Start Backend Server
```powershell
cd "e:\6th_SEM\AI\8th sem major\latest complaint working\backend"
node index.js
```
**Expected:** Server running on port 3000, MongoDB connected

### Step 2: Start Frontend Development Server
```powershell
cd "e:\6th_SEM\AI\8th sem major\latest complaint working\client"
npm run dev
```
**Expected:** Vite server running on http://localhost:5173

### Step 3: Verify Backend Health
```
GET http://localhost:3000/api/health
```
**Expected Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "environment": "development"
}
```

---

## 👨‍🎓 STUDENT DASHBOARD TESTS

### Test Suite 1: Authentication

| # | Test Case | Steps | Expected Result | ✅/❌ |
|---|-----------|-------|-----------------|-------|
| S1.1 | Valid Student Login | 1. Go to `/auth/login` <br> 2. Enter `kunal.pillai20000@mu.edu` / `student123` <br> 3. Click Login | Redirect to `/student-dashboard` with user info displayed | |
| S1.2 | Invalid Password | 1. Enter valid email with wrong password | Error message: "Invalid credentials" | |
| S1.3 | Invalid Email | 1. Enter non-existent email | Error message: "User not found" or "Invalid credentials" | |
| S1.4 | Empty Fields | 1. Click Login without entering credentials | Form validation error shown | |
| S1.5 | Logout | 1. Click Logout button | Redirect to landing page, token cleared | |

### Test Suite 2: Home Dashboard

| # | Test Case | Steps | Expected Result | ✅/❌ |
|---|-----------|-------|-----------------|-------|
| S2.1 | Dashboard Load | 1. Login as student <br> 2. Navigate to `/student-dashboard` | Dashboard loads with student info, stats cards visible | |
| S2.2 | Welcome Message | 1. Check welcome section | Student name displayed correctly | |
| S2.3 | Quick Stats | 1. Check stats cards | Pending complaints, invoices, attendance stats shown | |

### Test Suite 3: Complaints Module

| # | Test Case | Steps | Expected Result | ✅/❌ |
|---|-----------|-------|-----------------|-------|
| S3.1 | View Complaints | 1. Navigate to `/student-dashboard/complaints` | List of student's complaints displayed | |
| S3.2 | Create New Complaint | 1. Click "New Complaint" <br> 2. Fill Title, Category, Description <br> 3. Submit | Complaint created, appears in list with "Pending" status | |
| S3.3 | View Complaint Details | 1. Click on existing complaint | Complaint details modal/page opens | |
| S3.4 | File Attachment | 1. Create complaint with image attachment | Image uploads successfully, visible in complaint | |
| S3.5 | Complaint Categories | 1. Check category dropdown | Categories: Maintenance, Electrical, Plumbing, Cleanliness, Other | |

### Test Suite 4: Mess Module

| # | Test Case | Steps | Expected Result | ✅/❌ |
|---|-----------|-------|-----------------|-------|
| S4.1 | View Menu | 1. Navigate to `/student-dashboard/mess` | Today's mess menu displayed (Breakfast, Lunch, Dinner) | |
| S4.2 | Request Mess Off | 1. Click "Request Mess Off" <br> 2. Select dates <br> 3. Submit | Mess off request created | |
| S4.3 | View Mess Off History | 1. Check mess off requests tab | List of previous mess off requests shown | |

### Test Suite 5: Attendance Module

| # | Test Case | Steps | Expected Result | ✅/❌ |
|---|-----------|-------|-----------------|-------|
| S5.1 | View Attendance | 1. Navigate to `/student-dashboard/attendance` | Attendance calendar/list displayed | |
| S5.2 | Attendance Stats | 1. Check attendance percentage | Correct percentage calculated | |

### Test Suite 6: Invoices Module

| # | Test Case | Steps | Expected Result | ✅/❌ |
|---|-----------|-------|-----------------|-------|
| S6.1 | View Invoices | 1. Navigate to `/student-dashboard/invoices` | List of invoices displayed | |
| S6.2 | Invoice Details | 1. Click on an invoice | Invoice details shown (amount, due date, breakdown) | |
| S6.3 | Payment Status | 1. Check invoice statuses | Different statuses: Paid, Pending, Overdue | |

### Test Suite 7: Suggestions Module

| # | Test Case | Steps | Expected Result | ✅/❌ |
|---|-----------|-------|-----------------|-------|
| S7.1 | View Suggestions | 1. Navigate to `/student-dashboard/suggestions` | List of suggestions displayed | |
| S7.2 | Create Suggestion | 1. Click "New Suggestion" <br> 2. Fill category and message <br> 3. Submit | Suggestion created successfully | |

### Test Suite 8: QR Code Module

| # | Test Case | Steps | Expected Result | ✅/❌ |
|---|-----------|-------|-----------------|-------|
| S8.1 | View QR Code | 1. Navigate to `/student-dashboard/qr` | Student's unique QR code displayed | |
| S8.2 | QR Code Info | 1. Check QR details | Student ID, Room, other info encoded | |

### Test Suite 9: Settings Module

| # | Test Case | Steps | Expected Result | ✅/❌ |
|---|-----------|-------|-----------------|-------|
| S9.1 | View Profile | 1. Navigate to `/student-dashboard/settings` | Profile information displayed | |
| S9.2 | Update Profile | 1. Edit profile fields <br> 2. Save | Profile updated successfully | |
| S9.3 | Change Password | 1. Enter current and new password <br> 2. Save | Password changed successfully | |

---

## 👨‍💼 ADMIN DASHBOARD TESTS

### Test Suite 10: Admin Authentication

| # | Test Case | Steps | Expected Result | ✅/❌ |
|---|-----------|-------|-----------------|-------|
| A10.1 | Valid Admin Login | 1. Go to `/auth/admin-login` <br> 2. Enter `admin@mu.edu` / `admin123` <br> 3. Click Login | Redirect to `/admin-dashboard` | |
| A10.2 | Invalid Admin Credentials | 1. Enter wrong password | Error message displayed | |
| A10.3 | Admin Logout | 1. Click Logout | Redirect to landing page | |

### Test Suite 11: Admin Home Dashboard

| # | Test Case | Steps | Expected Result | ✅/❌ |
|---|-----------|-------|-----------------|-------|
| A11.1 | Dashboard Load | 1. Login as admin <br> 2. Check dashboard | Stats cards, charts, overview displayed | |
| A11.2 | Stats Cards | 1. Check all stat cards | Total students, pending complaints, etc. | |
| A11.3 | Recent Activity | 1. Check recent activity section | Recent complaints/suggestions listed | |

### Test Suite 12: Student Management

| # | Test Case | Steps | Expected Result | ✅/❌ |
|---|-----------|-------|-----------------|-------|
| A12.1 | View All Students | 1. Navigate to `/admin-dashboard/all-students` | List of all students in organization | |
| A12.2 | Search Students | 1. Use search bar | Students filtered by name/email | |
| A12.3 | Register New Student | 1. Navigate to `/admin-dashboard/register-student` <br> 2. Fill all fields <br> 3. Submit | New student created with credentials | |
| A12.4 | Edit Student | 1. Click edit on a student <br> 2. Modify details <br> 3. Save | Student info updated | |
| A12.5 | Student Details | 1. Click on student row | Student profile details shown | |

### Test Suite 13: Complaints Management

| # | Test Case | Steps | Expected Result | ✅/❌ |
|---|-----------|-------|-----------------|-------|
| A13.1 | View All Complaints | 1. Navigate to `/admin-dashboard/complaints` | All complaints listed with status | |
| A13.2 | Filter by Status | 1. Filter by Pending/In Progress/Resolved | List updates accordingly | |
| A13.3 | Update Status | 1. Select complaint <br> 2. Change status to "In Progress" | Status updated, notification sent | |
| A13.4 | Resolve Complaint | 1. Mark complaint as "Resolved" | Complaint closed, stats updated | |
| A13.5 | View Complaint Details | 1. Click on complaint | Full details, history, attachments shown | |

### Test Suite 14: Mess Management

| # | Test Case | Steps | Expected Result | ✅/❌ |
|---|-----------|-------|-----------------|-------|
| A14.1 | View Mess Off Requests | 1. Navigate to `/admin-dashboard/mess` | All mess off requests listed | |
| A14.2 | Approve Request | 1. Click Approve on request | Request approved, student notified | |
| A14.3 | Reject Request | 1. Click Reject on request | Request rejected with reason | |

### Test Suite 15: Attendance Management

| # | Test Case | Steps | Expected Result | ✅/❌ |
|---|-----------|-------|-----------------|-------|
| A15.1 | View Attendance | 1. Navigate to `/admin-dashboard/attendance` | Attendance overview displayed | |
| A15.2 | Mark Attendance | 1. Select students <br> 2. Mark present/absent | Attendance recorded | |
| A15.3 | Attendance Report | 1. Check attendance stats | Percentage, charts displayed | |

### Test Suite 16: Invoice Management

| # | Test Case | Steps | Expected Result | ✅/❌ |
|---|-----------|-------|-----------------|-------|
| A16.1 | View All Invoices | 1. Navigate to `/admin-dashboard/invoices` | All invoices listed | |
| A16.2 | Create Invoice | 1. Click "Create Invoice" <br> 2. Select student, add items <br> 3. Submit | Invoice generated | |
| A16.3 | Mark as Paid | 1. Select pending invoice <br> 2. Mark as paid | Status updated | |

### Test Suite 17: Suggestions Management

| # | Test Case | Steps | Expected Result | ✅/❌ |
|---|-----------|-------|-----------------|-------|
| A17.1 | View Suggestions | 1. Navigate to `/admin-dashboard/suggestions` | All suggestions from students listed | |
| A17.2 | Respond to Suggestion | 1. Add admin response | Response saved and visible | |

### Test Suite 18: Analytics Dashboard

| # | Test Case | Steps | Expected Result | ✅/❌ |
|---|-----------|-------|-----------------|-------|
| A18.1 | View AI Analytics | 1. Navigate to `/admin-dashboard/chatbot-analytics` | Analytics page loads | |
| A18.2 | Chatbot Usage Stats | 1. Check chatbot metrics | Total queries, popular intents shown | |
| A18.3 | Prediction Data | 1. Check predictions | Mess predictions, complaint predictions displayed | |
| A18.4 | Download Reports | 1. Click download report buttons | Excel/PDF reports downloaded | |

---

## 👑 SUPER ADMIN DASHBOARD TESTS

### Test Suite 19: Super Admin Access

| # | Test Case | Steps | Expected Result | ✅/❌ |
|---|-----------|-------|-----------------|-------|
| SA19.1 | Valid Super Admin Login | 1. Go to `/auth/admin-login` <br> 2. Enter `superadmin@hostelease.com` / `SuperAdmin@123` | Redirect to `/superadmin` | |
| SA19.2 | Dashboard Load | 1. Check super admin dashboard | Platform stats, all organizations visible | |

### Test Suite 20: Organization Management

| # | Test Case | Steps | Expected Result | ✅/❌ |
|---|-----------|-------|-----------------|-------|
| SA20.1 | View Organizations | 1. Check organizations list | All registered organizations displayed | |
| SA20.2 | Organization Stats | 1. Click on an organization | Org details, student count, usage stats | |
| SA20.3 | Platform Stats | 1. Check global stats | Total users, orgs, complaints across platform | |

### Test Suite 21: Subscription Management

| # | Test Case | Steps | Expected Result | ✅/❌ |
|---|-----------|-------|-----------------|-------|
| SA21.1 | View Subscriptions | 1. Check subscriptions overview | All org subscriptions listed | |
| SA21.2 | Subscription Status | 1. View active/trial/expired | Correct status for each org | |

---

## 💬 CHATBOT TESTS

### Test Suite 22: Student Chatbot Commands

| # | Test Case | Command | Expected Response | ✅/❌ |
|---|-----------|---------|-------------------|-------|
| C22.1 | Mess Menu | `mess menu` | Today's mess menu displayed | |
| C22.2 | My Complaints | `my complaints` | List of user's complaints | |
| C22.3 | File Complaint | `AC not working` | Complaint filing flow starts | |
| C22.4 | View Invoice | `my invoice` | Pending fees information | |
| C22.5 | Mess Off Request | `mess off` | Mess off request flow | |
| C22.6 | Gym Timing | `gym timing` | Gym hours information | |
| C22.7 | WiFi Info | `wifi password` | WiFi credentials shown | |
| C22.8 | Emergency | `emergency` | Emergency contacts displayed | |
| C22.9 | Help | `help` | All available options shown | |
| C22.10 | Greeting | `hello` | Friendly greeting response | |

### Test Suite 23: Admin Chatbot Commands

| # | Test Case | Command | Expected Response | ✅/❌ |
|---|-----------|---------|-------------------|-------|
| C23.1 | Summary | `summary` | Hostel status report | |
| C23.2 | Show Complaints | `show complaints` | List of pending complaints | |
| C23.3 | Urgent Issues | `urgent issues` | High priority items | |
| C23.4 | Suggestions | `suggestions` | Student suggestions | |
| C23.5 | Download Report | `download report` | Report download links | |
| C23.6 | AI Analytics | `AI analytics` | Chatbot usage statistics | |
| C23.7 | Predict Mess | `predict mess` | Tomorrow's mess attendance prediction | |
| C23.8 | Predict Complaints | `predict complaints` | Next week's complaint prediction | |
| C23.9 | Students Count | `students count` | Total registered students | |

### Test Suite 24: Super Admin Chatbot Commands

| # | Test Case | Command | Expected Response | ✅/❌ |
|---|-----------|---------|-------------------|-------|
| C24.1 | Organizations | `show all organizations` | List of all colleges | |
| C24.2 | Platform Stats | `platform stats` | Global statistics | |
| C24.3 | Subscriptions | `subscriptions` | Billing overview | |
| C24.4 | System Status | `system status` | Health check info | |

---

## 🔄 CROSS-FEATURE TESTS

### Test Suite 25: Multi-Tenancy Tests

| # | Test Case | Steps | Expected Result | ✅/❌ |
|---|-----------|-------|-----------------|-------|
| MT25.1 | Data Isolation | 1. Login as admin@mu.edu <br> 2. Check students <br> 3. Login as admin@abc-eng.edu <br> 4. Check students | Each admin only sees their org's students | |
| MT25.2 | Organization Context | 1. Login as MU student <br> 2. Check complaints | Only complaints from MU visible | |
| MT25.3 | Cross-Org Prevention | 1. Try accessing other org's data via URL manipulation | Access denied or no data returned | |

### Test Suite 26: Real-Time Updates

| # | Test Case | Steps | Expected Result | ✅/❌ |
|---|-----------|-------|-----------------|-------|
| RT26.1 | Complaint Update | 1. Open student dashboard in browser 1 <br> 2. Open admin dashboard in browser 2 <br> 3. Admin updates complaint status | Student sees update in real-time | |
| RT26.2 | Socket Connection | 1. Check browser console for socket connection | Socket.IO connected without errors | |

---

## 🚨 ERROR HANDLING TESTS

### Test Suite 27: Error Scenarios

| # | Test Case | Steps | Expected Result | ✅/❌ |
|---|-----------|-------|-----------------|-------|
| E27.1 | Network Error | 1. Stop backend <br> 2. Try any API action | Proper error message shown | |
| E27.2 | 404 Page | 1. Visit `/random-invalid-url` | 404 page or redirect to home | |
| E27.3 | Token Expiry | 1. Clear/invalidate token <br> 2. Try to access dashboard | Redirect to login page | |
| E27.4 | Form Validation | 1. Submit empty required fields | Validation errors shown | |
| E27.5 | Duplicate Data | 1. Create student with existing email | Error: "Email already exists" | |

---

## ✅ TEST CHECKLIST SUMMARY

### Quick Smoke Test (5 minutes)
- [ ] Backend health check passes
- [ ] Frontend loads without errors
- [ ] Student login works
- [ ] Admin login works
- [ ] Super Admin login works
- [ ] Chatbot responds to "help"

### Student Features (15 minutes)
- [ ] Dashboard loads with stats
- [ ] Create complaint works
- [ ] View mess menu works
- [ ] View invoices works
- [ ] Create suggestion works
- [ ] QR code displays
- [ ] Settings/profile works

### Admin Features (20 minutes)
- [ ] Dashboard loads with analytics
- [ ] All students list loads
- [ ] Register new student works
- [ ] Manage complaints works
- [ ] Approve/reject mess off works
- [ ] View AI analytics works
- [ ] Download reports works

### Super Admin Features (10 minutes)
- [ ] Dashboard loads
- [ ] All organizations visible
- [ ] Platform stats correct
- [ ] Subscription info visible

### Chatbot Features (10 minutes)
- [ ] Student commands work
- [ ] Admin commands work
- [ ] Super admin commands work
- [ ] Error handling works

### Multi-Tenancy (10 minutes)
- [ ] Data isolation verified
- [ ] Organization context correct
- [ ] Cross-org access prevented

---

## 📝 NOTES FOR TESTERS

### Before Each Test Session:
1. Clear browser cache and local storage
2. Ensure both servers are running
3. Use incognito mode for role switching tests

### Reporting Issues:
When reporting bugs, include:
- **Screenshot/Video** of the issue
- **Steps to reproduce** exactly
- **Expected vs Actual** behavior
- **Browser and version** used
- **Console errors** (if any)

### Browser Compatibility:
Test on:
- [ ] Google Chrome (latest)
- [ ] Mozilla Firefox (latest)
- [ ] Microsoft Edge (latest)
- [ ] Safari (if available)

---

## 🎯 QUICK REFERENCE COMMANDS

### Backend Commands
```powershell
# Start backend
cd "e:\6th_SEM\AI\8th sem major\latest complaint working\backend"
node index.js

# Check logs (if using nodemon)
nodemon index.js
```

### Frontend Commands
```powershell
# Start frontend
cd "e:\6th_SEM\AI\8th sem major\latest complaint working\client"
npm run dev

# Build for production test
npm run build
npm run preview
```

### Database Commands
```powershell
# Run seed scripts (if needed)
node seed-demo-data.js
node seed-comprehensive-data.js
```

---

**Happy Testing! 🚀**

*Generated for Hostel Ease SaaS - Production Testing*
