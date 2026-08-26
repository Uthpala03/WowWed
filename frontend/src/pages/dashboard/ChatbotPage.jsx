import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  chatbotStarters,
  chatbotTopics,
  emptyChatSession,
  getArticleReply,
  getChatbotReply,
  getTopicQuestions,
  getWelcomeMessage,
  readLoggedInCouple,
} from '../../data/chatbotKnowledge';
import PageHeader from '../../components/ui/PageHeader';
import AppIcon from '../../components/ui/AppIcon';

function BotMessage({ message }) {
  return (
    <div className="chatbot__bubble chatbot__bubble--bot">
      <p>{message.text}</p>
      {message.points?.length > 0 && (
        <ul className="chatbot__points">
          {message.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      )}
      {message.route && (
        <Link className="chatbot__page-link" to={message.route}>
          {message.routeLabel || 'Open this page'}
        </Link>
      )}
    </div>
  );
}

function ChatbotPage() {
  const coupleData = useOutletContext();
  const couple = useMemo(() => readLoggedInCouple(coupleData), [coupleData]);
  const welcomeText = getWelcomeMessage(couple);
  const [session, setSession] = useState(() => emptyChatSession());
  const [messages, setMessages] = useState(() => [
    { from: 'bot', id: 'welcome', text: welcomeText, points: [], related: [] },
  ]);
  const [input, setInput] = useState('');
  const [topicId, setTopicId] = useState(null);
  const bottomRef = useRef(null);
  const isFresh = messages.length === 1;

  useEffect(() => {
    setSession(emptyChatSession());
    setMessages([{ from: 'bot', id: 'welcome', text: getWelcomeMessage(couple), points: [], related: [] }]);
    setInput('');
    setTopicId(null);
  }, [couple.userId]);

  const topicQuestions = useMemo(
    () => (topicId ? getTopicQuestions(topicId).slice(0, 6) : []),
    [topicId],
  );

  const lastBot = [...messages].reverse().find((msg) => msg.from === 'bot');
  const followUps = (lastBot?.related || []).slice(0, 4);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, topicId]);

  const pushReply = (userText, reply) => {
    if (reply?.session) setSession(reply.session);
    setMessages((current) => [
      ...current,
      { from: 'user', text: userText },
      { from: 'bot', ...reply },
    ]);
    setTopicId(null);
  };

  const ask = (text) => {
    const query = String(text || '').trim();
    if (!query) return;
    const liveCouple = readLoggedInCouple(coupleData);
    pushReply(query, getChatbotReply(query, session, liveCouple));
    setInput('');
  };

  const askArticle = (item) => {
    if (!item?.id || String(item.id).startsWith('starter-') || String(item.id).startsWith('say-')) {
      ask(item.label);
      return;
    }
    const reply = getArticleReply(item.id, session, readLoggedInCouple(coupleData));
    if (reply.id === 'fallback') {
      ask(item.label);
      return;
    }
    pushReply(item.label, reply);
  };

  const send = (e) => {
    e.preventDefault();
    ask(input);
  };

  const resetChat = () => {
    setSession(emptyChatSession());
    setMessages([{ from: 'bot', id: 'welcome', text: getWelcomeMessage(couple), points: [], related: [] }]);
    setInput('');
    setTopicId(null);
  };

  const suggestions = isFresh
    ? (topicQuestions.length
      ? topicQuestions
      : chatbotStarters.map((label, index) => ({ id: `starter-${index}`, label })))
    : followUps;

  const selectedTopic = chatbotTopics.find((topic) => topic.id === topicId);

  return (
    <div className="dash-page">
      <PageHeader moduleId="assistant" tagline="Your wedding planning assistant">
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
            placeholder="Message the Assistant…"
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
