const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) => jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const toPublicUser = (user) => ({
  id: user._id,
  email: user.email,
  plan: user.plan,
  ttsCredits: user.ttsCredits,
  ttvCredits: user.ttvCredits,
});

router.post('/register', [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    if (await User.findOne({ email })) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = await User.create({ email, passwordHash: password });
    const token = signToken(user);
    res.status(201).json({ token, user: toPublicUser(user) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/login', [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user);
    res.json({ token, user: toPublicUser(user) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;