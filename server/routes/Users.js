const express = require("express");
const router = express.Router();
const { Users } = require("../models");
const bcrypt = require("bcryptjs");
const { validateToken } = require("../middlewares/AuthMiddleware");
const { logViewOperation, logCreateOperation, logUpdateOperation, logDeleteOperation, logAuthEvent } = require("../middlewares/LoggingMiddleware");
const { sign } = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { Op } = require("sequelize");

// Email configuration - Multiple options
const getEmailTransporter = () => {
  const emailService = process.env.EMAIL_SERVICE || 'gmail';
  
  switch (emailService.toLowerCase()) {
    case 'sendgrid':
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      });
    
    case 'mailgun':
      return nodemailer.createTransport({
        service: 'Mailgun',
        auth: {
          user: process.env.MAILGUN_USERNAME,
          pass: process.env.MAILGUN_PASSWORD
        }
      });
    
    case 'smtp':
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    
    case 'gmail':
    default:
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'your-email@gmail.com',
          pass: process.env.EMAIL_PASS || 'your-app-password'
        }
      });
  }
};

const transporter = getEmailTransporter();

// Test email configuration
const testEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email server is ready to send messages');
    return true;
  } catch (error) {
    console.log('❌ Email server configuration error:', error.message);
    return false;
  }
};

// Test on startup
testEmailConfig();

// Generate User ID
const generateUserId = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `USR-${randomNum}`;
};

// Create new user (admin only)
router.post("/", validateToken, logCreateOperation("User"), async (req, res) => {
  try {
    const { username, email, firstName, lastName, phoneNumber, role } = req.body;

    if (!username || !email || !firstName || !lastName) {
      return res.status(400).json({ error: "Username, email, first name, and last name are required" });
    }

    // Generate user ID and password reset token
    const userId = generateUserId();
    const passwordResetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await Users.create({
      userId,
      username,
      email,
      firstName,
      lastName,
      phoneNumber: phoneNumber || null,
      role: role || "User",
      status: "Pending Password",
      passwordResetToken,
      passwordResetExpires,
      createdBy: req.user.username,
    });

    // Send email to user
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/setup-password?token=${passwordResetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: 'Welcome to Sacco Management System - Set Up Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Sacco Management System</h2>
          <p>Hello ${firstName} ${lastName},</p>
          <p>Your user account has been created successfully. To complete your registration, please set up your password by clicking the link below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Set Up Password</a>
          </div>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't request this account, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
        </div>
      `
    };

    // Send email with better error handling
    let emailSent = false;
    
    // Check if email is disabled
    if (process.env.EMAIL_DISABLED === 'true') {
      console.log('📧 Email feature is disabled');
      emailSent = false;
    } else {
      try {
        const emailResult = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', emailResult.messageId);
        emailSent = true;
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError.message);
        console.error('Email configuration check:');
        console.error('- EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'gmail');
        console.error('- EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
        console.error('- EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');
        console.error('- FRONTEND_URL:', process.env.FRONTEND_URL || 'Using default');
      }
    }
    
    res.status(201).json({ 
      message: emailSent 
        ? "User created successfully. Email sent with password setup instructions." 
        : "User created successfully. Email could not be sent - please check email configuration.",
      entity: {
        id: user.id,
        userId: user.userId,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status
      },
      emailSent: emailSent
    });
  } catch (error) {
    console.error("User creation error:", error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(409).json({ error: "Username or email already exists" });
    } else {
      res.status(500).json({ error: "Internal server error during user creation" });
    }
  }
});

// Get all users (admin only)
router.get("/", validateToken, logViewOperation("User"), async (req, res) => {
  try {
    const { status, q } = req.query;
    let whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (q) {
      whereClause[Op.or] = [
        { username: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } },
        { firstName: { [Op.like]: `%${q}%` } },
        { lastName: { [Op.like]: `%${q}%` } },
        { userId: { [Op.like]: `%${q}%` } }
      ];
    }

    const users = await Users.findAll({
      where: whereClause,
      attributes: { exclude: ['password', 'passwordResetToken'] },
      order: [['createdOn', 'DESC']]
    });

    res.json({ entity: users });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Internal server error while fetching users" });
  }
});

// Authentication endpoint - must be before /:id route
router.get("/auth", validateToken, logViewOperation("User"), async (req, res) => {
  try {
    // Verify the user still exists in the database
    const user = await Users.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'passwordResetToken'] }
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Return user info with additional fields
    res.json({
      id: user.id,
      userId: user.userId,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status
    });
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ error: "Internal server error during authentication" });
  }
});

// Get single user by ID
router.get("/:id", validateToken, logViewOperation("User"), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await Users.findByPk(id, {
      attributes: { exclude: ['password', 'passwordResetToken'] }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ entity: user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Internal server error while fetching user" });
  }
});

// Update user
router.put("/:id", validateToken, logUpdateOperation("User"), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, firstName, lastName, phoneNumber, role, status } = req.body;

    const user = await Users.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await user.update({
      username: username || user.username,
      email: email || user.email,
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      phoneNumber: phoneNumber !== undefined ? phoneNumber : user.phoneNumber,
      role: role || user.role,
      status: status || user.status,
      modifiedBy: req.user.username,
      modifiedOn: new Date()
    });

    res.json({ 
      message: "User updated successfully",
      entity: {
        id: user.id,
        userId: user.userId,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status
      }
    });
  } catch (error) {
    console.error("Update user error:", error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(409).json({ error: "Username or email already exists" });
    } else {
      res.status(500).json({ error: "Internal server error during user update" });
    }
  }
});

// Lock/Unlock user
router.put("/:id/lock", validateToken, logUpdateOperation("User"), async (req, res) => {
  try {
    const { id } = req.params;
    const { lockRemarks } = req.body;

    const user = await Users.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let newStatus, updateData;

    if (user.status === "Locked") {
      // Unlocking: restore previous status or default to Active
      newStatus = "Pending Password";
      updateData = {
        status: newStatus,
        lockedBy: null,
        lockedOn: null,
        lockRemarks: null,
        previousStatus: null,
        modifiedBy: req.user.username,
        modifiedOn: new Date()
      };
    } else {
      // Locking: save current status and set to Locked
      newStatus = "Locked";
      updateData = {
        status: newStatus,
        previousStatus: user.status,
        lockedBy: req.user.username,
        lockedOn: new Date(),
        lockRemarks: lockRemarks,
        modifiedBy: req.user.username,
        modifiedOn: new Date()
      };
    }
    
    await user.update(updateData);

    res.json({ 
      message: `User ${newStatus.toLowerCase()} successfully`,
      entity: {
        id: user.id,
        userId: user.userId,
        username: user.username,
        status: newStatus
      }
    });
  } catch (error) {
    console.error("Lock user error:", error);
    res.status(500).json({ error: "Internal server error during user lock operation" });
  }
});

// Approve user (maker-checker)
router.put("/:id/approve", validateToken, logUpdateOperation("User"), async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    const user = await Users.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.status !== "Pending") {
      return res.status(400).json({ error: "User is not in pending status for approval" });
    }

    const newStatus = action === "approve" ? "Active" : "Inactive";
    
    await user.update({
      status: newStatus,
      approvedBy: req.user.username,
      approvedOn: new Date(),
      modifiedBy: req.user.username,
      modifiedOn: new Date()
    });

    res.json({ 
      message: `User ${action}d successfully`,
      entity: {
        id: user.id,
        userId: user.userId,
        username: user.username,
        status: user.status
      }
    });
  } catch (error) {
    console.error("Approve user error:", error);
    res.status(500).json({ error: "Internal server error during user approval" });
  }
});

// Setup password for new users
router.post("/setup-password", logAuthEvent, async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({ error: "Token, password, and confirm password are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    const user = await Users.findOne({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    if (user.status !== "Pending Password") {
      return res.status(400).json({ error: "User has already set up password" });
    }

    const hash = await bcrypt.hash(password, 10);
    
    await user.update({
      password: hash,
      status: "Active",
      passwordResetToken: null,
      passwordResetExpires: null,
      modifiedBy: user.username,
      modifiedOn: new Date()
    });

    res.json({ message: "Password set up successfully. Your account is now active and you can log in." });
  } catch (error) {
    console.error("Setup password error:", error);
    res.status(500).json({ error: "Internal server error during password setup" });
  }
});

// Resend password setup email
router.post("/:id/resend-email", validateToken, logUpdateOperation("User"), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await Users.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Only allow resend email for Pending Password and Active users
    if (user.status !== "Pending Password" && user.status !== "Active") {
      return res.status(400).json({ error: "Resend email is only available for users with Pending Password or Active status" });
    }

    // Generate new password reset token
    const passwordResetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Determine the new status based on current status
    let newStatus;
    if (user.status === "Active") {
      newStatus = "Pending"; // Reset Active users to Pending
    } else {
      newStatus = "Pending Password"; // Keep Pending Password users as Pending Password
    }

    // Update user with new token and appropriate status
    await user.update({
      status: newStatus,
      passwordResetToken,
      passwordResetExpires,
      password: null, // Clear existing password
      modifiedBy: req.user.username,
      modifiedOn: new Date()
    });

    // Send email to user
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/setup-password?token=${passwordResetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'system@yoursacco.com',
      to: user.email,
      subject: 'Sacco Management System - Password Setup',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Sacco Management System</h2>
          <p>Hello ${user.firstName} ${user.lastName},</p>
          <p>Please set up your password for your user account by clicking the link below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Set Up Password</a>
          </div>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">This is an automated message from your Sacco Management System.</p>
        </div>
      `
    };

    // Send email with better error handling
    let emailSent = false;
    try {
      const emailResult = await transporter.sendMail(mailOptions);
      console.log('✅ Resend email sent successfully:', emailResult.messageId);
      emailSent = true;
    } catch (emailError) {
      console.error('❌ Resend email failed:', emailError.message);
    }

    res.json({ 
      message: emailSent 
        ? `Password setup email sent successfully. User has been reset to ${newStatus} status.` 
        : "Email could not be sent - please check email configuration.",
      emailSent: emailSent
    });
  } catch (error) {
    console.error("Resend email error:", error);
    res.status(500).json({ error: "Internal server error during email resend" });
  }
});

// Verify password setup token
router.get("/verify-token/:token", logViewOperation("User"), async (req, res) => {
  try {
    const { token } = req.params;

    const user = await Users.findOne({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { [Op.gt]: new Date() }
      },
      attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'status']
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    res.json({ 
      message: "Token is valid",
      entity: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error("Verify token error:", error);
    res.status(500).json({ error: "Internal server error during token verification" });
  }
});

router.post("/login", logAuthEvent, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const user = await Users.findOne({ where: { username: username } });

    if (!user) {
      return res.status(401).json({ error: "Sorry, This User Doesn't Exist" });
    }

    if (user.status === "Pending Password") {
      return res.status(401).json({ error: "Please set up your password first. Check your email for instructions." });
    }

    if (user.status === "Pending") {
      return res.status(401).json({ error: "Your account is pending approval. Please contact your administrator." });
    }

    if (user.status === "Locked") {
      return res.status(401).json({ error: "Your account has been locked. Please contact your administrator." });
    }

    if (user.status === "Inactive") {
      return res.status(401).json({ error: "Your account is inactive. Please contact your administrator." });
    }

    if (!user.password) {
      return res.status(401).json({ error: "Password not set. Please contact your administrator." });
    }

    const match = await bcrypt.compare(password, user.password);
    
    if (!match) {
      return res.status(401).json({ error: "Sorry, Wrong Username or Password " });
    }

    const accessToken = sign(
      { username: user.username, id: user.id, userId: user.userId, role: user.role },
      "importantsecret",
      { expiresIn: "30d" } // Token expires in 30 days
    );
    
    // Log the state data on successful login
    console.log("=== LOGIN SUCCESS - USER STATE DATA ===");
    console.log("User ID:", user.id);
    console.log("User ID (userId):", user.userId);
    console.log("Username:", user.username);
    console.log("Role:", user.role);
    console.log("Sacco ID:", user.saccoId || 'SYSTEM');
    console.log("Status:", user.status);
    console.log("Full user data:", JSON.stringify(user.dataValues, null, 2));
    console.log("Token payload:", JSON.stringify({ username: user.username, id: user.id, userId: user.userId, role: user.role }, null, 2));
    console.log("=== END LOGIN STATE DATA ===");
    
    res.json({ 
      token: accessToken, 
      username: username, 
      id: user.id,
      userId: user.userId,
      role: user.role,
      saccoId: user.saccoId || 'SYSTEM'
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error during login" });
  }
});

// Logout route
router.post("/logout", logAuthEvent, async (req, res) => {
  try {
    // For logout, we just need to log the event
    // The actual token invalidation would be handled on the client side
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error during logout" });
  }
});

router.get("/basicinfo/:id", logViewOperation("User"), async (req, res) => {
  try {
    const id = req.params.id;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "Sorry, Valid user ID is required" });
    }

    const basicInfo = await Users.findByPk(id, {
      attributes: { exclude: ["password"] },
    });

    if (!basicInfo) {
      return res.status(404).json({ error: "Sorry, User not found" });
    }

    res.json(basicInfo);
  } catch (error) {
    console.error("Basic info error:", error);
    res.status(500).json({ error: "Internal server error while fetching user info" });
  }
});

router.put("/changepassword", validateToken, logUpdateOperation("User"), async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Sorry, Old password and new password are required" });
    }

    const user = await Users.findOne({ where: { username: req.user.username } });

    if (!user) {
      return res.status(404).json({ error: "Sorry, User not found" });
    }

    const match = await bcrypt.compare(oldPassword, user.password);
    
    if (!match) {
      return res.status(401).json({ error: "Wrong Password Entered!" });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await Users.update(
      { password: hash },
      { where: { username: req.user.username } }
    );
    
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Internal server error during password change" });
  }
});

module.exports = router;
