import { accentPresets, cardSizeOptions, fontOptions } from '../../models/InvitationTemplate';

const BLOCK_LABELS = {
  cultural: 'Title',
  intro: 'Intro line',
  tagline: 'Tagline',
  partnerOne: 'First name',
  partnerTwo: 'Second name',
  amp: '& symbol',
  parentOne: 'Parents (1)',
  parentTwo: 'Parents (2)',
  quote: 'Quote',
  date: 'Date',
  time: 'Time',
  'venue-label': 'Venue label',
  venue: 'Venue name',
  address: 'Address',
  rsvp: 'RSVP',
  footer: 'Footer message',
};

function blockLabel(block) {
  return BLOCK_LABELS[block.id] || (block.text?.length > 28 ? `${block.text.slice(0, 28)}…` : block.text) || 'Custom text';
}

function ToggleBtn({ active, onClick, children, title }) {
  return (
    <button
      type="button"
      className={`invite-custom-toggle${active ? ' is-on' : ''}`}
      onClick={onClick}
      title={title}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

function InvitationCustomizePanel({
  textBlocks = [],
  selectedBlockId,
  cardSize,
  onSelectBlock,
  onEditBlock,
  onEditBlockText,
  onAddText,
  onDuplicate,
  onDelete,
  onResetLayout,
  onCardSize,
}) {
  const selectedBlock = selectedBlockId
    ? textBlocks.find((b) => b.id === selectedBlockId)
    : null;

  const sortedBlocks = [...textBlocks]
    .filter((b) => b.text?.trim())
    .sort((a, b) => a.y - b.y);

  const fontSize = selectedBlock?.fontSize || 10;

  const bumpSize = (delta) => {
    const next = Math.max(4, Math.min(40, fontSize + delta));
    onEditBlock(selectedBlock.id, { fontSize: next });
  };

  const toggleProp = (prop) => {
    onEditBlock(selectedBlock.id, { [prop]: !selectedBlock[prop] });
  };

  return (
    <aside className="invite-custom-panel">
      <div className="invite-custom-panel__head">
        <span className="invite-custom-panel__icon">🎨</span>
        <div>
          <h3 className="invite-custom-panel__title">Customize</h3>
          <p className="invite-custom-panel__sub">Pick text, then style it</p>
        </div>
      </div>

      <section className="invite-custom-section">
        <h4 className="invite-custom-section__label">
          <span>①</span> Choose text to edit
        </h4>
        <div className="invite-custom-parts">
          {sortedBlocks.map((block) => (
            <button
              key={block.id}
              type="button"
              className={`invite-custom-part${selectedBlockId === block.id ? ' is-on' : ''}`}
              onClick={() => onSelectBlock(block.id)}
            >
              <span className="invite-custom-part__name">{blockLabel(block)}</span>
              <span className="invite-custom-part__preview">{block.text}</span>
            </button>
          ))}
        </div>
        {!sortedBlocks.length && (
          <p className="invite-custom-empty">Your card text will appear here.</p>
        )}
      </section>

      {selectedBlock ? (
        <>
          <section className="invite-custom-section invite-custom-section--highlight">
            <h4 className="invite-custom-section__label">
              <span>②</span> Edit &amp; style — {blockLabel(selectedBlock)}
            </h4>

            <label className="invite-custom-field">
              <span>Words</span>
              <textarea
                rows={2}
                value={selectedBlock.text}
                onChange={(e) => onEditBlockText(selectedBlock.id, e.target.value)}
              />
            </label>

            <div className="invite-custom-field">
              <span>Font style</span>
              <div className="invite-custom-fonts">
                {fontOptions.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`invite-custom-font${selectedBlock.fontId === f.id ? ' is-on' : ''}`}
                    style={{ fontFamily: f.family }}
                    onClick={() => onEditBlock(selectedBlock.id, { fontId: f.id })}
                  >
                    <em>{f.sample}</em>
                    <small>{f.label.split(' ')[0]}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="invite-custom-field">
              <span>Text size</span>
              <div className="invite-custom-size">
                <button type="button" onClick={() => bumpSize(-1)} aria-label="Smaller">A−</button>
                <input
                  type="range"
                  min={4}
                  max={40}
                  step={0.5}
                  value={fontSize}
                  onChange={(e) => onEditBlock(selectedBlock.id, { fontSize: Number(e.target.value) })}
                />
                <button type="button" onClick={() => bumpSize(1)} aria-label="Larger">A+</button>
                <strong>{Math.round(fontSize * 10) / 10}</strong>
              </div>
            </div>

            <div className="invite-custom-field">
              <span>Text color</span>
              <div className="invite-custom-colors">
                {accentPresets.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`invite-custom-color${selectedBlock.color === color ? ' is-on' : ''}`}
                    style={{ background: color }}
                    aria-label={`Color ${color}`}
                    onClick={() => onEditBlock(selectedBlock.id, { color })}
                  />
                ))}
              </div>
            </div>

            <div className="invite-custom-field">
              <span>Look</span>
              <div className="invite-custom-toggles">
                <ToggleBtn active={selectedBlock.bold} onClick={() => toggleProp('bold')} title="Bold">
                  <strong>B</strong>
                </ToggleBtn>
                <ToggleBtn active={selectedBlock.italic} onClick={() => toggleProp('italic')} title="Italic">
                  <em>I</em>
                </ToggleBtn>
                <ToggleBtn active={selectedBlock.uppercase} onClick={() => toggleProp('uppercase')} title="All caps">
                  AA
                </ToggleBtn>
              </div>
            </div>

            <div className="invite-custom-field">
              <span>Alignment</span>
              <div className="invite-custom-toggles">
                {[
                  { id: 'left', label: '⬅', title: 'Align left' },
                  { id: 'center', label: '↔', title: 'Center' },
                  { id: 'right', label: '➡', title: 'Align right' },
                ].map((a) => (
                  <ToggleBtn
                    key={a.id}
                    active={(selectedBlock.align || 'center') === a.id}
                    onClick={() => onEditBlock(selectedBlock.id, { align: a.id })}
                    title={a.title}
                  >
                    {a.label}
                  </ToggleBtn>
                ))}
              </div>
            </div>

            <div className="invite-custom-actions">
              <button type="button" className="invite-custom-action" onClick={() => onDuplicate(selectedBlock.id)}>
                📋 Copy
              </button>
              <button type="button" className="invite-custom-action invite-custom-action--danger" onClick={() => onDelete(selectedBlock.id)}>
                🗑 Remove
              </button>
            </div>
          </section>
        </>
      ) : (
        <section className="invite-custom-section invite-custom-section--tip">
          <p>
            <strong>Move text:</strong> Select a line, then drag it on the card — or grab the ⠿ Drag pill above the text.
          </p>
        </section>
      )}

      <section className="invite-custom-section">
        <h4 className="invite-custom-section__label">Card size</h4>
        <div className="invite-custom-sizes">
          {cardSizeOptions.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`invite-custom-size-pill${cardSize === s.id ? ' is-on' : ''}`}
              onClick={() => onCardSize(s.id)}
            >
              <strong>{s.label}</strong>
              <small>{s.sublabel}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="invite-custom-section invite-custom-section--footer">
        <button type="button" className="invite-custom-add" onClick={onAddText}>
          ＋ Add your own text
        </button>
        <button type="button" className="invite-custom-reset" onClick={onResetLayout}>
          ↺ Reset all positions
        </button>
      </section>
    </aside>
  );
}

export default InvitationCustomizePanel;
