import { X } from 'lucide-react';
import useToastStore from '../../../store/toastStore';
import { conversationsApi } from '../services/chats.service';
import { hexToRgba } from '../utils/mappers';
import useTranslation from '../../../i18n/useTranslation';
import TagPopover from './TagPopover';

export default function TeamsSection({ conversation, teams, onTeamsChange }) {
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.showToast);
  const appliedIds = (conversation.teams || []).map((team) => Number(team.id));

  async function selectTeam(teamId) {
    const previous = conversation.teams || [];
    const applied = previous.some((team) => Number(team.id) === Number(teamId));
    const optimistic = applied
      ? []
      : (() => {
          const meta = teams.find((team) => Number(team.id) === Number(teamId));
          return meta ? [{ id: meta.id, name: meta.name, icon: meta.icon, color: meta.color }] : previous;
        })();
    onTeamsChange(optimistic);

    try {
      if (applied) {
        const data = await conversationsApi.removeTeam(conversation.id, teamId);
        onTeamsChange(data.teams);
      } else {
        for (const old of previous) await conversationsApi.removeTeam(conversation.id, old.id);
        const data = await conversationsApi.addTeam(conversation.id, teamId);
        onTeamsChange(data.teams);
      }
    } catch (err) {
      console.error('[API] selectTeam error:', err);
      showToast(err.response?.data?.error || t('chats.genericError'), 'error');
      onTeamsChange(previous);
    }
  }

  async function removeTeam(teamId) {
    const previous = conversation.teams || [];
    onTeamsChange([]);
    try {
      const data = await conversationsApi.removeTeam(conversation.id, teamId);
      onTeamsChange(data.teams);
    } catch (err) {
      console.error('[API] removeTeam error:', err);
      showToast(err.response?.data?.error || t('chats.genericError'), 'error');
      onTeamsChange(previous);
    }
  }

  return (
    <div className="cp-section" id="cp-section-teams">
      <div className="cp-section-header">
        <div className="cp-section-title">{t('chats.teamsSectionTitle')}</div>
      </div>
      <div className="cp-section-body">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
          <div className="conv-label-list">
            {!conversation.teams || conversation.teams.length === 0 ? (
              <span className="conv-label-empty">{t('chats.noTeamsYet')}</span>
            ) : (
              conversation.teams.map((team) => (
                <span
                  key={team.id}
                  className="conv-label-chip"
                  style={{ background: hexToRgba(team.color, 0.12), color: team.color || '#6C5CE7' }}
                >
                  <span className="conv-label-dot" style={{ background: team.color || '#6C5CE7' }}></span>
                  {team.name}
                  <button className="conv-label-remove" title={t('chats.remove')} aria-label={t('chats.remove')} onClick={() => removeTeam(team.id)}>
                    <X size={9} />
                  </button>
                </span>
              ))
            )}
          </div>
          <TagPopover
            items={teams}
            appliedIds={appliedIds}
            onSelect={selectTeam}
            emptyText={t('chats.noTeamsYetCreateFromSettings')}
            allowCreate={false}
          />
        </div>
      </div>
    </div>
  );
}
