// ============ СОСТОЯНИЕ ============
const state = {
  pin: "",
  userId: null,
  account: null,
  others: [],
  selectedRecipient: null,
  view: "home"
};

const $ = (id) => document.getElementById(id);

// ============ ВХОД ПО PIN ============
const pinDots = document.querySelectorAll("#pinDots span");
const pinError = $("pinError");

document.querySelectorAll(".numpad button").forEach(btn => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.num;

    if (key === "del") {
      state.pin = state.pin.slice(0, -1);
      renderPin();
      return;
    }
    if (key === "face") {
      showToast("Face ID недоступен в демо", "error");
      return;
    }
    if (state.pin.length >= 4) return;

    state.pin += key;
    renderPin();

    if (state.pin.length === 4) {
      setTimeout(checkPin, 200);
    }
  });
});

function renderPin() {
  pinDots.forEach((dot, i) => {
    dot.classList.toggle("filled", i < state.pin.length);
  });
  pinError.classList.add("hidden");
}

async function checkPin() {
  try {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: state.pin })
    });
    const data = await res.json();

    if (!res.ok) {
      pinError.classList.remove("hidden");
      state.pin = "";
      setTimeout(() => renderPin(), 400);
      const dots = $("pinDots");
      dots.style.animation = "shake 0.3s";
      setTimeout(() => dots.style.animation = "", 300);
      return;
    }

    state.userId = data.userId;
    await loadAccount();
    showApp();
  } catch (err) {
    showToast("Ошибка сети", "error");
    state.pin = "";
    renderPin();
  }
}

const shakeStyle = document.createElement("style");
shakeStyle.textContent = `@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}`;
document.head.appendChild(shakeStyle);

function showApp() {
  $("loginScreen").classList.add("hidden");
  $("app").classList.remove("hidden");
  switchView("home");
}

// ============ ЗАГРУЗКА АККАУНТА ============
async function loadAccount() {
  const res = await fetch(`/api/accounts?userId=${state.userId}`);
  const data = await res.json();
  state.account = data.account;
  state.others = data.others;

  $("balanceAmount").textContent = formatMoney(state.account.balance);
  $("cardNumber").textContent = state.account.cardNumber;
  $("avatar").textContent = state.account.avatar;
  $("userName").textContent = state.account.name;

  renderContacts();
}

function renderContacts() {
  const list = $("contactsList");
  list.innerHTML = state.others.map(u => `
    <div class="contact-item" data-id="${u.id}">
      <div class="contact-avatar">${u.avatar}</div>
      <div class="contact-info">
        <div class="contact-name">${u.name}</div>
        <div class="contact-phone">${u.phone}</div>
      </div>
    </div>
  `).join("");

  list.querySelectorAll(".contact-item").forEach(el => {
    el.addEventListener("click", () => {
      list.querySelectorAll(".contact-item").forEach(i => i.classList.remove("selected"));
      el.classList.add("selected");
      const id = el.dataset.id;
      state.selectedRecipient = state.others.find(u => u.id === id);
      $("selectedRecipient").textContent = state.selectedRecipient.name;
    });
  });
}

// ============ НАВИГАЦИЯ ============
function switchView(view) {
  state.view = view;

  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));

  if (view !== "home") {
    const el = $("view-" + view);
    if (el) el.classList.remove("hidden");
  }

  document.querySelectorAll(".nav-item").forEach(n => {
    n.classList.toggle("active", n.dataset.nav === view);
  });

  if (view === "history") loadHistory();
  if (view === "mybank") loadFiles();
}

document.querySelectorAll("[data-nav]").forEach(el => {
  el.addEventListener("click", () => switchView(el.dataset.nav));
});

// ============ ИСТОРИЯ ============
async function loadHistory() {
  const res = await fetch(`/api/history?userId=${state.userId}`);
  const data = await res.json();

  const list = $("historyList");

  if (!data.transactions.length) {
    list.innerHTML = `<div style="opacity:0.5;text-align:center;padding:20px;">Пока нет операций</div>`;
    return;
  }

  list.innerHTML = Object.entries(data.grouped).map(([day, txs]) => `
    <div>
      <div class="history-day">${day}</div>
      ${txs.map(t => `
        <div class="tx-item">
          <div class="tx-icon ${t.type}">${t.type === "in" ? "↓" : "↑"}</div>
          <div class="tx-info">
            <div class="tx-name">${t.type === "in" ? t.from : t.to}</div>
            <div class="tx-time">${new Date(t.date).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })} · ${t.comment}</div>
          </div>
          <div class="tx-amount ${t.type}">
            ${t.type === "in" ? "+" : "−"}${formatMoney(t.amount)}
          </div>
        </div>
      `).join("")}
    </div>
  `).join("");
}

// ============ ПЕРЕВОД ============
$("sendTransferBtn").addEventListener("click", async () => {
  if (!state.selectedRecipient) return showToast("Выберите получателя", "error");
  const amount = Number($("amountInput").value);
  const comment = $("commentInput").value;

  if (!amount || amount <= 0) return showToast("Введите сумму", "error");

  const res = await fetch("/api/transfer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fromId: state.userId,
      toId: state.selectedRecipient.id,
      amount,
      comment
    })
  });

  const data = await res.json();
  if (!res.ok) return showToast(data.error, "error");

  showToast(data.message);
  $("amountInput").value = "";
  $("commentInput").value = "";
  $("selectedRecipient").textContent = "Выберите получателя";
  state.selectedRecipient = null;
  document.querySelectorAll(".contact-item").forEach(i => i.classList.remove("selected"));

  await loadAccount();
});

// ============ МОЙ БАНК — ФАЙЛЫ ============
$("fileInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 10 * 1024 * 1024) {
    showToast("Файл больше 10 МБ", "error");
    return;
  }

  const res = await fetch(`/api/history?userId=${state.userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: file.name, size: file.size, type: file.type })
  });

  const data = await res.json();
  if (!res.ok) return showToast(data.error, "error");

  showToast("Файл загружен");
  e.target.value = "";
  loadFiles();
});

async function loadFiles() {
  const res = await fetch(`/api/history?userId=${state.userId}`);
  const data = await res.json();

  const list = $("filesList");

  if (!data.files.length) {
    list.innerHTML = `<div style="opacity:0.5;text-align:center;padding:20px;font-size:13px;">Файлов пока нет</div>`;
    return;
  }

  list.innerHTML = data.files.slice().reverse().map(f => `
    <div class="file-item">
      <div class="file-icon">${getFileIcon(f.type)}</div>
      <div class="file-info">
        <div class="file-name">${f.name}</div>
        <div class="file-meta">${formatSize(f.size)} · ${new Date(f.uploadedAt).toLocaleDateString("ru-RU")}</div>
      </div>
    </div>
  `).join("");
}

function getFileIcon(type) {
  if (!type) return "📄";
  if (type.includes("pdf")) return "📕";
  if (type.includes("image")) return "🖼️";
  if (type.includes("word")) return "📘";
  return "📄";
}

// ============ ЛОГАУТ ============
$("logoutBtn").addEventListener("click", () => {
  state.pin = "";
  state.userId = null;
  state.account = null;
  state.selectedRecipient = null;
  renderPin();
  $("app").classList.add("hidden");
  $("loginScreen").classList.remove("hidden");
});

// ============ УТИЛИТЫ ============
function formatMoney(n) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(n)) + " ₸";
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " Б";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " КБ";
  return (bytes / (1024 * 1024)).toFixed(1) + " МБ";
}

function showToast(msg, type = "success") {
  const t = $("toast");
  t.textContent = msg;
  t.className = `toast ${type}`;
  t.classList.remove("hidden");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add("hidden"), 3000);
}