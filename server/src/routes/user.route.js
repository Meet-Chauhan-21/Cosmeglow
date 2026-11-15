const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { 
  registerUser, 
  loginUser, 
  logoutUser, 
  refreshAccessToken, 
  googleSignIn,
  facebookSignIn,
  facebookRegister,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  sendPhoneOtp,
  verifyPhoneOtp,
  completePhoneOnboarding
} = require('../controller/user/auth.controller');

const {
  getUserProfile,
  updateUserProfile
} = require('../controller/user/profile.controller');

const {
  addUserAddress,
  updateUserAddress,
  deleteUserAddress
} = require('../controller/user/address.controller');
const { verifyJWT, authorizeRoles } = require('../middleware/auth.middleware');

// Rate limiting configuration for Google Login (max 10 requests per 15 minutes)
const googleRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting configuration for Phone OTP (max 20 requests per 15 minutes)
const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many OTP attempts. Please wait a few minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logoutUser); // Clear cookie and invalidate session
router.post('/send-phone-otp', otpRateLimiter, sendPhoneOtp);
router.post('/verify-phone-otp', verifyPhoneOtp);
router.post('/complete-phone-onboarding', completePhoneOnboarding);
router.post('/google', googleRateLimiter, googleSignIn);
router.post('/facebook', googleRateLimiter, facebookSignIn);
router.post('/facebook-register', googleRateLimiter, facebookRegister);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/contact-us', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required.' });
    }
    const Notification = require('../models/notification.model');
    await Notification.create({
      type: 'contact_submit',
      title: 'New Contact Inquiry',
      message: `${name} (${email}) sent: "${message.substring(0, 60)}${message.length > 60 ? '...' : ''}"`,
      link: '/admin'
    });
    return res.status(201).json({ message: 'Contact inquiry registered successfully.' });
  } catch (error) {
    console.error('Contact submit error:', error);
    return res.status(500).json({ message: 'Server error. Submission failed.' });
  }
});

// Protected routes (User & Admin)
router.get('/profile', verifyJWT, getUserProfile);
router.put('/profile', verifyJWT, updateUserProfile);

// Address CRUD routes
router.post('/addresses', verifyJWT, addUserAddress);
router.put('/addresses/:addressId', verifyJWT, updateUserAddress);
router.delete('/addresses/:addressId', verifyJWT, deleteUserAddress);

// Admin-only test route
router.get('/admin-only', verifyJWT, authorizeRoles('admin'), (req, res) => {
  res.status(200).json({
    message: 'Welcome Admin! You have access to this restricted admin resource.',
    admin: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email
    }
  });
});

module.exports = router;
