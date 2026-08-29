import { useOutletContext } from 'react-router-dom';
import useChatbot from '../../hooks/useChatbot';
import BotMessage from '../../components/chat/BotMessage';
import PageHeader from '../../components/ui/PageHeader';
import AppIcon from '../../components/ui/AppIcon';

function ChatbotPage() {
  const coupleData = useOutletContext();

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
    topicQuestions,
    bottomRef,
    askArticle,
    send,
    resetChat,
  } = useChatbot(coupleData);

  return (
    <div className="dash-page">
      <PageHeader moduleId="assistant" tagline="Offline chatbot">
        {messages.length > 1 && (
          <button type="button" className="dash-btn dash-btn--ghost" onClick={resetChat}>
            Start over
          </button>
        )}
      </PageHeader>

      <div className="dash-card chatbot-dash">
        <div className="chatbot__messages" aria-live="polite">
          {messages.map((msg, index) => (
            msg.from === 'bot'
              ? <BotMessage key={`bot-${index}`} message={msg} />
              : <div key={`user-${index}`} className="chatbot__bubble chatbot__bubble--user">{msg.text}</div>
          ))}

          {isFresh && (
            <div className="chatbot-topics" aria-label="Topics">
              <p>Or pick a topic</p>
              <div className="chatbot-topics__row">
                {chatbotTopics.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    className={`chatbot-topic${topicId === topic.id ? ' is-on' : ''}`}
                    onClick={() => setTopicId((current) => (current === topic.id ? null : topic.id))}
                  >
                    <AppIcon name={topic.icon || 'assistant'} size={18} />
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

        <form className="chatbot__input-row" onSubmit={send}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about guests, budget, or vendors…"
            aria-label="Your message"
            autoComplete="off"
          />
          <button type="submit" className="dash-btn dash-btn--primary" disabled={!input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatbotPage;
