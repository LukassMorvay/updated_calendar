console.log("📊 stats.js načítaný");
// ==== helpery: podporime viac ID aby to vzdy fungovalo ====
const $ = (id) => document.getElementById(id);

function getFromTo() {
  const fromEl = $("statsFrom") || $("fromDate");
  const toEl   = $("statsTo")   || $("toDate");

  return {
    fromEl,
    toEl,
    from: fromEl?.value || "",
    to:   toEl?.value || ""
  };
}

function bindClick(ids, handler) {
  ids.forEach(id => {
    const el = $(id);
    if (el) el.addEventListener("click", handler);
  });
}
// ==== alias tlacidiel (stare aj nove ID) ====
bindClick(["loadJobsStats", "loadByJobs", "loadByTypeBasic"], () => $("loadJobsStats")?.click());
bindClick(["loadTypeStats", "loadByType"], () => $("loadTypeStats")?.click());
bindClick(["loadMechanicPie", "loadByMechanic"], () => $("loadMechanicPie")?.click());
bindClick(["loadInsuranceStats", "loadByInsurance"], () => $("loadInsuranceStats")?.click());
bindClick(["loadDayLoadStats", "loadByDay"], () => $("loadDayLoadStats")?.click());
bindClick(["loadSummary"], () => $("loadSummary")?.click());

// ==================================================
// 📊 ZÁKLADNÁ ŠTATISTIKA + TYPY PRÁC (SUMÁR)
// ==================================================
document.getElementById("loadJobsStats")?.addEventListener("click", async () => {
    const { from, to } = getFromTo();
    const output = document.getElementById("statsContent");

    if (!from || !to) {
        alert("Vyber dátum od a do");
        return;
    }

    output.innerHTML = "Načítavam štatistiku...";

    const start = new Date(from);
    const end = new Date(to);

    let total = 0;
    const typeCounts = {};

    let current = new Date(start);

    while (current <= end) {
        const dateStr = current.toISOString().split("T")[0];

        try {
            const res = await fetch(
                `http://192.168.1.10/Kalendár/api/tasks.php?date=${dateStr}`
            );
            if (res.ok) {
                const tasks = await res.json();
                total += tasks.length;

                tasks.forEach(task => {
                    const type = task.popis || "Bez popisu";
                    typeCounts[type] = (typeCounts[type] || 0) + 1;
                });
            }
        } catch (e) {
            console.warn("Chyba pre dátum", dateStr);
        }

        current.setDate(current.getDate() + 1);
    }

    // zoradenie typov prác podľa počtu
    const sortedTypes = Object.entries(typeCounts)
        .sort((a, b) => b[1] - a[1]);

    let typesHtml = "";
    sortedTypes.forEach(([type, count]) => {
        typesHtml += `
            <tr>
                <td>${type}</td>
                <td style="text-align:right;"><strong>${count}</strong></td>
            </tr>
        `;
    });

    output.innerHTML = `
    <div class="stats-card">

        <div class="stats-center">
            <h3>📊 Základná štatistika</h3>
            <p><strong>Celkový počet zákaziek:</strong> ${total}</p>

            <h4 style="margin-top:15px;">🧰 Typy prác</h4>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Typ práce</th>
                    <th>Počet</th>
                </tr>
            </thead>
            <tbody>
                ${typesHtml}
            </tbody>
        </table>

    </div>
`;
});


// ==================================================
// 👨‍🔧 MECHANICI
// ==================================================
let mechanicsChart = null;

document.getElementById("loadMechanicsStats")?.addEventListener("click", async () => {
    const { from, to } = getFromTo();
    const output = document.getElementById("statsContent");

    if (!from || !to) {
        alert("Vyber dátum od a do");
        return;
    }

    output.innerHTML = "Načítavam štatistiku mechanikov...";

    const start = new Date(from);
    const end = new Date(to);
    const counts = {};
    let current = new Date(start);

    while (current <= end) {
        const dateStr = current.toISOString().split("T")[0];

        try {
            const res = await fetch(
                `http://192.168.1.10/Kalendár/api/tasks.php?date=${dateStr}`
            );
            if (res.ok) {
                const tasks = await res.json();
                tasks.forEach(task => {
                    const mech = task.mechanik || "Bez mechanika";
                    counts[mech] = (counts[mech] || 0) + 1;
                });
            }
        } catch (e) {
            console.warn("Chyba pre dátum", dateStr);
        }

        current.setDate(current.getDate() + 1);
    }

    const labels = Object.keys(counts);
    const data = Object.values(counts);

    output.innerHTML = `
    <div class="stats-card">
        <h3>👨‍🔧 Štatistika mechanikov</h3>
        <canvas id="mechanicsChart" height="120"></canvas>
    `;

    const canvas = document.getElementById("mechanicsChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (mechanicsChart) {
        mechanicsChart.destroy();
    }

    mechanicsChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Počet zákaziek",
                data
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });
});

// ==================================================
// 🏢 POISŤOVNE
// ==================================================
let insuranceChart = null;

document.getElementById("loadInsuranceStats")?.addEventListener("click", async () => {
    const { from, to } = getFromTo();
    const output = document.getElementById("statsContent");

    if (!from || !to) {
        alert("Vyber dátum od a do");
        return;
    }

    output.innerHTML = "Načítavam štatistiku poisťovní...";

    const start = new Date(from);
    const end = new Date(to);
    const counts = {};
    let current = new Date(start);

    while (current <= end) {
        const dateStr = current.toISOString().split("T")[0];

        try {
            const res = await fetch(
                `http://192.168.1.10/Kalendár/api/tasks.php?date=${dateStr}`
            );
            if (res.ok) {
                const tasks = await res.json();
                tasks.forEach(task => {
                    const ins = task.poistovna || "Nezadaná";
                    counts[ins] = (counts[ins] || 0) + 1;
                });
            }
        } catch (e) {
            console.warn("Chyba pre dátum", dateStr);
        }

        current.setDate(current.getDate() + 1);
    }

    const labels = Object.keys(counts);
    const data = Object.values(counts);

    output.innerHTML = `
    <div class="stats-card">
        <h3>🏢 Štatistika poisťovní</h3>
        <canvas id="insuranceChart" height="120"></canvas>
    `;

    const canvas = document.getElementById("insuranceChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (insuranceChart) {
        insuranceChart.destroy();
    }

    insuranceChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Počet zákaziek",
                data
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });
});

// ==================================================
// 📈 VYŤAŽENOSŤ DNÍ
// ==================================================
let dayLoadChart = null;

document.getElementById("loadDayLoadStats")?.addEventListener("click", async () => {
    const { from, to } = getFromTo();
    const output = document.getElementById("statsContent");

    if (!from || !to) {
        alert("Vyber dátum od a do");
        return;
    }

    output.innerHTML = "Načítavam vyťaženosť dní...";

    const start = new Date(from);
    const end = new Date(to);
    const countsPerDay = {};
    let current = new Date(start);

    while (current <= end) {
        const dateStr = current.toISOString().split("T")[0];

        try {
            const res = await fetch(
                `http://192.168.1.10/Kalendár/api/tasks.php?date=${dateStr}`
            );
            if (res.ok) {
                const tasks = await res.json();
                countsPerDay[dateStr] = tasks.length;
            } else {
                countsPerDay[dateStr] = 0;
            }
        } catch (e) {
            console.warn("Chyba pre dátum", dateStr);
            countsPerDay[dateStr] = 0;
        }

        current.setDate(current.getDate() + 1);
    }

    const labels = Object.keys(countsPerDay).sort();
    const data = labels.map(d => countsPerDay[d]);

    output.innerHTML = `
    <div class="stats-card">
        <h3>📈 Vyťaženosť dní</h3>
        <canvas id="dayLoadChart" height="120"></canvas>
    `;

    const canvas = document.getElementById("dayLoadChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (dayLoadChart) {
        dayLoadChart.destroy();
    }

    dayLoadChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Počet zákaziek",
                data
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });
});
// ==================================================
// 🧰 VYŤAŽENOSŤ PODĽA TYPU PRÁCE
// ==================================================
let typeChart = null;

document.getElementById("loadTypeStats")?.addEventListener("click", async () => {
    const { from, to } = getFromTo();
    const output = document.getElementById("statsContent");

    if (!from || !to) {
        alert("Vyber dátum od a do");
        return;
    }

    output.innerHTML = "Načítavam typy prác...";

    const start = new Date(from);
    const end = new Date(to);
    const counts = {};
    let current = new Date(start);

    while (current <= end) {
        const dateStr = current.toISOString().split("T")[0];

        try {
            const res = await fetch(`http://192.168.1.10/Kalendár/api/tasks.php?date=${dateStr}`);
            if (res.ok) {
                const tasks = await res.json();
                tasks.forEach(task => {
                    const type = task.popis || "Nezadané";
                    counts[type] = (counts[type] || 0) + 1;
                });
            }
        } catch (e) {}

        current.setDate(current.getDate() + 1);
    }

    const labels = Object.keys(counts);
    const data = Object.values(counts);

    output.innerHTML = `
    <div class="stats-card">
        <h3>🧰 Typy prác</h3>
        <canvas id="typeChart" height="120"></canvas>
    `;

    const canvas = document.getElementById("typeChart");
    if (!canvas) return;

    if (typeChart) typeChart.destroy();

    typeChart = new Chart(canvas.getContext("2d"), {
        type: "bar",
        data: {
            labels,
            datasets: [{ data }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });
});
// ==================================================
// 👨‍🔧 MECHANICI – KOLÁČ
// ==================================================
let mechanicPie = null;

document.getElementById("loadMechanicPie")?.addEventListener("click", async () => {
    const { from, to } = getFromTo();
    const output = document.getElementById("statsContent");

    if (!from || !to) return alert("Vyber dátum");

    const counts = {};
    let current = new Date(from);
    const end = new Date(to);

    while (current <= end) {
        const dateStr = current.toISOString().split("T")[0];
        try {
            const res = await fetch(`http://192.168.1.10/Kalendár/api/tasks.php?date=${dateStr}`);
            if (res.ok) {
                const tasks = await res.json();
                tasks.forEach(t => {
                    const m = t.mechanik || "Bez mechanika";
                    counts[m] = (counts[m] || 0) + 1;
                });
            }
        } catch (e) {}
        current.setDate(current.getDate() + 1);
    }

    output.innerHTML = `
    <div class="stats-card">
        <h3>👨‍🔧 Rozdelenie práce</h3>
        <canvas id="mechanicPie" height="120"></canvas>
    `;

    const canvas = document.getElementById("mechanicPie");
    if (!canvas) return;

    if (mechanicPie) mechanicPie.destroy();

    mechanicPie = new Chart(canvas.getContext("2d"), {
        type: "pie",
        data: {
            labels: Object.keys(counts),
            datasets: [{ data: Object.values(counts) }]
             },
    options: {
        responsive: true,
        maintainAspectRatio: true
        }
    });
});
// ==================================================
// 🧠 SUMÁR
// ==================================================
document.getElementById("loadSummary")?.addEventListener("click", async () => {
    const { from, to } = getFromTo();
    const output = document.getElementById("statsContent");

    if (!from || !to) return alert("Vyber dátum");

    const dayCounts = {};
    const mechCounts = {};
    let current = new Date(from);
    const end = new Date(to);

    while (current <= end) {
        const dateStr = current.toISOString().split("T")[0];
        try {
            const res = await fetch(`http://192.168.1.10/Kalendár/api/tasks.php?date=${dateStr}`);
            if (res.ok) {
                const tasks = await res.json();
                dayCounts[dateStr] = tasks.length;
                tasks.forEach(t => {
                    const m = t.mechanik || "Bez mechanika";
                    mechCounts[m] = (mechCounts[m] || 0) + 1;
                });
            }
        } catch (e) {}
        current.setDate(current.getDate() + 1);
    }

    const topDay = Object.entries(dayCounts).sort((a,b)=>b[1]-a[1])[0];
    const topMech = Object.entries(mechCounts).sort((a,b)=>b[1]-a[1])[0];

    output.innerHTML = `
    <div class="stats-card">
        <h3>🧠 Sumár obdobia</h3>
        <p><strong>TOP deň:</strong> ${topDay?.[0]} (${topDay?.[1]} zákaziek)</p>
        <p><strong>TOP mechanik:</strong> ${topMech?.[0]} (${topMech?.[1]} zákaziek)</p>
    `;
});
// ==================================================
// 🧠 SUMÁR OBDOBIA (TOP deň, TOP mechanik, priemer)
// ==================================================
document.getElementById("loadSummary")?.addEventListener("click", async () => {
    const { from, to } = getFromTo();
    const output = document.getElementById("statsContent");

    if (!from || !to) {
        alert("Vyber dátum od a do");
        return;
    }

    output.innerHTML = "Načítavam sumár obdobia...";

    const start = new Date(from);
    const end = new Date(to);

    const dayCounts = {};
    const mechanicCounts = {};
    let totalJobs = 0;

    let current = new Date(start);

    while (current <= end) {
        const dateStr = current.toISOString().split("T")[0];

        try {
            const res = await fetch(
                `http://192.168.1.10/Kalendár/api/tasks.php?date=${dateStr}`
            );
            if (res.ok) {
                const tasks = await res.json();

                dayCounts[dateStr] = tasks.length;
                totalJobs += tasks.length;

                tasks.forEach(t => {
                    const mech = t.mechanik || "Bez mechanika";
                    mechanicCounts[mech] = (mechanicCounts[mech] || 0) + 1;
                });
            } else {
                dayCounts[dateStr] = 0;
            }
        } catch (e) {
            dayCounts[dateStr] = 0;
        }

        current.setDate(current.getDate() + 1);
    }

    const daysCount =
        Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const avgPerDay = daysCount > 0
        ? (totalJobs / daysCount).toFixed(2)
        : 0;

    const topDay = Object.entries(dayCounts)
        .sort((a, b) => b[1] - a[1])[0];

    const topMechanic = Object.entries(mechanicCounts)
        .sort((a, b) => b[1] - a[1])[0];

    output.innerHTML = `
        <div class="stats-card stats-summary">
            <h3>🧠 Sumár obdobia</h3>
            <p><strong>Celkom zákaziek:</strong> ${totalJobs}</p>
            <p><strong>Priemer / deň:</strong> ${avgPerDay}</p>
            <p><strong>TOP deň:</strong> ${topDay?.[0] || "—"} (${topDay?.[1] || 0})</p>
            <p><strong>TOP mechanik:</strong> ${topMechanic?.[0] || "—"} (${topMechanic?.[1] || 0})</p>
        </div>
    `;
});
document.getElementById("loadTopDay")?.addEventListener("click", async () => {
  const { from, to } = getFromTo();
  const output = document.getElementById("statsContent");

  if (!from || !to) {
    alert("Vyber dátum od a do");
    return;
  }

  output.innerHTML = "Načítavam TOP deň...";

  const start = new Date(from);
  const end = new Date(to);

  let bestDay = null;
  let bestCount = -1;

  let current = new Date(start);

  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];

    try {
      const res = await fetch(`http://192.168.1.10/Kalendár/api/tasks.php?date=${dateStr}`);
      if (res.ok) {
        const tasks = await res.json();
        const count = Array.isArray(tasks) ? tasks.length : 0;

        if (count > bestCount) {
          bestCount = count;
          bestDay = dateStr;
        }
      }
    } catch (e) {
      console.warn("Chyba pre dátum", dateStr);
    }

    current.setDate(current.getDate() + 1);
  }

  if (!bestDay) {
    output.innerHTML = `<div class="stats-card"><h3>⭐ TOP deň</h3><p>Nenašli sa žiadne dáta.</p></div>`;
    return;
  }

  output.innerHTML = `
    <div class="stats-card">
      <h3>⭐ TOP deň</h3>
      <p style="font-size:22px; font-weight:900; margin:8px 0;">${bestDay}</p>
      <p><strong>Počet zákaziek:</strong> ${bestCount}</p>
    </div>
  `;
});
