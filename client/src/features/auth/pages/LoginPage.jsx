import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Languages } from 'lucide-react';
import AnimatedBackground from '../../../components/shared/AnimatedBackground';
import useAuthStore from '../../../store/authStore';
import useTranslation from '../../../i18n/useTranslation';
import { login } from '../services/auth.service';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { token, user, setAuth } = useAuthStore();
  const { t, lang, toggleLang } = useTranslation();

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
      setError(err.response?.data?.error || t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AnimatedBackground />
      <button
        type="button"
        onClick={toggleLang}
        title={lang === 'ar' ? t('language.toggleToEnglish') : t('language.toggleToArabic')}
        style={{
          position: 'fixed',
          top: 18,
          insetInlineEnd: 18,
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          borderRadius: 10,
          border: '1px solid var(--border)',
          background: 'var(--card)',
          color: 'var(--text)',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <Languages size={16} /> {t('language.short')}
      </button>
      <div className="page-center">
        <div className="login-card">
          <img src="/assets/logo.png" alt="NileChat" className="login-logo" />
          <h1>{t('auth.loginTitle')}</h1>
          <div className="subtitle">{t('auth.loginSubtitle')}</div>

          <form id="login-form" autoComplete="on" onSubmit={handleSubmit}>
            <div className="field-wrap">
              <label className="field-label" htmlFor="login-email">
                {t('auth.email')}
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
                {t('auth.password')}
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
              <span className="btn-text">{loading ? t('auth.loggingIn') : t('auth.loginButton')}</span>
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
