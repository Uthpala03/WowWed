import InvitationSimpleStudio from '../../components/invitations/InvitationSimpleStudio';
import { getWeddingProfile } from '../../utils/storage';

function InvitationsPage() {
  const profile = getWeddingProfile();
  return <InvitationSimpleStudio profile={profile} />;
}

export default InvitationsPage;
