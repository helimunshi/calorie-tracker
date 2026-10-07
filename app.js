const STORAGE_KEY = "calorie-ledger-v1";
const DEFAULT_STATE = { goal: 2000, entries: {} };

const els = {
  previousDay: document.querySelector("#previous-day"),
  nextDay: document.querySelector("#next-day"),
  dateButton: document.querySelector("#date-button"),
  datePicker: document.querySelector("#date-picker"),
  dateLabel: document.querySelector("#date-label"),
  dailyTotal: document.querySelector("#daily-total"),
  goalStatus: document.querySelector("#goal-status"),
  dailyGoal: document.querySelector("#daily-goal"),
  editGoal: document.querySelector("#edit-goal"),
  goalSheet: document.querySelector("#goal-sheet"),
  goalForm: document.querySelector("#goal-form"),
  goalInput: document.querySelector("#goal-input"),
  entrySheet: document.querySelector("#entry-sheet"),
  entryForm: document.querySelector("#entry-form"),
  entrySheetTitle: document.querySelector("#entry-sheet-title"),
  entrySubmit: document.querySelector("#entry-submit"),
  entryId: document.querySelector("#entry-id"),
  itemName: document.querySelector("#item-name"),
  calories: document.querySelector("#calories"),
  positiveSign: document.querySelector("#positive-sign"),
  negativeSign: document.querySelector("#negative-sign"),
  addEntry: document.querySelector("#add-entry"),
  emptyState: document.querySelector("#empty-state"),
  entryList: document.querySelector("#entry-list")
};

let state = loadState();
let selectedDate = todayKey();
let lastFocusedElement = null;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== "object") return structuredClone(DEFAULT_STATE);
    return {
      goal: Number.isFinite(Number(saved.goal)) && Number(saved.goal) > 0 ? Math.round(Number(saved.goal)) : DEFAULT_STATE.goal,
      entries: saved.entries && typeof saved.entries === "object" ? saved.entries : {}
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayKey() {
  return toDateKey(new Date());
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function shiftDate(days) {
  const date = fromDateKey(selectedDate);
  date.setDate(date.getDate() + days);
  selectedDate = toDateKey(date);
  render();
}

function formatDateLabel(key) {
  if (key === todayKey()) return "Today";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (key === toDateKey(yesterday)) return "Yesterday";
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (key === toDateKey(tomorrow)) return "Tomorrow";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: fromDateKey(key).getFullYear() === new Date().getFullYear() ? undefined : "numeric" }).format(fromDateKey(key));
}

function formatNumber(number) {
  return new Intl.NumberFormat().format(number);
}

function selectedEntries() {
  const entries = state.entries[selectedDate];
  return Array.isArray(entries) ? entries : [];
}

function render() {
  const entries = selectedEntries();
  const total = entries.reduce((sum, entry) => sum + Number(entry.calories || 0), 0);
  const difference = state.goal - total;

  els.dateLabel.textContent = formatDateLabel(selectedDate);
  els.datePicker.value = selectedDate;
  els.dailyTotal.textContent = formatNumber(total);
  els.dailyGoal.textContent = `${formatNumber(state.goal)} cal`;

  if (difference > 0) {
    els.goalStatus.textContent = `${formatNumber(difference)} calories under goal`;
    els.goalStatus.classList.remove("over");
  } else if (difference < 0) {
    els.goalStatus.textContent = `${formatNumber(Math.abs(difference))} calories over goal`;
    els.goalStatus.classList.add("over");
  } else {
    els.goalStatus.textContent = "Goal reached exactly";
    els.goalStatus.classList.remove("over");
  }

  els.emptyState.hidden = entries.length > 0;
  els.entryList.replaceChildren(...entries.map(createEntryRow));
}

function createEntryRow(entry) {
  const row = document.createElement("li");
  row.className = "entry-item";
  row.dataset.id = entry.id;

  const name = document.createElement("span");
  name.className = "entry-name";
  name.textContent = entry.name;

  const calories = document.createElement("span");
  calories.className = `entry-calories${entry.calories < 0 ? " negative" : ""}`;
  calories.textContent = `${entry.calories > 0 ? "+" : ""}${formatNumber(entry.calories)} cal`;

  const actions = document.createElement("div");
  actions.className = "entry-menu";
  actions.innerHTML = `
    <button class="entry-action edit" type="button" aria-label="Edit ${escapeAttribute(entry.name)}">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>
    </button>
    <button class="entry-action delete" type="button" aria-label="Delete ${escapeAttribute(entry.name)}">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6"/></svg>
    </button>`;

  row.append(name, calories, actions);
  return row;
}

function escapeAttribute(value) {
  return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function openSheet(sheet, focusTarget) {
  lastFocusedElement = document.activeElement;
  sheet.hidden = false;
  document.body.classList.add("sheet-open");
  requestAnimationFrame(() => focusTarget?.focus());
}

function closeSheet(sheet) {
  sheet.hidden = true;
  if (!document.querySelector(".sheet-layer:not([hidden])")) document.body.classList.remove("sheet-open");
  lastFocusedElement?.focus();
}

function openNewEntry() {
  els.entryForm.reset();
  els.entryId.value = "";
  setCalorieSign(1);
  els.entrySheetTitle.textContent = "Add Entry";
  els.entrySubmit.textContent = "Add entry";
  openSheet(els.entrySheet, els.itemName);
}

function openEditEntry(id) {
  const entry = selectedEntries().find(item => item.id === id);
  if (!entry) return;
  els.entryId.value = entry.id;
  els.itemName.value = entry.name;
  els.calories.value = Math.abs(entry.calories);
  setCalorieSign(entry.calories < 0 ? -1 : 1);
  els.entrySheetTitle.textContent = "Edit Entry";
  els.entrySubmit.textContent = "Save changes";
  openSheet(els.entrySheet, els.itemName);
}

function setCalorieSign(sign) {
  const isNegative = sign < 0;
  els.entryForm.dataset.calorieSign = isNegative ? "-1" : "1";
  els.positiveSign.classList.toggle("selected", !isNegative);
  els.negativeSign.classList.toggle("selected", isNegative);
  els.positiveSign.setAttribute("aria-pressed", String(!isNegative));
  els.negativeSign.setAttribute("aria-pressed", String(isNegative));
}

els.previousDay.addEventListener("click", () => shiftDate(-1));
els.nextDay.addEventListener("click", () => shiftDate(1));
els.dateButton.addEventListener("click", () => {
  if (typeof els.datePicker.showPicker === "function") els.datePicker.showPicker();
  else els.datePicker.click();
});
els.datePicker.addEventListener("change", event => {
  if (event.target.value) {
    selectedDate = event.target.value;
    render();
  }
});

els.editGoal.addEventListener("click", () => {
  els.goalInput.value = state.goal;
  openSheet(els.goalSheet, els.goalInput);
});
els.addEntry.addEventListener("click", openNewEntry);
els.positiveSign.addEventListener("click", () => setCalorieSign(1));
els.negativeSign.addEventListener("click", () => setCalorieSign(-1));

document.querySelectorAll("[data-close-sheet]").forEach(button => {
  button.addEventListener("click", () => closeSheet(button.closest(".sheet-layer")));
});

els.goalForm.addEventListener("submit", event => {
  event.preventDefault();
  const goal = Math.round(Number(els.goalInput.value));
  if (!Number.isFinite(goal) || goal <= 0) return;
  state.goal = goal;
  saveState();
  render();
  closeSheet(els.goalSheet);
});

els.entryForm.addEventListener("submit", event => {
  event.preventDefault();
  const name = els.itemName.value.trim();
  const calorieText = els.calories.value.trim();
  const isAbsoluteNumber = /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(calorieText);

  if (!isAbsoluteNumber) {
    els.calories.setCustomValidity("Enter a positive number such as 100 or 250.5, then choose + or −.");
    els.calories.reportValidity();
    return;
  }

  const calorieValue = Number(calorieText) * Number(els.entryForm.dataset.calorieSign || 1);
  if (!name || !Number.isFinite(calorieValue)) return;

  const entries = [...selectedEntries()];
  const existingIndex = entries.findIndex(item => item.id === els.entryId.value);
  const entry = { id: els.entryId.value || crypto.randomUUID(), name, calories: calorieValue };
  if (existingIndex >= 0) entries[existingIndex] = entry;
  else entries.push(entry);

  state.entries[selectedDate] = entries;
  saveState();
  render();
  closeSheet(els.entrySheet);
});

els.calories.addEventListener("input", () => els.calories.setCustomValidity(""));

els.entryList.addEventListener("click", event => {
  const row = event.target.closest(".entry-item");
  if (!row) return;
  if (event.target.closest(".edit")) openEditEntry(row.dataset.id);
  if (event.target.closest(".delete")) {
    const entry = selectedEntries().find(item => item.id === row.dataset.id);
    if (!entry || !window.confirm(`Delete “${entry.name}”?`)) return;
    state.entries[selectedDate] = selectedEntries().filter(item => item.id !== row.dataset.id);
    if (!state.entries[selectedDate].length) delete state.entries[selectedDate];
    saveState();
    render();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    const openSheetElement = document.querySelector(".sheet-layer:not([hidden])");
    if (openSheetElement) closeSheet(openSheetElement);
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js"));
}

render();
