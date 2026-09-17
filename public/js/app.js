/* ============================================================
   Vortex Wallet — App Logic (Phase 1 Complete)
   ============================================================ */

const DEMO_PIN = "1234";
let balanceVisible = true;
let currentFilter = "all";
let enteredPin = "";
let selectedMethod = "bank";

document.addEventListener("DOMContentLoaded", () => {
  if (!sessionStorage.getItem("vortex_unlocked")) {
    document.getElementById("pin-lock").classList.remove("hidden");
    document.getElementById("app").style.visibility = "hidden";
    document.getElementById("bottom-nav").style.visibility = "hidden";
  }

  applyTranslations();
  renderRecentTransactions();
  renderFullTransactions();
  setupNavigation();
  setupActions();
  setupBalanceToggle();
  setupLanguageModal();
  setupFilters();
  setupPinLock();
  setupAddMoney();
  setupRecipientLookup();
  setupQRCode();
  setupSuccessOverlay();
  updateGreeting();
});

function formatPKR(amount) {
  return Number(amount).toLocaleString("en-PK", { maximumFractionDigits: 0 });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function createTxItem(tx) {
  const isSent = tx.type === "sent";
  const sign = isSent ? "−" : "+";
  return `
    <div class="tx-item" data-tx-id="${tx.id}">
      <div class="tx-icon ${tx.type}">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          ${isSent
            ? '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>'
            : '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'}
        </svg>
      </div>
      <div class="tx-details">
        <div class="tx-title">${tx.title}</div>
        <div class="tx-meta">${formatDate(tx.date)} · ${tx.time}</div>
      </div>
      <div class="tx-amount">
        <span class="value ${tx.type}">${sign} PKR ${formatPKR(tx.amount)}</span>
        <span class="status">${tx.status}</span>
      </div>
    </div>
  `;
}

function renderRecentTransactions() {
  const container = document.getElementById("recent-tx-list");
  if (!container) return;
  container.innerHTML = MOCK_TRANSACTIONS.slice(0, 5).map(createTxItem).join("");
  bindTxClicks(container);
}

function renderFullTransactions() {
  const container = document.getElementById("full-tx-list");
  if (!container) return;
  let list = MOCK_TRANSACTIONS;
  if (currentFilter === "sent") list = list.filter(t => t.type === "sent");
  if (currentFilter === "received") list = list.filter(t => t.type === "received");
  container.innerHTML = list.map(createTxItem).join("");
  bindTxClicks(container);
}

function bindTxClicks(container) {
  container.querySelectorAll(".tx-item").forEach(item => {
    item.addEventListener("click", () => {
      const id = item.getAttribute("data-tx-id");
      showTxDetail(id);
    });
  });
}

function showTxDetail(id) {
  const tx = MOCK_TRANSACTIONS.find(t => t.id === id);
  if (!tx) return;
  const isSent = tx.type === "sent";
  const sign = isSent ? "−" : "+";
  const content = document.getElementById("tx-detail-content");
  content.innerHTML = `
    <div class="tx-detail-card">
      <div class="tx-detail-icon ${tx.type}">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          ${isSent
            ? '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>'
            : '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'}
        </svg>
      </div>
      <div class="tx-detail-amount ${tx.type}">${sign} PKR ${formatPKR(tx.amount)}</div>
      <div class="tx-detail-status">${tx.status}</div>
      <div class="tx-detail-rows">
        <div class="tx-detail-row"><span class="label">${t("from")} / ${t("to")}</span><span class="value">${tx.title}</span></div>
        <div class="tx-detail-row"><span class="label">${t("date")}</span><span class="value">${tx.date}</span></div>
        <div class="tx-detail-row"><span class="label">${t("time")}</span><span class="value">${tx.time}</span></div>
        <div class="tx-detail-row"><span class="label">${t("reference")}</span><span class="value">${tx.id.toUpperCase()}</span></div>
        ${tx.note ? `<div class="tx-detail-row"><span class="label">${t("note")}</span><span class="value">${tx.note}</span></div>` : ""}
      </div>
    </div>
  `;
  showScreen("screen-tx-detail");
}

function updateGreeting() {
  const el = document.querySelector(".greeting-text");
  if (!el || currentLang === "ur") return;
  const hour = new Date().getHours();
  if (hour < 12) el.textContent = "Good morning";
  else if (hour < 17) el.textContent = "Good afternoon";
  else el.textContent = "Good evening";
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const target = document.getElementById(id);
  if (target) target.classList.add("active");
  document.querySelectorAll(".nav-item[data-target]").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-target") === id);
  });
  const hideNav = ["screen-send", "screen-receive", "screen-add", "screen-tx-detail"].includes(id);
  document.getElementById("bottom-nav").style.display = hideNav ? "none" : "flex";
  window.scrollTo(0, 0);
}

function setupNavigation() {
  document.querySelectorAll(".nav-item[data-target]").forEach(btn => {
    btn.addEventListener("click", () => showScreen(btn.getAttribute("data-target")));
  });
  document.querySelectorAll("[data-target]").forEach(el => {
    if (el.classList.contains("nav-item")) return;
    el.addEventListener("click", () => showScreen(el.getAttribute("data-target")));
  });
  document.querySelectorAll("[data-back]").forEach(btn => {
    btn.addEventListener("click", () => {
      const backTo = btn.getAttribute("data-back") || "screen-home";
      showScreen(backTo);
    });
  });
}

function setupActions() {
  document.querySelectorAll("[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-action");
      if (action === "send") showScreen("screen-send");
      else if (action === "receive" || action === "scan") showScreen("screen-receive");
      else if (action === "add") showScreen("screen-add");
    });
  });

  document.getElementById("btn-send-confirm")?.addEventListener("click", () => {
    const amount = document.getElementById("send-amount").value;
    const recipient = document.getElementById("send-recipient").value;
    if (!recipient || !amount || Number(amount) <= 0) {
      showToast("Enter recipient and a valid amount");
      return;
    }
    const contact = lookupContact(recipient);
    const name = contact ? contact.name : recipient;
    showSuccess(
      "Money Sent",
      "PKR " + formatPKR(amount) + " sent to " + name + ".\n(Demo — not a real transfer)"
    );
  });

  document.getElementById("btn-copy-account")?.addEventListener("click", () => {
    const account = document.getElementById("account-number").textContent;
    navigator.clipboard?.writeText(account).then(() => showToast("Account copied")).catch(() => showToast(account));
  });

  document.getElementById("btn-share")?.addEventListener("click", () => {
    if (navigator.share) {
      navigator.share({ title: "Vortex Wallet", text: "Pay me on Vortex: " + USER.account });
    } else {
      showToast("Share: " + USER.account);
    }
  });

  document.getElementById("btn-logout")?.addEventListener("click", () => {
    sessionStorage.removeItem("vortex_unlocked");
    showToast("Logged out (demo)");
    setTimeout(() => location.reload(), 800);
  });

  document.getElementById("btn-change-pin")?.addEventListener("click", () => {
    showToast("PIN change will be available after backend");
  });
}

function setupBalanceToggle() {
  document.getElementById("toggle-balance")?.addEventListener("click", () => {
    balanceVisible = !balanceVisible;
    const display = document.getElementById("balance-display");
    if (balanceVisible) {
      display.innerHTML = '<span class="currency">PKR</span><span class="amount">' + formatPKR(USER.balance) + '</span><span class="decimals">.00</span>';
    } else {
      display.innerHTML = '<span class="currency">PKR</span><span class="amount">••••••</span>';
    }
  });
}

function setupLanguageModal() {
  const modal = document.getElementById("lang-modal");
  document.getElementById("btn-language")?.addEventListener("click", () => {
    modal.classList.add("open");
    document.querySelectorAll(".lang-option").forEach(opt => {
      opt.classList.toggle("active", opt.getAttribute("data-lang") === currentLang);
    });
  });
  modal.querySelector(".modal-backdrop")?.addEventListener("click", () => modal.classList.remove("open"));
  modal.querySelector(".modal-close")?.addEventListener("click", () => modal.classList.remove("open"));
  document.querySelectorAll(".lang-option").forEach(opt => {
    opt.addEventListener("click", () => {
      setLanguage(opt.getAttribute("data-lang"));
      modal.classList.remove("open");
      updateGreeting();
    });
  });
}

function setupFilters() {
  document.querySelectorAll(".filter-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      currentFilter = chip.getAttribute("data-filter");
      renderFullTransactions();
    });
  });
}

function setupPinLock() {
  const dots = document.querySelectorAll("#pin-dots .dot");
  const errorEl = document.getElementById("pin-error");

  document.querySelectorAll("#pin-pad button").forEach(btn => {
    btn.addEventListener("click", () => {
      const val = btn.getAttribute("data-num");
      if (val === "clear") {
        enteredPin = "";
      } else if (val === "back") {
        enteredPin = enteredPin.slice(0, -1);
      } else if (enteredPin.length < 4) {
        enteredPin += val;
      }

      dots.forEach((d, i) => d.classList.toggle("filled", i < enteredPin.length));
      errorEl.classList.add("hidden");

      if (enteredPin.length === 4) {
        if (enteredPin === DEMO_PIN) {
          sessionStorage.setItem("vortex_unlocked", "1");
          document.getElementById("pin-lock").classList.add("hidden");
          document.getElementById("app").style.visibility = "visible";
          document.getElementById("bottom-nav").style.visibility = "visible";
          enteredPin = "";
        } else {
          errorEl.classList.remove("hidden");
          enteredPin = "";
          setTimeout(() => dots.forEach(d => d.classList.remove("filled")), 300);
        }
      }
    });
  });
}

function setupAddMoney() {
  document.querySelectorAll(".method-item").forEach(item => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".method-item").forEach(m => m.classList.remove("active"));
      item.classList.add("active");
      selectedMethod = item.getAttribute("data-method");
    });
  });

  document.getElementById("btn-add-confirm")?.addEventListener("click", () => {
    const amount = document.getElementById("add-amount").value;
    if (!amount || Number(amount) <= 0) {
      showToast("Enter a valid amount");
      return;
    }
    const labels = { bank: "Bank Transfer", card: "Card", jazzcash: "JazzCash / EasyPaisa" };
    showSuccess(
      "Request Submitted",
      "PKR " + formatPKR(amount) + " via " + (labels[selectedMethod] || selectedMethod) + ".\n(Demo — connect real provider later)"
    );
  });
}

/* ---------- Recipient lookup ---------- */
function setupRecipientLookup() {
  const input = document.getElementById("send-recipient");
  const preview = document.getElementById("recipient-preview");
  if (!input || !preview) return;

  const update = () => {
    const contact = lookupContact(input.value);
    if (contact) {
      document.getElementById("rp-avatar").textContent = contact.initial;
      document.getElementById("rp-name").textContent = contact.name;
      document.getElementById("rp-phone").textContent = contact.phone;
      preview.classList.remove("hidden");
    } else {
      preview.classList.add("hidden");
    }
  };

  input.addEventListener("input", update);
  input.addEventListener("blur", update);
}

/* ---------- QR Code ---------- */
function setupQRCode() {
  const img = document.getElementById("qr-image");
  if (!img) return;
  const payload = "vortex://pay/" + encodeURIComponent(USER.account) + "?name=" + encodeURIComponent(USER.name);
  img.src = "https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=8&data=" + encodeURIComponent(payload);
  img.onerror = () => {
    img.alt = "QR unavailable offline";
  };
}

/* ---------- Success overlay ---------- */
function showSuccess(title, message) {
  const el = document.getElementById("success-overlay");
  if (!el) {
    showToast(title);
    return;
  }
  document.getElementById("success-title").textContent = title;
  document.getElementById("success-msg").textContent = message;
  el.classList.remove("hidden");
}

function setupSuccessOverlay() {
  document.getElementById("success-done")?.addEventListener("click", () => {
    document.getElementById("success-overlay")?.classList.add("hidden");
    // clear send form
    const r = document.getElementById("send-recipient");
    const a = document.getElementById("send-amount");
    const n = document.getElementById("send-note");
    if (r) r.value = "";
    if (a) a.value = "";
    if (n) n.value = "";
    document.getElementById("recipient-preview")?.classList.add("hidden");
    showScreen("screen-home");
  });
}

