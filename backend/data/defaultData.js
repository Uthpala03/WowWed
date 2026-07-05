const taskCategories = ['guests', 'suite', 'vendors', 'ceremony', 'catering', 'decorations', 'entertainment', 'logistics', 'budget', 'venue', 'other'];

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
  { title: 'Enjoy your wedding', category: 'other', month: 7, year: 2027 },
  { title: 'Plan your bar menu', category: 'catering', month: 7, year: 2026 },
  { title: 'Book wedding venue', category: 'venue', month: 1, year: 2027 },
  { title: 'Hire photographer and videographer', category: 'vendors', month: 1, year: 2027 },
  { title: 'Choose wedding theme and colours', category: 'decorations', month: 2, year: 2027 },
  { title: 'Send save-the-date cards', category: 'guests', month: 2, year: 2027 },
  { title: 'Book catering service', category: 'catering', month: 3, year: 2027 },
  { title: 'Order wedding cake', category: 'catering', month: 4, year: 2027 },
  { title: 'Book band or DJ', category: 'entertainment', month: 3, year: 2027 },
  { title: 'Arrange poruwa ceremony items', category: 'ceremony', month: 5, year: 2027 },
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
  ];

  extras.forEach((title, i) => {
    const month = (i % 6) + 2;
    tasks.push({
      id: `t${tasks.length + 1}`,
      title,
      category: taskCategories[i % taskCategories.length],
      dueDate: padDate(month, 2027),
      done: false,
      assigned: 'Unassigned',
      notes: '',
    });
  });

  return tasks;
}

const defaultTasks = buildDefaultTasks();

const defaultGuests = [
  { id: 'g1', name: 'Romesh', email: '', phone: '', group: 'Family', rsvp: 'Pending', notes: '' },
  { id: 'g2', name: 'Uthpala', email: '', phone: '', group: 'Family', rsvp: 'Accepted', notes: '' },
  { id: 'g3', name: 'bruno', email: '', phone: '', group: 'Friends', rsvp: 'Pending', notes: '' },
  { id: 'g4', name: 'lanka', email: '', phone: '', group: 'Friends', rsvp: 'Pending', notes: '' },
  { id: 'g5', name: 'randiv', email: '', phone: '', group: 'VIP', rsvp: 'Accepted', notes: '' },
];

const defaultBudget = { total: 10000000, categories: [], expenses: [] };
const defaultSeating = { tables: [], assignments: {} };

module.exports = { defaultTasks, defaultGuests, defaultBudget, defaultSeating };
