const logDiv = document.getElementById('attendanceLog');
const employeeSelect = document.getElementById('employeeSelect');
const dateInput = document.getElementById('attendanceDate');

dateInput.value = new Date().toISOString().split('T')[0];

function logAction(type) {
    if (!employeeSelect.value) {
        alert('Vyber zamestnanca');
        return;
    }

    const time = new Date().toLocaleTimeString('sk-SK', { hour12: false });

    const entry = document.createElement('div');
    entry.innerHTML = `
        <strong>${employeeSelect.value}</strong> – ${type} – ${time}
    `;
    entry.style.marginBottom = '8px';

    logDiv.prepend(entry);
}

document.getElementById('startWork').onclick = () => logAction('Príchod');
document.getElementById('endWork').onclick = () => logAction('Odchod');
document.getElementById('breakStart').onclick = () => logAction('Pauza');
