import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, getDocs, query, where, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBLq5KEYwGoODg-IhX-KD_wq7glWW719d0',
  authDomain: 'twinxcarebackend.firebaseapp.com',
  projectId: 'twinxcarebackend',
  storageBucket: 'twinxcarebackend.firebasestorage.app',
  messagingSenderId: '791637368111',
  appId: '1:791637368111:web:2110bb059b6427ca3295da',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const defaultTheme = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1E293B',
  textDim: '#64748B',
  primary: '#81ade7',
  primaryGlow: 'rgba(129, 173, 231, 0.4)',
  accent: '#62b8ea',
  unselected: '#b1b1b1',
  unselectedTab: '#FFFFFF',
  icon: '#62b8ea',
  border: 'rgba(0, 0, 0, 0.05)',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  fontSize: 16,
};

const colorOptions = ['#ffffff', '#000000', '#4a90e2', '#f5f5f5', '#ff5252', '#00c853', '#ffd54f', '#9e9e9e', '#2196f3', '#e0e0e0'];
const colorKeys = ['background', 'text', 'primary', 'unselected', 'unselectedTab', 'icon'];

const presets = [
  {
    name: 'Standard',
    description: 'Balanced for general use',
    icon: 'fa-solid fa-table-cells-large',
    theme: { ...defaultTheme },
  },
  {
    name: 'High Contrast',
    description: 'Maximum legibility',
    icon: 'fa-solid fa-circle-half-stroke',
    theme: {
      background: '#000000',
      surface: '#121212',
      text: '#ffff00',
      textDim: '#cccccc',
      primary: '#cc2936',
      primaryGlow: 'rgba(204, 41, 54, 0.4)',
      accent: '#ffffff',
      unselected: '#cccccc',
      unselectedTab: '#333333',
      icon: '#ffffff',
      border: 'rgba(255, 255, 255, 0.2)',
      success: '#00ff00',
      danger: '#ff0000',
      warning: '#ffaa00',
      fontSize: 16,
    },
  },
  {
    name: 'Eye Comfort',
    description: 'Reduced blue light strain',
    icon: 'fa-solid fa-sun',
    theme: {
      background: '#fffbf0',
      surface: '#fffdf9',
      text: '#3e2723',
      textDim: '#8d6e63',
      primary: '#d84315',
      primaryGlow: 'rgba(216, 67, 21, 0.4)',
      accent: '#fb8c00',
      unselected: '#a1887f',
      unselectedTab: '#efebe9',
      icon: '#8d6e63',
      border: 'rgba(62, 39, 35, 0.08)',
      success: '#2e7d32',
      danger: '#c62828',
      warning: '#ef6c00',
      fontSize: 16,
    },
  },
];

const homeTranslations = {
  en: {
    home: 'Home',
    bookEquipment: 'Book Equipment',
    services: 'Escort',
    myRentals: 'Bookings',
    welcome: 'Welcome',
    createAccount: 'Create an Account',
    login: 'Login',
    submitFeedback: 'Submit Feedback',
    orderHistory: 'History',
    signInToSeeHistory: 'Sign in to see order history.',
    noOrders: 'No orders yet.',
    seeFullHistory: 'See full history',
    amount: 'Amount',
  },
  zh: {
    home: '首页',
    bookEquipment: '租借设备',
    services: '陪诊',
    myRentals: '预订',
    welcome: '欢迎',
    createAccount: '创建账户',
    login: '登录',
    submitFeedback: '提交反馈',
    orderHistory: '历史记录',
    signInToSeeHistory: '登录以查看订单历史。',
    noOrders: '暂无订单。',
    seeFullHistory: '查看完整历史',
    amount: '金额',
  },
};

const state = {
  route: getInitialRoute(),
  lang: localStorage.getItem('twx-lang') || 'en',
  fontSize: localStorage.getItem('twx-font-size') || 'medium',
  exploreMode: 'equipment',
  exploreSearch: '',
  theme: loadTheme(),
  user: null,
  userDoc: null,
  equipment: [],
  serviceCatalog: [],
  requests: [],
  availabilities: [],
  orderHistory: [],
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

init();

async function init() {
  applyTheme(state.theme);
  applyFontSize(state.fontSize);
  wireNavigation();
  wireExplore();
  wireSettings();
  renderSettings();
  renderRoute();

  await Promise.all([fetchVersion(), fetchEquipment(), fetchServices()]);
  renderExplore();

  onAuthStateChanged(auth, async (user) => {
    state.user = user;
    state.userDoc = null;
    state.requests = [];
    state.availabilities = [];
    state.orderHistory = [];

    if (user) {
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      state.userDoc = userSnap.exists() ? userSnap.data() : null;

      if (state.userDoc?.theme) {
        state.theme = { ...state.theme, ...state.userDoc.theme };
        applyTheme(state.theme);
        renderSettings();
      }

      await Promise.all([fetchEscortDashboard(), fetchHistory()]);
    }

    renderProfile();
    renderHome();
    renderServices();
    renderDelivery();
  });
}

function getInitialRoute() {
  const route = window.location.hash.replace('#', '').trim();
  return ['home', 'explore', 'services', 'delivery', 'settings'].includes(route) ? route : 'home';
}

function loadTheme() {
  try {
    const saved = JSON.parse(localStorage.getItem('twx-theme') || 'null');
    return saved ? { ...defaultTheme, ...saved } : { ...defaultTheme };
  } catch {
    return { ...defaultTheme };
  }
}

function applyTheme(theme) {
  const root = document.documentElement;
  Object.entries(theme).forEach(([key, value]) => {
    const cssKey = key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
    root.style.setProperty(`--${cssKey}`, String(value));
  });
  localStorage.setItem('twx-theme', JSON.stringify(theme));
}

function applyFontSize(size) {
  const value = size === 'small' ? '14px' : size === 'large' ? '20px' : '16px';
  document.documentElement.style.setProperty('--font-size', value);
  localStorage.setItem('twx-font-size', size);
}

function wireNavigation() {
  $$('[data-route]').forEach((button) => {
    button.addEventListener('click', () => setRoute(button.dataset.route));
  });

  $$('[data-route-jump]').forEach((button) => {
    button.addEventListener('click', () => setRoute(button.dataset.routeJump));
  });

  window.addEventListener('hashchange', () => {
    state.route = getInitialRoute();
    renderRoute();
  });
}

function setRoute(route) {
  state.route = route;
  window.location.hash = route;
  renderRoute();
}

function renderRoute() {
  const titles = {
    home: 'Home',
    explore: 'Equipment',
    services: 'Escort',
    delivery: 'Delivery',
    settings: 'Settings',
  };

  $('#pageTitle').textContent = titles[state.route];

  $$('.screen').forEach((screen) => {
    screen.classList.toggle('active', screen.id === `screen-${state.route}`);
  });

  $$('[data-route]').forEach((button) => {
    button.classList.toggle('active', button.dataset.route === state.route);
  });
}

function wireExplore() {
  $('#exploreSearch').addEventListener('input', (event) => {
    state.exploreSearch = event.target.value.trim().toLowerCase();
    renderExplore();
  });

  $('#modeEquipment').addEventListener('click', () => {
    state.exploreMode = 'equipment';
    syncExploreMode();
    renderExplore();
  });

  $('#modeServices').addEventListener('click', () => {
    state.exploreMode = 'services';
    syncExploreMode();
    renderExplore();
  });

  syncExploreMode();
}

function syncExploreMode() {
  $('#modeEquipment').classList.toggle('active', state.exploreMode === 'equipment');
  $('#modeServices').classList.toggle('active', state.exploreMode === 'services');
}

function wireSettings() {
  $('#languageSelect').value = state.lang;
  $('#fontSizeSelect').value = state.fontSize;

  $('#languageSelect').addEventListener('change', (event) => {
    state.lang = event.target.value;
    localStorage.setItem('twx-lang', state.lang);
    renderHome();
  });

  $('#fontSizeSelect').addEventListener('change', (event) => {
    state.fontSize = event.target.value;
    applyFontSize(state.fontSize);
  });

  $('#resetThemeBtn').addEventListener('click', async () => {
    state.theme = { ...defaultTheme };
    applyTheme(state.theme);
    await persistTheme();
    renderSettings();
  });
}

async function fetchVersion() {
  try {
    const snap = await getDoc(doc(db, 'version', 'verProd'));
    if (!snap.exists()) return;
    const data = snap.data();
    const version = data.version || Object.values(data)[0] || 'unknown';
    $('#versionText').textContent = `TwinXCare alpha-${version} build`;
  } catch {
    $('#versionText').textContent = 'TwinXCare alpha build';
  }
}

async function fetchEquipment() {
  try {
    const snapshot = await getDocs(collection(db, 'equipment'));
    state.equipment = snapshot.docs.map((entry) => {
      const data = entry.data();
      return {
        id: entry.id,
        name: data.name || 'Unnamed gear',
        brand: data.brand || 'Premium',
        stock: data.stock || 0,
        price: Number(data.price || 0),
        description: data.description || '',
        image: convertGoogleDriveLink(data.image),
      };
    });
  } catch {
    state.equipment = [];
  }
}

async function fetchServices() {
  try {
    const snapshot = await getDocs(collection(db, 'services'));
    state.serviceCatalog = snapshot.docs.map((entry) => {
      const data = entry.data();
      return {
        id: entry.id,
        name: data.name || 'Service',
        company: data.company || data.brand || 'TwinXCare',
        duration: data.duration || 'Flexible',
        price: Number(data.price || 0),
        description: data.description || '',
        image: convertGoogleDriveLink(data.image),
        schedule: Array.isArray(data.schedule) ? data.schedule : [],
      };
    });
  } catch {
    state.serviceCatalog = [];
  }
}

async function fetchEscortDashboard() {
  if (!state.user) return;

  const role = state.userDoc?.role || null;
  const userType = state.userDoc?.userType || null;
  const uid = state.user.uid;

  try {
    if (userType === 'standard' || role === 'admin' || !userType) {
      const requestQuery = query(collection(db, 'escort', 'request', 'entries'), where('userId', '==', uid));
      const requestSnap = await getDocs(requestQuery);
      state.requests = requestSnap.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
    }

    if (userType === 'escort' || role === 'admin') {
      const availabilityQuery = query(collection(db, 'escort', 'availability', 'entries'), where('providerId', '==', uid));
      const availabilitySnap = await getDocs(availabilityQuery);
      state.availabilities = availabilitySnap.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
    }
  } catch {
    state.requests = [];
    state.availabilities = [];
  }

  renderServices();
}

async function fetchHistory() {
  if (!state.user) return;

  try {
    const userSnap = await getDoc(doc(db, 'users', state.user.uid));
    if (!userSnap.exists()) {
      state.orderHistory = [];
      return;
    }

    const data = userSnap.data();
    const history = [
      ...((data.history || []).map((entry) => ({ ...entry, type: 'order' }))),
      ...((data.booking || []).map((entry) => ({ ...entry, type: 'booking' }))),
    ];

    history.sort((a, b) => new Date(b.createdAt || b.orderTime || b.bookingDate || 0).getTime() - new Date(a.createdAt || a.orderTime || a.bookingDate || 0).getTime());
    state.orderHistory = history;
  } catch {
    state.orderHistory = [];
  }

  renderHome();
  renderDelivery();
}

function renderProfile() {
  const label = state.userDoc?.username || state.user?.email || 'Guest';
  const initial = label.includes('@') ? label.split('@')[0][0] : label[0];
  $('#profileInitial').textContent = (initial || 'G').toUpperCase();
  $('#profilePill').title = label;
}

function renderHome() {
  const t = homeTranslations[state.lang] || homeTranslations.en;
  const authPanel = $('#homeAuthPanel');
  const historyStrip = $('#homeHistory');

  if (!state.user) {
    authPanel.innerHTML = `
      <div class="auth-box">
        <i class="fa-solid fa-user-plus"></i>
        <div>
          <strong>${t.welcome}</strong>
          <p>Authentication remains handled by the main app. This web shell still lets guests browse equipment and service catalogs.</p>
          <div class="auth-actions">
            <span class="text-pill">${t.createAccount}</span>
            <span class="text-pill">${t.login}</span>
          </div>
        </div>
      </div>
    `;
  } else {
    authPanel.innerHTML = `
      <div class="auth-box">
        <i class="fa-solid fa-circle-check"></i>
        <div>
          <strong>${t.submitFeedback}</strong>
          <p>Signed in as ${escapeHtml(state.userDoc?.username || state.user.email || 'user')}. Role-aware history and escort data are active.</p>
        </div>
      </div>
    `;
  }

  if (!state.user) {
    historyStrip.innerHTML = `<div class="empty-card"><i class="fa-solid fa-lock"></i><div><strong>${t.orderHistory}</strong><p>${t.signInToSeeHistory}</p></div></div>`;
    return;
  }

  if (!state.orderHistory.length) {
    historyStrip.innerHTML = `<div class="empty-card"><i class="fa-solid fa-box-open"></i><div><strong>${t.orderHistory}</strong><p>${t.noOrders}</p></div></div>`;
    return;
  }

  historyStrip.innerHTML = state.orderHistory.slice(0, 5).map((entry) => `
    <article class="history-card">
      <div class="timeline-head">
        <h4>${escapeHtml(entry.name || entry.title || 'Booking')}</h4>
        <span class="status-chip ${statusClass(entry.status)}">${escapeHtml(entry.status || 'Pending')}</span>
      </div>
      <p class="meta-line">${t.amount}: $${escapeHtml(String(entry.totalPrice || entry.price || '0'))}</p>
      <p class="meta-line">${escapeHtml(formatRange(entry.rentalStart, entry.rentalEnd, entry.bookingDate))}</p>
    </article>
  `).join('');
}

function renderExplore() {
  const list = state.exploreMode === 'equipment' ? state.equipment : state.serviceCatalog;
  const filtered = list.filter((item) => `${item.name} ${item.brand || item.company || ''}`.toLowerCase().includes(state.exploreSearch));
  const grid = $('#exploreGrid');
  const empty = $('#exploreEmpty');
  const noun = state.exploreMode === 'equipment' ? 'equipment' : 'services';

  $('#exploreCount').textContent = `${filtered.length} ${noun} available`;

  if (!filtered.length) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  grid.innerHTML = filtered.map((item) => {
    const footer = state.exploreMode === 'equipment'
      ? `${item.stock || 0} in stock`
      : item.duration || 'Flexible duration';

    return `
      <article class="catalog-card">
        <img src="${escapeHtml(item.image || fallbackImage())}" alt="${escapeHtml(item.name)}">
        <div class="catalog-body">
          <div class="catalog-top">
            <div>
              <h4>${escapeHtml(item.name)}</h4>
              <p class="meta-line">${escapeHtml(item.brand || item.company || 'TwinXCare')}</p>
            </div>
            <span class="price-tag">$${escapeHtml(String(item.price || 0))}</span>
          </div>
          <p class="meta-line">${escapeHtml((item.description || '').slice(0, 90) || 'Live catalog item from Firestore.')}</p>
          <div class="catalog-footer">${escapeHtml(footer)}</div>
        </div>
      </article>
    `;
  }).join('');
}

function renderServices() {
  const role = state.userDoc?.role || null;
  const userType = state.userDoc?.userType || null;
  const subtitle = (role === 'admin' || userType === 'escort')
    ? 'Volunteer and escort patients'
    : 'Monitor the status of your escort requests';

  $('#servicesSubtitle').textContent = subtitle;
  $('#adminPanel').classList.toggle('hidden', role !== 'admin');
  $('#patientPanel').classList.toggle('hidden', !(userType === 'standard' || role === 'admin' || !userType));
  $('#escortPanel').classList.toggle('hidden', !(userType === 'escort' || role === 'admin'));

  $('#requestList').innerHTML = renderJobList(
    state.user ? state.requests : [],
    state.user
      ? 'No active escort requests found.'
      : 'Sign in through the main app to see patient requests tied to your account.',
    (entry) => `
      <article class="job-card">
        <div class="timeline-head">
          <h4>${escapeHtml(entry.hospital || 'Hospital')}</h4>
          <span class="status-chip ${statusClass(entry.status)}">${escapeHtml(entry.status || 'pending')}</span>
        </div>
        <div class="job-meta">
          <span><i class="fa-regular fa-calendar"></i> ${escapeHtml(entry.date || 'Date pending')}</span>
          <span><i class="fa-regular fa-clock"></i> ${escapeHtml(entry.time || 'Time pending')}</span>
        </div>
        ${entry.status === 'matched' ? '<div class="match-banner">Volunteer assigned</div>' : ''}
        ${entry.status === 'confirmed' ? '<div class="match-banner">Job confirmed and locked</div>' : ''}
      </article>
    `,
  );

  $('#availabilityList').innerHTML = renderJobList(
    state.user ? state.availabilities : [],
    state.user
      ? 'No availability slots posted.'
      : 'Sign in through the main app to see your volunteer availability.',
    (entry) => `
      <article class="job-card">
        <div class="timeline-head">
          <h4>${escapeHtml(entry.location || 'Location')}</h4>
          <span class="status-chip ${statusClass(entry.status)}">${escapeHtml(entry.status || 'available')}</span>
        </div>
        <div class="job-meta">
          <span><i class="fa-regular fa-calendar"></i> ${escapeHtml(entry.date || 'Date pending')}</span>
          <span><i class="fa-regular fa-clock"></i> ${escapeHtml(`${entry.fromTime || '--'} - ${entry.toTime || '--'}`)}</span>
        </div>
        ${entry.status === 'matched' ? '<div class="match-banner">Matched with patient</div>' : ''}
        ${entry.status === 'confirmed' ? '<div class="match-banner">Job confirmed and locked</div>' : ''}
      </article>
    `,
  );
}

function renderJobList(items, emptyText, itemRenderer) {
  if (!items.length) {
    return `<div class="empty-card"><i class="fa-regular fa-folder-open"></i><div><strong>Nothing here yet</strong><p>${escapeHtml(emptyText)}</p></div></div>`;
  }

  return items.map(itemRenderer).join('');
}

function renderDelivery() {
  const hero = $('#deliveryHero');
  const list = $('#deliveryList');
  const latest = state.orderHistory[0];

  $('#deliveryCount').textContent = String(state.orderHistory.length);

  if (!state.user) {
    hero.innerHTML = `<div class="empty-card"><i class="fa-solid fa-user-lock"></i><div><strong>Sign in required</strong><p>Delivery and booking history is shown when a Firebase-authenticated session is available.</p></div></div>`;
    list.innerHTML = '';
    return;
  }

  if (!latest) {
    hero.innerHTML = `<div class="empty-card"><i class="fa-solid fa-basket-shopping"></i><div><strong>No active orders found</strong><p>Your latest order or booking will appear here once activity is recorded.</p></div></div>`;
    list.innerHTML = '';
    return;
  }

  hero.innerHTML = `
    <div class="section-head">
      <div>
        <p class="eyebrow">${latest.type === 'order' ? 'Latest order' : 'Latest booking'}</p>
        <h3>${escapeHtml(latest.name || latest.title || 'Recent activity')}</h3>
      </div>
      <span class="status-chip ${statusClass(latest.status)}">${escapeHtml(latest.status || 'Confirmed')}</span>
    </div>
    <div class="detail-grid">
      <div class="detail-block">
        <span class="detail-label">Date</span>
        <span>${escapeHtml(formatDate(latest.orderTime || latest.bookingDate || latest.createdAt))}</span>
      </div>
      <div class="detail-block">
        <span class="detail-label">Type</span>
        <span>${latest.type === 'order' ? 'Equipment order' : 'Service booking'}</span>
      </div>
    </div>
    ${latest.deliveryEta ? `<div class="match-banner">Delivery ETA: ${escapeHtml(latest.deliveryEta)}</div>` : ''}
  `;

  list.innerHTML = state.orderHistory.map((entry, index) => `
    <article class="timeline-card">
      <button class="timeline-trigger" type="button" data-timeline-index="${index}">
        <div class="timeline-head">
          <h4>${escapeHtml(entry.type === 'order' ? `${entry.name || 'Order'}${entry.quantity ? ` (x${entry.quantity})` : ''}` : entry.title || 'Booking')}</h4>
          <i class="fa-solid fa-chevron-down"></i>
        </div>
        <div class="timeline-meta">
          <span>${escapeHtml(formatDate(entry.orderTime || entry.bookingDate || entry.createdAt))}</span>
          <span class="status-chip ${statusClass(entry.status)}">${escapeHtml(entry.status || 'Confirmed')}</span>
        </div>
      </button>
      <div class="timeline-extra hidden" id="timeline-extra-${index}">
        <div class="detail-grid">
          <div class="detail-block">
            <span class="detail-label">Reference</span>
            <span>${escapeHtml(entry.transactionId || 'N/A')}</span>
          </div>
          <div class="detail-block">
            <span class="detail-label">Total</span>
            <span>${escapeHtml(entry.type === 'order' ? `$${entry.totalPrice || 0}` : 'Prepaid / Included')}</span>
          </div>
        </div>
        <div class="detail-block">
          <span class="detail-label">${entry.type === 'order' ? 'Delivery address' : 'Slot details'}</span>
          <span>${escapeHtml(entry.type === 'order' ? entry.deliveryAddress || 'Address unavailable' : `${entry.timeSlot || 'Anytime'} • ${entry.description || 'No notes'}`)}</span>
        </div>
      </div>
    </article>
  `).join('');

  $$('[data-timeline-index]').forEach((button) => {
    button.addEventListener('click', () => {
      const extra = $(`#timeline-extra-${button.dataset.timelineIndex}`);
      extra.classList.toggle('hidden');
      const icon = button.querySelector('i');
      icon.className = `fa-solid ${extra.classList.contains('hidden') ? 'fa-chevron-down' : 'fa-chevron-up'}`;
    });
  });
}

function renderSettings() {
  const presetList = $('#presetList');
  presetList.innerHTML = presets.map((preset) => {
    const isActive = colorKeys.every((key) => state.theme[key] === preset.theme[key]);
    return `
      <button class="preset-card ${isActive ? 'active' : ''}" type="button" data-preset="${escapeHtml(preset.name)}">
        <span class="preset-icon" style="background:${escapeHtml(`${preset.theme.primary}20`)};color:${escapeHtml(preset.theme.primary)}">
          <i class="${escapeHtml(preset.icon)}"></i>
        </span>
        <span class="preset-copy">
          <strong>${escapeHtml(preset.name)}</strong>
          <small>${escapeHtml(preset.description)}</small>
        </span>
      </button>
    `;
  }).join('');

  $$('[data-preset]').forEach((button) => {
    button.addEventListener('click', async () => {
      const preset = presets.find((entry) => entry.name === button.dataset.preset);
      if (!preset) return;
      state.theme = { ...preset.theme };
      applyTheme(state.theme);
      await persistTheme();
      renderSettings();
    });
  });

  const tokenEditor = $('#tokenEditor');
  tokenEditor.innerHTML = colorKeys.map((key) => `
    <div class="token-row">
      <strong>${escapeHtml(key.toUpperCase())}</strong>
      <div class="swatch-grid">
        ${colorOptions.map((color) => `
          <button class="swatch ${state.theme[key] === color ? 'active' : ''}" type="button" data-token="${escapeHtml(key)}" data-color="${escapeHtml(color)}" style="background:${escapeHtml(color)}"></button>
        `).join('')}
      </div>
    </div>
  `).join('');

  $$('[data-token]').forEach((button) => {
    button.addEventListener('click', async () => {
      state.theme = { ...state.theme, [button.dataset.token]: button.dataset.color };
      applyTheme(state.theme);
      await persistTheme();
      renderSettings();
    });
  });
}

async function persistTheme() {
  localStorage.setItem('twx-theme', JSON.stringify(state.theme));
  if (!state.user) return;

  try {
    await setDoc(doc(db, 'users', state.user.uid), { theme: state.theme }, { merge: true });
  } catch {
    // Local state still updates even if Firestore sync fails.
  }
}

function convertGoogleDriveLink(link) {
  if (!link) return fallbackImage();
  const match = link.match(/\/d\/(.*?)\//);
  return match?.[1] ? `https://drive.google.com/uc?export=view&id=${match[1]}` : link;
}

function fallbackImage() {
  return '../assets/images/hero-app.png';
}

function statusClass(status) {
  return String(status || 'pending').toLowerCase().replace(/\s+/g, '-');
}

function formatDate(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRange(start, end, single) {
  if (start && end) {
    return `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`;
  }
  if (single) return formatDate(single);
  return 'Date pending';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
