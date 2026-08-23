const { query } = require('../config/db');

const ceremonyLabels = {
  poruwa: 'Poruwa Ceremony',
  church: 'Church Wedding',
  hindu: 'Hindu Tamil Wedding',
  nikah: 'Muslim Nikah Ceremony',
  reception: 'Reception',
  both: 'Poruwa Ceremony',
};

function ceremonyFromOnboarding(id) {
  return ceremonyLabels[id] || id || 'Poruwa Ceremony';
}

function districtFromLocation(location) {
  if (!location || !String(location).trim()) return null;
  return String(location).trim().slice(0, 50);
}

function parseOnboardingRow(row) {
  if (!row) return null;
  const data = typeof row.data_json === 'object' ? row.data_json : JSON.parse(row.data_json);
  return { ...data, completedAt: row.completed_at };
}

async function loadOnboarding(userId) {
  const rows = await query('SELECT data_json, completed_at FROM onboarding WHERE user_id = :userId', { userId });
  return parseOnboardingRow(rows[0]);
}

async function saveOnboardingRow(userId, onboarding) {
  await query(
    `INSERT INTO onboarding (user_id, data_json, completed_at)
     VALUES (:userId, :data, :completedAt)
     ON DUPLICATE KEY UPDATE data_json = :data, completed_at = :completedAt`,
    {
      userId,
      data: JSON.stringify(onboarding),
      completedAt: onboarding.completedAt || new Date(),
    },
  );
  return loadOnboarding(userId);
}

async function applyOnboardingToWeddingProfile(userId, onboarding, { overwrite = false } = {}) {
  if (!onboarding) return;

  const weddingDate = onboarding.weddingDate || null;
  const district = districtFromLocation(onboarding.location);
  const venueType = onboarding.venueType || null;
  const planningStage = onboarding.planningStage || null;
  const ceremonyType = onboarding.ceremonyType ? ceremonyFromOnboarding(onboarding.ceremonyType) : null;

  if (overwrite) {
    await query(
      `INSERT INTO wedding_profiles
       (user_id, wedding_date, district, venue_type, planning_stage, ceremony_type)
       VALUES (:userId, :weddingDate, :district, :venueType, :planningStage, :ceremonyType)
       ON DUPLICATE KEY UPDATE
         wedding_date = COALESCE(:weddingDate, wedding_date),
         district = COALESCE(:district, district),
         venue_type = COALESCE(:venueType, venue_type),
         planning_stage = COALESCE(:planningStage, planning_stage),
         ceremony_type = COALESCE(:ceremonyType, ceremony_type),
         updated_at = NOW()`,
      { userId, weddingDate, district, venueType, planningStage, ceremonyType },
    );
    return;
  }

  await query(
    `INSERT INTO wedding_profiles
     (user_id, wedding_date, district, venue_type, planning_stage, ceremony_type)
     VALUES (:userId, :weddingDate, :district, :venueType, :planningStage, :ceremonyType)
     ON DUPLICATE KEY UPDATE
       wedding_date = COALESCE(wedding_date, :weddingDate),
       district = COALESCE(district, :district),
       venue_type = COALESCE(venue_type, :venueType),
       planning_stage = COALESCE(planning_stage, :planningStage),
       ceremony_type = COALESCE(ceremony_type, :ceremonyType)`,
    { userId, weddingDate, district, venueType, planningStage, ceremonyType },
  );
}

module.exports = {
  ceremonyFromOnboarding,
  districtFromLocation,
  loadOnboarding,
  saveOnboardingRow,
  applyOnboardingToWeddingProfile,
};
