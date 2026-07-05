import { useCallback, useEffect, useRef, useState } from 'react';
import InvitationPhotoDecor from './InvitationPhotoDecor';
import { getCardSize, invitationTemplates } from '../../models/InvitationTemplate';
import { getInvitationBlockStyle } from '../../utils/invitationBlockStyle';

const DRAG_THRESHOLD = 3;

function blockStyle(block, cardWidth, livePos) {
  return getInvitationBlockStyle(block, cardWidth, livePos);
}

function clampPos(x, y) {
  return {
    x: Math.max(2, Math.min(98, x)),
    y: Math.max(2, Math.min(98, y)),
  };
}

function CanvasTextBlock({
  block,
  selected,
  cardWidth,
  editable,
  onSelect,
  onMove,
  onTextChange,
}) {
  const rootRef = useRef(null);
  const textRef = useRef(null);
  const dragRef = useRef(null);
  const [livePos, setLivePos] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!selected) {
      setIsEditing(false);
    }
  }, [selected]);

  const beginDrag = useCallback((e, card) => {
    if (!editable || isEditing) return;

    e.preventDefault();
    e.stopPropagation();
    onSelect?.(block.id);

    const rect = card.getBoundingClientRect();
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startBx: block.x,
      startBy: block.y,
      rect,
      active: false,
    };

    const handleMove = (ev) => {
      const drag = dragRef.current;
      if (!drag) return;

      const dx = ev.clientX - drag.startX;
      const dy = ev.clientY - drag.startY;

      if (!drag.active) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        drag.active = true;
        setIsDragging(true);
        rootRef.current?.setPointerCapture?.(ev.pointerId);
      }

      ev.preventDefault();
      const next = clampPos(
        drag.startBx + (dx / drag.rect.width) * 100,
        drag.startBy + (dy / drag.rect.height) * 100,
      );
      setLivePos(next);
    };

    const handleUp = (ev) => {
      const drag = dragRef.current;
      dragRef.current = null;
      setIsDragging(false);
      setLivePos(null);

      if (rootRef.current?.hasPointerCapture?.(ev.pointerId)) {
        rootRef.current.releasePointerCapture(ev.pointerId);
      }

      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);

      if (drag?.active) {
        const dx = ev.clientX - drag.startX;
        const dy = ev.clientY - drag.startY;
        const next = clampPos(
          drag.startBx + (dx / drag.rect.width) * 100,
          drag.startBy + (dy / drag.rect.height) * 100,
        );
        onMove?.(block.id, next.x, next.y);
      }
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
  }, [block.id, block.x, block.y, editable, isEditing, onMove, onSelect]);

  const handlePointerDown = (e) => {
    if (!editable) return;
    const card = rootRef.current?.closest('.invite-card');
    if (!card) return;
    beginDrag(e, card);
  };

  const handleDragBarDown = (e) => {
    if (!editable) return;
    e.stopPropagation();
    const card = rootRef.current?.closest('.invite-card');
    if (!card) return;
    beginDrag(e, card);
  };

  const handleDoubleClick = (e) => {
    if (!editable) return;
    e.stopPropagation();
    onSelect?.(block.id);
    setIsEditing(true);
    requestAnimationFrame(() => {
      const el = textRef.current;
      if (!el) return;
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    });
  };

  const handleBlur = (e) => {
    if (!editable) return;
    setIsEditing(false);
    onTextChange?.(block.id, e.currentTarget.textContent || '');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      textRef.current?.blur();
    }
  };

  return (
    <div
      ref={rootRef}
      className={`invite-canvas-block${selected ? ' is-selected' : ''}${editable ? ' is-editable' : ''}${isDragging ? ' is-dragging' : ''}${isEditing ? ' is-editing' : ''}`}
      style={blockStyle(block, cardWidth, livePos)}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      role="textbox"
      tabIndex={editable ? 0 : -1}
      aria-label="Invitation text"
    >
      {selected && editable && (
        <button
          type="button"
          className="invite-canvas-block__drag-bar"
          onPointerDown={handleDragBarDown}
          aria-label="Drag to move"
          title="Drag to move"
        >
          ⠿ Drag
        </button>
      )}

      {editable ? (
        <span
          ref={textRef}
          className="invite-canvas-block__text"
          contentEditable={isEditing}
          suppressContentEditableWarning
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        >
          {block.text}
        </span>
      ) : (
        <span className="invite-canvas-block__text">{block.text}</span>
      )}
    </div>
  );
}

function InvitationCanvasEditor({
  design,
  selectedBlockId = null,
  onSelectBlock,
  onMoveBlock,
  onTextChange,
  editable = true,
  minimal = false,
}) {
  const cardRef = useRef(null);
  const template = invitationTemplates.getById(design.template);
  const size = getCardSize(design.cardSize);
  const showArt = design.showDecorations !== false && template.decorImage;
  const blocks = (design.textBlocks || []).filter((b) => b.text?.trim());
  const artSrc = template.decorImage;

  const handleBackgroundClick = useCallback(() => {
    if (editable) onSelectBlock?.(null);
  }, [editable, onSelectBlock]);

  return (
    <div
      ref={cardRef}
      className={`invite-card invite-card--canvas invite-card--${template.id} invite-card--size-${design.cardSize || 'portrait-5x7'}${showArt ? ' invite-card--photo-decor' : ''}`}
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
        minHeight: `${size.height}px`,
        '--invite-width': `${size.width}px`,
        '--invite-height': `${size.height}px`,
        ...(showArt ? {
          backgroundImage: `url("${artSrc}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        } : {}),
      }}
      onClick={handleBackgroundClick}
      role="presentation"
    >
      <InvitationPhotoDecor src={artSrc} active={showArt} />

      <div className="invite-canvas-layer">
        {blocks.map((block) => (
          <CanvasTextBlock
            key={block.id}
            block={block}
            selected={selectedBlockId === block.id}
            cardWidth={size.width}
            editable={editable}
            onSelect={onSelectBlock}
            onMove={onMoveBlock}
            onTextChange={onTextChange}
          />
        ))}
      </div>
    </div>
  );
}

export default InvitationCanvasEditor;
