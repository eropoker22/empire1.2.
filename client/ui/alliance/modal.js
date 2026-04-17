window.Empire = window.Empire || {};
window.Empire.UIAlliance = window.Empire.UIAlliance || {};

window.Empire.UIAlliance.createAllianceModalController = function createAllianceModalController(deps = {}) {
  const {
    DEFAULT_ALLIANCE_ICON_KEY,
    DEFAULT_ALLIANCE_DESCRIPTION,
    ALLIANCE_ICON_OPTIONS,
    ALLIANCE_MAX_MEMBERS,
    getAllianceRefreshHandler = () => null,
    setAllianceRefreshHandler = () => {},
    getAllianceCountdownIntervalId = () => null,
    setAllianceCountdownIntervalId = () => {},
    setMobileTopbarCoveredByPrimaryModal = () => {},
    isBlackoutLikeScenario = () => false,
    getLocalAllianceState = () => ({}),
    saveLocalAllianceState = () => {},
    withActiveAlliance = (state) => state,
    renderAllianceChat = () => {},
    renderGlobalServerChat = () => {},
    setLiveAllianceOwnersFromAlliance = () => {},
    syncBlackoutScenarioAllianceDistrictState = () => {},
    syncGuestAllianceLabel = () => {},
    pushEvent = () => {},
    appendLocalAllianceChat = () => {},
    resolveCurrentServerChatAuthorName = () => "Ty",
    appendLocalServerChatMessage = () => {},
    createLocalAlliance = () => ({}),
    leaveLocalAlliance = () => {},
    sendLocalAllianceManagementInvite = () => ({}),
    formatAllianceError = (value) => String(value || ""),
    updateProfile = () => {},
    computeLocalAllianceReadyState = () => ({ isReadyWindowActive: false, readyDueAt: null, isReadyOverdue: true }),
    formatAllianceDueLabelSeconds = () => "00:00:00",
    renderAllianceIdentityMarkup = () => "",
    renderAllianceMemberCard = () => "",
    bindAllianceMemberAvatarLightbox = () => {},
    getAllianceMemberVisualData = () => ({ sectorLabel: "0 sektorů", faction: "-", avatar: "", color: null }),
    escapeAllianceMarkup = (value) => String(value || ""),
    formatAllianceRelativeTime = () => "-",
    markLocalAllianceReady = () => ({}),
    respondToLocalAllianceMemberInvite = () => ({}),
    requestLocalAllianceInvite = () => ({}),
    respondToLocalAllianceRequest = () => ({}),
    removeLocalAllianceMember = () => ({}),
    startLocalAllianceKickVote = () => ({}),
    castLocalAllianceKickVote = () => ({})
  } = deps;

  function clearAllianceRefreshInterval() {
    const intervalId = getAllianceCountdownIntervalId();
    if (intervalId) {
      window.clearInterval(intervalId);
      setAllianceCountdownIntervalId(null);
    }
  }

  function initAllianceModal() {
    const openBtn = document.getElementById("alliance-btn");
    const root = document.getElementById("alliance-modal");
    const backdrop = document.getElementById("alliance-modal-backdrop");
    const closeBtn = document.getElementById("alliance-modal-close");
    const createToggleBtn = document.getElementById("alliance-create-toggle-btn");
    const leaveModal = document.getElementById("alliance-leave-modal");
    const leaveModalBackdrop = document.getElementById("alliance-leave-modal-backdrop");
    const leaveModalCloseBtn = document.getElementById("alliance-leave-modal-close");
    const leaveCancelBtn = document.getElementById("alliance-leave-cancel-btn");
    const leaveConfirmBtn = document.getElementById("alliance-leave-confirm-btn");
    const createModal = document.getElementById("alliance-create-modal");
    const createModalBackdrop = document.getElementById("alliance-create-modal-backdrop");
    const createModalCloseBtn = document.getElementById("alliance-create-modal-close");
    const managementModal = document.getElementById("alliance-management-modal");
    const managementModalBackdrop = document.getElementById("alliance-management-modal-backdrop");
    const managementModalCloseBtn = document.getElementById("alliance-management-modal-close");
    const managementInviteName = document.getElementById("alliance-management-invite-name");
    const managementInviteBtn = document.getElementById("alliance-management-invite-btn");
    const createBtn = document.getElementById("alliance-create-btn");
    const leaveBtn = document.getElementById("alliance-leave-btn");
    const createName = document.getElementById("alliance-create-name");
    const createDescription = document.getElementById("alliance-create-description");
    const iconPicker = document.getElementById("alliance-icon-picker");
    const chatInput = document.getElementById("alliance-chat-input");
    const chatSend = document.getElementById("alliance-chat-send");
    const activePanel = document.getElementById("alliance-active-panel");
    if (!root || !openBtn || !createToggleBtn || !leaveModal || !leaveConfirmBtn || !createModal || !managementModal || !managementInviteName || !managementInviteBtn || !createBtn || !leaveBtn || !createName || !createDescription || !iconPicker || !chatInput || !chatSend) return;

    let selectedAllianceIconKey = DEFAULT_ALLIANCE_ICON_KEY;

    const resetCreateAllianceForm = () => {
      createName.value = "";
      createDescription.value = DEFAULT_ALLIANCE_DESCRIPTION;
      selectedAllianceIconKey = DEFAULT_ALLIANCE_ICON_KEY;
      renderAllianceIconPicker();
    };

    const setCreateAllianceModalVisible = (visible) => {
      createModal.classList.toggle("hidden", !visible);
      if (visible) {
        window.requestAnimationFrame(() => createName.focus());
      }
    };

    const setAllianceManagementModalVisible = (visible) => {
      managementModal.classList.toggle("hidden", !visible);
      if (visible) {
        window.requestAnimationFrame(() => managementInviteName.focus());
      }
    };

    const setAllianceLeaveModalVisible = (visible) => {
      leaveModal.classList.toggle("hidden", !visible);
      if (visible) {
        window.requestAnimationFrame(() => leaveConfirmBtn.focus());
      }
    };

    const captureAllianceScrollState = () => ({
      modalBody: root.querySelector(".alliance-modal__body")?.scrollTop || 0,
      members: document.querySelector("#alliance-active-panel .alliance-members")?.scrollTop || 0,
      managementBody: managementModal.querySelector(".alliance-management-modal__body")?.scrollTop || 0,
      managementPanel: document.getElementById("alliance-management-panel")?.scrollTop || 0
    });

    const restoreAllianceScrollState = (scrollState) => {
      if (!scrollState) return;
      const modalBody = root.querySelector(".alliance-modal__body");
      const members = document.querySelector("#alliance-active-panel .alliance-members");
      const managementBody = managementModal.querySelector(".alliance-management-modal__body");
      const managementPanel = document.getElementById("alliance-management-panel");
      if (modalBody) modalBody.scrollTop = Number(scrollState.modalBody || 0);
      if (members) members.scrollTop = Number(scrollState.members || 0);
      if (managementBody) managementBody.scrollTop = Number(scrollState.managementBody || 0);
      if (managementPanel) managementPanel.scrollTop = Number(scrollState.managementPanel || 0);
    };

    const renderAllianceIconPicker = () => {
      iconPicker.innerHTML = ALLIANCE_ICON_OPTIONS.map((icon) => `
        <button
          type="button"
          class="alliance-icon-option${icon.key === selectedAllianceIconKey ? " is-selected" : ""}"
          data-alliance-icon-key="${icon.key}"
          title="${icon.label}"
          aria-label="${icon.label}"
        >
          <span class="alliance-icon-option__symbol">${icon.symbol}</span>
        </button>
      `).join("");
      iconPicker.querySelectorAll("[data-alliance-icon-key]").forEach((button) => {
        button.addEventListener("click", () => {
          selectedAllianceIconKey = button.getAttribute("data-alliance-icon-key") || DEFAULT_ALLIANCE_ICON_KEY;
          renderAllianceIconPicker();
        });
      });
    };

    const refreshAlliance = async () => {
      const scrollState = captureAllianceScrollState();
      if (!window.Empire.token) {
        const localState = getLocalAllianceState();
        const activeAllianceId = String(localState.activeAllianceId || "").trim();
        if (!isBlackoutLikeScenario() && activeAllianceId.startsWith("scenario-")) {
          localState.activeAllianceId = null;
          saveLocalAllianceState(localState);
        }
        const resolvedLocalState = withActiveAlliance(localState);
        renderAllianceState(resolvedLocalState.activeAlliance, resolvedLocalState.alliances, resolvedLocalState.incomingInvites || []);
        renderAllianceManagementState(resolvedLocalState.activeAlliance);
        renderAllianceChat(resolvedLocalState.chat);
        renderGlobalServerChat();
        setLiveAllianceOwnersFromAlliance(resolvedLocalState.activeAlliance || null);
        syncBlackoutScenarioAllianceDistrictState(resolvedLocalState.activeAlliance || null);
        syncGuestAllianceLabel(resolvedLocalState.activeAlliance?.name || "Žádná");
        restoreAllianceScrollState(scrollState);
        (resolvedLocalState.notifications || []).forEach((notification) => {
          pushEvent(`Aliance: ${notification.message}`);
        });
        if ((resolvedLocalState.notifications || []).length) {
          resolvedLocalState.notifications = [];
          saveLocalAllianceState(resolvedLocalState);
        }
        return;
      }
      const [mine, listing] = await Promise.all([
        window.Empire.API.getAlliance(),
        window.Empire.API.listAlliances()
      ]);
      renderAllianceState(mine.alliance || null, listing.alliances || [], mine.incomingInvites || []);
      renderAllianceManagementState(mine.alliance || null);
      renderAllianceChat([]);
      renderGlobalServerChat();
      setLiveAllianceOwnersFromAlliance(mine.alliance || null);
      restoreAllianceScrollState(scrollState);
      (mine.notifications || []).forEach((notification) => {
        pushEvent(`Aliance: ${notification.message}`);
      });
    };
    setAllianceRefreshHandler(refreshAlliance);

    const sendAllianceChatMessage = async (input) => {
      const targetInput = input instanceof HTMLInputElement ? input : null;
      const text = String(targetInput?.value || "").trim();
      if (!text) return;
      if (window.Empire.token) {
        pushEvent("Alliance chat backend zatím není napojený.");
        return;
      }
      const state = getLocalAllianceState();
      appendLocalAllianceChat(state, {
        author: "Ty",
        text
      });
      saveLocalAllianceState(state);
      document.querySelectorAll("[data-alliance-chat-input]").forEach((field) => {
        if (field instanceof HTMLInputElement) {
          field.value = "";
        }
      });
      renderAllianceChat(state.chat);
    };

    const sendGlobalChatMessage = async (input) => {
      const targetInput = input instanceof HTMLInputElement ? input : null;
      const text = String(targetInput?.value || "").trim();
      if (!text) return;
      appendLocalServerChatMessage({
        author: resolveCurrentServerChatAuthorName(),
        text
      });
      document.querySelectorAll("[data-global-chat-input]").forEach((field) => {
        if (field instanceof HTMLInputElement) {
          field.value = "";
        }
      });
      renderGlobalServerChat();
    };

    openBtn.addEventListener("click", async () => {
      setMobileTopbarCoveredByPrimaryModal(false);
      root.classList.remove("hidden");
      setCreateAllianceModalVisible(false);
      setAllianceManagementModalVisible(false);
      document.dispatchEvent(new CustomEvent("empire:alliance-modal-opened", {
        detail: {
          open: true
        }
      }));
      resetCreateAllianceForm();
      await refreshAlliance();
      clearAllianceRefreshInterval();
      setAllianceCountdownIntervalId(window.setInterval(() => {
        const refreshHandler = getAllianceRefreshHandler();
        if (!root.classList.contains("hidden") && refreshHandler) {
          refreshHandler().catch(() => {});
        }
      }, 10000));
    });
    createToggleBtn.addEventListener("click", () => {
      setCreateAllianceModalVisible(true);
    });
    createBtn.addEventListener("click", async () => {
      const name = String(createName.value || "").trim();
      const description = String(createDescription.value || "").trim();
      if (!name) {
        pushEvent("Zadej název aliance.");
        return;
      }
      if (!window.Empire.token) {
        const state = getLocalAllianceState();
        const newAlliance = createLocalAlliance(state, {
          name,
          description,
          iconKey: selectedAllianceIconKey
        });
        saveLocalAllianceState(state);
        pushEvent(`Aliance ${newAlliance.name} byla vytvořena.`);
        await refreshAlliance();
        syncGuestAllianceLabel(newAlliance.name);
        setCreateAllianceModalVisible(false);
        resetCreateAllianceForm();
        return;
      }
      const result = await window.Empire.API.createAlliance(name, description, selectedAllianceIconKey);
      if (result.error) {
        pushEvent(`Aliance: ${result.error}`);
        return;
      }
      pushEvent("Aliance byla vytvořena.");
      await refreshAlliance();
      setCreateAllianceModalVisible(false);
      resetCreateAllianceForm();
      const profile = await window.Empire.API.getProfile();
      updateProfile(profile);
    });
    leaveBtn.addEventListener("click", async () => {
      setAllianceLeaveModalVisible(true);
    });
    leaveConfirmBtn.addEventListener("click", async () => {
      if (!window.Empire.token) {
        const state = getLocalAllianceState();
        leaveLocalAlliance(state);
        saveLocalAllianceState(state);
        pushEvent("Alianci jsi opustil.");
        await refreshAlliance();
        syncGuestAllianceLabel("Žádná");
        setAllianceLeaveModalVisible(false);
        return;
      }
      const result = await window.Empire.API.leaveAlliance();
      if (result.error) {
        pushEvent(`Aliance: ${result.error}`);
        return;
      }
      pushEvent("Alianci jsi opustil.");
      await refreshAlliance();
      setAllianceLeaveModalVisible(false);
      const profile = await window.Empire.API.getProfile();
      updateProfile(profile);
    });
    if (leaveModalBackdrop) leaveModalBackdrop.addEventListener("click", () => setAllianceLeaveModalVisible(false));
    if (leaveModalCloseBtn) leaveModalCloseBtn.addEventListener("click", () => setAllianceLeaveModalVisible(false));
    if (leaveCancelBtn) leaveCancelBtn.addEventListener("click", () => setAllianceLeaveModalVisible(false));
    if (backdrop) backdrop.addEventListener("click", () => {
      root.classList.add("hidden");
      setAllianceLeaveModalVisible(false);
      setCreateAllianceModalVisible(false);
      setAllianceManagementModalVisible(false);
      clearAllianceRefreshInterval();
      setMobileTopbarCoveredByPrimaryModal(false);
    });
    if (closeBtn) closeBtn.addEventListener("click", () => {
      root.classList.add("hidden");
      setAllianceLeaveModalVisible(false);
      setCreateAllianceModalVisible(false);
      setAllianceManagementModalVisible(false);
      clearAllianceRefreshInterval();
      setMobileTopbarCoveredByPrimaryModal(false);
    });
    if (createModalBackdrop) createModalBackdrop.addEventListener("click", () => {
      setCreateAllianceModalVisible(false);
    });
    if (createModalCloseBtn) createModalCloseBtn.addEventListener("click", () => {
      setCreateAllianceModalVisible(false);
    });
    if (managementModalBackdrop) managementModalBackdrop.addEventListener("click", () => {
      setAllianceManagementModalVisible(false);
    });
    if (managementModalCloseBtn) managementModalCloseBtn.addEventListener("click", () => {
      setAllianceManagementModalVisible(false);
    });
    managementInviteBtn.addEventListener("click", async () => {
      const username = String(managementInviteName.value || "").trim();
      if (!username) {
        pushEvent("Zadej jméno hráče pro pozvánku.");
        return;
      }
      if (!window.Empire.token) {
        const state = getLocalAllianceState();
        const result = sendLocalAllianceManagementInvite(state, username);
        if (result.error) {
          pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
          return;
        }
        saveLocalAllianceState(state);
        managementInviteName.value = "";
        pushEvent("Přímá pozvánka byla odeslána.");
        const refreshHandler = getAllianceRefreshHandler();
        if (refreshHandler) await refreshHandler();
        return;
      }
      const result = await window.Empire.API.sendAllianceManagementInvite(username);
      if (result.error) {
        pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
        return;
      }
      managementInviteName.value = "";
      pushEvent("Přímá pozvánka byla odeslána.");
      const refreshHandler = getAllianceRefreshHandler();
      if (refreshHandler) await refreshHandler();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (!createModal.classList.contains("hidden")) {
          setCreateAllianceModalVisible(false);
        } else if (!managementModal.classList.contains("hidden")) {
          setAllianceManagementModalVisible(false);
        } else {
          root.classList.add("hidden");
          clearAllianceRefreshInterval();
          setMobileTopbarCoveredByPrimaryModal(false);
        }
      }
    });
    chatInput.setAttribute("data-global-chat-input", "");
    chatSend.setAttribute("data-global-chat-send", "");
    chatSend.addEventListener("click", async () => {
      await sendGlobalChatMessage(chatInput);
    });
    chatInput.addEventListener("keydown", async (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      await sendGlobalChatMessage(chatInput);
    });
    if (activePanel) {
      activePanel.addEventListener("click", async (event) => {
        const trigger = event.target instanceof HTMLElement
          ? event.target.closest("[data-alliance-chat-send]")
          : null;
        if (!(trigger instanceof HTMLElement)) return;
        const input = activePanel.querySelector("[data-alliance-chat-input]");
        if (input instanceof HTMLInputElement) {
          await sendAllianceChatMessage(input);
        }
      });
      activePanel.addEventListener("keydown", async (event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement) || !target.hasAttribute("data-alliance-chat-input")) return;
        if (event.key !== "Enter") return;
        event.preventDefault();
        await sendAllianceChatMessage(target);
      });
    }
    renderAllianceIconPicker();
    setCreateAllianceModalVisible(false);
    setAllianceManagementModalVisible(false);
    const localState = !window.Empire.token ? getLocalAllianceState() : null;
    renderAllianceChat(localState?.chat || []);
    renderGlobalServerChat();
  }

  function renderAllianceState(activeAlliance, alliances, incomingInvites = []) {
    const activePanel = document.getElementById("alliance-active-panel");
    const playerInvitesPanel = document.getElementById("alliance-player-invites-panel");
    const listPanel = document.getElementById("alliance-list-panel");
    const leaveBtn = document.getElementById("alliance-leave-btn");
    const createToggleBtn = document.getElementById("alliance-create-toggle-btn");
    const createEntry = document.getElementById("alliance-create-entry");
    if (!activePanel || !playerInvitesPanel || !listPanel || !leaveBtn || !createToggleBtn) return;

    leaveBtn.classList.toggle("hidden", !activeAlliance);
    createToggleBtn.classList.toggle("hidden", Boolean(activeAlliance));
    if (createEntry) createEntry.classList.toggle("hidden", Boolean(activeAlliance));
    activePanel.classList.toggle("alliance-active-panel--occupied", Boolean(activeAlliance));
    listPanel.classList.toggle("hidden", Boolean(activeAlliance));

    if (activeAlliance) {
      const currentPlayerReady = activeAlliance.current_player_ready || computeLocalAllianceReadyState(null);
      const readyStateClass = currentPlayerReady.isReadyWindowActive
        ? "alliance-ready-state alliance-ready-state--ok"
        : "alliance-ready-state alliance-ready-state--bad";
      const readyTimerClass = currentPlayerReady.isReadyWindowActive
        ? "alliance-ready-panel__timer alliance-ready-panel__timer--ok"
        : "alliance-ready-panel__timer alliance-ready-panel__timer--bad";
      activePanel.innerHTML = `
        <div class="alliance-active-card">
          <div class="alliance-active-card__top">
            <div class="alliance-active-card__badge-wrap">
              <div class="alliance-active-card__badge-line">
                <div class="alliance-active-card__badge">${renderAllianceIdentityMarkup(activeAlliance)}</div>
                <div class="alliance-active-card__badges">
                  <span class="${readyStateClass}">${currentPlayerReady.isReadyWindowActive ? "READY aktivní" : "READY vypršelo"}</span>
                  <div class="alliance-ready-inline">
                    <button class="btn btn--primary alliance-ready-btn alliance-ready-btn--inline" id="alliance-ready-btn">READY</button>
                    <strong class="${readyTimerClass}">${formatAllianceDueLabelSeconds(currentPlayerReady.readyDueAt)}</strong>
                  </div>
                </div>
              </div>
              <div class="alliance-active-card__description">
                <span>Popisek</span>
                <strong>${escapeAllianceMarkup(DEFAULT_ALLIANCE_DESCRIPTION)}</strong>
              </div>
            </div>
          </div>
          <div class="alliance-active-card__overview">
            <div class="alliance-active-card__stats-column">
              <div class="alliance-active-card__stat">
                <span>Členové</span>
                <strong>${activeAlliance.member_count || 0}/${ALLIANCE_MAX_MEMBERS}</strong>
              </div>
              <div class="alliance-active-card__stat">
                <span>Income</span>
                <strong>+${activeAlliance.bonus_income_pct || 0}%</strong>
              </div>
              <div class="alliance-active-card__stat">
                <span>Influence</span>
                <strong>+${activeAlliance.bonus_influence_pct || 0}%</strong>
              </div>
              <div class="alliance-active-card__stat">
                <span>Heat control</span>
                <strong>${activeAlliance.heat_control_text || "-8% heat"}</strong>
              </div>
            </div>
            <div class="alliance-active-card__chat-pane">
              <div class="alliance-chat alliance-chat--modal">
                <div class="alliance-chat__title">Chat aliance</div>
                <div class="alliance-chat__log" data-alliance-chat-log></div>
              </div>
            </div>
          </div>
          <div class="alliance-active-card__chat-compose">
            <div class="alliance-chat__input alliance-chat__input--modal">
              <input type="text" placeholder="Napiš zprávu do aliance..." data-alliance-chat-input />
              <button class="btn btn--ghost" type="button" data-alliance-chat-send>Odeslat</button>
            </div>
          </div>
          <div class="alliance-members">
            ${(activeAlliance.members || [])
              .map((member) => renderAllianceMemberCard(member, activeAlliance.kick_votes || []))
              .join("")}
          </div>
        </div>
      `;
    } else {
      activePanel.innerHTML = `
        <div class="modal__row">
          <span>Aktivní aliance</span>
          <strong>Žádná</strong>
        </div>
      `;
    }

    playerInvitesPanel.innerHTML = !activeAlliance && incomingInvites.length ? `
      <div class="alliance-pending-panel">
        <div class="alliance-pending-panel__title">Příchozí pozvání do aliance</div>
        ${incomingInvites.map((invite) => `
          <div class="alliance-request-item">
            <div class="alliance-request-item__copy">
              <strong>${escapeAllianceMarkup(invite.alliance_name || "Aliance")}</strong>
              <span>${escapeAllianceMarkup(invite.inviter_username || "Hráč")} tě zve do aliance.</span>
            </div>
            <div class="alliance-request-item__actions">
              <button class="btn btn--primary" data-player-invite-accept="${invite.id}">Přijmout</button>
              <button class="btn btn--ghost" data-player-invite-reject="${invite.id}">Odmítnout</button>
            </div>
          </div>
        `).join("")}
      </div>
    ` : "";

    listPanel.innerHTML = `
      <div class="alliance-list">
        ${(alliances || [])
          .map(
            (alliance) => `
              <div class="alliance-list__item">
                <div>
                  <div class="alliance-list__name">${renderAllianceIdentityMarkup(alliance)}</div>
                  <div class="alliance-list__description">${escapeAllianceMarkup(alliance.description || "Bez popisku")}</div>
                  <div class="alliance-list__meta">${alliance.member_count || 0}/${ALLIANCE_MAX_MEMBERS} členů • +${alliance.bonus_income_pct || 0}% income • +${alliance.bonus_influence_pct || 0}% influence</div>
                </div>
                <button class="btn btn--ghost" data-alliance-request="${alliance.id}" ${Number(alliance.member_count || 0) >= ALLIANCE_MAX_MEMBERS || alliance.has_pending_request || activeAlliance ? "disabled" : ""}>
                  ${alliance.has_pending_request ? "Pozvánka odeslána" : "Poslat pozvánku"}
                </button>
              </div>
            `
          )
          .join("")}
      </div>
    `;

    const managementOpenBtn = document.getElementById("alliance-management-open-btn");
    const managementFooterBtn = document.getElementById("alliance-management-footer-btn");
    const readyBtn = document.getElementById("alliance-ready-btn");
    if (managementFooterBtn) managementFooterBtn.classList.toggle("hidden", !activeAlliance);
    bindAllianceMemberAvatarLightbox(activePanel);
    if (managementOpenBtn) {
      managementOpenBtn.addEventListener("click", () => {
        document.getElementById("alliance-management-modal")?.classList.remove("hidden");
      });
    }
    if (managementFooterBtn) {
      managementFooterBtn.addEventListener("click", () => {
        document.getElementById("alliance-management-modal")?.classList.remove("hidden");
      });
    }
    if (readyBtn) {
      readyBtn.addEventListener("click", async () => {
        document.dispatchEvent(new CustomEvent("empire:alliance-ready-clicked", {
          detail: {
            source: "alliance-panel"
          }
        }));
        if (!window.Empire.token) {
          const state = getLocalAllianceState();
          const result = markLocalAllianceReady(state);
          if (result.error) {
            pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
            return;
          }
          saveLocalAllianceState(state);
          pushEvent("READY potvrzen.");
          const refreshHandler = getAllianceRefreshHandler();
          if (refreshHandler) await refreshHandler();
          return;
        }
        const result = await window.Empire.API.markAllianceReady();
        if (result.error) {
          pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
          return;
        }
        pushEvent("READY potvrzen.");
        const refreshHandler = getAllianceRefreshHandler();
        if (refreshHandler) await refreshHandler();
      });
    }

    playerInvitesPanel.querySelectorAll("[data-player-invite-accept]").forEach((button) => {
      button.addEventListener("click", async () => {
        const inviteId = button.getAttribute("data-player-invite-accept");
        if (!inviteId) return;
        if (!window.Empire.token) {
          const state = getLocalAllianceState();
          const result = respondToLocalAllianceMemberInvite(state, inviteId, true);
          if (result.error) {
            pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
            return;
          }
          saveLocalAllianceState(state);
          pushEvent("Pozvání do aliance bylo přijato.");
          const refreshHandler = getAllianceRefreshHandler();
          if (refreshHandler) await refreshHandler();
          syncGuestAllianceLabel(result.allianceName || "Žádná");
          return;
        }
        const result = await window.Empire.API.respondToAllianceMemberInvite(inviteId, true);
        if (result.error) {
          pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
          return;
        }
        pushEvent("Pozvání do aliance bylo přijato.");
        const refreshHandler = getAllianceRefreshHandler();
        if (refreshHandler) await refreshHandler();
        const profile = await window.Empire.API.getProfile();
        updateProfile(profile);
      });
    });

    playerInvitesPanel.querySelectorAll("[data-player-invite-reject]").forEach((button) => {
      button.addEventListener("click", async () => {
        const inviteId = button.getAttribute("data-player-invite-reject");
        if (!inviteId) return;
        if (!window.Empire.token) {
          const state = getLocalAllianceState();
          const result = respondToLocalAllianceMemberInvite(state, inviteId, false);
          if (result.error) {
            pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
            return;
          }
          saveLocalAllianceState(state);
          pushEvent("Pozvání do aliance bylo odmítnuto.");
          const refreshHandler = getAllianceRefreshHandler();
          if (refreshHandler) await refreshHandler();
          return;
        }
        const result = await window.Empire.API.respondToAllianceMemberInvite(inviteId, false);
        if (result.error) {
          pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
          return;
        }
        pushEvent("Pozvání do aliance bylo odmítnuto.");
        const refreshHandler = getAllianceRefreshHandler();
        if (refreshHandler) await refreshHandler();
      });
    });

    listPanel.querySelectorAll("[data-alliance-request]").forEach((button) => {
      button.addEventListener("click", async () => {
        const allianceId = button.getAttribute("data-alliance-request");
        if (!allianceId) return;
        if (!window.Empire.token) {
          const state = getLocalAllianceState();
          const request = requestLocalAllianceInvite(state, allianceId);
          if (request?.error) {
            pushEvent(`Aliance: ${formatAllianceError(request.error)}`);
            return;
          }
          saveLocalAllianceState(state);
          pushEvent("Pozvánka byla odeslána.");
          const refreshHandler = getAllianceRefreshHandler();
          if (refreshHandler) await refreshHandler();
          return;
        }
        const result = await window.Empire.API.requestAllianceInvite(allianceId);
        if (result.error) {
          pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
          return;
        }
        pushEvent("Pozvánka byla odeslána.");
        const refreshHandler = getAllianceRefreshHandler();
        if (refreshHandler) await refreshHandler();
      });
    });
  }

  function renderAllianceManagementState(activeAlliance) {
    const panel = document.getElementById("alliance-management-panel");
    const inviteInput = document.getElementById("alliance-management-invite-name");
    const inviteBtn = document.getElementById("alliance-management-invite-btn");
    if (!panel) return;
    if (!activeAlliance) {
      if (inviteInput) inviteInput.disabled = true;
      if (inviteBtn) inviteBtn.disabled = true;
      panel.innerHTML = `
        <div class="alliance-pending-panel">
          <div class="alliance-request-item alliance-request-item--empty">Nejsi ve vlastní alianci.</div>
        </div>
      `;
      return;
    }
    const isLeader = activeAlliance.current_player_role === "leader";
    if (inviteInput) inviteInput.disabled = !isLeader;
    if (inviteBtn) inviteBtn.disabled = !isLeader;

    const pendingRequests = Array.isArray(activeAlliance.pending_requests) ? activeAlliance.pending_requests : [];
    const outgoingInvites = Array.isArray(activeAlliance.outgoing_invites) ? activeAlliance.outgoing_invites : [];
    const kickVotes = Array.isArray(activeAlliance.kick_votes) ? activeAlliance.kick_votes : [];
    const members = Array.isArray(activeAlliance.members) ? activeAlliance.members : [];
    const auditLogs = Array.isArray(activeAlliance.audit_logs) ? activeAlliance.audit_logs : [];
    panel.innerHTML = `
      <div class="alliance-pending-panel">
        <div class="alliance-pending-panel__title">Členové aliance</div>
        ${members.map((member) => {
          const openVote = kickVotes.find((vote) => String(vote.target_player_id) === String(member.id));
          const canStartVote = member.role !== "leader" && member.isReadyOverdue;
          const visual = getAllianceMemberVisualData(member);
          const avatarMarkup = visual.avatar
            ? `<button class="alliance-member__avatar-btn alliance-member__avatar-btn--management" type="button" data-alliance-member-avatar="${escapeAllianceMarkup(member.username || "Hráč")}" data-alliance-member-avatar-src="${escapeAllianceMarkup(visual.avatar)}" data-alliance-member-avatar-meta="${escapeAllianceMarkup(`${visual.faction} • ${visual.sectorLabel}`)}"><img class="alliance-member__avatar" src="${escapeAllianceMarkup(visual.avatar)}" alt="Avatar ${escapeAllianceMarkup(member.username || "Hráč")}" loading="lazy" /></button>`
            : `<div class="alliance-member__avatar alliance-member__avatar--empty">${escapeAllianceMarkup(String(member?.username || "?").slice(0, 1).toUpperCase())}</div>`;
          return `
            <div class="alliance-request-item">
              ${avatarMarkup}
              <div class="alliance-request-item__copy">
                <strong>${escapeAllianceMarkup(member.username || "Hráč")} (${visual.sectorLabel}) • ${member.role === "leader" ? "Leader" : "Člen"}</strong>
                <span>${escapeAllianceMarkup(member.gang_name || "Gang")} • ${escapeAllianceMarkup(visual.faction)} • ${visual.color ? visual.color.toUpperCase() : "Bez barvy"}</span>
                <span>${member.isReadyWindowActive ? `READY aktivní ještě ${formatAllianceDueLabelSeconds(member.readyDueAt)}` : "READY chybí, lze řešit vyhození."}</span>
              </div>
              <div class="alliance-request-item__actions">
                ${isLeader && member.role !== "leader" ? `<button class="btn btn--ghost" data-alliance-member-remove="${member.id}">Vyhodit</button>` : ""}
                ${canStartVote && !openVote ? `<button class="btn btn--primary" data-alliance-kick-start="${member.id}">Spustit hlasování</button>` : ""}
                ${openVote ? `<button class="btn btn--primary" data-alliance-kick-cast="${openVote.id}">Hlasovat (${openVote.yes_votes}/${openVote.required_votes})</button>` : ""}
              </div>
            </div>
          `;
        }).join("")}
      </div>
      ${isLeader ? `<div class="alliance-pending-panel">
        <div class="alliance-pending-panel__title">Žádosti o vstup</div>
        ${pendingRequests.length ? pendingRequests.map((request) => `
          <div class="alliance-request-item">
            <div class="alliance-request-item__copy">
              <strong>${escapeAllianceMarkup(request.username || "Hráč")}</strong>
              <span>${escapeAllianceMarkup(request.gang_name || "Gang")} chce vstoupit do aliance.</span>
            </div>
            <div class="alliance-request-item__actions">
              <button class="btn btn--primary" data-alliance-request-accept="${request.id}">Potvrdit</button>
              <button class="btn btn--ghost" data-alliance-request-reject="${request.id}">Odmítnout</button>
            </div>
          </div>
        `).join("") : `<div class="alliance-request-item alliance-request-item--empty">Žádné čekající žádosti.</div>`}
      </div>
      <div class="alliance-pending-panel">
        <div class="alliance-pending-panel__title">Odeslané přímé pozvánky</div>
        ${outgoingInvites.length ? outgoingInvites.map((invite) => `
          <div class="alliance-request-item">
            <div class="alliance-request-item__copy">
              <strong>${escapeAllianceMarkup(invite.username || "Hráč")}</strong>
              <span>${escapeAllianceMarkup(invite.gang_name || "Gang")} čeká na odpověď.</span>
            </div>
          </div>
        `).join("") : `<div class="alliance-request-item alliance-request-item--empty">Žádné aktivní přímé pozvánky.</div>`}
      </div>` : ""}
      <div class="alliance-pending-panel">
        <div class="alliance-pending-panel__title">Audit log aliance</div>
        ${auditLogs.length ? auditLogs.map((entry) => `
          <div class="alliance-request-item alliance-request-item--log">
            <div class="alliance-request-item__copy">
              <strong>${escapeAllianceMarkup(entry.message || "Aliance akce")}</strong>
              <span>${escapeAllianceMarkup(formatAllianceRelativeTime(entry.created_at))}</span>
            </div>
          </div>
        `).join("") : `<div class="alliance-request-item alliance-request-item--empty">Audit log je zatím prázdný.</div>`}
      </div>
    `;

    const managementReadyBtn = document.getElementById("alliance-management-ready-btn");
    bindAllianceMemberAvatarLightbox(panel);
    if (managementReadyBtn) {
      managementReadyBtn.addEventListener("click", async () => {
        document.dispatchEvent(new CustomEvent("empire:alliance-ready-clicked", {
          detail: {
            source: "alliance-management"
          }
        }));
        if (!window.Empire.token) {
          const state = getLocalAllianceState();
          const result = markLocalAllianceReady(state);
          if (result.error) {
            pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
            return;
          }
          saveLocalAllianceState(state);
          pushEvent("READY potvrzen.");
          const refreshHandler = getAllianceRefreshHandler();
          if (refreshHandler) await refreshHandler();
          return;
        }
        const result = await window.Empire.API.markAllianceReady();
        if (result.error) {
          pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
          return;
        }
        pushEvent("READY potvrzen.");
        const refreshHandler = getAllianceRefreshHandler();
        if (refreshHandler) await refreshHandler();
      });
    }

    panel.querySelectorAll("[data-alliance-request-accept]").forEach((button) => {
      button.addEventListener("click", async () => {
        const requestId = button.getAttribute("data-alliance-request-accept");
        if (!requestId) return;
        if (!window.Empire.token) {
          const state = getLocalAllianceState();
          const result = respondToLocalAllianceRequest(state, requestId, true);
          if (result.error) {
            pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
            return;
          }
          saveLocalAllianceState(state);
          pushEvent("Žádost byla potvrzena.");
          const refreshHandler = getAllianceRefreshHandler();
          if (refreshHandler) await refreshHandler();
          return;
        }
        const result = await window.Empire.API.respondToAllianceInvite(requestId, true);
        if (result.error) {
          pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
          return;
        }
        pushEvent("Žádost byla potvrzena.");
        const refreshHandler = getAllianceRefreshHandler();
        if (refreshHandler) await refreshHandler();
      });
    });

    panel.querySelectorAll("[data-alliance-request-reject]").forEach((button) => {
      button.addEventListener("click", async () => {
        const requestId = button.getAttribute("data-alliance-request-reject");
        if (!requestId) return;
        if (!window.Empire.token) {
          const state = getLocalAllianceState();
          const result = respondToLocalAllianceRequest(state, requestId, false);
          if (result.error) {
            pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
            return;
          }
          saveLocalAllianceState(state);
          pushEvent("Žádost byla odmítnuta.");
          const refreshHandler = getAllianceRefreshHandler();
          if (refreshHandler) await refreshHandler();
          return;
        }
        const result = await window.Empire.API.respondToAllianceInvite(requestId, false);
        if (result.error) {
          pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
          return;
        }
        pushEvent("Žádost byla odmítnuta.");
        const refreshHandler = getAllianceRefreshHandler();
        if (refreshHandler) await refreshHandler();
      });
    });

    panel.querySelectorAll("[data-alliance-member-remove]").forEach((button) => {
      button.addEventListener("click", async () => {
        const memberId = button.getAttribute("data-alliance-member-remove");
        if (!memberId) return;
        if (!window.Empire.token) {
          const state = getLocalAllianceState();
          const result = removeLocalAllianceMember(state, memberId);
          if (result.error) {
            pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
            return;
          }
          saveLocalAllianceState(state);
          pushEvent("Člen byl vyhozen z aliance.");
          const refreshHandler = getAllianceRefreshHandler();
          if (refreshHandler) await refreshHandler();
          return;
        }
        const result = await window.Empire.API.removeAllianceMember(memberId);
        if (result.error) {
          pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
          return;
        }
        pushEvent("Člen byl vyhozen z aliance.");
        const refreshHandler = getAllianceRefreshHandler();
        if (refreshHandler) await refreshHandler();
      });
    });

    panel.querySelectorAll("[data-alliance-kick-start]").forEach((button) => {
      button.addEventListener("click", async () => {
        const memberId = button.getAttribute("data-alliance-kick-start");
        if (!memberId) return;
        if (!window.Empire.token) {
          const state = getLocalAllianceState();
          const result = startLocalAllianceKickVote(state, memberId);
          if (result.error) {
            pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
            return;
          }
          saveLocalAllianceState(state);
          pushEvent("Hlasování o vyhození bylo zahájeno.");
          const refreshHandler = getAllianceRefreshHandler();
          if (refreshHandler) await refreshHandler();
          return;
        }
        const result = await window.Empire.API.startAllianceKickVote(memberId);
        if (result.error) {
          pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
          return;
        }
        pushEvent("Hlasování o vyhození bylo zahájeno.");
        const refreshHandler = getAllianceRefreshHandler();
        if (refreshHandler) await refreshHandler();
      });
    });

    panel.querySelectorAll("[data-alliance-kick-cast]").forEach((button) => {
      button.addEventListener("click", async () => {
        const voteId = button.getAttribute("data-alliance-kick-cast");
        if (!voteId) return;
        if (!window.Empire.token) {
          const state = getLocalAllianceState();
          const result = castLocalAllianceKickVote(state, voteId);
          if (result.error) {
            pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
            return;
          }
          saveLocalAllianceState(state);
          pushEvent("Hlas pro vyhození byl zaznamenán.");
          const refreshHandler = getAllianceRefreshHandler();
          if (refreshHandler) await refreshHandler();
          return;
        }
        const result = await window.Empire.API.castAllianceKickVote(voteId);
        if (result.error) {
          pushEvent(`Aliance: ${formatAllianceError(result.error)}`);
          return;
        }
        pushEvent("Hlas pro vyhození byl zaznamenán.");
        const refreshHandler = getAllianceRefreshHandler();
        if (refreshHandler) await refreshHandler();
      });
    });
  }

  return {
    initAllianceModal,
    renderAllianceState,
    renderAllianceManagementState
  };
};
