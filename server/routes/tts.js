const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const tts = require('../services/ttsService');
const TTSJob = require('../models/TTSJob');
const User = require('../models/User');

router.get('/voices', auth, async (req, res) => {
  try {
    const voices = await tts.getVoices();
    res.json(voices);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.post('/generate', auth, [
  body('text').isString().trim().notEmpty().withMessage('Text is required'),
  body('voiceId').isString().trim().notEmpty().withMessage('Voice ID is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text, voiceId, settings = {} } = req.body;
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.ttsCredits <= 0) {
      return res.status(403).json({ error: 'No TTS credits remaining' });
    }

    const buffer = await tts.synthesize({ text, voiceId, settings });
    const job = await TTSJob.create({ userId: req.userId, inputText: text, voiceId, settings });
    user.ttsCredits -= 1;
    await user.save();
    res.set({ 'Content-Type': 'audio/mpeg', 'X-Job-Id': job._id.toString() });
    res.send(buffer);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const jobs = await TTSJob.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(20);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;