import { accentPresets, cardSizeOptions, fontOptions } from '../../models/InvitationTemplate';

const BLOCK_LABELS = {
  cultural: 'Title',
  tagline: 'Tagline',
  names: 'Names',
  parentOne: 'Parents (1)',
  parentTwo: 'Parents (2)',
  date: 'Date',
  time: 'Time',
  venue: 'Venue',
  address: 'Address',
  rsvp: 'RSVP',
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
  extraImages = [],
  selectedBlockId,
  selectedImageId,
  cardSize,
  editAll = false,
  onSelectBlock,
  onSelectImage,
  onEditBlock,
  onEditBlockText,
  onAddText,
  onAddPreset,
  onDuplicate,
  onDelete,
  onBringForward,
  onSendBack,
  onResetLayout,
  onCardSize,
  onUpdateImage,
  onDeleteImage,
}) {
  const sortedBlocks = [...textBlocks]
    .filter((b) => b.text?.trim())
    .sort((a, b) => a.y - b.y);

  const selectedBlock = selectedBlockId
    ? textBlocks.find((b) => b.id === selectedBlockId)
    : null;
  const styleBlock = selectedBlock || sortedBlocks[0] || null;
  const selectedImage = selectedImageId
    ? extraImages.find((img) => img.id === selectedImageId)
    : null;

  const fontSize = styleBlock?.fontSize || 20;
  const lineHeight = styleBlock?.lineHeight != null ? Number(styleBlock.lineHeight) : 1.25;
  const styleId = styleBlock?.id || null;

  const bumpSize = (delta) => {
    if (!styleId) return;
    const next = Math.max(8, Math.min(48, fontSize + delta));
    onEditBlock(styleId, { fontSize: next });
  };

  const toggleProp = (prop) => {
    if (!styleId) return;
    onEditBlock(styleId, { [prop]: !styleBlock[prop] });
  };

  const showStyles = !!styleBlock && (editAll || !!selectedBlock);

  return (
    <aside className="invite-custom-panel">
      <div className="invite-custom-panel__head">
        <div>
          <h3 className="invite-custom-panel__title">{editAll ? 'Edit all lines' : 'Edit one line'}</h3>
          <p className="invite-custom-panel__sub">
            {editAll ? 'Font, size, color and spacing apply to every line' : 'Select a line, then style only that one'}
          </p>
        </div>
      </div>

      <section className="invite-custom-section">
        <h4 className="invite-custom-section__label">On this card</h4>
        <div className="invite-custom-parts">
          {sortedBlocks.map((block) => (
            <button
              key={block.id}
              type="button"
              className={`invite-custom-part${(!editAll && selectedBlockId === block.id) || editAll ? ' is-on' : ''}`}
              onClick={() => {
                onSelectImage?.(null);
                onSelectBlock(block.id);
              }}
            >
              <span className="invite-custom-part__name">{blockLabel(block)}</span>
              <span className="invite-custom-part__preview">{block.text}</span>
            </button>
          ))}
          {extraImages.map((img, i) => (
            <button
              key={img.id}
              type="button"
              className={`invite-custom-part${selectedImageId === img.id ? ' is-on' : ''}`}
              onClick={() => {
                onSelectBlock(null);
                onSelectImage?.(img.id);
              }}
            >
              <span className="invite-custom-part__name">Photo {i + 1}</span>
              <span className="invite-custom-part__preview">Tap to resize or remove</span>
            </button>
          ))}
        </div>
        {!sortedBlocks.length && !extraImages.length && (
          <p className="invite-custom-empty">Your card text will appear here. Add text or a photo to start designing.</p>
        )}
      </section>

      {showStyles ? (
        <>
          <section className="invite-custom-section invite-custom-section--highlight">
            <h4 className="invite-custom-section__label">
              {editAll ? 'All details' : blockLabel(styleBlock)}
            </h4>

            {!editAll && (
              <label className="invite-custom-field">
                <span>Words</span>
                <textarea
                  rows={2}
                  value={styleBlock.text}
                  onChange={(e) => onEditBlockText(styleBlock.id, e.target.value)}
                />
              </label>
            )}

            <div className="invite-custom-field">
              <span>Font style</span>
              <div className="invite-custom-fonts">
                {fontOptions.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`invite-custom-font${styleBlock.fontId === f.id ? ' is-on' : ''}`}
                    style={{ fontFamily: f.family }}
                    onClick={() => onEditBlock(styleId, { fontId: f.id })}
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
                  min={8}
                  max={48}
                  step={1}
                  value={fontSize}
                  onChange={(e) => onEditBlock(styleId, { fontSize: Number(e.target.value) })}
                />
                <button type="button" onClick={() => bumpSize(1)} aria-label="Larger">A+</button>
                <strong>{Math.round(fontSize)}</strong>
              </div>
            </div>

            <div className="invite-custom-field">
              <span>Line space</span>
              <div className="invite-custom-size">
                <button
                  type="button"
                  onClick={() => onEditBlock(styleId, { lineHeight: Math.max(0.9, Number((lineHeight - 0.05).toFixed(2))) })}
                  aria-label="Tighter lines"
                >
                  −
                </button>
                <input
                  type="range"
                  min={0.9}
                  max={2.2}
                  step={0.05}
                  value={lineHeight}
                  onChange={(e) => onEditBlock(styleId, { lineHeight: Number(e.target.value) })}
                />
                <button
                  type="button"
                  onClick={() => onEditBlock(styleId, { lineHeight: Math.min(2.2, Number((lineHeight + 0.05).toFixed(2))) })}
                  aria-label="More line space"
                >
                  +
                </button>
                <strong>{lineHeight.toFixed(2)}</strong>
              </div>
            </div>

            <div className="invite-custom-field">
              <span>Text color</span>
              <div className="invite-custom-colors">
                {accentPresets.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`invite-custom-color${styleBlock.color === color ? ' is-on' : ''}`}
                    style={{ background: color }}
                    aria-label={`Color ${color}`}
                    onClick={() => onEditBlock(styleId, { color })}
                  />
                ))}
                <label className="invite-custom-color-pick" title="Custom color">
                  <input
                    type="color"
                    value={styleBlock.color || '#2c2416'}
                    onChange={(e) => onEditBlock(styleId, { color: e.target.value })}
                    aria-label="Pick a custom color"
                  />
                </label>
              </div>
            </div>

            <div className="invite-custom-field">
              <span>Letter spacing</span>
              <div className="invite-custom-size">
                <input
                  type="range"
                  min={-0.04}
                  max={0.35}
                  step={0.01}
                  value={styleBlock.letterSpacing ?? (styleBlock.uppercase ? 0.08 : 0)}
                  onChange={(e) => onEditBlock(styleId, { letterSpacing: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="invite-custom-field">
              <span>Look</span>
              <div className="invite-custom-toggles">
                <ToggleBtn active={styleBlock.bold} onClick={() => toggleProp('bold')} title="Bold">
                  <strong>B</strong>
                </ToggleBtn>
                <ToggleBtn active={styleBlock.italic} onClick={() => toggleProp('italic')} title="Italic">
                  <em>I</em>
                </ToggleBtn>
                <ToggleBtn active={styleBlock.uppercase} onClick={() => toggleProp('uppercase')} title="All caps">
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
                    active={(styleBlock.align || 'center') === a.id}
                    onClick={() => onEditBlock(styleId, { align: a.id })}
                    title={a.title}
                  >
                    {a.label}
                  </ToggleBtn>
                ))}
              </div>
            </div>

            {!editAll && (
              <div className="invite-custom-actions">
                <button type="button" className="invite-custom-action" onClick={() => onBringForward?.(styleBlock.id)}>
                  ↑ Front
                </button>
                <button type="button" className="invite-custom-action" onClick={() => onSendBack?.(styleBlock.id)}>
                  ↓ Back
                </button>
                <button type="button" className="invite-custom-action" onClick={() => onDuplicate(styleBlock.id)}>
                  Copy
                </button>
                <button type="button" className="invite-custom-action invite-custom-action--danger" onClick={() => onDelete(styleBlock.id)}>
                  Remove
                </button>
              </div>
            )}
          </section>
        </>
      ) : selectedImage ? (
        <section className="invite-custom-section invite-custom-section--highlight">
          <h4 className="invite-custom-section__label">Photo</h4>
          <div className="invite-custom-field">
            <span>Shape</span>
            <div className="invite-custom-toggles">
              <ToggleBtn
                active={selectedImage.shape !== 'rect'}
                onClick={() => onUpdateImage?.(selectedImage.id, { shape: 'round' })}
                title="Round"
              >
                ○
              </ToggleBtn>
              <ToggleBtn
                active={selectedImage.shape === 'rect'}
                onClick={() => onUpdateImage?.(selectedImage.id, { shape: 'rect' })}
                title="Rectangle"
              >
                ▭
              </ToggleBtn>
            </div>
          </div>
          <div className="invite-custom-field">
            <span>Size</span>
            <div className="invite-custom-size">
              <input
                type="range"
                min={14}
                max={70}
                step={1}
                value={selectedImage.width}
                onChange={(e) => {
                  const width = Number(e.target.value);
                  const height = selectedImage.shape === 'round' ? width * 0.75 : selectedImage.height;
                  onUpdateImage?.(selectedImage.id, { width, height });
                }}
              />
            </div>
          </div>
          <div className="invite-custom-actions">
            <button type="button" className="invite-custom-action invite-custom-action--danger" onClick={() => onDeleteImage?.(selectedImage.id)}>
              Remove photo
            </button>
          </div>
        </section>
      ) : (
        <p className="invite-custom-empty">Tap a line on the card or pick one above.</p>
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
