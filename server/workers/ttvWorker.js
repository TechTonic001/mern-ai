require('../config/env');

const TTVJob = require('../models/TTVJob');
const ttvService = require('../services/ttvService');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
        throw new Error(result.failure || 'Runway job failed');
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
  setImmediate(() => {
    processVideoJob(data).catch((error) => {
      console.error('TTV job failed:', error.message);
    });
  });

  return { id: `inline-${data.ttvJobId}` };
};

console.log('TTV worker ready (in-process, no Redis required)');

module.exports = {
  addJob,
};
