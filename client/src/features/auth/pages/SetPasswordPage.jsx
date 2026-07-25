import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import AnimatedBackground from '../../../components/shared/AnimatedBackground';
import { getInviteInfo, acceptInvite } from '../services/auth.service';
import useTranslation from '../../../i18n/useTranslation';
import './SetPasswordPage.css';

// نفس الـ 4 حالات اللي كانت في set-password.html: loading / invalid / form / success
export default function SetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [state, setState] = useState('loading'); // loading | invalid | form | success
  const [invalidMessage, setInvalidMessage] = useState('');
  const [email, setEmail] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptError, setAcceptError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function init() {
      if (!token) {
        setInvalidMessage(t('auth.noInviteToken'));
        setState('invalid');
        return;
      }
      try {
        const data = await getInviteInfo(token);
        setEmail(data.email);
        setState('form');
      } catch (err) {
        setInvalidMessage(err.response?.data?.error || t('auth.invalidLinkDefault'));
        setState('invalid');
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setAcceptError('');

    if (newPassword.length < 6) {
      setAcceptError(t('auth.passwordMinLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setAcceptError(t('auth.passwordsDontMatch'));
      return;
    }

    setSubmitting(true);
    try {
      await acceptInvite(token, newPassword);
      setState('success');
    } catch (err) {
      setAcceptError(err.response?.data?.error || t('common.somethingWentWrong'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <AnimatedBackground />
      <div className="page-center">
        <div className="card" id="card">
          {state === 'loading' && (
            <div id="loading-state">
              <img src="/assets/logo.png" alt="NileChat" className="logo" />
              <h1>{t('auth.checkingInviteLink')}</h1>
              <div className="subtitle">{t('auth.oneMoment')}</div>
            </div>
          )}

          {state === 'invalid' && (
            <div id="invalid-state">
              <img src="/assets/logo.png" alt="NileChat" className="logo" />
              <div className="state-icon bad">✕</div>
              <h1>{t('auth.invalidLinkTitle')}</h1>
              <div className="subtitle" id="invalid-message">
                {invalidMessage}
              </div>
              <Link to="/" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '13.5px', textDecoration: 'none' }}>
                {t('auth.backToLogin')}
              </Link>
            </div>
          )}

          {state === 'form' && (
            <div id="form-state">
              <img src="/assets/logo.png" alt="NileChat" className="logo" />
              <h1>{t('auth.activateAccountTitle')}</h1>
              <div className="subtitle">{t('auth.activateAccountSubtitle')}</div>
              <div className="email-pill" id="invite-email">
                {email}
              </div>

              <form id="accept-form" onSubmit={handleSubmit}>
                <div className="field-wrap">
                  <label className="field-label" htmlFor="new-password">
                    {t('auth.newPassword')}
                  </label>
                  <input
                    type="password"
                    className="input"
                    id="new-password"
                    placeholder={t('auth.minSixChars')}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="field-wrap">
                  <label className="field-label" htmlFor="confirm-password">
                    {t('auth.confirmPassword')}
                  </label>
                  <input
                    type="password"
                    className="input"
                    id="confirm-password"
                    placeholder={t('auth.retypePassword')}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <button type="submit" className={`btn${submitting ? ' loading' : ''}`} id="accept-btn" disabled={submitting}>
                  <span className="spinner"></span>
                  <span className="btn-text">{t('auth.activateAndLogin')}</span>
                </button>

                <div className="msg error" id="accept-error">
                  {acceptError}
                </div>
              </form>
            </div>
          )}

          {state === 'success' && (
            <div id="success-state">
              <img src="/assets/logo.png" alt="NileChat" className="logo" />
              <div className="state-icon ok">✓</div>
              <h1>{t('auth.accountActivatedTitle')}</h1>
              <div className="subtitle">{t('auth.accountActivatedSubtitle')}</div>
              <Link to="/" className="btn" style={{ textDecoration: 'none' }}>
                {t('auth.loginButton')}
              </Link>
            </div>
          )}

          <div className="app-footer">Copyright © Nile Techno Designed by Abdullah Elsawy 2026</div>
        </div>
      </div>
    </>
  );
}
