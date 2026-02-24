
function forceDetailsButtonsType() {
  const ebtn = document.getElementById('editDetails');
  const cbtn = document.getElementById('closeDetails');
  if (ebtn) ebtn.type = 'button';
  if (cbtn) cbtn.type = 'button';
}
document.addEventListener('DOMContentLoaded', forceDetailsButtonsType);

const elements = {
    calendar: document.getElementById('calendar'),
    monthYear: document.getElementById('monthYear'),
    modal: document.getElementById('taskModal'),
    cancelBtn: document.getElementById('cancelModal'),
    taskForm: document.getElementById('taskForm'),
    selectedDateInput: document.getElementById('selectedDate'),
    datePickerSection: document.getElementById('datePickerSection'),
    editIndexInput: document.getElementById('editIndex'),
    modalDateDisplay: document.getElementById('modalDateDisplay'),
    taskList: document.getElementById('taskList'),
    detailsModal: document.getElementById('detailsModal'),
    detailsContent: document.getElementById('detailsContent'),
    closeDetailsBtn: document.getElementById('closeDetails'),
    editDetailsBtn: document.getElementById('editDetails'),
    popisSelect: document.getElementById('popis'),
    customPopisInput: document.getElementById('customPopis'),
    customPopisLabel: document.getElementById('customPopisLabel'),
    vacationModal: document.getElementById('vacationModal'),
    vacationForm: document.getElementById('vacationForm'),
    cancelVacationBtn: document.getElementById('cancelVacationModal'),
    addVacationBtn: document.getElementById('addVacation'),
    exportModal: document.getElementById('exportModal'),
    exportForm: document.getElementById('exportForm'),
    cancelExportBtn: document.getElementById('cancelExportModal'),
    exportToPDFBtn: document.getElementById('exportToPDF'),
    saveChecklistBtn: document.getElementById('saveChecklist'),
    vacationIndexInput: document.getElementById('vacationIndex'),
    prevMonth: document.getElementById('prevMonth'),
    nextMonth: document.getElementById('nextMonth'),
    deleteVacationBtn: document.getElementById('deleteVacationBtn'),
    znackaInput: document.getElementById('znacka'),
    noteModal: document.getElementById('noteModal'),
    noteForm: document.getElementById('noteForm'),
    cancelNoteBtn: document.getElementById('cancelNoteModal'),
    addNoteBtn: document.getElementById('addNote'),
    noteIndexInput: document.getElementById('noteIndex'),
    deleteNoteBtn: document.getElementById('deleteNoteBtn'),
    noteDate: document.getElementById('noteDate'),
    noteText: document.getElementById('noteText'),
    createdBy: document.getElementById('createdBy'),
    deleteTaskBtn: document.getElementById('deleteTaskBtn'),
    searchModal: document.getElementById('searchModal'),
    openPozicovnaBtn: document.getElementById('openPozicovna'),
openStatistikyBtn: document.getElementById('openStatistiky'),
searchInput: document.getElementById('searchInput'),
searchBtn: document.getElementById('searchBtn'),
searchResults: document.getElementById('searchResults'),
closeSearchModal: document.getElementById('closeSearchModal'),
};
// ================== HELPER FUNKCIE ==================
function checklistArr(task){
  if (Array.isArray(task?.checklist)) return task.checklist;

  if (typeof task?.checklist === "string") {
    try { return JSON.parse(task.checklist) || []; }
    catch { return []; }
  }
  return [];
}
// Nastaviť dnešný dátum ako predvolený pri vytváraní zákazky
if (elements.selectedDateInput) {
    const today = new Date().toISOString().split("T")[0];
    elements.selectedDateInput.value = today;
}

// DEBUG: Overenie, či sa kliknutie na tlačidlo vôbec zaregistruje
if (elements.searchBtn) {
    elements.searchBtn.addEventListener('click', () => {
        const query = elements.searchInput.value.trim();

        if (!query) {
            alert('Zadaj hľadaný výraz do vyhľadávania.');
            return;
        }

        // Potvrdzovacia otázka pred spustením vyhľadávania
        if (confirm(`Naozaj chceš vyhľadať "${query}"?\n\nNačítanie môže trvať 5–15 sekúnd.`)) {
            performSearch(query);
        }
    });
}
const PRINT_FLAG = 'Vytlaceny stitok';

// Podpora pre Enter v inpute
if (elements.searchInput) {
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            elements.searchBtn.click(); // spustí rovnakú logiku ako klik na tlačidlo
        }
    });
}
// === ZAVRETIE SEARCH MODALU ===
if (elements.closeSearchModal) {
    elements.closeSearchModal.addEventListener('click', () => {
        elements.searchModal.classList.add('hidden'); 
        elements.searchResults.innerHTML = '';
        elements.searchInput.value = '';
    });
}

if (elements.searchInput) {
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            console.log('DEBUG: Enter stlačený v inpute');
            elements.searchBtn.click();
        }
    });
}
let currentTaskForPrint = null;
// === po tlaci: pridaj do checklistu "Vytlaceny stitok" (cez API) ===
async function markLabelPrinted(dateStr, taskId) {
  console.log('[PRINT] start', dateStr, taskId);

  const res = await fetch(`api/tasks.php?date=${dateStr}`);
  const tasks = await res.json();

  const found = Array.isArray(tasks) ? tasks.find(t => String(t.id) === String(taskId)) : null;
  if (!found) {
    console.log('[PRINT] task not found');
    return { ok: false, reason: 'not_found' };
  }

  const cl = Array.isArray(found.checklist) ? found.checklist.slice() : [];
  if (!cl.includes(PRINT_FLAG)) cl.push(PRINT_FLAG);

  const put = await fetch(`api/tasks.php`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      ...found,
      id: found.id,
      date: dateStr,
      checklist: cl
    })
  });

  const out = await put.json().catch(() => ({}));
  console.log('[PRINT] PUT result', out);

  return { ok: !!out?.success, out };
}




function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
function ensureIOSPrintHint() {
  let el = document.getElementById('iosPrintHint');
  if (el) return el;

  el = document.createElement('div');
  el.id = 'iosPrintHint';
  el.className = 'ios-print-hint';
  el.innerHTML = `
    <div class="box">
      <div class="title">iOS tlac stitku</div>
      <div class="steps">
        1) Po otvoreni stitku klikni <b>Share</b> (stvorec so sipkou).<br>
        2) Zvol <b>Print</b>.<br>
        3) Nastav <b>Scale 100%</b>, <b>Margins None</b>.
      </div>
      <div class="btns">
        <button type="button" class="close">Zavriet</button>
        <button type="button" class="ok">OK, rozumiem</button>
      </div>
    </div>
  `;
  document.body.appendChild(el);

  const close = () => { el.style.display = 'none'; };
  el.addEventListener('click', (e) => {
    if (e.target === el) close();
  });
  el.querySelector('.close').addEventListener('click', close);
  el.querySelector('.ok').addEventListener('click', close);

  return el;
}

function showIOSPrintHint() {
  const el = ensureIOSPrintHint();
  el.style.display = 'flex';
}


if (elements.selectedDateInput && elements.modalDateDisplay) {
    function formatModalDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('sk-SK', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    // When the date input changes in the form
    elements.selectedDateInput.addEventListener('change', () => {
        elements.modalDateDisplay.textContent = formatModalDate(elements.selectedDateInput.value);
    });
}


let currentView = 'day';
if (elements.calendar) {
    elements.calendar.classList.remove('month-view', 'week-view');
    elements.calendar.classList.add('day-view');
}

const viewButtons = document.querySelectorAll('#viewControls button');

viewButtons.forEach(button => {
    if (button) {
        button.addEventListener('click', () => {
            const newView = button.dataset.view;
            if (elements.calendar) {
                elements.calendar.classList.remove(`${currentView}-view`);
                elements.calendar.classList.add(`${newView}-view`);
            }
            viewButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentView = newView;
            renderCalendar(currentDate);
        });
    }
});

const todayBtn = document.getElementById('todayBtn');
if (todayBtn) {
    todayBtn.addEventListener('click', () => {
        isRendering = false;
        
        // Set to today's date
        const today = new Date();
        currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        console.log('TodayBtn: currentDate nastavený na', currentDate.toLocaleString('sk-SK', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' }));
        
        // Reset view to day
        currentView = 'day';
        
        if (elements.calendar) {
            elements.calendar.classList.remove('month-view', 'week-view', 'day-view');
            elements.calendar.classList.add('day-view');
        }
        
        viewButtons.forEach(btn => btn.classList.remove('active'));
        const dayBtn = document.querySelector('#viewControls button[data-view="day"]');
        if (dayBtn) dayBtn.classList.add('active');
        
        // Volaj render synchroónne bez setTimeout
        renderCalendar(currentDate);
    });
}

if (elements.popisSelect) {
  elements.popisSelect.addEventListener('change', function () {
    const prenocovanieLabel = document.getElementById('prenocovanieCheckboxLabel');
    if (prenocovanieLabel) {
      if (elements.popisSelect.value === 'Výmena skla' || elements.popisSelect.value === 'Oprava skla') {
        prenocovanieLabel.style.display = 'flex';
      } else {
        prenocovanieLabel.style.display = 'none';
        const prenocovanieCheckbox = document.querySelector('input[name="checklist"][value="Prenocovanie"]');
        if (prenocovanieCheckbox) prenocovanieCheckbox.checked = false;
      }
    }

    if (elements.popisSelect.value === 'Ostatné') {
      if (elements.customPopisInput && elements.customPopisLabel) {
        elements.customPopisInput.style.display = 'block';
        elements.customPopisLabel.style.display = 'block';
        elements.customPopisInput.required = true;
      }
    } else {
      if (elements.customPopisInput && elements.customPopisLabel) {
        elements.customPopisInput.style.display = 'none';
        elements.customPopisLabel.style.display = 'none';
        elements.customPopisInput.required = false;
        elements.customPopisInput.value = '';
      }
    }

// ===== Pocet poskodeni (iba Oprava skla) =====
const poskLabel = document.getElementById('poskodeniaLabel');
const poskSelect = document.getElementById('poskodenia');

if (poskLabel && poskSelect) {

  // odstránime starú hviezdičku (aby sa neduplikovala)
  const oldStar = poskLabel.querySelector('.required-star');
  if (oldStar) oldStar.remove();

  if (elements.popisSelect.value === 'Oprava skla') {
    poskLabel.style.display = 'block';
    poskSelect.style.display = 'block';
    poskSelect.required = true;

    // ⭐ pridáme červenú hviezdičku
    const star = document.createElement('span');
    star.textContent = ' *';
    star.className = 'required-star';
    poskLabel.appendChild(star);

  } else {
    poskLabel.style.display = 'none';
    poskSelect.style.display = 'none';
    poskSelect.required = false;
    poskSelect.value = '';
  }
}
  });
}


if (elements.addVacationBtn) {
    elements.addVacationBtn.addEventListener('click', () => {

        const password = prompt('Zadaj heslo pre pridanie neprítomnosti:');

        if (password !== '36248703') {
            alert('Nesprávne heslo.');
            return;
        }

        // správne heslo → otvor modal
        if (elements.vacationModal && elements.vacationForm) {
            elements.vacationModal.classList.remove('hidden');
            elements.vacationForm.reset();
            elements.vacationIndexInput.value = -1;

            if (elements.deleteVacationBtn) {
                elements.deleteVacationBtn.style.display = 'none';
            }
        }
    });
}


if (elements.cancelVacationBtn) {
    elements.cancelVacationBtn.addEventListener('click', () => {
        if (elements.vacationModal && elements.vacationForm) {
            elements.vacationModal.classList.add('hidden');
            elements.vacationForm.reset();
            elements.vacationIndexInput.value = -1;
            if (elements.deleteVacationBtn) {
                elements.deleteVacationBtn.style.display = 'none';
            }
        }
    });
}

if (elements.deleteVacationBtn) {
  elements.deleteVacationBtn.addEventListener('click', () => {
    const password = prompt('Zadaj heslo pre zmazanie neprítomnosti:');
    if (password !== '36248703') {
        alert('Nesprávne heslo.');
        return;
    }

    const index = parseInt(elements.vacationIndexInput?.value);
    if (index >= 0) {
      if (confirm('Naozaj chcete vymazať túto dovolenku?')) {
        deleteVacation(index);
        elements.vacationModal.classList.add('hidden');
        elements.vacationForm.reset();
        elements.vacationIndexInput.value = -1;
        elements.deleteVacationBtn.style.display = 'none';
      }
    }
  });
}


if (elements.exportToPDFBtn) {
    elements.exportToPDFBtn.addEventListener('click', () => {
        if (elements.exportModal && elements.exportForm) {
            elements.exportModal.classList.remove('hidden');
            elements.exportForm.reset();
        }
    });
}

if (elements.cancelExportBtn) {
    elements.cancelExportBtn.addEventListener('click', () => {
        if (elements.exportModal && elements.exportForm) {
            elements.exportModal.classList.add('hidden');
            elements.exportForm.reset();
        }
    });
}

if (elements.addNoteBtn) {
    elements.addNoteBtn.addEventListener('click', () => {
        if (elements.noteModal && elements.noteForm) {
            elements.noteModal.classList.remove('hidden');
            elements.noteForm.reset();
            elements.noteIndexInput.value = -1;
            if (elements.deleteNoteBtn) {
                elements.deleteNoteBtn.style.display = 'none';
            }
            elements.noteDate.value = currentDate.toISOString().split('T')[0];
        }
    });
}

if (elements.cancelNoteBtn) {
    elements.cancelNoteBtn.addEventListener('click', () => {
        if (elements.noteModal && elements.noteForm) {
            elements.noteModal.classList.add('hidden');
            elements.noteForm.reset();
            elements.noteIndexInput.value = -1;
            if (elements.deleteNoteBtn) {
                elements.deleteNoteBtn.style.display = 'none';
            }
        }
    });
}

if (elements.deleteNoteBtn) {
    elements.deleteNoteBtn.addEventListener('click', () => {
        const index = parseInt(elements.noteIndexInput?.value);
        if (index >= 0) {
            if (confirm('Naozaj chcete vymazať túto poznámku?')) {
                deleteNote(index);
                elements.noteModal.classList.add('hidden');
                elements.noteForm.reset();
                elements.noteIndexInput.value = -1;
                elements.deleteNoteBtn.style.display = 'none';
                //renderCalendar(currentDate);
            }
        }
    });
}

// Character counter for extraInfo field
const extraInfoInput = document.getElementById('extraInfo');
if (extraInfoInput) {
    const counterDiv = document.createElement('div');
    counterDiv.id = 'extraInfoCounter';
    counterDiv.style.cssText = 'font-size: 0.85em; margin-top: 5px; color: #666;';
    extraInfoInput.parentNode.insertBefore(counterDiv, extraInfoInput.nextSibling);
    
    extraInfoInput.addEventListener('input', function() {
        const length = this.value.length;
        const remaining = Math.max(0, 30 - length);
        counterDiv.textContent = `Tlačiteľných znakov: ${Math.min(length, 30)}/30${length > 30 ? ` (${length - 30} znakov sa nevytlačí)` : ''}`;
        counterDiv.style.color = length > 30 ? '#d32f2f' : '#666';
    });
    
    extraInfoInput.dispatchEvent(new Event('input'));
}

function getNotesForDate(dateStr) {
    return fetch(`http://192.168.1.10/Kalendár/api/notes.php?date=${dateStr}`)
        .then(response => response.json())
        .then(notes => notes || [])
        .catch(error => {
            console.error('Error fetching notes:', error);
            return [];
        });
}

function saveNote(note, id = -1) {
    const method = id >= 0 ? 'PUT' : 'POST';
    return fetch(`http://192.168.1.10/Kalendár/api/notes.php`, {
        method: method,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(note)
    })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (!data.success) throw new Error('Failed to save note');
            return data;
        })
        .catch(error => {
            console.error('Error saving note:', error);
            alert('Chyba pri ukladaní poznámky.');
        });
}

function deleteNote(id) {
    return fetch(`http://192.168.1.10/Kalendár/api/notes.php?id=${id}`, {
        method: 'DELETE'
    })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (!data.success) throw new Error('Failed to delete note');
            // Add delay before rendering to allow database to stabilize
            return new Promise(resolve => setTimeout(resolve, 300));
        })
        .then(() => {
            renderCalendar(currentDate);
        })
        .catch(error => {
            console.error('Error deleting note:', error);
            alert('Chyba pri mazaní poznámky.');
            throw error;
        });
}

function editNote(id) {
    if (!elements.noteForm || !elements.noteModal || !elements.noteIndexInput) return;
    fetch(`http://192.168.1.10/Kalendár/api/notes.php`)
        .then(response => response.json())
        .then(notes => {
            const note = notes.find(n => n.id === id);
            if (!note) {
                alert('Poznámka nebola nájdená.');
                console.error(`Poznámka s ID ${id} nebola nájdená`);
                return;
            }
            elements.noteForm.reset();
            elements.noteIndexInput.value = id;
            elements.noteDate.value = note.date || '';
            elements.noteText.value = note.note || '';
            elements.noteModal.classList.remove('hidden');
            if (elements.deleteNoteBtn) {
                elements.deleteNoteBtn.style.display = 'inline-block';
            }
        })
        .catch(error => {
            console.error('Error fetching note:', error);
            alert('Chyba pri načítaní poznámky.');
        });
}

let currentDate = new Date();
let weekOffset = 0;
let monthOffset = 0;

(() => {
  const monthYearDiv = document.getElementById('monthYear');
  const jumpToDateInput = document.getElementById('jumpToDate');
  if (!monthYearDiv || !jumpToDateInput) return;

  const openPicker = () => {
    if (currentView !== 'day') return;

    // set current day in picker
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
    const d = String(currentDate.getDate()).padStart(2, '0');
    jumpToDateInput.value = `${y}-${m}-${d}`;

    jumpToDateInput.classList.add('is-open');
    jumpToDateInput.style.display = 'block';

    const anchor = document.getElementById('viewControls') || monthYearDiv; // place BELOW the buttons row
    const r = anchor.getBoundingClientRect();

    jumpToDateInput.style.position = 'fixed';
    jumpToDateInput.style.left = '50%';
    jumpToDateInput.style.transform = 'translateX(-50%)';
    jumpToDateInput.style.top = `${Math.round(r.bottom + 12)}px`; // pushes it down so it's not behind the buttons

    requestAnimationFrame(() => {
      if (typeof jumpToDateInput.showPicker === 'function') {
        jumpToDateInput.showPicker();
      } else {
        jumpToDateInput.focus({ preventScroll: true });
        jumpToDateInput.click();
      }
    });
  };

  const closePicker = () => {
    jumpToDateInput.classList.remove('is-open');
    jumpToDateInput.style.display = 'none';
  };

  monthYearDiv.addEventListener('click', (e) => {
    if (currentView !== 'day') return;
    e.preventDefault();
    e.stopPropagation();

    if (jumpToDateInput.classList.contains('is-open')) closePicker();
    else openPicker();
  });

  jumpToDateInput.addEventListener('change', () => {
    if (!jumpToDateInput.value) return;

    const [yy, mm, dd] = jumpToDateInput.value.split('-').map(Number);
    currentDate = new Date(yy, mm - 1, dd);
    currentView = 'day';
    renderCalendar(currentDate);

    closePicker();
  });

  // close when clicking outside / ESC
  document.addEventListener('click', (e) => {
    if (!jumpToDateInput.classList.contains('is-open')) return;
    if (e.target === monthYearDiv || e.target === jumpToDateInput) return;
    closePicker();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePicker();
  });
})();


function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function getChecklistIcons(checklist) {
    const allItems = ['Dodaný materiál', 'Zákazka dokončená', 'Kontaktovaný', 'Prenocovanie', 'Zakazka zrusena'];
    let icons = '';
    allItems.forEach(item => {
        const isChecked = Array.isArray(checklist) && checklist.includes(item);
        const color = isChecked ? '#0d820dc4' : '#ff0000';
        if (item === 'Kontaktovaný') {
            icons += `<span class="checklist-icon kontaktovany"><svg width="16" height="16" viewBox="0 0 24 24" fill="${color}" stroke="none"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.24 1.02l-2.2 2.2z"/></svg></span>`;
        } else if (item === 'Dodaný materiál') {
            icons += `<span class="checklist-icon dodany-material"><svg width="16" height="16" viewBox="0 0 24 24" fill="${color}" stroke="none"><path d="M2 18V6h20v12H2zm2-10l8 4 8-4"/></svg></span>`;
        } else if (item === 'Zákazka dokončená') {
            icons += `<span class="checklist-icon zakazka-dokoncena"><svg width="16" height="16" viewBox="0 0 24 24" fill="${color}" stroke="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></span>`;
        }else if (item === 'Zakazka zrusena') {
  icons += `<span class="checklist-icon zrusena" title="Zakazka zrusena">✖</span>`;
}
    });
    return icons;
}

function getVacationsForDate(dateStr) {
    return fetch(`http://192.168.1.10/Kalendár/api/vacations.php?date=${dateStr}`)
        .then(response => response.json())
        .then(vacations => vacations || [])
        .catch(error => {
            console.error('Error fetching vacations:', error);
            return [];
        });
}

function saveVacation(vacation, id = -1) {
    const method = id >= 0 ? 'PUT' : 'POST';
    return fetch(`http://192.168.1.10/Kalendár/api/vacations.php`, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vacation)
    })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (!data.success && !data.id) throw new Error('Failed to save vacation');
            return data;
        })
        .catch(error => {
            console.error('Error saving vacation:', error);
            alert('Chyba pri ukladaní dovolenky.');
        });
}

function deleteVacation(id) {
    return fetch(`http://192.168.1.10/Kalendár/api/vacations.php?id=${id}`, {
        method: 'DELETE'
    })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (!data.success) throw new Error('Failed to delete vacation');
            // Add delay before rendering to allow database to stabilize
            return new Promise(resolve => setTimeout(resolve, 300));
        })
        .then(() => {
            renderCalendar(currentDate);
        })
        .catch(error => {
            console.error('Error deleting vacation:', error);
            alert('Chyba pri mazaní dovolenky.');
            throw error;
        });
}

let isRendering = false;

function renderCalendar(date) {
    if (isRendering) {
        console.log('Render already in progress, skipping...');
        return;
    }
    isRendering = true;

    if (!elements.calendar || !elements.monthYear) {
  isRendering = false;
  return;
}
    elements.calendar.innerHTML = '';
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    const daysSk = ['Nedeľa', 'Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota'];

    if (currentView === 'month') {
        elements.monthYear.textContent = date.toLocaleString('sk-SK', { month: 'long', year: 'numeric' });
        const firstDayOfMonth = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayIndex = firstDayOfMonth.getDay();
        const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

        // Array to collect day cells
        const dayCells = [];

        // Add blank days for offset
        for (let i = 0; i < startOffset; i++) {
            const blank = document.createElement('div');
            blank.className = 'day-container';
            dayCells.push(blank);
        }

        // Create day cells sequentially
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
            const dayCell = renderDayCell(dateStr, false); // Pass false to skip async content
            dayCells.push(dayCell);
        }

        // Append all day cells in order
        dayCells.forEach(cell => elements.calendar.appendChild(cell));

        // Now fetch and populate async content (tasks and vacations)
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
            populateDayCell(dateStr, dayCells[startOffset + d - 1]);
            if (CLOSED_DATES.includes(dateStr)) {
    // NEZOBRAZUJ žiadne úlohy ani čas
    return;
}
        }
    } else if (currentView === 'week') {
        const currentDay = date.getDay();
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
        const monday = new Date(date);
        monday.setDate(date.getDate() + mondayOffset);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        elements.monthYear.textContent = `${monday.getDate()}.${monday.getMonth() + 1}. – ${sunday.getDate()}.${sunday.getMonth() + 1}. ${year}`;

        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(monday);
            currentDay.setDate(monday.getDate() + i);
            const dateStr = `${currentDay.getFullYear()}-${(currentDay.getMonth() + 1).toString().padStart(2, '0')}-${currentDay.getDate().toString().padStart(2, '0')}`;
            const dayCell = renderDayCell(dateStr);
            elements.calendar.appendChild(dayCell);
        }
    } else if (currentView === 'day') {
        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const dayName = daysSk[date.getDay()];
        elements.monthYear.textContent = `${dayName}, ${date.getDate()}. ${date.toLocaleString('sk-SK', { month: 'long', year: 'numeric' })}`;
        const dayCell = renderDayCell(dateStr);
        elements.calendar.appendChild(dayCell);
    }

    const dayPicker = document.getElementById('dayPicker');
    if (!dayPicker) return;
    dayPicker.innerHTML = '';
    if (currentView === 'day') {
        dayPicker.classList.remove('hidden');
        const selectedDate = new Date(date);
        const currentDay = selectedDate.getDay();
        const offset = currentDay === 0 ? -6 : 1 - currentDay;
        const monday = new Date(selectedDate);
        monday.setDate(selectedDate.getDate() + offset);
        const daysSk = ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'];

        for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    const isoDate = `${dayDate.getFullYear()}-${(dayDate.getMonth() + 1).toString().padStart(2, '0')}-${dayDate.getDate().toString().padStart(2, '0')}`;
    const btn = document.createElement('button');
    btn.textContent = daysSk[i];

    const selectedDateLocal = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    if (isoDate === selectedDateLocal) {
        btn.classList.add('active');
    }

    btn.addEventListener('click', () => {
        currentDate = new Date(isoDate);
        renderCalendar(currentDate);
    });
    dayPicker.appendChild(btn);
}
    } else if (currentView === 'week') {
        dayPicker.classList.remove('hidden');
        const currentWeek = getWeekNumber(date);
        const startWeek = Math.max(1, currentWeek + weekOffset - 2);
        const endWeek = Math.min(52, startWeek + 4);
        const weeks = Array.from({ length: endWeek - startWeek + 1 }, (_, i) => startWeek + i);

        if (startWeek > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.textContent = '<';
            prevBtn.classList.add('nav-btn');
            prevBtn.addEventListener('click', () => {
                weekOffset -= 5;
                renderCalendar(date);
            });
            dayPicker.appendChild(prevBtn);
        }

        weeks.forEach(week => {
            const btn = document.createElement('button');
            btn.textContent = `Týždeň ${week}`;
            if (week === currentWeek) {
                btn.classList.add('active');
            }
            btn.addEventListener('click', () => {
                const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
                const firstMonday = new Date(firstDayOfYear);
                const firstDay = firstDayOfYear.getDay();
                const offset = firstDay === 0 ? -6 : 1 - firstDay;
                firstMonday.setDate(firstDayOfYear.getDate() + offset);
                currentDate = new Date(firstMonday);
                currentDate.setDate(firstMonday.getDate() + (week - 1) * 7);
                weekOffset = 0;
                renderCalendar(currentDate);
            });
            dayPicker.appendChild(btn);
        });

        if (endWeek < 52) {
            const nextBtn = document.createElement('button');
            nextBtn.textContent = '>';
            nextBtn.classList.add('nav-btn');
            nextBtn.addEventListener('click', () => {
                weekOffset += 5;
                renderCalendar(date);
            });
            dayPicker.appendChild(nextBtn);
        }
    } else if (currentView === 'month') {
        dayPicker.classList.remove('hidden');
        const monthsSk = [
            'Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún',
            'Júl', 'August', 'September', 'Október', 'November', 'December'
        ];
        const currentMonth = date.getMonth();
        const startMonth = Math.max(0, currentMonth + monthOffset - 2);
        const endMonth = Math.min(11, startMonth + 4);
        const months = Array.from({ length: endMonth - startMonth + 1 }, (_, i) => startMonth + i);

        if (startMonth > 0) {
            const prevBtn = document.createElement('button');
            prevBtn.textContent = '<';
            prevBtn.classList.add('nav-btn');
            prevBtn.addEventListener('click', () => {
                monthOffset -= 5;
                renderCalendar(date);
            });
            dayPicker.appendChild(prevBtn);
        }

        months.forEach(month => {
            const btn = document.createElement('button');
            btn.textContent = monthsSk[month];
            if (month === currentMonth) {
                btn.classList.add('active');
            }
            btn.addEventListener('click', () => {
                currentDate = new Date(date.getFullYear(), month, 1);
                monthOffset = 0;
                renderCalendar(currentDate);
            });
            dayPicker.appendChild(btn);
        });

        if (endMonth < 11) {
            const nextBtn = document.createElement('button');
            nextBtn.textContent = '>';
            nextBtn.classList.add('nav-btn');
            nextBtn.addEventListener('click', () => {
                monthOffset += 5;
                renderCalendar(date);
            });
            dayPicker.appendChild(nextBtn);
        }
    }
    setTimeout(() => {
        isRendering = false;
    }, 500);
}
function isCanceledTask(task) {
  const cl = checklistArr(task) || [];
  return cl.some(v => {
    const s = String(v || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().trim();
    return s.includes('zrus');
  });
}



function renderDayCell(dateStr, includeAsyncContent = true) {
    const dayContainer = document.createElement('div');
    dayContainer.className = 'day-container';

    const dayDiv = document.createElement('div');
    dayDiv.className = 'day';

    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday (0) or Saturday (6)

    const publicHolidays = [
        `${date.getFullYear()}-01-01`, // New Year's Day
        `${date.getFullYear()}-01-06`, // Epiphany
        `${date.getFullYear()}-05-01`, // Labour Day
        `${date.getFullYear()}-05-08`, // Victory Day
        `${date.getFullYear()}-07-05`, // St. Cyril and Methodius Day
        `${date.getFullYear()}-08-29`, // Slovak National Uprising Anniversary
        `${date.getFullYear()}-09-15`, // Our Lady of Sorrows
        `${date.getFullYear()}-11-01`, // All Saints' Day
        `${date.getFullYear()}-12-24`, // Christmas Eve
        `${date.getFullYear()}-12-25`, // Christmas Day
        `${date.getFullYear()}-12-26`  // St. Stephen's Day
    ];
    const isHoliday = publicHolidays.includes(dateStr);

    if (isHoliday) {
        dayDiv.classList.add('public-holiday');
    } else if (isWeekend) {
        dayDiv.classList.add('weekend');
    }

    dayDiv.dataset.date = dateStr;

    const dateObj = new Date(dateStr);
    const daysSk = ['Nedeľa', 'Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota'];
    let formatted;
    if (currentView === 'week') {
        const dayName = daysSk[dateObj.getDay()];
        formatted = `${dayName} ${dateObj.getDate()}.${dateObj.getMonth() + 1}.`;
    } else if (currentView === 'month') {
        formatted = `${dateObj.getDate()}.${dateObj.getMonth() + 1}. (${dateObj.toLocaleDateString('sk-SK', { weekday: 'short' })})`;
    } else {
        formatted = `${dateObj.getDate()}.${dateObj.getMonth() + 1}.`;
    }

    // Wrap date in a header div for flex layout
    dayDiv.innerHTML = `<div class="header"><div class="date">${formatted}</div></div>`;

    if (currentView === 'day') {
        const title = document.createElement('div');
        title.className = 'date-title';
        const dayName = daysSk[dateObj.getDay()];
        title.textContent = `${dayName}, ${dateObj.getDate()}. ${dateObj.toLocaleString('sk-SK', { month: 'long', year: 'numeric' })}`;
        dayDiv.insertBefore(title, dayDiv.firstChild);
    }

    // Add task counters for week view, append to header
if (currentView === 'week') {
  getTasksForDate(dateStr).then(tasks => {

    // ✅ NEPOCITAT ZRUSENE DO KRUHOV
    const activeTasks = (tasks || []).filter(t => !isCanceledTask(t));

    const taskCounts = {};
    const standardPopis = ['Oprava skla', 'Výmena skla', 'Prelepenie skla', 'Ťažné zariadenie', 'Žiarovky', 'Klimatizácia'];

    let prenocovanieCount = 0;

    // ✅ pocitame len aktivne tasky
 activeTasks.forEach(task => {
  const cl = checklistArr(task);                 // ✅
  const hasPrenocovanie = cl.includes('Prenocovanie');  // ✅

  if (hasPrenocovanie && task.popis === 'Výmena skla') {
    prenocovanieCount++;
  }

  const category = standardPopis.includes(task.popis) ? task.popis : 'Ostatné';
  taskCounts[category] = (taskCounts[category] || 0) + 1;
});

    const checkDate = new Date(dateStr);
    if (checkDate.getDay() === 5) { // Friday
      checkDate.setDate(checkDate.getDate() + 3);
    } else {
      checkDate.setDate(checkDate.getDate() + 1);
    }
    const checkDateStr = `${checkDate.getFullYear()}-${(checkDate.getMonth() + 1).toString().padStart(2, '0')}-${checkDate.getDate().toString().padStart(2, '0')}`;

    getTasksForDate(checkDateStr).then(nextDayTasks => {
      const currentDayOfWeek = new Date(dateStr).getDay();

      // For Friday, also check Saturday and Sunday
      if (currentDayOfWeek === 5) {
        const satDate = new Date(dateStr);
        satDate.setDate(satDate.getDate() + 1);
        const satDateStr = `${satDate.getFullYear()}-${(satDate.getMonth() + 1).toString().padStart(2, '0')}-${satDate.getDate().toString().padStart(2, '0')}`;

        const sunDate = new Date(dateStr);
        sunDate.setDate(sunDate.getDate() + 2);
        const sunDateStr = `${sunDate.getFullYear()}-${(sunDate.getMonth() + 1).toString().padStart(2, '0')}-${sunDate.getDate().toString().padStart(2, '0')}`;

        Promise.all([
          Promise.resolve(nextDayTasks),
          getTasksForDate(satDateStr),
          getTasksForDate(sunDateStr)
        ]).then(([monTasks, satTasks, sunTasks]) => {

          // ✅ filtruj aj tu, nech sa zrusene nepripocitaju do prenocovania
          [...monTasks, ...satTasks, ...sunTasks]
            .filter(t => !isCanceledTask(t))
.forEach(task => {
  const cl = checklistArr(task); // ✅
  if (task.popis === 'Oprava skla' && cl.includes('Prenocovanie')) {
    prenocovanieCount++;
  }
});


          const counterContainer = document.createElement('div');
          counterContainer.className = 'task-counter';

          for (const [category, count] of Object.entries(taskCounts)) {
            const circle = document.createElement('div');
            circle.className = `counter-circle ${sanitizeClassName(category)}`;
            circle.textContent = count;
            counterContainer.appendChild(circle);
          }

          if (prenocovanieCount > 0) {
            const circle = document.createElement('div');
            circle.className = 'counter-circle Prenocovanie';
            circle.textContent = prenocovanieCount;
            counterContainer.appendChild(circle);
          }

          const headerDiv = dayDiv.querySelector('.header');

// ✅ odstran stary counter (ak uz existuje), aby si neappendoval duplicitne / stare cisla
const old = headerDiv.querySelector('.task-counter');
if (old) old.remove();

headerDiv.appendChild(counterContainer);
        });

      } else {

        // ✅ filtruj aj tu (bez Friday)
        (nextDayTasks || [])
          .filter(t => !isCanceledTask(t))
          .forEach(task => {
            if (currentDayOfWeek === 0 && task.popis === 'Oprava skla' && Array.isArray(task.checklist) && task.checklist.includes('Prenocovanie')) {
              return;
            }
            if (task.popis === 'Oprava skla' && Array.isArray(task.checklist) && task.checklist.includes('Prenocovanie')) {
              prenocovanieCount++;
            }
          });

        const counterContainer = document.createElement('div');
        counterContainer.className = 'task-counter';

        for (const [category, count] of Object.entries(taskCounts)) {
          const circle = document.createElement('div');
          circle.className = `counter-circle ${sanitizeClassName(category)}`;
          circle.textContent = count;
          counterContainer.appendChild(circle);
        }

        if (prenocovanieCount > 0) {
          const circle = document.createElement('div');
          circle.className = 'counter-circle Prenocovanie';
          circle.textContent = prenocovanieCount;
          counterContainer.appendChild(circle);
        }

        const headerDiv = dayDiv.querySelector('.header');

// ✅ odstran stary counter (ak uz existuje), aby si neappendoval duplicitne / stare cisla
const old = headerDiv.querySelector('.task-counter');
if (old) old.remove();

headerDiv.appendChild(counterContainer);
      }
    });
  });
}

    dayDiv.addEventListener('click', () => {
        if (currentView === 'day') {
            openModal(dateStr);
        } else {
            currentDate = new Date(dateStr);
            viewButtons.forEach(btn => btn.classList.remove('active'));
            const dayBtn = document.querySelector('#viewControls button[data-view="day"]');
            if (dayBtn) dayBtn.classList.add('active');
            currentView = 'day';
            if (elements.calendar) {
                elements.calendar.classList.remove('month-view', 'week-view');
                elements.calendar.classList.add('day-view');
            }
            renderCalendar(currentDate);
        }
    });

    dayContainer.appendChild(dayDiv);

    if (includeAsyncContent) {
        populateDayCell(dateStr, dayContainer);
    }

    return dayContainer;
}

function populateDayCell(dateStr, dayContainer) {
    getVacationsForDate(dateStr).then(vacations => {
        if (vacations.length > 0) {
            const vacationContainer = document.createElement('div');
            vacationContainer.className = 'vacation-container';

            vacations.forEach(vacation => {
                const vacationBadge = document.createElement('div');
                vacationBadge.className = 'vacation-badge';

                const vacationSpan = document.createElement('span');
                vacationSpan.innerHTML = `${vacation.employee} | ${vacation.absenceType}${vacation.note ? ' | ' + vacation.note : ''}`;

                const editBtn = document.createElement('button');
                editBtn.type = 'button';
                editBtn.className = 'edit-vacation-btn';
                editBtn.setAttribute('aria-label', 'Upraviť neprítomnosť');
                editBtn.innerHTML = '✏️';
                editBtn.dataset.vacationId = vacation.id;

                // ✅ KLIK NA CELU NEPRITOMNOST (badge) -> edit (s heslom)
                vacationBadge.style.cursor = 'pointer';
                vacationBadge.addEventListener('click', (e) => {
                    e.stopPropagation();

                    const password = prompt('Zadaj heslo pre úpravu neprítomnosti:');
                    if (password !== '36248703') {
                        alert('Nesprávne heslo.');
                        return;
                    }

                    editVacation(vacation.id);
                });

                // ✅ KLIK NA CERUZKU (tiez edit) -> stopPropagation aby sa nespustil badge klik 2x
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();

                    const password = prompt('Zadaj heslo pre úpravu neprítomnosti:');
                    if (password !== '36248703') {
                        alert('Nesprávne heslo.');
                        return;
                    }

                    editVacation(vacation.id);
                });

                vacationBadge.appendChild(vacationSpan);
                vacationBadge.appendChild(editBtn);
                vacationContainer.appendChild(vacationBadge);
            });

            dayContainer.insertBefore(vacationContainer, dayContainer.querySelector('.day'));
        }

        // ===== POZNAMKY =====
        getNotesForDate(dateStr).then(notes => {

            // ✅ vyberieme poznamky, ktore maju ist do "Noc"
            const thuleNotes = (notes || []).filter(n =>
                ((n.note || '').toUpperCase().includes('THULE'))
            );

            if (notes.length > 0) {
                const noteContainer = document.createElement('div');
                noteContainer.className = 'note-container';

                notes.forEach(note => {
                    const noteBadge = document.createElement('div');
                    noteBadge.className = 'note-badge';

                    const noteSpan = document.createElement('span');
                    noteSpan.innerHTML = `${note.note}`;

                    const editBtn = document.createElement('button');
                    editBtn.className = 'edit-note-btn';
                    editBtn.setAttribute('aria-label', 'Upraviť poznámku');
                    editBtn.innerHTML = '✏️';
                    editBtn.dataset.noteId = note.id;
                    editBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        editNote(note.id);
                    });

                    noteBadge.appendChild(noteSpan);
                    noteBadge.appendChild(editBtn);
                    noteContainer.appendChild(noteBadge);
                });

                dayContainer.insertBefore(noteContainer, dayContainer.querySelector('.day'));
            }

            const dayDiv = dayContainer.querySelector('.day');

            // ===== TASKY =====
            getTasksForDate(dateStr)
                .then(tasks => {

                    // ✅ TU bolo u teba rozbite: mal si dalsi ".then(tasks => {..." mimo retazenia
                    //    Toto je ta cast, ktoru len presuvame SEM (do jedneho then).

                    const order = {
                        "Výmena skla": 1,
                        "Oprava skla": 2,
                        "Prelepenie skla": 3,
                        "Ťažné zariadenie": 4,
                        "Žiarovky": 5,
                        "Klimatizácia": 6,
                        "Ostatné": 7,
                        "Prenocovanie": 99
                    };

                    const sortedTasks = tasks.sort((a, b) => {
                        // ak sú v rovnakom čase, porovnáme typ práce
                        if (a.start === b.start) {
                            return (order[a.popis] || 50) - (order[b.popis] || 50);
                        }

                        // inak triedime podľa času ako doteraz
                        if (a.start === 'Prenocovanie') return 1;
                        if (b.start === 'Prenocovanie') return -1;
                        return a.start.localeCompare(b.start);
                    });

                    const standardPopis = ['Oprava skla', 'Výmena skla', 'Prelepenie skla', 'Ťažné zariadenie', 'Žiarovky', 'Klimatizácia'];

                    if (currentView === 'month') {
                        sortedTasks.forEach(task => {
                            const badge = document.createElement('div');
                            const styleClass = standardPopis.includes(task.popis) ? sanitizeClassName(task.popis) : 'Ostatne';
                            badge.className = `task-badge ${sanitizeClassName(task.mechanik || 'Bez_mechanika')} ${styleClass}`;
                            if (isCancelledTask(task)) badge.classList.add('cancelled');
                            const cl = checklistArr(task);

                            const clNorm = Array.isArray(task.checklist) ? task.checklist.map(normalizeChecklistValue) : [];
if (clNorm.includes(normalizeChecklistValue('Vytlaceny stitok')) && !badge.classList.contains('is-cancelled')) {
  badge.classList.add('printed-label');
}


                            if (cl.includes('Zákazka odovzdaná')) {
                                badge.classList.add('is-delivered');
                            }

                            badge.innerHTML = `${task.popis} | ${task.znacka}`;
                            badge.style.cursor = 'pointer';
                            badge.dataset.taskId = task.id;
                            badge.dataset.date = dateStr;
                            badge.addEventListener('click', (e) => {
                                e.stopPropagation();
                                showTaskDetails(task, dateStr, task.id);
                            });
                            dayDiv.appendChild(badge);
                        });
                    } else if (currentView === 'week') {
                        sortedTasks.forEach(task => {
                            const badge = document.createElement('div');
                            const styleClass = standardPopis.includes(task.popis) ? sanitizeClassName(task.popis) : 'Ostatne';
                            badge.className = `task-badge ${sanitizeClassName(task.mechanik || 'Bez_mechanika')} ${styleClass}`;
                            if (isCancelledTask(task)) badge.classList.add('cancelled')
                            const cl = checklistArr(task);

                            if (cl.includes('Zrušené')) {
                                badge.classList.add('is-cancelled');
                            }
// vytlaceny stitok (iba ak nie je zrusene)
if (cl.includes('Vytlaceny stitok') && !badge.classList.contains('is-cancelled')) {
  badge.classList.add('printed-label');
}
                            if (cl.includes('Zákazka odovzdaná')) {
                                badge.classList.add('is-delivered');
                            }
                            badge.innerHTML = `<span class="task-time">${task.start}</span>| ${task.popis} | ${task.znacka} | ${task.poistovna || '—'} | ${task.meno} ${getChecklistIcons(task.checklist || [])}`;
                            badge.style.cursor = 'pointer';
                            badge.dataset.taskId = task.id;
                            badge.dataset.date = dateStr;
                            badge.addEventListener('click', (e) => {
                                e.stopPropagation();
                                showTaskDetails(task, dateStr, task.id);
                            });
                            dayDiv.appendChild(badge);
                        });
                    }

                   if (currentView === 'day') {
    const taskTypes = ['Oprava skla', 'Výmena skla', 'Prelepenie skla', 'Ťažné zariadenie', 'Žiarovky', 'Klimatizácia', 'Ostatné', 'Prenocovanie'];
    const taskCounts = {};
    taskTypes.forEach(type => {
        taskCounts[type] = 0;
    });

    // ✅ SEM PRESNE (pred forEach)
    const activeTasks = (tasks || []).filter(t => !isCanceledTask(t));

    // ✅ a teraz pocitame len activeTasks
    activeTasks.forEach(task => {
        const cl = checklistArr(task);
        const hasPrenocovanie = cl.includes('Prenocovanie');

        if (hasPrenocovanie && task.popis === 'Výmena skla') {
            taskCounts['Prenocovanie'] = (taskCounts['Prenocovanie'] || 0) + 1;
        }

        const category = standardPopis.includes(task.popis) ? task.popis : 'Ostatné';
        taskCounts[category] = (taskCounts[category] || 0) + 1;
    });

                        /// Check next day for Oprava skla tasks with  - DECLARE ONCE
                        const currentDayOfWeek = new Date(dateStr).getDay();
                        const nextDate = new Date(dateStr);
                        if (nextDate.getDay() === 5) { // Friday
                            nextDate.setDate(nextDate.getDate() + 3);
                        } else {
                            nextDate.setDate(nextDate.getDate() + 1);
                        }
                        const nextDateStr = `${nextDate.getFullYear()}-${(nextDate.getMonth() + 1).toString().padStart(2, '0')}-${nextDate.getDate().toString().padStart(2, '0')}`;

                        if (currentDayOfWeek === 5) {
  // ✅ PIATOK: kontroluj iba SOBOTU + NEDELU (nie pondelok)
  const satDate = new Date(dateStr);
  satDate.setDate(satDate.getDate() + 1);
  const satDateStr = `${satDate.getFullYear()}-${String(satDate.getMonth() + 1).padStart(2, '0')}-${String(satDate.getDate()).padStart(2, '0')}`;

  const sunDate = new Date(dateStr);
  sunDate.setDate(sunDate.getDate() + 2);
  const sunDateStr = `${sunDate.getFullYear()}-${String(sunDate.getMonth() + 1).padStart(2, '0')}-${String(sunDate.getDate()).padStart(2, '0')}`;

  Promise.all([
    getTasksForDate(satDateStr),
    getTasksForDate(sunDateStr)
  ]).then(([satTasks, sunTasks]) => {
    [...satTasks, ...sunTasks].forEach(task => {
      if (task.popis === 'Oprava skla' && Array.isArray(task.checklist) && task.checklist.includes('Prenocovanie')) {
        taskCounts['Prenocovanie'] = (taskCounts['Prenocovanie'] || 0) + 1;
      }
    });

    const counterDiv = document.createElement('div');
    counterDiv.className = 'task-counter';
    taskTypes.forEach(type => {
      if (taskCounts[type] > 0) {
        const circle = document.createElement('div');
        circle.className = `counter-circle ${sanitizeClassName(type)}`;
        circle.textContent = taskCounts[type];
        counterDiv.appendChild(circle);
      }
    });
    dayDiv.appendChild(counterDiv);
  });

} else if (currentDayOfWeek === 6) {
  // ✅ SOBOTA: kontroluj PONDELOK (pondelkove prenocovanie ma ist na sobotu noc)
  const monDate = new Date(dateStr);
  monDate.setDate(monDate.getDate() + 2);
  const monDateStr = `${monDate.getFullYear()}-${String(monDate.getMonth() + 1).padStart(2, '0')}-${String(monDate.getDate()).padStart(2, '0')}`;

  getTasksForDate(monDateStr).then(monTasks => {
    monTasks.forEach(task => {
      if (task.popis === 'Oprava skla' && Array.isArray(task.checklist) && task.checklist.includes('Prenocovanie')) {
        taskCounts['Prenocovanie'] = (taskCounts['Prenocovanie'] || 0) + 1;
      }
    });

    const counterDiv = document.createElement('div');
    counterDiv.className = 'task-counter';
    taskTypes.forEach(type => {
      if (taskCounts[type] > 0) {
        const circle = document.createElement('div');
        circle.className = `counter-circle ${sanitizeClassName(type)}`;
        circle.textContent = taskCounts[type];
        counterDiv.appendChild(circle);
      }
    });
    dayDiv.appendChild(counterDiv);
  });

} else {
  // ✅ ostatne dni: povodne spravanie (kontrola nasledujuceho dna)
  getTasksForDate(nextDateStr).then(nextDayTasks => {
    nextDayTasks.forEach(task => {
      if (currentDayOfWeek === 0 && task.popis === 'Oprava skla' &&
          Array.isArray(task.checklist) && task.checklist.includes('Prenocovanie')) {
        return;
      }
      if (task.popis === 'Oprava skla' && Array.isArray(task.checklist) &&
          task.checklist.includes('Prenocovanie')) {
        taskCounts['Prenocovanie'] = (taskCounts['Prenocovanie'] || 0) + 1;
      }
    });

    const counterDiv = document.createElement('div');
    counterDiv.className = 'task-counter';
    taskTypes.forEach(type => {
      if (taskCounts[type] > 0) {
        const circle = document.createElement('div');
        circle.className = `counter-circle ${sanitizeClassName(type)}`;
        circle.textContent = taskCounts[type];
        counterDiv.appendChild(circle);
      }
    });
    dayDiv.appendChild(counterDiv);
  });
}


                        const hourBlocks = {};
                        for (let hour = 8; hour <= 16; hour++) {
                            hourBlocks[`${hour.toString().padStart(2, '0')}:00`] = [];
                            if (hour === 16) {
                                hourBlocks['16:30'] = [];
                            }
                        }
                        hourBlocks['Prenocovanie'] = [];

tasks.forEach(task => {
  const cl = checklistArr(task);
  const hasPrenocovanie = cl.includes('Prenocovanie');

  // ✅ 1) Prenocovanie checkbox (Výmena skla) -> do Noci len ak NIE je zrusena
  //    a NEVRACAME return, aby zostala aj v normalnom case
  if (hasPrenocovanie && task.popis === 'Výmena skla') {
    if (!isCanceledTask(task)) {
      hourBlocks['Prenocovanie'].push(task);
    }
  }

  // ✅ 2) start = Prenocovanie -> do Noci len ak NIE je zrusena
  //    a NEVRACAME return, aby zostala aj v normalnom case
  if (String(task.start || '').trim() === 'Prenocovanie') {
    if (!isCanceledTask(task)) {
      hourBlocks['Prenocovanie'].push(task);
    }
  }
  // ✅ 3) Normalne sloty: musi byt HH:MM
  const startStr = String(task.start || '').trim();
  const m = startStr.match(/^(\d{1,2}):(\d{2})$/);

  if (!m) {
    console.warn('Task nema platny cas HH:MM, preskakujem (neposielam do Noci):', task);
    return;
  }

  const taskHour = Number(m[1]);
  const taskMinute = Number(m[2]);
  const taskTime = taskHour * 60 + taskMinute;

  const slots = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00'];

  let closestSlot = slots[0];
  let minDiff = Infinity;

  slots.forEach(slot => {
    const [sh, sm] = slot.split(':').map(Number);
    const slotMin = sh * 60 + sm;
    const diff = Math.abs(taskTime - slotMin);
    if (diff < minDiff) {
      minDiff = diff;
      closestSlot = slot;
    }
  });

  if (!hourBlocks[closestSlot]) hourBlocks[closestSlot] = [];
  hourBlocks[closestSlot].push(task);
});


                        if (currentDayOfWeek === 5) {
  // ✅ PIATOK: SOBOTA + NEDELA (bez pondelka)
  const satDate = new Date(dateStr);
  satDate.setDate(satDate.getDate() + 1);
  const satDateStr = `${satDate.getFullYear()}-${String(satDate.getMonth() + 1).padStart(2,'0')}-${String(satDate.getDate()).padStart(2,'0')}`;

  const sunDate = new Date(dateStr);
  sunDate.setDate(sunDate.getDate() + 2);
  const sunDateStr = `${sunDate.getFullYear()}-${String(sunDate.getMonth() + 1).padStart(2,'0')}-${String(sunDate.getDate()).padStart(2,'0')}`;

  Promise.all([
    getTasksForDate(satDateStr),
    getTasksForDate(sunDateStr)
  ]).then(([satTasks, sunTasks]) => {
    [...satTasks, ...sunTasks].forEach(task => {
      if (task.popis === 'Oprava skla' && Array.isArray(task.checklist) && task.checklist.includes('Prenocovanie')) {
        hourBlocks['Prenocovanie'].push(task);
      }
    });
    renderTimeSlots();
  });

} else if (currentDayOfWeek === 6) {
  // ✅ SOBOTA: PONDELOK
  const monDate = new Date(dateStr);
  monDate.setDate(monDate.getDate() + 2);
  const monDateStr = `${monDate.getFullYear()}-${String(monDate.getMonth() + 1).padStart(2,'0')}-${String(monDate.getDate()).padStart(2,'0')}`;

  getTasksForDate(monDateStr).then(monTasks => {
    monTasks.forEach(task => {
      if (task.popis === 'Oprava skla' && Array.isArray(task.checklist) && task.checklist.includes('Prenocovanie')) {
        hourBlocks['Prenocovanie'].push(task);
      }
    });
    renderTimeSlots();
  });

} else if (currentDayOfWeek === 0) {
  // ✅ NEDELA: nic (pondelok patri na sobotu)
  renderTimeSlots();

} else {
  // ostatne dni: povodne
  getTasksForDate(nextDateStr).then(nextDayTasks => {
    nextDayTasks.forEach(task => {
      if (task.popis === 'Oprava skla' && Array.isArray(task.checklist) && task.checklist.includes('Prenocovanie')) {
        hourBlocks['Prenocovanie'].push(task);
      }
    });
    renderTimeSlots();
  });
                       
                        }

                        function renderTimeSlots() {
  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

  timeSlots.forEach(key => {
    const hourBlock = document.createElement('div');
    hourBlock.className = 'hour-block';

    const label = document.createElement('div');
    label.className = 'hour-label';
    label.textContent = key;

    const slot = document.createElement('div');
    slot.className = 'hour-slot';

 (hourBlocks[key] || []).forEach(task => {
  const badge = document.createElement('div');
  const styleClass = standardPopis.includes(task.popis) ? sanitizeClassName(task.popis) : 'Ostatne';
  badge.className = `task-badge ${sanitizeClassName(task.mechanik || 'Bez_mechanika')} ${styleClass}`;
  if (isCancelledTask(task)) badge.classList.add('cancelled')

  const cl = checklistArr(task);

  // Zrusene
  if (cl.includes('Zrušené')) {
    badge.classList.add('is-cancelled');
  }

  // Odovzdana
  if (cl.includes('Zákazka odovzdaná')) {
    badge.classList.add('is-delivered');
  }

  // Prenocovanie flag (ikonka)
  const hasPrenocovanie = Array.isArray(task.checklist) && task.checklist.includes('Prenocovanie');

  // Ikony (okrem prenocovania)
  let icons = getChecklistIcons(task.checklist);

  // Ak je prenocovanie → pridaj 🌠
  if (hasPrenocovanie) {
    icons += `<span class="checklist-icon">🌠</span>`;
  }

  // ✅ vytlaceny stitok (iba ak nie je zrusene)
  const isPrinted = hasPrintedLabel(task) && !isCanceledTask(task);
  if (isPrinted) {
    badge.classList.add('printed-label');
  }

  // ✅ OKO (pocet poskodeni) pre Oprava skla – vytiahni z extraInfo cez helper getOkoCount(task)
  // (getOkoCount si uz robil v bode 1)
  const oko = (task.popis === 'Oprava skla') ? getOkoCount(task) : '';
  const okoPart = oko ? ` | OKO: ${oko}x` : '';

  // ✅ vozidlo text (nechame tvoje nahrady SPZ/POSK -> ŠPZ/OKO)
  const vehicleText = (task.znacka || '')
    .replace('SPZ:', 'ŠPZ:')
    .replace('POSK:', 'OKO:');

  // NOVÁ ŠTRUKTÚRA BADGE (zvyraznenie CASU)
  badge.innerHTML = `
    <div class="task-left">
      <span class="task-time ${isPrinted ? 'label-printed-time' : ''}">${task.start || ''}</span>
      | ${task.popis || ''} | ${vehicleText}${okoPart} | ${task.poistovna || ''} | ${task.meno || ''}
    </div>
    <div class="task-right ${hasPrenocovanie ? 'prenocovanie' : ''}">
      ${icons}
    </div>
  `;

  badge.style.cursor = 'pointer';
  badge.dataset.taskId = task.id;
  badge.dataset.date = task.date || dateStr;

  badge.addEventListener('click', (e) => {
    e.stopPropagation();
    showTaskDetails(task, task.date || dateStr, task.id);
  });

  slot.appendChild(badge);
});


    hourBlock.appendChild(label);
    hourBlock.appendChild(slot);
    dayDiv.appendChild(hourBlock);
  });

                            // ===== NOC (Prenocovanie) + THULE =====
                            const hasNightTasks = hourBlocks['Prenocovanie'].length > 0;
                            const hasThule = thuleNotes.length > 0;

                            if (hasNightTasks || hasThule) {
                                const prenocovanieBlock = document.createElement('div');
                                prenocovanieBlock.className = 'hour-block';
                                const label = document.createElement('div');
                                label.className = 'hour-label';
                                label.textContent = 'Noc';
                                const slot = document.createElement('div');
                                slot.className = 'hour-slot';

                                hourBlocks['Prenocovanie'].forEach(task => {
  const badge = document.createElement('div');
  const styleClass = standardPopis.includes(task.popis) ? sanitizeClassName(task.popis) : 'Ostatne';
  badge.className = `task-badge ${sanitizeClassName(task.mechanik || 'Bez_mechanika')} ${styleClass} prenocovanie-badge`;

  // ✅ FIX: bolo "div", musi byt badge
  if (isCancelledTask(task)) badge.classList.add('cancelled');

  const cl = Array.isArray(task.checklist) ? task.checklist : [];

  // zrusene
  const isCancelled = cl.includes('Zrušená zákazka') || cl.includes('Zrušené');
  if (isCancelled) {
    badge.classList.add('is-cancelled');
  }

  // ✅ vytlaceny stitok (iba ak nie je zrusene)
  const isPrinted = hasPrintedLabel(task) && !isCanceledTask(task);
  if (isPrinted) {
    badge.classList.add('printed-label');
  }

  // ikony
  let icons = '';
  icons += `<span class="checklist-icon">🌠</span>`;

  // ✅ OKO pre Oprava skla (z extraInfo)
  const oko = (task.popis === 'Oprava skla') ? getOkoCount(task) : '';
  const okoPart = oko ? ` | OKO: ${oko}x` : '';

  // ✅ poistovna – vzdy nieco zobrazime
  const poistovnaText =
    (task.poistovna && String(task.poistovna).trim())
      ? task.poistovna
      : 'Bez poistovne';

  // ✅ vozidlo text (nechame tvoje nahrady)
  const vehicleText = (task.znacka || '')
    .replace('SPZ:', 'ŠPZ:')
    .replace('POSK:', 'OKO:');

  // ✅ v NOCI zvyraznujeme POPIS prace, nie cas
  badge.innerHTML = `
    <div class="task-left">
      <span class="${isPrinted ? 'label-printed-overnight' : ''}">
        ${task.popis || ''}
      </span>
      | ${vehicleText}${okoPart}
      | ${poistovnaText}
      | ${task.meno || '—'}
    </div>
    <div class="task-right prenocovanie">
      ${icons}
    </div>
  `;

  badge.style.cursor = 'pointer';
  badge.dataset.taskId = task.id;
  badge.dataset.date = task.date || dateStr;
  badge.addEventListener('click', (e) => {
    e.stopPropagation();
    showTaskDetails(task, task.date || dateStr, task.id);
  });

  slot.appendChild(badge);
});


                                // ✅ THULE z poznamok do Noci (NAZACIATOK)
if (hasThule) {
    thuleNotes.forEach(n => {
        const th = document.createElement('div');
        th.className = 'thule-night-badge';
        th.textContent = 'THULE PALETY';
        slot.appendChild(th);
    });
}


                                prenocovanieBlock.appendChild(label);
                                prenocovanieBlock.appendChild(slot);
                                dayDiv.appendChild(prenocovanieBlock);
                            }
                        }
                    }
                })
                .catch(error => {
                    console.error(`Chyba pri načítaní úloh pre ${dateStr}:`, error);
                    dayDiv.innerHTML += '<p>Chyba pri načítaní úloh.</p>';
                });

        }).catch(error => {
            console.error(`Chyba pri načítaní poznámok pre ${dateStr}:`, error);
            dayContainer.innerHTML += '<p>Chyba pri načítaní poznámok.</p>';
        });

    }).catch(error => {
        console.error(`Chyba pri načítaní dovoleniek pre ${dateStr}:`, error);
        dayContainer.innerHTML += '<p>Chyba pri načítaní dovoleniek.</p>';
    });
}

function openModal(dateStr) {
// ✅ nova zakazka = ziadny povodny checklist na zachovanie
window.__editingOriginalChecklist = [];

    
    // Nastaviť predvolený dátum (dnešok alebo kliknutý deň)
    const today = new Date().toISOString().split("T")[0];
    const finalDate = dateStr || today;

    // Overenie existencie prvkov
    if (!elements.modal || !elements.selectedDateInput || !elements.modalDateDisplay || !elements.taskForm || !elements.znackaInput) 
        return;

    // 🔥 Dátum musí byť VIDITEĽNÝ
    elements.selectedDateInput.value = finalDate;
    elements.selectedDateInput.setAttribute('type', 'date');
    elements.selectedDateInput.setAttribute('required', 'required');

    // 🔥 Sekcia dátumu musí byť VIDITEĽNÁ
    if (elements.datePickerSection) {
        elements.datePickerSection.style.display = 'block';
    }

    // Resetovať editáciu
    elements.editIndexInput.value = -1;

    // Zobraziť dátum hore v modale
    elements.modalDateDisplay.textContent = formatModalDate(finalDate);

   elements.modal.classList.remove('hidden');

// Reset formu
elements.taskForm.reset();

// 🔥 Po resete musíme dátum znova nastaviť
elements.selectedDateInput.setAttribute('type', 'date');
elements.selectedDateInput.value = finalDate;
elements.datePickerSection.style.display = 'block';

    // Skryť custom popis
    if (elements.customPopisInput && elements.customPopisLabel) {
        elements.customPopisInput.style.display = 'none';
        elements.customPopisLabel.style.display = 'none';
        elements.customPopisInput.required = false;
    }

    // Reset checklist
    document.querySelectorAll('input[name="checklist"]').forEach(ch => ch.checked = false);

     // Načítať tasky pre daný dátum
    renderTaskList(finalDate);

    // ✅ tu, ESTE PRED ZATVORENIM FUNKCIE
    if (elements.popisSelect) {
      elements.popisSelect.dispatchEvent(new Event('change'));
    }
}



function getTasksForDate(dateStr) {
    console.log(`Fetching tasks for date: ${dateStr}`);
    return fetch(`http://192.168.1.10/Kalendár/api/tasks.php?date=${dateStr}`)
        .then(response => {
            if (!response.ok) {
                console.error(`HTTP error fetching tasks for ${dateStr}: ${response.status} ${response.statusText}`);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            console.log(`Response headers for ${dateStr}:`, Object.fromEntries(response.headers));
            return response.json();
        })
        .then(tasks => {
            console.log(`Tasks received for ${dateStr}:`, JSON.stringify(tasks, null, 2));
            return tasks || [];
        })
        .catch(error => {
            console.error(`Error fetching tasks for ${dateStr}:`, error);
            return [];
        });
}

function saveTasksForDate(dateStr, task) {
    const method = task.id >= 0 ? 'PUT' : 'POST';
    const url = `http://192.168.1.10/Kalendár/api/tasks.php${method === 'POST' ? `?date=${dateStr}` : ''}`;

    // Ensure date AND createdAt are included in the task object
    const taskWithDate = { 
        ...task, 
        date: dateStr,
        createdAt: task.createdAt   // 🔥 Dôležité – bez tohto detail ukazuje —
    };

    console.log(`Saving task for ${dateStr}, method: ${method}, payload:`, JSON.stringify(taskWithDate, null, 2));

    return fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(taskWithDate)
    })
        .then(response => {
            if (!response.ok) return response.text().then(text => { throw new Error(`HTTP ${response.status}: ${text}`); });
            return response.json();
        })
        .then(data => {
            if (!data.success || (!data.id && method === 'POST')) throw new Error('Failed to save task: ' + JSON.stringify(data));
            console.log(`Task saved successfully for ${dateStr}:`, data);
            renderTaskList(dateStr); 
            renderCalendar(currentDate); 
            return data;
        })
        .catch(error => {
            console.error('Error saving task:', error);
            alert(`Chyba pri ukladaní úlohy: ${error.message}`);
        });
}


function renderTaskList(dateStr) {
    if (!elements.taskList) return;

    getTasksForDate(dateStr)
        .then(tasks => {
            elements.taskList.innerHTML = '';

            tasks.forEach(task => {
                const div = document.createElement('div');
                div.className = `task ${sanitizeClassName(task.mechanik || 'Bez_mechanika')} task-badge ${sanitizeClassName(task.popis)}`;

                const taskSpan = document.createElement('span');
                taskSpan.innerHTML = `<span class="task-time">${task.start}</span> | ${task.popis} | ${task.znacka} | ${task.poistovna || '—'} | ${task.meno} ${getChecklistIcons(task.checklist || [])}`;
                taskSpan.style.cursor = 'pointer';
                taskSpan.dataset.id = task.id;
                taskSpan.addEventListener('click', () => showTaskDetails(task, dateStr, task.id));

                const buttonsDiv = document.createElement('div');
                buttonsDiv.className = 'task-buttons';

                const editBtn = document.createElement('button');
                editBtn.className = 'edit-btn';
                editBtn.setAttribute('aria-label', 'Upraviť úlohu');
                editBtn.dataset.id = task.id;

                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();

                    const password = prompt('Zadaj heslo pre úpravu zákazky:');
                    if (password !== '36248703') {
                        alert('Nesprávne heslo.');
                        return;
                    }

                    console.log(`Upravujem úlohu s ID ${task.id} pre dátum ${dateStr}`);
                    window.editTask(dateStr, task.id, task); // posielam aj task (bezpecnejsie)
                });

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.setAttribute('aria-label', 'Vymazať úlohu');
                deleteBtn.innerHTML = '🗑️';
                deleteBtn.dataset.id = task.id;

                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();

                    const password = prompt('Zadaj heslo pre zmazanie zákazky:');
                    if (password !== '36248703') {
                        alert('Nesprávne heslo.');
                        return;
                    }

                    if (!confirm('Naozaj chcete vymazať túto zákazku?')) return;

                    console.log(`Vymazávam úlohu s ID ${task.id} pre dátum ${dateStr}`);
                    window.deleteTask(dateStr, task.id);
                });

                buttonsDiv.appendChild(editBtn);
                buttonsDiv.appendChild(deleteBtn);

                div.appendChild(taskSpan);
                div.appendChild(buttonsDiv);

                elements.taskList.appendChild(div);
            });
        })
        .catch(error => {
            console.error('Error rendering task list:', error);
            elements.taskList.innerHTML = '<p>Chyba pri načítaní úloh.</p>';
        });
}



function showTaskDetails(task, dateStr, id) {
  if (!elements.detailsContent || !elements.detailsModal || !elements.editDetailsBtn) return;

  console.log(`Zobrazujem detaily pre úlohu s ID ${id} (type: ${typeof id}) pre dátum ${dateStr}, task: ${JSON.stringify(task, null, 2)}`);

  // Show/hide Prenocovanie checkbox FIRST, before setting checked states
 const detailsPrenocovanieLabel = document.getElementById('detailsPrenocovanieCheckboxLabel');
if (detailsPrenocovanieLabel) {
  if (task.popis === 'Výmena skla' || task.popis === 'Oprava skla') {
    detailsPrenocovanieLabel.style.display = 'flex';
  } else {
    detailsPrenocovanieLabel.style.display = 'none';
  }
}



  // --------- helpers pre detail ----------
  const dateObj = new Date(dateStr);
  const formattedDate = `${dateObj.getDate()}.${dateObj.getMonth() + 1}.${dateObj.getFullYear()}`;

  let spzDetail = "";
  let cenaDetail = "";
  try {
    spzDetail = extractSpzFromZnacka(task.znacka || "");
    cenaDetail = formatEuro(extractCenaFromExtraInfo(task.extraInfo || ""));
  } catch (e) {
    console.error("SPZ/CENA parse error:", e);
  }

  // ✅ Store task for printing (global), nech to mas konzistentne aj inde
  currentTaskForPrint = {
    popis: task.popis || '',
    znacka: (task.znacka || '')
      .replace('SPZ:', 'ŠPZ:')
      .replace('POSK:', 'OKO:'),
    spz: spzDetail || '',
    poistovna: task.poistovna || '',
    meno: task.meno || '',
    extraInfo: task.extraInfo || '',
    telefon: task.telefon || '',
    checklist: task.checklist || []
  };

  // --------- Render detail content ----------

// --- priprava hodnot (mimo template string) ---
const znackaStr = String(task.znacka || '');
const extraRaw = String(task.extraInfo || '');

// SPZ: preferuj spzDetail/task.spz, inak vytiahni z task.znacka ("SPZ:AA123BB")
let spzClean = String((typeof spzDetail !== 'undefined' ? spzDetail : '') || task.spz || '').trim().toUpperCase();
if (!spzClean) {
  const mSpz = znackaStr.match(/\bSPZ:\s*([A-Z0-9]+)\b/i);
  spzClean = mSpz ? mSpz[1].toUpperCase() : '';
}

// CENA z extraInfo: "CENA:123 € | ..."  (NEDEKLARUJ znova, len nastav)
cenaDetail = cenaDetail || '—';
const mCena = extraRaw.match(/(?:^|\|\s*)CENA:\s*([^|]+)\s*(\||$)/i);
if (mCena && mCena[1]) cenaDetail = mCena[1].trim();


// POSK: primarne z extraInfo "POSK:2 | ...", fallback na stare OKO/POSK v znacke, fallback task.poskodenia
let poskodeniaVal = '—';
if (String(task.popis || '') === 'Oprava skla') {
  const mPoskExtra = extraRaw.match(/(?:^|\|\s*)POSK:\s*([^|]+)\s*(\||$)/i);
  if (mPoskExtra && mPoskExtra[1]) {
    poskodeniaVal = mPoskExtra[1].trim();
  } else {
    const mOld = znackaStr.match(/(?:OKO|POSK)\s*:\s*([0-9]+)\s*[xX]?/);
    if (mOld && mOld[1]) {
      poskodeniaVal = mOld[1];
    } else if (task.poskodenia) {
      poskodeniaVal = String(task.poskodenia).replace(/[^0-9]/g, '') || '—';
    }
  }
}

// Cista znacka: cast pred prvym "|" (bez SPZ / tagov)
let znackaClean = znackaStr.split('|')[0].trim();
if (!znackaClean) znackaClean = '—';

// Ciste "Dalsie info" (bez POSK a CENA)
let extraCleanDetail = extraRaw;
// vyhod CENA na zaciatku alebo za "|"
extraCleanDetail = extraCleanDetail.replace(/(?:^|\|\s*)CENA:\s*[^|]+(\||$)/ig, '|').trim();
// vyhod POSK na zaciatku alebo za "|"
extraCleanDetail = extraCleanDetail.replace(/(?:^|\|\s*)POSK:\s*[^|]+(\||$)/ig, '|').trim();
// uprac zbytocne pipe znaky
extraCleanDetail = extraCleanDetail
  .replace(/^\s*\|\s*/g, '')
  .replace(/\s*\|\s*$/g, '')
  .replace(/\s*\|\s*\|\s*/g, ' | ')
  .trim();

// ===== RENDER DETAIL =====
elements.detailsContent.innerHTML = `
  <p><strong>Vytvoril:</strong> ${task.createdBy || '—'}</p>
  <p><strong>Čas zápisu:</strong> ${task.createdAt || '—'}</p>
  <p><strong>Dátum:</strong> ${formattedDate}</p>
  <p><strong>Popis práce:</strong> ${task.popis || '—'}</p>

  ${String(task.popis || '') === 'Oprava skla'
    ? `<p><strong>Počet poškodení:</strong> ${poskodeniaVal !== '—' ? poskodeniaVal : '—'}</p>`
    : ''
  }

  <p><strong>Značka auta:</strong> ${znackaClean}</p>
  <p><strong>SPZ:</strong> ${spzClean || '—'}</p>
  <p><strong>Dohodnutá cena:</strong> ${cenaDetail || '—'}</p>

  <p><strong>Poisťovňa:</strong> ${task.poistovna || '—'}</p>
  <p><strong>Čas:</strong> ${task.start || '—'}</p>
  <p><strong>Meno zákazníka:</strong> ${task.meno || '—'}</p>
  <p><strong>Telefón:</strong> ${task.telefon || '—'}</p>
  <p><strong>Mechanik:</strong> ${task.mechanik || '—'}</p>

  ${extraCleanDetail ? `<p><strong>Ďalšie info:</strong> ${extraCleanDetail}</p>` : ''}
`;


// Open modal + block background
elements.detailsModal.classList.remove('hidden');
document.body.classList.add('modal-open');

// --------- checklist states (detailsChecklist) - FINAL ----------
const normalized = Array.isArray(task.checklist)
  ? task.checklist.map(normalizeChecklistValue)
  : [];

document.querySelectorAll('input[name="detailsChecklist"]').forEach(cb => {
  cb.checked = normalized.includes(normalizeChecklistValue(cb.value));

  // ✅ Stitok vytlaceny: viditelny, ale neda sa zrusit rucne
  if (normText(cb.value) === normText(PRINT_FLAG) || normText(cb.value) === normText('Stitok vytlaceny')) {
    cb.disabled = true;
    cb.title = 'Toto sa oznaci automaticky po tlaci stitku.';
  } else {
    cb.disabled = false;
  }
});



// --------- PRINT LABEL in detail (FIX) ----------
const printBtn = document.getElementById('printLabel');
if (printBtn) {
  printBtn.dataset.date = dateStr;
  printBtn.dataset.taskId = id;

  // NAJISTEJSIE: prepise stary handler (zabrani duplikaciam)
  printBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // ✅ nastavime global pre tlac
    currentTaskForPrint = {
  id: task.id,              // 🔥 klucove
  date: dateStr,            // 🔥 klucove
  rawTask: task,            // 🔥 cely objekt na PUT
      popis: task.popis || '',
      znacka: (task.znacka || ''),       // moze mat aj "| SPZ: ... | POSK: 3x"
      spz: spzDetail || '',
      poistovna: task.poistovna || '',
      meno: task.meno || '',
      extraInfo: task.extraInfo || '',
      telefon: task.telefon || '',
      checklist: task.checklist || []
    };

    // ===== OKO vytiahni zo znacky (POSK/OKO) =====
    let okoValue = '';
    const okoMatch = String(currentTaskForPrint.znacka || '').match(/(OKO|POSK)\s*:\s*([0-9]+)\s*[xX]?/);
    if (okoMatch) okoValue = String(okoMatch[2] || '').trim(); // iba cislo

    // ===== SPZ: preferuj pole spz, fallback zo znacky =====
    let spzToPrint = String(currentTaskForPrint.spz || '').trim();
    spzToPrint = spzToPrint.replace(/(SPZ|ŠPZ)\s*:\s*/gi, '').trim();

    if (!spzToPrint) {
      const m = String(currentTaskForPrint.znacka || '').match(/(SPZ|ŠPZ)\s*:\s*([^|]+)/i);
      if (m) spzToPrint = String(m[2] || '').trim();
    }
    spzToPrint = spzToPrint.toUpperCase();

let znackaForPrint = String(currentTaskForPrint.znacka || '—');
znackaForPrint = znackaForPrint.split('|')[0].trim();

// ✅ AK je SPZ uz nalepena na konci znacky, odrež ju (pred skratenim!)
if (spzToPrint) {
  const esc = spzToPrint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  znackaForPrint = znackaForPrint.replace(new RegExp(`\\s*${esc}\\s*$`, 'i'), '').trim();
}

// ✅ VOZIDLO presne max 12 znakov, bez bodiek/ellipsis
znackaForPrint = znackaForPrint.substring(0, 12).trimEnd();

// ✅ vysledok presne: Vozidlo: 12znakov |CELA_SPZ
const vehicleWithSpz = `${znackaForPrint}${spzToPrint ? ` |${spzToPrint}` : ''}`;




    // ===== PRACA: pri oprave dopln OKO za "Oprava skla" =====
    const isRepair = String(currentTaskForPrint.popis || '').toLowerCase().includes('oprava');
    const pracaLine = `${currentTaskForPrint.popis || '—'}${(isRepair && okoValue) ? ` | OKO: ${okoValue}` : ''}`;

    // ===== Telefon valid =====
    const hasValidPhone = !!String(currentTaskForPrint.telefon || '').trim();

    // ===== Extra info safe (bez ceny) =====
    let extraInfoSafe = String(currentTaskForPrint.extraInfo || '');
    extraInfoSafe = extraInfoSafe
      .replace(/dohodnuta\s*cena\s*[:\-]?\s*\d+([.,]\d{1,2})?\s*(€|eur)?/gi, '')
      .replace(/cena\s*[:\-]?\s*\d+([.,]\d{1,2})?\s*(€|eur)?/gi, '')
      .replace(/\b\d+([.,]\d{1,2})?\s*(€|eur)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // ===== Prenocovanie =====
    const checklist = currentTaskForPrint.checklist || [];
    const hasPrenocovanie = Array.isArray(checklist) && checklist.includes('Prenocovanie');
        // --- POSK: vytiahni z extraInfo a daj ho hore k Praci ---
        const extraRaw = (currentTaskForPrint.extraInfo || '').toString();

        // Hlada POSK:1 / POSK: 2 / posk:10 ...
        const poskMatch = extraRaw.match(/(?:^|\s)POSK\s*:\s*(\d+)(?=\s|$)/i);
        const poskValue = poskMatch ? poskMatch[1] : null;

        // Odstran POSK z Info, nech nezavadza dole
        const extraClean = extraRaw
            .replace(/(?:^|\s)POSK\s*:\s*\d+(?=\s|$)/ig, '')
            .replace(/\s{2,}/g, ' ')
            .trim();

// neprerabaj tvoje OKO pracaLine – len k nemu pridaj POSK
const pracaLineWithPosk = `${pracaLine}${poskValue ? ` | POSK:${poskValue}` : ''}`;
    // ===== HTML stitok =====
    const labelHtml = `
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Stitok</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
@page{size:50mm 33mm;margin:0}
body{
  width:50mm;
  height:33mm;
  padding:2mm;
  padding-top:3.5mm;      /* 🔼 vacsi horny okraj */
  font-family:Arial,sans-serif;
  font-size:7.2pt;        /* 🔼 vacsie pismo */
  font-weight:400;        /* zachovane */
  line-height:1.18;       /* jemne uvolnene */
  color:#000
}
.row{display:flex;gap:1.5mm;margin-bottom:1mm}
.k{font-weight:600;white-space:nowrap}
.v{font-weight:400;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* ✅ Vozidlo sa nesmie skracovat bodkami */
.row.big:nth-of-type(2) .v { 
  overflow: visible;
  text-overflow: unset;
}
.big .k,.big .v{font-size:6.6pt;font-weight:600}
.prenocovanie{margin-top:1mm;text-align:center;font-weight:600;font-size:6pt;text-transform:uppercase}
</style>
</head>
<body>
  <div class="row big"><div class="k">Praca:</div><div class="v">${pracaLine}${poskValue ? ` | POSK:${poskValue}` : ''}</div></div>
  <div class="row big"><div class="k">Vozidlo:</div><div class="v">${vehicleWithSpz}</div></div>
  <div class="row"><div class="k">Poistovna:</div><div class="v">${currentTaskForPrint.poistovna || '—'}</div></div>
  <div class="row"><div class="k">Zakaznik:</div><div class="v">${currentTaskForPrint.meno || '—'}</div></div>
  ${hasValidPhone ? `<div class="row"><div class="k">Telefon:</div><div class="v">${currentTaskForPrint.telefon}</div></div>` : ''}
  ${extraClean ? `<div class="row"><div class="k">Info:</div><div class="v">${extraClean.substring(0,30)}${extraClean.length>30?'...':''}</div></div>` : ''}
  ${hasPrenocovanie ? `<div class="prenocovanie">PRENOCOVANIE</div>` : ''}
</body>
</html>`;

    // ===== TLAC bez popup (iframe) + cleanup =====
    document.querySelectorAll('iframe.print-iframe').forEach(el => el.remove());

    const iframe = document.createElement('iframe');
    iframe.className = 'print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const cw = iframe.contentWindow;
    const doc = cw.document;
let __printedSaved = false;
function syncPrintedUIInOpenDetail() {
  // zaskrtni checkbox v detaile (aj ked je disabled)
  const cb = document.querySelector('input[name="detailsChecklist"][value="Vytlaceny stitok"]');
  if (cb) cb.checked = true;

  // aktualizuj aj globalny objekt pre tlac, nech detail drzi novy checklist
  if (currentTaskForPrint?.rawTask) {
    const cl = Array.isArray(currentTaskForPrint.rawTask.checklist)
      ? [...currentTaskForPrint.rawTask.checklist]
      : [];
    if (!cl.includes('Vytlaceny stitok') && !cl.includes('Stitok vytlaceny')) {
      // pridaj presne to, co pouziva markLabelPrinted (u teba je to "Vytlaceny stitok")
      cl.push('Vytlaceny stitok');
    }
    currentTaskForPrint.rawTask.checklist = cl;
    currentTaskForPrint.checklist = cl;
  }
}

async function savePrintedOnce() {
  if (__printedSaved) return;
  __printedSaved = true;

  await markLabelPrinted(dateStr, id);

  // ✅ okamzite zaskrtni v detaile
  syncPrintedUIInOpenDetail();

  renderTaskList(dateStr);
  renderCalendar(currentDate);
}

cw.onafterprint = async () => {
  await markLabelPrinted(dateStr, id);

  // ✅ okamzite zaskrtni v detaile
  syncPrintedUIInOpenDetail();

  renderTaskList(dateStr);
  renderCalendar(currentDate);

  setTimeout(() => iframe.remove(), 50);
};






    doc.open();
    doc.write(labelHtml);
    doc.close();

setTimeout(async () => {
  await savePrintedOnce();   // ✅ uloz hned, nespoliehaj sa na afterprint
  cw.focus();
  cw.print();

  // ✅ fallback: keby print eventy boli divne
  setTimeout(savePrintedOnce, 3000);


// ✅ natvrdo uloz po tlaci
await markLabelPrinted(dateStr, id);

// ✅ okamzite zaskrtni v detaile
syncPrintedUIInOpenDetail();

// ✅ refresh
renderTaskList(dateStr);
renderCalendar(currentDate);
}, 150);
  };
}


// --------- Save checklist button ----------
if (elements.saveChecklistBtn) {
  elements.saveChecklistBtn.dataset.date = dateStr;
  elements.saveChecklistBtn.dataset.taskId = id;

  const newSaveBtn = elements.saveChecklistBtn.cloneNode(true);
  elements.saveChecklistBtn.parentNode.replaceChild(newSaveBtn, elements.saveChecklistBtn);
  elements.saveChecklistBtn = newSaveBtn;

  elements.saveChecklistBtn.addEventListener('click', () => {
    const btnDateStr = elements.saveChecklistBtn.dataset.date;
    const btnId = parseInt(elements.saveChecklistBtn.dataset.taskId, 10);

    // ✅ DOPLNI aj "Zákazka odovzdaná", inak sa nikdy nebude dat odskrtnut (zostane v preserved)
    const detailsItems = [
  'Kontaktovaný',
  'Dodaný materiál',
  'Zakazka zrusena',
  'Zákazka dokončená',
  'Prenocovanie',
  'Zákazka odovzdaná',
  PRINT_FLAG
];

    // co uz task mal predtym (obsahuje aj Vytlaceny stitok, Zrusene, atd.)
    const original = Array.isArray(task.checklist) ? task.checklist : [];

    // co si uzivatel teraz zaskrtol v detaile
    const selected = Array.from(document.querySelectorAll('input[name="detailsChecklist"]:checked'))
      .map(cb => cb.value);

    // zachovaj vsetko "mimo detail checkboxov" + pridaj aktualne zaskrtnute
    const preserved = original.filter(x => !detailsItems.includes(x));
    const mergedChecklist = Array.from(new Set([...preserved, ...selected]));
// ✅ poistka: ak uz task mal vytlaceny stitok, nenechaj to zmiznut ani ulozenim checklistu
if (original.includes(PRINT_FLAG) && !mergedChecklist.includes(PRINT_FLAG)) {
  mergedChecklist.push(PRINT_FLAG);
}

// ✅ VALIDACIA: ak je odovzdana a je to Vymena/Oprava skla, musi byt mechanik
// (v detaile mechanika nevyberas, tak sa berie z ulozenej task.mechanik)
const mechanikValue = (task.mechanik || '').trim();
const isOdovzdana = mergedChecklist.includes('Zákazka odovzdaná'); // presne ako value v HTML

const popisVal = String(task.popis || '').trim();
const needsMechanikWhenDelivered =
  (popisVal === 'Výmena skla' || popisVal === 'Oprava skla');

if (needsMechanikWhenDelivered && isOdovzdana && !mechanikValue) {
  alert('Ak je zákazka označená ako odovzdaná, musí byť vyplnený mechanik. Najprv klikni "Editovať" a nastav mechanika.');
  // aby to userovi hned "neostalo" zaskrtnute v UI
  const cb = document.querySelector('input[name="detailsChecklist"][value="Zákazka odovzdaná"]');
  if (cb) cb.checked = false;
  return;
}


    fetch(`http://192.168.1.10/Kalendár/api/tasks.php`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...task,
        id: btnId,
        date: btnDateStr,
        checklist: mergedChecklist
      })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          renderTaskList(btnDateStr);
          renderCalendar(currentDate);
          elements.detailsModal.classList.add('hidden');
        } else {
          throw new Error('Failed to update checklist');
        }
    // zavri detail + odblokuj body
      elements.detailsModal.classList.add('hidden');
      document.body.classList.remove('modal-open');

      // ✅ bezpecny refresh (aby neostala "polka" DAY view)
      setTimeout(() => {
        isRendering = false;          // odblokuje pripadny "render in progress"
        renderCalendar(currentDate);  // znovu vykresli den
        renderTaskList(btnDateStr);   // refresh listu
      }, 80);
    })
    .catch(err => {
      console.error('Error updating checklist:', err);
      alert('Chyba pri aktualizácii zoznamu.');
    });
  });
}

  // --------- Edit button ----------
  if (elements.editDetailsBtn) {
    elements.editDetailsBtn.dataset.date = dateStr;
    elements.editDetailsBtn.dataset.taskId = id;

    const newEditBtn = elements.editDetailsBtn.cloneNode(true);
    newEditBtn.textContent = 'Editovať';
    elements.editDetailsBtn.parentNode.replaceChild(newEditBtn, elements.editDetailsBtn);
    elements.editDetailsBtn = newEditBtn;

    elements.editDetailsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const btnDateStr = elements.editDetailsBtn.dataset.date;
      const btnId = parseInt(elements.editDetailsBtn.dataset.taskId);

      console.log(`Kliknuté tlačidlo na úpravu pre úlohu s ID ${btnId} (type: ${typeof btnId}) pre dátum ${btnDateStr}`);

      closeAllModals();
      document.body.classList.remove('modal-open');

      editTask(btnDateStr, btnId, task);
    });
  }

  // --------- Delete button ----------
  if (elements.deleteTaskBtn) {
    elements.deleteTaskBtn.style.display = 'inline-block';
    elements.deleteTaskBtn.dataset.taskId = id;
    elements.deleteTaskBtn.dataset.date = dateStr;

    const newDeleteBtn = elements.deleteTaskBtn.cloneNode(true);
    elements.deleteTaskBtn.parentNode.replaceChild(newDeleteBtn, elements.deleteTaskBtn);
    elements.deleteTaskBtn = newDeleteBtn;

    elements.deleteTaskBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Naozaj chcete vymazať túto zákazku?')) {
        deleteTask(dateStr, id).then(() => {
          closeAllModals();
          document.body.classList.remove('modal-open');
        });
      }
    });
  }
}


function editTask(dateStr, id, task) {
  if (!elements.taskForm || !elements.selectedDateInput || !elements.editIndexInput || !elements.modal) return;

  const taskId = parseInt(id);
  console.log(`Spúšťam editTask pre ID ${taskId} (type: ${typeof taskId}) a dátum ${dateStr}, task: ${JSON.stringify(task, null, 2)}`);

  if (!task || task.id != taskId) {
    console.error(`Úloha s ID ${taskId} pre dátum ${dateStr} je neplatná alebo sa nezhoduje. Poslaná úloha:`, JSON.stringify(task, null, 2));
    alert('Úloha nie je platná. Skúste obnoviť stránku.');
    return;
  }

  // ✅ zachovaj createdAt pri editacii
  window.__editingCreatedAt = task.createdAt || null;

  // ✅ uloz povodny checklist (aby sme zachovali skryte flagy ako tlac stitku)
  window.__editingOriginalChecklist = Array.isArray(task.checklist) ? task.checklist.slice() : [];

  elements.taskForm.reset();

  // datum
  elements.selectedDateInput.value = task.date || dateStr;
  if (elements.datePickerSection) {
    elements.datePickerSection.style.display = 'block';
    elements.selectedDateInput.setAttribute('type', 'date');
  }

  elements.editIndexInput.value = taskId;

  // selecty/texty
  elements.taskForm.createdBy.value = task.createdBy || '';
  elements.taskForm.mechanik.value = task.mechanik || '';

  // popis
  const allowedPopis = ['Oprava skla', 'Výmena skla', 'Prelepenie skla', 'Ťažné zariadenie', 'Žiarovky', 'Klimatizácia', 'Ostatné'];
  elements.taskForm.popis.value = allowedPopis.includes(task.popis) ? task.popis : 'Ostatné';
  elements.taskForm.customPopis.value = elements.taskForm.popis.value === 'Ostatné' ? (task.popis || '') : '';

  // ===== VOZIDLO + SPZ =====
  const znackaStr = String(task.znacka || '');
  // vozidlo = len cast pred "|", bez SPZ a bez dalsich tagov
  elements.taskForm.znacka.value = znackaStr.split('|')[0].trim();

  // SPZ pole (ak existuje)
  const spzEl = document.getElementById("spz");
  if (spzEl) {
    // pouzi tvoj helper, ked existuje
    try {
      spzEl.value = extractSpzFromZnacka(znackaStr) || '';
    } catch {
      const mSpz = znackaStr.match(/\bSPZ:\s*([A-Z0-9]+)\b/i);
      spzEl.value = mSpz ? mSpz[1].toUpperCase() : '';
    }
  }

  // ===== POSK + CENA z extraInfo =====
  const extraRaw = String(task.extraInfo || '');

  // POSK: "POSK:2 | ..."
  const poskEl = document.getElementById('poskodenia');
  const poskLabelEl = document.getElementById('poskodeniaLabel');
  const mPosk = extraRaw.match(/(?:^|\|\s*)POSK:\s*([^|]+)\s*(\||$)/i);
  const poskValue = mPosk && mPosk[1] ? mPosk[1].trim() : '';

  if (poskEl && poskLabelEl) {
    if (task.popis === 'Oprava skla') {
      poskEl.style.display = 'block';
      poskLabelEl.style.display = 'block';
      // ked poskValue je "", nechaj Vyber
      poskEl.value = poskValue || '';
    } else {
      poskEl.style.display = 'none';
      poskLabelEl.style.display = 'none';
      poskEl.value = '';
    }
  }

// CENA: do #cenaInline (ak existuje) - vytiahni CENA hocikde v extraInfo
const cenaEl = document.getElementById("cenaInline");
if (cenaEl) {
  let cenaVal = '';

  // robustne: chyt "CENA: ...." az po najblizsi "|" alebo koniec
  const mCena = extraRaw.match(/(?:^|\|\s*)CENA\s*:\s*([^|]*?)(?=\s*\||\s*$)/i);
  if (mCena && mCena[1]) cenaVal = mCena[1].trim();

  // fallback na tvoju helper funkciu (ak by mal niekto stary format)
  if (!cenaVal) {
    try {
      cenaVal = (extractCenaFromExtraInfo(extraRaw) || '').trim();
    } catch (e) {}
  }

  cenaEl.value = cenaVal;
}



  // ===== ostatne polia =====
  elements.taskForm.poistovna.value = task.poistovna || '';
  elements.taskForm.startTime.value = task.start || '';
  elements.taskForm.meno.value = task.meno || '';
  elements.taskForm.telefon.value = task.telefon || '';

  // ✅ extraInfo do formulara musi byt "ciste" (bez POSK a CENA kdekolvek v texte)
  let cleanedExtra = extraRaw;
  // vyhod CENA aj POSK nech su kdekolvek v "A | B | C" formate
  cleanedExtra = cleanedExtra
    .replace(/(?:^|\|\s*)CENA:\s*[^|]+(\||$)/ig, '|')
    .replace(/(?:^|\|\s*)POSK:\s*[^|]+(\||$)/ig, '|')
    .replace(/^\s*\|\s*/g, '')
    .replace(/\s*\|\s*$/g, '')
    .replace(/\s*\|\s*\|\s*/g, ' | ')
    .trim();

  elements.taskForm.extraInfo.value = cleanedExtra;

  // ===== Prenocovanie checkbox label (form) =====
  const prenocovanieLabel = document.getElementById('prenocovanieCheckboxLabel');
if (prenocovanieLabel) {
  if (task.popis === 'Výmena skla' || task.popis === 'Oprava skla') {
    prenocovanieLabel.style.display = 'flex';
  } else {
    prenocovanieLabel.style.display = 'none';
  }
}


  // custom popis show/hide
  if (elements.taskForm.popis.value === 'Ostatné') {
    if (elements.customPopisInput && elements.customPopisLabel) {
      elements.customPopisInput.style.display = 'block';
      elements.customPopisLabel.style.display = 'block';
      elements.customPopisInput.required = true;
    }
  } else {
    if (elements.customPopisInput && elements.customPopisLabel) {
      elements.customPopisInput.style.display = 'none';
      elements.customPopisLabel.style.display = 'none';
      elements.customPopisInput.required = false;
    }
  }

  // checklist
  document.querySelectorAll('input[name="checklist"]').forEach(checkbox => {
    checkbox.checked = Array.isArray(task.checklist) && task.checklist.includes(checkbox.value);
  });

  // modal show
  elements.modalDateDisplay.textContent = formatModalDate(elements.selectedDateInput.value);
  elements.modal.removeAttribute('style');
  elements.modal.classList.remove('hidden');

  // Trigger counter update for extraInfo field
  const extraInfoInput = document.getElementById('extraInfo');
  if (extraInfoInput) {
    extraInfoInput.dispatchEvent(new Event('input'));
  }

  renderTaskList(dateStr);
}




function editVacation(id) {
    if (!elements.vacationForm || !elements.vacationModal || !elements.vacationIndexInput) return;
    fetch(`http://192.168.1.10/Kalendár/api/vacations.php`)
        .then(response => response.json())
        .then(vacations => {
            const vacation = vacations.find(v => v.id === id);
            if (!vacation) {
                alert('Dovolenka nebola nájdená.');
                console.error(`Dovolenka s ID ${id} nebola nájdená`);
                return;
            }

            console.log(`Načítavam dovolenku na úpravu: ${JSON.stringify(vacation)}`);
            elements.vacationForm.reset();
            elements.vacationIndexInput.value = id;
            elements.vacationForm.employee.value = vacation.employee || '';
            elements.vacationForm.absenceType.value = vacation.absenceType || '';
            elements.vacationForm.dateFrom.value = vacation.dateFrom || '';
            elements.vacationForm.dateTo.value = vacation.dateTo || '';
            elements.vacationForm.vacationNote.value = vacation.note || '';
            elements.vacationModal.classList.remove('hidden');
            if (elements.deleteVacationBtn) {
                elements.deleteVacationBtn.style.display = 'inline-block';
            }
        });
}

function deleteTask(dateStr, id) {
    return fetch(`http://192.168.1.10/Kalendár/api/tasks.php?id=${id}`, {
        method: 'DELETE'
    })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (!data.success) throw new Error('Failed to delete task');
            // Add delay before rendering
            return new Promise(resolve => setTimeout(resolve, 300));
        })
        .then(() => {
            renderTaskList(dateStr);
            renderCalendar(currentDate);
        })
        .catch(error => {
            console.error('Error deleting task:', error);
            alert('Chyba pri mazaní úlohy.');
            throw error;
        });
}

function sanitizeClassName(name) {
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_]/g, '');
}
function isCancelledTask(task) {
  const cl = Array.isArray(task?.checklist) ? task.checklist : [];
  return (
    cl.includes('Zakazka zrusena') ||
    cl.includes('Zákazka zrušená') ||
    cl.includes('ZAKAZKA ZRUSENA')
  );
}
function normalizeChecklistValue(v) {
  if (v === 'Zrusena zakazka') return 'Zrušená zákazka';
  if (v === 'Zakazka odovzdaná') return 'Zákazka odovzdaná';
  if (v === 'Zakazka odovzdana') return 'Zákazka odovzdaná';
  return v;
}
function normText(s) {
  return String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim();
}

function hasPrintedLabel(task) {
  const cl = checklistArr(task);
  return cl.some(x => {
    const n = normText(x);
    return n === normText('Vytlaceny stitok') || n === normText('Stitok vytlaceny');
  });
}

// ====== SPZ + CENA helpers (MUSIA byt globalne) ======
function normalizeSpz(v) {
  return (v || "").toUpperCase().replace(/\s+/g, "").trim();
}
function stripSpzFromZnacka(znacka) {
  return (znacka || "").replace(/\s*\|\s*SPZ:\s*[A-Z0-9]+\s*$/i, "").trim();
}
function extractSpzFromZnacka(znacka) {
  const m = (znacka || "").match(/\bSPZ:\s*([A-Z0-9]+)\b/i);
  return m ? m[1].toUpperCase() : "";
}
function getOkoCount(task) {
  // primarne z extraInfo: "POSK:2 | ..."
  const extra = String(task?.extraInfo || '');
  let m = extra.match(/(?:^|\|\s*)POSK:\s*([0-9]+)\s*(?:x)?\s*(?=\||$)/i);
  if (m && m[1]) return m[1];

  // fallback: stare formaty v znacke "OKO:2x" alebo "POSK:2x"
  const zn = String(task?.znacka || '');
  m = zn.match(/(?:OKO|POSK)\s*:\s*([0-9]+)\s*[xX]?/);
  if (m && m[1]) return m[1];

  return '';
}
function stripCenaFromExtraInfo(extraInfo) {
  return (extraInfo || "").replace(/^\s*CENA:\s*[^|]+?\s*\|\s*/i, "").trim();
}
function extractCenaFromExtraInfo(extraInfo) {
  const m = (extraInfo || "").match(/^\s*CENA:\s*([^|]+)\s*(\||$)/i);
  return m ? m[1].trim() : "";
}
function formatEuro(v) {
  const s = (v || "").toString().trim();
  if (!s) return "";
  return s.includes("€") ? s : `${s} €`;
}
function escapeLatex(str) {
    if (!str) return str;
    return str
        .replace(/&/g, '\\&')
        .replace(/%/g, '\\%')
        .replace(/\$/g, '\\$')
        .replace(/#/g, '\\#')
        .replace(/_/g, '\\_')
        .replace(/{/g, '\\{')
        .replace(/}/g, '\\}')
        .replace(/~/g, '\\textasciitilde')
        .replace(/\^/g, '\\textasciicircum')
        .replace(/\\/g, '\\textbackslash');
}

function exportTasks(dateFrom, dateTo, format) {
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    if (toDate < fromDate) {
        alert('Dátum "do" musí byť neskorší alebo rovnaký ako dátum "od".');
        return;
    }

    const dateRange = [];
    let current = new Date(fromDate);
    while (current <= toDate) {
        dateRange.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }

    if (format === 'pdf') {
        let latexContent = `
\\documentclass[a4paper,12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[slovak]{babel}
\\usepackage{geometry}
\\usepackage{tabularx}
\\usepackage{booktabs}
\\usepackage{multirow}
\\usepackage{lmodern}
\\geometry{a4paper, margin=1in}
\\begin{document}

\\begin{center}
  \\textbf{\\large Kalendár prác}\\\\
  \\vspace{0.2cm}
  Obdobie: ${fromDate.toLocaleDateString('sk-SK')} -- ${toDate.toLocaleDateString('sk-SK')}
\\end{center}

\\vspace{0.5cm}
`;

        Promise.all(dateRange.map(date => getTasksForDate(date).then(tasks => ({ date, tasks }))))
            .then(results => {
                return Promise.all(dateRange.map(date => getVacationsForDate(date).then(vacations => ({ date, vacations }))))
                    .then(vacationResults => ({ tasks: results, vacations: vacationResults }));
            })
            .then(({ tasks, vacations }) => {
                tasks.forEach(({ date, tasks }) => {
                    const vacationData = vacations.find(v => v.date === date)?.vacations || [];
                    if (tasks.length > 0 || vacationData.length > 0) {
                        latexContent += `
\\section*{${new Date(date).toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}}
`;
                        if (tasks.length > 0) {
                            latexContent += `
\\subsection*{Úlohy}
\\begin{tabularx}{\\textwidth}{|p{2cm}|p{2.5cm}|X|p{2cm}|p{2cm}|p{2cm}|p{2cm}|p{2.5cm}|X|}
\\hline
\\textbf{Čas} & \\textbf{Popis práce} & \\textbf{Značka} & \\textbf{Poisťovňa} & \\textbf{Meno} & \\textbf{Telefón} & \\textbf{Mechanik} & \\textbf{Ďalšie info} & \\textbf{Check list} \\\\
\\hline
`;
                            tasks.sort((a, b) => {
                                if (a.start === 'Prenocovanie') return 1;
                                if (b.start === 'Prenocovanie') return -1;
                                return a.start.localeCompare(b.start);
                            }).forEach(task => {
                                latexContent += `${escapeLatex(task.start === 'Prenocovanie' ? 'Prenocovanie' : `${task.start}--${task.end}`)} & ${escapeLatex(task.popis)} & ${escapeLatex(task.znacka)} & ${escapeLatex(task.poistovna || '—')} & ${escapeLatex(task.meno)} & ${escapeLatex(task.telefon)} & ${escapeLatex(task.mechanik || '—')} & ${escapeLatex(task.extraInfo || '—')} & ${escapeLatex(Array.isArray(task.checklist) ? task.checklist.join(', ') : '—')} \\\\ \\hline\n`;
                            });
                            latexContent += `
\\end{tabularx}
\\vspace{0.3cm}
`;
                        }
                        if (vacationData.length > 0) {
                            latexContent += `
\\subsection*{Absencie}
\\begin{tabularx}{\\textwidth}{|X|p{2cm}|p{3cm}|X|}
\\hline
\\textbf{Meno} & \\textbf{Typ absencie} & \\textbf{Dátumy} & \\textbf{Poznámka} \\\\
\\hline
`;
                            vacationData.forEach(vacation => {
                                latexContent += `${escapeLatex(vacation.employee)} & ${escapeLatex(vacation.absenceType)} & ${escapeLatex(vacation.dateFrom)}--${escapeLatex(vacation.dateTo)} & ${escapeLatex(vacation.note || '—')} \\\\ \\hline\n`;
                            });
                            latexContent += `
\\end{tabularx}
\\vspace{0.3cm}
`;
                        }
                    }
                });

                latexContent += `
\\end{document}
`;

                const blob = new Blob([latexContent], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `kalendar_prac_${dateFrom}_${dateTo}.tex`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                alert('Súbor .tex bol stiahnutý. Pre PDF ho skompilujte pomocou PDFLaTeX (napr. Overleaf alebo príkazom pdflatex).');
                elements.exportModal.classList.add('hidden');
                elements.exportForm.reset();
            })
            .catch(error => {
                console.error('Error exporting to PDF:', error);
                alert('Chyba pri exporte do PDF.');
            });
    } else if (format === 'excel') {
        if (typeof XLSX === 'undefined') {
            alert('Knižnica SheetJS nie je načítaná. Excel export nie je dostupný.');
            return;
        }
        const wb = XLSX.utils.book_new();
        const tasksData = [['Dátum', 'Čas', 'Popis práce', 'Značka', 'Poisťovňa', 'Meno', 'Telefón', 'Mechanik', 'Ďalšie info', 'Check list']];
        const vacationsData = [['Dátum', 'Meno', 'Typ absencie', 'Dátumy', 'Poznámka']];

        Promise.all(dateRange.map(date => getTasksForDate(date).then(tasks => ({ date, tasks }))))
            .then(results => {
                return Promise.all(dateRange.map(date => getVacationsForDate(date).then(vacations => ({ date, vacations }))))
                    .then(vacationResults => ({ tasks: results, vacations: vacationResults }));
            })
            .then(({ tasks, vacations }) => {
                tasks.forEach(({ date, tasks }) => {
                    tasks.sort((a, b) => {
                        if (a.start === 'Prenocovanie') return 1;
                        if (b.start === 'Prenocovanie') return -1;
                        return a.start.localeCompare(b.start);
                    }).forEach(task => {
                        tasksData.push([
                            new Date(date).toLocaleDateString('sk-SK'),
                            task.start === 'Prenocovanie' ? 'Prenocovanie' : `${task.start}–${task.end}`,
                            task.popis,
                            task.znacka,
                            task.poistovna || '—',
                            task.meno,
                            task.telefon,
                            task.mechanik || '—',
                            task.extraInfo || '—',
                            Array.isArray(task.checklist) ? task.checklist.join(', ') : '—'
                        ]);
                    });
                });

                vacations.forEach(({ date, vacations }) => {
                    vacations.forEach(vacation => {
                        vacationsData.push([
                            new Date(date).toLocaleDateString('sk-SK'),
                            vacation.employee,
                            vacation.absenceType,
                            `${vacation.dateFrom}–${vacation.dateTo}`,
                            vacation.note || '—'
                        ]);
                    });
                });

                const tasksSheet = XLSX.utils.aoa_to_sheet(tasksData);
                XLSX.utils.book_append_sheet(wb, tasksSheet, 'Úlohy');
                const vacationsSheet = XLSX.utils.aoa_to_sheet(vacationsData);
                XLSX.utils.book_append_sheet(wb, vacationsSheet, 'Absencie');
                XLSX.writeFile(wb, `kalendar_prac_${dateFrom}_${dateTo}.xlsx`);
                elements.exportModal.classList.add('hidden');
                elements.exportForm.reset();
            })
            .catch(error => {
                console.error('Error exporting to Excel:', error);
                alert('Chyba pri exporte do Excelu.');
            });
    }
}

if (elements.exportForm) {
    elements.exportForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const dateFrom = elements.exportForm.dateFromExport?.value;
        const dateTo = elements.exportForm.dateToExport?.value;
        const format = elements.exportForm.exportFormat?.value;
        if (!dateFrom || !dateTo || !format) {
            alert('Všetky polia musia byť vyplnené.');
            return;
        }
        exportTasks(dateFrom, dateTo, format);
    });
}

if (elements.taskForm) {
  elements.taskForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const createdBy = (elements.taskForm.createdBy?.value || '').trim();
    const popisSelectValue = (elements.taskForm.popis?.value || '').trim();
    const customPopisValue = (elements.taskForm.customPopis?.value || '').trim();

    // popisBase = "Ostatne" ak je custom, inak standard
    const popisBase = popisSelectValue === 'Ostatné' ? 'Ostatné' : popisSelectValue;
    const popisValue =
      popisSelectValue === 'Ostatné'
        ? (customPopisValue || 'Ostatné')
        : popisSelectValue;

    if (!popisValue || !createdBy) {
      alert('Vsetky povinne polia musia byt vyplnene.');
      return;
    }

    // telefon - nesmie byt undefined (inak ti to vie "zabit" Ulozit)
    const telefonValue = (elements.taskForm.telefon?.value || '').trim();
    if (!telefonValue) {
      alert('Telefonne cislo je povinne.');
      return;
    }

    const cleanTel = telefonValue.replace(/[^+\d]/g, '');
    const telefonPattern = /^(0[0-9]{9}$)|(\+[0-9]{10,15}$)/;
    if (!telefonPattern.test(cleanTel)) {
      alert('Telefonne cislo musi byt v tvare 0904166876 alebo +421904166876.');
      return;
    }

    const startTime = (elements.taskForm.startTime?.value || '').trim();
    if (!startTime) {
      alert('Zaciatok (cas) je povinny.');
      return;
    }

    // EDIT / NEW
    const editIndexRaw = (elements.editIndexInput?.value || '').trim();
    const editIndex = Number.isFinite(parseInt(editIndexRaw, 10))
      ? parseInt(editIndexRaw, 10)
      : -1;

    const dateStr = (elements.selectedDateInput?.value || '').trim();
    if (!dateStr) {
      alert('Datum ulohy je povinny.');
      return;
    }

    // endTime
    let endTime;
    if (startTime === 'Prenocovanie') {
      endTime = 'Prenocovanie';
    } else {
      const [hours, minutes] = startTime.split(':').map(Number);
      const endDate = new Date();
      endDate.setHours(hours);
      endDate.setMinutes(minutes + 60);
      endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
    }

    // checklist z FORMULARA (name="checklist") - NIE z detailu
    const checklist = Array.from(document.querySelectorAll('input[name="checklist"]:checked'))
      .map(cb => cb.value);
// ✅ pri editacii zachovaj skryte flagy (napr. tlac stitku), ktore NIE SU v checkboxoch
const allVisibleChecklistValues = Array.from(document.querySelectorAll('input[name="checklist"]'))
  .map(cb => cb.value);

if (parseInt(elements.editIndexInput?.value) >= 0 && Array.isArray(window.__editingOriginalChecklist)) {
  window.__editingOriginalChecklist.forEach(item => {
    const isHiddenFlag = !allVisibleChecklistValues.includes(item); // nie je v UI checkboxoch
    const isPrintFlag = /stitok/i.test(item) || item === '__PRINTED_LABEL__'; // poistka ak to mas takto pomenovane

    if ((isHiddenFlag || isPrintFlag) && !checklist.includes(item)) {
      checklist.push(item);
    }
  });
}
    // ===== SPZ / POSK / CENA (bez PHP) – zabalenie do existujucich poli =====

// 1) ZNACKA + SPZ -> ide do task.znacka
const znackaRaw = (elements.taskForm.znacka?.value || '');
const spzVal = normalizeSpz(elements.taskForm.spz?.value || '');
const znackaBase = stripSpzFromZnacka(znackaRaw).toUpperCase().trim();

const znackaValue = spzVal
  ? `${znackaBase} | SPZ:${spzVal}`
  : znackaBase;

// 2) EXTRAINFO + POSK + CENA -> ide do task.extraInfo
const cenaVal = formatEuro(elements.taskForm.cenaInline?.value || '');
const poskVal = (elements.taskForm.poskodenia?.value || '').trim();

// vycisti stare CENA a POSK z extraInfo, aby sa to neduplikovalo pri kazdom ulozeni
let extraClean = stripCenaFromExtraInfo(elements.taskForm.extraInfo?.value || '');
extraClean = extraClean.replace(/^\s*POSK:\s*[^|]+?\s*\|\s*/i, '').trim();

// poskladaj nove extraInfo (POSK a CENA idu dopredu)
let extraInfoPacked = extraClean;
if (cenaVal) extraInfoPacked = `CENA:${cenaVal} | ${extraInfoPacked}`.trim();
if (poskVal) extraInfoPacked = `POSK:${poskVal} | ${extraInfoPacked}`.trim();

// createdAt: pri editacii zachovaj povodny, pri novej vytvor
let createdAt = (editIndex >= 0) ? (window.__editingCreatedAt || null) : null;
if (!createdAt) {
  createdAt = new Date().toLocaleString('sk-SK', { hour12: false });
}

const task = {
  id: editIndex,
  createdBy: createdBy,
  mechanik: (elements.taskForm.mechanik?.value || '').trim(),
  popis: popisValue,
  popisBase: popisBase,
  customPopis: popisSelectValue === 'Ostatné' ? customPopisValue : '',
  znacka: znackaValue,
  poistovna: (elements.taskForm.poistovna?.value || '').trim(),
  start: startTime,
  end: endTime,
  meno: (elements.taskForm.meno?.value || '').trim(),
  telefon: telefonValue,
  cena: elements.taskForm.cena?.value || null,
  extraInfo: extraInfoPacked,        // ✅ sem ide POSK + CENA + tvoje poznamky
  checklist: checklist,
  date: dateStr,
  createdAt: createdAt
};

    saveTasksForDate(dateStr, task).then(() => {
      // reset edit state
      window.__editingCreatedAt = null;

      if (elements.modal) elements.modal.classList.add('hidden');
      if (elements.taskForm) elements.taskForm.reset();

      if (elements.customPopisInput && elements.customPopisLabel) {
        elements.customPopisInput.style.display = 'none';
        elements.customPopisLabel.style.display = 'none';
        elements.customPopisInput.required = false;
      }

      if (elements.datePickerSection) {
        elements.datePickerSection.style.display = 'none';
        elements.selectedDateInput.setAttribute('type', 'hidden');
        elements.selectedDateInput.removeAttribute('required');
      }

      document.querySelectorAll('input[name="checklist"]').forEach(cb => cb.checked = false);

      renderCalendar(currentDate);
      renderTaskList(dateStr);
    });
  });
}



if (elements.vacationForm) {
    elements.vacationForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const employee = elements.vacationForm.employee?.value;
        const absenceType = elements.vacationForm.absenceType?.value;
        const dateFrom = elements.vacationForm.dateFrom?.value;
        const dateTo = elements.vacationForm.dateTo?.value;
        const note = elements.vacationForm.vacationNote?.value;
        const id = parseInt(elements.vacationIndexInput?.value);

        if (!employee || !absenceType || !dateFrom || !dateTo) {
            alert('Všetky povinné polia musia byť vyplnené.');
            return;
        }

        const vacation = {
            id: id >= 0 ? id : undefined,
            employee,
            absenceType,
            dateFrom,
            dateTo,
            note
        };

        saveVacation(vacation, id).then(() => {
            elements.vacationModal.classList.add('hidden');
            elements.vacationForm.reset();
            elements.vacationIndexInput.value = -1;
            if (elements.deleteVacationBtn) {
                elements.deleteVacationBtn.style.display = 'none';
            }
            renderCalendar(currentDate);
        });
    });
}

if (elements.cancelBtn) {
    elements.cancelBtn.addEventListener('click', () => {
        if (elements.modal && elements.taskForm) {
            elements.modal.classList.add('hidden');
            elements.taskForm.reset();
            if (elements.customPopisInput && elements.customPopisLabel) {
                elements.customPopisInput.style.display = 'none';
                elements.customPopisLabel.style.display = 'none';
                elements.customPopisInput.required = false;
            }
            document.querySelectorAll('input[name="checklist"]').forEach(checkbox => checkbox.checked = false);
             // Reset extraInfo counter
            const extraInfoInput = document.getElementById('extraInfo');
            if (extraInfoInput) {
                extraInfoInput.dispatchEvent(new Event('input'));
            }
        }
    });
}
if (elements.openPozicovnaBtn) {
  elements.openPozicovnaBtn.addEventListener('click', () => {
    window.open('pozicovna.html', '_blank');
  });
}

if (elements.openStatistikyBtn) {
  elements.openStatistikyBtn.addEventListener('click', () => {
    window.open('statistiky.html', '_blank');
  });
}

if (elements.closeDetailsBtn) {
    elements.closeDetailsBtn.addEventListener('click', () => {
        if (elements.detailsModal) {
            closeAllModals();
            document.body.classList.remove('modal-open');
        }
    });
}

if (elements.prevMonth) {
    elements.prevMonth.addEventListener('click', () => {
        if (currentView === 'month') {
            currentDate.setMonth(currentDate.getMonth() - 1);
        } else if (currentView === 'week') {
            currentDate.setDate(currentDate.getDate() - 7);
        } else if (currentView === 'day') {
            currentDate.setDate(currentDate.getDate() - 1);
        }
        renderCalendar(currentDate);
    });
}

if (elements.nextMonth) {
    elements.nextMonth.addEventListener('click', () => {
        if (currentView === 'month') {
            currentDate.setMonth(currentDate.getMonth() + 1);
        } else if (currentView === 'week') {
            currentDate.setDate(currentDate.getDate() + 7);
        } else if (currentView === 'day') {
            currentDate.setDate(currentDate.getDate() + 1);
        }
        renderCalendar(currentDate);
    });
}

if (elements.noteForm) {
    elements.noteForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const date = elements.noteDate?.value;
        const noteText = elements.noteText?.value;
        const id = parseInt(elements.noteIndexInput?.value);

        if (!date || !noteText) {
            alert('Všetky povinné polia musia byť vyplnené.');
            return;
        }

        const note = {
            id: id >= 0 ? id : undefined,
            date,
            note: noteText
        };

        saveNote(note, id).then(() => {
            elements.noteModal.classList.add('hidden');
            elements.noteForm.reset();
            elements.noteIndexInput.value = -1;
            if (elements.deleteNoteBtn) {
                elements.deleteNoteBtn.style.display = 'none';
            }
            renderCalendar(currentDate);
        });
    });
}

function formatPhoneNumber(value) {
    const clean = value.replace(/[^+\d]/g, ''); // Remove all non-digit, non-plus characters
    if (clean.length === 0) return '';
    let formatted = '';
    if (clean.startsWith('+')) {
        // For international numbers (e.g., +412456995331)
        formatted = clean[0]; // Keep the '+' sign
        const rest = clean.slice(1);
        formatted += rest.substring(0, Math.min(3, rest.length)); // Country code (e.g., +412)
        let remaining = rest.substring(3);
        while (remaining.length > 0) {
            formatted += ' ' + remaining.substring(0, Math.min(3, remaining.length));
            remaining = remaining.substring(3);
        }
    } else {
        // For local numbers (e.g., 0905672345)
        formatted = clean.substring(0, Math.min(4, clean.length)); // First 4 digits (e.g., 0905)
        let remaining = clean.substring(4);
        while (remaining.length > 0) {
            formatted += ' ' + remaining.substring(0, Math.min(3, remaining.length));
            remaining = remaining.substring(3);
        }
    }
    return formatted.trim();
}
const telInput = document.getElementById('telefon');
if (telInput) {
    telInput.addEventListener('input', function(e) {
        const cursor = this.selectionStart;
        const oldVal = this.value;
        const cleanBeforeCursor = oldVal.slice(0, cursor).replace(/[^+\d]/g, '').length;
        this.value = formatPhoneNumber(this.value);
        let pos = 0;
        let cleanCount = 0;
        for (let char of this.value) {
            pos++;
            if (/[+\d]/.test(char)) {
                cleanCount++;
                if (cleanCount === cleanBeforeCursor) {
                    break;
                }
            }
        }
        if (cleanCount < cleanBeforeCursor) pos = this.value.length;
        this.setSelectionRange(pos, pos);
    });
}
window.editTask = editTask;
window.deleteTask = deleteTask;
window.showTaskDetails = showTaskDetails;
window.editVacation = editVacation;
window.editNote = editNote;
window.deleteNote = deleteNote;

renderCalendar(currentDate);

viewButtons.forEach(btn => btn.classList.remove('active'));
const dayBtn = document.querySelector('#viewControls button[data-view="day"]');
if (dayBtn) dayBtn.classList.add('active');


function closeAllModals() {
  const allModals = [
    elements.modal,
    elements.detailsModal,
    elements.vacationModal,
    elements.exportModal,
    elements.noteModal,
    elements.searchModal
  ];

  allModals.forEach((m) => {
    if (!m) return;

    m.classList.add('hidden');

    // poistka proti zaseknutemu overlayu
    m.style.display = '';
  });

  document.body.classList.remove('modal-open');
}

// ESC zatvori vsetky modaly
document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape' || event.keyCode === 27) {
    closeAllModals();
  }
});

// Klik vedla modalu (overlay) – POVODNA, najbezpecnejsia verzia
const overlayModals = [
  elements.modal,
  elements.detailsModal,
  elements.vacationModal,
  elements.exportModal,
  elements.noteModal,
  elements.searchModal
];

overlayModals.forEach((m) => {
  if (!m) return;

  m.addEventListener('click', function (event) {
    if (event.target === m) {
      event.preventDefault();
      event.stopPropagation();
      closeAllModals();
    }
  });
});



// Always show default phone number when modal opens, allow overwrite
const phoneInput = document.getElementById('telefon');
if (phoneInput) {
    const defaultPhone = "0000 000 000";
    const observer = new MutationObserver(() => {
        if (!elements.modal.classList.contains('hidden') && phoneInput.value.trim() === "") {
            phoneInput.value = defaultPhone;
        }
    });
    observer.observe(elements.modal, { attributes: true, attributeFilter: ['class'] });
    phoneInput.addEventListener('focus', function () {
        if (this.value === defaultPhone) {
            this.setSelectionRange(0, this.value.length);
        }
    });
    phoneInput.addEventListener('blur', function () {
        if (this.value.trim() === "") {
            this.value = defaultPhone;
        }
    });
}

const printProtocolA4Btn = document.getElementById('printProtocolA4');

if (printProtocolA4Btn) {
  printProtocolA4Btn.addEventListener('click', () => {
    if (!currentTaskForPrint) {
      alert('Nie je nacitana ziadna zakazka na tlac. Najprv otvor detail zakazky.');
      return;
    }

    // helper: escape HTML
    const esc = (str) => String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    // helper: ak je to input element, zober value, inak zober string
    const toText = (v) => {
      try {
        if (v && typeof v === 'object' && 'value' in v) return v.value;
      } catch (e) {}
      return v;
    };

    // hodnoty zo zakazky
    const popis = esc(toText(currentTaskForPrint.popis) || '—');
    const znacka = esc(toText(currentTaskForPrint.znacka) || '—');
    const poistovna = esc(toText(currentTaskForPrint.poistovna) || '—');

    // meno/telefon: najprv skus z currentTaskForPrint, ak nie je tak skus z inputov (ak ich mas na stránke)
    const menoRaw =
      toText(currentTaskForPrint.meno) ??
      toText(currentTaskForPrint.zakaznik) ??
      document.getElementById('meno')?.value ??
      document.getElementById('customerName')?.value ??
      '';

    const telefonRaw =
      toText(currentTaskForPrint.telefon) ??
      document.getElementById('telefon')?.value ??
      document.getElementById('phone')?.value ??
      '';

    const meno = esc(menoRaw || '—');
    const telefon = esc(telefonRaw || '—');

    // datum+cas tlace (na minuty)
    const now = new Date();
    const datum = now.toLocaleDateString('sk-SK');
    const cas = now.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
    const dateTime = `${datum} ${cas}`;
    const prevzateDateTime = dateTime;

    // A4 HTML (text bez specialnych znakov v nadpisoch, aby tlacila aj zla tlaciaren)
    const html = `<!DOCTYPE html>
<html lang="sk">
<head>
<meta charset="UTF-8">
<title>Preberaci protokol</title>

<style>
@page { size: A4; margin: 18mm; }

body { font-family: Arial, sans-serif; font-size: 12.5px; color: #000; }

.print-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  border-bottom: 3px solid #1f4fd8; padding-bottom: 8px; margin-bottom: 16px;
}
.print-header-left img { height: 38px; }
.print-header-right { text-align: right; font-size: 10.5px; line-height: 1.3; }

h1 { text-align: center; margin: 12px 0 20px; letter-spacing: 2px; color: #1f4fd8; }

.section { border: 1px solid #ddd; padding: 10px; margin-bottom: 12px; border-radius: 6px; }
.section-title { font-weight: bold; color: #1f4fd8; margin-bottom: 6px; font-size: 11px; text-transform: uppercase; }

/* PREBERAK - zarovnanie do 2 stlpcov */
.section .row{
  display: grid !important;
  grid-template-columns: 155px 1fr !important;
  column-gap: 10px;
  margin-bottom: 6px;
  align-items: start;
}

.section .row .label{
  font-weight: 700;
  width: auto !important;     /* dolezite - vypne staru width */
}

.section .row > div:last-child{
  min-width: 0;               /* aby sa text spravne zalamoval vpravo */
  word-break: break-word;
}


.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

.signatures { display: flex; justify-content: space-between; margin-top: 28px; }
.signature { width: 45%; border-top: 1px solid #000; text-align: center; padding-top: 6px; font-size: 11px; }

.datetime { text-align: center; font-size: 10px; margin-top: 12px; color: #444; }

.value-line { border-bottom: 1px solid #000; padding: 0 0 1px; min-width: 220px; display: inline-block; }
</style>
</head>

<body>
<div class="print-header">
  <div class="print-header-left">
    <img src="autoglas_logo_kS-1.jpg" alt="AUTOGLAS">
  </div>
  <div class="print-header-right">
    <strong>AUTOGLAS, s.r.o.</strong><br>
    Zavarska 10/B, 917 01 Trnava<br>
    ICO: 36248703 | DIC: 2021650477<br>
    IC DPH: SK2021650477<br>
    Tel: 0904 979 499<br>
    Email: autoglas@autoglas.sk
  </div>
</div>

<h1>PREBERACI PROTOKOL</h1>

<div class="grid">
  <div class="section">
    <div class="section-title">Vozidlo</div>
    <div class="row"><div class="label">Znacka / model:</div>${znacka}</div>
    <!-- SPZ riadok vyhodeny -->
    <div class="row">
  <div class="label">Stav km:</div>
  <div></div>
</div>

  </div>

  <div class="section">
    <div class="section-title">Zakaznik</div>
    <div class="row"><div class="label">Meno:</div>${meno}</div>
    <div class="row"><div class="label">Telefon:</div>${telefon}</div>
  </div

<div class="section">
  <div class="section-title">Zakazka</div>

  <table class="kv">
    <tr>
      <td class="k">Typ prace:</td>
      <td class="v">${popis}</td>
    </tr>
    <tr>
      <td class="k">Poistovna:</td>
      <td class="v">${poistovna}</td>
    </tr>
  </table>
</div>



<div class="section">
  <div class="section-title">Ine poznamky o vozidle</div>
  <div style="height:40px;"></div>
</div>

<div class="section">
  <div class="section-title">Osobne veci vo vozidle</div>
  <p style="font-size:11px;">
    Zakaznik je povinny z vozidla odstranit vsetky osobne veci.
    Servis nezodpoveda za ich stratu alebo poskodenie.
  </p>
  <div style="height:20px;"></div>
</div>

<div class="section">
  <div class="section-title">Prevzatie a odovzdanie</div>
  <div class="row">
  <div class="label">Vozidlo prevzate dna:</div>
  <div>${prevzateDateTime}</div>
</div>
<div class="row">
  <div class="label">Predpokladany termin odovzdania:</div>
  <div></div>
</div>


<div class="section" style="font-size:11px; line-height:1.6;">
<div class="section legal">
    <div class="section-title">Právne vyhlásenie – Odovzdanie vozidla do servisu</div>

    <p>
        Zákazník týmto odovzdáva vozidlo do servisu za účelom
        <strong>${currentTaskForPrint.popis || "servisného úkonu"}</strong>
        (ďalej len „servisný úkon“).
        Servis sa zaväzuje, že po vykonaní servisného úkonu bude vozidlo
        odovzdané späť v stave zodpovedajúcom stavu, v akom bolo vozidlo
        prebraté pri jeho odovzdaní do servisu, s prihliadnutím na vykonané
        servisné úkony.
    </p>

    <p>
        Zákazník vyhlasuje, že všetky známe vady, poruchy a nedostatky vozidla
        oznámil servisu pred jeho odovzdaním. Akékoľvek zamlčanie alebo
        neoznámenie existujúcich chýb, porúch alebo poškodení vozidla sa bude
        považovať za súčasť pôvodného stavu vozidla v čase jeho prevzatia
        servisom.
    </p>

    <p>
        Servis sa zaväzuje zákazníka bezodkladne informovať o všetkých zistených
        skrytých, predtým neidentifikovaných alebo neviditeľných závadách,
        ktoré budú zistené počas vykonávania servisného úkonu, a to pred
        vykonaním akýchkoľvek ďalších úkonov presahujúcich pôvodne dohodnutý
        rozsah.
    </p>
</div>

<div class="signatures">
  <div class="signature">Podpis prijimacieho technika</div>
  <div class="signature">Podpis zakaznika</div>
</div>

<div class="datetime">
  Dokument vytvoreny: ${dateTime}
</div>
</body>
</html>`;


const w = window.open('', '_blank', 'width=1000,height=1000');
if (!w) {
  alert('Prehliadac zablokoval okno pre tlac. Povol pop-up okna a skus znovu.');
  return;
}

w.document.open();
w.document.write(html);
w.document.close();

// Safari/iOS: tlac az po nacitani
w.onload = () => {
  try { w.focus(); } catch (e) {}
  try { w.print(); } catch (e) {}
};

// fallback keby onload neprebehlo spolahlivo
setTimeout(() => {
  try { w.focus(); } catch (e) {}
  try { w.print(); } catch (e) {}
}, 400);


// ✅ Ak nie je currentTaskForPrint, skusime si ju dotiahnut z detailu cez API
if (!currentTaskForPrint) {

  const dateStr = printLabelBtn.dataset.date;
  const taskId = parseInt(printLabelBtn.dataset.taskId, 10);

  if (dateStr && Number.isFinite(taskId)) {

    fetch(`api/tasks.php?date=${dateStr}`)
      .then(res => res.json())
      .then(tasks => {
        const found = Array.isArray(tasks)
          ? tasks.find(t => parseInt(t.id, 10) === taskId)
          : null;

        if (found) {
          currentTaskForPrint = {
            popis: found.popis,
            znacka: found.znacka,
            poistovna: found.poistovna,
            meno: found.meno,
            extraInfo: found.extraInfo,
            telefon: found.telefon,
            checklist: found.checklist || []
          };
        }
      })
      .catch(e => {
        console.error('Chyba pri dotiahnuti zakazky na tlac:', e);
      });

  }
}

        if (!currentTaskForPrint) {
            alert('Nie je vybrata zakazka na tlac.');
            return;
        }
const printProtocolBtn = document.getElementById('printProtocolA4');

if (printProtocolBtn) {
  printProtocolBtn.addEventListener('click', () => {
    // musime mat nacitanu zakazku (rovnako ako pri printLabel)
    if (!currentTaskForPrint) {
      alert('Nie je nacitana ziadna zakazka na tlac.');
      return;
    }
// ✅ POISTKA: po tlaci oznac "Stitok vytlaceny" a uloz do DB
(async () => {
  try {
    const taskId = currentTaskForPrint?.id;
    const rawTask = currentTaskForPrint?.rawTask;
    if (!taskId || !rawTask) return;

    const checklist = Array.isArray(rawTask.checklist) ? [...rawTask.checklist] : [];
    if (!checklist.includes('Stitok vytlaceny')) checklist.push('Stitok vytlaceny');

    // uloz rovnako ako ukladanie checklistu v detaile
    await fetch(`http://192.168.1.10/Kalendár/api/tasks.php`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...rawTask, id: taskId, checklist })
    });

    // refresh UI aby to bolo hned vidiet a nezmizlo po auto-refresh
    renderTaskList(currentTaskForPrint.date);
    renderCalendar(currentDate);
  } catch (e) {
    console.error('Chyba pri ukladani priznaku tlace:', e);
  }
})();

    // bezpecne hodnoty
    const popis = currentTaskForPrint.popis || '—';
    const znacka = currentTaskForPrint.znacka || '—';
    const poistovna = currentTaskForPrint.poistovna || '—';
    const meno = currentTaskForPrint.meno || '—';

    const telRaw = currentTaskForPrint.telefon || '';
    const telClean = telRaw.replace(/\s/g, '');
    const hasValidPhone = telClean && telClean !== '0000000000';

    const info = currentTaskForPrint.extraInfo ? currentTaskForPrint.extraInfo : '';
    const mechanik = (currentTaskForPrint.mechanik || '—'); // ak ho mas ulozeny do currentTaskForPrint
    const checklistArr = Array.isArray(currentTaskForPrint.checklist) ? currentTaskForPrint.checklist : [];
    const checklistText = checklistArr.length ? checklistArr.join(', ') : '—';

    const today = new Date();
    const datum = today.toLocaleDateString('sk-SK');
    const cas = today.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });

    // HTML A4 (bez diakritiky)
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Preberaci protokol</title>
  <style>
    @page { size: A4; margin: 12mm; }
    body { font-family: Arial, sans-serif; color: #000; font-size: 12px; }
    .title { text-align:center; font-size: 18px; font-weight: 800; margin-bottom: 10px; }
    .meta { display:flex; justify-content: space-between; margin-bottom: 10px; }
    .box { border: 1px solid #000; padding: 10px; border-radius: 6px; margin-bottom: 10px; }
    .row { display:flex; gap: 10px; margin: 4px 0; }
    .label { width: 160px; font-weight: 700; }
    .value { flex: 1; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    td, th { border: 1px solid #000; padding: 8px; vertical-align: top; }
    .sig { display:flex; gap: 20px; margin-top: 18px; }
    .sig .sbox { flex:1; border: 1px solid #000; height: 80px; border-radius: 6px; padding: 8px; }
    .small { font-size: 11px; }
    .muted { opacity: 0.9; }
  </style>
</head>
<body>

  <div class="title">PREBERACI PROTOKOL</div>

  <div class="meta small">
    <div><strong>Datum:</strong> ${datum}</div>
    <div><strong>Cas:</strong> ${cas}</div>
  </div>

  <div class="box">
    <div class="row"><div class="label">Praca:</div><div class="value">${escapeHtml(popis)}</div></div>
    <div class="row"><div class="label">Vozidlo:</div><div class="value">${escapeHtml(znacka)}</div></div>
    <div class="row"><div class="label">Poistovna:</div><div class="value">${escapeHtml(poistovna)}</div></div>
    <div class="row"><div class="label">Zakaznik:</div><div class="value">${escapeHtml(meno)}</div></div>
    ${hasValidPhone ? `<div class="row"><div class="label">Telefon:</div><div class="value">${escapeHtml(telRaw)}</div></div>` : ''}
    <div class="row"><div class="label">Mechanik:</div><div class="value">${escapeHtml(mechanik)}</div></div>
    <div class="row"><div class="label">Checklist:</div><div class="value">${escapeHtml(checklistText)}</div></div>
  </div>

  <div class="box">
    <div style="font-weight:800; margin-bottom:6px;">Poznamka / Dalsie info</div>
    <div class="muted">${info ? escapeHtml(info) : '—'}</div>
  </div>

  <div class="box">
    <div style="font-weight:800; margin-bottom:6px;">Stav vozidla (vyplna sa rucne)</div>
    <table>
      <tr>
        <th style="width:50%;">Poskodenia / Poznamky</th>
        <th>Prislusenstvo / Ine</th>
      </tr>
      <tr>
        <td style="height:120px;"></td>
        <td style="height:120px;"></td>
      </tr>
    </table>
    <div class="small" style="margin-top:8px;">
      Potvrdzujem prevzatie vozidla a suhlasim s rozsahom prace.
    </div>
  </div>

  <div class="sig">
    <div class="sbox">
      <div style="font-weight:800;">Podpis zakaznika</div>
      <div class="small muted" style="margin-top:50px;">______________________________</div>
    </div>
    <div class="sbox">
      <div style="font-weight:800;">Podpis prevzal (servis)</div>
      <div class="small muted" style="margin-top:50px;">______________________________</div>
    </div>
  </div>

</body>
</html>`;

    const w = window.open('', '_blank', 'width=1000,height=1000');
    w.document.write(html);
    w.document.close();
  });
}

// helper: bezpecny HTML
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ✅ PRIAMA TLAC (bez popup) + bez duplikovania
const hasValidPhone = !!(currentTaskForPrint.telefon || '').trim();


// odstran " | OKO: .... " alebo " | POSK: .... " (odstrani az po dalsi |)
znackaForPrint = znackaForPrint.replace(/(?:\s*\|\s*)?(OKO|POSK)\s*:\s*[^|]+/gi, '');

// docisti prebytocne oddelovace
znackaForPrint = znackaForPrint
  .replace(/\s*\|\s*\|/g, ' | ')
  .replace(/\s*\|\s*$/g, '')
  .trim();

// ===== OKO vytiahni zo znacky (POSK/OKO) =====
let okoValue = '';
const okoMatch = String(currentTaskForPrint.znacka || '').match(/(OKO|POSK)\s*:\s*([0-9]+)\s*[xX]?/);
if (okoMatch) okoValue = String(okoMatch[2] || '').trim(); // iba cislo

// ===== SPZ: preferuj pole spz, fallback zo znacky =====
let spzToPrint = String(currentTaskForPrint.spz || '').trim();
spzToPrint = spzToPrint.replace(/(ŠPZ|SPZ)\s*:\s*/gi, '').trim();

if (!spzToPrint) {
  const m = String(currentTaskForPrint.znacka || '').match(/(ŠPZ|SPZ)\s*:\s*([^|]+)/i);
  if (m) spzToPrint = String(m[2] || '').trim();
}
spzToPrint = spzToPrint.toUpperCase();

// ===== znacka auta (ODSTRAN SPZ/OKO segmenty uplne) =====
let znackaForPrint = String(currentTaskForPrint.znacka || '—');

// zober iba cast PRED prvym "|" (toto je najistejsie, lebo vsetko za | su tvoje tagy SPZ/OKO)
znackaForPrint = znackaForPrint.split('|')[0].trim();

// skrat znacku len raz (SPZ nikdy neskrtame)
znackaForPrint = znackaForPrint.length > 18 ? (znackaForPrint.substring(0, 18) + '…') : znackaForPrint;

// ===== VOZIDLO: nikdy nesmie obsahovat "SPZ:" ani "ŠPZ:" =====
const znUpper = String(znackaForPrint || '').toUpperCase();
const spzUpper = String(spzToPrint || '').toUpperCase();

// ak uz znacka obsahuje SPZ, nepridavaj ju znova
const vehicleWithSpz =
  (spzUpper && znUpper.includes(spzUpper))
    ? znackaForPrint
    : `${znackaForPrint}${spzToPrint ? ` ${spzToPrint}` : ''}`;

// ===== POSK: vytiahni z extraInfoSafe (aj ked je nalepene na |) =====
const extraRaw = String(extraInfoSafe || '');

// najde POSK:1 / POSK: 2 / posk:10 aj ked za tym ide | alebo koniec
const poskMatch = extraRaw.match(/POSK\s*:\s*(\d+)/i);
const poskValue = poskMatch ? poskMatch[1] : null;

// vyhod POSK z Info + vycisti prebytky typu "||" alebo "| |"
let extraClean = extraRaw
  .replace(/POSK\s*:\s*\d+/ig, '')     // odstrani POSK
  .replace(/[|]{2,}/g, '|')           // "|||" -> "|"
  .replace(/\|\s*\|/g, '|')           // "| |" -> "|"
  .replace(/^\s*\|\s*/g, '')          // "|" na zaciatku prec
  .replace(/\s*\|\s*$/g, '')          // "|" na konci prec
  .replace(/\s{2,}/g, ' ')
  .trim();

// ===== PRACA LINE (hore) =====
const pracaLine = `${currentTaskForPrint.popis || '—'}${poskValue ? ` | POSK:${poskValue}` : ''}`;

/*// ===== 7) HTML stitok =====
const checklist = currentTaskForPrint.checklist || [];
const hasPrenocovanie = Array.isArray(checklist) && checklist.includes('Prenocovanie');
console.log('--- PRINT DEBUG ---');
console.log('extraInfoSafe =', extraInfoSafe);
console.log('poskValue =', poskValue);
console.log('pracaLine =', pracaLine);
console.log('extraClean =', extraClean);

const labelContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Stitok zakazky</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
@page { size: 48mm 27mm; margin: 0; }
body {
  width: 48mm;
  height: 27mm;
  padding: 2mm;
  font-family: Arial, sans-serif;
  font-size: 7pt;
  line-height: 1.2;
}
.row { margin-bottom: 1.5mm; word-wrap: break-word; }
.label { font-weight: bold; }
.prenocovanie {
  font-weight: bold;
  text-transform: uppercase;
  text-align: center;
  margin-top: 1mm;
  font-size: 6pt;
}
</style>
</head>
<body>
<div class="row"><span class="label">Práca:</span> ${pracaLine}</div>
<div class="row"><span class="label">Vozidlo:</span> ${vehicleWithSpz}</div>
<div class="row"><span class="label">Poistovna:</span> ${currentTaskForPrint.poistovna || '—'}</div>
<div class="row"><span class="label">Zakaznik:</span> ${currentTaskForPrint.meno || '—'}</div>
${hasValidPhone ? `<div class="row"><span class="label">Telefon:</span> ${currentTaskForPrint.telefon}</div>` : ''}
${extraClean ? `<div class="row"><span class="label">Info:</span> ${extraClean.substring(0, 30)}${extraClean.length > 30 ? '...' : ''}</div>` : ''}
${hasPrenocovanie ? `<div class="row prenocovanie">PRENOCOVANIE</div>` : ''}
</body>
</html>
`;

// ✅ iOS: okno sme uz otvorili hned po kliku (iosWin). Tu nic nerob.
if (isIOS() && iosWin) {
  // ✅ najprv zobraz navod (este sme na povodnej stranke)
  showIOSPrintHint();

  // maly delay, aby Safari stihol prekreslit UI
  setTimeout(() => {
    iosWin.document.open();
    iosWin.document.write(labelContent);
    iosWin.document.close();
  }, 50);

  return;
}




// ✅ PC: povodne tlacenie
const printWin = window.open('', '_blank');
printWin.document.write(labelContent);
printWin.document.close();

printWin.onload = () => {
  setTimeout(() => {
    printWin.focus();
    printWin.onafterprint = () => {
      try { printWin.close(); } catch (e) {}
    };
    printWin.print();
    setTimeout(() => {
      try { printWin.close(); } catch (e) {}
    }, 800);
  }, 100);
};
*/
    });
}



// Auto-refresh calendar every 60 seconds during weekdays, 7:00–18:00
setInterval(() => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    const isWeekday = day >= 1 && day <= 5;
    const isWorkingHours = hour >= 6 && hour < 18;
    if (isWeekday && isWorkingHours) {
        console.log('Auto-refresh: currentDate pred renderom', currentDate.toLocaleString('sk-SK', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' }));
        renderCalendar(currentDate);
    }
}, 60000);


// === ZOZNAM ZATVORENÝCH DNÍ ===
const CLOSED_DATES = [
    { date: '2025-11-17', text: 'ZATVORENÉ', time: '8:00 – 16:30' },
    { date: '2025-12-24', text: 'ŠTEDRÝ DEŇ' },
    { date: '2026-01-01', text: 'NOVÝ ROK', },
    { date: '2025-12-25', text: 'ZATVORENÉ', },
    { date: '2025-12-26', text: 'ZATVORENÉ', },
    { date: '2025-12-29', text: 'ZATVORENÉ', },
    { date: '2025-12-30', text: 'ZATVORENÉ', },
    { date: '2025-12-31', text: 'ZATVORENÉ', },
    { date: '2026-1-1', text: 'NOVÝ ROK', },

];

// === FUNKCIA NA VYZNAČENIE VIAC DÁTUMOV ===
function highlightClosedDays() {

    CLOSED_DATES.forEach(entry => {
        const day = document.querySelector(`.day[data-date="${entry.date}"]`);
        if (!day || day.dataset.highlighted) return;

        // Štýl
        day.style.backgroundColor = '#ffebee';
        day.style.border = '3px solid #d32f2f';
        day.style.borderRadius = '12px';
        day.style.position = 'relative';
        day.style.display = 'flex';
        day.style.flexDirection = 'column';
        day.style.justifyContent = 'center';
        day.style.alignItems = 'center';
        day.style.minHeight = '80px';
        day.dataset.highlighted = 'true';

        // Skry číslo dňa
        const header = day.querySelector('.date');
        if (header) header.style.display = 'none';

        // Hlavný text
        const label = document.createElement('div');
        label.textContent = entry.text;
        label.style.cssText = `
            font-size: 2.5em !important;
            font-weight: bold !important;
            color: #d32f2f !important;
            text-align: center;
            letter-spacing: 1px;
            text-shadow: 0 1px 3px rgba(0,0,0,0.2);
            user-select: none;
            pointer-events: none;
            margin: 0;
            padding: 0;
            line-height: 1.2;
            position: absolute;
            top: 45%;
            left: 50%;
            transform: translate(-50%, -50%);
        `;
        day.appendChild(label);

        // Druhý riadok (čas / doplnok)
        if (entry.time) {
            const timeLabel = document.createElement('div');
            timeLabel.textContent = entry.time;
            timeLabel.style.cssText = `
                font-size: 1.2em;
                font-weight: bold;
                color: #b71c1c;
                text-align: center;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                pointer-events: none;
            `;
            day.appendChild(timeLabel);
        }
    });
}
// === FINÁLNA VERZIA – rýchle a spoľahlivé vyhľadávanie ===
async function performSearch(query) {
    query = query.trim().toLowerCase();
    if (!query) {
        alert('Zadaj hľadaný výraz.');
        return;
    }

    elements.searchResults.innerHTML = '<p style="color: #007bff; font-weight: bold;">Načítavam zákazky... (posledných 180 dní + 90 dopredu)</p>';
    elements.searchModal.classList.remove('hidden');

    const tasks = [];
    const today = new Date();
    
    // Rozsah: 180 dní dozadu + 90 dní dopredu (môžeš upraviť)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 180);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 90);

    let current = new Date(startDate);
    let processed = 0;
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    while (current <= endDate) {
        const dateStr = current.toISOString().split('T')[0];
        processed++;

        // Každých 30 dní aktualizujeme info (aby si videl, že to beží)
        if (processed % 30 === 0 || processed === totalDays) {
            elements.searchResults.innerHTML = `<p style="color: #007bff; font-weight: bold;">
                Načítavam... (${processed}/${totalDays} dní)
            </p>`;
        }

        try {
            const response = await fetch(`http://192.168.1.10/Kalendár/api/tasks.php?date=${dateStr}`);
            if (response.ok) {
                const dayTasks = await response.json();
                if (Array.isArray(dayTasks) && dayTasks.length > 0) {
                    tasks.push(...dayTasks.map(task => ({ ...task, date: dateStr })));
                }
            }
        } catch (err) {
            // Ignorujeme chyby na jednotlivých dňoch – pokračujeme
            console.warn(`Chyba pre ${dateStr}:`, err);
        }

        current.setDate(current.getDate() + 1);
    }

    // Filtrovanie podľa query
    const filteredTasks = tasks.filter(task => {
        const fields = [
            task.popis, task.znacka, task.poistovna, task.telefon,
            task.meno, task.start, task.createdBy, task.mechanik, task.extraInfo
        ].join(' ').toLowerCase();

        return fields.includes(query);
    });

    // Zobrazenie výsledkov
    elements.searchResults.innerHTML = '';

    if (filteredTasks.length === 0) {
        elements.searchResults.innerHTML = `<p>Žiadne výsledky pre: <strong>"${query}"</strong></p>
            <p style="color: #666; font-size: 0.9em;">(Skús iné slovo alebo skontroluj rozsah dátumov)</p>`;
    } else {
        elements.searchResults.innerHTML = `<p style="color: green; margin-bottom: 15px;">
            Nájdených <strong>${filteredTasks.length}</strong> zákaziek (z celkovo ${tasks.length} načítaných)
        </p>`;

    filteredTasks.forEach(task => {
    const div = document.createElement('div');
    div.style.marginBottom = '12px';
    div.style.padding = '12px';
    div.style.borderRadius = '15px';
    div.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.2)';
    div.style.cursor = 'pointer';

    // === TVORBA SPRÁVNEJ TRIEDY PRE FARBU ===
    let badgeClass = 'Ostatne';

    if (task.popis) {
        const map = {
            "Výmena skla": "Vymena_skla",
            "Oprava skla": "Oprava_skla",
            "Prelepenie skla": "Prelepenie_skla",
            "Ťažné zariadenie": "Tazne_zariadenie",
            "Žiarovky": "Ziarovky",
            "Klimatizácia": "Klimatizacia",
            "Ostatné": "Ostatne"
        };

        // Priame mapovanie – najspoľahlivejšie riešenie
        badgeClass = map[task.popis.trim()] || 'Ostatne';
    }

    // Použijeme rovnakú triedu ako v kalendári
    div.className = `task-badge ${badgeClass}`;

    const formattedDate = new Date(task.date).toLocaleDateString('sk-SK', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
                <strong>${formattedDate}</strong><br>
                <strong>${task.popis || '–'}</strong> – ${task.znacka || '–'} (${task.poistovna || '–'}) – ${task.start || ''}<br>
                ${task.meno ? task.meno + '<br>' : ''}
                Tel: ${task.telefon || '–'}
                ${task.extraInfo ? '<br><em>' + task.extraInfo + '</em>' : ''}
            </div>
            <button class="view-details-btn" data-id="${task.id}" data-date="${task.date}"
                style="background: #ffc107; color: black; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                Detaily →
            </button>
        </div>
    `;

    // === KLIK NA DETAIL – fungujúci a spoľahlivý ===
    div.querySelector('.view-details-btn').addEventListener('click', (e) => {
        e.stopPropagation(); // zabráni dvojitému spusteniu

        const id = e.target.dataset.id;
        const date = e.target.dataset.date;

        // 1. Zmeníme dátum v kalendári
        currentDate = new Date(date);
        renderCalendar(currentDate);

     // 2. Počkáme chvíľu, kým sa načítajú tasks pre nový deň a potom otvoríme detail
setTimeout(() => {
    fetch(`http://192.168.1.10/Kalendár/api/tasks.php?date=${date}`)
        .then(res => res.json())
        .then(dayTasks => {
            const found = dayTasks.find(t => String(t.id) === String(id));
            if (found) {
                showTaskDetails(found, date, found.id);
            } else {
                alert("Úloha sa nenašla pre zvolený dátum.");
            }
        });
}, 300);
const pbtn = document.getElementById('printLabel');
if (pbtn) {
  pbtn.dataset.date = dateStr;
  pbtn.dataset.taskId = id;
}


        // 3. Zatvoríme vyhľadávací modal
        elements.searchModal.classList.add('hidden');
    });

    elements.searchResults.appendChild(div);
});
    }

    // Teraz bude badgeClass presne: Vymena_skla, Oprava_skla, Tazne_zariadenie, Ziarovky, atď
    div.className = `task-badge ${badgeClass}`;
    div.style.marginBottom = '12px';
    div.style.padding = '12px';
    div.style.cursor = 'pointer';

    const formattedDate = new Date(task.date).toLocaleDateString('sk-SK', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
                <strong>${formattedDate}</strong><br>
                <strong>${task.popis || '–'}</strong> – ${task.znacka || '–'} (${task.poistovna || '–'}) – ${task.start || ''}<br>
                ${task.meno ? task.meno + '<br>' : ''}
                Tel: ${task.telefon || '–'}
                ${task.extraInfo ? '<br><em>' + task.extraInfo + '</em>' : ''}
            </div>
            <button class="view-details-btn" data-id="${task.id}" data-date="${task.date}"
                style="background: #ffc107; color: black; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">
                Detaily →
            </button>
        </div>
    `;

    // Pridáme klik na detaily (zatiaľ len test – neskôr vyriešime funkčnosť)S
    div.querySelector('.view-details-btn').addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        const date = e.target.dataset.date;
        alert(`Klikol si na detaily zákazky ID: ${id} z dátumu ${date}\n\nZatiaľ len test – čoskoro to otvorí skutočný detail!`);
        // Tu neskôr pridáme plnú funkčnosť
    });

    elements.searchResults.appendChild(div);
}

            // Klik na detaily
          div.querySelector('.view-details-btn').addEventListener('click', async (e) => {
    div.querySelector('.view-details-btn').addEventListener('click', async (e) => {
    const id = e.target.dataset.id;
    const date = e.target.dataset.date;

    // Nastavíme dátum a render kalendára
    currentDate = new Date(date);
    renderCalendar(currentDate);

    // Načítaj tasks pre tento deň explicitne
    const dateStr = date;  // YYYY-MM-DD
    try {
        const response = await fetch(`http://192.168.1.10/Kalendár/api/tasks.php?date=${dateStr}`);
        if (response.ok) {
            const dayTasks = await response.json();

            // Teraz nájdeme task podľa id v dayTasks
            const selectedTask = dayTasks.find(task => task.id == id);

            if (selectedTask) {
                // Otvoríme detail s týmto taskom
                // Predpokladám, že showTaskDetails(id) hľadá v globálnej, takže nastavíme
                // Ak showTaskDetails berie priamo task, uprav
                showTaskDetails(id);  // ak funguje s id, a tasks sú globálne, nastav tasks = dayTasks;
                // Alebo priamo naplň detailsContent
                // Ak máš elements.detailsContent, naplň ho ručne
                elements.detailsContent.innerHTML = `
                    <p><strong>Dátum:</strong> ${selectedTask.date}</p>
                    <p><strong>Vytvoril:</strong> ${selectedTask.createdBy}</p>
                    <p><strong>Popis práce:</strong> ${selectedTask.popis}</p>
                    <p><strong>Značka auta:</strong> ${selectedTask.znacka}</p>
                    <p><strong>Poisťovňa:</strong> ${selectedTask.poistovna}</p>
                    <p><strong>Začiatok:</strong> ${selectedTask.start}</p>
                    <p><strong>Meno zákazníka:</strong> ${selectedTask.meno}</p>
                    <p><strong>Telefón:</strong> ${selectedTask.telefon}</p>
                    <p><strong>Mechanik:</strong> ${selectedTask.mechanik}</p>
                    <p><strong>Extra info:</strong> ${selectedTask.extraInfo}</p>
                    <p><strong>Check list:</strong> ${selectedTask.checklist.join(', ')}</p>
                `;

                elements.detailsModal.classList.remove('hidden');
            } else {
                alert('Zákazka nebola nájdená.');
            }
        } else {
            alert('Chyba pri načítaní dát.');
        }
    } catch (err) {
        console.error(err);
        alert('Chyba pri načítaní detailu.');
    }

    // Zatvor modal vyhľadávania
    elements.searchModal.classList.add('hidden');
});
    
    // Nastavíme dátum
    currentDate = new Date(date);
    
    // Vyrenderujeme kalendár (aby sa zmenil mesiac/rok)
    renderCalendar(currentDate);
    
    // Počkáme, kým sa načítajú tasks pre tento deň
    // Predpokladám, že v renderCalendar alebo inde máš fetch tasks a ukladáš ich do globálnej premennej, napr. `tasks` alebo `dayTasks`
    // Ak nie, pridáme explicitný fetch
    
    // Bezpečný spôsob: načítaj tasks priamo tu
    try {
        const response = await fetch(`http://192.168.1.10/Kalendár/api/tasks.php?date=${date}`);
        if (response.ok) {
            const dayTasks = await response.json();
            // Tu predpokladám, že showTaskDetails používa nejakú globálnu premennú, napr. `tasks`
            // Ak áno, nastav ju:
            tasks = dayTasks; // ← uprav podľa toho, ako sa volá tvoja premenná (tasks, dayTasks, currentDayTasks...)
            
            // Teraz môžeme bezpečne otvoriť detail
            showTaskDetails(id);
        }
    } catch (err) {
        console.error('Chyba pri načítaní tasks pre detail:', err);
        alert('Nepodarilo sa načítať detail zákazky.');
    }
    
    // Zatvoríme vyhľadávací modal
    elements.searchModal.classList.add('hidden');
});

            elements.searchResults.appendChild(div);
    

// Zatvorenie search modálu klikom na X
if (elements.closeSearchModal) {
    elements.closeSearchModal.addEventListener('click', () => {
        elements.searchModal.classList.add('hidden');
        elements.searchResults.innerHTML = ''; // vymaže výsledky
        elements.searchInput.value = '';      // vymaže input
    });
}

// Zatvorenie klikom mimo okna
elements.searchModal.addEventListener('click', (e) => {
    if (e.target === elements.searchModal) {
        elements.searchModal.classList.add('hidden');
        elements.searchResults.innerHTML = '';
        elements.searchInput.value = '';
    }
// Normalizujeme popis na CSS triedu: bez diakritiky, first word capitalize, medzery na _,
let badgeClass = 'Ostatne';
if (task.popis) {
    badgeClass = task.popis
        .normalize("NFD")  // odstráni diakritiku
        .replace(/[\u0300-\u036f]/g, "") // odstráni diakritické značky
        .trim()
        .split(' ')
        .map((word, index) => index === 0 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase())
        .join('_');
}

div.className = `task-badge ${badgeClass}`;
});
setInterval(createSnowflake, 120);
// Správna normalizácia popisu na CSS triedu podľa tvojho style.css
let badgeClass = 'Ostatne'; // default

if (task.popis) {
    badgeClass = task.popis
        .normalize('NFD')                   // odstráni diakritiku (á → a, é → e, atď.)
        .replace(/[\u0300-\u036f]/g, '')    // odstráni zvyšné diakritické značky
        .replace(/ľ/g, 'l')
        .replace(/š/g, 's')
        .replace(/č/g, 'c')
        .replace(/ť/g, 't')
        .replace(/ž/g, 'z')
        .replace(/ý/g, 'y')
        .replace(/ä/g, 'a')
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // každé slovo s veľkým začiatočným písmenom
        .join('_');
}

// Teraz bude badgeClass napr. "Vymena_skla", "Oprava_skla", "Tazne_zariadenie" atď.
div.className = `task-badge ${badgeClass}`;
// === KLIK NA DETAIL – fungujúci a spoľahlivý ===
div.querySelector('.view-details-btn').addEventListener('click', (e) => {
    e.stopPropagation();

    const id = e.target.dataset.id;
    const date = e.target.dataset.date;

    // 1. Presunieme kalendár na daný deň
    currentDate = new Date(date);
    renderCalendar(currentDate);

    // 2. Počkáme kým sa tasky načítajú a otvoríme detail
    setTimeout(() => {
        openDetails(parseInt(id)); // 🔧 OPRAVENÉ
    }, 800);

    // 3. Zatvoríme modal vyhľadávania
    elements.searchModal.classList.add('hidden');
});
// === ZAVRETIE VYHLADAVACIEHO OKNA ===
if (elements.closeSearchModal) {
    elements.closeSearchModal.addEventListener('click', () => {
        elements.searchModal.classList.add('hidden');
        elements.searchResults.innerHTML = '';
        elements.searchInput.value = '';
    });
}
document.addEventListener("DOMContentLoaded", () => {
    const znacka = document.getElementById("znacka");
    if (znacka) {
        znacka.addEventListener("input", () => {
            znacka.value = znacka.value.toUpperCase();
        });
    }
});
window.printProtocolA4 = function () {
  alert("KLIK OK"); // len test

  if (!window.currentTaskForPrint) {
    alert("Nie je nacitana ziadna zakazka. Najprv otvor detail zakazky.");
    return;
  }

  // ked bude klik OK, tu potom vlozime celu A4 tlac
};
function togglePoskodeniaFieldByValue(val) {
  const label = document.getElementById('poskodeniaLabel');
  const sel = document.getElementById('poskodenia');
  if (!label || !sel) return;

  const show = (val === 'Oprava skla');
  label.style.display = show ? 'block' : 'none';
  sel.style.display = show ? 'block' : 'none';
  if (!show) sel.value = '';
}

// reaguje na realnu zmenu v selecte #popis (vzdy)
document.addEventListener('change', (e) => {
  if (e.target && e.target.id === 'popis') {
    togglePoskodeniaFieldByValue(e.target.value);
  }
});
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('openDateBtn');
  const jumpToDate = document.getElementById('jumpToDate');

  function toISODate(d) {
    const x = new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  }

  if (!btn || !jumpToDate) return;

  // PC/browser hack: date input nesmie byt display:none pri otvoreni
  function prepareDateInputForOpen() {
    jumpToDate.value = toISODate(currentDate || new Date());

    // namiesto display:block -> "offscreen", aby browser dovolil otvorit picker
    jumpToDate.style.display = 'block';
    jumpToDate.style.position = 'absolute';
    jumpToDate.style.left = '-9999px';
    jumpToDate.style.top = '0';
    jumpToDate.style.opacity = '0.01';
  }

  function hideDateInput() {
    jumpToDate.style.display = 'none';
    jumpToDate.style.position = '';
    jumpToDate.style.left = '';
    jumpToDate.style.top = '';
    jumpToDate.style.opacity = '';
  }

  btn.addEventListener('click', (e) => {
    alert('KLIK NA 📅');

    e.preventDefault();
    e.stopPropagation();

    // ak chces, aby to fungovalo len v DAY, odkomentuj:
    // if (currentView !== 'day') return;

    // ak nie sme v DAY, prepni do DAY
    if (currentView !== 'day') {
      currentView = 'day';
      renderCalendar(currentDate || new Date());
    }

    prepareDateInputForOpen();

    // otvor picker
    if (typeof jumpToDate.showPicker === 'function') {
      jumpToDate.showPicker();
    } else {
      setTimeout(() => {
        jumpToDate.focus();
        jumpToDate.click();
      }, 0);
    }
  });

  jumpToDate.addEventListener('change', () => {
    if (!jumpToDate.value) return;

    currentDate = new Date(jumpToDate.value);
    currentView = 'day';
    renderCalendar(currentDate);

    hideDateInput();
  });

document.addEventListener('click', () => {
  setTimeout(hideDateInput, 0);
});

  jumpToDate.addEventListener('click', (e) => e.stopPropagation());
});
document.addEventListener('DOMContentLoaded', () => {
  const bgVideo = document.querySelector('.bg-video');
  if (!bgVideo) return;

  const SPEED = 0.10; // 👈 TU je kúzlo (0.2–0.35)

  bgVideo.defaultPlaybackRate = SPEED;
  bgVideo.playbackRate = SPEED;

  // 🔒 poistka – pri kazdom play sa znovu nastavi
  bgVideo.addEventListener('play', () => {
    bgVideo.playbackRate = SPEED;
  });
});
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('openAttendance');
  if (!btn) return;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = './dochadzka.html'; // najistejsie (bez popup block)
  });
});
console.log('SCRIPT.JS ide');

document.addEventListener('click', (e) => {
  const btn = e.target.closest('#openAttendance');
  if (!btn) return;

  e.preventDefault();
  window.location.href = './dochadzka.html'; // bez popup block
});

