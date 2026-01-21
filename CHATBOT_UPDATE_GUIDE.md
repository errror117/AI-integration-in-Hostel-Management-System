# 🔧 ChatbotController Multi-Tenancy Update Guide

**Status**: CRITICAL UPDATE NEEDED  
**File**: `backend/controllers/chatbotController.js`  
**Lines**: 1,017  
**Complexity**: HIGH

---

## 🎯 Required Changes

### **1. Add organizationId Parameter** (Line ~59)

**In `exports.processMessage`**, extract organizationId:

```javascript
exports.processMessage = async (req, res) =>{
    const startTime = Date.now();
    try {
        const { query, role } = req.body;
        const userId = req.user && req.user.id ? req.user.id : null;
        const organizationId = req.organizationId; // ADD THIS - from tenant middleware
        
        // ... rest of code
```

### **2. Update ConversationState Queries** (Multiple locations)

**Before**:
```javascript
conversation = await ConversationState.findOne({ user: userId });
```

**After**:
```javascript
conversation = await ConversationState.findOne({ organizationId, user: userId });
```

**Locations**:
- Line ~42 (admin conversation)
- Line ~41 (student conversation)
- Line ~53 (cancel flow)
- Line ~74 (switch intent)

### **3. Update createConversation Function** (Line ~207)

**Before**:
```javascript
async function createConversation(userId, intent, step, data) {
    const conversation = new ConversationState({
        user: userId,
        intent,
        step,
        data
    });
```

**After**:
```javascript
async function createConversation(userId, organizationId, intent, step, data) {
    const conversation = new ConversationState({
        organizationId,  // ADD THIS
        user: userId,
        intent,
        step,
        data
    });
```

### **4. Update All createConversation Calls**

Add `organizationId` parameter to ALL calls:

```javascript
// Before
await createConversation(userId, 'REGISTER_COMPLAINT', 1, { description: query });

// After
await createConversation(userId, organizationId, 'REGISTER_COMPLAINT', 1, { description: query });
```

**Search for**: `createConversation(userId,` 
**Replace with**: `createConversation(userId, organizationId,`

### **5. Update logChatInteraction** (Line ~408)

**Before**:
```javascript
async function logChatInteraction(userId, role, query, intent, confidence, entities, response) {
    try {
        const log = new ChatLog({ user: userId, role, query, intent, confidence, response, timestamp: new Date() });
        await log.save();
    } catch (e) { }
}
```

**After**:
```javascript
async function logChatInteraction(userId, organizationId, role, query, intent, confidence, entities, response) {
    try {
        const log = new ChatLog({ 
            organizationId,  // ADD THIS
            user: userId, 
            role, 
            query, 
            intent, 
            confidence, 
            response, 
            timestamp: new Date() 
        });
        await log.save();
    } catch (e) { }
}
```

### **6. Update All logChatInteraction Calls**

Add `organizationId` parameter:

```javascript
// Before
await logChatInteraction(userId, role, query, intent, confidence, {}, response);

// After
await logChatInteraction(userId, organizationId, role, query, intent, confidence, {}, response);
```

### **7. Update Database Queries in handleSingleTurnIntent** (Line ~348)

All Student, Complaint, Suggestion queries need organizationId filter:

```javascript
// GET MESS SCHEDULE
case 'GET_MESS_SCHEDULE':
    const meals = await Mess.find({ organizationId }).sort({ date: -1 }).limit(7);
    
// REGISTER_COMPLAINT  
case 'REGISTER_COMPLAINT':
    const student = await Student.findOne({ organizationId, user: userId });
    const newComplaint = new Complaint({
        organizationId,  // ADD THIS
        student: student._id,
        // ... rest
    });
    
// SUBMIT_SUGGESTION
case 'SUBMIT_SUGGESTION':
    const student = await Student.findOne({ organizationId, user: userId });
    const newSuggestion = new Suggestion({
        organizationId,  // ADD THIS
        student: student._id,
        // ... rest
    });
```

### **8. Update handleAdminQuery** (Line ~595)

**ALL database queries need organizationId filter**:

```javascript
// ADMIN_SUMMARY
case 'ADMIN_SUMMARY':
    const totalStudents = await Student.countDocuments({ organizationId });
    const totalComplaints = await Complaint.countDocuments({ organizationId });
    const pendingComplaints = await Complaint.countDocuments({ organizationId, status: 'pending' });
    // ... etc

// ADMIN_DOWNLOAD
case 'ADMIN_DOWNLOAD':
    const allStudents = await Student.find({ organizationId });
    const allComplaints = await Complaint.find({ organizationId });
    // ... etc

// ADMIN_COMPLAINTS
case 'ADMIN_COMPLAINTS':
    const complaints = await Complaint.find({ organizationId }).sort({ date: -1 }).limit(10);
    // ... etc
```

### **9. Update FAQEmbedding Queries**

FAQs can be shared OR organization-specific:

```javascript
// Before
const faqs = await FAQEmbedding.find({ category, isActive: true });

// After
const faqs = await FAQEmbedding.find({ 
    $or: [
        { organizationId: null },  // Shared FAQs
        { organizationId }  // Organization-specific
    ],
    category, 
    isActive: true 
});
```

---

## 📝 **Critical Function Signatures to Update**

### **Functions that need organizationId parameter**:

1. `createConversation(userId, organizationId, intent, step, data)`
2. `logChatInteraction(userId, organizationId, role, query, intent, confidence, entities, response)`
3. `handleMultiTurnFlow(conversation, query, userId, organizationId)` 
4. `handleSingleTurnIntent(intent, entities, userId, organizationId, role, query)`
5. `handleAdminQuery(query, userId, organizationId)`
6. `handleAdminConversation(conversation, query, userId, organizationId)`

---

## 🔍 **Search & Replace Patterns**

### **Pattern 1: Student Queries**
**Find**: `Student.find({`  
**Replace**: `Student.find({ organizationId,`

**Find**: `Student.findOne({`  
**Replace**: `Student.findOne({ organizationId,`

### **Pattern 2: Complaint Queries**
**Find**: `Complaint.find({`  
**Replace**: `Complaint.find({ organizationId,`

**Find**: `Complaint.countDocuments({`  
**Replace**: `Complaint.countDocuments({ organizationId,`

### **Pattern 3: Other Models**
Apply same pattern to:
- Suggestion
- MessOff  
- Attendance
- Invoice
- Notice
- Mess
- Hostel

---

## ⚠️ **IMPORTANT NOTES**

1. **Pass organizationId through ALL function calls**
2. **Filter ALL database queries** (no exceptions!)
3. **Update both admin and student flows**
4. **Test FAQs carefully** (shared vs org-specific)

---

## ✅ **Verification Checklist**

After updating:
- [ ] All Student queries have organizationId
- [ ] All Complaint queries have organizationId
- [ ] All Suggestion queries have organizationId
- [ ] ConversationState queries scoped
- [ ] ChatLog creation includes organizationId
- [ ] createConversation signature updated
- [ ] logChatInteraction signature updated
- [ ] All function calls pass organizationId
- [ ] Admin queries filtered by org
- [ ] FAQ queries handle shared FAQs

---

## 🚀 **Estimated Impact**

- **Lines to modify**: ~50-60 locations
- **Functions to update**: 8 major functions
- **Risk**: Medium (but critical for security!)
- **Testing needed**: HIGH

---

**This is a complex update but CRITICAL for multi-tenancy!**

Without these changes, users from different organizations could see each other's:
- Complaints
- Chat history
- Student data
- Mess schedules
- Analytics

---

**Status**: ⏳ **READY TO IMPLEMENT**
