import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import useChatsStore from '../store/chatsStore';
import { formatMessageTimestamp } from '../../../utils/dateFormat';
import { conversationsApi } from '../services/chats.service';
import { mediaKindLabel } from '../utils/mappers';
import { compressImageIfNeeded } from '../utils/compressImage';
import useToastStore from '../../../store/toastStore';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import CustomerPanel from './CustomerPanel';
import ResolveModal from './ResolveModal';

function detectMediaKind(mimeType) {
  if (!mimeType) return 'document';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
}
function generateClientId() {
  return 'c_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
}

export default function ChatMainPanel({ conversation, currentAgentName, socketRef }) {
  const {
    customerPanelOpen,
    noteMode,
    typingAgents,
    toggleCustomerPanel,
    toggleNoteMode,
    patchConversation,
    addMessage,
    resolveCategories,
    cannedResponses,
    closeChat,
  } = useChatsStore();
  const showToast = useToastStore((s) => s.showToast);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [matchIndex, setMatchIndex] = useState(0);
  const [resolveOpen, setResolveOpen] = useState(false);

  if (!conversation) {
    return (
      <div id="chat-main-panel">
        <div id="empty-chat" className="empty-chat" style={{ flex: 1 }}>
          <div className="empty-chat-icon">
            <MessageCircle size={36} />
          </div>
          <h3>NileChat</h3>
          <p>Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  const c = conversation;
  const typingNames = Array.from(typingAgents[String(c.id)] || []);

  // بنحسب عدد التطابقات بحساب الرسايل اللي فيها النص (تقريبي بديل عن querySelectorAll
  // الأصلي — بيدي نفس النتيجة العملية للتنقل بين النتائج)
  const matchCount = searchQuery
    ? c.messages.filter(
        (m) => m.from !== 'note' && m.from !== 'system' && m.text.toLowerCase().includes(searchQuery.toLowerCase())
      ).length
    : 0;

  async function handleSend(text) {
    if (noteMode) {
      const nowIso = new Date().toISOString();
      const pendingMsg = {
        from: 'note',
        text,
        time: formatMessageTimestamp(nowIso),
        rawTime: nowIso,
        senderName: currentAgentName,
        isNote: true,
        _pending: true,
      };
      addMessage(c.id, pendingMsg);
      try {
        await conversationsApi.addNote(c.id, text);
      } catch (err) {
        console.error('[API] sendNoteText error:', err);
        showToast(err.response?.data?.error || 'فشل إضافة الملاحظة', 'error');
      }
      return;
    }

    if (c.rawStatus === 'closed') {
      showToast('المحادثة دي متقفلة (Resolved) — اعمل Reopen الأول عشان تقدر تبعت رسالة', 'error');
      return;
    }

    const nowIso = new Date().toISOString();
    const pendingMsg = {
      from: 'agent',
      text,
      time: formatMessageTimestamp(nowIso),
      rawTime: nowIso,
      senderName: currentAgentName,
      _pending: true,
    };
    addMessage(c.id, pendingMsg);
    patchConversation(c.id, { lastMsg: text });

    try {
      await conversationsApi.reply(c.id, text);
    } catch (err) {
      console.error('[API] sendMessage error:', err);
      showToast(err.response?.data?.error || 'فشل إرسال الرسالة — تأكد من اتصال الباك إند', 'error');
    }
  }

  // بديل sendMediaFile() الأصلي: نفس فلسفة handleSend (optimistic فورية + تأكيد لاحق
  // عن طريق الـ socket)، بس هنا بيتبعت ملف فعلي بـ FormData ومطابقة عن طريق client_id
  // بدل النص، عشان أكتر من ملف ممكن يتبعتوا بنفس اللحظة
  async function handleSendFile(file) {
    if (c.rawStatus === 'closed') {
      showToast('المحادثة دي متقفلة (Resolved) — اعمل Reopen الأول عشان تقدر تبعت رسالة', 'error');
      return;
    }

    const clientId = generateClientId();
    const kind = detectMediaKind(file.type);
    const localUrl = URL.createObjectURL(file);
    const nowIso = new Date().toISOString();

    const pendingMsg = {
      from: 'agent',
      text: '',
      time: formatMessageTimestamp(nowIso),
      rawTime: nowIso,
      senderName: currentAgentName,
      _pending: true,
      _clientId: clientId,
      type: kind,
      mediaUrl: localUrl,
      mediaMime: file.type,
      fileName: file.name,
    };
    addMessage(c.id, pendingMsg);
    patchConversation(c.id, { lastMsg: mediaKindLabel(kind) });

    try {
      // بنصغّر الصورة قبل الرفع (لو محتاجة) — مبيأثرش على الـ preview اللي
      // ظهر فورًا فوق (localUrl) لأنه مبني على الملف الأصلي، بس اللي بيتبعت
      // فعليًا للسيرفر هو النسخة المصغّرة عشان الرفع يخلص أسرع بكتير
      const uploadFile = kind === 'image' ? await compressImageIfNeeded(file) : file;
      await conversationsApi.replyMedia(c.id, uploadFile, clientId);
      // زي sendMessage تمامًا: الـ socket هو اللي هيأكد الرسالة فعليًا (new_message)
      // أو يعلّمها فشلت (message_failed) لما الرفع لواتساب يخلص فعليًا في الخلفية
    } catch (err) {
      console.error('[API] sendMediaFile error:', err);
      showToast(err.response?.data?.error || 'فشل رفع الملف — تأكد من اتصال الباك إند', 'error');
      useChatsStore.getState().replaceMessage(c.id, (m) => m === pendingMsg, (m) => ({ ...m, _pending: false, failed: true }));
    }
  }

  function handleTypingChange(hasText) {
    const socket = socketRef?.current;
    if (!socket || noteMode) return;
    if (hasText) socket.emit('typing', { conversationId: c.id, agentName: currentAgentName });
    else socket.emit('stop_typing', { conversationId: c.id, agentName: currentAgentName });
  }

  async function handleResolveClick() {
    if (c.status === 'resolved') {
      try {
        await conversationsApi.reopen(c.id);
        patchConversation(c.id, { status: 'open', rawStatus: 'open' });
        showToast('تم فتح المحادثة تاني (Reopened)', 'success');
      } catch (err) {
        showToast(err.response?.data?.error || 'فشل عمل Reopen', 'error');
      }
    } else {
      setResolveOpen(true);
    }
  }

  return (
    <div id="chat-main-panel">
      <div id="chat-area" style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
        <ChatHeader
          conversation={c}
          typingNames={typingNames}
          onBack={closeChat}
          onToggleSearch={() => setSearchOpen((v) => !v)}
          searchOpen={searchOpen}
          searchQuery={searchQuery}
          onSearchChange={(v) => {
            setSearchQuery(v);
            setMatchIndex(0);
          }}
          matchCount={matchCount}
          matchIndex={matchIndex}
          onNextMatch={() => setMatchIndex((i) => (matchCount ? (i + 1) % matchCount : 0))}
          onPrevMatch={() => setMatchIndex((i) => (matchCount ? (i - 1 + matchCount) % matchCount : 0))}
          onResolveClick={handleResolveClick}
          onCustomerPanelToggle={toggleCustomerPanel}
        />
        <MessageList conversation={c} searchQuery={searchOpen ? searchQuery : ''} />
        <MessageInput
          conversationId={c.id}
          resolved={c.status === 'resolved'}
          noteMode={noteMode}
          onToggleNoteMode={toggleNoteMode}
          onSend={handleSend}
          onSendFile={handleSendFile}
          onTypingChange={handleTypingChange}
          cannedResponses={cannedResponses}
        />
      </div>

      {customerPanelOpen && <CustomerPanel conversation={c} currentAgentName={currentAgentName} onClose={toggleCustomerPanel} />}

      {resolveOpen && (
        <ResolveModal
          conversation={c}
          categories={resolveCategories}
          onClose={() => setResolveOpen(false)}
          onResolved={(catName) => {
            patchConversation(c.id, { status: 'resolved', rawStatus: 'closed', resolveCategory: catName });
            setResolveOpen(false);
            closeChat();
          }}
        />
      )}
    </div>
  );
}
