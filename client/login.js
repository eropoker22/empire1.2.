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
  initMobileLoginFit();
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
      state.requestMobileLoginFit?.();
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
  state.requestMobileLoginFit?.();
}

function hideError() {
  const error = document.getElementById("auth-error");
  if (!error) return;
  error.textContent = "";
  error.classList.add("hidden");
  state.requestMobileLoginFit?.();
}

function initMobileLoginFit() {
  const body = document.body;
  const shell = document.querySelector(".auth-shell");
  const footer = document.querySelector(".auth-footer");
  const stack = document.querySelector(".auth-mobile-fit-stack");
  const media = window.matchMedia("(max-width: 900px)");
  if (!body || !shell || !footer || !stack) return;

  let frame = 0;
  const fitClasses = ["login-mobile-fit-compact", "login-mobile-fit-tight", "login-mobile-fit-ultra"];
  let keyboardEditingLock = false;

  const getOuterHeight = (element) => {
    const rect = element.getBoundingClientRect();
    const styles = window.getComputedStyle(element);
    const marginTop = parseFloat(styles.marginTop || "0") || 0;
    const marginBottom = parseFloat(styles.marginBottom || "0") || 0;
    return rect.height + marginTop + marginBottom;
  };

  const measure = () => {
    frame = 0;
    if (keyboardEditingLock) return;
    fitClasses.forEach((className) => body.classList.remove(className));
    body.style.removeProperty("--login-mobile-fit-scale");
    if (!media.matches) return;

    const availableHeight = Math.max(
      0,
      Math.floor(window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight || 0)
    );
    if (!availableHeight) return;

    const fitsViewport = () => getOuterHeight(stack) <= availableHeight - 4;
    if (fitsViewport()) return;

    body.classList.add("login-mobile-fit-compact");
    if (fitsViewport()) return;

    body.classList.add("login-mobile-fit-tight");
    if (fitsViewport()) return;

    body.classList.add("login-mobile-fit-ultra");
    if (fitsViewport()) return;

    const totalHeight = getOuterHeight(stack);
    if (totalHeight > 0) {
      const scale = Math.max(0.72, Math.min(1, (availableHeight - 4) / totalHeight));
      body.style.setProperty("--login-mobile-fit-scale", scale.toFixed(4));
    }
  };

  const requestMeasure = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(measure);
  };

  state.requestMobileLoginFit = requestMeasure;

  const isEditableField = (element) => {
    if (!(element instanceof HTMLElement)) return false;
    return (
      element instanceof HTMLInputElement
      || element instanceof HTMLTextAreaElement
      || element.isContentEditable
    );
  };

  document.addEventListener("focusin", (event) => {
    if (!media.matches) return;
    if (!isEditableField(event.target)) return;
    keyboardEditingLock = true;
    body.classList.add("login-mobile-keyboard-lock");
  });

  document.addEventListener("focusout", () => {
    if (!media.matches) return;
    window.setTimeout(() => {
      const active = document.activeElement;
      const stillEditing = isEditableField(active);
      keyboardEditingLock = stillEditing;
      body.classList.toggle("login-mobile-keyboard-lock", stillEditing);
      if (!stillEditing) requestMeasure();
    }, 40);
  });

  requestMeasure();
  window.addEventListener("resize", requestMeasure);
  window.addEventListener("orientationchange", requestMeasure);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", requestMeasure);
    window.visualViewport.addEventListener("scroll", requestMeasure);
  }
  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", requestMeasure);
  } else if (typeof media.addListener === "function") {
    media.addListener(requestMeasure);
  }
}
