/* ============================================================
   Vortex Wallet — i18n (English + Urdu)
   ============================================================ */

const translations = {
  en: {
    greeting: "Good afternoon",
    total_balance: "Total Balance",
    this_month: "this month",
    send: "Send",
    receive: "Receive",
    add_money: "Add Money",
    scan: "Scan",
    recent: "Recent",
    see_all: "See all",
    transactions: "Transactions",
    all: "All",
    sent: "Sent",
    received: "Received",
    send_money: "Send Money",
    recipient: "Recipient",
    recipient_placeholder: "Phone, email or account number",
    amount: "Amount",
    note_optional: "Note (optional)",
    note_placeholder: "What's this for?",
    continue: "Continue",
    receive_money: "Receive Money",
    scan_to_pay: "Scan to pay me",
    account: "Account",
    name: "Name",
    copy: "Copy",
    share: "Share",
    profile: "Profile",
    preferences: "Preferences",
    language: "Language",
    change_pin: "Change PIN",
    security: "Security",
    notifications: "Notifications",
    support: "Support",
    help: "Help & Support",
    about: "About Vortex",
    logout: "Log out",
    home: "Home",
    history: "History",
    select_language: "Select Language",
    cancel: "Cancel",
    tx_detail: "Transaction",
    payment_method: "Payment Method",
    status: "Status",
    date: "Date",
    time: "Time",
    note: "Note",
    reference: "Reference",
    from: "From",
    to: "To"
  },
  ur: {
    greeting: "شب بخیر",
    total_balance: "کل بیلنس",
    this_month: "اس مہینے",
    send: "بھیجیں",
    receive: "وصول کریں",
    add_money: "رقم شامل کریں",
    scan: "اسکین",
    recent: "حالیہ",
    see_all: "سب دیکھیں",
    transactions: "لین دین",
    all: "تمام",
    sent: "بھیجی گئی",
    received: "موصولہ",
    send_money: "رقم بھیجیں",
    recipient: "وصول کنندہ",
    recipient_placeholder: "فون، ای میل یا اکاؤنٹ نمبر",
    amount: "رقم",
    note_optional: "نوٹ (اختیاری)",
    note_placeholder: "یہ کس لیے ہے؟",
    continue: "جاری رکھیں",
    receive_money: "رقم وصول کریں",
    scan_to_pay: "ادائیگی کے لیے اسکین کریں",
    account: "اکاؤنٹ",
    name: "نام",
    copy: "کاپی",
    share: "شیئر",
    profile: "پروفائل",
    preferences: "ترجیحات",
    language: "زبان",
    change_pin: "PIN تبدیل کریں",
    security: "سیکیورٹی",
    notifications: "اطلاعات",
    support: "سپورٹ",
    help: "مدد اور سپورٹ",
    about: "Vortex کے بارے میں",
    logout: "لاگ آؤٹ",
    home: "ہوم",
    history: "تاریخ",
    select_language: "زبان منتخب کریں",
    cancel: "منسوخ",
    tx_detail: "لین دین",
    payment_method: "ادائیگی کا طریقہ",
    status: "حالت",
    date: "تاریخ",
    time: "وقت",
    note: "نوٹ",
    reference: "حوالہ",
    from: "سے",
    to: "کو"
  }
};

let currentLang = localStorage.getItem("vortex_lang") || "en";

function t(key) {
  return translations[currentLang][key] || translations.en[key] || key;
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    el.placeholder = t(key);
  });
  const langEl = document.getElementById("current-lang");
  if (langEl) langEl.textContent = currentLang === "ur" ? "اردو" : "English";
  document.documentElement.dir = currentLang === "ur" ? "rtl" : "ltr";
  document.documentElement.lang = currentLang;
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("vortex_lang", lang);
  applyTranslations();
}
