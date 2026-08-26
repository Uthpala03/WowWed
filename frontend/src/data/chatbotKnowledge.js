import knowledge from './chatbot-knowledge.json';

export const chatbotTopics = knowledge.topics || [];
export const chatbotStarters = knowledge.starters || [];
export const chatbotWelcome = knowledge.welcome;
export const chatbotFallback = knowledge.fallback;

const SYNONYMS = knowledge.synonyms || {};
const RULES = knowledge.rules || [];
const REPLIES = knowledge.articles || knowledge.replies || [];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasPhrase(query, phrase) {
  if (!phrase) return false;
  const needle = normalize(phrase);
  if (!needle) return false;
  if (needle.includes(' ')) return query.includes(needle);
  if (needle.length <= 3) return new RegExp(`\\b${escapeRegExp(needle)}\\b`).test(query);
  return query.includes(needle);
}

function patternList(pattern) {
  const key = normalize(pattern);
  const extras = SYNONYMS[key] || SYNONYMS[pattern] || [];
  return [pattern, ...extras];
}

function matchesPattern(query, pattern) {
  return patternList(pattern).some((form) => hasPhrase(query, form));
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'to', 'for', 'in', 'on', 'my', 'our', 'your',
  'me', 'i', 'we', 'us', 'is', 'are', 'do', 'does', 'did', 'be', 'been',
  'how', 'what', 'when', 'where', 'which', 'who', 'why', 'can', 'could', 'should',
  'would', 'will', 'please', 'about', 'with', 'from', 'just', 'also', 'some',
  'any', 'this', 'that', 'it', 'if', 'not', 'wedding', 'weddings',
]);

function tokenize(text) {
  return normalize(text).split(' ').filter((word) => word && !STOP_WORDS.has(word) && word.length > 2);
}

function phrasesOf(rule) {
  return [...(rule.any || []), ...(rule.say || []), rule.ask].filter(Boolean);
}

function ruleMatches(query, rule) {
  const any = phrasesOf(rule);
  const all = rule.all || [];
  const none = rule.none || [];

  if (none.some((pattern) => matchesPattern(query, pattern))) return false;
  if (all.length && !all.every((pattern) => matchesPattern(query, pattern))) return false;
  if (any.length && !any.some((pattern) => matchesPattern(query, pattern))) return false;
  if (!any.length && !all.length) return false;
  return true;
}

function specificity(rule) {
  return (rule.all || []).length * 4 + (rule.any || []).length + (rule.none || []).length * 2;
}

function replyById(id) {
  return REPLIES.find((item) => item.id === id) || RULES.find((item) => item.id === id) || null;
}

function followUpsFor(rule, reply) {
  const ids = rule.followUp || reply.relatedIds || [];
  return ids
    .map((id) => {
      const item = replyById(id);
      const askRule = RULES.find((row) => row.reply === id || row.id === id);
      if (!item && !askRule) return null;
      return {
        id: id,
        label: askRule?.ask || item?.questions?.[0] || item?.title || id,
      };
    })
    .filter(Boolean)
    .slice(0, 6);
}

export function emptyChatSession() {
  return { guests: null, budgetLkr: null, style: null, ceremony: null };
}

function mergeSession(prev, extracted) {
  const base = prev && typeof prev === 'object' ? prev : emptyChatSession();
  return {
    guests: extracted.guests ?? base.guests ?? null,
    budgetLkr: extracted.budgetLkr ?? base.budgetLkr ?? null,
    style: extracted.style ?? base.style ?? null,
    ceremony: extracted.ceremony ?? base.ceremony ?? null,
  };
}

function newFactsFrom(prev, extracted) {
  const added = {};
  if (extracted.guests && extracted.guests !== prev?.guests) added.guests = extracted.guests;
  if (extracted.budgetLkr && extracted.budgetLkr !== prev?.budgetLkr) added.budgetLkr = extracted.budgetLkr;
  if (extracted.style && extracted.style !== prev?.style) added.style = extracted.style;
  if (extracted.ceremony && extracted.ceremony !== prev?.ceremony) added.ceremony = extracted.ceremony;
  return added;
}

function formatLkr(amount) {
  if (!amount) return '';
  if (amount >= 1_000_000 && amount % 1_000_000 === 0) {
    return `Rs. ${amount / 1_000_000} million`;
  }
  return `Rs. ${Number(amount).toLocaleString('en-LK')}`;
}

function tableHint(guests) {
  if (!guests) return 'tables of 8–10';
  const min = Math.ceil(guests / 10);
  const max = Math.ceil(guests / 8);
  return min === max ? `${min} tables of 8–10` : `${min}–${max} tables of 8–10`;
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function normalizeRsvp(value) {
  const v = String(value || '').trim().toLowerCase();
  if (['accepted', 'coming', 'yes', 'y', 'confirmed', 'confirm'].includes(v)) return 'Accepted';
  if (['rejected', 'declined', 'not coming', 'no', 'n'].includes(v)) return 'Rejected';
  return 'Pending';
}

export function readLoggedInCouple(coupleData) {
  if (!coupleData?.userId) {
    return { userId: null };
  }

  const profile = coupleData.profile || {};
  const guests = coupleData.guests || [];
  const budget = coupleData.budget || {};
  const tasks = coupleData.tasks || [];
  const seating = coupleData.seating || {};
  const one = String(profile.partnerOne || '').trim();
  const two = String(profile.partnerTwo || '').trim();
  const spent = (budget.expenses || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const total = Number(budget.total || profile.budget) || 0;
  const rsvps = guests.map((guest) => normalizeRsvp(guest.rsvp));
  const coming = rsvps.filter((status) => status === 'Accepted').length;
  const waiting = rsvps.filter((status) => status === 'Pending').length;
  const notComing = rsvps.filter((status) => status === 'Rejected').length;

  return {
    userId: coupleData.userId,
    partnerOne: one,
    partnerTwo: two,
    names: one && two ? `${one} & ${two}` : one || two || '',
    date: formatDate(profile.weddingDate || coupleData.onboarding?.weddingDate),
    district: String(profile.district || coupleData.onboarding?.location || '').trim(),
    venue: String(profile.venue || profile.venueType || coupleData.onboarding?.venueType || '').trim(),
    ceremonyType: String(profile.ceremonyType || coupleData.onboarding?.ceremonyType || '').trim(),
    plannedGuests: Number(profile.guestCount) || 0,
    listedGuests: guests.length,
    guestCount: guests.length || Number(profile.guestCount) || 0,
    coming,
    waiting,
    notComing,
    budgetTotal: total,
    spent,
    remaining: total ? Math.max(total - spent, 0) : 0,
    expenseCount: (budget.expenses || []).length,
    tasksTotal: tasks.length,
    tasksDone: tasks.filter((task) => task.done).length,
    tableCount: (seating.tables || []).length,
    crewCount: (coupleData.crew || []).length,
    bookingCount: (coupleData.bookings || []).length,
  };
}

function withCouple(session, couple) {
  const next = { ...(session || emptyChatSession()), couple: couple?.userId ? couple : null };
  if (!next.guests && couple?.guestCount) next.guests = couple.guestCount;
  if (!next.budgetLkr && couple?.budgetTotal) next.budgetLkr = couple.budgetTotal;
  const ceremony = String(couple?.ceremonyType || '').toLowerCase();
  if (!next.style && /poruwa|sinhala|traditional/.test(ceremony)) next.style = 'traditional';
  if (!next.ceremony && couple?.ceremonyType) next.ceremony = couple.ceremonyType;
  return next;
}

function describeCouple(couple) {
  if (!couple?.userId) {
    return 'Add your wedding profile first — names, date, and ceremony — and I can work with those details.';
  }
  const bits = [];
  if (couple.ceremonyType) bits.push(`ceremony is ${couple.ceremonyType}`);
  if (couple.date) bits.push(`date is ${couple.date}`);
  if (couple.venue) bits.push(`venue is ${couple.venue}`);
  if (couple.district) bits.push(couple.district);
  if (couple.listedGuests) {
    bits.push(`${couple.listedGuests} guests on the list, ${couple.coming} confirmed`);
  } else if (couple.plannedGuests) {
    bits.push(`planned guest count ${couple.plannedGuests}`);
  }
  if (couple.budgetTotal) {
    bits.push(`budget ${formatLkr(couple.budgetTotal)}, ${formatLkr(couple.spent) || 'Rs. 0'} spent`);
  }
  if (couple.tasksTotal) {
    bits.push(`checklist ${couple.tasksDone} of ${couple.tasksTotal} done`);
  }
  if (!bits.length) {
    return 'Your wedding profile is still empty. Add names, date, and a budget and I’ll use them here.';
  }
  const lead = couple.names ? `${couple.names} — ` : '';
  return `${lead}${bits.join(', ')}.`;
}

function coupleOverviewPoints(couple) {
  const points = [];
  if (couple.date) points.push(`Date — ${couple.date}`);
  if (couple.ceremonyType) points.push(`Ceremony — ${couple.ceremonyType}`);
  if (couple.venue || couple.district) points.push(`Venue — ${couple.venue || couple.district}${couple.venue && couple.district ? `, ${couple.district}` : ''}`);
  if (couple.listedGuests) {
    points.push(`Guests — ${couple.listedGuests} on the list, ${couple.coming} confirmed`);
  } else if (couple.plannedGuests) {
    points.push(`Planned guests — ${couple.plannedGuests}`);
  }
  if (couple.budgetTotal) {
    points.push(`Budget — ${formatLkr(couple.budgetTotal)}, ${formatLkr(couple.spent) || 'Rs. 0'} spent, ${formatLkr(couple.remaining) || 'Rs. 0'} left`);
  }
  if (couple.tasksTotal) points.push(`Checklist — ${couple.tasksDone} of ${couple.tasksTotal} done`);
  if (couple.tableCount) points.push(`Seating — ${couple.tableCount} tables`);
  if (couple.bookingCount) points.push(`Vendor bookings — ${couple.bookingCount}`);
  return points;
}

function describeGuests(couple) {
  if (!couple.listedGuests && !couple.plannedGuests) {
    return 'There’s no guest list yet. Add names in Guest List and I’ll use those numbers here.';
  }
  if (!couple.listedGuests) {
    return `Your profile plans for ${couple.plannedGuests} guests. Add the names in Guest List so RSVPs can be tracked.`;
  }
  const verb = couple.coming === 1 ? 'has' : 'have';
  const planned = couple.plannedGuests && couple.plannedGuests !== couple.listedGuests
    ? ` The profile was planned for ${couple.plannedGuests}.`
    : '';
  return `${couple.coming} ${couple.coming === 1 ? 'guest' : 'guests'} ${verb} confirmed. ${couple.waiting} waiting, ${couple.notComing} not coming. ${couple.listedGuests} names are on the list.${planned}`;
}

function guestPoints(couple) {
  if (!couple.listedGuests) return [];
  return [
    `Confirmed (Coming) — ${couple.coming}`,
    `Waiting — ${couple.waiting}`,
    `Not coming — ${couple.notComing}`,
    `On the list — ${couple.listedGuests}`,
  ];
}

function describeBudget(couple) {
  if (!couple.budgetTotal) {
    return 'There’s no budget total yet. Set one on the Budget page, or tell me an amount in rupees.';
  }
  const expenses = couple.expenseCount
    ? ` ${couple.expenseCount} expense${couple.expenseCount === 1 ? '' : 's'} logged.`
    : '';
  return `Your budget is ${formatLkr(couple.budgetTotal)}. Spent so far: ${formatLkr(couple.spent) || 'Rs. 0'}. Remaining: ${formatLkr(couple.remaining) || 'Rs. 0'}.${expenses}`;
}

function rupeeLine(amount) {
  return `Rs. ${Math.round(amount).toLocaleString('en-LK')}`;
}

function allocationReply(total, couple, session) {
  const guests = session?.guests || couple?.guestCount || 0;
  const venue = total * 0.35;
  const catering = total * 0.22;
  const photo = total * 0.12;
  const attire = total * 0.1;
  const decor = total * 0.08;
  const extra = total * 0.08;
  const buffer = total * 0.05;
  const who = couple?.names ? `${couple.names}, with` : 'With';
  const guestBit = guests
    ? ` With ${guests} guests, catering works out to about ${rupeeLine(catering / guests)} per person.`
    : '';
  const spentBit = couple?.spent
    ? ` You’ve already logged ${formatLkr(couple.spent)} in expenses, so about ${formatLkr(Math.max(total - couple.spent, 0))} is still free.`
    : '';
  return spokenReply({
    id: 'budget-plan',
    text: `${who} ${formatLkr(total)}, here is a working split.${guestBit}${spentBit}`,
    points: [
      `Venue — ${rupeeLine(venue)}`,
      `Catering — ${rupeeLine(catering)}`,
      `Photography & video — ${rupeeLine(photo)}`,
      `Attire — ${rupeeLine(attire)}`,
      `Décor — ${rupeeLine(decor)}`,
      `Music, cake, invitations & extras — ${rupeeLine(extra)}`,
      `Keep aside for surprises — ${rupeeLine(buffer)}`,
    ],
    route: '/dashboard/budget',
    routeLabel: 'Open Budget',
    session,
  });
}

function isBudgetTalk(query) {
  return /create .{0,24}budget|plan .{0,16}budget|start .{0,16}budget|help me.{0,24}budget|split .{0,20}budget|divide .{0,16}budget|allocat|how should we divide|how should we split|my budget is|our budget is|wedding budget/.test(query);
}

function budgetAskReply(couple, session) {
  const who = couple?.names ? `${couple.names}, ` : '';
  return spokenReply({
    id: 'budget-ask-total',
    text: `${who}what total should we plan with in rupees? I’ll split it across venue, catering, photography, décor, and a small buffer.`,
    session,
    related: [
      { id: 'say-budget', label: 'Our budget is Rs. 2 million' },
      { id: 'say-1m', label: 'Our budget is Rs. 1 million' },
    ],
  });
}

function personalBudgetReply(query, couple, session, added) {
  const asking = isBudgetTalk(query);
  const total = added.budgetLkr || session.budgetLkr || couple?.budgetTotal || 0;
  if (added.budgetLkr || (asking && total)) {
    return allocationReply(total, couple, session);
  }
  if (asking && !total) {
    return budgetAskReply(couple, session);
  }
  return null;
}

function isHowToAdvice(query) {
  if (/\bhow many\b/.test(query)) return false;
  if (/\b(confirmed|coming|accepted|waiting|not coming|have replied)\b/.test(query) && /\b(guest|rsvp|people)\b/.test(query)) {
    return false;
  }
  return /\b(how (do|can|should) (we|i)|how to|should we invite|who should we invite|tips for)\b/.test(query);
}

function isCoupleStatusQuestion(query) {
  if (isHowToAdvice(query)) return false;
  return (
    /how many (guests|people|rsvps?)/.test(query)
    || /(confirmed|coming|accepted|waiting|not coming).{0,28}(guest|people|rsvp)/.test(query)
    || /(guest|people|rsvp).{0,28}(confirmed|coming|accepted|replied)/.test(query)
    || /who is coming|who has (confirmed|accepted|replied)|who replied/.test(query)
    || /confirmed guests|guest list status|rsvp status/.test(query)
    || /\b(our|my)\s+(wedding|budget|guest|guests|date|ceremony|venue|details|profile|checklist|rsvp|expenses?)/.test(query)
    || /when is (the |our |my )?wedding/.test(query)
    || /what is (our|my|the) (budget|date|ceremony|venue|guest)/.test(query)
    || /how much (have we spent|is (left|remaining)|did we spend|is our budget)/.test(query)
    || /checklist (progress|status)|how many tasks|readiness/.test(query)
    || /tell me (about )?(our|my) /.test(query)
    || /what (ceremony|venue|district) (do we|are we|is our)/.test(query)
  );
}

function coupleStatusReply(raw, query, couple, session) {
  if (!isCoupleStatusQuestion(query)) return null;
  if (isBudgetTalk(query)) return null;
  if (!looksLikeQuestion(raw, query) && !/\btell me\b/.test(query)) return null;
  if (!couple?.userId) {
    return spokenReply({
      id: 'couple-missing',
      text: 'Add your wedding profile first — names, date, and ceremony — then I can use those details here.',
      session,
    });
  }
  if (/budget|spend|spent|money|left|remaining/.test(query) && !/guest/.test(query)) {
    return spokenReply({
      id: 'couple-budget',
      text: describeBudget(couple),
      route: '/dashboard/budget',
      routeLabel: 'Open Budget',
      session,
    });
  }
  if (/guest|rsvp|confirmed|coming|headcount/.test(query) && !/seat/.test(query)) {
    return spokenReply({
      id: 'couple-guests',
      text: describeGuests(couple),
      points: guestPoints(couple),
      route: '/dashboard/guests',
      routeLabel: 'Open Guest List',
      session,
    });
  }
  if (/\bdate\b|when is/.test(query)) {
    return spokenReply({
      id: 'couple-date',
      text: couple.date ? `Your wedding date is ${couple.date}.` : 'There’s no wedding date on your profile yet. Add it under Wedding Profile.',
      session,
    });
  }
  if (/ceremony/.test(query)) {
    return spokenReply({
      id: 'couple-ceremony',
      text: couple.ceremonyType ? `Your ceremony is ${couple.ceremonyType}.` : 'There’s no ceremony type on your profile yet. Add it under Wedding Profile.',
      session,
    });
  }
  if (/venue|district/.test(query)) {
    return spokenReply({
      id: 'couple-venue',
      text: couple.venue || couple.district
        ? `Your venue is ${couple.venue || 'not set yet'}${couple.district ? ` in ${couple.district}` : ''}.`
        : 'There’s no venue on your profile yet. Add it under Wedding Profile.',
      session,
    });
  }
  if (/checklist|task|readiness/.test(query)) {
    return spokenReply({
      id: 'couple-checklist',
      text: couple.tasksTotal
        ? `${couple.tasksDone} of ${couple.tasksTotal} checklist tasks are done.`
        : 'There’s no checklist yet. Open Wedding Checklist to start.',
      route: '/dashboard/checklist',
      routeLabel: 'Open Checklist',
      session,
    });
  }
  return spokenReply({
    id: 'couple-summary',
    text: describeCouple(couple),
    points: coupleOverviewPoints(couple),
    session,
  });
}

function extractFacts(raw) {
  const query = normalize(raw);
  const facts = {};

  const guests = query.match(/\b(\d{2,4})\s*(?:guests?|people|pax|persons?)\b/);
  if (guests) facts.guests = Number(guests[1]);

  const million = query.match(/\b(?:rs|lkr|rupees?)?\s*(\d+(?:\.\d+)?)\s*(?:million|mn)\b/);
  const lakhs = query.match(/\b(\d+(?:\.\d+)?)\s*lakhs?\b/);
  const rupees = query.match(/\b(?:rs|lkr|rupees?)\s*([0-9]{1,3}(?:,[0-9]{2,3})+|[0-9]{5,})\b/);
  if (million) facts.budgetLkr = Math.round(parseFloat(million[1]) * 1_000_000);
  else if (lakhs) facts.budgetLkr = Math.round(parseFloat(lakhs[1]) * 100_000);
  else if (rupees) facts.budgetLkr = Number(String(rupees[1]).replace(/,/g, ''));

  if (/\bporuwa\b/.test(query)) facts.ceremony = 'poruwa';
  if (/\btraditional\b/.test(query) || (/\bsri lankan\b/.test(query) && !/\bmodern\b/.test(query))) {
    facts.style = 'traditional';
  } else if (/\bmodern\b/.test(query) && !/\btraditional\b/.test(query)) {
    facts.style = 'modern';
  }

  return facts;
}

function isGreetingOnly(query) {
  return /^(hi|hello|hey|hiya|yo)(\s+(there|wowwed|assistant))?$/.test(query)
    || /^(good\s+(morning|afternoon|evening|night))(\s+(there|everyone))?$/.test(query);
}

function isThanksOnly(query) {
  return /^(thanks|thank you|thank u|thx|ty)(\s+(so much|a lot))?$/.test(query);
}

function looksLikeQuestion(raw, query) {
  if (/\?/.test(raw)) return true;
  return /\b(how|what|when|where|which|why|can you|could you|would you|should we|should i|do we|do i|help me|help us|need help|create|suggest|recommend|find|estimate|give me|tell me|arrange|plan my|plan our|allocate|split)\b/.test(query);
}

function capabilityReply(query, session) {
  if (/what is wowwed|whats wowwed|what is this app|who (are|is) (you|wowwed)|about wowwed|decision support/.test(query) && !/what can wowwed|what does wowwed|wowwed do|wowwed cover/.test(query)) {
    const article = replyById('about-wowwed');
    return toChatReply({ reply: 'about-wowwed', ask: 'What is WOWWED?' }, article, session);
  }
  if (/need help planning|help me plan|help planning my|help me with my wedding/.test(query) && !isBudgetTalk(query)) {
    const article = replyById('help-plan');
    return toChatReply({ reply: 'help-plan', ask: 'Help me plan my wedding' }, article, session);
  }
  if (/what can you do|how can you help|what can wowwed|what does wowwed|wowwed cover|what do you do|what can you help/.test(query)) {
    const article = replyById('what-can-you-do');
    return toChatReply({ reply: 'what-can-you-do', ask: 'What can WOWWED do?' }, article, session);
  }
  return null;
}

function fillTemplate(template, session) {
  if (!template) return '';
  let text = String(template);
  text = text.replace(/\{\{ifGuests\}\}([\s\S]*?)\{\{\/ifGuests\}\}/g, (_, inner) => (
    session?.guests ? fillTemplate(inner, session) : ''
  ));
  text = text.replace(/\{\{ifBudget\}\}([\s\S]*?)\{\{\/ifBudget\}\}/g, (_, inner) => (
    session?.budgetLkr ? fillTemplate(inner, session) : ''
  ));
  text = text.replace(/\{\{ifTraditional\}\}([\s\S]*?)\{\{\/ifTraditional\}\}/g, (_, inner) => (
    session?.style === 'traditional' ? fillTemplate(inner, session) : ''
  ));
  return text
    .replace(/\{\{guests\}\}/g, session?.guests ? String(session.guests) : '')
    .replace(/\{\{budget\}\}/g, formatLkr(session?.budgetLkr) || 'your budget')
    .replace(/\{\{tables\}\}/g, tableHint(session?.guests))
    .replace(/\{\{names\}\}/g, session?.couple?.names || '')
    .replace(/\{\{date\}\}/g, session?.couple?.date || '')
    .replace(/\{\{ceremony\}\}/g, session?.couple?.ceremonyType || '')
    .replace(/\{\{district\}\}/g, session?.couple?.district || '')
    .replace(/\{\{venue\}\}/g, session?.couple?.venue || '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+\./g, '.')
    .trim();
}

function firstSentences(text, count = 2) {
  const parts = String(text || '').split(/(?<=[.!?])\s+/).filter(Boolean);
  return parts.slice(0, count).join(' ');
}

function nextSuggestions(session) {
  const items = [];
  if (!session?.guests) {
    items.push({ id: 'say-guests', label: 'We are planning a wedding for 150 guests' });
  }
  if (!session?.budgetLkr) {
    items.push({ id: 'say-budget', label: 'Our budget is Rs. 2 million' });
  }
  if (session?.style !== 'traditional') {
    items.push({ id: 'say-traditional', label: 'We want a traditional Sri Lankan wedding' });
  }
  items.push({ id: 'seating-overview', label: 'How can we arrange the seating?' });
  items.push({ id: 'budget-allocation', label: 'How should we split the budget?' });
  items.push({ id: 'vendor-venue', label: 'Help us choose a venue' });
  return items.slice(0, 4);
}

function spokenReply({ id, text, points, route, routeLabel, related, session }) {
  return {
    id: id || 'chat',
    title: '',
    category: 'general',
    text,
    points: points || [],
    route: route || '',
    routeLabel: routeLabel || '',
    related: related || nextSuggestions(session),
    matched: '',
    session,
  };
}

function ackReply(added, session) {
  const names = session?.couple?.names;
  const hello = names ? `Great, ${names}!` : 'Great!';
  const lines = [];
  if (added.guests && !added.budgetLkr && added.style !== 'traditional') {
    lines.push(`${hello} I can help you with your budget, venue, vendors, guest management, seating arrangement, and schedule.`);
  } else {
    if (added.guests) {
      lines.push(`${hello} ${added.guests} guests is a lovely size to plan around.`);
    }
    if (added.budgetLkr) {
      lines.push(`Based on your budget of ${formatLkr(session.budgetLkr)}, I can help you allocate expenses across the venue, catering, photography, decoration, and other services.`);
    }
    if (added.style === 'traditional' || added.ceremony === 'poruwa') {
      lines.push(`I can help you plan a traditional Sri Lankan wedding, including the Poruwa ceremony, vendors, budget, and schedule.`);
    } else if (added.style === 'modern') {
      lines.push(`A modern wedding still needs a clear budget, venue, and guest plan. I can help you keep it simple and stylish.`);
    }
  }
  if (!lines.length) {
    lines.push(`${hello} I can help you with your budget, venue, vendors, guest management, seating arrangement, and schedule.`);
  }
  return spokenReply({
    id: 'ack',
    text: lines.join(' '),
    session,
    related: nextSuggestions(session),
  });
}

function toChatReply(rule, content, session) {
  const chat = fillTemplate(content?.chat || '', session);
  const fallbackText = firstSentences(content?.answer || content?.text || '', 2);
  const text = chat || fallbackText;
  const related = followUpsFor(rule, content);
  return spokenReply({
    id: content?.id || rule?.reply || rule?.id || 'chat',
    text,
    points: (content?.showPoints ? (content.points || []) : (chat ? [] : (content?.points || []))).slice(0, 8),
    route: content?.route || '',
    routeLabel: content?.routeLabel || '',
    related: related.length ? related.slice(0, 4) : nextSuggestions(session),
    session,
  });
}

const FILLERS = [
  'give me some', 'give me', 'tell me some', 'tell me', 'show me some', 'show me',
  'i want to know', 'i want', 'i need', 'we want', 'we need',
  'can you please', 'can you', 'could you', 'would you',
  'please give', 'please', 'suggest some', 'suggest', 'suggestions',
  'some ideas', 'ideas for', 'idea for', 'ideas', 'idea', 'recommend',
  'looking for', 'what are some', 'what are', 'what is',
  'where should we', 'where should i', 'where do we', 'where do i',
  'how should we', 'how should i', 'how do we', 'how do i', 'how can we', 'how can i',
  'what should we', 'what should i', 'what do we', 'what do i',
  'how to', 'ways to', 'help us', 'help me',
];

function softenQuery(query) {
  let next = ` ${query} `;
  FILLERS.forEach((filler) => {
    next = next.replace(new RegExp(`\\b${escapeRegExp(filler)}\\b`, 'g'), ' ');
  });
  next = normalize(next);
  if (next.startsWith('wedding ') && next.split(' ').length > 1) {
    next = normalize(next.replace(/^wedding /, ''));
  }
  return next;
}

function overlapScore(query, rule) {
  if ((rule.none || []).some((pattern) => matchesPattern(query, pattern))) return 0;
  let score = 0;
  phrasesOf(rule).forEach((phrase) => {
    if (hasPhrase(query, phrase)) score += 6 + normalize(phrase).split(' ').length;
  });
  const haystack = new Set(tokenize(phrasesOf(rule).join(' ')));
  tokenize(query).forEach((word) => {
    if (haystack.has(word)) score += 3;
    else if ([...haystack].some((item) => item.includes(word) || word.includes(item))) score += 1;
  });
  return score;
}

function bestRule(query) {
  if (!query) return null;
  const matched = RULES.filter((rule) => ruleMatches(query, rule));
  matched.sort((a, b) => (b.priority || 0) - (a.priority || 0) || specificity(b) - specificity(a));
  if (matched[0]) return matched[0];

  let best = null;
  let bestScore = 0;
  RULES.forEach((rule) => {
    const score = overlapScore(query, rule);
    if (score > bestScore) {
      best = rule;
      bestScore = score;
    }
  });
  return bestScore >= 6 ? best : null;
}

function fallbackReply(session) {
  return spokenReply({
    id: 'fallback',
    text: knowledge.fallback,
    related: nextSuggestions(session),
    session,
  });
}

export function getWelcomeMessage(coupleOrProfile) {
  const couple = coupleOrProfile?.userId || coupleOrProfile?.names
    ? coupleOrProfile
    : readLoggedInCouple({ userId: 'profile', profile: coupleOrProfile });
  const names = couple?.names || '';
  const extra = couple?.date
    ? ` I can see your wedding on ${couple.date}${couple.district ? ` in ${couple.district}` : ''}.`
    : (couple?.district ? ` I can see your wedding in ${couple.district}.` : '');
  if (names) {
    return `Hello ${names}! I'm the WOWWED Assistant, inside WOWWED — an intelligent wedding planning and decision support system.${extra} How can I help you?`;
  }
  return knowledge.welcome;
}

export function getTopicQuestions(topicId) {
  const seen = new Set();
  return RULES
    .filter((rule) => rule.topic === topicId && rule.ask)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0))
    .filter((rule) => {
      const id = rule.reply || rule.id;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .map((rule) => ({ id: rule.reply || rule.id, label: rule.ask, topic: rule.topic }));
}

export function getArticleById(id) {
  return replyById(id);
}

export function getChatbotReply(input, session = {}, couple = null) {
  const raw = String(input || '').trim();
  const query = normalize(raw);
  const extracted = extractFacts(raw);
  const nextSession = withCouple(mergeSession(session, extracted), couple);
  const added = newFactsFrom(session, extracted);

  if (!query) return fallbackReply(nextSession);

  if (isGreetingOnly(query)) {
    return spokenReply({
      id: 'greeting',
      text: getWelcomeMessage(couple),
      session: nextSession,
      related: nextSuggestions(nextSession),
    });
  }

  if (isThanksOnly(query)) {
    const thanks = replyById('thanks');
    return spokenReply({
      id: 'thanks',
      text: thanks?.chat || thanks?.answer || "You're welcome!",
      session: nextSession,
      related: nextSuggestions(nextSession),
    });
  }

  const aboutUs = coupleStatusReply(raw, query, couple, nextSession);
  if (aboutUs) return aboutUs;

  const budgetPlan = personalBudgetReply(query, couple, nextSession, added);
  if (budgetPlan) return budgetPlan;

  const capability = capabilityReply(query, nextSession);
  if (capability) return capability;

  if (!looksLikeQuestion(raw, query) && Object.keys(added).length) {
    return ackReply(added, nextSession);
  }

  const best = bestRule(query) || bestRule(softenQuery(query));
  if (!best) {
    if (Object.keys(added).length) return ackReply(added, nextSession);
    return fallbackReply(nextSession);
  }

  const content = replyById(best.reply || best.id);
  return toChatReply(best, content, nextSession);
}

export function getArticleReply(id, session = {}, couple = null) {
  const nextSession = withCouple(session, couple);
  if (id === 'budget-overview' || id === 'budget-allocation' || id === 'budget-plan') {
    const total = nextSession.budgetLkr || couple?.budgetTotal || 0;
    if (total) return allocationReply(total, couple, nextSession);
    return budgetAskReply(couple, nextSession);
  }
  if ((id === 'guests-overview' || id === 'guests-rsvp') && couple?.listedGuests) {
    return spokenReply({
      id: 'couple-guests',
      text: describeGuests(couple),
      points: guestPoints(couple),
      route: '/dashboard/guests',
      routeLabel: 'Open Guest List',
      session: nextSession,
    });
  }
  const rule = RULES.find((row) => row.reply === id || row.id === id);
  const content = replyById(id);
  if (!content && !rule) return fallbackReply(nextSession);
  return toChatReply(
    rule || { id, followUp: content?.relatedIds, topic: content?.category, ask: content?.title },
    content || {},
    nextSession,
  );
}

export { knowledge as chatbotKnowledgeBase };
