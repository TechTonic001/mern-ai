const RunwayML = require('@runwayml/sdk');
const { requireEnv } = require('../config/env');
const localVideo = require('./localVideoService');

const client = new RunwayML({
  apiKey: requireEnv('RUNWAYML_API_SECRET'),
});

const clampDuration = (duration) => Math.min(10, Math.max(2, Number(duration) || 5));

const wrapRunwayError = (error) => {
  const wrappedError = new Error(error.message || 'Runway request failed');
  wrappedError.statusCode = error.status || 502;
  return wrappedError;
};

const shouldUseLocalFallback = (error) => {
  const message = (error.message || '').toLowerCase();
  return error.statusCode === 400
    || error.statusCode === 401
    || error.statusCode === 402
    || message.includes('not enough credits')
    || message.includes('promptimage');
};

const submitJob = async ({ prompt, duration = 5, ratio = '1280:720' }) => {
  try {
    const task = await client.textToVideo.create({
      model: 'gen4.5',
      promptText: prompt,
      duration: clampDuration(duration),
      ratio,
    });
    return { provider: 'runway', taskId: task.id };
  } catch (error) {
    const wrapped = wrapRunwayError(error);
    if (!shouldUseLocalFallback(wrapped)) {
      throw wrapped;
    }
    return { provider: 'local' };
  }
};

const pollJob = async (taskId) => {
  try {
    const task = await client.tasks.retrieve(taskId);
    const statusMap = {
      SUCCEEDED: 'done',
      FAILED: 'failed',
      PENDING: 'queued',
      THROTTLED: 'queued',
      RUNNING: 'processing',
      CANCELLED: 'failed',
    };
    return {
      status: statusMap[task.status] || 'processing',
      videoUrl: Array.isArray(task.output) ? task.output[0] : null,
      failure: task.failure || null,
    };
  } catch (error) {
    throw wrapRunwayError(error);
  }
};

const generateLocalVideo = async ({ jobId, prompt, duration, baseUrl }) => {
  await localVideo.createPromptVideo({ jobId, prompt, duration });
  return `${baseUrl}/media/${jobId}.mp4`;
};

module.exports = {
  submitJob,
  pollJob,
  generateLocalVideo,
};
