/* Personal Productivity Dashboard — application logic */

const App = {};

/* ─── Storage utility ───────────────────────────────────────────────────── */

App.Storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }
};

/* ─── Error boundary helper ──────────────────────────────────────────────── */

function safeInit(module, id) {
  try {
    module.init();
  } catch (e) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<p class="widget-error">Failed to load widget: ' + id + '</p>';
  }
}

/* ─── Challenge 1: Light / Dark Mode ────────────────────────────────────── */

App.ThemeToggle = (() => {
  const KEY = 'dashboard_theme';

  function _apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }

  function init() {
    const saved = App.Storage.get(KEY, 'light');
    _apply(saved);

    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        _apply(next);
        App.Storage.set(KEY, next);
      });
    }
  }

  return { init };
})();

/* ─── Challenge 2: Custom Name in Greeting ──────────────────────────────── */

App.NameSetup = (() => {
  const KEY = 'dashboard_user_name';

  function _close() {
    const modal = document.getElementById('name-modal');
    if (modal) modal.hidden = true;
  }

  function getName() {
    return App.Storage.get(KEY, '');
  }

  function init() {
    const modal   = document.getElementById('name-modal');
    const input   = document.getElementById('name-input');
    const saveBtn = document.getElementById('name-save-btn');
    const skipBtn = document.getElementById('name-skip-btn');
    const errEl   = document.getElementById('name-error');

    if (!modal) return;

    // Only show once — if name already stored, skip modal
    const existing = App.Storage.get(KEY, null);
    if (existing !== null) return;

    // Show modal
    modal.hidden = false;
    if (input) input.focus();

    function _save() {
      const name = input ? input.value.trim() : '';
      if (name.length === 0) {
        if (errEl) errEl.textContent = 'Please enter your name, or click Skip.';
        return;
      }
      if (name.length > 40) {
        if (errEl) errEl.textContent = 'Name must be 40 characters or fewer.';
        return;
      }
      App.Storage.set(KEY, name);
      _close();
      // Refresh greeting to show the name immediately
      if (App.GreetingWidget && typeof App.GreetingWidget.updateName === 'function') {
        App.GreetingWidget.updateName(name);
      }
    }

    if (saveBtn) saveBtn.addEventListener('click', _save);
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        // Store empty string to mark "seen" — won't show again
        App.Storage.set(KEY, '');
        _close();
      });
    }
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') _save();
        if (errEl) errEl.textContent = '';
      });
    }

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        App.Storage.set(KEY, '');
        _close();
      }
    });
  }

  return { init, getName };
})();

/* ─── Greeting Widget ────────────────────────────────────────────────────── */

App.GreetingWidget = (() => {
  const DAY_NAMES   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTH_NAMES = ['January','February','March','April','May','June',
                       'July','August','September','October','November','December'];

  let greetingEl = null;
  let timeEl     = null;
  let dateEl     = null;

  function _formatTime(date) {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return hh + ':' + mm;
  }

  function _formatDate(date) {
    const dayName   = DAY_NAMES[date.getDay()];
    const day       = date.getDate();
    const monthName = MONTH_NAMES[date.getMonth()];
    const year      = date.getFullYear();
    return dayName + ', ' + day + ' ' + monthName + ' ' + year;
  }

  function _getGreeting(hour) {
    if (hour >= 5  && hour <= 11) return 'Good Morning';
    if (hour >= 12 && hour <= 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  function _buildGreetingText(hour) {
    const base = _getGreeting(hour);
    const name = App.NameSetup ? App.NameSetup.getName() : '';
    return name ? base + ', ' + name + '!' : base;
  }

  function update() {
    const now = new Date();
    greetingEl.textContent = _buildGreetingText(now.getHours());
    timeEl.textContent     = _formatTime(now);
    dateEl.textContent     = _formatDate(now);
  }

  function updateName(name) {
    if (!greetingEl) return;
    const now = new Date();
    greetingEl.textContent = _buildGreetingText(now.getHours());
  }

  function init() {
    const root    = document.getElementById('greeting-widget');
    const content = root.querySelector('.widget-content');

    greetingEl = document.createElement('p');
    greetingEl.className = 'greeting-text';

    timeEl = document.createElement('p');
    timeEl.className = 'greeting-time';

    dateEl = document.createElement('p');
    dateEl.className = 'greeting-date';

    content.appendChild(greetingEl);
    content.appendChild(timeEl);
    content.appendChild(dateEl);

    try {
      update();
    } catch (e) {
      content.textContent = 'Time data unavailable.';
      return;
    }

    setInterval(() => {
      try { update(); } catch (e) { content.textContent = 'Time data unavailable.'; }
    }, 60000);
  }

  return { init, update, updateName, _formatTime, _formatDate, _getGreeting };
})();

/* ─── Challenge 3: Focus Timer with Custom Duration ─────────────────────── */

App.Timer = (() => {
  const DURATION_KEY     = 'timer_duration_minutes';
  const DEFAULT_MINUTES  = 25;

  let totalSeconds     = DEFAULT_MINUTES * 60;
  let remainingSeconds = totalSeconds;
  let intervalId       = null;
  let isRunning        = false;

  let displayEl     = null;
  let startBtn      = null;
  let stopBtn       = null;
  let resetBtn      = null;
  let durationInput = null;

  function _formatDisplay(n) {
    const mm = String(Math.floor(n / 60)).padStart(2, '0');
    const ss = String(n % 60).padStart(2, '0');
    return mm + ':' + ss;
  }

  function _updateButtonStates() {
    if (isRunning) {
      startBtn.disabled = true;
      stopBtn.disabled  = false;
      resetBtn.disabled = false;
    } else if (remainingSeconds === 0) {
      startBtn.disabled = true;
      stopBtn.disabled  = true;
      resetBtn.disabled = false;
    } else {
      startBtn.disabled = false;
      stopBtn.disabled  = true;
      resetBtn.disabled = false;
    }
    // Disable duration input while running
    if (durationInput) durationInput.disabled = isRunning;
  }

  function tick() {
    remainingSeconds -= 1;
    displayEl.textContent = _formatDisplay(remainingSeconds);
    if (remainingSeconds === 0) {
      stop();
      alert('Focus session complete!');
    }
  }

  function start() {
    if (isRunning || remainingSeconds === 0) return;
    isRunning  = true;
    intervalId = setInterval(tick, 1000);
    _updateButtonStates();
  }

  function stop() {
    if (!isRunning) return;
    clearInterval(intervalId);
    intervalId = null;
    isRunning  = false;
    _updateButtonStates();
  }

  function reset() {
    stop();
    remainingSeconds      = totalSeconds;
    displayEl.textContent = _formatDisplay(remainingSeconds);
    _updateButtonStates();
  }

  function _applyDuration(minutes) {
    const mins = Math.max(1, Math.min(60, Math.round(minutes)));
    totalSeconds     = mins * 60;
    remainingSeconds = totalSeconds;
    if (displayEl) displayEl.textContent = _formatDisplay(remainingSeconds);
    if (durationInput) durationInput.value = mins;
    App.Storage.set(DURATION_KEY, mins);
    _updateButtonStates();
  }

  function init() {
    const root    = document.getElementById('focus-timer');
    const content = root.querySelector('.widget-content');

    // Load saved duration
    const savedMins = App.Storage.get(DURATION_KEY, DEFAULT_MINUTES);
    totalSeconds     = Math.max(1, Math.min(60, savedMins)) * 60;
    remainingSeconds = totalSeconds;

    // Duration setting row
    const settingsRow = document.createElement('div');
    settingsRow.className = 'timer-settings';

    const durationLabel = document.createElement('label');
    durationLabel.textContent = 'Duration (min):';
    durationLabel.htmlFor = 'timer-duration-input';

    durationInput = document.createElement('input');
    durationInput.type      = 'number';
    durationInput.id        = 'timer-duration-input';
    durationInput.className = 'timer-duration-input';
    durationInput.min       = '1';
    durationInput.max       = '60';
    durationInput.value     = String(Math.round(totalSeconds / 60));

    durationInput.addEventListener('change', () => {
      const val = parseInt(durationInput.value, 10);
      if (!isNaN(val)) {
        stop();
        _applyDuration(val);
      }
    });

    settingsRow.appendChild(durationLabel);
    settingsRow.appendChild(durationInput);

    // Display
    displayEl = document.createElement('div');
    displayEl.className   = 'timer-display';
    displayEl.textContent = _formatDisplay(remainingSeconds);

    // Buttons
    startBtn = document.createElement('button');
    startBtn.textContent = 'Start';
    startBtn.className   = 'btn btn-primary';

    stopBtn = document.createElement('button');
    stopBtn.textContent = 'Stop';
    stopBtn.className   = 'btn btn-secondary';

    resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset';
    resetBtn.className   = 'btn btn-secondary';

    const controls = document.createElement('div');
    controls.className = 'timer-controls';
    controls.appendChild(startBtn);
    controls.appendChild(stopBtn);
    controls.appendChild(resetBtn);

    content.appendChild(settingsRow);
    content.appendChild(displayEl);
    content.appendChild(controls);

    startBtn.addEventListener('click', start);
    stopBtn.addEventListener('click', stop);
    resetBtn.addEventListener('click', reset);

    _updateButtonStates();
  }

  return { init, start, stop, reset, tick, _formatDisplay };
})();

/* ─── Challenge 4: Task Manager ─────────────────────────────────────────── */

App.TaskManager = (() => {
  const STORAGE_KEY = 'dashboard_tasks';
  let tasks = [];           // in-memory task array
  let activeFilter = 'all'; // 'all' | 'active' | 'completed'

  // ── public methods (stubs that will be filled in 6.2–6.9) ──
  function _save() { return App.Storage.set(STORAGE_KEY, tasks); }

  function render() {
    const listEl  = document.getElementById('task-list');
    const errorEl = document.getElementById('task-error');
    if (!listEl) return;

    // Apply active filter without mutating the source array
    const filtered = tasks.filter(t => {
      if (activeFilter === 'active')    return !t.done;
      if (activeFilter === 'completed') return t.done;
      return true; // 'all'
    });

    // Clear existing items
    listEl.innerHTML = '';

    if (filtered.length === 0) {
      const empty = document.createElement('p');
      empty.className   = 'task-empty';
      empty.textContent = activeFilter === 'completed'
        ? 'No completed tasks yet.'
        : activeFilter === 'active'
          ? 'No active tasks — well done!'
          : 'No tasks yet. Add one above!';
      listEl.appendChild(empty);
      // Still update filter counts
    } else {
      filtered.forEach(task => {
        const item = document.createElement('div');
        item.className    = 'task-item' + (task.done ? ' is-done' : '');
        item.dataset.id   = task.id;
        item.setAttribute('role', 'listitem');
        item.draggable    = true;

        // Checkbox
        const cb = document.createElement('input');
        cb.type      = 'checkbox';
        cb.className = 'task-checkbox';
        cb.checked   = task.done;
        cb.setAttribute('aria-label', 'Mark task done: ' + task.text);
        cb.addEventListener('change', () => toggleTask(task.id));

        // Text span
        const span = document.createElement('span');
        span.className   = 'task-text';
        span.textContent = task.text; // never innerHTML

        // Actions
        const actions = document.createElement('div');
        actions.className = 'task-actions';

        const editBtn = document.createElement('button');
        editBtn.className   = 'btn btn-ghost btn-sm';
        editBtn.textContent = 'Edit';
        editBtn.setAttribute('aria-label', 'Edit task: ' + task.text);
        editBtn.addEventListener('click', () => _startEdit(task.id));

        const delBtn = document.createElement('button');
        delBtn.className   = 'btn btn-ghost btn-sm';
        delBtn.style.color = 'var(--color-danger)';
        delBtn.textContent = 'Delete';
        delBtn.setAttribute('aria-label', 'Delete task: ' + task.text);
        delBtn.addEventListener('click', () => deleteTask(task.id));

        actions.appendChild(editBtn);
        actions.appendChild(delBtn);

        item.appendChild(cb);
        item.appendChild(span);
        item.appendChild(actions);
        listEl.appendChild(item);

        // Drag-to-reorder event listeners
        item.addEventListener('dragstart', _onDragStart);
        item.addEventListener('dragover',  _onDragOver);
        item.addEventListener('drop',      _onDrop);
        item.addEventListener('dragend',   _onDragEnd);
      });
    }

    // Update filter button labels with counts
    const all       = tasks.length;
    const active    = tasks.filter(t => !t.done).length;
    const completed = tasks.filter(t =>  t.done).length;
    const filterBar = document.querySelector('#task-manager .filter-bar');
    if (filterBar) {
      filterBar.querySelectorAll('.filter-btn').forEach(btn => {
        const f = btn.dataset.filter;
        const count = f === 'all' ? all : f === 'active' ? active : completed;
        btn.textContent = f.charAt(0).toUpperCase() + f.slice(1) + ' (' + count + ')';
      });
    }
  }

  function addTask(text) {
    const trimmed = (text || '').trim();
    const errorEl = document.getElementById('task-error');
    const inputEl = document.getElementById('task-input');

    if (trimmed.length === 0) {
      if (errorEl) errorEl.textContent = 'Task text cannot be empty.';
      if (inputEl) inputEl.focus();
      return;
    }

    // Clear any previous error
    if (errorEl) errorEl.textContent = '';

    const task = {
      id:        crypto.randomUUID(),
      text:      trimmed,
      done:      false,
      createdAt: Date.now()
    };

    tasks.push(task);

    if (!_save()) {
      // Write failed — revert and show error
      tasks.pop();
      if (errorEl) errorEl.textContent = 'Could not save task. Storage may be full.';
      return;
    }

    if (inputEl) inputEl.value = '';
    render();
  }

  function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    task.done = !task.done;
    if (!_save()) {
      // Revert on failure
      task.done = !task.done;
      const errorEl = document.getElementById('task-error');
      if (errorEl) errorEl.textContent = 'Could not save change. Storage may be full.';
    }
    render();
  }

  function deleteTask(id) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx < 0) return;
    const [removed] = tasks.splice(idx, 1);
    if (!_save()) {
      // Restore on failure
      tasks.splice(idx, 0, removed);
      const errorEl = document.getElementById('task-error');
      if (errorEl) errorEl.textContent = 'Could not delete task. Storage may be full.';
    }
    render();
  }

  function editTask(id, newText) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const trimmed = (newText || '').trim();
    if (trimmed.length === 0) {
      // Discard edit — nothing to do, render() will restore display
      render();
      return;
    }

    const oldText = task.text;
    task.text = trimmed;
    if (!_save()) {
      task.text = oldText; // revert
      const errorEl = document.getElementById('task-error');
      if (errorEl) errorEl.textContent = 'Could not save edit. Storage may be full.';
    }
    render();
  }

  function _startEdit(id) {
    // Cancel any other active edit first (re-render restores all rows)
    render();

    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // Find the rendered item for this task
    const item = document.querySelector('#task-list [data-id="' + id + '"]');
    if (!item) return;

    // Replace the text span + action buttons with edit input + Save/Cancel
    item.innerHTML = ''; // safe — we rebuild entirely with createElement below

    // Checkbox (keep but disable during edit)
    const cb = document.createElement('input');
    cb.type      = 'checkbox';
    cb.className = 'task-checkbox';
    cb.checked   = task.done;
    cb.disabled  = true;

    // Editable input
    const editInput = document.createElement('input');
    editInput.type      = 'text';
    editInput.className = 'input-text task-edit-input';
    editInput.value     = task.text;
    editInput.maxLength = 500;
    editInput.setAttribute('aria-label', 'Edit task text');

    // Save / Cancel buttons
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const saveBtn = document.createElement('button');
    saveBtn.className   = 'btn btn-primary btn-sm';
    saveBtn.textContent = 'Save';

    const cancelBtn = document.createElement('button');
    cancelBtn.className   = 'btn btn-secondary btn-sm';
    cancelBtn.textContent = 'Cancel';

    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);

    item.appendChild(cb);
    item.appendChild(editInput);
    item.appendChild(actions);

    editInput.focus();
    editInput.select();

    function _doSave() {
      editTask(id, editInput.value);
    }
    function _doCancel() {
      render(); // discard — re-render restores original text
    }

    saveBtn.addEventListener('click',  _doSave);
    cancelBtn.addEventListener('click', _doCancel);
    editInput.addEventListener('keydown', e => {
      if (e.key === 'Enter')  { e.preventDefault(); _doSave(); }
      if (e.key === 'Escape') { e.preventDefault(); _doCancel(); }
    });
  }

  // ── Drag-to-reorder helpers ──────────────────────────────────────
  let _dragSrcId = null;

  function _onDragStart(e) {
    _dragSrcId = this.dataset.id;
    this.classList.add('is-dragging');
    e.dataTransfer.effectAllowed = 'move';
  }

  function _onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
  }

  function _onDrop(e) {
    e.preventDefault();
    const targetId = this.dataset.id;
    if (!_dragSrcId || _dragSrcId === targetId) return;

    const srcIdx = tasks.findIndex(t => t.id === _dragSrcId);
    const tgtIdx = tasks.findIndex(t => t.id === targetId);
    if (srcIdx < 0 || tgtIdx < 0) return;

    // Reorder in-memory array
    const [removed] = tasks.splice(srcIdx, 1);
    tasks.splice(tgtIdx, 0, removed);
    _save();
    render();
  }

  function _onDragEnd() {
    _dragSrcId = null;
    document.querySelectorAll('.task-item').forEach(el => {
      el.classList.remove('is-dragging', 'drag-over');
    });
  }

  function init() {
    const root    = document.getElementById('task-manager');
    const content = root.querySelector('.widget-content');

    // ── Load from localStorage ──
    const stored = App.Storage.get(STORAGE_KEY, []);
    tasks = Array.isArray(stored) ? stored : [];

    // ── Build static DOM skeleton ──
    // 1. Add-task input row
    const addRow = document.createElement('div');
    addRow.className = 'input-row';

    const addInput = document.createElement('input');
    addInput.type        = 'text';
    addInput.id          = 'task-input';
    addInput.className   = 'input-text';
    addInput.placeholder = 'Add a task…';
    addInput.maxLength   = 500;
    addInput.setAttribute('aria-label', 'New task text');

    const addBtn = document.createElement('button');
    addBtn.id        = 'task-add-btn';
    addBtn.className = 'btn btn-primary';
    addBtn.textContent = 'Add';

    addRow.appendChild(addInput);
    addRow.appendChild(addBtn);

    // 2. Inline error message
    const errorEl = document.createElement('p');
    errorEl.id        = 'task-error';
    errorEl.className = 'error-message';
    errorEl.setAttribute('aria-live', 'polite');

    // 3. Filter bar (All / Active / Completed)
    const filterBar = document.createElement('div');
    filterBar.className = 'filter-bar';
    filterBar.setAttribute('role', 'tablist');
    filterBar.setAttribute('aria-label', 'Filter tasks');

    ['all', 'active', 'completed'].forEach(f => {
      const btn = document.createElement('button');
      btn.className    = 'filter-btn' + (f === 'all' ? ' is-active' : '');
      btn.dataset.filter = f;
      btn.textContent  = f.charAt(0).toUpperCase() + f.slice(1);
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', f === 'all' ? 'true' : 'false');
      filterBar.appendChild(btn);
    });

    // 4. Task list container (scrollable)
    const listEl = document.createElement('div');
    listEl.id        = 'task-list';
    listEl.className = 'task-list';
    listEl.setAttribute('role', 'list');
    listEl.setAttribute('aria-label', 'Task list');

    content.appendChild(addRow);
    content.appendChild(errorEl);
    content.appendChild(filterBar);
    content.appendChild(listEl);

    // ── Event listeners ──
    addBtn.addEventListener('click', () => addTask(addInput.value));
    addInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(addInput.value); });

    filterBar.addEventListener('click', e => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      activeFilter = btn.dataset.filter;
      filterBar.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.toggle('is-active', b.dataset.filter === activeFilter);
        b.setAttribute('aria-selected', b.dataset.filter === activeFilter ? 'true' : 'false');
      });
      render();
    });

    render();
  }

  return { init, addTask, editTask, deleteTask, toggleTask, render, _save };
})();

/* ─── Quick Links Panel ──────────────────────────────────────────────────── */

App.QuickLinks = (() => {
  const STORAGE_KEY = 'dashboard_links';
  const MAX_LINKS   = 20;
  let links = [];

  // ── 8.5 _save() ────────────────────────────────────────────────
  function _save() {
    return App.Storage.set(STORAGE_KEY, links.slice(0, MAX_LINKS));
  }

  // ── 8.4 render() ───────────────────────────────────────────────
  function render() {
    const gridEl  = document.getElementById('links-grid');
    const errorEl = document.getElementById('links-error');
    if (!gridEl) return;

    gridEl.innerHTML = '';

    const visible = links.slice(0, MAX_LINKS);

    if (visible.length === 0) {
      const empty = document.createElement('p');
      empty.className   = 'task-empty';
      empty.textContent = 'No links yet. Add one below!';
      gridEl.appendChild(empty);
      return;
    }

    visible.forEach(link => {
      const wrapper = document.createElement('div');
      wrapper.className = 'link-item';

      const btn = document.createElement('button');
      btn.className   = 'btn btn-secondary link-btn';
      btn.textContent = link.label; // never innerHTML — label is user content
      btn.setAttribute('aria-label', 'Open ' + link.label + ' in new tab');
      btn.addEventListener('click', () => {
        window.open(link.url, '_blank', 'noopener,noreferrer');
      });

      const delBtn = document.createElement('button');
      delBtn.className   = 'btn btn-ghost btn-sm link-del-btn';
      delBtn.textContent = '×';
      delBtn.setAttribute('aria-label', 'Delete link: ' + link.label);
      delBtn.style.color = 'var(--color-danger)';
      delBtn.addEventListener('click', () => deleteLink(link.id));

      wrapper.appendChild(btn);
      wrapper.appendChild(delBtn);
      gridEl.appendChild(wrapper);
    });
  }

  // ── 8.2 addLink(label, url) ─────────────────────────────────────
  function addLink(label, url) {
    const trimLabel = (label || '').trim();
    const trimUrl   = (url   || '').trim();
    const errorEl   = document.getElementById('links-error');

    // Clear previous error
    if (errorEl) errorEl.textContent = '';

    // Validation
    let err = '';
    if (trimLabel.length === 0 && (trimUrl.length === 0 || (!trimUrl.startsWith('http://') && !trimUrl.startsWith('https://')))) {
      err = 'Please enter a label and a valid URL (must start with http:// or https://).';
    } else if (trimLabel.length === 0) {
      err = 'Label cannot be empty.';
    } else if (!trimUrl.startsWith('http://') && !trimUrl.startsWith('https://')) {
      err = 'URL must start with http:// or https://.';
    } else if (links.length >= MAX_LINKS) {
      err = 'Maximum of ' + MAX_LINKS + ' links reached. Delete one first.';
    }

    if (err) {
      if (errorEl) errorEl.textContent = err;
      return;
    }

    const link = {
      id:        crypto.randomUUID(),
      label:     trimLabel.slice(0, 50),
      url:       trimUrl.slice(0, 2048),
      createdAt: Date.now()
    };

    links.push(link);

    if (!_save()) {
      links.pop();
      if (errorEl) errorEl.textContent = 'Could not save link. Storage may be full.';
      return;
    }

    // Clear inputs
    const labelInput = document.getElementById('link-label-input');
    const urlInput   = document.getElementById('link-url-input');
    if (labelInput) labelInput.value = '';
    if (urlInput)   urlInput.value   = '';

    render();
  }

  // ── 8.3 deleteLink(id) ──────────────────────────────────────────
  function deleteLink(id) {
    const idx = links.findIndex(l => l.id === id);
    if (idx < 0) return;
    const [removed] = links.splice(idx, 1);
    if (!_save()) {
      links.splice(idx, 0, removed);
      const errorEl = document.getElementById('links-error');
      if (errorEl) errorEl.textContent = 'Could not delete link. Storage may be full.';
    }
    render();
  }

  // ── 8.1 init() ─────────────────────────────────────────────────
  function init() {
    const root    = document.getElementById('quick-links');
    const content = root.querySelector('.widget-content');

    // Load from localStorage
    const stored = App.Storage.get(STORAGE_KEY, []);
    if (!Array.isArray(stored)) {
      links = [];
      const errP = document.createElement('p');
      errP.className   = 'error-message';
      errP.textContent = 'Links could not be loaded. Data may be corrupted.';
      content.appendChild(errP);
    } else {
      links = stored;
    }

    // ── Error display area ──
    const errorEl = document.createElement('p');
    errorEl.id        = 'links-error';
    errorEl.className = 'error-message';
    errorEl.setAttribute('aria-live', 'polite');

    // ── Links grid ──
    const gridEl = document.createElement('div');
    gridEl.id        = 'links-grid';
    gridEl.className = 'links-grid';
    gridEl.setAttribute('aria-label', 'Quick links');

    // ── Add-link form ──
    const formEl = document.createElement('div');
    formEl.className = 'input-row-multi';

    const labelRow = document.createElement('div');
    labelRow.className = 'input-row';

    const labelInput = document.createElement('input');
    labelInput.type        = 'text';
    labelInput.id          = 'link-label-input';
    labelInput.className   = 'input-text';
    labelInput.placeholder = 'Label (e.g. GitHub)';
    labelInput.maxLength   = 50;
    labelInput.setAttribute('aria-label', 'Link label');

    const urlRow = document.createElement('div');
    urlRow.className = 'input-row';

    const urlInput = document.createElement('input');
    urlInput.type        = 'url';
    urlInput.id          = 'link-url-input';
    urlInput.className   = 'input-text';
    urlInput.placeholder = 'URL (https://…)';
    urlInput.maxLength   = 2048;
    urlInput.setAttribute('aria-label', 'Link URL');

    const addBtn = document.createElement('button');
    addBtn.id          = 'link-add-btn';
    addBtn.className   = 'btn btn-primary';
    addBtn.textContent = 'Add Link';

    labelRow.appendChild(labelInput);
    urlRow.appendChild(urlInput);
    urlRow.appendChild(addBtn);
    formEl.appendChild(labelRow);
    formEl.appendChild(urlRow);

    content.appendChild(errorEl);
    content.appendChild(gridEl);
    content.appendChild(formEl);

    // ── Event listeners ──
    addBtn.addEventListener('click', () => addLink(labelInput.value, urlInput.value));
    urlInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') addLink(labelInput.value, urlInput.value);
    });

    // ── 8.6 Ctrl/Cmd + K global shortcut ──
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        root.scrollIntoView({ behavior: 'smooth', block: 'center' });
        urlInput.focus();
      }
    });

    render();
  }

  return { init, addLink, deleteLink, render, _save };
})();

/* ─── Entry point ────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  // Challenge features first
  App.ThemeToggle.init();
  App.NameSetup.init();

  // Widgets
  safeInit(App.GreetingWidget, 'greeting-widget');
  safeInit(App.Timer,          'focus-timer');
  safeInit(App.TaskManager,    'task-manager');
  safeInit(App.QuickLinks,     'quick-links');
});
