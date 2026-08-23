import { normalizeCeremonyType } from '../data/formOptions';

const sharedTasks = [
  { title: 'Set the wedding budget and categories', category: 'budget', monthsBefore: 12 },
  { title: 'Book the wedding venue or reception hall', category: 'venue', monthsBefore: 12 },
  { title: 'Hire photographer and videographer', category: 'vendors', monthsBefore: 11 },
  { title: 'Book catering (rice and curry or hotel package)', category: 'catering', monthsBefore: 10 },
  { title: 'Book bridal dressing (Kandyan, Indian, or Western)', category: 'suite', monthsBefore: 10 },
  { title: "Book groom's national dress or suit", category: 'suite', monthsBefore: 9 },
  { title: 'Choose wedding theme, colours, and flowers', category: 'decorations', monthsBefore: 8 },
  { title: 'Send save-the-date cards to family', category: 'guests', monthsBefore: 7 },
  { title: 'Order the wedding cake', category: 'catering', monthsBefore: 6 },
  { title: 'Book band, DJ, or Kandyan dancers', category: 'entertainment', monthsBefore: 6 },
  { title: 'Book florist and jasmine / fresh flower décor', category: 'decorations', monthsBefore: 6 },
  { title: 'Order wedding invitations', category: 'guests', monthsBefore: 5 },
  { title: 'Book hotel rooms for outstation guests', category: 'logistics', monthsBefore: 5 },
  { title: 'Book hair and makeup artist', category: 'suite', monthsBefore: 5 },
  { title: 'Order bridal jewellery', category: 'suite', monthsBefore: 4 },
  { title: 'Mail or hand-deliver invitations', category: 'guests', monthsBefore: 4 },
  { title: 'Confirm vendor contracts and deposits', category: 'vendors', monthsBefore: 4 },
  { title: 'Collect RSVPs from close family first', category: 'guests', monthsBefore: 3 },
  { title: "Bride's clothing fitting", category: 'suite', monthsBefore: 3 },
  { title: "Groom's clothing fitting", category: 'suite', monthsBefore: 3 },
  { title: 'Create the seating chart', category: 'guests', monthsBefore: 2 },
  { title: 'Arrange guest buses and parking', category: 'logistics', monthsBefore: 2 },
  { title: 'Book the pre-wedding shoot', category: 'vendors', monthsBefore: 2 },
  { title: 'Plan welcome drinks, oil cakes, and sweetmeats', category: 'catering', monthsBefore: 2 },
  { title: 'Confirm final headcount with the caterer', category: 'catering', monthsBefore: 1 },
  { title: 'Create the wedding-day timeline', category: 'logistics', monthsBefore: 1 },
  { title: 'Confirm venue setup time and lighting', category: 'venue', monthsBefore: 1 },
  { title: 'Pack an emergency wedding kit', category: 'other', monthsBefore: 1 },
  { title: 'Enjoy your wedding day', category: 'other', monthsBefore: 0 },
];

const ceremonyTasks = {
  'Poruwa Ceremony': [
    { title: 'Confirm auspicious date and nekatha with an astrologer', category: 'ceremony', monthsBefore: 12 },
    { title: 'Book the Poruwa and ceremonial items', category: 'ceremony', monthsBefore: 6 },
    { title: 'Find Jayamangala Gatha singers and ashtaka reciters', category: 'ceremony', monthsBefore: 5 },
    { title: 'Arrange kiribath and traditional sweetmeats', category: 'catering', monthsBefore: 3 },
    { title: 'Plan the Magul homecoming', category: 'ceremony', monthsBefore: 2 },
    { title: 'Collect Poruwa ceremony items', category: 'ceremony', monthsBefore: 1 },
  ],
  'Church Wedding': [
    { title: 'Book the church and priest', category: 'ceremony', monthsBefore: 12 },
    { title: 'Arrange the church choir and hymns', category: 'ceremony', monthsBefore: 6 },
    { title: 'Prepare marriage certificate documents', category: 'ceremony', monthsBefore: 4 },
    { title: 'Plan church aisle flowers and décor', category: 'decorations', monthsBefore: 2 },
    { title: 'Arrange the church rehearsal', category: 'ceremony', monthsBefore: 1 },
  ],
  'Hindu Tamil Wedding': [
    { title: 'Book the kovil and priest', category: 'ceremony', monthsBefore: 12 },
    { title: 'Arrange the thaali / mangalsutra', category: 'ceremony', monthsBefore: 6 },
    { title: 'Book the mehendi night', category: 'suite', monthsBefore: 4 },
    { title: 'Arrange Hindu ceremonial items', category: 'ceremony', monthsBefore: 3 },
    { title: 'Confirm vegetarian catering if needed', category: 'catering', monthsBefore: 2 },
  ],
  'Muslim Nikah Ceremony': [
    { title: 'Book the mosque and imam / qazi', category: 'ceremony', monthsBefore: 12 },
    { title: 'Prepare nikah documents and mehr', category: 'ceremony', monthsBefore: 6 },
    { title: 'Plan the walima reception', category: 'ceremony', monthsBefore: 3 },
    { title: 'Share dress-code notes with guests', category: 'guests', monthsBefore: 2 },
  ],
  Reception: [
    { title: 'Book an MC for the reception', category: 'entertainment', monthsBefore: 6 },
    { title: 'Plan cake cutting and first dance', category: 'entertainment', monthsBefore: 3 },
    { title: 'Create the reception playlist', category: 'entertainment', monthsBefore: 2 },
  ],
};

function addMonths(date, months) {
  const next = new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
  if (next.getDate() !== date.getDate()) {
    next.setDate(0);
  }
  return next;
}

export function dueFromWedding(weddingDate, monthsBefore) {
  const wedding = new Date(`${String(weddingDate).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(wedding.getTime())) return '';
  const due = addMonths(wedding, -Number(monthsBefore) || 0);
  const year = due.getFullYear();
  const month = String(due.getMonth() + 1).padStart(2, '0');
  const day = String(due.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildCoupleChecklist(weddingDate, ceremonyType) {
  const ceremony = normalizeCeremonyType(ceremonyType);
  const extras = ceremonyTasks[ceremony] || ceremonyTasks['Poruwa Ceremony'];
  const templates = [...sharedTasks, ...extras];

  return templates.map((task, index) => ({
    id: `sl-${index + 1}`,
    title: task.title,
    category: task.category,
    monthsBefore: task.monthsBefore,
    dueDate: dueFromWedding(weddingDate, task.monthsBefore),
    done: false,
    assigned: 'Unassigned',
    notes: '',
    suggested: true,
  }));
}
