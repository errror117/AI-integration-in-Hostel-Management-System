const { generateToken, verifyToken } = require("../utils/auth");
const { validationResult } = require("express-validator");
const { Student, Hostel, User } = require("../models");
const Organization = require("../models/Organization");
const bcrypt = require("bcryptjs");
const Parser = require("json2csv").Parser;
const mongoose = require("mongoose");
const QRCode = require("qrcode");
const emailService = require("../services/emailService");

// Get statistics for students
const getStats = async (req, res) => {
  try {
    const organizationId = req.organizationId; // From tenant middleware

    // Handle case where organizationId is not set
    if (!organizationId) {
      return res.json({
        success: true,
        totalStudents: 0,
        hostels: [],
        byDept: [],
        stats: {
          total: 0,
          active: 0,
          inactive: 0,
          byHostel: [],
          byBatch: [],
          byDept: [],
        },
      });
    }

    const orgObjId = new mongoose.Types.ObjectId(organizationId);

    const [
      totalStudents,
      activeStudents,
      inactiveStudents,
      studentsByHostel,
      studentsByBatch,
      studentsByDept,
    ] = await Promise.all([
      Student.countDocuments({ organizationId: orgObjId }),
      Student.countDocuments({ organizationId: orgObjId, isActive: true }),
      Student.countDocuments({ organizationId: orgObjId, isActive: false }),

      Student.aggregate([
        { $match: { organizationId: orgObjId } },
        { $group: { _id: "$hostel", count: { $sum: 1 } } },
        { $lookup: { from: "hostels", localField: "_id", foreignField: "_id", as: "hostelInfo" } },
        { $unwind: { path: "$hostelInfo", preserveNullAndEmptyArrays: true } },
        { $project: { name: { $ifNull: ["$hostelInfo.name", "Unknown"] }, occupied: "$count", vacant: { $literal: 0 } } },
      ]),

      Student.aggregate([
        { $match: { organizationId: orgObjId } },
        { $group: { _id: "$batch", count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
      ]),

      Student.aggregate([
        { $match: { organizationId: orgObjId } },
        { $group: { _id: "$dept", count: { $sum: 1 } } },
      ]),
    ]);

    // Format hostel data for frontend charts
    const hostels = studentsByHostel.map(h => ({
      name: h.name || "Unknown",
      occupied: h.occupied || 0,
      vacant: h.vacant || 0
    }));

    res.json({
      success: true,
      totalStudents,
      hostels,
      byDept: studentsByDept,
      stats: {
        total: totalStudents,
        active: activeStudents,
        inactive: inactiveStudents,
        byHostel: studentsByHostel,
        byBatch: studentsByBatch,
        byDept: studentsByDept,
      },
    });
  } catch (err) {
    console.error("Get Stats Error:", err);
    res.status(500).json({ success: false, error: err.message || "Server error" });
  }
};

// Escape regex helper
const esc = (s) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");

// Resolve hostel by _id or name (case-insensitive)
const resolveHostel = async (hostelValue, organizationId) => {
  if (mongoose.Types.ObjectId.isValid(hostelValue)) {
    return await Hostel.findOne({ _id: hostelValue, organizationId });
  }
  return await Hostel.findOne({
    organizationId,
    name: new RegExp(`^${esc(hostelValue)}$`, "i"),
  });
};

const registerStudent = async (req, res) => {
  let success = false;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success, errors: errors.array() });
  }

  const organizationId = req.organizationId; // From tenant middleware

  const {
    name,
    cms_id,
    room_no,
    batch,
    dept,
    course,
    email,
    father_name,
    contact,
    address,
    dob,
    cnic,
    hostel,
    password,
  } = req.body;

  try {
    // Check if student already exists in THIS organization
    let student = await Student.findOne({ organizationId, cms_id });

    if (student) {
      return res
        .status(400)
        .json({ success, errors: [{ msg: "Student already exists in your organization" }] });
    }

    // Check if email already exists in THIS organization
    let existingUser = await User.findOne({ organizationId, email });
    if (existingUser) {
      return res.status(400).json({
        success,
        errors: [{ msg: "Email already registered in your organization" }],
      });
    }

    // Resolve hostel within organization
    let shostel = await resolveHostel(hostel, organizationId);
    if (!shostel) {
      return res.status(400).json({
        success,
        errors: [{ msg: "Invalid hostel name" }],
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with organizationId
    let user = new User({
      organizationId,
      email,
      password: hashedPassword,
      role: 'student',
      isAdmin: false,
    });

    await user.save();

    // Generate QR code
    const qrData = `CMS:${cms_id}, Name:${name}, Room:${room_no}, Hostel:${shostel.name}`;
    const qrImage = await QRCode.toDataURL(qrData);

    student = new Student({
      organizationId,
      name,
      cms_id,
      room_no,
      batch,
      dept,
      course,
      email,
      father_name,
      contact,
      address,
      dob,
      cnic,
      user: user._id,
      hostel: shostel._id,
      qrCode: qrImage,
    });

    await student.save();

    // Send welcome email (async, don't wait)
    const organization = await Organization.findById(organizationId);
    if (organization) {
      emailService.sendWelcomeEmail(student, organization, { password })
        .catch(err => console.error('Welcome email failed:', err.message));
    }

    success = true;
    return res.status(201).json({ success, student });
  } catch (err) {
    console.error("Register Student Error:", err.message);
    res.status(500).json({ success, errors: "Server error" });
  }
};

const getStudent = async (req, res) => {
  try {
    let success = false;

    // Check if user is authenticated (from tenantMiddleware)
    if (!req.userId) { // ✅ Changed: tenantMiddleware sets req.userId
      return res.status(401).json({ success, errors: "Authentication required" });
    }

    // Prevent admin from accessing this route
    if (req.userRole === 'org_admin' || req.userRole === 'super_admin') { // ✅ Changed: Check role from tenantMiddleware
      return res.status(403).json({ success, errors: "Admin cannot access this route" });
    }

    const organizationId = req.organizationId;

    // Student can only access their own data within their organization
    const student = await Student.findOne({
      organizationId,
      user: req.userId // ✅ Changed: Use req.userId from tenantMiddleware
    }).select("-password");

    if (!student) {
      return res.status(404).json({ success, errors: "Student does not exist" });
    }

    success = true;
    res.json({ success, student });
  } catch (err) {
    console.error('Get student error:', err);
    res.status(500).json({ success, errors: "Server error" });
  }
};

const getAllStudents = async (req, res) => {
  let success = false;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success, errors: errors.array() });
  }

  const organizationId = req.organizationId;
  let { hostel } = req.body;

  try {
    let query = { organizationId };

    // If hostel specified, filter by it (within organization)
    if (hostel) {
      const shostel = await resolveHostel(hostel, organizationId);
      if (!shostel) {
        return res
          .status(400)
          .json({ success, errors: [{ msg: "Invalid hostel" }] });
      }
      query.hostel = shostel._id;
    }

    const students = await Student.find(query).select("-password");

    success = true;
    res.json({ success, students, count: students.length });
  } catch (err) {
    console.error("Get All Students Error:", err);
    res.status(500).json({ success, errors: [{ msg: "Server error" }] });
  }
};

const updateStudent = async (req, res) => {
  try {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success, errors: errors.array() });
    }

    const organizationId = req.organizationId;
    const {
      cms_id,
      name,
      email,
      father_name,
      contact,
      address,
      dob,
      cnic,
      batch,
      dept,
      course,
      room_no,
    } = req.body;

    // Find student in THIS organization only
    let student = await Student.findOne({ organizationId, cms_id });

    if (!student) {
      return res
        .status(400)
        .json({ success, errors: [{ msg: "Student does not exist in your organization" }] });
    }

    // Update student fields
    student.name = name;
    student.email = email;
    student.father_name = father_name;
    student.contact = contact;
    student.address = address;
    student.dob = dob;
    student.cnic = cnic;
    student.batch = batch;
    student.dept = dept;
    student.course = course;
    student.room_no = room_no;

    await student.save();

    success = true;
    res.json({ success, student });
  } catch (err) {
    console.error("Update Student Error:", err);
    res.status(500).json({ success, errors: [{ msg: "Server error" }] });
  }
};

const deleteStudent = async (req, res) => {
  try {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success, errors: errors.array() });
    }

    const organizationId = req.organizationId;
    const { cms_id } = req.body;

    // Find student in THIS organization only
    let student = await Student.findOne({ organizationId, cms_id });

    if (!student) {
      return res
        .status(400)
        .json({ success, errors: [{ msg: "Student does not exist in your organization" }] });
    }

    const user = await User.findById(student.user);

    if (user) {
      await User.deleteOne({ _id: user._id });
    }

    await Student.deleteOne({ _id: student._id });

    success = true;
    res.json({ success, msg: "Student deleted successfully" });
  } catch (err) {
    console.error("Delete Student Error:", err);
    res.status(500).json({ success, errors: [{ msg: "Server error" }] });
  }
};

const csvStudent = async (req, res) => {
  try {
    const organizationId = req.organizationId;

    // Get all students for THIS organization only
    const students = await Student.find({ organizationId }).select("-password -qrCode");

    if (!students || students.length === 0) {
      return res.status(404).json({
        success: false,
        errors: [{ msg: "No students found in your organization" }],
      });
    }

    // Define CSV fields
    const fields = [
      "name",
      "cms_id",
      "email",
      "batch",
      "dept",
      "course",
      "room_no",
      "contact",
      "father_name",
      "cnic",
      "address",
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(students);

    res.header("Content-Type", "text/csv");
    res.attachment(`students_export_${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);
  } catch (err) {
    console.error("CSV Export Error:", err);
    res.status(500).json({ success: false, errors: [{ msg: "Server error" }] });
  }
};

module.exports = {
  registerStudent,
  getStudent,
  updateStudent,
  deleteStudent,
  getAllStudents,
  csvStudent,
  getStats,
};
