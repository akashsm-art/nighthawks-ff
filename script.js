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

// ---------- LOGOUT ----------
window.logout = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("teamDisplay");
  window.location.href = "index.html";
};

// ======================================
// MATCH SYSTEM (12 TEAMS TOTAL)
// ======================================

// ---------- MATCH DATA ----------
const matches = [
  {
    id: 1,
    title: "Free Fire Scrim #101",
    map: "Bermuda",
    batches: [
      { name: "Batch 1", time: "5:00 PM", limit: 4 },
      { name: "Batch 2", time: "6:00 PM", limit: 4 },
      { name: "Batch 3", time: "7:00 PM", limit: 4 }
    ]
  }
];

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

  matchBox.innerHTML = `
    <div class="notice">
      Everyone must download maps:
      <b>Bermuda, Purgatory, Kalahari</b>
    </div>
  `;

  matches.forEach(match => {
    const div = document.createElement("div");
    div.className = "match-card";

    div.innerHTML = `
      <h3>${match.title}</h3>
      <p>Map: ${match.map}</p>
      <p>Total Teams: 12</p>

      <button onclick="openRegisterForm(${match.id})">Register</button>
      <div id="register-form-${match.id}"></div>
    `;

    matchBox.appendChild(div);
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

  alert(`Registered successfully\n${batch.name} - ${batch.time}`);
  location.reload();
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
