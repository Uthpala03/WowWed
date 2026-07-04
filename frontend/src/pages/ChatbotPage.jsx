import { useState } from 'react';
import FormLayout from '../components/layout/FormLayout';
import Button from '../components/ui/Button';

const replies = [
  { words: ['budget', 'cost', 'money'], text: 'Set your budget in the Wedding Profile and track expenses by category.' },
  { words: ['guest', 'rsvp'], text: 'Add guests, set categories, and track RSVP status from your dashboard.' },
  { words: ['vendor'], text: 'Search vendors by district and category, then send booking requests.' },
  { words: ['hello', 'hi', 'help'], text: 'Ask about budget, guests, vendors, or seating.' },
];

function findReply(message) {
  const text = message.toLowerCase();
  const match = replies.find((entry) => entry.words.some((word) => text.includes(word)));
  return match?.text ?? 'Try asking about budget, guests, vendors, or seating.';
}

function ChatbotPage() {
  const [messages, setMessages] = useState([
    { id: 1, from: 'bot', text: 'Hi! Ask me about budget, guests, vendors, or seating.' },
  ]);
  const [input, setInput] = useState('');

  const sendMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((current) => [
      ...current,
      { id: Date.now(), from: 'user', text: trimmed },
      { id: Date.now() + 1, from: 'bot', text: findReply(trimmed) },
    ]);
    setInput('');
  };

  return (
    <FormLayout title="Planning chatbot" subtitle="Quick offline planning help.">
      <div className="chatbot">
        <div className="chatbot__messages">
          {messages.map((message) => (
            <div key={message.id} className={`chatbot__bubble chatbot__bubble--${message.from}`}>
              {message.text}
            </div>
          ))}
        </div>
        <form className="chatbot__input-row" onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
          />
          <Button type="submit" variant="primary">Send</Button>
        </form>
      </div>
    </FormLayout>
  );
}

export default ChatbotPage;
