const RunwayML = require('@runwayml/sdk');
require('dotenv').config();

const client = new RunwayML.default({
  apiKey: process.env.RUNWAYML_API_SECRET,
});

const submitJob = async ({ prompt, duration = 5, ratio = '1280:768' }) => {
  const task = await client.imageToVideo.create({
    model: 'gen3a_turbo',
    promptText: prompt,
    duration,
    ratio,
  });
  return task.id || task.taskId;
};

const pollJob = async (taskId) => {
  const task = await client.tasks.retrieve(taskId);
  const statusMap = {
    SUCCEEDED: 'done',
    FAILED: 'failed',
    PENDING: 'queued',
    RUNNING: 'processing',
  };
  return {
    status: statusMap[task.status] || 'processing',
    videoUrl: task.output?.[0] || task.output?.video || null,
  };
};

module.exports = {
  submitJob,
  pollJob,
};