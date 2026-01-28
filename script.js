/*************************************************
 * CONSTANTS
 *************************************************/
const MAX_TEAMS_PER_BATCH = 12;
const BATCHES = [
  { name: "Batch 1", time: "5:00 PM - 6:00 PM" },
  { name: "Batch 2", time: "6:00 PM - 7:00 PM" },
  { name: "Batch 3", time: "7:00 PM - 9:00 PM" }
];

/*************************************************
 * STORAGE HELPERS
 *************************************************/
function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}
function saveUsers(data) {
  localStorage.setItem("users", JSON.stringify(data));
}

function getMatches() {
  return JSON.parse(localStorage.getItem("matches")) || [];
}
function saveMatches(data) {
  localStorage.setItem("matches", JSON.stringify(data));
}

function getRegistrations() {
  return JSON.parse(localStorage.getItem("registrations")) || [];
}
function saveRegistrations(data) {
  localStorage.setItem("registrations", JSON.stringify(data));
}

function isRegistrationOpen() {
  return localStorage.getItem("registrationOpen") === "true";
}

/*************************************************
 * USER AUTH
 *************************************************/



window.login = function () {
  const mobile = document.getElementById("mobile").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("msg");

  if (!mobile || !password) {
    msg.innerText = "Invalid: missed area";
    return;
  }

  const user = getUsers().find(
    u => u.mobile === mobile && u.password === password
  );

  if (!user) {
    msg.innerText = "Invalid login";
    return;
  }

  localStorage.setItem("user", JSON.stringify(user));
  window.location.href = "dashboard.html";
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
const ADMIN = {
  mobile: "9113277013",
  password: "Akash007"
};

function adminLogin() {
  const mobile = document.getElementById("adminMobile").value;
  const password = document.getElementById("adminPassword").value;
  const msg = document.getElementById("msg");

  if (mobile === ADMIN.mobile && password === ADMIN.password) {
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
 * MATCH DISPLAY
 *************************************************/
function loadMatches() {
  const box = document.getElementById("matches");
  if (!box) return;

  const matches = getMatches();
  const registrations = getRegistrations();
  const user = JSON.parse(localStorage.getItem("user"));
  const regOpen = isRegistrationOpen(); // ✅ store once

  box.innerHTML = `
    <div class="notice">
      Everyone must download maps:
      <b>Bermuda, Purgatory, Kalahari</b>
    </div>
  `;

  matches.forEach(match => {
    // total teams across all 3 batches (12 × 3 = 36)
    const totalTeams = registrations.filter(
      r => r.matchId === match.id
    ).length;

    const isRegistered =
      user &&
      registrations.some(
        r => r.matchId === match.id && r.team === user.team
      );

    const isFull = totalTeams >= 36;

    const div = document.createElement("div");
    div.className = "match-card";

    div.innerHTML = `
      <h3>${match.title}</h3>
      <p>Map: ${match.map}</p>
      <p>${totalTeams} / 36 Teams</p>

      <button
        ${!regOpen || isRegistered || isFull ? "disabled" : ""}
        onclick="openRegisterForm(${match.id})"
      >
        ${
          !regOpen
            ? "CLOSED"
            : isRegistered
            ? "REGISTERED"
            : isFull
            ? "FULL"
            : "Register"
        }
      </button>

      <div id="register-form-${match.id}"></div>
      <div id="batch-teams-${match.id}"></div>
    `;

    box.appendChild(div);

    // ✅ show batch-wise teams (Batch 1 / 2 / 3)
    renderBatchTeams(match.id);
  });
}

/*************************************************
 * REGISTRATION FORM
 *************************************************/
function openRegisterForm(matchId) {
  const box = document.getElementById(`register-form-${matchId}`);
  if (!box) return;

  box.innerHTML = `
    <div class="register-box">
      <input id="p1-${matchId}" placeholder="Player 1 (IGL)">
      <input id="p2-${matchId}" placeholder="Player 2">
      <input id="p3-${matchId}" placeholder="Player 3">
      <input id="p4-${matchId}" placeholder="Player 4">
      <button onclick="submitMatch(${matchId})">Submit</button>
    </div>
  `;
}

/*************************************************
 * SUBMIT MATCH (CORE LOGIC)
 *************************************************/
function submitMatch(matchId) {
  if (!isRegistrationOpen()) {
    alert("Registration is closed");
    return;
  }

  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  const p1 = document.getElementById(`p1-${matchId}`).value.trim();
  const p2 = document.getElementById(`p2-${matchId}`).value.trim();
  const p3 = document.getElementById(`p3-${matchId}`).value.trim();
  const p4 = document.getElementById(`p4-${matchId}`).value.trim();

  if (!p1 || !p2 || !p3 || !p4) {
    alert("Invalid: missed area");
    return;
  }

  let registrations = getRegistrations();

  if (registrations.some(r => r.matchId === matchId && r.team === user.team)) {
    alert("Already registered");
    return;
  }

  let selectedBatch = null;

  for (let batch of BATCHES) {
    const count = registrations.filter(
      r => r.matchId === matchId && r.batch === batch.name
    ).length;

    if (count < MAX_TEAMS_PER_BATCH) {
      selectedBatch = batch;
      break;
    }
  }

  if (!selectedBatch) {
    alert("All batches full");
    return;
  }

  registrations.push({
    matchId,
    team: user.team,
    batch: selectedBatch.name,
    time: selectedBatch.time,
    players: [p1, p2, p3, p4],
    registeredAt: new Date().toLocaleString()
  });

  saveRegistrations(registrations);
  loadMatches();
}

/*************************************************
 * BATCH DISPLAY
 *************************************************/
function renderBatchTeams(matchId) {
  const box = document.getElementById(`batch-teams-${matchId}`);
  if (!box) return;

  const registrations = getRegistrations();
  let html = "";

  BATCHES.forEach(batch => {
    const teams = registrations.filter(
      r => r.matchId === matchId && r.batch === batch.name
    );

    html += `
      <div class="batch-box">
        <h4>${batch.name} (${teams.length}/12)</h4>
        ${
          teams.length === 0
            ? `<p>No teams yet</p>`
            : `<ul>${teams.map((t,i)=>`<li>${i+1}. ${t.team}</li>`).join("")}</ul>`
        }
      </div>
    `;
  });

  box.innerHTML = html;
}

/*************************************************
 * MY MATCHES
 *************************************************/
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
 * AUTO CLEAR AT 9 PM
 *************************************************/
function autoClearAt9PM() {
  const now = new Date();
  if (now.getHours() >= 21) {
    localStorage.setItem("registrationOpen", "false");
    localStorage.removeItem("registrations");
  }
}

/*************************************************
 * BOOTSTRAP (ONLY ONE)
 *************************************************/
document.addEventListener("DOMContentLoaded", () => {
  autoClearAt9PM();

  if (document.getElementById("matches")) {
    requireLogin();
    loadMatches();
  }

  if (document.getElementById("myMatches")) {
    requireLogin();
    loadMyMatches();
  }

  if (document.getElementById("adminData")) {
  requireAdmin();
  showRegistrationStatus();
}

});

// STATUS
function showRegistrationStatus() {
  const box = document.getElementById("regStatus");
  if (!box) return;

  const open = localStorage.getItem("registrationOpen") === "true";
  box.innerText = open ? "Registration is OPEN" : "Registration is CLOSED";
}

// OPEN-CLOSE
function openRegistration() {
  localStorage.setItem("registrationOpen", "true");
  showRegistrationStatus();
  loadMatches(); // 🔥 FORCE UI REFRESH
}

function closeRegistration() {
  localStorage.setItem("registrationOpen", "false");
  showRegistrationStatus();
  loadMatches(); // 🔥 FORCE UI REFRESH
}
const regOpen = localStorage.getItem("registrationOpen") === "true";


// ADMIN PANEL
function loadAdminPanel() {
  const box = document.getElementById("adminData");
  if (!box) return;

  requireAdmin();

  const matches = getMatches();
  const registrations = getRegistrations();

  if (registrations.length === 0) {
    box.innerHTML = `<div class="empty-box">No registrations yet</div>`;
    return;
  }

  box.innerHTML = "";

  matches.forEach(match => {
    const matchDiv = document.createElement("div");
    matchDiv.className = "my-match-card";

    matchDiv.innerHTML = `
      <h2>${match.title}</h2>
      <p>Map: ${match.map}</p>
    `;

    ["Batch 1", "Batch 2", "Batch 3"].forEach(batch => {
      const teams = registrations.filter(
        r => r.matchId === match.id && r.batch === batch
      );

      const batchDiv = document.createElement("div");
      batchDiv.style.marginTop = "10px";

      batchDiv.innerHTML = `
        <h4>${batch} (${teams.length}/12)</h4>
        ${
          teams.length === 0
            ? `<p class="empty-text">No teams</p>`
            : `<ul>
                ${teams
                  .map(
                    (t, i) => `
                    <li>
                      <strong>${i + 1}. ${t.team}</strong><br>
                      Players: ${t.players.join(", ")}
                    </li>
                  `
                  )
                  .join("")}
              </ul>`
        }
      `;

      matchDiv.appendChild(batchDiv);
    });

    box.appendChild(matchDiv);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("adminData")) {
    loadAdminPanel();
  }
});

//DOWNLOAD-PDF
function downloadAdminPDF() {
  if (!window.jspdf) {
    alert("PDF library not loaded");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const users = JSON.parse(localStorage.getItem("users")) || [];
  const registrations = JSON.parse(localStorage.getItem("registrations")) || [];

  let y = 10;

  doc.setFontSize(16);
  doc.text("Nighthawks FF - Admin Report", 10, y);
  y += 10;

  doc.setFontSize(12);
  doc.text("USERS", 10, y);
  y += 8;

  users.forEach((u, i) => {
    doc.text(`${i + 1}. ${u.team} | ${u.mobile}`, 10, y);
    y += 6;

    if (y > 280) {
      doc.addPage();
      y = 10;
    }
  });

  y += 10;
  doc.text("REGISTERED TEAMS", 10, y);
  y += 8;

  registrations.forEach((r, i) => {
    doc.text(
      `${i + 1}. ${r.team} | ${r.batch} | ${r.time}`,
      10,
      y
    );
    y += 6;

    r.players.forEach((p, idx) => {
      doc.text(`   Player ${idx + 1}: ${p}`, 12, y);
      y += 5;
    });

    y += 6;

    if (y > 280) {
      doc.addPage();
      y = 10;
    }
  });

  doc.save("nighthawks-registrations.pdf");
}

// USER PDF
function downloadUsersPDF() {
  if (!window.jspdf) {
    alert("PDF library not loaded");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const users = JSON.parse(localStorage.getItem("users")) || [];

  let y = 15;

  doc.setFontSize(16);
  doc.text("Nighthawks FF - Users List", 10, y);
  y += 10;

  if (users.length === 0) {
    doc.setFontSize(12);
    doc.text("No users found", 10, y);
    doc.save("nighthawks-users.pdf");
    return;
  }

  doc.setFontSize(12);

  users.forEach((u, index) => {
    doc.text(
      `${index + 1}. Team: ${u.team} | Mobile: ${u.mobile}`,
      10,
      y
    );
    y += 7;

    if (y > 280) {
      doc.addPage();
      y = 15;
    }
  });

  doc.save("nighthawks-users.pdf");
}

// FORGOT PASSWORD
function openForgotPassword() {
  const mobile = prompt("Enter your registered mobile number (+91...)");
  if (!mobile) return;

  const users = getUsers();
  const user = users.find(u => u.mobile === mobile);

  if (!user) {
    alert("Mobile not registered");
    return;
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000);
  localStorage.setItem("resetOTP", otp);
  localStorage.setItem("resetMobile", mobile);

  // MOCK OTP (frontend only)
  alert("Your OTP is: " + otp);

  verifyOTP();
}

function verifyOTP() {
  const enteredOTP = prompt("Enter OTP");
  const realOTP = localStorage.getItem("resetOTP");

  if (enteredOTP !== realOTP) {
    alert("Invalid OTP");
    return;
  }

  resetPassword();
}

function resetPassword() {
  const newPass = prompt("Enter new password (8+ chars, letters & numbers)");
  if (!newPass) return;

  const passRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  if (!passRegex.test(newPass)) {
    alert("Password must be 8+ chars with letters & numbers");
    return;
  }

  const users = getUsers();

  if (users.find(u => u.password === newPass)) {
    alert("Password already used by another user");
    return;
  }

  const mobile = localStorage.getItem("resetMobile");
  const user = users.find(u => u.mobile === mobile);
  user.password = newPass;

  saveUsers(users);

  localStorage.removeItem("resetOTP");
  localStorage.removeItem("resetMobile");

  alert("Password reset successful. Login now.");
}



// MOB NUM STATUS
function checkMobileStatus() {
  const mobileInput = document.getElementById("mobile");
  const registerBtn = document.getElementById("registerBtn");
  const loginBtn = document.getElementById("loginBtn");
  const msg = document.getElementById("msg");

  const mobile = mobileInput.value.trim();

  registerBtn.style.display = "none";
  loginBtn.style.display = "none";
  msg.innerText = "";

  if (!/^\d{10}$/.test(mobile)) return;

  const users = JSON.parse(localStorage.getItem("users")) || [];
  const exists = users.find(u => u.mobile === mobile);

  if (exists) {
    loginBtn.style.display = "block";
    msg.innerText = "Mobile number found. Please login.";
  } else {
    registerBtn.style.display = "block";
    msg.innerText = "New number detected. Please register.";
  }
}

function register() {
  const team = document.getElementById("team").value.trim();
  const mobile = document.getElementById("mobile").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("msg");

  if (!team || !mobile || !password) {
    msg.innerText = "All fields are required";
    return;
  }

  // ✅ 10 digit India mobile
  if (!/^\d{10}$/.test(mobile)) {
    msg.innerText = "Mobile number must be 10 digits";
    return;
  }

  // ✅ password rules
  if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password)) {
    msg.innerText = "Password must be 8+ chars with letters & numbers";
    return;
  }

  let users = JSON.parse(localStorage.getItem("users")) || [];

  if (users.find(u => u.mobile === mobile)) {
    msg.innerText = "User already exists. Please login.";
    return;
  }

  if (users.find(u => u.password === password)) {
    msg.innerText = "Password already used. Choose another.";
    return;
  }

  users.push({ team, mobile, password });
  localStorage.setItem("users", JSON.stringify(users));

  msg.innerText = "Registered successfully. Now login.";

  document.getElementById("registerBtn").style.display = "none";
  document.getElementById("loginBtn").style.display = "block";
}









