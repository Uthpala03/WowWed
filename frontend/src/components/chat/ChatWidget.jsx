import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { readCoupleSnapshot } from '../../utils/storage';
import useChatbot from '../../hooks/useChatbot';
import BotMessage from './BotMessage';
import WowBotIcon from './WowBotIcon';
import '../../styles/chat-widget.css';

const WOWBOT_TITLE = 'Chat with WowBot 👋';

function ChatWidget() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const coupleData = useMemo(() => {
    if (user?.role === 'couple') return readCoupleSnapshot();
    return { userId: user?.id || null };
  }, [user, open]);

  const {
    messages,
    input,
    setInput,
    topicId,
    setTopicId,
    isFresh,
    suggestions,
    selectedTopic,
    chatbotTopics,
    bottomRef,
    askArticle,
    send,
    resetChat,
  } = useChatbot(coupleData);

  if (location.pathname === '/dashboard/assistant') return null;

  const closeWidget = () => setOpen(false);
  const onNavigate = () => setOpen(false);

  return (
    <div className="chat-widget-root chat-widget-root--compact" aria-live="polite">
      {!open && (
        <button
          type="button"
          className="chat-widget__launcher"
          onClick={() => setOpen(true)}
          aria-label="Chat with WowBot"
          title="Chat with WowBot"
        >
          <span className="chat-widget__launcher-icon" aria-hidden="true">
            <WowBotIcon size={36} className="wowbot-icon--launcher" />
          </span>
          <span className="chat-widget__launcher-label">Chat with WowBot</span>
        </button>
      )}

      {open && (
        <div className="chat-widget" role="dialog" aria-label="WowBot assistant">
          <header className="chat-widget__header">
            <div className="chat-widget__header-main">
              <span className="chat-widget__avatar" aria-hidden="true">
                <WowBotIcon size={38} className="wowbot-icon--avatar" />
              </span>
              <div>
                <strong>{WOWBOT_TITLE}</strong>
                <small>We reply immediately</small>
              </div>
            </div>
            <div className="chat-widget__header-actions">
              {messages.length > 1 && (
                <button type="button" className="chat-widget__icon-btn" onClick={resetChat} title="Start over" aria-label="Start over">
                  ↺
                </button>
              )}
              <button type="button" className="chat-widget__icon-btn" onClick={closeWidget} title="Minimize" aria-label="Close chat">
                ✕
              </button>
            </div>
          </header>

          <div className="chat-widget__messages">
            {messages.map((msg, index) => (
              msg.from === 'bot' ? (
                <BotMessage
                  key={`bot-${index}`}
                  message={{ ...msg, onNavigate }}
                />
              ) : (
                <div key={`user-${index}`} className="chatbot__bubble chatbot__bubble--user">{msg.text}</div>
              )
            ))}

            {isFresh && (
              <div className="chatbot-topics chatbot-topics--widget">
                <p>Pick a topic</p>
                <div className="chatbot-topics__row">
                  {chatbotTopics.slice(0, 6).map((topic) => (
                    <button
                      key={topic.id}
                      type="button"
                      className={`chatbot-topic${topicId === topic.id ? ' is-on' : ''}`}
                      onClick={() => setTopicId((current) => (current === topic.id ? null : topic.id))}
                    >
                      {topic.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="chatbot__starters">
                <p>
                  {isFresh
                    ? (selectedTopic ? `Ask about ${selectedTopic.label.toLowerCase()}` : 'Try saying')
                    : 'You could also say'}
                </p>
                <div className="chatbot__chips">
                  {suggestions.map((item) => (
                    <button
                      key={item.id || item.label}
                      type="button"
                      className="chatbot__chip"
                      onClick={() => askArticle(item)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form className="chat-widget__input-row" onSubmit={send}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message…"
              aria-label="Your message"
              autoComplete="off"
            />
            <button type="submit" className="chat-widget__send" disabled={!input.trim()} aria-label="Send message">
              ➤
            </button>
          </form>

          <footer className="chat-widget__footer">Powered by WowWed</footer>
        </div>
      )}
    </div>
  );
}

export default ChatWidget;
