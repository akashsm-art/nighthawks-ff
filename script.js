// ======================================
// AUTH SYSTEM (MOCK)
// ======================================

// ---------- REGISTER ----------
window.register = () => {
  const team = document.getElementById("team").value.trim();
  const mobile = document.getElementById("mobile").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("msg");

  if (!team || !mobile || !password) {
  showAuthError("Invalid: missed area");
  return;
}


  let users = JSON.parse(localStorage.getItem("users")) || [];

  if (users.find(u => u.mobile === mobile)) {
    showAuthError("Already exists");
    return;
  }

  users.push({ team, mobile, password });
  localStorage.setItem("users", JSON.stringify(users));

  msg.innerText = "Registered successfully. Login now.";
};


//ADMIN MOBILE NO

const ADMIN_MOBILE = "9113277013"; // CHANGE THIS

const ADMIN_CREDENTIALS = {
  mobile: "9113277013",   // CHANGE THIS
  password: "Akash007"    // CHANGE THIS
};

function adminLogout() {
  localStorage.removeItem("admin");
  window.location.href = "admin-login.html";
}


// ---------- LOGIN ----------
window.login = () => {
  setLoginLoading(true);
  const mobile = document.getElementById("mobile").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("msg");

 if (!mobile || !password) {
  setLoginLoading(false);          // ⛔ STOP animation
  showAuthError("Invalid: missed area");
  return;
}


  let users = JSON.parse(localStorage.getItem("users")) || [];
  const user = users.find(
    u => u.mobile === mobile && u.password === password
  );

  if (!user) {
  setLoginLoading(false);          // ⛔ STOP animation
  showAuthError("Invalid login");
  return;
}


  setLoginLoading(false);
  localStorage.setItem("user", JSON.stringify(user));

  showLoginSuccess(() => {
  window.location.href = "dashboard.html";
});

};

function adminLogin() {
  const mobile = document.getElementById("adminMobile").value;
  const password = document.getElementById("adminPassword").value;
  const msg = document.getElementById("msg");

  if (!mobile || !password) {
    msg.innerText = "Invalid credentials";
    return;
  }

  if (
    mobile === ADMIN_CREDENTIALS.mobile &&
    password === ADMIN_CREDENTIALS.password
  ) {
    localStorage.setItem("admin", "true");
    window.location.href = "admin.html";
  } else {
    msg.innerText = "Invalid credentials";
  }
}

function requireAdminLogin() {
  const isAdmin = localStorage.getItem("admin");
  if (!isAdmin) {
    window.location.href = "admin-login.html";
  }
}


// ---------- LOGOUT ----------
window.logout = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("teamDisplay");
  window.location.href = "index.html";
};

function logout() {
  localStorage.removeItem("user");
  window.location.href = "index.html";
}


// ======================================
// MATCH SYSTEM (12 TEAMS TOTAL)
// ======================================

// ---------- MATCH DATA ----------
function getMatches() {
  return JSON.parse(localStorage.getItem("matches")) || [];
}


// ---------- PAGE LOAD ----------
window.onload = () => {
  showTeamTopRight();
  loadMatches();
};

// ---------- SHOW TEAM + LOGO (TOP RIGHT) ----------
function showTeamTopRight() {
  const box = document.getElementById("team-info");
  if (!box) return;

  const data = JSON.parse(localStorage.getItem("teamDisplay"));
  if (!data) return;

  box.innerHTML = `
    ${data.logo ? `<img src="${data.logo}" class="team-logo">` : ""}
    <span class="team-name">${data.team}</span>
  `;
}

// ---------- LOAD MATCHES ----------
function loadMatches() {
  const matchBox = document.getElementById("matches");
  if (!matchBox) return;

  const registrations =
    JSON.parse(localStorage.getItem("registrations")) || [];

  const user = JSON.parse(localStorage.getItem("user"));

  matchBox.innerHTML = `
    <div class="notice">
      Everyone must download maps:
      <b>Bermuda, Purgatory, Kalahari</b>
    </div>
  `;

  getMatches().forEach(match => {
    const registeredCount = registrations.filter(
      r => r.matchId === match.id
    ).length;

    const isFull = registeredCount >= 12;

    const isRegistered =
      user &&
      registrations.some(
        r => r.matchId === match.id && r.team === user.team
      );

    const div = document.createElement("div");
    div.className = "match-card";

    div.innerHTML = `
      ${isRegistered ? `<div class="registered-badge">Registered</div>` : ""}

      <h3>${match.title}</h3>
      <p>Map: ${match.map}</p>

      <div class="slot-row">
        <span class="slot-count" data-count="${registeredCount}">0</span>
        <span class="slot-total">/ 12 Teams</span>
      </div>

      <button
        ${isFull || isRegistered ? "disabled" : ""}
        class="${isFull ? "full-btn" : isRegistered ? "registered-btn" : ""}"
        onclick="openRegisterForm(${match.id})"
      >
        ${isFull ? "FULL" : isRegistered ? "REGISTERED" : "Register"}
      </button>

      <div id="register-form-${match.id}"></div>
    `;

    matchBox.appendChild(div);

    animateSlotCount(
      div.querySelector(".slot-count"),
      registeredCount
    );
  });
}


// ---------- OPEN INLINE REGISTER FORM ----------
window.openRegisterForm = (matchId) => {
  const box = document.getElementById(`register-form-${matchId}`);

  if (box.innerHTML !== "") {
    box.innerHTML = "";
    return;
  }

  box.innerHTML = `
    <div class="register-box">
      <h4>Match Registration</h4>

      <label>Player 1 UID (IGL)</label>
      <input id="uid1-${matchId}" placeholder="Player 1 UID">

      <label>Player 2 UID</label>
      <input id="uid2-${matchId}" placeholder="Player 2 UID">

      <label>Player 3 UID</label>
      <input id="uid3-${matchId}" placeholder="Player 3 UID">

      <label>Player 4 UID</label>
      <input id="uid4-${matchId}" placeholder="Player 4 UID">

      <div class="igl-box">Player 1 is the IGL</div>

      <label>Upload Team Logo (optional)</label>
      <input type="file" id="logo-${matchId}" accept="image/*">

      <button onclick="submitMatch(${matchId})">
        Submit Registration
      </button>
    </div>
  `;
};

// ---------- SUBMIT MATCH REGISTRATION ----------
window.submitMatch = (matchId) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    alert("Login required");
    return;
  }

  let registrations =
    JSON.parse(localStorage.getItem("registrations")) || [];

  const match = matches.find(m => m.id === matchId);

  if (registrations.find(r => r.matchId === matchId && r.team === user.team)) {
    alert("Your team already registered");
    return;
  }

  let selectedBatch = null;
  for (let batch of match.batches) {
    const count = registrations.filter(
      r => r.matchId === matchId && r.batch === batch.name
    ).length;

    if (count < batch.limit) {
      selectedBatch = batch;
      break;
    }
  }

  if (!selectedBatch) {
    alert("Match full");
    return;
  }

  const igl = document.getElementById(`uid1-${matchId}`).value.trim();
  const p2 = document.getElementById(`uid2-${matchId}`).value.trim();
  const p3 = document.getElementById(`uid3-${matchId}`).value.trim();
  const p4 = document.getElementById(`uid4-${matchId}`).value.trim();

  if (!igl || !p2 || !p3 || !p4) {
    alert("Invalid: missed area");
    return;
  }

  const logoInput = document.getElementById(`logo-${matchId}`);

  if (logoInput.files[0]) {
    const reader = new FileReader();
    reader.onload = () => {
      saveRegistration(matchId, user.team, selectedBatch, [igl, p2, p3, p4], reader.result);
    };
    reader.readAsDataURL(logoInput.files[0]);
  } else {
    saveRegistration(matchId, user.team, selectedBatch, [igl, p2, p3, p4], null);
  }
};

// ---------- SAVE REGISTRATION ----------
function saveRegistration(matchId, team, batch, players, logo) {
  let registrations =
    JSON.parse(localStorage.getItem("registrations")) || [];

  registrations.push({
    matchId,
    team,
    batch: batch.name,
    time: batch.time,
    igl: players[0],
    players,
    registeredAt: new Date().toLocaleString()
  });

  localStorage.setItem("registrations", JSON.stringify(registrations));

  localStorage.setItem(
    "teamDisplay",
    JSON.stringify({ team, logo })
  );

  
}

function showAuthError(message) {
  const card = document.querySelector(".auth-card");
  const msg = document.getElementById("msg");

  if (msg) msg.innerText = message;

  if (card) {
    card.classList.remove("shake", "error");
    // reflow to restart animation
    void card.offsetWidth;
    card.classList.add("shake", "error");

    setTimeout(() => {
      card.classList.remove("error");
    }, 600);
  }
}



function setLoginLoading(isLoading) {
  const btn = document.getElementById("loginBtn");
  if (!btn) return;

  if (isLoading) {
    btn.classList.add("loading");
    btn.innerText = "Logging in...";
  } else {
    btn.classList.remove("loading");
    btn.innerText = "Login";
  }
}

function showLoginSuccess(callback) {
  const overlay = document.createElement("div");
  overlay.className = "success-overlay";

  overlay.innerHTML = `
    <div class="success-circle">
      <div class="success-check"></div>
    </div>
  `;

  document.body.appendChild(overlay);

  setTimeout(() => {
    overlay.remove();
    if (callback) callback();
  }, 900);
}

function requireLogin() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    window.location.href = "index.html";
  }
}

function requireAdmin() {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || user.mobile !== ADMIN_MOBILE) {
    window.location.href = "dashboard.html";
  }
}


// ======================================
// MY MATCHES PAGE
// ======================================

function loadMyMatches() {
  const box = document.getElementById("myMatches");
  if (!box) return;

  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    box.innerHTML = `<div class="empty-box">Please login first</div>`;
    return;
  }

  const registrations =
    JSON.parse(localStorage.getItem("registrations")) || [];

  const myRegs = registrations.filter(
    r => r.team === user.team
  );

  if (myRegs.length === 0) {
    box.innerHTML = `
      <div class="empty-box">
        You have not registered for any matches yet
      </div>
    `;
    return;
  }

  box.innerHTML = "";

  myRegs.forEach(reg => {
    const div = document.createElement("div");
    div.className = "my-match-card";

    div.innerHTML = `
      <h3>${reg.team}</h3>

      <p><b>Match:</b> Free Fire Scrim</p>
      <p><b>Batch:</b> ${reg.batch}</p>
      <p><b>Time:</b> ${reg.time}</p>

      <p><b>Players:</b></p>
      <ul>
        <li><b>${reg.players[0]}</b> (IGL)</li>
        <li>${reg.players[1]}</li>
        <li>${reg.players[2]}</li>
        <li>${reg.players[3]}</li>
      </ul>

      <p><small>Registered at: ${reg.registeredAt}</small></p>
    `;

    box.appendChild(div);
  });
}

window.onload = () => {

  if (document.getElementById("adminData")) {
    requireAdminLogin();
    loadAdminPanel();
  }

  if (
    document.getElementById("matches") ||
    document.getElementById("myMatches")
  ) {
    requireLogin();
  }

  if (document.getElementById("matches")) {
    loadMatches();
  }

  if (document.getElementById("myMatches")) {
    loadMyMatches();
  }
};



function showSuccessAnimation() {
  const overlay = document.createElement("div");
  overlay.className = "success-overlay";

  overlay.innerHTML = `
    <div class="success-circle">
      <div class="success-check"></div>
    </div>
  `;

  document.body.appendChild(overlay);

  setTimeout(() => {
    overlay.remove();
    location.reload();
  }, 1300);
}



function loadAdminPanel() {
  const box = document.getElementById("adminData");
  if (!box) return;

  requireAdmin();

  const registrations =
    JSON.parse(localStorage.getItem("registrations")) || [];

  if (registrations.length === 0) {
    box.innerHTML = `<div class="empty-box">No registrations yet</div>`;
    return;
  }

  box.innerHTML = "";

  registrations.forEach((r, index) => {
    const div = document.createElement("div");
    div.className = "my-match-card";

    div.innerHTML = `
      <h3>${index + 1}. ${r.team}</h3>

      <p><b>Match:</b> Free Fire Scrim</p>
      <p><b>Batch:</b> ${r.batch}</p>
      <p><b>Time:</b> ${r.time}</p>

      <p><b>Players:</b></p>
      <ul>
        <li><b>${r.players[0]}</b> (IGL)</li>
        <li>${r.players[1]}</li>
        <li>${r.players[2]}</li>
        <li>${r.players[3]}</li>
      </ul>

      <p><small>Registered at: ${r.registeredAt}</small></p>
    `;

    box.appendChild(div);
  });
}

//MATCH CREATION LOGIC

function addMatch() {
  const title = document.getElementById("matchTitle").value.trim();
  const map = document.getElementById("matchMap").value.trim();
  const b1 = document.getElementById("b1").value.trim();
  const b2 = document.getElementById("b2").value.trim();
  const b3 = document.getElementById("b3").value.trim();
  const msg = document.getElementById("adminMsg");

  if (!title || !map || !b1 || !b2 || !b3) {
    msg.innerText = "Please fill all fields";
    return;
  }

  const matches =
    JSON.parse(localStorage.getItem("matches")) || [];

  const newMatch = {
    id: Date.now(),
    title,
    map,
    batches: [
      { name: "Batch 1", time: b1, limit: 4 },
      { name: "Batch 2", time: b2, limit: 4 },
      { name: "Batch 3", time: b3, limit: 4 }
    ]
  };

  matches.push(newMatch);
  localStorage.setItem("matches", JSON.stringify(matches));

  msg.innerText = "Match added successfully";

  document.getElementById("matchTitle").value = "";
  document.getElementById("matchMap").value = "";
  document.getElementById("b1").value = "";
  document.getElementById("b2").value = "";
  document.getElementById("b3").value = "";
}
