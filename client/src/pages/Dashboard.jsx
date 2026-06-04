import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

async function fetchHistory(path) {
  const response = await axios.get(path);
  return response.data;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const { data: ttsHistory = [] } = useQuery({
    queryKey: ['tts-history'],
    queryFn: () => fetchHistory('/api/tts/history'),
  });

  const { data: ttvHistory = [] } = useQuery({
    queryKey: ['ttv-history'],
    queryFn: () => fetchHistory('/api/ttv/history'),
  });

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Connected workspace</p>
          <h1>Generate voice and video from one place.</h1>
          <p className="muted">Signed in as {user?.email || 'unknown'}</p>
        </div>
        <button type="button" className="secondary" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <section className="dashboard-grid">
        <article className="panel feature-panel">
          <h2>Text to Speech</h2>
          <p>Convert scripts into downloadable audio through ElevenLabs.</p>
          <Link to="/tts" className="primary-link">Open TTS</Link>
        </article>

        <article className="panel feature-panel">
          <h2>Text to Video</h2>
          <p>Queue a Runway video generation job and poll for completion.</p>
          <Link to="/ttv" className="primary-link">Open TTV</Link>
        </article>
      </section>

      <section className="dashboard-grid history-grid">
        <article className="panel">
          <h2>Recent TTS Jobs</h2>
          <ul className="history-list">
            {ttsHistory.map((job) => (
              <li key={job._id}>
                <strong>{job.voiceId}</strong>
                <span>{job.inputText}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h2>Recent TTV Jobs</h2>
          <ul className="history-list">
            {ttvHistory.map((job) => (
              <li key={job._id}>
                <strong>{job.status}</strong>
                <span>{job.prompt}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
