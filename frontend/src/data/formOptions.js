export const ceremonyTypes = ['Poruwa', 'Christian', 'Muslim', 'Civil'];

export const onboardingCeremonyTypes = [
  { id: 'poruwa', label: 'Poruwa', icon: 'poruwa', accent: { bg: '#fff4e6', color: '#c45c00' } },
  { id: 'church', label: 'Church', icon: 'church', accent: { bg: '#eef0ff', color: '#3949ab' } },
  { id: 'both', label: 'Poruwa & Church', icon: 'dualCeremony', accent: { bg: '#f6ecff', color: '#7b1fa2' } },
  { id: 'reception', label: 'Reception only', icon: 'reception', accent: { bg: '#fffbe6', color: '#b8860b' } },
];

export const venueTypes = [
  { id: 'indoor', label: 'Indoor', icon: 'indoor', accent: { bg: '#ede7f6', color: '#5e35b1' } },
  { id: 'outdoor', label: 'Outdoor', icon: 'outdoor', accent: { bg: '#e0f5ec', color: '#2e7d5a' } },
  { id: 'mixed', label: 'Mixed', icon: 'mixed', accent: { bg: '#e8f4fc', color: '#1565c0' } },
];

export const planningStages = [
  { id: 'not-engaged', label: 'Not yet engaged', icon: 'hearts', accent: { bg: '#ffeef3', color: '#c2185b' } },
  { id: 'newly-engaged', label: 'Newly engaged and exploring', icon: 'couple', accent: { bg: '#fff0eb', color: '#d84315' } },
  { id: 'planning-no-venue', label: "Planning mode but haven't booked a venue yet", icon: 'calendar', accent: { bg: '#e8f2ff', color: '#1565c0' } },
  { id: 'planning-venue', label: 'Planning mode and already booked a venue', icon: 'pin', accent: { bg: '#e6f6ee', color: '#2e7d32' } },
  { id: 'almost-done', label: 'Almost done, just the details left', icon: 'check', accent: { bg: '#fff8e1', color: '#f57c00' } },
];

export const weddingRoles = [
  { id: 'couple', label: "I'm getting married", icon: 'hearts', accent: { bg: '#ffeef3', color: '#c2185b' } },
  { id: 'vendor', label: "I'm a vendor", icon: 'venue', accent: { bg: '#eef0ff', color: '#3949ab' } },
];

export const vendorStages = [
  { id: 'new-business', label: 'Just starting my wedding business', icon: 'sprout', accent: { bg: '#e8f8ef', color: '#2e7d32' } },
  { id: 'new-to-wowwed', label: "I have a business but I'm new to WowWed", icon: 'newBadge', accent: { bg: '#e3f0ff', color: '#1565c0' } },
  { id: 'expanding', label: 'Listed elsewhere and want to reach more couples', icon: 'megaphone', accent: { bg: '#fff3e0', color: '#ef6c00' } },
  { id: 'ready', label: 'Established and ready to receive bookings', icon: 'verified', accent: { bg: '#e0f7fa', color: '#00838f' } },
];

export const vendorCategoryIcons = {
  'Venue & Res. Halls': 'venue',
  'Bridal Service': 'bridal',
  'Groom service': 'groom',
  'Photography & Videography': 'camera',
  'Jewellary': 'ring',
  'Floral & Deco': 'floral',
  'Caters': 'catering',
  'Cakes': 'cake',
};

export const vendorCategoryOptions = [
  { label: 'Venue & Res. Halls', icon: 'venue', accent: { bg: '#ede7f6', color: '#5e35b1' } },
  { label: 'Bridal Service', icon: 'bridal', accent: { bg: '#ffeef3', color: '#c2185b' } },
  { label: 'Groom service', icon: 'groom', accent: { bg: '#e8f2ff', color: '#1565c0' } },
  { label: 'Photography & Videography', icon: 'camera', accent: { bg: '#f3e8ff', color: '#7b1fa2' } },
  { label: 'Jewellary', icon: 'ring', accent: { bg: '#fff8e1', color: '#b8860b' } },
  { label: 'Floral & Deco', icon: 'floral', accent: { bg: '#e8f8ef', color: '#388e3c' } },
  { label: 'Caters', icon: 'catering', accent: { bg: '#fff3e0', color: '#e65100' } },
  { label: 'Cakes', icon: 'cake', accent: { bg: '#fce4ec', color: '#ad1457' } },
];

export const districts = [
  'Ampara',
  'Anuradhapura',
  'Badulla',
  'Batticaloa',
  'Colombo',
  'Galle',
  'Gampaha',
  'Hambantota',
  'Jaffna',
  'Kalutara',
  'Kandy',
  'Kegalle',
  'Kilinochchi',
  'Kurunegala',
  'Mannar',
  'Matale',
  'Matara',
  'Monaragala',
  'Mullaitivu',
  'Nuwara Eliya',
  'Polonnaruwa',
  'Puttalam',
  'Ratnapura',
  'Trincomalee',
  'Vavuniya',
];

export const weddingScales = [
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'luxury', label: 'Luxury' },
];

export function optionStyle(accent) {
  if (!accent) return undefined;
  return {
    '--opt-bg': accent.bg,
    '--opt-color': accent.color,
  };
}
