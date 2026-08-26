import { useOutletContext } from 'react-router-dom';
import InvitationSimpleStudio from '../../components/invitations/InvitationSimpleStudio';
import { getWeddingProfile } from '../../utils/storage';

function InvitationsPage() {
  const coupleData = useOutletContext();
  const profile = coupleData?.profile || getWeddingProfile();
  return <InvitationSimpleStudio profile={profile} />;
}

export default InvitationsPage;
