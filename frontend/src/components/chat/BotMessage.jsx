import { Link } from 'react-router-dom';

export default function BotMessage({ message }) {
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
        <Link className="chatbot__page-link" to={message.route} onClick={message.onNavigate}>
          {message.routeLabel || 'Open this page'}
        </Link>
      )}
    </div>
  );
}
