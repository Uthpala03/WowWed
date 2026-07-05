import InvitationPhotoDecor from './InvitationPhotoDecor';
import {
  fontOptions,
  formatInviteDate,
  getCardSize,
  getResolvedColors,
  invitationTemplates,
} from '../../models/InvitationTemplate';

function CardText({ design, namesClass }) {
  const timeRange = [design.weddingTime, design.weddingEndTime].filter(Boolean).join(' – ');

  return (
    <div className="invite-layout-photo">
      {design.culturalTitle && <p className="invite-card__cultural">{design.culturalTitle}</p>}
      <h2 className={`invite-card__names${namesClass}`}>
        <span>{design.partnerOne || 'Partner 1'}</span>
        <span className="invite-card__amp">&</span>
        <span>{design.partnerTwo || 'Partner 2'}</span>
      </h2>
      {design.message && <p className="invite-card__message">{design.message}</p>}
      <div className="invite-card__details">
        {design.weddingDate && <p className="invite-card__date">{formatInviteDate(design.weddingDate)}</p>}
        {timeRange && <p className="invite-card__time">{timeRange}</p>}
        {(design.venue || design.district) && (
          <p className="invite-card__venue">{[design.venue, design.district].filter(Boolean).join(' · ')}</p>
        )}
        {design.ceremonyNote && <p className="invite-card__ceremony">{design.ceremonyNote}</p>}
      </div>
    </div>
  );
}

function InvitationPreview({ design, compact = false }) {
  const template = invitationTemplates.getById(design.template);
  const font = fontOptions.find((f) => f.id === design.font) || fontOptions[0];
  const colors = getResolvedColors(design);
  const size = getCardSize(design.cardSize);
  const namesClass = font.namesOnly ? ' invite-card__names--script' : '';
  const showArt = design.showDecorations !== false && template.decorImage;
  const inset = template.contentInset;

  return (
    <div
      className={`invite-card invite-card--${template.id} invite-card--size-${design.cardSize || 'portrait-5x7'}${showArt ? ' invite-card--photo-decor' : ''}${compact ? ' invite-card--compact' : ''}`}
      style={{
        '--invite-accent': colors.accent,
        '--invite-text': colors.text,
        '--invite-font': font.family,
        '--invite-width': `${size.width}px`,
        '--invite-height': `${size.height}px`,
        '--panel-top': inset.top,
        '--panel-right': inset.right,
        '--panel-bottom': inset.bottom,
        '--panel-left': inset.left,
      }}
    >
      <InvitationPhotoDecor src={template.decorImage} active={showArt} />

      <div className="invite-card__frame">
        <div className="invite-card__inner">
          <CardText design={design} namesClass={namesClass} />
        </div>
      </div>
    </div>
  );
}

export default InvitationPreview;
