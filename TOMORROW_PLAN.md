# 📋 Tomorrow's Action Plan - Day 2
## Phase B: Controllers + SaaS Features

**Date**: January 5, 2026  
**Goal**: Complete multi-tenant backend + core SaaS features  
**Target**: Fully functional multi-tenant API

---

## ⏰ Schedule

### **Morning Session** (9 AM - 12 PM): Update Controllers
### **Afternoon Session** (2 PM - 5 PM): Build SaaS Features

---

## 🎯 Morning: Update 14 Controllers (3 hours)

**Strategy**: Systematic, controller by controller

### **Pattern for Each Controller**:
```javascript
// OLD (insecure - anyone can access anyone's data)
const complaints = await Complaint.find({ status: 'pending' });

// NEW (secure - only this organization's data)
const complaints = await Complaint.find({ 
  organizationId: req.organizationId,  // From tenant middleware
  status: 'pending' 
});
```

---

### **Controller 1: adminController.js** (20 minutes)

**Changes Needed**:
1. `registerAdmin` - Add organizationId when creating
2. `updateAdmin` - Filter by organizationId
3. `getAdmin` - Filter by organizationId
4. `getHostel` - Filter by organizationId
5. `deleteAdmin` - Filter by organizationId

**Example**:
```javascript
// Update registerAdmin
const admin = new Admin({
  organizationId: req.organizationId,  // ADD THIS
  name,
  email,
  // ... rest of fields
});

const user = new User({
  organizationId: req.organizationId,  // ADD THIS
  email,
  password: hashedPassword,
  role: 'org_admin',  // UPDATE THIS
  isAdmin: true
});
```

---

### **Controller 2: studentController.js** (20 minutes)

**Changes Needed**:
1. Filter all queries by `organizationId`
2. Add organizationId when creating students
3. Update search/filter to be org-scoped

**Example**:
```javascript
// Get all students
const students = await Student.find({ 
  organizationId: req.organizationId 
});

// Create student
const student = new Student({
  organizationId: req.organizationId,
  cms_id,
  // ... rest
});
```

---

### **Controller 3: complaintController.js** (20 minutes)

**Changes Needed**:
1. Filter complaints by organizationId
2. Add organizationId when creating complaints
3. Update stats/analytics to be org-scoped

---

### **Controllers 4-14** (20 minutes each):

4. ✅ **suggestionController** - Filter suggestions
5. ✅ **messoffController** - Filter mess-off requests
6. ✅ **attendanceController** - Filter attendance
7. ✅ **invoiceController** - Filter invoices
8. ✅ **requestController** - Filter leave requests
9. ✅ **noticeController** - Filter notices
10. ✅ **chatbotController** - Filter chat logs (IMPORTANT)
11. ✅ **faqController** - Org-specific or shared FAQs
12. ✅ **analyticsController** - Org-scoped analytics
13. ✅ **dashboardController** - Org-scoped dashboard
14. ✅ **exportController** - Export org data only

---

## 🚀 Afternoon: Build SaaS Features (3 hours)

### **Feature 1: Email Service** (45 minutes)

**File**: `backend/services/emailService.js`

**What to Build**:
```javascript
class EmailService {
  // Welcome email when org signs up
  async sendWelcome(organization, admin);
  
  // Renewal alerts
  async sendRenewalAlert(organization, daysLeft);
  
  // Password reset
  async sendPasswordReset(user, resetToken);
  
  // Payment confirmation
  async sendPaymentConfirmation(organization, payment);
  
  // Trial expiry warning
  async sendTrialExpiring(organization, daysLeft);
}
```

**Templates**:
- `templates/welcome.html`
- `templates/renewal-alert.html`
- `templates/password-reset.html`
- `templates/payment-confirmation.html`

**Libraries**: 
- nodemailer (for Gmail SMTP)
- OR SendGrid SDK (recommended)

---

### **Feature 2: Notification Manager** (45 minutes)

**File**: `backend/services/notificationService.js`

**What to Build**:
```javascript
class NotificationService {
  // Send any type of notification
  async send(type, data);
  
  // Organization signed up
  async onOrganizationSignup(organization);
  
  // Subscription renewing soon
  async  onRenewalDue(organization, daysLeft);
  
  // Payment received
  async onPaymentReceived(organization, payment);
  
  // High-priority complaint
  async onCriticalComplaint(complaint);
}
```

**Model**: `backend/models/NotificationLog.js`
```javascript
{
  organizationId,
  type: 'welcome_email',
  recipient: 'admin@example.com',
  status: 'sent' | 'failed',
  sentAt: Date,
  error: String
}
```

---

### **Feature 3: Renewal Calendar** (1 hour)

**File**: `backend/controllers/renewalController.js`

**Endpoints**:
```javascript
// GET /api/renewals - List upcoming renewals
// GET /api/renewals/:id - Get renewal details
// POST /api/renewals/check - Check renewals and send alerts
```

**Model**: `backend/models/Renewal.js`
```javascript
{
  organizationId,
  type: 'subscription' | 'trial',
  renewalDate: Date,
  plan: String,
  amount: Number,
  status: 'upcoming' | 'due' | 'overdue' | 'completed',
  alertsSent: {
    day30: Boolean,
    day15: Boolean,
    day7: Boolean,
    day1: Boolean
  },
  lastAlertAt: Date
}
```

**Features**:
- Daily cron job to check renewals
- Auto-send alerts at 30/15/7/1 days
- Dashboard widget showing upcoming renewals
- Admin can manually trigger reminders

---

### **Feature 4: Scheduled Tasks** (30 minutes)

**File**: `backend/utils/scheduler.js`

**Using**: `node-cron`

**Tasks**:
```javascript
// Daily at 9 AM - Check renewals
cron.schedule('0 9 * * *', async () => {
  await checkRenewals();
});

// Weekly Monday 10 AM - Send analytics report
cron.schedule('0 10 * * 1', async () => {
  await sendWeeklyReports();
});

// Monthly 1st day - Generate invoices
cron.schedule('0 0 1 * *', async () => {
  await generateMonthlyInvoices();
});
```

**Functions**:
- `checkRenewals()` - Find renewals in next 30 days
- `sendWeeklyReports()` - Email usage stats to org admins
- `generateMonthlyInvoices()` - Create invoices for all orgs

---

## 📦 Dependencies to Install

```bash
cd backend

# For emails
npm install nodemailer
# OR
npm install @sendgrid/mail

# For scheduling
npm install node-cron

# For templates
npm install handlebars
```

---

## ✅ Testing Checklist

### **After Controller Updates**:
- [ ] Create 2 test organizations
- [ ] Login as each organization
- [ ] Verify you only see your org's data
- [ ] Try to access other org's data (should fail)
- [ ] Test all CRUD operations
- [ ] Check database queries include organizationId

### **After SaaS Features**:
- [ ] Send test welcome email
- [ ] Trigger renewal alert
- [ ] Check notification logs
- [ ] Verify cron jobs run
- [ ] Test email templates

---

## 🐛 Common Issues & Solutions

### **Issue 1: Controllers query without organizationId**
**Solution**: Always filter queries:
```javascript
// WRONG
Student.find({ batch: '2024' })

// RIGHT
Student.find({ 
  organizationId: req.organizationId,
  batch: '2024' 
})
```

### **Issue 2: Missing organizationId in req**
**Solution**: Apply tenant middleware to route:
```javascript
router.get('/students', 
  auth,           // Verify JWT
  tenantMiddleware,  // Extract organizationId
  getStudents     // Your controller
);
```

### **Issue 3: Email not sending**
**Solution**: Check .env variables:
```
EMAIL_FROM=noreply@hostels.com
SENDGRID_API_KEY=your_key_here
```

---

## 📊 Success Metrics for Day 2

**Controllers**:
- ✅ All 14 controllers updated
- ✅ All queries filter by organizationId
- ✅ Test with 2 organizations - data isolated

**SaaS Features**:
- ✅ Welcome email sends successfully
- ✅ Renewal alerts working
- ✅ Cron jobs scheduled
- ✅ Notification logs created

**Testing**:
- ✅ Multi-org data isolation verified
- ✅ No data leakage between orgs
- ✅ Feature gates working
- ✅ Usage limits enforced

---

## 🎯 End of Day 2 Goal

**Backend Status**: ✅ **Production-Ready Multi-Tenant API**

Features:
- ✅ Complete data isolation
- ✅ Organization management
- ✅ Subscription enforcement
- ✅ Email notifications
- ✅ Renewal tracking
- ✅ Automated tasks

**Next (Day ): Frontend updates + Testing**

---

## 💡 Pro Tips

1. **Work Systematically**: One controller at a time
2. **Test As You Go**: Don't wait until all done
3. **Copy-Paste Pattern**: Use same organizationId filter everywhere
4. **Keep Server Running**: nodemon will auto-restart
5. **Check Logs**: Watch for MongoDB query errors
6. **Commit Often**: Git commit after each controller

---

## 📝 Quick Reference Commands

```bash
# Start backend
cd backend && npm run dev

# Test endpoints
# (Use Postman or Thunder Client)

# Check database
# Use MongoDB Compass

# View logs
# Terminal where server is running
```

---

## ⏱️ Time Breakdown

| Task | Time | Priority |
|------|------|----------|
| Update controllers | 3 hours | 🔴 Critical |
| Email service | 45 min | 🟡 High |
| Notification manager | 45 min | 🟡 High |
| Renewal calendar | 1 hour | 🟡 High |
| Scheduled tasks | 30 min | 🟢 Medium |
| Testing | 30 min | 🔴 Critical |
| **Total** | **6.5 hours** | |

---

## 🚀 Let's Make It Happen!

**Remember**:
- Phase A foundation is SOLID ✅
- Controllers are straightforward
- SaaS features are exciting
- You're building something valuable

**Tomorrow evening**: Fully functional multi-tenant SaaS backend! 🎉

---

**Created**: January 4, 2026, 3:30 PM
**Status**: Ready to execute  
**Confidence**: 95% 🚀

Let's build! 💪
