const axios = require('axios');
const { requireEnv } = require('../config/env');

const elevenLabsClient = axios.create({
  baseURL: 'https://api.elevenlabs.io/v1',
  headers: {
    'xi-api-key': requireEnv('ELEVENLABS_API_KEY'),
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

const parseElevenLabsError = (error) => {
  const statusCode = error.response?.status || 502;
  let detail = error.response?.data?.detail;

  if (!detail && error.response?.data) {
    try {
      const raw = Buffer.isBuffer(error.response.data)
        ? error.response.data.toString('utf8')
        : error.response.data;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      detail = parsed?.detail;
    } catch {
      // ignore JSON parse failures
    }
  }

  const message = typeof detail === 'string'
    ? detail
    : detail?.message || error.message;
  const wrappedError = new Error(message);
  wrappedError.statusCode = statusCode;
  return wrappedError;
};

const getVoiceSettings = (settings = {}) => ({
  stability: Number.isFinite(settings.stability) ? settings.stability : 0.5,
  similarity_boost: Number.isFinite(settings.similarityBoost) ? settings.similarityBoost : 0.75,
  style: Number.isFinite(settings.style) ? settings.style : 0,
  use_speaker_boost: settings.useSpeakerBoost ?? true,
});

const getVoices = async () => {
  try {
    const response = await elevenLabsClient.get('/voices');
    return response.data?.voices || [];
  } catch (error) {
    throw parseElevenLabsError(error);
  }
};

const synthesize = async ({ text, voiceId, settings = {} }) => {
  try {
    const response = await elevenLabsClient.post(
      `/text-to-speech/${voiceId}`,
      {
        text,
        model_id: settings.modelId || 'eleven_multilingual_v2',
        voice_settings: getVoiceSettings(settings),
      },
      {
        responseType: 'arraybuffer',
        headers: {
          Accept: 'audio/mpeg',
        },
      }
    );

    return Buffer.from(response.data);
  } catch (error) {
    throw parseElevenLabsError(error);
  }
};

module.exports = {
  getVoices,
  synthesize,
};
