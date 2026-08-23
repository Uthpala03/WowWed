import { wowWedModules } from '../models/AppModule';
import { vendorCategories, vendorCategoryLabels } from '../models/VendorCategory';

export { vendorCategories, vendorCategoryLabels };

export const dashboardNav = wowWedModules.getDashboardNav().map((m) => m.toNavItem());
export const vendorNav = wowWedModules.getVendorNav().map((m) => m.toNavItem());
export const quickLinkHints = wowWedModules.getQuickLinkHints();

export const taskCategories = [
  { id: 'guests', label: 'Guests', icon: '👤' },
  { id: 'suite', label: 'Suite and Dress', icon: '👗' },
  { id: 'vendors', label: 'Vendors', icon: '🏪' },
  { id: 'ceremony', label: 'Ceremony', icon: '💍' },
  { id: 'catering', label: 'Catering', icon: '🍽️' },
  { id: 'decorations', label: 'Decorations', icon: '🌸' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎵' },
  { id: 'logistics', label: 'Logistics', icon: '🚗' },
  { id: 'budget', label: 'Budget', icon: '💰' },
  { id: 'venue', label: 'Venue', icon: '🏛️' },
  { id: 'other', label: 'Other', icon: '📌' },
];

export const guestGroups = ['No Group', 'Family', 'Friends', 'VIP', 'Children'];
export const rsvpStatuses = ['Pending', 'Accepted', 'Rejected'];

export const crewRoles = [
  'Bridesmaid', 'Groomsman', 'Best Man', 'Maid of Honour',
  'Flower Girl', 'Ring Bearer', 'Helper', 'Coordinator',
];

export const tableShapes = [
  { id: 'round', label: 'Round', icon: '⭕' },
  { id: 'rectangle', label: 'Rectangle', icon: '▭' },
  { id: 'square', label: 'Square', icon: '⬜' },
  { id: 'head', label: 'Head Table', icon: '👑' },
  { id: 'standing', label: 'Standing', icon: '🧍' },
];

const taskTemplates = [
  { title: 'Pick shoes for groom and bride', category: 'suite', month: 6, year: 2027 },
  { title: 'Purchase wedding favors/gifts for guests', category: 'guests', month: 6, year: 2027 },
  { title: "Bride's clothing fitting", category: 'suite', month: 6, year: 2027 },
  { title: 'Book photo booth or entertainment extras', category: 'entertainment', month: 6, year: 2027 },
  { title: "Groom's clothing fitting", category: 'suite', month: 6, year: 2027 },
  { title: 'Book hair and makeup artist', category: 'suite', month: 2, year: 2027 },
  { title: 'Find people for Ashlaka and Jayamangala Gatha', category: 'ceremony', month: 3, year: 2027 },
  { title: 'Arrange transportation for guests', category: 'logistics', month: 7, year: 2027 },
  { title: 'Collect final RSVPs', category: 'guests', month: 7, year: 2027 },
  { title: 'Create your seating chart', category: 'guests', month: 7, year: 2027 },
  { title: 'Enjoy your wedding 🥳', category: 'other', month: 7, year: 2027 },
  { title: 'Plan your bar menu', category: 'catering', month: 7, year: 2026 },
  { title: 'Book wedding venue', category: 'venue', month: 1, year: 2027 },
  { title: 'Hire photographer and videographer', category: 'vendors', month: 1, year: 2027 },
  { title: 'Choose wedding theme and colours', category: 'decorations', month: 2, year: 2027 },
  { title: 'Send save-the-date cards', category: 'guests', month: 2, year: 2027 },
  { title: 'Book catering service', category: 'catering', month: 3, year: 2027 },
  { title: 'Order wedding cake', category: 'catering', month: 4, year: 2027 },
  { title: 'Book band or DJ', category: 'entertainment', month: 3, year: 2027 },
  { title: 'Arrange poruwa ceremony items', category: 'ceremony', month: 5, year: 2027 },
  { title: 'Book florist for decorations', category: 'decorations', month: 4, year: 2027 },
  { title: 'Plan honeymoon travel', category: 'logistics', month: 5, year: 2027 },
  { title: 'Set wedding budget categories', category: 'budget', month: 1, year: 2027 },
  { title: 'Order wedding invitations', category: 'guests', month: 3, year: 2027 },
  { title: 'Mail wedding invitations', category: 'guests', month: 4, year: 2027 },
  { title: 'Book hotel rooms for guests', category: 'logistics', month: 5, year: 2027 },
  { title: 'Arrange wedding rehearsal', category: 'ceremony', month: 6, year: 2027 },
  { title: 'Confirm vendor contracts', category: 'vendors', month: 5, year: 2027 },
  { title: 'Plan welcome drinks menu', category: 'catering', month: 6, year: 2027 },
  { title: 'Order bridal jewellery', category: 'suite', month: 4, year: 2027 },
  { title: 'Book mehendi artist', category: 'suite', month: 5, year: 2027 },
  { title: 'Arrange lighting for venue', category: 'decorations', month: 6, year: 2027 },
  { title: 'Create day-of timeline', category: 'logistics', month: 6, year: 2027 },
  { title: 'Confirm final headcount with caterer', category: 'catering', month: 7, year: 2027 },
  { title: 'Pack emergency wedding kit', category: 'other', month: 7, year: 2027 },
  { title: 'Write wedding vows', category: 'ceremony', month: 6, year: 2027 },
  { title: 'Book officiant or registrar', category: 'ceremony', month: 2, year: 2027 },
  { title: 'Choose wedding rings', category: 'ceremony', month: 3, year: 2027 },
  { title: 'Plan bridal shower', category: 'guests', month: 4, year: 2027 },
  { title: 'Plan bachelor party', category: 'guests', month: 5, year: 2027 },
];

function padDate(month, year) {
  const day = 7 + (month % 3);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function buildDefaultTasks() {
  const tasks = taskTemplates.map((t, i) => ({
    id: `t${i + 1}`,
    title: t.title,
    category: t.category,
    dueDate: padDate(t.month, t.year),
    done: false,
    assigned: 'Unassigned',
    notes: '',
  }));

  const extras = [
    'Confirm table linens', 'Order guest book', 'Arrange parking', 'Book makeup trial',
    'Schedule dress fitting', 'Choose groomsmen suits', 'Plan first dance song',
    'Create playlist for reception', 'Book string quartet', 'Arrange confetti exit',
    'Order place cards', 'Plan thank-you cards', 'Confirm hair trial date',
    'Book pre-wedding shoot', 'Arrange welcome bags', 'Plan cocktail hour menu',
    'Confirm ceremony readings', 'Choose flower girl basket', 'Plan ring bearer pillow',
    'Arrange guest shuttle', 'Confirm cake tasting', 'Book dessert table',
    'Plan kids entertainment', 'Arrange photo backdrop', 'Confirm venue setup time',
    'Plan bridal party gifts', 'Arrange morning-of breakfast', 'Confirm tipping budget',
    'Plan post-wedding brunch', 'Backup plan for rain',
  ];

  extras.forEach((title, i) => {
    const month = (i % 6) + 2;
    tasks.push({
      id: `t${tasks.length + 1}`,
      title,
      category: taskCategories[i % taskCategories.length].id,
      dueDate: padDate(month, 2027),
      done: false,
      assigned: 'Unassigned',
      notes: '',
    });
  });

  return tasks;
}

export const defaultTasks = buildDefaultTasks();

export const defaultGuests = [
  { id: 'g1', name: 'Romesh', email: '', phone: '', group: 'Family', rsvp: 'Pending', notes: '' },
  { id: 'g2', name: 'Uthpala', email: '', phone: '', group: 'Family', rsvp: 'Accepted', notes: '' },
  { id: 'g3', name: 'bruno', email: '', phone: '', group: 'Friends', rsvp: 'Pending', notes: '' },
  { id: 'g4', name: 'lanka', email: '', phone: '', group: 'Friends', rsvp: 'Pending', notes: '' },
  { id: 'g5', name: 'randiv', email: '', phone: '', group: 'VIP', rsvp: 'Accepted', notes: '' },
  { id: 'g6', name: 'somapala', email: '', phone: '', group: 'Family', rsvp: 'Pending', notes: '' },
  { id: 'g7', name: 'uma', email: '', phone: '', group: 'Children', rsvp: 'Pending', notes: '' },
];

export const defaultVendors = [
  { id: 'vw-01', name: 'Kandyan Reach Hotel', category: 'Venue & Res. Halls', city: 'Kurunegala', spotlight: true },
  { id: 'vw-36', name: 'Seethawaka Regency', category: 'Venue & Res. Halls', city: 'Avissawella', spotlight: true },
  { id: 'vw-34', name: 'Clover Banquets & Resorts', category: 'Venue & Res. Halls', city: 'Kelaniya', spotlight: true },
  { id: 'vw-39', name: 'AVANI Kalutara Resort', category: 'Venue & Res. Halls', city: 'Kalutara', spotlight: true },
  { id: 'vw-17', name: 'Romance Wedding Photography', category: 'Photography & Videography', city: 'Colombo', spotlight: true },
  { id: 'vw-49', name: 'Brides Mark', category: 'Bridal Service', city: 'Yakkala', spotlight: true },
  { id: 'vw-59', name: 'Swarnamahal', category: 'Jewellary', city: 'Colombo', spotlight: true },
  { id: 'vw-58', name: 'Lanka Chandani Cake Creations', category: 'Cakes', city: 'Kadawatha', spotlight: true },
];

export function getCategoryMeta(id) {
  return taskCategories.find((c) => c.id === id) || taskCategories[taskCategories.length - 1];
}

export function groupTasksByMonth(tasks) {
  const groups = {};
  const sorted = [...tasks].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  sorted.forEach((task) => {
    const date = new Date(task.dueDate);
    const key = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(task);
  });
  return groups;
}

export function getTaskDateGroups(tasks) {
  const counts = {};
  tasks.forEach((task) => {
    const date = new Date(task.dueDate);
    const key = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts)
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .map(([label, count]) => ({ label, count }));
}
