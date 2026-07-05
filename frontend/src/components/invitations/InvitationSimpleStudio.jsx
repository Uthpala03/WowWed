import { useCallback, useEffect, useRef, useState } from 'react';
import InvitationCanvasEditor from './InvitationCanvasEditor';
import InvitationCustomizePanel from './InvitationCustomizePanel';
import { InvitationDesign } from '../../models/InvitationDesign';
import { InvitationStudioService } from '../../models/InvitationStudioService';
import { cultureOptions, invitationTemplates } from '../../models/InvitationTemplate';
import { getInvitation } from '../../utils/storage';

const STEPS = [
  { n: 1, label: 'Pick design' },
  { n: 2, label: 'Your details' },
  { n: 3, label: 'Customize' },
];

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
  const [design, setDesign] = useState(() => InvitationDesign.load(profile, getInvitation()));
  const [step, setStep] = useState(1);
  const [culture, setCulture] = useState('all');
  const [showMore, setShowMore] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [saving, setSaving] = useState(false);

  const form = design.toJSON();
  const templates = invitationTemplates.getByCulture(culture);
  const canContinue = form.partnerOne?.trim() && form.partnerTwo?.trim() && form.weddingDate;

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
    setDesign((d) => InvitationStudioService.rebuildLayout(d));
    setStep(3);
  };

  const handleEditBlock = (id, props) => {
    if (id === null) {
      setSelectedBlockId(null);
      return;
    }
    setDesign((d) => InvitationStudioService.editBlock(d, id, props));
  };

  const handleMoveBlock = (id, x, y) => {
    setDesign((d) => InvitationStudioService.moveBlock(d, id, x, y));
  };

  const handleEditBlockText = (id, text) => {
    setDesign((d) => InvitationStudioService.updateBlockText(d, id, text));
  };

  const handleTextChange = handleEditBlockText;

  const handleAddText = () => {
    const { design: next, newBlockId } = InvitationStudioService.addBlock(design);
    setDesign(next);
    if (newBlockId) setSelectedBlockId(newBlockId);
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
    setDesign((d) => InvitationStudioService.rebuildLayout(d));
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
      <div className="invite-easy-hero">
        <h1 className="invite-easy-hero__title">Create your invitation</h1>
        <p className="invite-easy-hero__sub">3 easy steps — no design skills needed</p>
      </div>

      <StepDots step={step} />

      {step === 1 && (
        <div className="invite-easy-panel">
          <h2 className="invite-easy-panel__title">Which style do you love?</h2>
          <p className="invite-easy-panel__sub">Tap a design to select it</p>

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
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`invite-easy-card${form.template === t.id ? ' is-on' : ''}`}
                onClick={() => pickTemplate(t.id)}
              >
                <img src={t.decorImage} alt={t.name} />
                <span>{t.name}</span>
                {form.template === t.id && <em className="invite-easy-card__badge">Selected</em>}
              </button>
            ))}
          </div>

          <button type="button" className="invite-easy-btn invite-easy-btn--primary invite-easy-btn--wide" onClick={() => setStep(2)}>
            Next — add your details →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="invite-easy-panel invite-easy-panel--details">
          <div className="invite-easy-details-form">
            <h2 className="invite-easy-panel__title">Tell us about your day</h2>
            <p className="invite-easy-panel__sub">We&apos;ll add all the details to your card — just like a real invitation</p>

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
                See my invitation →
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
          <div className="invite-easy-customize-header">
            <h2 className="invite-easy-panel__title">Make it yours ✨</h2>
            <p className="invite-easy-panel__sub">Pick text on the right · Drag on the card · Download when ready</p>
          </div>

          <div className="invite-easy-customize-layout">
            <div className="invite-easy-customize-canvas">
              <div className="invite-easy-preview invite-easy-preview--edit" ref={canvasRef}>
                <InvitationCanvasEditor
                  design={form}
                  editable
                  minimal
                  selectedBlockId={selectedBlockId}
                  onSelectBlock={setSelectedBlockId}
                  onMoveBlock={handleMoveBlock}
                  onTextChange={handleTextChange}
                />
              </div>
              <p className="invite-easy-customize-hint">
                Click text to select · <strong>Drag anywhere</strong> to move · Double-click to edit on card
              </p>
            </div>

            <InvitationCustomizePanel
              textBlocks={form.textBlocks || []}
              selectedBlockId={selectedBlockId}
              cardSize={form.cardSize}
              onSelectBlock={setSelectedBlockId}
              onEditBlock={handleEditBlock}
              onEditBlockText={handleEditBlockText}
              onAddText={handleAddText}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onResetLayout={resetLayout}
              onCardSize={handleCardSize}
            />
          </div>

          <button type="button" className="invite-easy-btn invite-easy-btn--download" onClick={download} disabled={saving}>
            {saving ? 'Preparing…' : '⬇ Download your invitation PDF'}
          </button>

          <div className="invite-easy-links">
            <button type="button" onClick={() => { setSelectedBlockId(null); setStep(1); }}>Change design</button>
            <span>·</span>
            <button type="button" onClick={() => { setSelectedBlockId(null); setStep(2); }}>Edit details</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvitationSimpleStudio;
