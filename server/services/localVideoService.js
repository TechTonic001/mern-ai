const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

ffmpeg.setFfmpegPath(ffmpegPath);

const generatedDir = path.join(__dirname, '..', 'generated');

const ensureDir = () => {
  if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
  }
};

const escapeDrawtext = (value) => value
  .replace(/\\/g, '\\\\')
  .replace(/:/g, '\\:')
  .replace(/'/g, "\\'");

const createPromptVideo = ({ jobId, prompt, duration = 5 }) => {
  ensureDir();
  const outputPath = path.join(generatedDir, `${jobId}.mp4`);
  const seconds = Math.min(10, Math.max(2, Number(duration) || 5));
  const label = escapeDrawtext(prompt.slice(0, 120));

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(`color=c=#0f172a:s=1280x720:d=${seconds}`)
      .inputOptions(['-f', 'lavfi'])
      .videoFilters([
        `drawtext=text='${label}':fontcolor=white:fontsize=28:x=(w-text_w)/2:y=(h-text_h)/2`,
      ])
      .outputOptions(['-pix_fmt', 'yuv420p', '-movflags', '+faststart'])
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .save(outputPath);
  });
};

const getPublicVideoUrl = (req, jobId) => {
  const host = process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`;
  return `${host}/media/${jobId}.mp4`;
};

module.exports = {
  createPromptVideo,
  getPublicVideoUrl,
  generatedDir,
};
