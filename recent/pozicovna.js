let currentDate = new Date();
let editIndex = null;
let rentals = [];

const calendar = document.getElementById("calendar");
const monthYear = document.getElementById("monthYear");

/* =========================
   NACITANIE Z DB
========================= */
async function loadRentals() {
  const res = await fetch("api/rentals.php");
  rentals = await res.json();
  renderMonth();
}

/* =========================
   POMOCNE
========================= */
function pad2(n) {
  return String(n).padStart(2, "0");
}

function isoDateStr(y, m0, d) {
  return `${y}-${pad2(m0 + 1)}-${pad2(d)}`;
}

function safeText(v) {
  return (v ?? "").toString();
}
function statusToClass(status) {
  return safeText(status)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // prec diakritika
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");          // medzery na -
}

/* =========================
   CUSTOMER PACK / UNPACK
   (AUTO + CENA ulozime do customer, aby to videli vsetci)
========================= */
function packCustomer(name, car, price) {
  const n = (name || "").trim();
  const c = (car || "").trim();
  const pRaw = price === null || price === undefined ? "" : String(price).trim();
  const p = pRaw.replace(/\s*EUR\s*$/i, "").replace(/€\s*$/i, "");
  const parts = [];
  if (c) parts.push(`AUTO: ${c}`);
  if (p) parts.push(`CENA: ${p}`);
  return parts.length ? `${n} | ${parts.join(" | ")}` : n;
}

function unpackCustomer(customerStr) {
  const raw = (customerStr || "").toString().trim();
  const out = { name: raw, car: "", price: "" };
  if (!raw) return out;

  const segs = raw.split("|").map(s => s.trim()).filter(Boolean);
  out.name = segs[0] || raw;

  for (let i = 1; i < segs.length; i++) {
    const s = segs[i];
    if (/^AUTO\s*:/i.test(s)) out.car = s.replace(/^AUTO\s*:\s*/i, "").trim();
    if (/^CENA\s*:/i.test(s)) out.price = s.replace(/^CENA\s*:\s*/i, "").trim().replace(/\s*EUR\s*$/i, "");
  }
  return out;
}

/* =========================
   VYKRESLENIE MESIACA
========================= */
function renderMonth() {
  if (!calendar || !monthYear) return;

  calendar.innerHTML = "";
  calendar.className = "month-view";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  monthYear.textContent = currentDate.toLocaleDateString("sk-SK", {
    month: "long",
    year: "numeric"
  });

  // --- dopln prazdne dni na zaciatku (Po = 1. stlpec) ---
  const firstDay = new Date(year, month, 1);
  let start = firstDay.getDay();     // 0=Ne,1=Po,...6=So
  start = (start + 6) % 7;           // prehod na Po=0,...Ne=6

  for (let i = 0; i < start; i++) {
    const empty = document.createElement("div");
    empty.className = "day empty";
    empty.innerHTML = `<div class="date">.</div>`;
    calendar.appendChild(empty);
  }

  const lastDay = new Date(year, month + 1, 0);

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateStr = isoDateStr(year, month, day);

    const dayDiv = document.createElement("div");
    dayDiv.className = "day";
    dayDiv.innerHTML = `<div class="date">${day}</div>`;

    /* ➕ NOVA REZERVACIA */
    dayDiv.onclick = () => {
      editIndex = null;
      const form = document.getElementById("rentalForm");
      if (form) form.reset();

      const delBtn = document.getElementById("deleteRental");
      if (delBtn) delBtn.style.display = "none";

      document.getElementById("rentalFrom").value = dateStr;
      document.getElementById("rentalTo").value = dateStr;
      document.getElementById("rentalStatus").value = "reserved";

      document.getElementById("rentalModal").classList.remove("hidden");
    };

    /* 📦 EXISTUJUCE REZERVACIE */
    rentals.forEach((r, index) => {
      // r.date_from / r.date_to su YYYY-MM-DD => string porovnanie je ok
      if (dateStr >= r.date_from && dateStr <= r.date_to) {
        const badge = document.createElement("div");
        badge.className = `rental-badge rental-${statusToClass(r.status)}`;

        const unpacked = unpackCustomer(r.customer);
        const carVal = (r.car ?? "").toString().trim() || unpacked.car;

        // cena moze prist ako number (r.price) alebo byt zabalena v customer
        const priceStrFromDb = (r.price !== null && r.price !== undefined && String(r.price).trim() !== "")
          ? String(r.price).trim()
          : (unpacked.price || "");

        const pricePart = priceStrFromDb ? ` • ${priceStrFromDb} EUR` : "";

        // zachovame zobrazenie: item – meno + cena
        badge.textContent = `${safeText(r.item)} – ${safeText(unpacked.name)}${pricePart}`;

        /* ✏️ EDIT */
        badge.onclick = (e) => {
          e.stopPropagation();
          editIndex = index;

          document.getElementById("rentalItem").value = r.item || "";
          const unpacked2 = unpackCustomer(r.customer);
          document.getElementById("customerName").value = unpacked2.name || "";
          document.getElementById("carBrand").value = (r.car || "").toString().trim() || unpacked2.car || "";
          document.getElementById("customerPhone").value = r.phone || "";
          document.getElementById("rentalFrom").value = r.date_from || "";
          document.getElementById("rentalTo").value = r.date_to || "";
          document.getElementById("rentalStatus").value = r.status || "reserved";

          // cena do inputu (vidi ju kazdy, lebo ide do DB cez API)
          const priceFromDb = (r.price !== null && r.price !== undefined && String(r.price).trim() !== "") ? String(r.price).trim() : (unpacked2.price || "");
          document.getElementById("rentalPrice").value = priceFromDb;

          const delBtn = document.getElementById("deleteRental");
          if (delBtn) delBtn.style.display = "inline-block";

          document.getElementById("rentalModal").classList.remove("hidden");
        };

        dayDiv.appendChild(badge);
      }
    });

    calendar.appendChild(dayDiv);
  }
}

/* =========================
   PREPINANIE MESIACA
========================= */
const prevBtn = document.getElementById("prevMonth");
const nextBtn = document.getElementById("nextMonth");

if (prevBtn) {
  prevBtn.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderMonth();
  };
}

if (nextBtn) {
  nextBtn.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderMonth();
  };
}

/* =========================
   ULOZENIE / EDIT
========================= */
const rentalForm = document.getElementById("rentalForm");
if (rentalForm) {
  rentalForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fromVal = document.getElementById("rentalFrom").value;
    const toVal = document.getElementById("rentalTo").value;

    const priceRaw = document.getElementById("rentalPrice").value;
    const priceVal = priceRaw === "" ? null : Number(priceRaw);

    const nameVal = document.getElementById("customerName").value;
    const carVal = document.getElementById("carBrand").value;
    const packedCustomer = packCustomer(nameVal, carVal, priceRaw === "" ? "" : priceRaw);

    const data = {
      item: document.getElementById("rentalItem").value,
      customer: packedCustomer,
      car: carVal,
      phone: document.getElementById("customerPhone").value,

      // posielame oba nazvy - aby backend urcite chytil datumy
      from: fromVal,
      to: toVal,
      date_from: fromVal,
      date_to: toVal,

      status: document.getElementById("rentalStatus").value,

      // cena (bez znaku meny v DB)
      price: Number.isFinite(priceVal) ? priceVal : null
    };

    if (editIndex !== null) {
      /* ✏️ UPDATE */
      data.id = rentals[editIndex].id;

      await fetch("api/rentals.php", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    } else {
      /* ➕ INSERT */
      await fetch("api/rentals.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    }

    closeModal();
    loadRentals();
  });
}

/* =========================
   ZMAZANIE
========================= */
const deleteBtn = document.getElementById("deleteRental");
if (deleteBtn) {
  deleteBtn.onclick = async () => {
    if (editIndex === null) return;

    if (!confirm("Naozaj chcete zmazat tuto rezervaciu?")) return;

    await fetch("api/rentals.php", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rentals[editIndex].id })
    });

    closeModal();
    loadRentals();
  };
}

/* =========================
   ZATVORENIE MODALU
========================= */
const closeBtn = document.getElementById("closeRentalModal");
if (closeBtn) {
  closeBtn.onclick = () => closeModal();
}

// klik mimo content = zavriet
const rentalModal = document.getElementById("rentalModal");
if (rentalModal) {
  rentalModal.addEventListener("click", (e) => {
    if (e.target === rentalModal) closeModal();
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

function closeModal() {
  editIndex = null;
  const modal = document.getElementById("rentalModal");
  if (modal) modal.classList.add("hidden");

  const form = document.getElementById("rentalForm");
  if (form) form.reset();

  const delBtn = document.getElementById("deleteRental");
  if (delBtn) delBtn.style.display = "none";
}

/* =========================
   START
========================= */
loadRentals();
