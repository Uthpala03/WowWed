import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { districts } from '../../data/formOptions';
import { vendorCatalog } from '../../models/VendorCategory';
import { vendorCategoryLabels } from '../../data/dashboardData';
import { useAuth } from '../../context/AuthContext';
import { getOnboarding, getVendorProfile, saveVendorProfile } from '../../utils/storage';
import { api } from '../../services/api';
import { quoteHasPdf, quotePdfHref, resolveUploadUrl } from '../../utils/uploadUrl';
import {
  normalizeStringList,
  toggleListItem,
} from '../../utils/vendorMeta';
import PageHeader from '../../components/ui/PageHeader';
import VendorCard from '../../components/vendor/VendorCard';

const MAX_IMAGES = 6;
const MAX_IMAGE_BYTES = 900000;
const MAX_PDF_BYTES = 2 * 1024 * 1024;

const CATEGORY_EMOJI = {
  'Venue & Res. Halls': '🏛️',
  'Bridal Service': '👰',
  'Groom service': '🤵',
  'Photography & Videography': '📸',
  Jewellary: '💎',
  'Floral & Deco': '🌸',
  Caters: '🍽️',
  Cakes: '🎂',
};

const PRICE_PRESETS = [
  { label: 'Budget', value: '50000-200000' },
  { label: 'Standard', value: '100000-500000' },
  { label: 'Premium', value: '200000-800000' },
  { label: 'Luxury', value: '500000-2000000' },
];

function hasQuoteContent(q) {
  return Boolean(q?.title?.trim() || q?.price || q?.details?.trim() || q?.pdfUrl || q?.pdfData);
}

function activeQuotes(quotations = []) {
  return quotations.filter(hasQuoteContent);
}

function formatPriceRange(range) {
  if (!range) return 'Price on request';
  const [min, max] = String(range).split('-').map((n) => Number(n.trim()));
  if (!min && !max) return 'Price on request';
  const fmt = (n) => (n ? `Rs. ${n.toLocaleString()}` : '');
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min || max);
}

function newQuotation() {
  return { id: `q-${Date.now()}`, title: '', price: '', details: '', pdfName: '', pdfUrl: '' };
}

function categoriesFromSources(onboarding, existing) {
  if (existing?.categories?.length) return existing.categories;
  if (onboarding?.vendorCategories?.length) return onboarding.vendorCategories;
  if (onboarding?.vendorCategory) return [onboarding.vendorCategory];
  if (existing?.category) return [existing.category];
  return [vendorCatalog.getDefault().label];
}

function districtsFromSources(onboarding, existing) {
  if (existing?.districts?.length) return existing.districts;
  if (onboarding?.vendorDistricts?.length) return onboarding.vendorDistricts;
  if (onboarding?.vendorDistrict) return [onboarding.vendorDistrict];
  if (existing?.district) return [existing.district];
  return ['Colombo'];
}

function emptyForm(onboarding, user, existing) {
  return {
    businessName: '',
    categories: categoriesFromSources(onboarding, existing),
    districts: districtsFromSources(onboarding, existing),
    priceRange: '100000-500000',
    description: '',
    portfolioImages: [],
    quotations: [],
    ownerEmail: user?.email,
    ...existing,
    businessName: existing?.businessName || existing?.name || '',
    categories: categoriesFromSources(onboarding, existing),
    districts: districtsFromSources(onboarding, existing),
    portfolioImages: existing?.portfolioImages || [],
    quotations: existing?.quotations || [],
    quotationPdf: existing?.quotationPdf || null,
  };
}

function ListingPreview({ form }) {
  const vendor = {
    name: form.businessName?.trim() || 'Your business name',
    businessName: form.businessName,
    categories: normalizeStringList(form.categories),
    districts: normalizeStringList(form.districts),
    rating: form.rating || 4.5,
    portfolioImages: form.portfolioImages || [],
    quotations: form.quotations || [],
    quotationPdf: form.quotationPdf,
    description: form.description,
    priceRange: form.priceRange,
    spotlight: form.spotlight,
  };

  return (
    <div className="vendor-listing-preview">
      <p className="vendor-listing-preview__label">How couples will see you</p>
      <VendorCard
        preview
        vendor={vendor}
        ctaLabel="Send booking request"
      />
    </div>
  );
}

function VendorSetupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileRef = useRef(null);
  const pdfRef = useRef(null);
  const pdfMainRef = useRef(null);
  const onboarding = getOnboarding();
  const existing = getVendorProfile();
  const [form, setForm] = useState(() => emptyForm(onboarding, user, existing));
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imageError, setImageError] = useState('');
  const [pdfError, setPdfError] = useState('');
  const [pdfTargetId, setPdfTargetId] = useState(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [customPrice, setCustomPrice] = useState(
    !PRICE_PRESETS.some((p) => p.value === (existing?.priceRange || '100000-500000')),
  );

  const setField = (field) => (value) => {
    setSaved(false);
    setForm((f) => ({ ...f, [field]: value }));
  };

  const toggleCategory = (cat) => {
    setSaved(false);
    setForm((f) => ({
      ...f,
      categories: toggleListItem(normalizeStringList(f.categories), cat),
    }));
  };

  const toggleDistrict = (district) => {
    setSaved(false);
    setForm((f) => ({
      ...f,
      districts: toggleListItem(normalizeStringList(f.districts), district),
    }));
  };

  const pickPrice = (value) => {
    setCustomPrice(false);
    setField('priceRange')(value);
  };

  const addImages = (files) => {
    setImageError('');
    const current = form.portfolioImages || [];
    const room = MAX_IMAGES - current.length;
    if (room <= 0) {
      setImageError(`Maximum ${MAX_IMAGES} photos allowed.`);
      return;
    }

    Array.from(files).slice(0, room).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setImageError('Please upload image files only (JPG, PNG).');
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setImageError('Each photo must be under 900 KB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setSaved(false);
        setForm((f) => ({
          ...f,
          portfolioImages: [...(f.portfolioImages || []), reader.result],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setSaved(false);
    setForm((f) => ({
      ...f,
      portfolioImages: f.portfolioImages.filter((_, i) => i !== index),
    }));
  };

  const addQuotation = () => {
    setSaved(false);
    setForm((f) => ({
      ...f,
      quotations: [...(f.quotations || []), newQuotation()],
    }));
  };

  const updateQuotation = (id, patch) => {
    setSaved(false);
    setForm((f) => ({
      ...f,
      quotations: f.quotations.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    }));
  };

  const removeQuotation = (id) => {
    setSaved(false);
    setForm((f) => ({
      ...f,
      quotations: f.quotations.filter((q) => q.id !== id),
    }));
  };

  const uploadPdfFile = (file, { quoteId = null, scope = 'package' } = {}) => {
    setPdfError('');
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setPdfError('Please upload a PDF file only.');
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setPdfError('PDF must be under 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      setUploadingPdf(true);
      try {
        const result = await api.uploadVendorPdf({
          dataUrl: reader.result,
          fileName: file.name,
          quoteId: scope === 'main' ? null : quoteId,
          scope,
        });
        setSaved(false);
        setForm((f) => {
          const quotationPdf = result.quotationPdf ?? f.quotationPdf;
          if (scope === 'main') {
            return { ...f, quotationPdf };
          }
          const quotations = f.quotations.map((q) => (
            q.id === quoteId
              ? { ...q, pdfName: result.fileName, pdfUrl: result.url }
              : q
          ));
          return { ...f, quotationPdf, quotations };
        });
      } catch (err) {
        setPdfError(err.message || 'Could not upload PDF.');
      } finally {
        setUploadingPdf(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const attachPdf = (quoteId, file) => uploadPdfFile(file, { quoteId, scope: 'package' });

  const attachMainPdf = (file) => uploadPdfFile(file, { scope: 'main' });

  const removePdf = (quoteId) => {
    setSaved(false);
    updateQuotation(quoteId, { pdfName: '', pdfUrl: '' });
  };

  const removeMainPdf = () => {
    setSaved(false);
    setForm((f) => ({ ...f, quotationPdf: null }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.businessName.trim()) return;
    if (!form.categories?.length) return;
    if (!form.districts?.length) return;
    setSubmitting(true);
    try {
      await saveVendorProfile({
        ...form,
        id: existing?.listingId || existing?.id || `vp-${user?.id || Date.now()}`,
        listingId: existing?.listingId || existing?.id,
        category: form.categories[0],
        categories: form.categories,
        district: form.districts[0],
        districts: form.districts,
        rating: existing?.rating || 4.5,
        ownerEmail: user.email,
        portfolioImages: form.portfolioImages || [],
        quotations: activeQuotes(form.quotations || []),
        quotationPdf: form.quotationPdf || null,
      });
      if (existing) {
        setSaved(true);
      } else {
        navigate('/vendor');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const descLen = form.description?.length || 0;
  const images = form.portfolioImages || [];
  const quotations = form.quotations || [];

  return (
    <div className="dash-page vendor-listing-page">
      <PageHeader
        moduleId="vendor-profile"
        title="Your public listing"
        tagline="This is what couples see when they search vendors. Keep photos and packages current."
      />

      <div className="vendor-listing-layout">
        <form className="vendor-listing-form" onSubmit={submit}>
          <section className="vendor-listing-section">
            <h2 className="vendor-listing-section__title">
              <span>🏪</span> Business details
            </h2>
            <label className="vendor-listing-field">
              <span>Business name <em>*</em></span>
              <input
                required
                value={form.businessName}
                onChange={(e) => setField('businessName')(e.target.value)}
                placeholder="e.g. Lakmal Sinharage Wedding Studio"
              />
            </label>

            <div className="vendor-listing-field">
              <span>Categories <small>(select all that apply)</small></span>
              <div className="vendor-listing-categories">
                {vendorCategoryLabels.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`vendor-listing-cat${form.categories?.includes(cat) ? ' is-on' : ''}`}
                    onClick={() => toggleCategory(cat)}
                  >
                    <em>{CATEGORY_EMOJI[cat] || '🏪'}</em>
                    <small>{cat}</small>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="vendor-listing-section">
            <h2 className="vendor-listing-section__title">
              <span>📸</span> Portfolio photos
            </h2>
            <p className="vendor-listing-hint">Show your best work — couples love seeing real photos. Up to {MAX_IMAGES} images.</p>

            <div className="vendor-listing-gallery">
              {images.map((src, i) => (
                <div key={`${i}-${String(src).slice(-24)}`} className="vendor-listing-gallery__item">
                  <img src={resolveUploadUrl(src)} alt={`Portfolio ${i + 1}`} />
                  <button type="button" onClick={() => removeImage(i)} aria-label="Remove photo">×</button>
                </div>
              ))}

              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  className="vendor-listing-gallery__add"
                  onClick={() => fileRef.current?.click()}
                >
                  <span>＋</span>
                  <small>Add photo</small>
                </button>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                addImages(e.target.files);
                e.target.value = '';
              }}
            />

            {imageError && <p className="vendor-listing-error">{imageError}</p>}
          </section>

          <section className="vendor-listing-section">
            <h2 className="vendor-listing-section__title">
              <span>💰</span> Packages &amp; quotations
            </h2>
            <p className="vendor-listing-hint">
              Add your service packages so couples know exactly what you offer and how much it costs.
              You can attach a PDF quotation for each package.
            </p>

            <div className="vendor-listing-pdf vendor-listing-pdf--main">
              <span className="vendor-listing-pdf__label">Main quotation PDF <small>(optional — full price list)</small></span>
              {form.quotationPdf?.url ? (
                <div className="vendor-listing-pdf__file">
                  <span>📄 {form.quotationPdf.name}</span>
                  <div className="vendor-listing-pdf__actions">
                    <a href={resolveUploadUrl(form.quotationPdf.url)} target="_blank" rel="noopener noreferrer">View</a>
                    <button type="button" onClick={removeMainPdf}>Remove</button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="vendor-listing-pdf__upload"
                  disabled={uploadingPdf}
                  onClick={() => pdfMainRef.current?.click()}
                >
                  {uploadingPdf ? 'Uploading…' : '📄 Upload full quotation PDF'}
                </button>
              )}
            </div>

            <input
              ref={pdfMainRef}
              type="file"
              accept="application/pdf,.pdf"
              hidden
              onChange={(e) => {
                attachMainPdf(e.target.files?.[0]);
                e.target.value = '';
              }}
            />

            {quotations.length === 0 && (
              <div className="vendor-listing-empty-quote">
                <p>No packages yet — add your first quotation below.</p>
              </div>
            )}

            {quotations.map((q, index) => (
              <div key={q.id} className="vendor-listing-quote">
                <div className="vendor-listing-quote__head">
                  <strong>Package {index + 1}</strong>
                  <button type="button" onClick={() => removeQuotation(q.id)}>Remove</button>
                </div>
                <label className="vendor-listing-field">
                  <span>Package name</span>
                  <input
                    value={q.title}
                    onChange={(e) => updateQuotation(q.id, { title: e.target.value })}
                    placeholder="e.g. Full Day Wedding Coverage"
                  />
                </label>
                <label className="vendor-listing-field">
                  <span>Price (LKR)</span>
                  <input
                    type="number"
                    value={q.price}
                    onChange={(e) => updateQuotation(q.id, { price: e.target.value })}
                    placeholder="e.g. 250000"
                  />
                </label>
                <label className="vendor-listing-field">
                  <span>What&apos;s included</span>
                  <textarea
                    rows={2}
                    value={q.details}
                    onChange={(e) => updateQuotation(q.id, { details: e.target.value })}
                    placeholder="e.g. 8 hours, 400 edited photos, album, drone shots"
                  />
                </label>

                <div className="vendor-listing-pdf">
                  <span className="vendor-listing-pdf__label">Quotation PDF <small>(optional)</small></span>
                  {quoteHasPdf(q) ? (
                    <div className="vendor-listing-pdf__file">
                      <span>📄 {q.pdfName}</span>
                      <div className="vendor-listing-pdf__actions">
                        <a href={quotePdfHref(q)} target="_blank" rel="noopener noreferrer">View</a>
                        <button type="button" onClick={() => removePdf(q.id)}>Remove</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="vendor-listing-pdf__upload"
                      disabled={uploadingPdf}
                      onClick={() => {
                        setPdfTargetId(q.id);
                        pdfRef.current?.click();
                      }}
                    >
                      {uploadingPdf ? 'Uploading…' : '📄 Upload PDF quotation'}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <input
              ref={pdfRef}
              type="file"
              accept="application/pdf,.pdf"
              hidden
              onChange={(e) => {
                if (pdfTargetId) attachPdf(pdfTargetId, e.target.files?.[0]);
                setPdfTargetId(null);
                e.target.value = '';
              }}
            />

            {pdfError && <p className="vendor-listing-error">{pdfError}</p>}

            <button type="button" className="vendor-listing-add-quote" onClick={addQuotation}>
              ＋ Add another package
            </button>
          </section>

          <section className="vendor-listing-section">
            <h2 className="vendor-listing-section__title">
              <span>📍</span> Location &amp; general pricing
            </h2>
            <div className="vendor-listing-field">
              <span>Districts <small>(select all that apply)</small></span>
              <div className="vendor-listing-districts">
                {districts.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`vendor-listing-district${form.districts?.includes(d) ? ' is-on' : ''}`}
                    onClick={() => toggleDistrict(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="vendor-listing-field">
              <span>Overall price range (shown if no packages added)</span>
              <div className="vendor-listing-prices">
                {PRICE_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    className={`vendor-listing-price${!customPrice && form.priceRange === p.value ? ' is-on' : ''}`}
                    onClick={() => pickPrice(p.value)}
                  >
                    <strong>{p.label}</strong>
                    <small>{formatPriceRange(p.value)}</small>
                  </button>
                ))}
                <button
                  type="button"
                  className={`vendor-listing-price${customPrice ? ' is-on' : ''}`}
                  onClick={() => setCustomPrice(true)}
                >
                  <strong>Custom</strong>
                  <small>Your own range</small>
                </button>
              </div>
              {customPrice && (
                <input
                  className="vendor-listing-custom-price"
                  value={form.priceRange}
                  onChange={(e) => setField('priceRange')(e.target.value)}
                  placeholder="e.g. 150000-800000"
                />
              )}
            </div>
          </section>

          <section className="vendor-listing-section">
            <h2 className="vendor-listing-section__title">
              <span>✨</span> About your service
            </h2>
            <label className="vendor-listing-field">
              <span>Description</span>
              <textarea
                rows={5}
                value={form.description}
                onChange={(e) => setField('description')(e.target.value)}
                placeholder="Tell couples about your style, experience, and what makes you special…"
                maxLength={500}
              />
              <small className="vendor-listing-charcount">{descLen}/500 characters</small>
            </label>
          </section>

          <div className="vendor-listing-actions">
            {saved && <p className="vendor-listing-saved">✓ Listing updated successfully!</p>}
            <button type="submit" className="dash-btn dash-btn--primary vendor-listing-submit" disabled={submitting}>
              {submitting ? 'Saving…' : existing ? 'Save changes' : 'Publish listing'}
            </button>
          </div>
        </form>

        <ListingPreview form={form} />
      </div>
    </div>
  );
}

export default VendorSetupPage;
