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
  // 🧩 ইউনিক নাম তৈরি — প্রতিটি bet এর জন্য
  const fileName = `bet_${bet.id || Date.now()}.html`;

  // 🧩 তোমার দেওয়া HTML template string
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap"
      rel="stylesheet"
    />
    <script src="https://cdn.tailwindcss.com"></script>
    <link
      href="https://cdn.jsdelivr.net/npm/daisyui@4.12.10/dist/full.min.css"
      rel="stylesheet"
      type="text/css"
    />
    <style>
      body { font-family: "Roboto", sans-serif; }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
    <title>${bet.title || "Bet Details"}</title>
  </head>
  <body>
    <main class="w-full h-screen mx-auto bg-[#eceff4] relative">
      <header class="sticky top-0 w-full mx-auto pb-16 overflow-y-auto no-scrollbar">
        <div>
          <img src="img/bet details.jpg" alt="" class="absolute top-0 left-0" />
        </div>
      </header>
      <section>
        <img id="displayImage" class="pb-16" src="${
          bet.image || "img/Screenshot_20251017_101934_MelBet.jpg"
        }" alt="Click to change" />
        <input type="file" id="imageInput" accept="image/*" hidden />
      </section>
      <section class="fixed bottom-0 w-full bg-white shadow-lg mx-auto" id="bottom">
        <div class="relative flex justify-around items-end h-16 md:h-[156px] pb-3 sm:pb-5 md:pb-6 shadow-top">
          <a href="index.html">
            <div class="nav-item flex flex-col items-center active">
              <img src="img/Bottom/popular.png" class="h-6 w-6 md:h-16 md:w-14 mb-1 sm:mb-2 nav-icon" alt="Popular" />
              <p class="text-xs md:text-lg font-medium nav-text text-[#5e809b]">Popular</p>
            </div>
          </a>
          <div class="nav-item flex flex-col items-center">
            <img src="img/Bottom/fvrt.png" class="h-6 w-6 md:h-16 md:w-14 mb-1 sm:mb-2 nav-icon" alt="Favorites" />
            <p class="text-xs sm:text-xl md:text-3xl font-medium nav-text text-[#5e809b]">Favorites</p>
          </div>
          <div class="nav-item flex flex-col items-center">
            <div class="relative -top-2 md:-top-6 rounded-full flex items-center justify-center shadow-lg betslip-icon sm:w-24 sm:h-24 md:w-32 md:h-32">
              <img src="img/Bottom/mainB.png" class="w-12 h-12 md:w-30 md:h-30" alt="Bet slip" />
            </div>
            <p class="text-xs sm:text-xl md:text-3xl font-medium mt-1 sm:mt-2 nav-text text-[#5e809b]">Bet slip</p>
          </div>
          <a href="betHistory.html">
            <div class="nav-item flex flex-col items-center">
              <img src="img/Bottom/historyActv.png" class="h-6 w-6 md:h-16 md:w-14 mb-1 sm:mb-2 nav-icon" alt="History" />
              <p class="text-xs sm:text-xl md:text-3xl font-medium nav-text text-[#488cd2]">History</p>
            </div>
          </a>
          <div class="nav-item flex flex-col items-center">
            <img src="img/Bottom/menu.png" class="h-6 w-6 md:h-16 md:w-14 mb-1 sm:mb-2 nav-icon" alt="Menu" />
            <p class="text-xs sm:text-xl md:text-3xl font-medium nav-text text-[#5e809b]">Menu</p>
          </div>
        </div>
      </section>
    </main>

    <script>
      const img = document.getElementById("displayImage");
      const fileInput = document.getElementById("imageInput");
      const key = "savedImage_${bet.id || Date.now()}";

      const savedImage = localStorage.getItem(key);
      if (savedImage) img.src = savedImage;

      img.addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function (e) {
            const imageData = e.target.result;
            img.src = imageData;
            localStorage.setItem(key, imageData);
          };
          reader.readAsDataURL(file);
        }
      });
    </script>
  </body>
</html>`;

  // 🧩 নতুন Window খুলে তার ভিতরে HTML inject করা
  const newWindow = window.open("", "_blank");
  if (!newWindow) {
    alert("Please allow popups");
    return;
  }
  newWindow.document.open();
  newWindow.document.write(htmlContent);
  newWindow.document.close();
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
