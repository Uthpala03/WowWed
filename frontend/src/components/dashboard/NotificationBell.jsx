function NotificationBell({ active }) {
  return (
    <svg
      className={`notif-bell${active ? ' is-active' : ''}`}
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 3.5c-2.8 0-5 2.2-5 5v2.1c0 .8-.3 1.6-.8 2.2L5.2 14.8A1.2 1.2 0 0 0 6.2 16.5h11.6a1.2 1.2 0 0 0 1-1.7l-.9-1.9c-.5-.6-.8-1.4-.8-2.2V8.5c0-2.8-2.2-5-5-5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M10 17.5a2 2 0 0 0 4 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default NotificationBell;
