# LOGIN CREDENTIALS FOR ALL USERS

## STUDENTS

### Student 1
- **Email**: `kunal.pillai20000@mu.edu`
- **Password**: `student123`
- **Role**: student
- **Status**: Active

---

## ADMIN ACCOUNTS

### Hostel Admin
- **Email**: `admin@hostel.com`
- **Password**: `admin123`
- **Role**: admin
- **isAdmin**: true

---

## SUPER ADMIN

### Super Admin
- **Email**: `superadmin@system.com`
- **Password**: `superadmin123`
- **Role**: admin
- **isAdmin**: true

---

## ORGANIZATIONS

### Organization 1
- **Email**: `org1@company.com`
- **Password**: `org123`
- **Role**: organization

### Organization 2
- **Email**: `org2@company.com`
- **Password**: `org123`
- **Role**: organization

---

## TEST INSTRUCTIONS

1. **For Student Login**: 
   - Go to: `http://localhost:5173/auth/login`
   - Use credentials from STUDENTS section

2. **For Admin Login**:
   - Go to: `http://localhost:5173/auth/admin-login`
   - Use credentials from ADMIN or SUPER ADMIN section

3. **For Organization Login**:
   - Go to: `http://localhost:5173/auth/org-login` (if it exists)
   - Use credentials from ORGANIZATIONS section

---

## NOTES

- All passwords are hashed in the database using bcrypt
- The frontend email validation has been fixed to accept emails with numbers
- If any login fails, I can create new accounts with fresh credentials
- Check the backend console for detailed login attempt logs

---

## IF LOGIN FAILS

If you encounter login errors, let me know which account type failed and I will:
1. Check if the account exists in database
2. Reset the password
3. Or create a new account with working credentials
