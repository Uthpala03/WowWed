import { useState } from 'react';
import { getChatbotReply } from '../../data/chatbotKnowledge';
import PageHeader from '../../components/ui/PageHeader';

function ChatbotPage() {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! I\'m your WowWed planning assistant. Ask about budgets, Poruwa ceremonies, guests, seating, or vendors.' },
  ]);
  const [input, setInput] = useState('');

  const send = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const reply = getChatbotReply(input);
    setMessages((m) => [...m, { from: 'user', text: input.trim() }, { from: 'bot', text: reply }]);
    setInput('');
  };

  return (
    <div className="dash-page">
      <PageHeader moduleId="assistant" title="Planning Assistant" />
      <div className="dash-card chatbot-dash">
        <div className="chatbot__messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chatbot__bubble chatbot__bubble--${msg.from === 'bot' ? 'bot' : 'user'}`}>{msg.text}</div>
          ))}
        </div>
        <form className="chatbot__input-row" onSubmit={send}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about budget, guests, Poruwa..." />
          <button type="submit" className="dash-btn dash-btn--primary">Send</button>
        </form>
      </div>
    </div>
  );
}

export default ChatbotPage;
