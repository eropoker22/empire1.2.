window.Empire = window.Empire || {};
window.Empire.UIModals = window.Empire.UIModals || {};

window.Empire.UIModals.createDistrictWarningController = function createDistrictWarningController(deps = {}) {
  const {
    getDistricts = () => [],
    normalizeOwnerName = (value) => String(value || "").trim().toLowerCase(),
    resolveStoredPoliceRaidSpecialty = () => null,
    resolvePoliceRaidSpecialtyFromOperationType = () => null,
    policeRaidSpecialties = {},
    openPoliceActionResultModal = () => {},
    clearDistrictAttackWarningTimer = () => {},
    setDistrictAttackWarningTimer = () => {},
    closePoliceActionResultModal = () => {},
    formatAttackDurationLabel = (value) => String(value || ""),
    now = () => Date.now()
  } = deps;

  function openDistrictPoliceRaidWarningModal(district = null, policeAction = {}) {
    const ownerNick = String(
      district?.ownerNick
      || district?.owner_username
      || district?.ownerUsername
      || district?.owner
      || "Neznámý"
    ).trim() || "Neznámý";
    const raidSpecialty = resolveStoredPoliceRaidSpecialty(policeAction)
      || resolvePoliceRaidSpecialtyFromOperationType(policeAction?.operationType, policeAction)
      || policeRaidSpecialties.total;
    const raidSpecialtyKey = String(
      policeAction?.raidSpecialtyKey
      || Object.entries(policeRaidSpecialties).find(([, meta]) => meta === raidSpecialty)?.[0]
      || "total"
    ).trim().toLowerCase();
    const raidTypeLabel = String(raidSpecialty?.label || "Celková razie").trim() || "Celková razie";
    const normalizedOwnerNick = normalizeOwnerName(ownerNick);
    const warningSummary = normalizedOwnerNick === normalizeOwnerName("Sněhulák")
      ? "Tady teď ne. Policie to tu právě rozjebává."
      : normalizedOwnerNick === normalizeOwnerName("Poltergeist")
        ? "Zapomeň na to. District je plnej policajtů."
        : "Tady teď ne. Policie to tu právě rozjebává.";
    const specialtyTone = ({
      financial: "is-specialty-financial",
      drug: "is-specialty-drug",
      weapons: "is-specialty-weapons",
      arrests: "is-specialty-arrests",
      total: "is-specialty-total"
    })[raidSpecialtyKey] || "is-specialty-total";

    openPoliceActionResultModal({
      tone: `${specialtyTone} is-district-raid-warning`,
      title: "Policejní razie v districtu",
      badge: raidTypeLabel,
      summary: warningSummary,
      rows: [
        { label: "Hráč", value: ownerNick },
        { label: "Typ razie", value: raidTypeLabel }
      ]
    });
  }

  function openDistrictAttackInProgressModal(district = null, attackMarker = {}) {
    const districts = Array.isArray(getDistricts()) ? getDistricts() : [];
    const attackerDistrictId = Number(attackMarker?.attackerDistrictId);
    const attackerDistrict = Number.isFinite(attackerDistrictId)
      ? districts.find((entry) => Number(entry?.id) === attackerDistrictId) || null
      : null;
    const attackerName = String(
      attackerDistrict?.ownerNick
      || attackerDistrict?.owner_username
      || attackerDistrict?.ownerUsername
      || attackerDistrict?.owner
      || "Neznámý gang"
    ).trim() || "Neznámý gang";
    const defenderName = String(
      district?.ownerNick
      || district?.owner_username
      || district?.ownerUsername
      || district?.owner
      || "Neobsazeno"
    ).trim() || "Neobsazeno";

    openPoliceActionResultModal({
      tone: "is-district-attack-warning",
      title: "Útok probíhá",
      badge: "Boj o district",
      summary: "",
      rows: [
        { label: "Útočník", value: attackerName },
        { label: "Obránce", value: defenderName },
        { label: "Konec boje za", value: formatAttackDurationLabel(Math.max(0, Number(attackMarker?.expiresAt || 0) - now())) }
      ],
      onOpen: ({ root, details }) => {
        const renderRows = () => {
          if (!root || root.classList.contains("hidden")) {
            clearDistrictAttackWarningTimer();
            return;
          }
          const remainingMs = Math.max(0, Number(attackMarker?.expiresAt || 0) - now());
          details.innerHTML = `
            <div class="modal__row">
              <span>Útočník</span>
              <strong>${attackerName}</strong>
            </div>
            <div class="modal__row">
              <span>Obránce</span>
              <strong>${defenderName}</strong>
            </div>
            <div class="modal__row">
              <span>Konec boje za</span>
              <strong>${formatAttackDurationLabel(remainingMs)}</strong>
            </div>
          `;
          if (remainingMs <= 0) {
            clearDistrictAttackWarningTimer();
            closePoliceActionResultModal();
          }
        };
        renderRows();
        setDistrictAttackWarningTimer(window.setInterval(renderRows, 1000));
      }
    });
  }

  return {
    openDistrictPoliceRaidWarningModal,
    openDistrictAttackInProgressModal
  };
};
