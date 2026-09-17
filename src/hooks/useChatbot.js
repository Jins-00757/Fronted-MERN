
import { useState, useCallback, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/useAuth';

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
      const history = messages.slice(-HISTORY_TURNS_SENT);
      setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
      setIsSending(true);

      try {
        const response = await api.post('/chatbot/message', { message: trimmed, history });
        const reply = response.data?.data?.reply;
        setMessages((prev) => [...prev, { role: 'assistant', content: reply || "Sorry, I didn't get a response." }]);
      } catch (err) {
        setError(err.message || 'Failed to reach the AI assistant');
      } finally {
        setIsSending(false);
      }
    },
    [messages, isSending]
  );

  const clearConversation = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isSending, error, sendMessage, clearConversation };
};

export default useChatbot;
