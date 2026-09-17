
import { useState, useCallback, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import { sendAssistantMessage, confirmAssistantAction } from '../services/aiActionsApi';

const MAX_MESSAGE_LENGTH = 4000;
// How much of the conversation is kept, both in sessionStorage and sent as
// `history` on the next call - bounded so a long-running chat never grows
// storage or the request payload without limit (the backend independently
// caps how much of `history` it will use - see groqService.js).
const MAX_STORED_MESSAGES = 40;
const HISTORY_TURNS_SENT = 12;

const storageKeyFor = (userId) => `chatbot_history_${userId}`;

const loadStoredMessages = (userId) => {
  if (!userId) return [];
  try {
    const raw = sessionStorage.getItem(storageKeyFor(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * useChatbot - state + API calls for the Groq-backed AI assistant widget.
 *
 * The conversation lives only in this tab's sessionStorage, namespaced by
 * user id - it is never persisted server-side (the backend only audit-logs
 * usage metadata, not message content, see chatbotController.js). Namespacing
 * by user id also means that if a different account logs into the same tab,
 * it simply reads its own (empty, or its own prior) history rather than the
 * previous account's - no explicit "clear on logout" step is needed.
 */
export const useChatbot = () => {
  const { user } = useAuth();
  const userId = user?._id;

  const [messages, setMessages] = useState(() => loadStoredMessages(userId));
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  // Opt-in, off by default: when true, sendMessage talks to the CRM Actions
  // Assistant (Groq function calling - can look up real quotes and PROPOSE
  // mutating actions like approving one) instead of the general, CRM-data-
  // free chat endpoint. See ChatbotWidget.jsx for the toggle.
  const [actionsEnabled, setActionsEnabled] = useState(false);
  // The most recent proposed-but-not-yet-confirmed action, if any. Cleared
  // on confirm, cancel, or sending a new message.
  const [pendingAction, setPendingAction] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const lastUserIdRef = useRef(userId);

  useEffect(() => {
    if (lastUserIdRef.current === userId) return;
    lastUserIdRef.current = userId;
    setMessages(loadStoredMessages(userId));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    try {
      sessionStorage.setItem(storageKeyFor(userId), JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)));
    } catch {
      // sessionStorage can throw (private browsing, storage full, etc.) -
      // the conversation still works in-memory for the rest of the tab.
    }
  }, [messages, userId]);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;

      if (trimmed.length > MAX_MESSAGE_LENGTH) {
        setError(`Message is too long (max ${MAX_MESSAGE_LENGTH.toLocaleString()} characters).`);
        return;
      }

      setError(null);
      setPendingAction(null);
      const history = messages.slice(-HISTORY_TURNS_SENT);
      setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
      setIsSending(true);

      try {
        if (actionsEnabled) {
          const data = await sendAssistantMessage({ message: trimmed, history });
          setMessages((prev) => [...prev, { role: 'assistant', content: data?.reply || "Sorry, I didn't get a response." }]);
          setPendingAction(data?.pendingAction || null);
        } else {
          const response = await api.post('/chatbot/message', { message: trimmed, history });
          const reply = response.data?.data?.reply;
          setMessages((prev) => [...prev, { role: 'assistant', content: reply || "Sorry, I didn't get a response." }]);
        }
      } catch (err) {
        setError(err.message || 'Failed to reach the AI assistant');
      } finally {
        setIsSending(false);
      }
    },
    [messages, isSending, actionsEnabled]
  );

  /**
   * confirmPendingAction - the only path that actually executes a mutating
   * CRM action (e.g. approve-and-sync-to-Salesforce). Requires the user to
   * have explicitly clicked "Confirm" on the pendingAction card - the
   * backend re-validates everything again from scratch (see
   * aiToolsService.confirmPendingAction), this is not just a client-side
   * safeguard.
   */
  const confirmPendingActionCall = useCallback(async () => {
    if (!pendingAction || isConfirming) return;
    setIsConfirming(true);
    setError(null);
    try {
      await confirmAssistantAction({ tool: pendingAction.tool, args: pendingAction.args });
      setMessages((prev) => [...prev, { role: 'assistant', content: '✅ Done - the change was written to Salesforce.' }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `❌ That didn't go through: ${err.message || 'unknown error'}` }]);
    } finally {
      setPendingAction(null);
      setIsConfirming(false);
    }
  }, [pendingAction, isConfirming]);

  const cancelPendingAction = useCallback(() => {
    setPendingAction(null);
    setMessages((prev) => [...prev, { role: 'assistant', content: 'Cancelled - nothing was changed.' }]);
  }, []);

  const toggleActionsEnabled = useCallback(() => {
    setPendingAction(null);
    setActionsEnabled((prev) => !prev);
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setError(null);
    setPendingAction(null);
  }, []);

  return {
    messages,
    isSending,
    error,
    sendMessage,
    clearConversation,
    actionsEnabled,
    toggleActionsEnabled,
    pendingAction,
    isConfirming,
    confirmPendingAction: confirmPendingActionCall,
    cancelPendingAction,
  };
};

export default useChatbot;
