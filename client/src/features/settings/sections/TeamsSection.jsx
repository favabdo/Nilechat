import { useEffect, useState } from 'react';
import { Plus, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { iconKeyToComponent } from '../../../utils/iconMap';
import { teamsApi } from '../services/settings.service';
import { hexToRgba } from '../../chats/utils/mappers';
import useAuthStore from '../../../store/authStore';
import useToastStore from '../../../store/toastStore';
import useChatsStore from '../../chats/store/chatsStore';
import TeamModal from '../components/TeamModal';
import TeamMembersModal from '../components/TeamMembersModal';
import useTranslation from '../../../i18n/useTranslation';

const isOwnerOrAdmin = (user) => (user?.role ?? 2) <= 1;

export default function TeamsSection() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);
  const canManage = isOwnerOrAdmin(user);
  const { teams, staticDataLoaded, loadStaticData, refreshTeams } = useChatsStore();

  const [editModal, setEditModal] = useState(null);
  const [membersModal, setMembersModal] = useState(null);

  useEffect(() => {
    if (!staticDataLoaded) loadStaticData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(team) {
    if (!window.confirm(t('settings.deleteTeamConfirm', { name: team.name }))) return;
    try {
      await teamsApi.remove(team.id);
      showToast(t('settings.teamDeletedSuccess'), 'success');
      refreshTeams();
    } catch (err) {
      console.error('[API] deleteTeam error:', err);
      showToast(err.response?.data?.error || t('settings.deleteTeamFailed'), 'error');
    }
  }

  return (
    <div className="settings-content-section active" id="settings-sec-teams">
      <div className="page-content">
        <div className="settings-top-row">
          <div>
            <h2>{t('settings.teams')}</h2>
            <div className="settings-top-desc">{t('settings.teamsDesc')}</div>
          </div>
          {canManage && (
            <button className="page-btn" onClick={() => setEditModal({ team: null })}>
              <Plus size={16} /> {t('settings.addTeamBtn')}
            </button>
          )}
        </div>

        <div className="settings-card-grid">
          {!staticDataLoaded && <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t('settings.loadingTeams')}</div>}
          {staticDataLoaded &&
            teams.map((team) => {
              const TeamIcon = iconKeyToComponent(team.icon);
              return (
                <div className="settings-card" key={team.id}>
                  <div className="settings-card-icon" style={{ background: hexToRgba(team.color, 0.1), color: team.color }}>
                    <TeamIcon size={20} />
                  </div>
                  <div className="settings-card-title">{team.name}</div>
                  <div className="settings-card-desc">{team.description || ''}</div>
                  <div className="settings-card-meta">
                    <span>
                      {team.members_count} {t('settings.agentsCol')}
                    </span>
                  </div>
                  {canManage && (
                    <div
                      style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <button
                        className="team-card-manage-btn"
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'var(--primary)',
                          cursor: 'pointer',
                          background: 'none',
                          border: 'none',
                          fontFamily: 'inherit',
                          padding: 0,
                        }}
                        onClick={() => setMembersModal(team)}
                      >
                        {t('settings.manageAgentsBtn')}
                      </button>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="st-icon-btn"
                          title={t('settings.editTeamTitle')}
                          aria-label={t('settings.editTeamTitle')}
                          onClick={() => setEditModal({ team })}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="st-icon-btn"
                          style={{ color: 'var(--danger)' }}
                          title={t('settings.deleteTeamTitle')}
                          aria-label={t('settings.deleteTeamTitle')}
                          onClick={() => handleDelete(team)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          {staticDataLoaded && canManage && (
            <div
              className="settings-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderStyle: 'dashed',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
              onClick={() => setEditModal({ team: null })}
            >
              <PlusCircle size={26} style={{ marginBottom: 8 }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{t('settings.newTeam')}</span>
            </div>
          )}
        </div>
      </div>

      {editModal && (
        <TeamModal
          team={editModal.team}
          onClose={() => setEditModal(null)}
          onSaved={() => {
            setEditModal(null);
            showToast(editModal.team ? t('settings.teamUpdatedSuccess') : t('settings.teamAddedSuccess'), 'success');
            refreshTeams();
          }}
        />
      )}
      {membersModal && (
        <TeamMembersModal
          team={membersModal}
          onClose={() => setMembersModal(null)}
          onSaved={() => {
            setMembersModal(null);
            showToast(t('settings.teamMembersUpdatedSuccess'), 'success');
            refreshTeams();
          }}
        />
      )}
    </div>
  );
}
