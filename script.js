/*************************************************
 * CONSTANTS & CONFIGURATION
 *************************************************/
const MAX_TEAMS_PER_BATCH = 12;

const BATCHES = [
  { name: "Batch 1", time: "5:00 PM - 6:00 PM" },
  { name: "Batch 2", time: "6:00 PM - 7:00 PM" },
  { name: "Batch 3", time: "7:00 PM - 9:00 PM" }
];

const ADMIN_CREDS = { mobile: "9113277013", password: "Akash007" };

/*************************************************
 * STORAGE HELPERS
 *************************************************/
function getData(key) { return JSON.parse(localStorage.getItem(key)) || []; }
function setData(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

// Specific getters
function getUsers() { return getData("users"); }
function getMatches() { return getData("matches"); }
function getRegistrations() { return getData("registrations"); }

/*************************************************
 * USER AUTH
 *************************************************/
window.login = function () {
  const mobile = document.getElementById("mobile").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("msg");

  const user = getUsers().find(u => u.mobile === mobile && u.password === password);
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
    window.location.href = "dashboard.html";
  } else {
    msg.innerText = "Invalid credentials";
  }
};

function logout() {
  localStorage.removeItem("user");
  window.location.href = "index.html";
}

function requireLogin() {
  if (!localStorage.getItem("user")) {
    window.location.href = "index.html";
  }
}

/*************************************************
 * ADMIN AUTH
 *************************************************/
function adminLogin() {
  const mobile = document.getElementById("adminMobile").value;
  const password = document.getElementById("adminPassword").value;
  const msg = document.getElementById("msg");

  if (mobile === ADMIN_CREDS.mobile && password === ADMIN_CREDS.password) {
    localStorage.setItem("admin", "true");
    window.location.href = "admin.html";
  } else {
    msg.innerText = "Invalid credentials";
  }
}

function adminLogout() {
  localStorage.removeItem("admin");
  window.location.href = "admin-login.html";
}

function requireAdmin() {
  if (localStorage.getItem("admin") !== "true") {
    window.location.href = "admin-login.html";
  }
}

/*************************************************
 * USER REGISTRATION & RECOVERY
 *************************************************/
function checkMobileStatus() {
  const mobile = document.getElementById("mobile").value.trim();
  const registerBtn = document.getElementById("registerBtn");
  const loginBtn = document.getElementById("loginBtn");
  const msg = document.getElementById("msg");

  registerBtn.style.display = "none";
  loginBtn.style.display = "none";
  msg.innerText = "";

  if (!/^\d{10}$/.test(mobile)) return;

  const users = getUsers();
  if (users.find(u => u.mobile === mobile)) {
    loginBtn.style.display = "block";
    msg.innerText = "Account found. Please Login.";
  } else {
    registerBtn.style.display = "block";
    msg.innerText = "New user? Register now.";
  }
}

function register() {
  const team = document.getElementById("team").value.trim();
  const mobile = document.getElementById("mobile").value.trim();
  const password = document.getElementById("password").value.trim();
  
  if (!team || !mobile || !password) { alert("All fields required"); return; }
  
  let users = getUsers();
  if (users.find(u => u.mobile === mobile)) { alert("User exists"); return; }
  
  users.push({ team, mobile, password });
  setData("users", users);
  
  alert("Registered! Please login.");
  location.reload();
}

function openForgotPassword() {
  const mobile = prompt("Enter your registered mobile number (+91...)");
  if (!mobile) return;

  const users = getUsers();
  const user = users.find(u => u.mobile === mobile);
  if (!user) { alert("Mobile not registered"); return; }

  const otp = Math.floor(100000 + Math.random() * 900000);
  localStorage.setItem("resetOTP", otp);
  localStorage.setItem("resetMobile", mobile);
  
  alert("Your OTP is: " + otp); 
  verifyOTP();
}

function verifyOTP() {
  const enteredOTP = prompt("Enter OTP");
  const realOTP = localStorage.getItem("resetOTP");
  if (enteredOTP !== realOTP) { alert("Invalid OTP"); return; }
  resetPassword();
}

function resetPassword() {
  const newPass = prompt("Enter new password (8+ chars, letters & numbers)");
  if (!newPass) return;

  const passRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  if (!passRegex.test(newPass)) { alert("Password must be 8+ chars with letters & numbers"); return; }

  const users = getUsers();
  const mobile = localStorage.getItem("resetMobile");
  const user = users.find(u => u.mobile === mobile);
  
  user.password = newPass;
  setData("users", users);
  
  localStorage.removeItem("resetOTP");
  localStorage.removeItem("resetMobile");
  alert("Password reset successful. Login now.");
}

/*************************************************
 * DASHBOARD & MATCH DISPLAY (USER SIDE)
 *************************************************/
let pendingMatchId = null; 

function loadMatches() {
  const box = document.getElementById("matches");
  if (!box) return;

  const matches = getMatches();
  const registrations = getRegistrations();
  const user = JSON.parse(localStorage.getItem("user"));
  const regOpen = localStorage.getItem("registrationOpen") === "true";

  if (matches.length === 0) {
    box.innerHTML = `<p style="text-align:center; color:#666;">No matches available.</p>`;
    return;
  }

  box.innerHTML = `
    <div class="notice">
       Everyone must download maps: <b>Bermuda, Purgatory, Kalahari</b>
    </div>
  `;

  matches.forEach(match => {
    const teamsCount = registrations.filter(r => r.matchId === match.id).length;
    const isRegistered = user && registrations.some(r => r.matchId === match.id && r.team === user.team);
    const isFull = teamsCount >= 36;
    const payMode = localStorage.getItem("paymentMode") || "free";
    const priceTag = payMode === "paid" ? "PAID" : "FREE";
    const idpTime = match.time || "TBA"; // New Field

    const div = document.createElement("div");
    div.className = "match-card";
    div.innerHTML = `
      <div style="display:flex; justify-content:space-between;">
        <h3 style="color:var(--primary-blue)">${match.title}</h3>
        <span style="color:${payMode==='paid'?'gold':'#2ecc71'}; font-weight:bold;">${priceTag}</span>
      </div>
      <p>Map: ${match.map}</p>
      <p style="color:#ff4d4d; font-weight:bold;">IDP Time: ${idpTime}</p>
      <p>${teamsCount} / 36 Teams</p>
      
      <button ${!regOpen || isRegistered || isFull ? "disabled" : ""} onclick="initiateRegistration(${match.id})">
        ${!regOpen ? "CLOSED" : isRegistered ? "REGISTERED" : isFull ? "FULL" : "Register"}
      </button>

      <div id="register-form-${match.id}"></div>
      <div id="batch-teams-${match.id}"></div>
    `;
    box.appendChild(div);
    renderBatchTeams(match.id);
  });
}

function initiateRegistration(matchId) {
  const box = document.getElementById(`register-form-${matchId}`);
  box.innerHTML = `
    <div class="register-box">
      <input id="p1-${matchId}" placeholder="Player 1 (IGL)">
      <input id="p2-${matchId}" placeholder="Player 2">
      <input id="p3-${matchId}" placeholder="Player 3">
      <input id="p4-${matchId}" placeholder="Player 4">
      <button onclick="checkPaymentAndSubmit(${matchId})">Submit Team</button>
    </div>
  `;
}

function checkPaymentAndSubmit(matchId) {
  const paymentMode = localStorage.getItem("paymentMode") || "free";
  const p1 = document.getElementById(`p1-${matchId}`).value;
  if (!p1) { alert("Please fill player details"); return; }

  if (paymentMode === "paid") {
    // Show QR Modal logic here (simplified for this script)
    if(confirm("This is a PAID match. Did you scan the QR code?")) {
        submitMatch(matchId);
    }
  } else {
    submitMatch(matchId);
  }
}

function submitMatch(matchId) {
  const user = JSON.parse(localStorage.getItem("user"));
  const p1 = document.getElementById(`p1-${matchId}`).value;
  const p2 = document.getElementById(`p2-${matchId}`).value;
  const p3 = document.getElementById(`p3-${matchId}`).value;
  const p4 = document.getElementById(`p4-${matchId}`).value;

  let regs = getRegistrations();
  
  if (regs.some(r => r.matchId === matchId && r.team === user.team)) {
    alert("Already registered"); return;
  }

  let selectedBatch = null;
  for (let batch of BATCHES) {
    const count = regs.filter(r => r.matchId === matchId && r.batch === batch.name).length;
    if (count < MAX_TEAMS_PER_BATCH) {
      selectedBatch = batch;
      break;
    }
  }

  if(!selectedBatch) { alert("All batches full"); return; }

  regs.push({
    matchId, team: user.team, batch: selectedBatch.name, time: selectedBatch.time,
    players: [p1,p2,p3,p4], paid: (localStorage.getItem("paymentMode")==="paid"),
    registeredAt: new Date().toLocaleString()
  });
  
  setData("registrations", regs);
  alert("Registration Successful!");
  loadMatches();
}

function renderBatchTeams(matchId) {
  const box = document.getElementById(`batch-teams-${matchId}`);
  if (!box) return;

  const registrations = getRegistrations();
  let html = "";

  BATCHES.forEach(batch => {
    const teams = registrations.filter(r => r.matchId === matchId && r.batch === batch.name);
    html += `
      <div class="batch-box" style="margin-top:10px;">
        <h4>${batch.name} (${teams.length}/12)</h4>
        ${ teams.length === 0
            ? `<p style="font-size:12px; color:#aaa;">No teams yet</p>`
            : `<ul>${teams.map((t,i)=>`<li>${i+1}. ${t.team}</li>`).join("")}</ul>`
        }
      </div>
    `;
  });
  box.innerHTML = html;
}

function loadMyMatches() {
  const box = document.getElementById("myMatches");
  if (!box) return;
  const user = JSON.parse(localStorage.getItem("user"));
  const regs = getRegistrations().filter(r => r.team === user.team);

  if (regs.length === 0) {
    box.innerHTML = `<div class="empty-box">No matches yet</div>`;
    return;
  }

  box.innerHTML = "";
  regs.forEach(r => {
    const div = document.createElement("div");
    div.className = "my-match-card";
    div.innerHTML = `
      <h3>${r.team}</h3>
      <p>${r.batch} | ${r.time}</p>
      <p>${r.players.join(", ")}</p>
    `;
    box.appendChild(div);
  });
}

/*************************************************
 * ADMIN PANEL LOGIC (TABS & CRUD)
 *************************************************/

function showTab(tabName) {
  // Hide all contents
  document.querySelectorAll('.tab-content').forEach(d => {
    d.style.display = 'none';
    d.classList.remove('active');
  });
  
  // Remove active from buttons
  document.querySelectorAll('.admin-tabs button').forEach(b => b.classList.remove('active'));

  // Show selected
  const activeContent = document.getElementById(`tab-${tabName}`);
  if(activeContent) {
      activeContent.style.display = 'block';
      activeContent.classList.add('active');
  }

  // Highlight button
  const buttons = document.querySelectorAll('.admin-tabs button');
  buttons.forEach(btn => {
    if(btn.innerText.toLowerCase().includes(tabName.substring(0,4))) {
       btn.classList.add('active');
    }
  });

  loadAdminTabs(tabName);
}

function loadAdminTabs(tabName) {
  if (tabName === 'matches' || !tabName) renderAdminMatches();
  if (tabName === 'users') renderAdminUsers();
  if (tabName === 'teams') renderAdminTeams();
  if (tabName === 'settings') loadPaymentSettings();
}

// --- TAB 1: MATCH MANAGEMENT ---
function saveMatch() {
  const title = document.getElementById("m-title").value;
  const map = document.getElementById("m-map").value;
  const time = document.getElementById("m-time").value; // IDP Time

  if (!title || !map || !time) { alert("Please fill in ALL fields!"); return; }

  const matches = getMatches();
  matches.push({ id: Date.now(), title, map, time });
  setData("matches", matches);

  document.getElementById("m-title").value = "";
  document.getElementById("m-map").value = "";
  document.getElementById("m-time").value = "";

  alert("Match Created Successfully!");
  renderAdminMatches();
}

function renderAdminMatches() {
  const list = document.getElementById("adminMatchList");
  if(!list) return;
  const matches = getMatches();
  list.innerHTML = "";

  if (matches.length === 0) {
    list.innerHTML = `<p style="color:#666; text-align:center;">No matches created yet.</p>`;
    return;
  }

  matches.forEach((m, index) => {
    const div = document.createElement("div");
    div.className = "match-card";
    div.innerHTML = `
      <h3>${m.title}</h3>
      <p style="color:#aaa;">Map: ${m.map}</p>
      <p style="color:#00e5ff;">IDP Time: ${m.time}</p>
      <button onclick="deleteMatch(${index})" 
              style="background:#ff3333; color:white; border:none; padding:8px; border-radius:4px; margin-top:10px; cursor:pointer;">
        Delete Match
      </button>
    `;
    list.appendChild(div);
  });
}

function deleteMatch(index) {
  if (confirm("Delete this match?")) {
    const matches = getMatches();
    matches.splice(index, 1);
    setData("matches", matches);
    renderAdminMatches();
  }
}

// --- TAB 2: USER MANAGEMENT ---
function renderAdminUsers() {
  const list = document.getElementById("adminUserList");
  if(!list) return;
  const users = getUsers();
  list.innerHTML = "";

  if (users.length === 0) {
    list.innerHTML = `<p style="color:#666; text-align:center;">No registered users.</p>`;
    return;
  }

  users.forEach((u, index) => {
    const div = document.createElement("div");
    div.className = "match-card";
    div.innerHTML = `
      <h4 style="color:#3fb8ff">${u.team}</h4>
      <p>Mobile: ${u.mobile} | Pass: ${u.password}</p>
      <button onclick="editUser(${index})" style="padding:5px 10px; margin-right:5px;">Edit Pass</button>
      <button onclick="deleteUser(${index})" style="background:#ff3333; color:white; padding:5px 10px;">Remove</button>
    `;
    list.appendChild(div);
  });
}

function deleteUser(index) {
  const users = getUsers();
  users.splice(index, 1);
  setData("users", users);
  renderAdminUsers();
}

function editUser(index) {
  const users = getUsers();
  const newPass = prompt("Enter new password for " + users[index].team, users[index].password);
  if(newPass) {
    users[index].password = newPass;
    setData("users", users);
    renderAdminUsers();
  }
}

// --- TAB 3: TEAMS & PDF ---
function renderAdminTeams() {
  const list = document.getElementById("adminTeamList");
  if(!list) return;
  const regs = getRegistrations();
  list.innerHTML = "";

  if (regs.length === 0) {
    list.innerHTML = `<p style="color:#666; text-align:center;">No teams registered.</p>`;
    return;
  }

  regs.forEach((r, index) => {
    const div = document.createElement("div");
    div.className = "match-card";
    div.innerHTML = `
      <h4 style="color:#00e5ff">${r.team} <span style="font-size:12px; color:#aaa;">(${r.batch})</span></h4>
      <p style="font-size:12px;">Players: ${r.players.join(", ")}</p>
      <p>Status: ${r.paid ? '<span style="color:gold">PAID</span>' : '<span style="color:#2ecc71">FREE</span>'}</p>
      <button onclick="deleteTeam(${index})" style="background:#ff4d4d; padding:5px; font-size:12px; margin-top:5px;">Remove Team</button>
    `;
    list.appendChild(div);
  });
}

function deleteTeam(index) {
  if(confirm("Remove this team from tournament?")) {
    const regs = getRegistrations();
    regs.splice(index, 1);
    setData("registrations", regs);
    renderAdminTeams();
  }
}

// PDF Logic
function downloadAdminPDF() {
  if (!window.jspdf) { alert("PDF library not loaded"); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const registrations = getRegistrations();
  let y = 10;

  doc.text("Nighthawks FF - Teams Report", 10, y); y += 10;
  
  registrations.forEach((r, i) => {
    doc.text(`${i + 1}. ${r.team} | ${r.batch} | ${r.paid ? 'PAID':'FREE'}`, 10, y); y += 6;
    doc.setFontSize(10);
    doc.text(`   Players: ${r.players.join(", ")}`, 10, y); y += 8;
    doc.setFontSize(16);
    if (y > 280) { doc.addPage(); y = 10; }
  });
  doc.save("nighthawks-teams.pdf");
}

function downloadUsersPDF() {
  if (!window.jspdf) { alert("PDF library not loaded"); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const users = getUsers();
  let y = 10;

  doc.text("Registered Users List", 10, y); y += 10;
  doc.setFontSize(12);
  
  users.forEach((u, i) => {
    doc.text(`${i+1}. ${u.team} | ${u.mobile}`, 10, y); y += 7;
    if (y > 280) { doc.addPage(); y = 10; }
  });
  doc.save("nighthawks-users.pdf");
}

// --- TAB 4: SETTINGS (PAYMENT) ---
function loadPaymentSettings() {
  const mode = localStorage.getItem("paymentMode") || "free";
  const url = localStorage.getItem("qrCodeUrl") || "";
  
  const paySelect = document.getElementById("paymentMode");
  const qrInput = document.getElementById("qrCodeUrl");
  const qrSection = document.getElementById("qrSection");
  const regStatus = document.getElementById("regStatusDisplay");

  if(paySelect) paySelect.value = mode;
  if(qrInput) qrInput.value = url;
  
  if(qrSection) {
    qrSection.style.display = (mode === "paid") ? "block" : "none";
    document.getElementById("previewQR").src = url;
  }
  
  if(regStatus) {
    const open = localStorage.getItem("registrationOpen") === "true";
    regStatus.innerText = open ? "Status: OPEN" : "Status: CLOSED";
    regStatus.style.color = open ? "#2ecc71" : "#ff4d4d";
  }
}

function savePaymentSettings() {
  const mode = document.getElementById("paymentMode").value;
  const url = document.getElementById("qrCodeUrl").value;
  
  localStorage.setItem("paymentMode", mode);
  localStorage.setItem("qrCodeUrl", url);
  loadPaymentSettings();
}

function toggleReg(status) {
  localStorage.setItem("registrationOpen", status);
  loadPaymentSettings();
}

/*************************************************
 * UTILITIES
 *************************************************/
function autoClearAt9PM() {
  const now = new Date();
  if (now.getHours() >= 21) {
    localStorage.setItem("registrationOpen", "false");
    localStorage.removeItem("registrations");
  }
}

function startCountdown() {
    const timerEl = document.getElementById("countdownTimer");
    if (!timerEl) return;
    
    // Set deadline to 9:00 PM today
    const now = new Date();
    const deadline = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 0, 0); 
    
    setInterval(() => {
        const diff = deadline - new Date();
        if (diff <= 0) { timerEl.innerText = "CLOSED"; return; }
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);
        timerEl.innerText = `${h}h ${m}m ${s}s`;
    }, 1000);
}

/*************************************************
 * INITIALIZATION (BOOTSTRAP)
 *************************************************/
document.addEventListener("DOMContentLoaded", () => {
  autoClearAt9PM();

  // 1. Dashboard Logic
  if (document.getElementById("matches")) {
    if(!localStorage.getItem("user")) window.location.href = "index.html";
    loadMatches();
    startCountdown();
  }

  // 2. My Matches Logic
  if (document.getElementById("myMatches")) {
    if(!localStorage.getItem("user")) window.location.href = "index.html";
    loadMyMatches();
  }

  // 3. Admin Panel Logic
  if (document.getElementById("adminMatchList")) {
    requireAdmin();
    showTab('matches'); // Load initial tab
  }
});

/*************************************************
 * GUILD SHOWCASE LOGIC (NEW)
 *************************************************/
function showGuild(guildName) {
  // 1. Hide all slides
  document.querySelectorAll('.guild-slide').forEach(slide => {
    slide.classList.remove('active');
  });

  // 2. Deactivate all buttons
  document.querySelectorAll('.guild-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // 3. Activate selected
  const selectedSlide = document.getElementById(`view-${guildName}`);
  const selectedBtn = document.getElementById(`btn-${guildName}`);
  
  if(selectedSlide) selectedSlide.classList.add('active');
  if(selectedBtn) selectedBtn.classList.add('active');
}

/*************************************************
 * PLAYER CARE & FEEDBACK LOGIC
 *************************************************/

// 1. Toggle the Care Modal (Open/Close)
function toggleCareModal() {
  const modal = document.getElementById("careModal");
  if (!modal) return;
  
  if (modal.style.display === "flex") {
    modal.style.display = "none";
  } else {
    modal.style.display = "flex";
  }
}

// 2. Send Feedback (User Side)
function sendFeedback() {
  const text = document.getElementById("feedbackText").value.trim();
  // Attempt to get user info, default to "Guest" if not logged in
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  
  if (!text) { 
    alert("Please type a message!"); 
    return; 
  }

  // Get existing feedbacks or initialize empty array
  const feedbacks = JSON.parse(localStorage.getItem("feedbacks")) || [];
  
  feedbacks.push({
    id: Date.now(),
    team: user ? user.team : "Guest",
    mobile: user ? user.mobile : "N/A",
    message: text,
    date: new Date().toLocaleString()
  });

  // Save back to storage
  localStorage.setItem("feedbacks", JSON.stringify(feedbacks));
  
  alert("Message Sent! We will contact you shortly.");
  document.getElementById("feedbackText").value = ""; // Clear input
  toggleCareModal(); // Close modal
}

// 3. Load Feedbacks (Admin Panel)
function loadFeedbacks() {
  const list = document.getElementById("adminFeedbackList");
  if (!list) return;
  
  const feedbacks = JSON.parse(localStorage.getItem("feedbacks")) || [];
  list.innerHTML = "";

  if (feedbacks.length === 0) {
    list.innerHTML = `<div class="empty-box" style="text-align:center; padding:20px; color:#666;">No messages yet.</div>`;
    return;
  }

  // Reverse to show newest messages first
  feedbacks.reverse().forEach(f => {
    const div = document.createElement("div");
    div.className = "match-card"; // Reusing the card style for consistency
    div.style.borderLeft = "4px solid #ff00de"; // Pink accent to distinguish feedbacks
    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
        <h4 style="color:#fff; margin:0;">${f.team}</h4>
        <small style="color:#aaa; font-size:12px;">${f.date}</small>
      </div>
      <p style="font-size:13px; color:#00e5ff; margin-bottom:8px;">Mobile: ${f.mobile}</p>
      <div style="background:#111; padding:10px; border-radius:5px; border:1px solid #333; color:#ddd; font-style:italic;">
        "${f.message}"
      </div>
    `;
    list.appendChild(div);
  });
}

// 4. Clear All Feedbacks (Admin Action)
function clearFeedbacks() {
  if (confirm("Are you sure you want to delete ALL messages?")) {
    localStorage.removeItem("feedbacks");
    loadFeedbacks(); // Refresh the list
  }
}

// 5. Integrate with Admin Tabs
// This overrides the existing loadAdminData to include the 'feedbacks' tab
// Ensure this runs AFTER the original definition in your script
if (typeof window.loadAdminData === 'function') {
    const originalLoadAdminData = window.loadAdminData;
    window.loadAdminData = function(tabName) {
        // Run the original logic for matches, users, teams, etc.
        originalLoadAdminData(tabName);
        
        // Add check for new feedback tab
        if (tabName === 'feedbacks') {
            loadFeedbacks();
        }
    };
} else {
    // Fallback if loadAdminData isn't defined globally yet
    window.loadAdminData = function(tabName) {
        if (tabName === 'matches' && typeof renderAdminMatches === 'function') renderAdminMatches();
        if (tabName === 'users' && typeof renderAdminUsers === 'function') renderAdminUsers();
        if (tabName === 'teams' && typeof renderAdminTeams === 'function') renderAdminTeams();
        if (tabName === 'settings' && typeof loadSettings === 'function') loadSettings();
        if (tabName === 'feedbacks') loadFeedbacks();
    };
}