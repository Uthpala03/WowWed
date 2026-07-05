/** @typedef {'sinhala'|'church'|'tamil'|'muslim'|'luxury'|'modern'} TemplateCulture */

const DEFAULT_INSET = { top: '18%', right: '11%', bottom: '20%', left: '11%' };
const TOP_INSET = { top: '12%', right: '10%', bottom: '32%', left: '10%' };
const CENTER_INSET = { top: '22%', right: '12%', bottom: '22%', left: '12%' };

export const TEMPLATE_DEFINITIONS = [
  { id: 'template-01', file: 'template-01.png', name: 'Black Gold Filigree', description: 'Luxury marble · gold line florals', category: 'Luxury', culture: 'luxury', accent: '#c9a227', text: '#2c2416', font: 'classic', inset: CENTER_INSET },
  { id: 'template-02', file: 'template-02.png', name: 'Luxury Floral Frame', description: 'Pink roses · gold foil border', category: 'Luxury', culture: 'luxury', accent: '#8b4557', text: '#5c3344', font: 'elegant', inset: DEFAULT_INSET },
  { id: 'template-03', file: 'template-03.png', name: 'Elegant Gold Border', description: 'Sage watercolor · gold frame', category: 'Church', culture: 'church', accent: '#4a7c59', text: '#2c3e2c', font: 'serif', inset: DEFAULT_INSET },
  { id: 'template-04', file: 'template-04.png', name: 'Gold Heart Arch', description: 'Green tuxedo couple · floral arch', category: 'Church', culture: 'church', accent: '#2d5a3d', text: '#2c3e2c', font: 'elegant', inset: TOP_INSET },
  { id: 'template-05', file: 'template-05.png', name: 'Sage Anemone', description: 'Soft watercolor · gold accents', category: 'Modern', culture: 'modern', accent: '#5a7a6a', text: '#3d4a42', font: 'serif', inset: DEFAULT_INSET },
  { id: 'template-06', file: 'template-06.png', name: 'Hexagon Floral', description: 'Modern geometric · pencil florals', category: 'Modern', culture: 'modern', accent: '#6b5b4f', text: '#3d3428', font: 'classic', inset: CENTER_INSET },
  { id: 'template-07', file: 'template-07.png', name: 'Black Gold Silhouette', description: 'Evening glamour · gold couple', category: 'Luxury', culture: 'luxury', accent: '#d4af37', text: '#2c2416', font: 'elegant', inset: { top: '15%', right: '10%', bottom: '28%', left: '10%' } },
  { id: 'template-08', file: 'template-08.png', name: 'Tamil Ganesha Marble', description: 'Marble texture · Ganesha blessing', category: 'Tamil', culture: 'tamil', accent: '#5a7247', text: '#3d4a36', font: 'serif', inset: { top: '20%', right: '10%', bottom: '30%', left: '10%' }, culturalTitle: 'திருமண அழைப்பிதழ்' },
  { id: 'template-09', file: 'template-09.png', name: 'Burgundy Watercolor', description: 'Deep rose · gold splatter', category: 'Romantic', culture: 'church', accent: '#8b3a4a', text: '#4a2820', font: 'elegant', inset: DEFAULT_INSET },
  { id: 'template-10', file: 'template-10.png', name: 'Cream Floral Ring', description: 'Delicate bouquet · gold ring', category: 'Church', culture: 'church', accent: '#b8860b', text: '#4a3828', font: 'elegant', inset: DEFAULT_INSET },
  { id: 'template-11', file: 'template-11.png', name: 'White Peony Rings', description: 'Top & bottom florals · gold rings', category: 'Church', culture: 'church', accent: '#6b8f71', text: '#3d4a42', font: 'classic', inset: { top: '22%', right: '10%', bottom: '24%', left: '10%' } },
  { id: 'template-12', file: 'template-12.png', name: 'Sinhala Kandyan Couple', description: 'Traditional attire · white roses', category: 'Sinhala', culture: 'sinhala', accent: '#b8860b', text: '#2c2416', font: 'elegant', inset: { top: '10%', right: '8%', bottom: '30%', left: '8%' }, culturalTitle: 'ශ්‍රී සුබ මංගලම්' },
  { id: 'template-13', file: 'template-13.png', name: 'Boho Terracotta', description: 'Earthy leaves · gold splatter', category: 'Modern', culture: 'modern', accent: '#a67c52', text: '#4a3828', font: 'serif', inset: DEFAULT_INSET },
  { id: 'template-14', file: 'template-14.png', name: 'Muslim Nikkah Rose', description: 'Thobe & blush gown · mauve florals', category: 'Muslim', culture: 'muslim', accent: '#8e6e73', text: '#4a3828', font: 'classic', inset: { top: '10%', right: '10%', bottom: '32%', left: '10%' }, culturalTitle: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم' },
  { id: 'template-15', file: 'template-15.png', name: 'Eucalyptus Modern', description: 'Gold rings · greenery frame', category: 'Modern', culture: 'modern', accent: '#5a7247', text: '#2c3e2c', font: 'serif', inset: { top: '12%', right: '8%', bottom: '28%', left: '8%' } },
  { id: 'template-16', file: 'template-16.png', name: 'Neutral 3D Floral', description: 'Beige blooms · gold circle', category: 'Modern', culture: 'modern', accent: '#a69076', text: '#4a4038', font: 'elegant', inset: { top: '28%', right: '10%', bottom: '18%', left: '10%' } },
  { id: 'template-17', file: 'template-17.png', name: '3D Gold Roses', description: 'Pixar couple · luxury roses', category: 'Luxury', culture: 'luxury', accent: '#c9a227', text: '#4a3828', font: 'elegant', inset: { top: '14%', right: '10%', bottom: '30%', left: '10%' } },
  { id: 'template-18', file: 'template-18.png', name: 'Black Marble Gold', description: 'Dark marble · gold corner florals', category: 'Luxury', culture: 'luxury', accent: '#d4af37', text: '#2c2416', font: 'classic', inset: CENTER_INSET },
  { id: 'template-19', file: 'template-19.png', name: 'Satin Gold Rings', description: 'Black satin · interlocking rings', category: 'Luxury', culture: 'luxury', accent: '#d4af37', text: '#3d3420', font: 'classic', inset: { top: '18%', right: '12%', bottom: '18%', left: '12%' } },
  { id: 'template-20', file: 'template-20.png', name: 'Gold Bokeh Couple', description: 'Warm bokeh · 3D couple portrait', category: 'Church', culture: 'church', accent: '#b8860b', text: '#4a3828', font: 'elegant', inset: { top: '12%', right: '10%', bottom: '32%', left: '10%' } },
  { id: 'template-21', file: 'template-21.png', name: 'Green Gold Botanical', description: 'Olive botanical · formal script', category: 'Church', culture: 'church', accent: '#5a7247', text: '#2c3e2c', font: 'classic', inset: DEFAULT_INSET },
  { id: 'template-22', file: 'template-22.png', name: 'Classic White Floral', description: 'White roses · geometric gold', category: 'Church', culture: 'church', accent: '#6b8f71', text: '#3d4a42', font: 'serif', inset: { top: '20%', right: '10%', bottom: '22%', left: '10%' } },
  { id: 'template-23', file: 'template-23.png', name: 'Romantic Script', description: 'Blush corner florals · script', category: 'Romantic', culture: 'church', accent: '#b5496b', text: '#5c3344', font: 'elegant', inset: DEFAULT_INSET },
  { id: 'template-24', file: 'template-24.png', name: 'Gold Line Frame', description: 'Minimal gold · corner leaves', category: 'Modern', culture: 'modern', accent: '#b8860b', text: '#4a3828', font: 'classic', inset: DEFAULT_INSET },
  { id: 'template-25', file: 'template-25.png', name: 'Premium Rose Frame', description: 'Full rose border · luxury gold', category: 'Luxury', culture: 'luxury', accent: '#9a7209', text: '#4a3828', font: 'elegant', inset: DEFAULT_INSET },
];

export const CULTURE_DEFAULTS = {
  sinhala: {
    culturalTitle: 'ශ්‍රී සුබ මංගලම්',
    defaultTagline: 'Together with their families',
    defaultMessage: '',
    defaultCeremonyNote: 'Poruwa Ceremony at 10:00 AM',
    ceremonyType: 'Poruwa',
  },
  church: {
    culturalTitle: 'Wedding Invitation',
    defaultTagline: 'Together with their families',
    defaultMessage: 'Request the pleasure of your company at their wedding celebration',
    defaultCeremonyNote: 'Church Service at 10:30 AM',
    ceremonyType: 'Church',
  },
  tamil: {
    culturalTitle: 'திருமண அழைப்பிதழ்',
    defaultTagline: 'Together with their families',
    defaultMessage: '',
    defaultCeremonyNote: 'Muhurtham at 9:30 AM',
    ceremonyType: 'Tamil',
  },
  muslim: {
    culturalTitle: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم',
    defaultTagline: 'Together with their families',
    defaultMessage: 'Cordially invite you to their Nikkah',
    defaultCeremonyNote: 'Nikkah at 5:00 PM · Dinner to follow',
    ceremonyType: 'Nikkah',
  },
  luxury: {
    culturalTitle: 'Wedding Invitation',
    defaultTagline: 'Together with their families',
    defaultMessage: 'Request the honour of your presence at their wedding',
    defaultCeremonyNote: 'Reception from 6:00 PM',
    ceremonyType: 'Reception',
  },
  modern: {
    culturalTitle: 'Save the Date',
    defaultTagline: 'Together with their families',
    defaultMessage: 'Joyfully invite you to celebrate their wedding day',
    defaultCeremonyNote: 'Ceremony at 4:00 PM',
    ceremonyType: 'Ceremony',
  },
};
