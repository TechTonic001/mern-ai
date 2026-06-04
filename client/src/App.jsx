import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import TTSPage from './pages/TTSPage.jsx';
import TTVPage from './pages/TTVPage.jsx';

export default function App() {
	return (
		<div className="app-shell">
			<Routes>
				<Route path="/login" element={<AuthPage mode="login" />} />
				<Route path="/register" element={<AuthPage mode="register" />} />

				<Route element={<ProtectedRoute />}>
					<Route path="/" element={<Navigate to="/dashboard" replace />} />
					<Route path="/dashboard" element={<Dashboard />} />
					<Route path="/tts" element={<TTSPage />} />
					<Route path="/ttv" element={<TTVPage />} />
				</Route>

				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</div>
	);
}
