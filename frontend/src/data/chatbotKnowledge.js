export const chatbotKnowledge = [
  { keywords: ['poruwa', 'ceremony', 'sinhala'], answer: 'A Poruwa ceremony is the traditional Sri Lankan Buddhist wedding ritual. Book the Poruwa, Jayamangala Gatha singers, and Ashlaka items early — typically 3–6 months before the wedding.' },
  { keywords: ['budget', 'cost', 'money', 'lkr'], answer: 'Set your total budget first, then allocate by category: venue 30–40%, catering 20–25%, photography 10–15%, attire 8–10%. Use WowWed\'s budget tracker to compare planned vs actual spending.' },
  { keywords: ['guest', 'rsvp', 'invite'], answer: 'Send invitations 6–8 weeks before the wedding. Track RSVPs in Guest List — aim to confirm final headcount 2 weeks before for catering.' },
  { keywords: ['seating', 'table', 'chair'], answer: 'Group family together, keep VIP guests near the stage, and seat children with parents. Use Smart Seating to auto-group guests, then adjust manually on the seating chart.' },
  { keywords: ['vendor', 'photographer', 'catering'], answer: 'Search vendors by district and category. Compare at least 3 options. Send booking requests early — popular Colombo vendors book 6–12 months ahead.' },
  { keywords: ['checklist', 'task', 'timeline'], answer: 'Work backwards from your wedding date. Priority tasks: venue booking, photographer, catering, guest list, invitations, seating chart, and final RSVPs.' },
  { keywords: ['christian', 'church', 'civil', 'muslim'], answer: 'WowWed supports Poruwa, Christian, Muslim, and Civil ceremony types. Your checklist and vendor recommendations adapt to your selected ceremony type.' },
  { keywords: ['hello', 'hi', 'help'], answer: 'Hello! I\'m your WowWed planning assistant. Ask me about budgets, guests, seating, vendors, ceremony types, or checklists.' },
];

export function getChatbotReply(input) {
  const q = input.toLowerCase();
  const match = chatbotKnowledge.find((item) => item.keywords.some((k) => q.includes(k)));
  return match?.answer || 'I can help with checklists, ceremony types, budgeting, guests, seating, and vendor tips. Try asking about your Poruwa ceremony or wedding budget.';
}
