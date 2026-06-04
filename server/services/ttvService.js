const RunwayML = require('@runwayml/sdk');
const { requireEnv } = require('../config/env');

const client = new RunwayML({
  apiKey: requireEnv('RUNWAYML_API_SECRET'),
});

const clampDuration = (duration) => Math.min(10, Math.max(2, Number(duration) || 5));

const wrapRunwayError = (error) => {
  const wrappedError = new Error(error.message || 'Runway request failed');
  wrappedError.statusCode = error.status || 502;
  return wrappedError;
};

const submitJob = async ({ prompt, duration = 5, ratio = '1280:720' }) => {
  try {
    const task = await client.textToVideo.create({
      model: 'gen4.5',
      promptText: prompt,
      duration: clampDuration(duration),
      ratio,
    });
    return task.id;
  } catch (error) {
    throw wrapRunwayError(error);
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

module.exports = {
  submitJob,
  pollJob,
};
