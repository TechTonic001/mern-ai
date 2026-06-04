import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function TTSPage() {
  const [voices, setVoices] = useState([]);
  const [voiceId, setVoiceId] = useState('');
  const [text, setText] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadVoices() {
      try {
        const response = await axios.get('/api/tts/voices');
        const voiceList = response.data.voices || response.data || [];
        if (mounted) {
          setVoices(voiceList);
          setVoiceId(voiceList[0]?._id || voiceList[0]?.voice_id || voiceList[0]?.voiceId || '');
        }
      } catch (requestError) {
        if (mounted) {
          setError(requestError.response?.data?.error || 'Unable to load voices');
        }
      }
    }

    loadVoices();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  async function handleGenerate(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        '/api/tts/generate',
        { text, voiceId },
        { responseType: 'blob' }
      );

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      setAudioUrl(URL.createObjectURL(response.data));
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to generate audio');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="workspace-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">ElevenLabs</p>
          <h1>Text to Speech</h1>
        </div>
        <Link to="/dashboard">Back to dashboard</Link>
      </header>

      <section className="panel">
        <form className="stack-form" onSubmit={handleGenerate}>
          <label>
            Voice
            <select value={voiceId} onChange={(event) => setVoiceId(event.target.value)} required>
              {voices.map((voice) => {
                const value = voice._id || voice.voice_id || voice.voiceId;
                const label = voice.name || voice.voice_name || value;
                return (
                  <option key={value} value={value}>
                    {label}
                  </option>
                );
              })}
            </select>
          </label>

          <label>
            Script
            <textarea
              rows="8"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Enter the text you want to synthesize"
              required
            />
          </label>

          {error ? <div className="form-error">{error}</div> : null}

          <button type="submit" disabled={loading || !voiceId}>
            {loading ? 'Generating...' : 'Generate audio'}
          </button>
        </form>

        {audioUrl ? (
          <div className="media-preview">
            <audio controls src={audioUrl} />
          </div>
        ) : null}
      </section>
    </main>
  );
}
