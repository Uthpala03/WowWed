const TOOLS = [
  { id: 'text', label: 'Text', hint: 'Select text on the card' },
  { id: 'heading', label: 'Title', hint: 'Select the title already on the card' },
  { id: 'names', label: 'Names', hint: 'Select your names' },
  { id: 'date', label: 'Date', hint: 'Select the date' },
  { id: 'quote', label: 'Quote', hint: 'Select the tagline' },
  { id: 'photo', label: 'Photo', hint: 'Add your photo' },
];

function InvitationEditorToolbar({ onTool, photoInputRef, moveTogether, onMoveTogether }) {
  return (
    <div className="invite-studio-tools" role="toolbar" aria-label="Design tools">
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          type="button"
          className="invite-studio-tool"
          title={tool.hint}
          onClick={() => {
            if (tool.id === 'photo') photoInputRef?.current?.click();
            else onTool(tool.id);
          }}
        >
          <span className="invite-studio-tool__icon" aria-hidden>
            {tool.id === 'text' && 'T'}
            {tool.id === 'heading' && 'H'}
            {tool.id === 'names' && '♡'}
            {tool.id === 'date' && '📅'}
            {tool.id === 'quote' && '❝'}
            {tool.id === 'photo' && '📷'}
          </span>
          <span>{tool.label}</span>
        </button>
      ))}
      <button
        type="button"
        className={`invite-studio-tool${moveTogether ? ' is-on' : ''}`}
        title="Move and style every line together"
        aria-pressed={!!moveTogether}
        onClick={() => onMoveTogether?.(!moveTogether)}
      >
        <span className="invite-studio-tool__icon" aria-hidden>↕</span>
        <span>All</span>
      </button>
    </div>
  );
}

export default InvitationEditorToolbar;
