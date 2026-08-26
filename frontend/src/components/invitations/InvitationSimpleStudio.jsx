import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import InvitationCanvasEditor from './InvitationCanvasEditor';
import InvitationCustomizePanel from './InvitationCustomizePanel';
import InvitationEditorToolbar from './InvitationEditorToolbar';
import { InvitationDesign } from '../../models/InvitationDesign';
import { InvitationStudioService } from '../../models/InvitationStudioService';
import { cultureOptions, invitationTemplates } from '../../models/InvitationTemplate';
import { getInvitation } from '../../utils/storage';
import { readImageAsDataUrl } from '../../utils/invitationImage';

const STEPS = [
  { n: 1, label: 'Pick design' },
  { n: 2, label: 'Your details' },
  { n: 3, label: 'Customize' },
];

const BLANK_ID = 'template-blank';

function StepDots({ step }) {
  return (
    <div className="invite-easy-steps">
      {STEPS.map((s) => (
        <div key={s.n} className={`invite-easy-steps__item${step === s.n ? ' is-active' : ''}${step > s.n ? ' is-done' : ''}`}>
          <span className="invite-easy-steps__dot">{step > s.n ? '✓' : s.n}</span>
          <span className="invite-easy-steps__label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

function InvitationSimpleStudio({ profile }) {
  const canvasRef = useRef(null);
  const photoInputRef = useRef(null);
  const [design, setDesign] = useState(() => InvitationDesign.load(profile, getInvitation()));
  const [step, setStep] = useState(1);
  const [culture, setCulture] = useState('all');
  const [query, setQuery] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [moveTogether, setMoveTogether] = useState(false);
  const [photoError, setPhotoError] = useState('');

  const form = design.toJSON();
  const canContinue = form.partnerOne?.trim() && form.partnerTwo?.trim() && form.weddingDate;

  const templates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invitationTemplates.getByCulture(culture).filter((t) => {
      if (t.id === BLANK_ID) return false;
      if (!q) return true;
      return [t.name, t.description, t.culture, t.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [culture, query]);

  const blankTemplate = invitationTemplates.getById(BLANK_ID);

  useEffect(() => {
    setDesign(InvitationDesign.load(profile, getInvitation()));
  }, [profile?.partnerOne, profile?.partnerTwo]);

  const change = useCallback((updates) => {
    setDesign((d) => InvitationStudioService.patch(d, updates));
  }, []);

  const setField = (field) => (e) => change({ [field]: e.target.value });

  const pickTemplate = (id) => {
    setDesign((d) => InvitationStudioService.selectTemplate(d, id));
  };

  const useProfile = () => {
    if (!profile) return;
    setDesign((d) => InvitationStudioService.fillFromProfile(d, profile));
  };

  const goToPreview = () => {
    setSelectedBlockId(null);
    setSelectedImageId(null);
    setDesign((d) => InvitationStudioService.rebuildLayout(d));
    setStep(3);
  };

  const handleEditBlock = (id, props) => {
    if (id === null && !moveTogether) {
      setSelectedBlockId(null);
      return;
    }
    if (moveTogether) {
      setDesign((d) => InvitationStudioService.editAllStyles(d, props));
      return;
    }
    setDesign((d) => InvitationStudioService.editBlock(d, id, props));
  };

  const handleMoveBlock = (id, x, y) => {
    setDesign((d) => {
      if (moveTogether) {
        const src = (d.textBlocks || []).find((b) => b.id === id);
        if (!src) return d;
        return InvitationStudioService.moveAllBlocks(d, x - src.x, y - src.y);
      }
      return InvitationStudioService.moveBlock(d, id, x, y);
    });
  };

  const handleEditBlockText = (id, text) => {
    setDesign((d) => InvitationStudioService.updateBlockText(d, id, text));
  };

  const handleAddText = () => {
    const { design: next, newBlockId } = InvitationStudioService.addBlock(design);
    setDesign(next);
    setSelectedImageId(null);
    if (newBlockId) setSelectedBlockId(newBlockId);
  };

  const handleAddPreset = (preset) => {
    const { design: next, newBlockId } = InvitationStudioService.addPreset(design, preset === 'text' ? 'body' : preset);
    setDesign(next);
    setSelectedImageId(null);
    if (newBlockId) setSelectedBlockId(newBlockId);
  };

  const handleTool = (toolId) => {
    const blocks = design.textBlocks || [];
    const pick = (...ids) => blocks.find((b) => ids.includes(b.id) && b.text?.trim());

    const existing = {
      heading: pick('cultural', 'tagline'),
      names: pick('names', 'partnerOne', 'partnerTwo'),
      date: pick('date', 'time'),
      quote: pick('tagline', 'cultural'),
      text: pick('names', 'cultural', 'tagline', 'date') || blocks.find((b) => b.text?.trim()),
    }[toolId];

    if (existing) {
      setMoveTogether(false);
      setSelectedImageId(null);
      setSelectedBlockId(existing.id);
      return;
    }

    if (toolId === 'text') handleAddText();
    else handleAddPreset(toolId);
  };

  const handleDuplicate = (id) => {
    const { design: next, newBlockId } = InvitationStudioService.duplicateBlock(design, id);
    setDesign(next);
    if (newBlockId) setSelectedBlockId(newBlockId);
  };

  const handleDelete = (id) => {
    setSelectedBlockId(null);
    setDesign((d) => InvitationStudioService.removeBlock(d, id));
  };

  const handleCardSize = (cardSize) => {
    change({ cardSize });
  };

  const resetLayout = () => {
    setSelectedBlockId(null);
    setSelectedImageId(null);
    setDesign((d) => InvitationStudioService.rebuildLayout(d));
  };

  const handlePhotoFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoError('');
    try {
      const src = await readImageAsDataUrl(file);
      const { design: next, imageId } = InvitationStudioService.addImage(design, src);
      setDesign(next);
      setSelectedBlockId(null);
      setSelectedImageId(imageId);
    } catch (err) {
      setPhotoError(err.message || 'Could not add that photo.');
    }
  };

  const download = async () => {
    setSaving(true);
    try {
      await InvitationStudioService.save(design);
      InvitationStudioService.exportPdf(design.toJSON());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`dash-page invite-easy-page${step === 3 ? ' invite-easy-page--customize' : ''}`}>
      {step !== 3 && (
        <div className="invite-easy-hero">
          <h1 className="invite-easy-hero__title">Create your invitation</h1>
          <p className="invite-easy-hero__sub">Pick a design, add names, then style the card</p>
        </div>
      )}

      <StepDots step={step} />

      {step === 1 && (
        <div className="invite-easy-panel">
          <h2 className="invite-easy-panel__title">Which style do you love?</h2>
          <p className="invite-easy-panel__sub">Tap a design — {templates.length + 1} cards</p>

          <label className="invite-easy-search">
            <span className="invite-easy-search__icon" aria-hidden>⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search gold, nikkah, floral, blank…"
              aria-label="Search invitation designs"
            />
          </label>

          <div className="invite-easy-filters">
            {cultureOptions.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`invite-easy-filter${culture === c.id ? ' is-on' : ''}`}
                onClick={() => setCulture(c.id)}
              >
                {c.emoji} {c.label.replace(' Templates', '')}
              </button>
            ))}
          </div>

          <div className="invite-easy-grid">
            {blankTemplate && (!query.trim() || 'blank canvas design yourself'.includes(query.trim().toLowerCase())) && (
              <button
                type="button"
                className={`invite-easy-card invite-easy-card--blank${form.template === blankTemplate.id ? ' is-on' : ''}`}
                onClick={() => pickTemplate(blankTemplate.id)}
              >
                <img src={blankTemplate.decorImage} alt={blankTemplate.name} />
                <span>{blankTemplate.name}</span>
                <small>Design it yourself</small>
                {form.template === blankTemplate.id && <em className="invite-easy-card__badge">Selected</em>}
              </button>
            )}
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`invite-easy-card${form.template === t.id ? ' is-on' : ''}`}
                onClick={() => pickTemplate(t.id)}
              >
                <img src={t.decorImage} alt={t.name} />
                <span>{t.name}</span>
                <small>{t.culture}</small>
                {form.template === t.id && <em className="invite-easy-card__badge">Selected</em>}
              </button>
            ))}
          </div>

          {!templates.length && (
            <p className="invite-easy-note">No designs match that search — try “gold” or “sinhala”.</p>
          )}

          <button type="button" className="invite-easy-btn invite-easy-btn--primary invite-easy-btn--wide" onClick={() => setStep(2)}>
            Next — add your details →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="invite-easy-panel invite-easy-panel--details">
          <div className="invite-easy-details-form">
            <h2 className="invite-easy-panel__title">Your details</h2>
            <p className="invite-easy-panel__sub">Names and date go on the card</p>

            {profile && (
              <button type="button" className="invite-easy-profile" onClick={useProfile}>
                ✨ Fill from my profile
              </button>
            )}

            <div className="invite-easy-form">
              <label className="invite-easy-input">
                <span>💍 First partner&apos;s name</span>
                <input value={form.partnerOne} onChange={setField('partnerOne')} placeholder="e.g. Kaveri" />
              </label>
              <label className="invite-easy-input">
                <span>💍 Second partner&apos;s name</span>
                <input value={form.partnerTwo} onChange={setField('partnerTwo')} placeholder="e.g. Digvijay" />
              </label>
              <label className="invite-easy-input">
                <span>📅 Wedding date</span>
                <input type="date" value={form.weddingDate} onChange={setField('weddingDate')} />
              </label>
              <label className="invite-easy-input">
                <span>🕐 Time</span>
                <input value={form.weddingTime} onChange={setField('weddingTime')} placeholder="11:00 AM" />
              </label>
              <label className="invite-easy-input">
                <span>🏛️ Venue name</span>
                <input value={form.venue} onChange={setField('venue')} placeholder="Majestic Palace Lawns" />
              </label>

              <button type="button" className="invite-easy-more" onClick={() => setShowMore(!showMore)}>
                {showMore ? '▾ Hide extra fields' : '▸ Parents, address & RSVP'}
              </button>

              {showMore && (
                <>
                  <label className="invite-easy-input">
                    <span>👨‍👩‍👧 Parents (Partner 1)</span>
                    <input value={form.parentOneFamily} onChange={setField('parentOneFamily')} placeholder="Mr. & Mrs. Perera" />
                  </label>
                  <label className="invite-easy-input">
                    <span>👨‍👩‍👧 Parents (Partner 2)</span>
                    <input value={form.parentTwoFamily} onChange={setField('parentTwoFamily')} placeholder="Mr. & Mrs. Silva" />
                  </label>
                  <label className="invite-easy-input">
                    <span>📍 Full address</span>
                    <input value={form.venueAddress} onChange={setField('venueAddress')} placeholder="Galle Road, Colombo" />
                  </label>
                  <label className="invite-easy-input">
                    <span>📞 RSVP phone</span>
                    <input value={form.rsvpContact} onChange={setField('rsvpContact')} placeholder="+94 77 123 4567" />
                  </label>
                </>
              )}
            </div>

            {!canContinue && (
              <p className="invite-easy-note">Please add both names and the wedding date to continue.</p>
            )}

            <div className="invite-easy-nav">
              <button type="button" className="invite-easy-btn invite-easy-btn--ghost" onClick={() => setStep(1)}>← Back</button>
              <button
                type="button"
                className="invite-easy-btn invite-easy-btn--primary"
                disabled={!canContinue}
                onClick={goToPreview}
              >
                Design my invitation →
              </button>
            </div>
          </div>

          <div className="invite-easy-details-preview">
            <p className="invite-easy-preview-label">Live preview</p>
            <div className="invite-easy-preview invite-easy-preview--mini">
              <InvitationCanvasEditor design={form} editable={false} />
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="invite-easy-panel invite-easy-panel--customize">
          <div className="invite-easy-customize-layout invite-easy-customize-layout--studio">
            <InvitationEditorToolbar
              photoInputRef={photoInputRef}
              moveTogether={moveTogether}
              onMoveTogether={(on) => {
                setMoveTogether(on);
                if (on) {
                  setSelectedImageId(null);
                  const first = (design.textBlocks || []).find((b) => b.text?.trim());
                  if (first) setSelectedBlockId(first.id);
                }
              }}
              onTool={handleTool}
            />

            <div className="invite-easy-customize-canvas">
              <div className="invite-easy-preview invite-easy-preview--edit" ref={canvasRef}>
                <InvitationCanvasEditor
                  design={form}
                  editable
                  selectedBlockId={selectedBlockId}
                  selectedImageId={selectedImageId}
                  onSelectBlock={setSelectedBlockId}
                  onSelectImage={setSelectedImageId}
                  onMoveBlock={handleMoveBlock}
                  onMoveImage={(id, x, y) => setDesign((d) => InvitationStudioService.moveImage(d, id, x, y))}
                  onTextChange={handleEditBlockText}
                  moveTogether={moveTogether}
                />
              </div>
              <p className="invite-easy-customize-hint">
                {moveTogether
                  ? 'All is on — drag any line to move everything · style changes every line'
                  : 'Drag one line to move it · or tap All to move and style everything'}
              </p>
              {photoError && <p className="invite-easy-note">{photoError}</p>}
            </div>

            <InvitationCustomizePanel
              textBlocks={form.textBlocks || []}
              extraImages={form.extraImages || []}
              selectedBlockId={selectedBlockId}
              selectedImageId={selectedImageId}
              cardSize={form.cardSize}
              editAll={moveTogether}
              onSelectBlock={(id) => {
                setMoveTogether(false);
                setSelectedBlockId(id);
              }}
              onSelectImage={setSelectedImageId}
              onEditBlock={handleEditBlock}
              onEditBlockText={handleEditBlockText}
              onAddText={handleAddText}
              onAddPreset={handleAddPreset}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onBringForward={(id) => setDesign((d) => InvitationStudioService.bringForward(d, id))}
              onSendBack={(id) => setDesign((d) => InvitationStudioService.sendBack(d, id))}
              onResetLayout={resetLayout}
              onCardSize={handleCardSize}
              onUpdateImage={(id, props) => setDesign((d) => InvitationStudioService.updateImage(d, id, props))}
              onDeleteImage={(id) => {
                setSelectedImageId(null);
                setDesign((d) => InvitationStudioService.removeImage(d, id));
              }}
            />
          </div>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handlePhotoFile}
          />

          <button type="button" className="invite-easy-btn invite-easy-btn--download" onClick={download} disabled={saving}>
            {saving ? 'Preparing…' : '⬇ Download your invitation PDF'}
          </button>

          <div className="invite-easy-links">
            <button type="button" onClick={() => { setSelectedBlockId(null); setSelectedImageId(null); setStep(1); }}>Change design</button>
            <span>·</span>
            <button type="button" onClick={() => { setSelectedBlockId(null); setSelectedImageId(null); setStep(2); }}>Edit details</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvitationSimpleStudio;
