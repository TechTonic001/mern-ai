const axios = require('axios');
require('dotenv').config();

const elevenLabsClient = axios.create({
  baseURL: 'https://api.elevenlabs.io/v1',
  headers: {
    'xi-api-key': process.env.ELEVENLABS_API_KEY,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

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
    const statusCode = error.response?.status || 502;
    const detail = error.response?.data?.detail;
    const message = typeof detail === 'string' ? detail : detail?.message || error.message;
    const wrappedError = new Error(`ElevenLabs voices request failed: ${message}`);
    wrappedError.statusCode = statusCode;
    throw wrappedError;
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
    const statusCode = error.response?.status || 502;
    const detail = error.response?.data?.detail;
    const message = typeof detail === 'string' ? detail : detail?.message || error.message;
    const wrappedError = new Error(`ElevenLabs synthesis failed: ${message}`);
    wrappedError.statusCode = statusCode;
    throw wrappedError;
  }
};

module.exports = {
  getVoices,
  synthesize,
};