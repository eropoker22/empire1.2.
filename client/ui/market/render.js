window.Empire = window.Empire || {};
window.Empire.UIMarket = window.Empire.UIMarket || {};

window.Empire.UIMarket.createRenderer = function createRenderer(options = {}) {
  const resourceLabels = options.resourceLabels || {};
  const resolveMoneyBreakdown = options.resolveMoneyBreakdown;
  const resourceKeyToBalanceKey = options.resourceKeyToBalanceKey;
  const dom = options.dom || {
    byId: (id) => document.getElementById(id)
  };

  function formatMarketResourceName(resourceKey) {
    return resourceLabels[resourceKey] || String(resourceKey || "").replace(/_/g, " ");
  }

  function formatCompactMarketResourceName(resourceKey) {
    const compactLabels = {
      neon_dust: "ND",
      pulse_shot: "PS",
      velvet_smoke: "VS",
      ghost_serum: "GS",
      overdrive_x: "OX",
      weapons: "Zbraně",
      materials: "Mat",
      data_shards: "Data",
      chemicals: "Chem",
      biomass: "Bio",
      stim_pack: "Stim",
      metal_parts: "MP",
      tech_core: "TC",
      combat_module: "CM",
      baseball_bat: "Pálka",
      street_pistol: "Pistole",
      grenade: "Granát",
      smg: "SMG",
      bazooka: "Bazuka",
      bulletproof_vest: "Vesta",
      steel_barricades: "Barikády",
      security_cameras: "Kamery",
      auto_mg_nest: "MG Nest",
      alarm_system: "Alarm"
    };
    return compactLabels[resourceKey] || formatMarketResourceName(resourceKey);
  }

  function renderMarketOrdersList(orders, side) {
    if (!orders.length) {
      return '<div class="market-modal__empty">Žádné aktivní příkazy.</div>';
    }
    return orders
      .map(
        (order) => `
          <div class="market-order market-order--${side}">
            <div class="market-order__head">
              <span>${order.username}</span>
              <strong>$${order.pricePerUnit}</strong>
            </div>
            <div class="market-order__meta">${formatCompactMarketResourceName(order.resourceKey)} • ${order.remainingQuantity} ks</div>
          </div>
        `
      )
      .join("");
  }

  function renderMyOrdersList(orders) {
    if (!orders.length) {
      return '<div class="market-modal__empty">Nemáš žádné otevřené příkazy.</div>';
    }
    return orders
      .map(
        (order) => `
          <div class="market-order market-order--mine">
            <div class="market-order__head">
              <span>${order.side === "buy" ? "Poptávka" : "Nabídka"}</span>
              <strong>$${order.pricePerUnit}</strong>
            </div>
            <div class="market-order__meta">${formatCompactMarketResourceName(order.resourceKey)} • ${order.remainingQuantity}/${order.quantity} ks</div>
            <button class="btn btn--ghost" data-market-cancel="${order.id}">Zrušit</button>
          </div>
        `
      )
      .join("");
  }

  function renderTradeHistoryList(trades) {
    if (!trades.length) {
      return '<div class="market-modal__empty">Žádné nedávné obchody.</div>';
    }
    return trades
      .map(
        (trade) => `
          <div class="market-order market-order--history">
            <div class="market-order__head">
              <span>${formatCompactMarketResourceName(trade.resourceKey)} • ${trade.quantity} ks</span>
              <strong>$${trade.pricePerUnit}</strong>
            </div>
            <div class="market-order__meta">Fee: $${trade.feePaid}</div>
          </div>
        `
      )
      .join("");
  }

  function renderMarketState(resourceKey, marketTab, market) {
    const summary = dom.byId("market-balance-summary");
    const sellOrders = dom.byId("market-sell-orders");
    const buyOrders = dom.byId("market-buy-orders");
    const myOrders = dom.byId("market-my-orders");
    const tradeHistory = dom.byId("market-trade-history");
    const sellCount = dom.byId("market-sell-count");
    const buyCount = dom.byId("market-buy-count");
    const myCount = dom.byId("market-my-count");
    const tradeCount = dom.byId("market-trade-count");
    if (!summary || !sellOrders || !buyOrders || !myOrders || !tradeHistory || !sellCount || !buyCount || !myCount || !tradeCount) return;

    const safeMarket = market || { balances: {}, orderBook: [], myOrders: [] };
    const balances = safeMarket.balances || {};
    const money = typeof resolveMoneyBreakdown === "function" ? resolveMoneyBreakdown(balances) : { cleanMoney: 0 };
    const selectedOrders = (safeMarket.orderBook || []).filter((order) => order.resourceKey === resourceKey && order.status === "open");
    const sells = selectedOrders.filter((order) => order.side === "sell");
    const buys = selectedOrders.filter((order) => order.side === "buy");
    const mine = (safeMarket.myOrders || []).filter((order) => order.resourceKey === resourceKey && order.status === "open");
    const trades = (safeMarket.recentTrades || []).filter((trade) => trade.resourceKey === resourceKey);

    const activeResourceLabel = formatMarketResourceName(resourceKey);
    const summaryPills = marketTab === "black"
      ? [
          `Čisté: $${money.cleanMoney}`,
          `Kontrakt: ${activeResourceLabel}`,
          `Ve skladu: ${balances[resourceKeyToBalanceKey(resourceKey)] || 0}`,
          `Fee: ${safeMarket.marketFeePct || 0}%`
        ]
      : [
          `Čisté: $${money.cleanMoney}`,
          `Drogy: ${balances.drugs || 0}`,
          `Zbraně: ${balances.weapons || 0}`,
          `Materiály: ${balances.materials || 0}`,
          `Fee: ${safeMarket.marketFeePct || 0}%`
        ];

    summary.innerHTML = summaryPills.map((label) => `<div class="market-balance-pill">${label}</div>`).join("");
    sellCount.textContent = String(sells.length);
    buyCount.textContent = String(buys.length);
    myCount.textContent = String(mine.length);
    tradeCount.textContent = String(trades.length);

    sellOrders.innerHTML = renderMarketOrdersList(sells, "sell");
    buyOrders.innerHTML = renderMarketOrdersList(buys, "buy");
    myOrders.innerHTML = renderMyOrdersList(mine);
    tradeHistory.innerHTML = renderTradeHistoryList(trades);
  }

  return {
    formatMarketResourceName,
    formatCompactMarketResourceName,
    renderMarketState
  };
};
