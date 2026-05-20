/* ════════════════════════════════════════════════════════
   app.js — вся логика MovieFinder
════════════════════════════════════════════════════════ */

/* ─── DOM REFS ──────────────────────────────────────── */
const $input    = document.getElementById('search-input');
const $btn      = document.getElementById('search-btn');
const $grid     = document.getElementById('grid');
const $spinner  = document.getElementById('spinner');
const $error    = document.getElementById('error-msg');
const $empty    = document.getElementById('empty');
const $label    = document.getElementById('section-label');
const $backdrop = document.getElementById('modal-backdrop');
const $mHero    = document.getElementById('modal-hero');
const $mBody    = document.getElementById('modal-body');

/* ─── HELPERS ───────────────────────────────────────── */
function ratingClass(r) {
  if (!r) return 'badge-grey';
  if (r >= 7) return 'badge-green';
  if (r >= 5) return 'badge-yellow';
  return 'badge-red';
}

function ratingColor(r) {
  if (!r) return 'var(--muted)';
  if (r >= 7) return 'var(--green)';
  if (r >= 5) return 'var(--yellow)';
  return 'var(--red)';
}

function fmt(n) {
  return n ? n.toLocaleString('ru-RU') + ' $' : 'Нет данных';
}

function posterHTML(url, title) {
  if (url) return `<img src="${url}" alt="${title}" loading="lazy" />`;
  return `<div class="poster-placeholder">
    <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.2">
      <rect x="2" y="2" width="20" height="20" rx="2.5"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
    <span>Нет постера</span>
  </div>`;
}

/* ─── UI STATE ──────────────────────────────────────── */
function showSpinner()  { $spinner.classList.add('active'); }
function hideSpinner()  { $spinner.classList.remove('active'); }
function showEmpty()    { $empty.classList.add('active'); }
function hideEmpty()    { $empty.classList.remove('active'); }
function showError(msg) { $error.textContent = msg; $error.classList.add('active'); }
function hideError()    { $error.classList.remove('active'); }

function clearResults() {
  $grid.innerHTML = '';
  hideEmpty();
  hideError();
}

/* ─── RENDER CARDS ──────────────────────────────────── */
function renderCards(films) {
  $grid.innerHTML = '';
  if (!films.length) { showEmpty(); return; }

  films.forEach((f, i) => {
    const title  = f.nameRu || f.nameEn || 'Без названия';
    const year   = f.year || '—';
    const rating = f.ratingKinopoisk || f.rating || null;
    const poster = f.posterUrlPreview || f.posterUrl || null;
    const rc     = ratingClass(rating);

    const card = document.createElement('div');
    card.className = 'card';
    card.style.animationDelay = `${i * 0.05}s`;
    card.innerHTML = `
      <div class="poster-wrap">
        ${posterHTML(poster, title)}
        ${rating ? `<div class="badge-rating ${rc}">${rating}</div>` : ''}
        <div class="card-overlay">
          <button class="overlay-btn">Подробнее</button>
        </div>
      </div>
      <div class="card-body">
        <div class="card-title">${title}</div>
        <div class="card-year">${year}</div>
      </div>`;

    card.addEventListener('click', () => openModal(f));
    $grid.appendChild(card);
  });
}

/* ─── MODAL ─────────────────────────────────────────── */
async function openModal(film) {
  let f = film;

  // Загружаем полные данные о фильме из API если их нет
  if (!film.description && film.kinopoiskId) {
    try {
      const r = await fetch(`${BASE}/${film.kinopoiskId}`, {
        headers: { 'X-API-KEY': API_KEY }
      });
      if (r.ok) f = await r.json();
    } catch (_) {}
  }

  const title   = f.nameRu || f.nameEn || 'Без названия';
  const year    = f.year || '—';
  const rating  = f.ratingKinopoisk || null;
  const poster  = f.posterUrl || f.posterUrlPreview || null;
  const tagline = f.slogan || '';
  const desc    = f.description || f.shortDescription || 'Описание отсутствует.';
  const genres  = (f.genres || []).map(g => g.genre || g).filter(Boolean);
  const mins    = f.filmLength;
  const budget  = f.budget;
  const actors  = f.actors || [];

  $mHero.innerHTML = `
    ${poster
      ? `<img class="modal-poster" src="${poster}" alt="${title}" />`
      : `<div class="modal-poster-ph">
           <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.2">
             <rect x="2" y="2" width="20" height="20" rx="2.5"/>
             <circle cx="8.5" cy="8.5" r="1.5"/>
             <polyline points="21 15 16 10 5 21"/>
           </svg>
         </div>`
    }
    <div class="modal-hero-info">
      <div class="modal-title">${title}</div>
      ${tagline ? `<div class="modal-tagline">${tagline}</div>` : ''}
      <div class="modal-meta">
        <span class="tag">📅 ${year}</span>
        ${mins    ? `<span class="tag">⏱ ${mins} мин</span>`  : ''}
        ${budget  ? `<span class="tag">💰 ${fmt(budget)}</span>` : ''}
      </div>
      ${genres.length
        ? `<div class="genres-list" style="margin-top:10px">
             ${genres.map(g => `<span class="genre-pill">${g}</span>`).join('')}
           </div>`
        : ''}
      ${rating
        ? `<div class="modal-rating-big" style="color:${ratingColor(rating)}">${rating}</div>`
        : `<div class="modal-rating-big" style="color:var(--muted)">N/A</div>`
      }
    </div>`;

  $mBody.innerHTML = `
    <div class="modal-section">
      <h3>Сюжет</h3>
      <p>${desc}</p>
    </div>
    ${actors.length ? `
    <div class="modal-section">
      <h3>Актёрский состав</h3>
      <div class="actors-list">
        ${actors.slice(0, 12).map(a => {
          const name = typeof a === 'string' ? a : (a.nameRu || a.nameEn || '');
          return name ? `<span class="actor-tag">${name}</span>` : '';
        }).join('')}
      </div>
    </div>` : ''}`;

  $backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $backdrop.classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('modal-close').addEventListener('click', closeModal);
$backdrop.addEventListener('click', e => { if (e.target === $backdrop) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ─── API CALLS ─────────────────────────────────────── */
async function fetchPopular() {
  showSpinner();
  try {
    const r = await fetch(
      `${BASE}?type=ALL&ratingFrom=7&ratingTo=10&order=RATING&page=1`,
      { headers: { 'X-API-KEY': API_KEY } }
    );
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    renderCards(data.items || data.films || []);
  } catch (e) {
    showError('Ошибка сети. Показываем встроенный каталог.');
    renderCards(FALLBACK);
  } finally {
    hideSpinner();
  }
}

async function fetchSearch(query) {
  $label.textContent = `Поиск: «${query}»`;
  showSpinner();
  clearResults();
  try {
    const r = await fetch(
      `https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=${encodeURIComponent(query)}&page=1`,
      { headers: { 'X-API-KEY': API_KEY } }
    );
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    renderCards(data.films || []);
  } catch (e) {
    showError('Ошибка при поиске. Проверьте подключение к сети.');
  } finally {
    hideSpinner();
  }
}

/* ─── EVENTS ────────────────────────────────────────── */
let debounceTimer;

$input.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const q = $input.value.trim();
    if (q) fetchSearch(q);
    else { $label.textContent = 'Популярное'; fetchPopular(); }
  }
});

$btn.addEventListener('click', () => {
  const q = $input.value.trim();
  if (q) fetchSearch(q);
  else { $label.textContent = 'Популярное'; fetchPopular(); }
});

$input.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  const q = $input.value.trim();
  if (!q) { $label.textContent = 'Популярное'; fetchPopular(); return; }
  debounceTimer = setTimeout(() => fetchSearch(q), 500);
});

/* ─── INIT ──────────────────────────────────────────── */
fetchPopular();