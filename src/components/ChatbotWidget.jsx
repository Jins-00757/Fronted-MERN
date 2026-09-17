import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../services/api';
import { useChatbot } from '../hooks/useChatbot';
import './ChatbotWidget.css';

const MAX_INPUT_LENGTH = 4000;

const ChatBubbleIcon = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const CloseIcon = (props) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/**
 * ChatbotWidget - floating AI assistant (Groq-backed), mounted once app-wide
 * while authenticated (see App.jsx, alongside CommandPalette). General CRM
 * help only: drafting emails, explaining features, summarizing pasted text -
 * the backend never feeds it live Salesforce/pipeline data (see
 * Backend-MERN's groqService.js), so nothing here can leak CRM records
 * through the assistant, and one user's conversation never mixes with
 * another's (see useChatbot.js).
 */
export const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  // null = still checking; keeps the bubble hidden until we know, rather
  // than flashing it on and then removing it if the backend has no
  // GROQ_API_KEY configured.
  const [isAvailable, setIsAvailable] = useState(null);
  const [input, setInput] = useState('');
  const { messages, isSending, error, sendMessage, clearConversation } = useChatbot();
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/chatbot/status')
      .then((res) => {
        if (!cancelled) setIsAvailable(Boolean(res.data?.data?.enabled));
      })
      .catch(() => {
        if (!cancelled) setIsAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const timer = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;
    sendMessage(input);
    setInput('');
  };

  if (!isAvailable || typeof document === 'undefined') return null;

  return createPortal(
    <>
      <button
        type="button"
        className="chatbot-fab"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
        aria-expanded={isOpen}
      >
        {isOpen ? <CloseIcon /> : <ChatBubbleIcon />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chatbot-panel"
            role="dialog"
            aria-label="AI assistant"
            onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.18 }}
          >
            <div className="chatbot-header">
              <div>
                <strong>AI Assistant</strong>
                <span className="chatbot-subtitle">General help only - not connected to your live CRM data</span>
              </div>
              <div className="chatbot-header-actions">
                {messages.length > 0 && (
                  <button type="button" className="chatbot-icon-btn" onClick={clearConversation}>
                    Clear
                  </button>
                )}
                <button type="button" className="chatbot-icon-btn" onClick={() => setIsOpen(false)} aria-label="Close">
                  <CloseIcon width={16} height={16} />
                </button>
              </div>
            </div>

            <div className="chatbot-messages" ref={listRef}>
              {messages.length === 0 && (
                <div className="chatbot-empty">
                  Ask me to draft a follow-up email, explain a CRM feature, or summarize something you paste in.
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`chatbot-bubble chatbot-bubble-${m.role}`}>
                  {m.content}
                </div>
              ))}
              {isSending && (
                <div className="chatbot-bubble chatbot-bubble-assistant chatbot-typing" aria-label="AI assistant is typing">
                  <span />
                  <span />
                  <span />
                </div>
              )}
            </div>

            {error && (
              <div className="chatbot-error" role="alert">
                {error}
              </div>
            )}

            <form className="chatbot-input-row" onSubmit={handleSubmit}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                maxLength={MAX_INPUT_LENGTH}
                placeholder="Type a message..."
                rows={1}
                disabled={isSending}
                aria-label="Message the AI assistant"
              />
              <button type="submit" disabled={!input.trim() || isSending}>
                Send
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
};

export default ChatbotWidget;
