const Bull = require('bull');
const mongoose = require('mongoose');
const TTVJob = require('../models/TTVJob');
const ttvService = require('../services/ttvService');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).catch((error) => {
  console.error('MongoDB worker connection error:', error);
});

const ttvQueue = new Bull('ttv-jobs', process.env.REDIS_URL || 'redis://localhost:6379');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let queueReady = true;

const processVideoJob = async (payload) => {
  const { ttvJobId, prompt, style, duration } = payload;
  const dbJob = await TTVJob.findById(ttvJobId);

  if (!dbJob) {
    throw new Error('TTV job record not found');
  }

  try {
    dbJob.status = 'processing';
    await dbJob.save();

    const providerJobId = await ttvService.submitJob({
      prompt: style ? `${prompt}\nStyle: ${style}` : prompt,
      duration,
    });
    dbJob.providerJobId = providerJobId;
    await dbJob.save();

    let attempts = 0;
    while (attempts < 60) {
      await sleep(5000);
      const result = await ttvService.pollJob(providerJobId);
      if (result.status === 'done') {
        dbJob.status = 'done';
        dbJob.videoUrl = result.videoUrl;
        dbJob.errorMessage = undefined;
        await dbJob.save();
        return;
      }
      if (result.status === 'failed') {
        throw new Error('Runway job failed');
      }
      attempts++;
    }

    throw new Error('Timed out after 5 minutes');
  } catch (err) {
    dbJob.status = 'failed';
    dbJob.errorMessage = err.message;
    await dbJob.save();
    throw err;
  }
};

const addJob = async (data) => {
  if (queueReady) {
    try {
      return await ttvQueue.add(data, { attempts: 3, backoff: 5000 });
    } catch (error) {
      queueReady = false;
      console.error('Redis queue unavailable, falling back to in-process worker:', error.message);
    }
  }

  processVideoJob(data).catch((error) => {
    console.error('In-process TTV job failed:', error.message);
  });

  return { id: `inline-${data.ttvJobId}` };
};

ttvQueue.on('error', (error) => {
  queueReady = false;
  console.error('Redis queue error:', error.message);
});

ttvQueue.process(async (job) => {
  await processVideoJob(job.data);
});

console.log('TTV Worker listening...');

module.exports = {
  addJob,
};