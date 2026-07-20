import { Calendar, UserRound, Clock } from 'lucide-react';
import { formatSchedDate } from '../../../utils/dateFormat';

export default function VisitCard({ v }) {
  const timesParts = [];
  if (v.arrival_time) timesParts.push(`وصول: ${v.arrival_time}`);
  if (v.departure_time) timesParts.push(`انصراف: ${v.departure_time}`);

  return (
    <div className="sched-task-card">
      <div className="sched-task-subrow">
        <span>
          <Calendar size={13} />
          {formatSchedDate(v.visit_date)}
        </span>
        <span>
          <UserRound size={13} />
          {v.agent_name || 'Unknown'}
        </span>
      </div>
      <div className="sched-task-text">{v.work_done}</div>
      {timesParts.length > 0 && (
        <div className="sched-task-meta">
          <Clock size={13} />
          {timesParts.join(' · ')}
        </div>
      )}
    </div>
  );
}
