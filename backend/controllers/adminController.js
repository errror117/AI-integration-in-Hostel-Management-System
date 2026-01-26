const { generateToken, verifyToken } = require("../utils/auth");
const { validationResult } = require("express-validator");
const { Admin, User, Hostel } = require("../models");
const bcrypt = require("bcryptjs");

const registerAdmin = async (req, res) => {
  try {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success, errors: errors.array() });
    }

    const organizationId = req.organizationId; // From tenant middleware

    const {
      name,
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
      // Check if admin exists in THIS organization
      let admin = await Admin.findOne({ organizationId, email });

      if (admin) {
        return res
          .status(400)
          .json({ success, errors: [{ msg: "Admin already exists in your organization" }] });
      }

      // Check if user exists in THIS organization
      let existingUser = await User.findOne({ organizationId, email });
      if (existingUser) {
        return res.status(400).json({
          success,
          errors: [{ msg: "Email already registered in your organization" }],
        });
      }

      // Find hostel within organization
      let shostel = await Hostel.findOne({ organizationId, name: hostel });
      if (!shostel) {
        return res.status(400).json({
          success,
          errors: [{ msg: "Hostel not found in your organization" }],
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user with organization and role
      let user = new User({
        organizationId,
        email,
        password: hashedPassword,
        role: 'sub_admin', // Sub-admin role
        isAdmin: true,
      });

      await user.save();

      // Create admin profile
      admin = new Admin({
        organizationId,
        name,
        email,
        father_name,
        contact,
        address,
        dob,
        cnic,
        user: user._id,
        hostel: shostel._id,
      });

      await admin.save();

      // Generate token with organizationId and role
      const token = generateToken(user._id, user.organizationId, user.role, user.isAdmin);

      success = true;
      res.json({ success, token, admin });
    } catch (error) {
      console.error("Register Admin Error:", error);
      res.status(500).send("Server error");
    }
  } catch (err) {
    res.status(500).json({ success: false, errors: [{ msg: "Server error" }] });
  }
};

const updateAdmin = async (req, res) => {
  try {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success, errors: errors.array() });
    }

    const organizationId = req.organizationId;
    const { name, email, father_name, contact, address, dob, cnic } = req.body;

    try {
      // Find admin in THIS organization only
      let admin = await Admin.findOne({ organizationId, email });

      if (!admin) {
        return res
          .status(400)
          .json({ success, errors: [{ msg: "Admin does not exist in your organization" }] });
      }

      // Update admin fields
      admin.name = name;
      admin.email = email;
      admin.father_name = father_name;
      admin.contact = contact;
      admin.address = address;
      admin.dob = dob;
      admin.cnic = cnic;

      await admin.save();

      success = true;
      res.json({ success, admin });
    } catch (error) {
      console.error("Update Admin Error:", error);
      res.status(500).send("Server error");
    }
  } catch (err) {
    res.status(500).json({ success: false, errors: [{ msg: "Server error" }] });
  }
};

const getHostel = async (req, res) => {
  try {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success, errors: errors.array() });
    }

    // Get organizationId from JWT token (set by protect middleware)
    const organizationId = req.user?.organizationId;
    const { id } = req.body;

    if (!organizationId) {
      return res.status(400).json({ success, errors: [{ msg: "Organization context missing" }] });
    }

    // Find admin in THIS organization
    let admin = await Admin.findOne({ organizationId, _id: id });

    if (!admin) {
      return res
        .status(400)
        .json({ success, errors: [{ msg: "Admin does not exist in your organization" }] });
    }

    // Find hostel in THIS organization
    let hostel = await Hostel.findOne({ organizationId, _id: admin.hostel });

    if (!hostel) {
      return res
        .status(400)
        .json({ success, errors: [{ msg: "Hostel not found" }] });
    }

    success = true;
    res.json({ success, hostel });
  } catch (error) {
    console.error("Get Hostel Error:", error);
    res.status(500).send("Server error");
  }
};

const getAdmin = async (req, res) => {
  let success = false;
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success,
        errors: [{ msg: "No token, authorization denied" }],
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success,
        errors: [{ msg: "Invalid token" }],
      });
    }

    const organizationId = decoded.organizationId;

    // Find user in THIS organization
    const user = await User.findOne({
      _id: decoded.userId,
      organizationId
    });

    if (!user || !user.isAdmin) {
      return res.status(401).json({
        success,
        errors: [{ msg: "Not an admin user" }],
      });
    }

    // Find admin profile in THIS organization
    const admin = await Admin.findOne({
      organizationId,
      user: user._id
    }).select("-password");

    if (!admin) {
      return res.status(401).json({
        success,
        errors: [{ msg: "Admin profile not found" }],
      });
    }

    success = true;
    res.json({ success, admin });
  } catch (error) {
    console.error("Get Admin Error:", error.message);
    res.status(500).send("Server error");
  }
};

const deleteAdmin = async (req, res) => {
  try {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success, errors: errors.array() });
    }

    const organizationId = req.organizationId;
    const { email } = req.body;

    // Find admin in THIS organization only
    let admin = await Admin.findOne({ organizationId, email });

    if (!admin) {
      return res
        .status(400)
        .json({ success, errors: [{ msg: "Admin does not exist in your organization" }] });
    }

    // Find and delete associated user
    const user = await User.findOne({ _id: admin.user, organizationId });

    if (user) {
      await User.deleteOne({ _id: user._id });
    }

    await Admin.deleteOne({ _id: admin._id });

    success = true;
    res.json({ success, msg: "Admin deleted successfully" });
  } catch (error) {
    console.error("Delete Admin Error:", error);
    res.status(500).send("Server error");
  }
};

module.exports = {
  registerAdmin,
  updateAdmin,
  getAdmin,
  getHostel,
  deleteAdmin,
};
