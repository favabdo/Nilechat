import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import AnimatedBackground from '../../../components/shared/AnimatedBackground';
import { getInviteInfo, acceptInvite } from '../services/auth.service';
import './SetPasswordPage.css';

// نفس الـ 4 حالات اللي كانت في set-password.html: loading / invalid / form / success
export default function SetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [state, setState] = useState('loading'); // loading | invalid | form | success
  const [invalidMessage, setInvalidMessage] = useState('اللينك ده مش صالح أو منتهي الصلاحية. اطلب من الأدمن يبعت لك دعوة جديدة.');
  const [email, setEmail] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptError, setAcceptError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function init() {
      if (!token) {
        setInvalidMessage('مفيش رابط دعوة في العنوان. تأكد إنك دوست على اللينك اللي جالك بالإيميل كامل.');
        setState('invalid');
        return;
      }
      try {
        const data = await getInviteInfo(token);
        setEmail(data.email);
        setState('form');
      } catch (err) {
        setInvalidMessage(err.response?.data?.error || 'اللينك ده مش صالح أو منتهي الصلاحية.');
        setState('invalid');
      }
    }
    init();
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setAcceptError('');

    if (newPassword.length < 6) {
      setAcceptError('كلمة المرور لازم تكون 6 حروف على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      setAcceptError('كلمتا السر مش متطابقتين');
      return;
    }

    setSubmitting(true);
    try {
      await acceptInvite(token, newPassword);
      setState('success');
    } catch (err) {
      setAcceptError(err.response?.data?.error || 'حصل خطأ، حاول تاني');
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
              <h1>بنتحقق من لينك الدعوة...</h1>
              <div className="subtitle">لحظة واحدة من فضلك</div>
            </div>
          )}

          {state === 'invalid' && (
            <div id="invalid-state">
              <img src="/assets/logo.png" alt="NileChat" className="logo" />
              <div className="state-icon bad">✕</div>
              <h1>رابط الدعوة غير صحيح</h1>
              <div className="subtitle" id="invalid-message">
                {invalidMessage}
              </div>
              <Link to="/" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '13.5px', textDecoration: 'none' }}>
                الرجوع لصفحة تسجيل الدخول
              </Link>
            </div>
          )}

          {state === 'form' && (
            <div id="form-state">
              <img src="/assets/logo.png" alt="NileChat" className="logo" />
              <h1>تفعيل الحساب</h1>
              <div className="subtitle">اختار كلمة سر عشان تقدر تسجّل دخولك على لوحة تحكم NileChat</div>
              <div className="email-pill" id="invite-email">
                {email}
              </div>

              <form id="accept-form" onSubmit={handleSubmit}>
                <div className="field-wrap">
                  <label className="field-label" htmlFor="new-password">
                    كلمة السر الجديدة
                  </label>
                  <input
                    type="password"
                    className="input"
                    id="new-password"
                    placeholder="6 حروف على الأقل"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="field-wrap">
                  <label className="field-label" htmlFor="confirm-password">
                    تأكيد كلمة السر
                  </label>
                  <input
                    type="password"
                    className="input"
                    id="confirm-password"
                    placeholder="اكتب كلمة السر تاني"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <button type="submit" className={`btn${submitting ? ' loading' : ''}`} id="accept-btn" disabled={submitting}>
                  <span className="spinner"></span>
                  <span className="btn-text">تفعيل الحساب وتسجيل الدخول</span>
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
              <h1>تم تفعيل الحساب بنجاح</h1>
              <div className="subtitle">دلوقتي تقدر تسجّل دخولك بإيميلك وكلمة السر الجديدة</div>
              <Link to="/" className="btn" style={{ textDecoration: 'none' }}>
                تسجيل الدخول
              </Link>
            </div>
          )}

          <div className="app-footer">Copyright © Nile Techno Designed by Abdullah Elsawy 2026</div>
        </div>
      </div>
    </>
  );
}
