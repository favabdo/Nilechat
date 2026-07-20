import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedBackground from '../../../components/shared/AnimatedBackground';
import useAuthStore from '../../../store/authStore';
import { login } from '../services/auth.service';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { token, user, setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // لو المستخدم مسجل دخول بالفعل، نوديه على الداشبورد على طول من غير ما نعرض فورم الدخول
  useEffect(() => {
    if (token && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [token, user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email.trim(), password);
      setAuth(data.token, data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'مش قادر نوصل للسيرفر، تأكد من الإنترنت وحاول تاني');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AnimatedBackground />
      <div className="page-center">
        <div className="login-card">
          <img src="/assets/logo.png" alt="NileChat" className="login-logo" />
          <h1>تسجيل الدخول</h1>
          <div className="subtitle">أهلاً بيك في لوحة تحكم NileChat، سجّل دخولك بإيميلك وكلمة السر</div>

          <form id="login-form" autoComplete="on" onSubmit={handleSubmit}>
            <div className="field-wrap">
              <label className="field-label" htmlFor="login-email">
                Email
              </label>
              <input
                type="email"
                className="login-input"
                id="login-email"
                placeholder="agent@example.com"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field-wrap">
              <label className="field-label" htmlFor="login-password">
                Password
              </label>
              <input
                type="password"
                className="login-input"
                id="login-password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className={`login-btn${loading ? ' loading' : ''}`} id="login-btn" disabled={loading}>
              <span className="spinner"></span>
              <span className="btn-text">تسجيل الدخول</span>
            </button>

            <div className="login-error" id="login-error">
              {error}
            </div>
          </form>

          <div className="app-footer">Copyright © Nile Techno Designed by Abdullah Elsawy 2026</div>
        </div>
      </div>
    </>
  );
}
