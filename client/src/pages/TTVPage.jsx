import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function TTVPage() {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(5);
  const [jobId, setJobId] = useState('');
  const [status, setStatus] = useState('idle');
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!jobId) {
      return undefined;
    }

    let active = true;

    async function pollStatus() {
      try {
        const response = await axios.get(`/api/ttv/status/${jobId}`);
        if (!active) {
          return;
        }

        setStatus(response.data.status);
        setVideoUrl(response.data.videoUrl || '');

        if (response.data.status === 'failed') {
          setError(response.data.errorMessage || 'Video generation failed');
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.response?.data?.error || 'Unable to fetch job status');
        }
      }
    }

    pollStatus();
    const intervalId = window.setInterval(pollStatus, 5000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [jobId]);

  async function handleGenerate(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setStatus('queued');
    setVideoUrl('');

    try {
      const response = await axios.post('/api/ttv/generate', {
        prompt,
        duration: Number(duration),
      });

      setJobId(response.data.jobId);
      setStatus(response.data.status);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to queue video job');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="workspace-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">RunwayML</p>
          <h1>Text to Video</h1>
        </div>
        <Link to="/dashboard">Back to dashboard</Link>
      </header>

      <section className="panel">
        <form className="stack-form" onSubmit={handleGenerate}>
          <label>
            Prompt
            <textarea
              rows="8"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe the scene you want to create"
              required
            />
          </label>

          <label>
            Duration
            <input
              type="number"
              min="1"
              max="20"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              required
            />
          </label>

          {error ? <div className="form-error">{error}</div> : null}

          <button type="submit" disabled={loading}>
            {loading ? 'Queueing...' : 'Generate video'}
          </button>
        </form>

        <div className="status-card">
          <p>Status: {status}</p>
          {videoUrl ? <video controls src={videoUrl} /> : null}
        </div>
      </section>
    </main>
  );
}
