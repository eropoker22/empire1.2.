const API_BASE = "http://localhost:3000";
const GUEST_USERNAME_KEY = "empire_guest_username";
const GUEST_GANG_KEY = "empire_gang_name";

const state = {
  activeTab: "login"
};

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("empire_token")) {
    window.location.href = "faction.html";
    return;
  }

  bindTabs();
  bindForms();
  bindGuest();
});

function bindTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      state.activeTab = tab;
      document.querySelectorAll(".tab-btn").forEach((b) =>
        b.classList.toggle("tab-btn--active", b.dataset.tab === tab)
      );
      document.getElementById("login-form").classList.toggle("hidden", tab !== "login");
      document.getElementById("register-form").classList.toggle("hidden", tab !== "register");
    });
  });
}

function bindForms() {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value.trim();

    const result = await post(`${API_BASE}/auth/login`, { username, password });
    if (result?.token) {
      hideError();
      localStorage.removeItem(GUEST_USERNAME_KEY);
      localStorage.removeItem(GUEST_GANG_KEY);
      localStorage.setItem("empire_token", result.token);
      window.location.href = "faction.html";
    } else {
      showError("Přihlášení se nezdařilo. Zkontroluj údaje.");
    }
  });

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("register-username").value.trim();
    const gangName = document.getElementById("register-gang").value.trim();
    const password = document.getElementById("register-password").value.trim();

    const result = await post(`${API_BASE}/auth/register`, { username, gangName, password });
    if (result?.token) {
      hideError();
      localStorage.removeItem(GUEST_USERNAME_KEY);
      localStorage.setItem(GUEST_GANG_KEY, gangName);
      localStorage.setItem("empire_token", result.token);
      window.location.href = "faction.html";
    } else {
      showError("Registrace se nezdařila. Zkus jiné jméno.");
    }
  });
}

function bindGuest() {
  const btn = document.getElementById("guest-btn");
  const guestUsernameInput = document.getElementById("guest-username");
  const guestGangInput = document.getElementById("guest-gang");
  if (!btn || !guestUsernameInput || !guestGangInput) return;

  const continueAsGuest = () => {
    const username = sanitizeGuestValue(guestUsernameInput.value, 24);
    const gangName = sanitizeGuestValue(guestGangInput.value, 32);

    if (!username || !gangName) {
      showError("Pro hosta vyplň nick i název gangu.");
      return;
    }

    hideError();
    localStorage.removeItem("empire_token");
    localStorage.removeItem("empire_structure");
    localStorage.setItem(GUEST_USERNAME_KEY, username);
    localStorage.setItem(GUEST_GANG_KEY, gangName);
    window.location.href = "faction.html";
  };

  btn.addEventListener("click", () => {
    continueAsGuest();
  });
  [guestUsernameInput, guestGangInput].forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      continueAsGuest();
    });
  });
}

function sanitizeGuestValue(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

async function post(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return res.json();
}

function showError(message) {
  const error = document.getElementById("auth-error");
  if (!error) return;
  error.textContent = message;
  error.classList.remove("hidden");
}

function hideError() {
  const error = document.getElementById("auth-error");
  if (!error) return;
  error.textContent = "";
  error.classList.add("hidden");
}
