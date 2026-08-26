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
  extraOffset = null,
  onSelect,
  onMove,
  onLiveDelta,
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
      onLiveDelta?.({
        id: block.id,
        dx: next.x - drag.startBx,
        dy: next.y - drag.startBy,
      });
    };

    const handleUp = (ev) => {
      const drag = dragRef.current;
      dragRef.current = null;
      setIsDragging(false);
      setLivePos(null);
      onLiveDelta?.(null);

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
  }, [block.id, block.x, block.y, editable, isEditing, onLiveDelta, onMove, onSelect]);

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

  const offsetPos = extraOffset
    ? clampPos(block.x + extraOffset.dx, block.y + extraOffset.dy)
    : null;
  const stylePos = livePos || offsetPos;

  return (
    <div
      ref={rootRef}
      className={`invite-canvas-block${selected ? ' is-selected' : ''}${editable ? ' is-editable' : ''}${isDragging ? ' is-dragging' : ''}${isEditing ? ' is-editing' : ''}`}
      style={blockStyle(block, cardWidth, stylePos)}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      role="textbox"
      tabIndex={editable ? 0 : -1}
      aria-label="Invitation text"
      title={editable ? 'Drag to move' : undefined}
    >
      {editable && (
        <button
          type="button"
          className="invite-canvas-block__drag-bar"
          onPointerDown={handleDragBarDown}
          aria-label="Drag to move"
          title="Drag to move"
        >
          ⠿ Move
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

function CanvasPhoto({
  image,
  selected,
  editable,
  onSelect,
  onMove,
}) {
  const rootRef = useRef(null);
  const dragRef = useRef(null);
  const [livePos, setLivePos] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const x = livePos?.x ?? image.x;
  const y = livePos?.y ?? image.y;

  const beginDrag = useCallback((e, card) => {
    if (!editable) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect?.(image.id);
    const rect = card.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startBx: image.x,
      startBy: image.y,
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
      }
      ev.preventDefault();
      setLivePos(clampPos(
        drag.startBx + (dx / drag.rect.width) * 100,
        drag.startBy + (dy / drag.rect.height) * 100,
      ));
    };

    const handleUp = (ev) => {
      const drag = dragRef.current;
      dragRef.current = null;
      setIsDragging(false);
      setLivePos(null);
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
        onMove?.(image.id, next.x, next.y);
      }
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
  }, [editable, image.id, image.x, image.y, onMove, onSelect]);

  return (
    <div
      ref={rootRef}
      className={`invite-canvas-photo${selected ? ' is-selected' : ''}${isDragging ? ' is-dragging' : ''}`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${image.width}%`,
        height: `${image.height}%`,
        borderRadius: image.shape === 'round' ? '50%' : '10px',
      }}
      onPointerDown={(e) => {
        const card = rootRef.current?.closest('.invite-card');
        if (card) beginDrag(e, card);
      }}
    >
      <img src={image.src} alt="" draggable={false} />
    </div>
  );
}

function InvitationCanvasEditor({
  design,
  selectedBlockId = null,
  selectedImageId = null,
  onSelectBlock,
  onSelectImage,
  onMoveBlock,
  onMoveImage,
  onTextChange,
  editable = true,
  moveTogether = false,
}) {
  const cardRef = useRef(null);
  const [groupDelta, setGroupDelta] = useState(null);
  const template = invitationTemplates.getById(design.template);
  const size = getCardSize(design.cardSize);
  const showArt = design.showDecorations !== false && template.decorImage;
  const blocks = (design.textBlocks || []).filter((b) => b.text?.trim());
  const images = design.extraImages || [];
  const artSrc = template.decorImage;

  const handleBackgroundClick = useCallback(() => {
    if (editable) {
      onSelectBlock?.(null);
      onSelectImage?.(null);
    }
  }, [editable, onSelectBlock, onSelectImage]);

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
      onClick={(e) => {
        if (e.target === e.currentTarget || e.target.classList.contains('invite-photo-decor')) {
          handleBackgroundClick();
        }
      }}
      role="presentation"
    >
      <InvitationPhotoDecor src={artSrc} active={showArt} />

      <div className="invite-canvas-layer">
        {images.map((image) => (
          <CanvasPhoto
            key={image.id}
            image={image}
            selected={selectedImageId === image.id}
            editable={editable}
            onSelect={(id) => {
              onSelectImage?.(id);
              onSelectBlock?.(null);
            }}
            onMove={onMoveImage}
          />
        ))}
        {blocks.map((block) => (
          <CanvasTextBlock
            key={block.id}
            block={block}
            selected={moveTogether || selectedBlockId === block.id}
            cardWidth={size.width}
            editable={editable}
            extraOffset={moveTogether && groupDelta && groupDelta.id !== block.id ? groupDelta : null}
            onSelect={(id) => {
              onSelectBlock?.(id);
              onSelectImage?.(null);
            }}
            onMove={onMoveBlock}
            onLiveDelta={moveTogether ? setGroupDelta : undefined}
            onTextChange={onTextChange}
          />
        ))}
      </div>
    </div>
  );
}

export default InvitationCanvasEditor;
