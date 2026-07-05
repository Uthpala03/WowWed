import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { districts } from '../../data/formOptions';
import { vendorCatalog } from '../../models/VendorCategory';
import { vendorCategories } from '../../data/dashboardData';
import { useAuth } from '../../context/AuthContext';
import { getOnboarding, getVendorProfile, saveVendorProfile } from '../../utils/storage';
import PageHeader from '../../components/ui/PageHeader';

function VendorSetupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const onboarding = getOnboarding();
  const existing = getVendorProfile();
  const [form, setForm] = useState(existing || {
    businessName: '',
    category: onboarding?.vendorCategory || vendorCatalog.getDefault().label,
    district: onboarding?.vendorDistrict || 'Colombo',
    priceRange: '100000-500000',
    description: '',
    ownerEmail: user?.email,
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.businessName.trim()) return;
    setSubmitting(true);
    try {
      await saveVendorProfile({
        ...form,
        id: existing?.id || `vp-${user?.id || Date.now()}`,
        rating: 4.5,
        ownerEmail: user.email,
      });
      navigate('/vendor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dash-page">
      <PageHeader moduleId="vendor-profile" title="Vendor listing" />
      <form className="dash-card form" onSubmit={submit} style={{ maxWidth: 560 }}>
        <label className="dash-field"><span>Business name *</span><input required value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} /></label>
        <label className="dash-field"><span>Category</span>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {vendorCategories.filter((c) => c !== 'All Categories').map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="dash-field"><span>District</span>
          <select value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}>
            {districts.map((d) => <option key={d}>{d}</option>)}
          </select>
        </label>
        <label className="dash-field"><span>Price range (LKR)</span><input value={form.priceRange} onChange={(e) => setForm({ ...form, priceRange: e.target.value })} placeholder="e.g. 150000-800000" /></label>
        <label className="dash-field"><span>Description</span><textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <button type="submit" className="dash-btn dash-btn--primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Publish listing'}
        </button>
      </form>
    </div>
  );
}

export default VendorSetupPage;
