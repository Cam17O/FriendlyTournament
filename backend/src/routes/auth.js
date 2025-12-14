const express = require('express');
const passport = require('../config/passport');
const { register, login, getCurrentUser } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { generateToken } = require('../services/oauthService');

const router = express.Router();

// Email/Password routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getCurrentUser);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const token = generateToken(req.user.id);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

// Discord OAuth routes
router.get('/discord', passport.authenticate('discord'));
router.get(
  '/discord/callback',
  passport.authenticate('discord', { session: false }),
  (req, res) => {
    const token = generateToken(req.user.id);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

module.exports = router;

