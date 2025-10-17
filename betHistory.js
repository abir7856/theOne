// scripts.js
// Attach to the HTML you gave. No design classes changed — script injects modal and manages logic.
// Storage key
const STORAGE_KEY = "user_bet_history_v1_v2";

// Default sample bets (matches your static example)
const DEFAULT_BETS = [
  {
    id: genId(),
    datetime: "2025-09-17T00:59:00",
    eventLabel: "",
    type: "Single",
    odds: 2.42,
    stake: 20,
    status: "Paid out",
  },
  {
    id: genId(),
    datetime: "2025-09-17T00:33:00",
    eventLabel: "",
    type: "Accumulator",
    odds: 2.07,
    stake: 20,
    status: "Lost",
  },
  {
    id: genId(),
    datetime: "2025-09-17T15:32:00",
    eventLabel: "Live",
    type: "Single",
    odds: 3.27,
    stake: 20,
    status: "Accepted",
  },
];

function genId() {
  return "b_" + Math.random().toString(36).slice(2, 9);
}
function money(n) {
  return Number(n || 0).toFixed(2);
}
function pad(n) {
  return String(n).padStart(2, "0");
}
function formatDisplayDT(iso) {
  try {
    const d = new Date(iso);
    return `${pad(d.getDate())}.${pad(
      d.getMonth() + 1
    )}.${d.getFullYear()} (${pad(d.getHours())}:${pad(d.getMinutes())})`;
  } catch (e) {
    return iso;
  }
}
function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().slice(0, 16);
}
function isoFromLocalInput(v) {
  if (!v) return new Date().toISOString();
  // v like "2025-09-17T00:59"
  const d = new Date(v);
  // treat input as local, convert to ISO Z
  return new Date(d.getTime() + d.getTimezoneOffset() * 60000).toISOString();
}

// storage
function loadBets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BETS));
      return JSON.parse(JSON.stringify(DEFAULT_BETS));
    }
    return JSON.parse(raw);
  } catch (e) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BETS));
    return JSON.parse(JSON.stringify(DEFAULT_BETS));
  }
}
function saveBets(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

// find the top totals area in your HTML and the section that contains the bet-cards
function findTotalsNodes() {
  // নতুন totals card selector (HTML অনুযায়ী)
  const totalsCard = document.querySelector(
    ".bg-white.mt-2.mx-3.rounded-lg.flex.justify-between.p-3.shadow-md.text-xs"
  );
  if (!totalsCard) return null;

  const spanCount = totalsCard.querySelector("p span");
  const h4Amount = totalsCard.querySelector("h4");

  return { totalsCard, spanCount, h4Amount };
}

function findBetsListContainer() {
  // your cards are inside <section class="text-2xl"> after the totals card.
  // We'll find the first <section class="text-2xl"> and render into it, replacing the static cards.
  const section = document.querySelector("header section");
  return section;
}

// render one card using exact class structure as your design
function renderBetCard(bet) {
  // outer wrapper: same classes as your sample cards
  const wrapper = document.createElement("div");
  wrapper.className =
    "bg-white shadow-md rounded-lg p-3 border border-gray-100 mt-2 mx-3";
  wrapper.dataset.id = bet.id;

  // top row
  const topRow = document.createElement("div");
  topRow.className = "flex items-center justify-between mb-6 text-xs";

  const leftTop = document.createElement("div");
  leftTop.className = "flex gap-1 items-center";

  const dateP = document.createElement("p");
  dateP.className = "text-[#607f9c]";
  // if Live label exists, show badge to its right (same markup as sample)
  dateP.textContent = formatDisplayDT(bet.datetime);

  leftTop.appendChild(dateP);

  if (bet.eventLabel && bet.eventLabel.toLowerCase().includes("live")) {
    const liveDiv = document.createElement("div");
    liveDiv.className =
      "bg-[#ea2b24] text-white flex gap-1 items-center rounded-md px-1 text-xs h-4 pr-2";
    liveDiv.innerHTML = `<svg width="5" height="10" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg"><circle cx="5" cy="5" r="4" fill="white" /></svg><p class="font-semibold">Live</p>`;
    leftTop.appendChild(liveDiv);
  } else if (bet.eventLabel) {
    const otherDiv = document.createElement("div");
    otherDiv.className =
      "bg-[#598acc] text-white flex gap-1 items-center rounded-lg px-2 text-xs";
    otherDiv.innerHTML = `<p class="font-semibold">${escapeHtml(
      bet.eventLabel
    )}</p>`;
    leftTop.appendChild(otherDiv);
  }

  topRow.appendChild(leftTop);

  const threeBtn = document.createElement("button");
  threeBtn.className = "text-blue-500 mr-3 three-dot-btn";
  threeBtn.innerHTML = `<svg width="10" height="20" viewBox="0 0 10 40" xmlns="http://www.w3.org/2000/svg">
    <circle cx="5" cy="5" r="4" fill="#607f9c" />
    <circle cx="5" cy="35" r="4" fill="#607f9c" />
    <circle cx="5" cy="20" r="4" fill="#607f9c" />
  </svg>`;
  topRow.appendChild(threeBtn);

  // details
  const details = document.createElement("div");
  details.className = "mt-3 space-y-2";

  // type & odds row
  const row1 = document.createElement("div");
  row1.className = "flex justify-between";
  row1.innerHTML = `<span class="text-[#607f9c]">${escapeHtml(
    bet.type
  )}</span><span class="font-semibold text-gray-800">${money(bet.odds)}</span>`;

  // stake row
  const row2 = document.createElement("div");
  row2.className = "flex justify-between";
  row2.innerHTML = `<span class="text-[#607f9c]">Stake:</span><span class="font-semibold text-gray-800">${money(
    bet.stake
  )} &#x20B9;</span>`;

  // status/winnings row
  const row3 = document.createElement("div");
  row3.className = "flex justify-between items-center";
  const leftP = document.createElement("p");
  leftP.className = "flex gap-4";
  if (bet.status === "Paid out") {
    leftP.innerHTML = `<span class="text-[#607f9c]">Winnings:</span><span class="font-semibold text-green-600">${money(
      bet.odds * bet.stake
    )} &#x20B9;</span>`;
  } else if (bet.status === "Accepted") {
    leftP.innerHTML = `<span class="text-[#607f9c]">Potential winnings:</span><span class="text-gray-800 font-bold">${money(
      bet.odds * bet.stake
    )} &#x20B9;</span>`;
  } else {
    leftP.innerHTML = `<span class="text-[#607f9c]">Status:</span>`;
  }

  const rightDiv = document.createElement("div");
  rightDiv.className = "flex items-center gap-4";
  const img = document.createElement("img");
  img.className = "w-6 h-6";
  if (bet.status === "Paid out") img.src = "img/Logo/paidOut.png";
  else if (bet.status === "Lost") img.src = "img/Logo/Loss.png";
  else img.src = "img/Logo/Accepted.png";
  img.onerror = function () {
    this.style.display = "none";
  };

  const statusSpan = document.createElement("span");
  statusSpan.className = "font-semibold";
  if (bet.status === "Paid out") {
    statusSpan.classList.add("text-green-600");
    statusSpan.textContent = "Paid out";
  } else if (bet.status === "Lost") {
    statusSpan.classList.add("text-[#ea2b24]");
    statusSpan.textContent = "Lost";
  } else {
    statusSpan.classList.add("text-[#598acc]");
    statusSpan.textContent = "Accepted";
  }

  rightDiv.appendChild(img);
  rightDiv.appendChild(statusSpan);

  row3.appendChild(leftP);
  row3.appendChild(rightDiv);

  details.appendChild(row1);
  details.appendChild(row2);
  details.appendChild(row3);

  wrapper.appendChild(topRow);
  wrapper.appendChild(details);

  // clicking on whole wrapper opens details page
  wrapper.addEventListener("click", function (e) {
    // avoid when three-dot clicked
    if (e.target.closest(".three-dot-btn")) return;
    openDetailsPage(bet);
  });

  // three dot click opens modal editor for this bet
  threeBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    openModal(bet.id);
  });

  return wrapper;
}

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// renders the list replacing static markup inside section
function renderAll(bets) {
  const section = findBetsListContainer();
  if (!section) return;

  // নতুন HTML অনুযায়ী পুরনো bet cards remove
  const existing = Array.from(
    section.querySelectorAll(
      ".bg-white.shadow-md.rounded-xl.p-4.border.border-gray-100.mt-2.mx-3"
    )
  );
  existing.forEach((n) => n.remove());

  const totalsRef = section.querySelector(
    ".bg-white.mt-2.mx-3.rounded-lg.flex.justify-between.p-3.shadow-md.text-xs"
  );
  bets.forEach((b) => {
    const card = renderBetCard(b);
    section.appendChild(card);
  });

  updateTotals(bets);
}

// update the top totals
function updateTotals(bets) {
  const nodes = findTotalsNodes();
  if (!nodes) return;
  const countNode = nodes.spanCount;
  const amountNode = nodes.h4Amount;
  if (countNode) countNode.textContent = bets.length;
  if (amountNode) {
    // h4 currently is '(0 ₹)' — we replace innerHTML to match format "(X ₹)"
    amountNode.innerHTML = `(${money(
      bets.reduce((s, b) => s + Number(b.stake || 0), 0)
    )} &#x20B9;)`;
  }
}

// modal management
let modalEl = null;
let modalOpenForId = null; // id of bet being edited, or null for new
function createModalOnce() {
  if (modalEl) return modalEl;
  modalEl = document.createElement("div");
  modalEl.id = "bet-editor-modal";
  modalEl.style.position = "fixed";
  modalEl.style.left = "0";
  modalEl.style.top = "0";
  modalEl.style.width = "100%";
  modalEl.style.height = "100%";
  modalEl.style.display = "none";
  modalEl.style.alignItems = "center";
  modalEl.style.justifyContent = "center";
  modalEl.style.zIndex = "9999";
  modalEl.innerHTML = `
    <div style="background:rgba(0,0,0,0.5);position:absolute;inset:0;"></div>
    <div style="position:relative;max-width:520px;width:96%;background:#fff;border-radius:12px;padding:18px;z-index:2;">
      <h3 style="margin:0 0 8px 0;font-weight:600">Bet Editor</h3>
      <div style="font-size:13px;color:#666;margin-bottom:8px">Choose to modify current or add new. Fill fields and Save.</div>
      <div style="display:flex;gap:12px;margin-bottom:10px;align-items:center">
        <label style="display:flex;align-items:center;gap:6px"><input type="radio" name="bet_mode" value="modify" checked/> Modify current</label>
        <label style="display:flex;align-items:center;gap:6px"><input type="radio" name="bet_mode" value="addnew"/> Add new</label>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
        <div>
          <label style="font-size:13px;color:#444">Event label</label>
          <input id="modal-event-label" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px" placeholder="eg: Live or 1XCHAMPIONS"/>
        </div>
        <div>
          <label style="font-size:10px;color:#444">Type</label>
          <select id="modal-type" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px">
            <option>Single</option><option>Accumulator</option>
          </select>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
        <div>
          <label style="font-size:13px;color:#444">Date & Time</label>
          <input id="modal-datetime" type="datetime-local" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px"/>
        </div>
        <div>
          <label style="font-size:13px;color:#444">Odds</label>
          <input id="modal-odds" type="number" step="0.01" min="0" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px"/>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:8px">
        <div style="flex:1">
          <label style="font-size:13px;color:#444">Stake (₹)</label>
          <input id="modal-stake" type="number" step="0.01" min="0" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px"/>
        </div>
        <div style="flex:1">
          <label style="font-size:13px;color:#444">Status</label>
          <select id="modal-status" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px">
            <option>Accepted</option><option>Paid out</option><option>Lost</option><option>Live</option>
          </select>
        </div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px">
        <button id="modal-cancel" style="padding:8px 12px;border-radius:8px;background:#f3f4f6;border:1px solid #e5e7eb">Cancel</button>
        <button id="modal-save" style="padding:8px 12px;border-radius:8px;background:#0ea5a5;color:#fff;border:0">Save</button>
      </div>
    </div>
  `;
  document.body.appendChild(modalEl);

  // events
  modalEl.querySelector("#modal-cancel").addEventListener("click", () => {
    closeModal();
  });
  modalEl.querySelector("#modal-save").addEventListener("click", () => {
    onModalSave();
  });

  // clicking backdrop closes
  modalEl.addEventListener("click", (e) => {
    if (e.target === modalEl) closeModal();
  });

  return modalEl;
}

function openModal(betId) {
  createModalOnce();
  modalOpenForId = betId || null;
  const modeRadio = modalEl.querySelector(
    'input[name="bet_mode"][value="modify"]'
  );
  const addRadio = modalEl.querySelector(
    'input[name="bet_mode"][value="addnew"]'
  );
  if (betId) {
    modeRadio.checked = true;
    // prefill with bet data
    const bet = getBets().find((x) => x.id === betId);
    if (bet) {
      modalEl.querySelector("#modal-event-label").value = bet.eventLabel || "";
      modalEl.querySelector("#modal-type").value = bet.type || "Single";
      modalEl.querySelector("#modal-datetime").value = toLocalInput(
        bet.datetime
      );
      modalEl.querySelector("#modal-odds").value = bet.odds;
      modalEl.querySelector("#modal-stake").value = bet.stake;
      modalEl.querySelector("#modal-status").value = bet.status || "Accepted";
    }
  } else {
    addRadio.checked = true;
    modalEl.querySelector("#modal-event-label").value = "";
    modalEl.querySelector("#modal-type").value = "Single";
    modalEl.querySelector("#modal-datetime").value = new Date()
      .toISOString()
      .slice(0, 16);
    modalEl.querySelector("#modal-odds").value = "";
    modalEl.querySelector("#modal-stake").value = "";
    modalEl.querySelector("#modal-status").value = "Accepted";
  }
  modalEl.style.display = "flex";
}

function closeModal() {
  if (!modalEl) return;
  modalEl.style.display = "none";
  modalOpenForId = null;
}

function onModalSave() {
  const mode = modalEl.querySelector('input[name="bet_mode"]:checked').value;
  const payload = {
    eventLabel: modalEl.querySelector("#modal-event-label").value.trim(),
    type: modalEl.querySelector("#modal-type").value,
    datetime: isoFromLocalInput(modalEl.querySelector("#modal-datetime").value),
    odds: Number(modalEl.querySelector("#modal-odds").value) || 0,
    stake: Number(modalEl.querySelector("#modal-stake").value) || 0,
    status: modalEl.querySelector("#modal-status").value,
  };

  let bets = getBets();
  if (mode === "addnew") {
    // create new
    payload.id = genId();
    bets.unshift(payload);
  } else {
    // modify current
    const id = modalOpenForId;
    if (!id) {
      // if no id selected treat as add
      payload.id = genId();
      bets.unshift(payload);
    } else {
      const idx = bets.findIndex((x) => x.id === id);
      if (idx !== -1) {
        payload.id = id;
        bets[idx] = payload;
      } else {
        payload.id = genId();
        bets.unshift(payload);
      }
    }
  }
  saveBets(bets);
  closeModal();
  renderAll(bets);
}

// open black detail page
function openDetailsPage(bet) {
  const w = window.open("", "_blank");
  if (!w) {
    alert("Popup blocked — allow popups");
    return;
  }
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Bet Details</title></head><body style="background:black;color:white;font-family:Roboto,Arial;padding:20px">
    <h2>Bet Details</h2>
    <pre>${escapeHtml(JSON.stringify(bet, null, 2))}</pre>
    </body></html>`;
  w.document.write(html);
  w.document.close();
}

// helper to get bets
function getBets() {
  return loadBets();
}

// initial boot
document.addEventListener("DOMContentLoaded", function () {
  // ensure modal element variable ready
  createModalOnce();

  // initial render
  const bets = getBets();
  renderAll(bets);

  // Attach hook for any existing three-dot static buttons (if any remain)
  // But our render replaces them; this is a fallback
  (document.querySelectorAll(".three-dot-btn") || []).forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      // try to find nearest card id by walking DOM
      const card = btn.closest("[data-id]");
      const id = card ? card.dataset.id : null;
      openModal(id);
    });
  });

  // Add support: if user clicks an "Add" button you created, open modal for new
  // look for element with id btn-add or class btn-add
  const addBtn =
    document.getElementById("btn-add") || document.querySelector(".btn-add");
  if (addBtn) {
    addBtn.addEventListener("click", function (e) {
      e.preventDefault();
      openModal(null);
    });
  }
});

// Editable Main Balance
function makeEditable(pElement) {
  pElement.addEventListener("click", () => {
    const currentValue = pElement.innerText;

    const input = document.createElement("input");
    input.type = "text";
    input.value = currentValue;
    input.className = "text-4xl font-semibold text-[#183350]";
    input.style.width = "150px";

    pElement.replaceWith(input);
    input.focus();

    function saveValue() {
      const newValue = input.value.trim() || "0";

      // Save value to localStorage
      localStorage.setItem("openingAmount", newValue);

      const newP = document.createElement("p");
      newP.id = "mainBalance";
      newP.className = "text-4xl font-semibold text-[#183350] cursor-pointer";
      newP.innerText = newValue;

      input.replaceWith(newP);

      // পুনরায় ক্লিক যোগ করা
      makeEditable(newP);
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveValue();
    });

    input.addEventListener("blur", saveValue);
  });
}

// Page load: localStorage থেকে value load করা
window.addEventListener("DOMContentLoaded", () => {
  const savedValue = localStorage.getItem("openingAmount");
  if (savedValue) {
    document.getElementById("mainBalance").innerText = savedValue;
  }
  makeEditable(document.getElementById("mainBalance"));
});
