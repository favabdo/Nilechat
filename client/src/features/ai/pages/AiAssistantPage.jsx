import { Sparkles } from 'lucide-react';

// نفس محتوى #page-ai في الأصل بالظبط — الميزة دي "Coming Soon" في التطبيق الأصلي نفسه، مش بس عندنا هنا.
export default function AiAssistantPage() {
  return (
    <div id="page-ai" className="page">
      <div className="page-content">
        <div className="page-header">
          <h2>AI Assistant</h2>
        </div>
        <div className="coming-soon-box">
          <div className="coming-soon-icon">
            <Sparkles size={26} color="#fff" />
          </div>
          <h3>Coming Soon</h3>
          <p>هنفعّل مساعد الـ AI قريب.</p>
        </div>
      </div>
    </div>
  );
}
