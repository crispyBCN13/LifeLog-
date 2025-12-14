// =========================
// STATE + STORAGE
// =========================
const STORAGE_KEY = "myTrackerState";

let state = {
  categories: [], // { id, name, color }
  entries: []     // { id, text, type, category, notes, imagePath, videoPath, timestamp }
};

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const json = localStorage.getItem(STORAGE_KEY);
  if (json) {
    try {
      state = JSON.parse(json);
    } catch (e) {
      console.error("Failed to parse saved state, starting fresh:", e);
      state = { categories: [], entries: [] };
    }
  } else {
    state = { categories: [], entries: [] };
  }

  renderCategories();
  renderEntries();
  renderPatterns();
  renderProjections();
}

// -------------------------
// ELEMENT REFERENCES
// -------------------------
const categoryForm = document.getElementById('categoryForm');
const categoryNameInput = document.getElementById('categoryName');
const categoryColorInput = document.getElementById('categoryColor');
const categoryList = document.getElementById('categoryList');

const entryForm = document.getElementById('entryForm');
const entryTextInput = document.getElementById('entryText');
const entryTypeSelect = document.getElementById('entryType');
const entryCategorySelect = document.getElementById('entryCategory');
const entryNotesInput = document.getElementById('entryNotes');
const entryImageInput = document.getElementById('entryImage');
const entryVideoInput = document.getElementById('entryVideo');

const entryList = document.getElementById('entryList');

const searchTextInput = document.getElementById('searchText');
const filterCategorySelect = document.getElementById('filterCategory');
const filterTimeSelect = document.getElementById('filterTime');

// Tracking & Patterns elements
const statEntriesWeek = document.getElementById('statEntriesWeek');
const statEntriesMonth = document.getElementById('statEntriesMonth');
const statMostCategory = document.getElementById('statMostCategory');
const statMostCategoryCount = document.getElementById('statMostCategoryCount');
const statLeastCategory = document.getElementById('statLeastCategory');
const statLeastCategoryCount = document.getElementById('statLeastCategoryCount');
const categoryBarsContainer = document.getElementById('categoryBars');

// Future Projections elements
const projectionCategorySelect = document.getElementById('projectionCategory');
const projectionMultiplierInput = document.getElementById('projectionMultiplier');
const projectionMultiplierLabel = document.getElementById('projectionMultiplierLabel');

const proj30El = document.getElementById('proj30');
const proj180El = document.getElementById('proj180');
const proj365El = document.getElementById('proj365');
const proj30DescEl = document.getElementById('proj30Desc');
const proj180DescEl = document.getElementById('proj180Desc');
const proj365DescEl = document.getElementById('proj365Desc');
const projBaseInfoEl = document.getElementById('projBaseInfo');

const filters = {
  searchText: '',
  category: '',
  days: 'all'
};

// Auto-resize textarea as you type
function autoResizeTextarea(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}
if (entryNotesInput) {
  entryNotesInput.addEventListener('input', () => autoResizeTextarea(entryNotesInput));
}

// Wire up filter events
if (searchTextInput) {
  searchTextInput.addEventListener('input', () => {
    filters.searchText = searchTextInput.value;
    renderEntries();
  });
}

if (filterCategorySelect) {
  filterCategorySelect.addEventListener('change', () => {
    filters.category = filterCategorySelect.value;
    renderEntries();
  });
}

if (filterTimeSelect) {
  filterTimeSelect.addEventListener('change', () => {
    filters.days = filterTimeSelect.value;
    renderEntries();
  });
}

// Projection controls
if (projectionMultiplierInput) {
  projectionMultiplierInput.addEventListener('input', () => {
    const val = parseFloat(projectionMultiplierInput.value) || 1;
    if (projectionMultiplierLabel) {
      projectionMultiplierLabel.textContent = val.toFixed(1) + '×';
    }
    renderProjections();
  });
}

if (projectionCategorySelect) {
  projectionCategorySelect.addEventListener('change', () => renderProjections());
}

// -------------------------
// CATEGORY LOGIC
// -------------------------
function addCategory(name, color) {
  const newCategory = {
    id: Date.now().toString() + Math.random().toString(16).slice(2),
    name,
    color
  };
  state.categories.push(newCategory);
  saveState();
  renderCategories();
  renderPatterns();
  renderProjections();
}

if (categoryForm) {
  categoryForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const name = categoryNameInput.value.trim();
    const color = categoryColorInput.value;
    if (!name) return;
    addCategory(name, color);
    categoryNameInput.value = '';
  });
}

function isValidHexColor(value) {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

function editCategory(id) {
  const cat = state.categories.find(c => c.id === id);
  if (!cat) return;

  const newName = prompt('Edit category name:', cat.name);
  if (newName === null) return;

  const newColor = prompt('Edit color (hex, e.g. #ff0000):', cat.color);
  if (newColor === null) return;

  if (newName.trim() !== '') cat.name = newName.trim();

  if (isValidHexColor(newColor)) {
    cat.color = newColor;
  } else {
    alert('Invalid color format. Please use a hex code like #ff0000.');
  }

  saveState();
  renderCategories();
  renderPatterns();
  renderProjections();
}

function deleteCategory(id) {
  const cat = state.categories.find(c => c.id === id);
  if (!cat) return;

  const confirmDelete = confirm(`Delete category "${cat.name}"?`);
  if (!confirmDelete) return;

  state.categories = state.categories.filter(c => c.id !== id);

  // Clear category links from entries for that category
  state.entries = state.entries.map(entry => {
    if (entry.category === cat.name) return { ...entry, category: "" };
    return entry;
  });

  saveState();
  renderCategories();
  renderEntries();
  renderPatterns();
  renderProjections();
}

function renderCategories() {
  if (!categoryList) return;
  categoryList.innerHTML = '';

  state.categories.forEach(cat => {
    const tr = document.createElement('tr');
    tr.dataset.id = cat.id;

    const td = document.createElement('td');
    td.className = 'cat-row';

    const inner = document.createElement('div');
    inner.className = 'cat-inner';

    const left = document.createElement('div');
    left.className = 'cat-left';

    const colorDot = document.createElement('span');
    colorDot.className = 'color-dot';
    colorDot.style.backgroundColor = cat.color;

    const nameText = document.createElement('span');
    nameText.textContent = cat.name;

    left.appendChild(colorDot);
    left.appendChild(nameText);

    const btnGroup = document.createElement('div');
    btnGroup.className = 'cat-buttons';

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.type = 'button';
    editBtn.title = 'Edit';
    editBtn.textContent = '+';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.type = 'button';
    deleteBtn.title = 'Delete';
    deleteBtn.textContent = '-';

    editBtn.addEventListener('click', () => editCategory(cat.id));
    deleteBtn.addEventListener('click', () => deleteCategory(cat.id));

    btnGroup.appendChild(editBtn);
    btnGroup.appendChild(deleteBtn);

    inner.appendChild(left);
    inner.appendChild(btnGroup);

    td.appendChild(inner);
    tr.appendChild(td);

    categoryList.appendChild(tr);
  });

  refreshCategoryDropdowns();
}

function refreshCategoryDropdowns() {
  // Entry form category dropdown
  if (entryCategorySelect) {
    entryCategorySelect.innerHTML = '';
    const baseOption = document.createElement('option');
    baseOption.value = '';
    baseOption.textContent = 'No category';
    entryCategorySelect.appendChild(baseOption);

    state.categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.name;
      option.textContent = cat.name;
      entryCategorySelect.appendChild(option);
    });
  }

  // Filter dropdown
  if (filterCategorySelect) {
    filterCategorySelect.innerHTML = '';
    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'All categories';
    filterCategorySelect.appendChild(allOption);

    state.categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.name;
      option.textContent = cat.name;
      filterCategorySelect.appendChild(option);
    });
  }

  // Projections dropdown
  if (projectionCategorySelect) {
    projectionCategorySelect.innerHTML = '';
    const allOpt = document.createElement('option');
    allOpt.value = '';
    allOpt.textContent = 'All categories';
    projectionCategorySelect.appendChild(allOpt);

    state.categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.name;
      opt.textContent = cat.name;
      projectionCategorySelect.appendChild(opt);
    });
  }
}

// -------------------------
// ENTRY LOGIC
// -------------------------
function addEntry(text, type, category, notes, imagePath, videoPath) {
  const newEntry = {
    id: Date.now().toString() + Math.random().toString(16).slice(2),
    text,
    type,
    category,
    notes,
    imagePath,
    videoPath,
    timestamp: new Date().toISOString()
  };

  state.entries.unshift(newEntry);
  saveState();
  renderEntries();
  renderPatterns();
  renderProjections();
}

function deleteEntry(id) {
  const entry = state.entries.find(e => e.id === id);
  if (!entry) return;

  const confirmDelete = confirm("Delete this entry?");
  if (!confirmDelete) return;

  state.entries = state.entries.filter(e => e.id !== id);
  saveState();
  renderEntries();
  renderPatterns();
  renderProjections();
}

if (entryForm) {
  entryForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const text = entryTextInput.value.trim();
    const type = entryTypeSelect.value;
    const category = entryCategorySelect ? entryCategorySelect.value : '';
    const notes = entryNotesInput ? entryNotesInput.value.trim() : '';
    const imagePath = entryImageInput ? entryImageInput.value.trim() : '';
    const videoPath = entryVideoInput ? entryVideoInput.value.trim() : '';

    if (!text) return;

    addEntry(text, type, category, notes, imagePath, videoPath);

    entryTextInput.value = '';
    if (entryNotesInput) entryNotesInput.value = '';
    if (entryImageInput) entryImageInput.value = '';
    if (entryVideoInput) entryVideoInput.value = '';
    if (entryNotesInput) autoResizeTextarea(entryNotesInput);
  });
}

function renderEntries() {
  if (!entryList) return;
  entryList.innerHTML = '';

  const now = new Date();
  const search = filters.searchText.trim().toLowerCase();

  const filtered = state.entries.filter(entry => {
    if (filters.category && entry.category !== filters.category) return false;

    if (filters.days !== 'all') {
      const daysNum = parseInt(filters.days, 10);
      const entryTime = new Date(entry.timestamp);
      const diffMs = now - entryTime;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays > daysNum) return false;
    }

    if (search) {
      const haystack = [
        entry.text || '',
        entry.notes || '',
        entry.category || ''
      ].join(' ').toLowerCase();

      if (!haystack.includes(search)) return false;
    }

    return true;
  });

  filtered.forEach(entry => {
    const li = document.createElement('li');
    li.dataset.id = entry.id;

    const timestamp = new Date(entry.timestamp).toLocaleString();
    const categoryLabel = entry.category ? ` · Category: ${entry.category}` : '';

    const mainLine = document.createElement('div');
    mainLine.className = 'entry-main-line';

    const textSpan = document.createElement('span');
    textSpan.className = 'entry-text';
    textSpan.textContent = entry.text;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'entry-delete-btn';
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'Delete';
    deleteBtn.title = 'Delete entry';
    deleteBtn.addEventListener('click', () => deleteEntry(entry.id));

    mainLine.appendChild(textSpan);
    mainLine.appendChild(deleteBtn);

    const metaDiv = document.createElement('div');
    metaDiv.className = 'entry-meta';
    metaDiv.innerHTML = `
      <span class="entry-type-tag">[${entry.type}]</span>
      ${categoryLabel}
      · Logged at ${timestamp}
    `;

    li.appendChild(mainLine);
    li.appendChild(metaDiv);

    if (entry.notes && entry.notes.trim() !== '') {
      const notesDiv = document.createElement('div');
      notesDiv.className = 'entry-notes';
      notesDiv.textContent = entry.notes;
      li.appendChild(notesDiv);
    }

    if ((entry.imagePath && entry.imagePath.trim() !== '') ||
        (entry.videoPath && entry.videoPath.trim() !== '')) {

      const mediaDiv = document.createElement('div');
      mediaDiv.className = 'entry-media';

      if (entry.imagePath && entry.imagePath.trim() !== '') {
        const img = document.createElement('img');
        img.src = entry.imagePath;
        img.alt = 'Entry image';
        mediaDiv.appendChild(img);
      }

      if (entry.videoPath && entry.videoPath.trim() !== '') {
        const video = document.createElement('video');
        video.controls = true;
        const source = document.createElement('source');
        source.src = entry.videoPath;
        source.type = 'video/mp4';
        video.appendChild(source);
        mediaDiv.appendChild(video);
      }

      li.appendChild(mediaDiv);
    }

    entryList.appendChild(li);
  });
}

// -------------------------
// TRACKING & PATTERNS
// -------------------------
function renderPatterns() {
  if (!statEntriesWeek || !categoryBarsContainer) return;

  const now = new Date();
  let entriesLast7 = 0;
  let entriesLast30 = 0;

  const categoryCounts = {};
  state.categories.forEach(cat => { categoryCounts[cat.name] = 0; });

  state.entries.forEach(entry => {
    const entryTime = new Date(entry.timestamp);
    const diffMs = now - entryTime;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays <= 7) entriesLast7++;
    if (diffDays <= 30) entriesLast30++;

    if (entry.category) {
      if (!Object.prototype.hasOwnProperty.call(categoryCounts, entry.category)) {
        categoryCounts[entry.category] = 0;
      }
      categoryCounts[entry.category]++;
    }
  });

  statEntriesWeek.textContent = entriesLast7;
  statEntriesMonth.textContent = entriesLast30;

  const categoryNames = Object.keys(categoryCounts);
  if (categoryNames.length === 0) {
    statMostCategory.textContent = '–';
    statMostCategoryCount.textContent = '';
    statLeastCategory.textContent = '–';
    statLeastCategoryCount.textContent = '';
    categoryBarsContainer.innerHTML = '';
    return;
  }

  let mostName = null;
  let leastName = null;
  let mostCount = -Infinity;
  let leastCount = Infinity;

  categoryNames.forEach(name => {
    const count = categoryCounts[name];
    if (count > mostCount) { mostCount = count; mostName = name; }
    if (count < leastCount) { leastCount = count; leastName = name; }
  });

  statMostCategory.textContent = mostName ?? '–';
  statMostCategoryCount.textContent = mostCount > 0 ? `${mostCount} log(s)` : 'No logs yet';

  statLeastCategory.textContent = leastName ?? '–';
  statLeastCategoryCount.textContent = leastCount > 0 ? `${leastCount} log(s)` : 'No logs yet';

  categoryBarsContainer.innerHTML = '';
  const maxCount = Math.max(...categoryNames.map(n => categoryCounts[n]));

  if (maxCount === 0) {
    const msg = document.createElement('p');
    msg.style.fontSize = '0.9rem';
    msg.style.color = '#a3a3a3';
    msg.textContent = 'No entries yet. Once you start logging, your category breakdown will appear here.';
    categoryBarsContainer.appendChild(msg);
    return;
  }

  categoryNames.forEach(name => {
    const count = categoryCounts[name];

    const row = document.createElement('div');
    row.className = 'category-bar-row';

    const label = document.createElement('div');
    label.className = 'category-bar-label';
    label.textContent = `${name}: ${count} log(s)`;

    const track = document.createElement('div');
    track.className = 'category-bar-track';

    const fill = document.createElement('div');
    fill.className = 'category-bar-fill';

    const pct = Math.max(8, (count / maxCount) * 100);
    fill.style.width = pct + '%';

    track.appendChild(fill);
    row.appendChild(label);
    row.appendChild(track);

    categoryBarsContainer.appendChild(row);
  });
}

// -------------------------
// FUTURE PROJECTIONS
// -------------------------
function getProjectionNoun(categoryName) {
  const lower = categoryName.toLowerCase();
  if (lower.includes('fit') || lower.includes('gym') || lower.includes('workout') || lower.includes('training')) return 'workouts logged';
  if (lower.includes('finance') || lower.includes('money') || lower.includes('budget') || lower.includes('savings')) return 'money-related logs';
  if (lower.includes('game')) return 'gaming sessions logged';
  if (lower.includes('work')) return 'work logs';
  if (lower === '' || lower === 'all categories') return 'log(s) across all categories';
  return 'log(s)';
}

function renderProjections() {
  if (!proj30El) return;

  const now = new Date();
  const windowDays = 30;
  const cutoff = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

  const categoryFilter = projectionCategorySelect ? projectionCategorySelect.value : '';
  const multiplier = projectionMultiplierInput ? (parseFloat(projectionMultiplierInput.value) || 1) : 1;

  const relevant = state.entries.filter(entry => {
    const entryTime = new Date(entry.timestamp);
    if (entryTime < cutoff) return false;
    if (categoryFilter && entry.category !== categoryFilter) return false;
    return true;
  });

  const count = relevant.length;
  const avgPerDay = count / windowDays;

  const proj30 = avgPerDay * 30 * multiplier;
  const proj180 = avgPerDay * 180 * multiplier;
  const proj365 = avgPerDay * 365 * multiplier;

  const nice = (num) => Math.round(num * 10) / 10;

  proj30El.textContent = nice(proj30);
  proj180El.textContent = nice(proj180);
  proj365El.textContent = nice(proj365);

  const labelBase = categoryFilter || 'all categories';
  const noun = getProjectionNoun(labelBase);

  if (proj30DescEl) proj30DescEl.textContent = `${noun} in the next 30 days`;
  if (proj180DescEl) proj180DescEl.textContent = `${noun} in the next 6 months`;
  if (proj365DescEl) proj365DescEl.textContent = `${noun} in the next year`;

  if (projBaseInfoEl) {
    if (count === 0) {
      projBaseInfoEl.textContent = `No logs in the last ${windowDays} days for ${labelBase}. Start logging to see projections.`;
    } else {
      projBaseInfoEl.textContent = `Based on ${count} log(s) in the last ${windowDays} days for ${labelBase}, scaled by a ${multiplier.toFixed(1)}× consistency slider.`;
    }
  }
}

// -------------------------
// QUICK ADD HUB LOGIC
// -------------------------
const quickAddButtons = document.querySelectorAll('.qa-btn');
const quickAddModal = document.getElementById('quickAddModal');
const quickAddTitle = document.getElementById('quickAddTitle');
const quickAddForm = document.getElementById('quickAddForm');
const quickAddText = document.getElementById('quickAddText');
const quickAddCategorySelect = document.getElementById('quickAddCategory');
const quickAddMediaInput = document.getElementById('quickAddMedia');
const quickAddError = document.getElementById('quickAddError');

const quickAddCloseBtn = quickAddModal ? quickAddModal.querySelector('.modal-close') : null;
const quickAddOverlay = quickAddModal ? quickAddModal.querySelector('.modal-overlay') : null;

let currentQuickType = 'note';

function populateQuickAddCategories() {
  if (!quickAddCategorySelect) return;
  quickAddCategorySelect.innerHTML = '';

  const none = document.createElement('option');
  none.value = '';
  none.textContent = 'No category';
  quickAddCategorySelect.appendChild(none);

  state.categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.name;
    opt.textContent = cat.name;
    quickAddCategorySelect.appendChild(opt);
  });
}

function openQuickAdd(type) {
  currentQuickType = type;

  let label = 'New Quick Note';
  if (type === 'full') label = 'New Full Entry';
  if (type === 'picture') label = 'New Picture Entry';
  if (type === 'video') label = 'New Video Entry';
  if (quickAddTitle) quickAddTitle.textContent = label;

  if (quickAddText) quickAddText.value = '';
  if (quickAddMediaInput) quickAddMediaInput.value = '';
  if (quickAddError) quickAddError.textContent = '';

  populateQuickAddCategories();
  if (quickAddModal) quickAddModal.classList.remove('hidden');
}

function closeQuickAdd() {
  if (quickAddModal) quickAddModal.classList.add('hidden');
}

quickAddButtons.forEach(btn => {
  btn.addEventListener('click', () => openQuickAdd(btn.dataset.type || 'note'));
});

if (quickAddCloseBtn) quickAddCloseBtn.addEventListener('click', closeQuickAdd);
if (quickAddOverlay) quickAddOverlay.addEventListener('click', closeQuickAdd);

if (quickAddForm) {
  quickAddForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const text = quickAddText ? quickAddText.value.trim() : '';
    const category = quickAddCategorySelect ? quickAddCategorySelect.value : '';
    const media = quickAddMediaInput ? quickAddMediaInput.value.trim() : '';

    if (!text) {
      if (quickAddError) quickAddError.textContent = 'Please write something before saving.';
      return;
    }

    let entryTypeLabel = 'Quick Note';
    if (currentQuickType === 'full') entryTypeLabel = 'Quick Full Entry';
    if (currentQuickType === 'picture') entryTypeLabel = 'Quick Picture';
    if (currentQuickType === 'video') entryTypeLabel = 'Quick Video';

    let imagePath = '';
    let videoPath = '';
    if (media) {
      const lower = media.toLowerCase();
      if (lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov')) videoPath = media;
      else imagePath = media;
    }

    addEntry(text, entryTypeLabel, category, '', imagePath, videoPath);
    closeQuickAdd();
  });
}

// =========================
// HORIZONTAL PAGER (Snap style)
// =========================
const pager = document.getElementById("pager");
const screens = Array.from(document.querySelectorAll(".screen"));
const navButtons = Array.from(document.querySelectorAll(".nav-btn"));

function goToPage(index, smooth = true) {
  const target = screens[index];
  if (!target || !pager) return;
  pager.scrollTo({ left: target.offsetLeft, behavior: smooth ? "smooth" : "auto" });
}

function getCurrentPageIndex() {
  if (!pager) return 0;
  const x = pager.scrollLeft;
  let bestIndex = 0;
  let bestDist = Infinity;

  screens.forEach((s, i) => {
    const dist = Math.abs(s.offsetLeft - x);
    if (dist < bestDist) { bestDist = dist; bestIndex = i; }
  });

  return bestIndex;
}

function updateActiveNav() {
  const idx = getCurrentPageIndex();
  navButtons.forEach((b, i) => b.classList.toggle("active", i === idx));
}

navButtons.forEach(btn => {
  btn.addEventListener("click", () => goToPage(Number(btn.dataset.go), true));
});

if (pager) {
  pager.addEventListener("scroll", () => window.requestAnimationFrame(updateActiveNav));
}

window.addEventListener("load", () => {
  goToPage(2, false);   // start on Page 3 (Quick Add)
  updateActiveNav();
  loadState();
});
