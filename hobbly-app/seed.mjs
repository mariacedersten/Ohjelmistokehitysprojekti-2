// seed.mjs
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { v5 as uuidv5 } from 'uuid';

const { REACT_APP_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!REACT_APP_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(REACT_APP_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------- Helpers ----------
const NAMESPACE = uuidv5.DNS;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// E.164 validator: +[1-9][0-9]{7,14}
function toE164OrNull(phone) {
  if (!phone) return null;
  // убрать пробелы/скобки/тире, оставить + и цифры
  let s = String(phone).trim().replace(/[^\d+]/g, '');
  if (!s.startsWith('+')) return null;
  const ok = /^\+[1-9]\d{7,14}$/.test(s);
  return ok ? s : null;
}

function parseDateEU(dmy) {
  const [dd, mm, yyyy] = dmy.split('.');
  return new Date(Date.UTC(+yyyy, +mm - 1, +dd, 12, 0, 0)).toISOString();
}

function parseCoords(str) {
  if (!str || str.trim() === '–') return null;
  const re = /([\d.]+)\s*°\s*([NS]),\s*([\d.]+)\s*°\s*([EW])/i;
  const m = re.exec(str);
  if (!m) return null;
  const lat = parseFloat(m[1]) * (m[2].toUpperCase() === 'S' ? -1 : 1);
  const lng = parseFloat(m[3]) * (m[4].toUpperCase() === 'W' ? -1 : 1);
  return { lat, lng };
}

function short(text, max = 100) {
  if (!text) return null;
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : clean.slice(0, max - 1) + '…';
}

function normTag(name) {
  return name.trim().replace(/\s+/g, ' ').replace(/Special Groups/i, 'Special groups');
}

// ---- Admin user lookup (v2: listUsers + filter) -----------------------------
async function findAuthUserByEmail(email) {
  const target = email.toLowerCase();
  let page = 1;
  const perPage = 1000;

  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const users = data?.users || [];
    const hit = users.find((u) => (u.email || '').toLowerCase() === target);
    if (hit) return hit;
    if (users.length < perPage) return null;
    page += 1;
  }
}

// ---------- Source data ----------
const BASE_USERS = [
  { fullName: 'Jack Sparrow',        email: 'jack.sparrow@gmail.com',      password: 'JackSparrow1',      phone: '+1 555-0001', role: 'admin' },
  { fullName: 'Will Turner',         email: 'will.turner@gmail.com',       password: 'WillTurner2',       phone: '+1 555-0002', role: 'user' },
  { fullName: 'Elizabeth Swann',     email: 'elizabeth.swann@gmail.com',   password: 'ElizabethSwann3',   phone: '+1 555-0003', role: 'user' },
  { fullName: 'Tia Dalma',           email: 'tia.dalma@gmail.com',         password: 'TiaDalma4',         phone: '+1 555-0004', role: 'user' },
  { fullName: 'Edward Teach',        email: 'edward.teach@gmail.com',      password: 'EdwardTeach5',      phone: '+1 555-0005', role: 'user' },
  { fullName: 'Hector Barbossa',     email: 'hector.barbossa@gmail.com',   password: 'HectorBarbossa6',   phone: '+1 555-0006', role: 'user' },
  { fullName: 'Carina Smyth',        email: 'carina.smyth@gmail.com',      password: 'CarinaSmyth7',      phone: '+1 555-0007', role: 'user' },
];

const ORG_REPS = [
  { fullName: 'Jack Sparrow',      email: 'jack.sparrow@gmail.com',            password: 'JackSparrow1',     phone: '+1 555-0001', organization: 'Black Pearl',             role: 'admin' },
  { fullName: 'James Norrington',  email: 'james.norrington@royalnavy.uk',     password: 'JamesNorrington2', phone: '+1 555-1002', organization: 'HMS Interceptor',         role: 'organizer' },
  { fullName: 'Davy Jones',        email: 'davy.jones@gmail.com',              password: 'DavyJones3',       phone: '+1 555-1003', organization: 'Flying Dutchman',          role: 'organizer' },
  { fullName: 'Captain Salazar',   email: 'salazar.ships@islademuerta.org',    password: 'CaptainSalazar4',  phone: '+1 555-1004', organization: 'Captain Salazar’s Ships',  role: 'organizer' },
];

const ORG_PHONES = {
  'Black Pearl': '+1 555-1001',
  'HMS Interceptor': '+1 555-1002',
  'Flying Dutchman': '+1 555-1003',
  'Captain Salazar’s Ships': '+1 555-1004',
};

const CATEGORIES = [
  { name: 'Nature & Tourism',           icon: '🏞️', description: 'Outdoor and nature tourism' },
  { name: 'Music & Performing Arts',    icon: '🎶', description: 'Music, dance and performing arts' },
  { name: 'Food & Cooking',             icon: '🍳', description: 'Food, culinary and cooking classes' },
  { name: 'Science & Technology',       icon: '🔬', description: 'Science, engineering and technology' },
  { name: 'Crafts & Art',               icon: '🎨', description: 'Crafts, DIY and art' },
  { name: 'Culture & History',          icon: '🏛️', description: 'Culture, heritage and history' },
  { name: 'Children & Families',        icon: '👨‍👩‍👧', description: 'Kids and family activities' },
  { name: 'Community & Volunteering',   icon: '🤝', description: 'Community, clubs and volunteering' },
  { name: 'Sports & Physical Activity', icon: '🏟️', description: 'Sports, fitness and competitions' },
  { name: 'Games & Esports',            icon: '🎮', description: 'Games and esports' },
];

const TAGS = [
  { name: 'Free',                 color: '#2ecc71' },
  { name: 'Beginner-friendly',    color: '#3498db' },
  { name: 'Family-friendly',      color: '#9b59b6' },
  { name: 'Open to All',          color: '#1abc9c' },
  { name: 'Recurring Event',      color: '#e67e22' },
  { name: 'Online',               color: '#34495e' },
  { name: 'Equipment Provided',   color: '#95a5a6' },
  { name: 'Senior-friendly',      color: '#8e44ad' },
  { name: 'Registration Required',color: '#e74c3c' },
  { name: 'Adult-friendly',       color: '#c0392b' },
  { name: 'Child-friendly',       color: '#f1c40f' },
  { name: 'Special groups',       color: '#7f8c8d' },
];

const EVENTS = [
  // Black Pearl (Jack Sparrow)
  {
    title: 'Sea Expedition across the Caribbean',
    date: '15.06.2026',
    location: 'Suomenlinna Sea Fortress, Helsinki',
    coords: '60.1450° N, 24.9870° E',
    type: 'activity',
    category: 'Nature & Tourism',
    tags: ['Free', 'Beginner-friendly', 'Family-friendly'],
    priceEUR: 0,
    organizerOrg: 'Black Pearl',
    organizerEmail: 'jack.sparrow@gmail.com',
    contactPerson: 'Jack Sparrow',
    description: 'A sea journey across the Helsinki archipelago with adventures and stops at picturesque locations.',
    photo: 'ship_sea.jpg',
  },
  {
    title: 'Pirate Festival with Music & Dance',
    date: '22.07.2026',
    location: 'Hietaniemi Beach, Helsinki',
    coords: '60.1774° N, 24.9110° E',
    type: 'event',
    category: 'Music & Performing Arts',
    tags: ['Open to All', 'Recurring Event', 'Free'],
    priceEUR: 0,
    organizerOrg: 'Black Pearl',
    organizerEmail: 'jack.sparrow@gmail.com',
    contactPerson: 'Jack Sparrow',
    description: 'A celebration of pirate culture with live music, dancing, and street performances.',
    photo: 'festival_stage.jpg',
  },
  {
    title: 'Pirate Cooking Masterclass',
    date: '10.08.2026',
    location: 'Old Market Hall, Helsinki',
    coords: '60.1675° N, 24.9530° E',
    type: 'event',
    category: 'Food & Cooking',
    tags: ['Special groups', 'Equipment Provided'],
    priceEUR: 50,
    organizerOrg: 'Black Pearl',
    organizerEmail: 'jack.sparrow@gmail.com',
    contactPerson: 'Jack Sparrow',
    description: 'A culinary masterclass on traditional pirate cuisine.',
    photo: 'cooking_class.jpg',
  },
  {
    title: 'Navigation, Knots & Survival at Sea',
    date: '05.06.2026',
    location: 'Espoo Waterfront (Otaniemi Marina)',
    coords: '60.1865° N, 24.8320° E',
    type: 'hobby_opportunity',
    category: 'Science & Technology',
    tags: ['Beginner-friendly', 'Free', 'Recurring Event'],
    priceEUR: 0,
    organizerOrg: 'Black Pearl',
    organizerEmail: 'jack.sparrow@gmail.com',
    contactPerson: 'Jack Sparrow',
    description: 'Training in navigation, maritime knots, and basic survival skills at sea.',
    photo: 'knots_maps.jpg',
  },

  // Flying Dutchman (Davy Jones)
  {
    title: 'Deep-Sea Shipwreck & Coral Reef Exploration',
    date: '12.06.2026',
    location: 'Seurasaari Island, Helsinki',
    coords: '60.1835° N, 24.8810° E',
    type: 'event',
    category: 'Science & Technology',
    tags: ['Online', 'Equipment Provided'],
    priceEUR: 30,
    organizerOrg: 'Flying Dutchman',
    organizerEmail: 'davy.jones@gmail.com',
    contactPerson: 'Davy Jones',
    description: 'Exploration of underwater worlds and local shipwreck legends.',
    photo: 'underwater_world.jpg',
  },
  {
    title: 'Miniature Shipbuilding Workshop',
    date: '20.07.2026',
    location: 'Espoo Museum of Modern Art (EMMA) Workshop / Online',
    coords: '60.2015° N, 24.6540° E',
    type: 'hobby_opportunity',
    category: 'Crafts & Art',
    tags: ['Senior-friendly', 'Registration Required'],
    priceEUR: 20,
    organizerOrg: 'Flying Dutchman',
    organizerEmail: 'davy.jones@gmail.com',
    contactPerson: 'Davy Jones',
    description: 'A practical workshop on building miniature ship models.',
    photo: 'ship_model.jpg',
  },
  {
    title: 'Mystical Quests & Maritime Legends',
    date: '01.08.2026',
    location: 'Online',
    coords: '–',
    type: 'club',
    category: 'Culture & History',
    tags: ['Online', 'Free', 'Adult-friendly'],
    priceEUR: 0,
    organizerOrg: 'Flying Dutchman',
    organizerEmail: 'davy.jones@gmail.com',
    contactPerson: 'Davy Jones',
    description: 'Online quests about maritime legends and myths.',
    photo: 'myths_sea_monsters.jpg',
  },

  // HMS Interceptor (James Norrington)
  {
    title: 'Family & Crew Events with Interactive Quests',
    date: '18.06.2026',
    location: 'Helsinki Zoo (Korkeasaari Island)',
    coords: '60.1756° N, 24.9844° E',
    type: 'club',
    category: 'Children & Families',
    tags: ['Child-friendly', 'Family-friendly', 'Free'],
    priceEUR: 0,
    organizerOrg: 'HMS Interceptor',
    organizerEmail: 'james.norrington@royalnavy.uk',
    contactPerson: 'James Norrington',
    description: 'Games and quests for children and families with the crew.',
    photo: 'children_pirates.jpg',
  },
  {
    title: 'Explorer Club – Sea Adventures',
    date: '25.06.2026',
    location: 'Espoo Archipelago / Clubhouse',
    coords: '60.1430° N, 24.7200° E',
    type: 'club',
    category: 'Community & Volunteering',
    tags: ['Free', 'Open to All', 'Recurring Event'],
    priceEUR: 0,
    organizerOrg: 'HMS Interceptor',
    organizerEmail: 'james.norrington@royalnavy.uk',
    contactPerson: 'James Norrington',
    description: 'An explorers’ club with regular sea adventures.',
    photo: 'explorers_flag.jpg',
  },
  {
    title: 'Pirate Duels & Naval Tactics',
    date: '30.06.2026',
    location: 'Espoo Sports Arena (Metro Areena)',
    coords: '60.1645° N, 24.7430° E',
    type: 'competition',
    category: 'Sports & Physical Activity',
    tags: ['Registration Required', 'Adult-friendly', 'Special groups'],
    priceEUR: 15,
    organizerOrg: 'HMS Interceptor',
    organizerEmail: 'james.norrington@royalnavy.uk',
    contactPerson: 'James Norrington',
    description: 'A tournament in naval fencing and battle tactics.',
    photo: 'dueling_pirates.jpg',
  },
  {
    title: 'Masterclass on Attack & Defense Strategies',
    date: '03.07.2026',
    location: 'Helsinki Maritime Centre',
    coords: '60.1670° N, 24.9550° E',
    type: 'event',
    category: 'Community & Volunteering',
    tags: ['Beginner-friendly', 'Registration Required'],
    priceEUR: 25,
    organizerOrg: 'HMS Interceptor',
    organizerEmail: 'james.norrington@royalnavy.uk',
    contactPerson: 'James Norrington',
    description: 'Training in attack and defense strategies in naval battles.',
    photo: 'battle_plans.jpg',
  },

  // Captain Salazar’s Ships
  {
    title: 'Knife & Musket Competition',
    date: '15.07.2026',
    location: 'Nuuksio National Park Arena, Espoo',
    coords: '60.3070° N, 24.5450° E',
    type: 'competition',
    category: 'Sports & Physical Activity',
    tags: ['Registration Required', 'Adult-friendly'],
    priceEUR: 20,
    organizerOrg: 'Captain Salazar’s Ships',
    organizerEmail: 'salazar.ships@islademuerta.org',
    contactPerson: 'Captain Salazar',
    description: 'A tournament in knife and musket skills.',
    photo: 'knife_musket.jpg',
  },
  {
    title: 'Night Hunts for Sea Monsters with Maps & Curses',
    date: '20.08.2026',
    location: 'Open Sea near Helsinki / Online',
    coords: '60.1000° N, 25.0000° E',
    type: 'activity',
    category: 'Games & Esports',
    tags: ['Online', 'Registration Required', 'Adult-friendly'],
    priceEUR: 10,
    organizerOrg: 'Captain Salazar’s Ships',
    organizerEmail: 'salazar.ships@islademuerta.org',
    contactPerson: 'Captain Salazar',
    description: 'Night hunts for sea monsters using maps and ancient curses.',
    photo: 'sea_monster_dark.jpg',
  },
];

// ---------- Core upserts ----------
async function ensureUserAndProfile({ fullName, email, password, phone, role, organization }) {
  // 1) Поиск пользователя по email
  let user = await findAuthUserByEmail(email);

  // 2) Создание (без phone, если невалидный)
  if (!user) {
    const e164 = toE164OrNull(phone);
    const payload = {
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    };
    if (e164) payload.phone = e164; // только валидный E.164, иначе пропускаем

    const { data: created, error: cErr } = await supabase.auth.admin.createUser(payload);
    if (cErr) throw new Error(`createUser(${email}) failed: ${cErr.message}`);
    user = created.user;
    await sleep(150);
  }

  const userId = user.id;

  // 3) Профиль (в профиле можно хранить оригинальный phone как текст)
  const isApproved = role === 'admin' || role === 'organizer';
  const profile = {
    id: userId,
    email,
    full_name: fullName,
    phone: phone || null,            // сохраняем как есть
    role: role || 'user',
    organization_name: organization || null,
    avatar_url: null,
    bio: null,
    isApproved,
  };
  const { error: pErr } = await supabase.from('user_profiles').upsert(profile, { onConflict: 'id' });
  if (pErr) throw new Error(`upsert user_profiles(${email}) failed: ${pErr.message}`);

  return userId;
}

async function upsertCategoriesAndMap() {
  const { error } = await supabase.from('categories').upsert(CATEGORIES, { onConflict: 'name' });
  if (error) throw new Error(`upsert categories failed: ${error.message}`);

  const names = CATEGORIES.map((c) => c.name);
  const { data, error: selErr } = await supabase.from('categories').select('id,name').in('name', names);
  if (selErr) throw new Error(`select categories failed: ${selErr.message}`);

  const map = new Map();
  for (const row of data) map.set(row.name, row.id);
  return map;
}

async function upsertTagsAndMap() {
  const { error } = await supabase.from('tags').upsert(TAGS, { onConflict: 'name' });
  if (error) throw new Error(`upsert tags failed: ${error.message}`);

  const names = TAGS.map((t) => t.name);
  const { data, error: selErr } = await supabase.from('tags').select('id,name').in('name', names);
  if (selErr) throw new Error(`select tags failed: ${selErr.message}`);

  const map = new Map();
  for (const row of data) map.set(row.name, row.id);
  return map;
}

async function upsertActivityAndTags({ ev, categoryId, organizerUserId, tagMap }) {
  const activityId = uuidv5(`activities:${ev.title}:${ev.organizerEmail}`, NAMESPACE);
  const startISO = parseDateEU(ev.date);
  const coords = parseCoords(ev.coords);

  const activity = {
    id: activityId,
    title: ev.title,
    description: ev.description,
    short_description: short(ev.description),
    type: ev.type,
    category_id: categoryId,
    location: ev.location,
    address: ev.location,
    coordinates: coords ? { lat: coords.lat, lng: coords.lng } : null,
    price: ev.priceEUR ?? 0,
    currency: 'EUR',
    image_url: ev.photo || null,
    user_id: organizerUserId,
    start_date: startISO,
    end_date: null,
    max_participants: null,
    min_age: null,
    max_age: null,
    contact_email: ev.organizerEmail,
    contact_phone: ORG_PHONES[ev.organizerOrg] || null, // хранится как текст
    external_link: null,
  };

  const { error: aErr } = await supabase.from('activities').upsert(activity, { onConflict: 'id' });
  if (aErr) throw new Error(`upsert activities("${ev.title}") failed: ${aErr.message}`);

  const tags = (ev.tags || []).map(normTag);
  if (tags.length > 0) {
    const rows = [];
    for (const t of tags) {
      const tagId = tagMap.get(t);
      if (!tagId) throw new Error(`Tag "${t}" not found in tagMap. Ensure TAGS contains it.`);
      rows.push({ activity_id: activityId, tag_id: tagId });
    }
    const { error: atErr } = await supabase
      .from('activity_tags')
      .upsert(rows, { onConflict: 'activity_id,tag_id' });
    if (atErr) throw new Error(`upsert activity_tags("${ev.title}") failed: ${atErr.message}`);
  }

  return activityId;
}

// ---------- Main ----------
(async () => {
  try {
    console.log('== Seeding Supabase (updated spec, phone-safe) ==');

    const userIdByEmail = new Map();

    // Base users
    for (const u of BASE_USERS) {
      const id = await ensureUserAndProfile({
        fullName: u.fullName,
        email: u.email,
        password: u.password,
        phone: u.phone,
        role: u.role,
        organization: null,
      });
      userIdByEmail.set(u.email, id);
      console.log(`User ok: ${u.email} -> ${id}`);
    }

    // Org reps
    for (const r of ORG_REPS) {
      const id = await ensureUserAndProfile({
        fullName: r.fullName,
        email: r.email,
        password: r.password,
        phone: r.phone,
        role: r.role,
        organization: r.organization,
      });
      userIdByEmail.set(r.email, id);
      console.log(`Rep ok: ${r.email} (${r.organization}) -> ${id}`);
    }

    const categoryMap = await upsertCategoriesAndMap();
    console.log(`Categories ok: ${categoryMap.size} mapped`);

    const tagMap = await upsertTagsAndMap();
    console.log(`Tags ok: ${tagMap.size} mapped`);

    const createdActivities = [];
    for (const ev of EVENTS) {
      const orgId = userIdByEmail.get(ev.organizerEmail);
      if (!orgId) throw new Error(`Organizer user not found: ${ev.organizerEmail}`);
      const catId = categoryMap.get(ev.category);
      if (!catId) throw new Error(`Category not found: ${ev.category}`);

      const actId = await upsertActivityAndTags({ ev, categoryId: catId, organizerUserId: orgId, tagMap });
      createdActivities.push({ title: ev.title, id: actId });
      console.log(`Activity ok: ${ev.title} -> ${actId}`);
    }

    console.log('\n== Completed ==');
    console.table(createdActivities);
  } catch (e) {
    console.error('SEED FAILED:', e.message);
    process.exit(1);
  }
})();
