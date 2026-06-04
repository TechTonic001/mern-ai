const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const TTVJob = require('../models/TTVJob');
const { addJob } = require('../workers/ttvWorker');
const User = require('../models/User');

router.post('/generate', auth, [
  body('prompt').isString().trim().notEmpty().withMessage('Prompt is required'),
  body('duration').optional().isInt({ min: 1, max: 60 }).withMessage('Duration must be between 1 and 60 seconds'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { prompt, style = 'cinematic', duration = 5 } = req.body;
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.ttvCredits <= 0) {
      return res.status(403).json({ error: 'No TTV credits remaining' });
    }

    const job = await TTVJob.create({ userId: req.userId, prompt, style, duration });
    await addJob({ ttvJobId: job._id.toString(), prompt, style, duration });
    user.ttvCredits -= 1;
    await user.save();
    res.status(202).json({ jobId: job._id, status: 'queued' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/status/:jobId', auth, async (req, res) => {
  try {
    const job = await TTVJob.findOne({ _id: req.params.jobId, userId: req.userId });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ status: job.status, videoUrl: job.videoUrl, errorMessage: job.errorMessage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const jobs = await TTVJob.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(20);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;