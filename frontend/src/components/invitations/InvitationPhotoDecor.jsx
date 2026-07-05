import { invitationAssetUrl } from '../../utils/invitationAssets';

function InvitationPhotoDecor({ src, active }) {
  if (!active || !src) return null;
  return (
    <img
      src={src}
      className="invite-photo-decor"
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}

export { invitationAssetUrl };
export default InvitationPhotoDecor;
