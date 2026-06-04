const axios = require('axios');
const gTTS = require('gtts');
const { requireEnv } = require('../config/env');

const elevenLabsClient = axios.create({
  baseURL: 'https://api.elevenlabs.io/v1',
  headers: {
    'xi-api-key': requireEnv('ELEVENLABS_API_KEY'),
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

const FALLBACK_VOICES = [
  { voice_id: 'gtts-en', name: 'English (fallback)' },
  { voice_id: 'gtts-es', name: 'Spanish (fallback)' },
  { voice_id: 'gtts-fr', name: 'French (fallback)' },
];

const voiceLangMap = {
  'gtts-en': 'en',
  'gtts-es': 'es',
  'gtts-fr': 'fr',
};

const resolveLang = (voiceId) => voiceLangMap[voiceId] || 'en';

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

const shouldUseFallback = (error) => {
  const status = error.statusCode || error.response?.status;
  return status === 401 || status === 402 || status === 429;
};

const getVoiceSettings = (settings = {}) => ({
  stability: Number.isFinite(settings.stability) ? settings.stability : 0.5,
  similarity_boost: Number.isFinite(settings.similarityBoost) ? settings.similarityBoost : 0.75,
  style: Number.isFinite(settings.style) ? settings.style : 0,
  use_speaker_boost: settings.useSpeakerBoost ?? true,
});

const synthesizeWithGtts = (text, voiceId) => new Promise((resolve, reject) => {
  const lang = resolveLang(voiceId);
  const speech = new gTTS(text, lang);
  const stream = speech.stream();
  const chunks = [];

  stream.on('data', (chunk) => chunks.push(chunk));
  stream.on('end', () => resolve(Buffer.concat(chunks)));
  stream.on('error', reject);
});

const getVoices = async () => {
  try {
    const response = await elevenLabsClient.get('/voices');
    const voices = response.data?.voices || [];
    return voices.length ? voices : FALLBACK_VOICES;
  } catch (error) {
    if (shouldUseFallback(error)) {
      return FALLBACK_VOICES;
    }
    throw parseElevenLabsError(error);
  }
};

const synthesize = async ({ text, voiceId, settings = {} }) => {
  if (voiceId.startsWith('gtts-')) {
    return synthesizeWithGtts(text, voiceId);
  }

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
        headers: { Accept: 'audio/mpeg' },
      }
    );

    return Buffer.from(response.data);
  } catch (error) {
    const parsed = parseElevenLabsError(error);
    if (!shouldUseFallback(parsed)) {
      throw parsed;
    }
    return synthesizeWithGtts(text, voiceId);
  }
};

module.exports = {
  getVoices,
  synthesize,
};
