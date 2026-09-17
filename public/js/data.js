/* ============================================================
   Vortex Wallet — Mock Data + Demo Contacts
   ============================================================ */

const MOCK_TRANSACTIONS = [
  {
    id: "tx_001",
    type: "received",
    title: "Received from Sara Ahmed",
    amount: 15000,
    date: "2026-09-15",
    time: "14:32",
    status: "Completed",
    note: "Rent share"
  },
  {
    id: "tx_002",
    type: "sent",
    title: "Sent to Ali Raza",
    amount: 3500,
    date: "2026-09-14",
    time: "19:15",
    status: "Completed",
    note: "Dinner"
  },
  {
    id: "tx_003",
    type: "received",
    title: "Received from Bank Transfer",
    amount: 50000,
    date: "2026-09-13",
    time: "11:08",
    status: "Completed",
    note: "Salary"
  },
  {
    id: "tx_004",
    type: "sent",
    title: "Sent to JazzCash",
    amount: 2000,
    date: "2026-09-12",
    time: "16:45",
    status: "Completed",
    note: "Mobile load"
  },
  {
    id: "tx_005",
    type: "sent",
    title: "Sent to Usman Malik",
    amount: 8500,
    date: "2026-09-11",
    time: "09:22",
    status: "Completed",
    note: "Project payment"
  },
  {
    id: "tx_006",
    type: "received",
    title: "Received from Fatima Noor",
    amount: 4200,
    date: "2026-09-10",
    time: "21:03",
    status: "Completed",
    note: ""
  }
];

const USER = {
  name: "Ahmed Khan",
  phone: "+92 300 1234567",
  account: "0300-1234567",
  balance: 248650.0,
  currency: "PKR"
};

/** Demo contacts for recipient lookup (normalized phone → profile) */
const DEMO_CONTACTS = {
  "03050000000": { name: "Ali Raza", phone: "0305-0000000", initial: "A" },
  "03000000000": { name: "Sara Ahmed", phone: "0300-0000000", initial: "S" },
  "03211234567": { name: "Usman Malik", phone: "0321-1234567", initial: "U" },
  "03331234567": { name: "Fatima Noor", phone: "0333-1234567", initial: "F" },
  "03451234567": { name: "Hamza Khan", phone: "0345-1234567", initial: "H" },
  "03001234567": { name: "Ahmed Khan (You)", phone: "0300-1234567", initial: "A" }
};

function normalizePhone(raw) {
  if (!raw) return "";
  let d = String(raw).replace(/\D/g, "");
  if (d.startsWith("92") && d.length >= 12) d = "0" + d.slice(2);
  return d;
}

function lookupContact(raw) {
  const key = normalizePhone(raw);
  if (key.length < 11) return null;
  return DEMO_CONTACTS[key] || null;
}
