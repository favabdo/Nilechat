import { BarChart3 } from 'lucide-react';

// نفس محتوى #page-analytics في الأصل بالظبط — "Coming Soon" في التطبيق الأصلي نفسه.
export default function AnalyticsPage() {
  return (
    <div id="page-analytics" className="page">
      <div className="page-content">
        <div className="page-header">
          <h2>Analytics</h2>
        </div>
        <div className="coming-soon-box">
          <div className="coming-soon-icon">
            <BarChart3 size={26} color="#fff" />
          </div>
          <h3>Coming Soon</h3>
          <p>صفحة الـ Analytics هتتفعّل قريب.</p>
        </div>
      </div>
    </div>
  );
}
