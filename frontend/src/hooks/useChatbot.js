import { useEffect, useMemo, useRef, useState } from 'react';
import {
  chatbotStarters,
  chatbotTopics,
  emptyChatSession,
  getArticleReply,
  getChatbotReply,
  getTopicQuestions,
  getWelcomeMessage,
  readLoggedInCouple,
} from '../data/chatbotKnowledge';

export default function useChatbot(coupleData) {
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

  return {
    couple,
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
    ask,
    askArticle,
    send,
    resetChat,
  };
}
