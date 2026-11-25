"use strict";

const COSTS = Object.freeze({ fixed: 185000, variable: 8800, sheet: 10000, initialBudget: 400000 });
const STORAGE_KEY = "organizador-carton-registros-v1";
const DESTINATIONS = Object.freeze(["Almacenamiento", "Reutilización", "Reciclaje", "Descarte"]);
const CONDITIONS = Object.freeze(["Bueno", "Regular", "Deteriorado"]);
const currencyFormatter = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });
const numberFormatter = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });

function formatNumber(value, maximumFractionDigits) {
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: maximumFractionDigits === undefined ? 2 : maximumFractionDigits }).format(value);
}

function formatCop(value) {
  return "$" + currencyFormatter.format(value) + " COP";
}

function parseNonNegativeNumber(input) {
  const raw = input.value.trim();
  if (raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function setHidden(element, isHidden) {
  element.hidden = isHidden;
}

function renderCutPlan() {
  const svg = document.getElementById("cut-plan-svg");
  const ns = "http://www.w3.org/2000/svg";
  const create = (tag, attrs, parent) => {
    const node = document.createElementNS(ns, tag);
    Object.keys(attrs).forEach((key) => node.setAttribute(key, attrs[key]));
    if (parent) parent.appendChild(node);
    return node;
  };
  const text = (parent, x, y, value, attrs) => {
    const node = create("text", Object.assign({ x, y }, attrs || {}), parent);
    node.textContent = value;
    return node;
  };
  svg.setAttribute("viewBox", "0 0 510 680");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.innerHTML = "";
  const title = create("title", { id: "cut-svg-title" }, svg);
  title.textContent = "Distribución de 28 piezas en una lámina de cartón de 70 por 100 centímetros";
  const desc = create("desc", { id: "cut-svg-desc" }, svg);
  desc.textContent = "Área útil de 68 por 98 centímetros dentro de márgenes de un centímetro. Cinco columnas contienen cuatro bases, ocho paredes largas, doce piezas de 11,4 por 9,7 centímetros y cuatro divisiones longitudinales. Los huecos rojos indican cortes y el área verde representa sobrantes teóricos.";

  const x0 = 85, y0 = 59, scale = 4.65;
  const sheetW = 70 * scale, sheetH = 100 * scale;
  create("rect", { x: x0, y: y0, width: sheetW, height: sheetH, rx: 4, fill: "#eeeae3", stroke: "#756653", "stroke-width": 2 }, svg);
  create("rect", { x: x0 + scale, y: y0 + scale, width: 68 * scale, height: 98 * scale, fill: "#fffdf9", stroke: "#9b8a73", "stroke-width": 1.2, "stroke-dasharray": "4 3" }, svg);
  text(svg, x0, y0 - 13, "LÁMINA · 70 cm", { fill: "#514637", "font-size": 13, "font-weight": 700, "font-family": "Arial, sans-serif" });
  const vLabel = text(svg, x0 - 13, y0 + sheetH / 2, "100 cm", { fill: "#514637", "font-size": 12, "font-weight": 700, "font-family": "Arial, sans-serif", "text-anchor": "middle", transform: `rotate(-90 ${x0 - 13} ${y0 + sheetH / 2})` });
  vLabel.setAttribute("aria-hidden", "true");
  text(svg, x0 + 8, y0 + sheetH + 17, "Márgenes exteriores: 1 cm por lado · área útil: 68 × 98 cm", { fill: "#665b4c", "font-size": 10, "font-family": "Arial, sans-serif" });

  const innerX = x0 + scale, innerY = y0 + scale;
  const pieceColors = { base: "#d4a36f", long: "#bd8754", short: "#e5c7a2", transverse: "#c6905c", longitudinal: "#ae7547" };
  const gapColor = "#d75b45", gapWidth = 0.2 * scale;
  let x = innerX;
  const columns = [
    { width: 12, kind: "base" },
    { width: 9.7, kind: "long" },
    { width: 9.7, kind: "long" },
    { width: 9.7, kind: "parts" },
    { width: 9.7, kind: "parts" }
  ];
  columns.forEach((column, columnIndex) => {
    const colWidth = column.width * scale;
    let y = innerY;
    const drawPiece = (heightCm, label, fill, fontSize) => {
      const height = heightCm * scale;
      create("rect", { x, y, width: colWidth, height, fill, stroke: "#805a37", "stroke-width": 1 }, svg);
      text(svg, x + colWidth / 2, y + height / 2 + 3, label, { fill: "#3d3023", "font-size": fontSize || 8, "font-weight": 700, "font-family": "Arial, sans-serif", "text-anchor": "middle" });
      y += height;
    };
    const drawGap = (heightCm) => {
      const height = heightCm * scale;
      create("rect", { x, y, width: colWidth, height, fill: "#fae5df", stroke: gapColor, "stroke-width": 0.7, "stroke-dasharray": "2 1" }, svg);
      y += height;
    };
    if (column.kind === "base") {
      for (let i = 0; i < 4; i++) {
        drawPiece(24, "Base", pieceColors.base, 8);
        if (i < 3) drawGap(0.2);
      }
    } else if (column.kind === "long") {
      for (let i = 0; i < 4; i++) {
        drawPiece(24, "P. larga", pieceColors.long, 7.5);
        if (i < 3) drawGap(0.2);
      }
    } else {
      const shortParts = [
        ["P. corta", pieceColors.short],
        ["P. corta", pieceColors.short],
        ["P. corta", pieceColors.short],
        ["P. corta", pieceColors.short],
        ["D. transv.", pieceColors.transverse],
        ["D. transv.", pieceColors.transverse]
      ];
      shortParts.forEach(([label, fill], index) => {
        drawPiece(11.4, label, fill, 6.2);
        drawGap(0.2);
      });
      for (let i = 0; i < 2; i++) {
        drawPiece(11.55, "D. long.", pieceColors.longitudinal, 6.5);
        if (i === 0) drawGap(0.2);
      }
    }
    const leftoverHeight = (98 - (column.kind === "parts" ? 92.9 : 96.6)) * scale;
    create("rect", { x, y, width: colWidth, height: leftoverHeight, fill: "#dfe8d5", stroke: "#788c68", "stroke-width": 0.8, "stroke-dasharray": "3 2" }, svg);
    if (columnIndex === 0) text(svg, x + colWidth / 2, y + leftoverHeight / 2 + 3, "R-004", { fill: "#516244", "font-size": 7, "font-weight": 700, "font-family": "Arial, sans-serif", "text-anchor": "middle" });
    if (columnIndex === 1 || columnIndex === 2) text(svg, x + colWidth / 2, y + leftoverHeight / 2 + 3, `R-00${columnIndex + 4}`, { fill: "#516244", "font-size": 7, "font-weight": 700, "font-family": "Arial, sans-serif", "text-anchor": "middle" });
    if (column.kind === "parts") text(svg, x + colWidth / 2, y + leftoverHeight / 2 + 3, `R-00${columnIndex - 1}`, { fill: "#516244", "font-size": 7, "font-weight": 700, "font-family": "Arial, sans-serif", "text-anchor": "middle" });

    text(svg, x + colWidth / 2, innerY - 8, String(columnIndex + 1), { fill: "#60482f", "font-size": 10, "font-weight": 800, "font-family": "Arial, sans-serif", "text-anchor": "middle" });
    x += colWidth;
    if (columnIndex < columns.length - 1) {
      create("rect", { x, y: innerY, width: gapWidth, height: 98 * scale, fill: "#fae5df", stroke: gapColor, "stroke-width": 0.65, "stroke-dasharray": "2 2" }, svg);
      x += gapWidth;
    }
  });
  const remainderStart = innerX + (51.6 * scale);
  const remainderWidth = (68 - 51.6) * scale;
  create("rect", { x: remainderStart, y: innerY, width: remainderWidth, height: 98 * scale, fill: "#dfe8d5", stroke: "#788c68", "stroke-width": 1, "stroke-dasharray": "4 3" }, svg);
  text(svg, remainderStart + remainderWidth / 2, innerY + 98 * scale / 2 - 7, "R-001", { fill: "#4b5e3e", "font-size": 11, "font-weight": 800, "font-family": "Arial, sans-serif", "text-anchor": "middle" });
  text(svg, remainderStart + remainderWidth / 2, innerY + 98 * scale / 2 + 9, "16,4 × 98 cm", { fill: "#4b5e3e", "font-size": 9, "font-family": "Arial, sans-serif", "text-anchor": "middle" });
  text(svg, innerX + (51.6 * scale) / 2, innerY + 98 * scale + 36, "5 columnas · separación entre columnas: 0,2 cm", { fill: "#665b4c", "font-size": 9, "font-family": "Arial, sans-serif", "text-anchor": "middle" });
}

function renderCostChart() {
  const svg = document.getElementById("cost-chart-svg");
  const ns = "http://www.w3.org/2000/svg";
  const create = (tag, attrs) => {
    const node = document.createElementNS(ns, tag);
    Object.keys(attrs).forEach((key) => node.setAttribute(key, attrs[key]));
    svg.appendChild(node);
    return node;
  };
  svg.setAttribute("viewBox", "0 0 620 230");
  svg.innerHTML = "";
  const title = create("title", {});
  title.textContent = "Costo total mensual según cantidad de organizadores";
  const points = [[0, 185000], [5, 229000], [10, 273000], [15, 317000], [20, 361000], [25, 405000], [30, 449000]];
  const left = 60, right = 602, top = 20, bottom = 178;
  const x = (n) => left + n / 30 * (right - left);
  const y = (value) => bottom - (value - 150000) / 320000 * (bottom - top);
  [200000, 300000, 400000].forEach((value) => {
    const yy = y(value);
    create("line", { x1: left, y1: yy, x2: right, y2: yy, stroke: "#e8dfd3", "stroke-width": 1 });
    const label = create("text", { x: left - 8, y: yy + 3, fill: "#766b5e", "font-size": 9, "text-anchor": "end", "font-family": "Arial, sans-serif" });
    label.textContent = `${formatNumber(value, 0)}`;
  });
  create("line", { x1: left, y1: bottom, x2: right, y2: bottom, stroke: "#9b8a74", "stroke-width": 1.3 });
  create("line", { x1: left, y1: top, x2: left, y2: bottom, stroke: "#9b8a74", "stroke-width": 1.3 });
  const path = points.map((point, index) => `${index ? "L" : "M"} ${x(point[0])} ${y(point[1])}`).join(" ");
  create("path", { d: path, fill: "none", stroke: "#a66b3c", "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round" });
  points.forEach(([qty, amount]) => {
    create("circle", { cx: x(qty), cy: y(amount), r: 4, fill: "#fffdf9", stroke: "#a66b3c", "stroke-width": 2 });
    const label = create("text", { x: x(qty), y: y(amount) - 8, fill: "#67513a", "font-size": 8, "text-anchor": "middle", "font-family": "Arial, sans-serif" });
    label.textContent = `$${formatNumber(amount, 0)}`;
    const tick = create("text", { x: x(qty), y: bottom + 15, fill: "#766b5e", "font-size": 9, "text-anchor": "middle", "font-family": "Arial, sans-serif" });
    tick.textContent = String(qty);
  });
  const xLabel = create("text", { x: (left + right) / 2, y: 222, fill: "#51483d", "font-size": 10, "text-anchor": "middle", "font-weight": 700, "font-family": "Arial, sans-serif" });
  xLabel.textContent = "Cantidad de organizadores";
  const yLabel = create("text", { x: 13, y: 101, fill: "#51483d", "font-size": 10, "text-anchor": "middle", "font-weight": 700, transform: "rotate(-90 13 101)", "font-family": "Arial, sans-serif" });
  yLabel.textContent = "Costo total (COP)";
}

function setupNavigation() {
  const sections = Array.from(document.querySelectorAll(".page-section"));
  const navButtons = Array.from(document.querySelectorAll(".nav-link[data-section]"));
  const showSection = (sectionId) => {
    const targetId = sectionId && document.getElementById(sectionId) ? sectionId : "inicio";
    sections.forEach((section) => {
      const active = section.id === targetId;
      section.classList.toggle("active", active);
      section.hidden = !active;
    });
    navButtons.forEach((button) => {
      if (button.dataset.section === targetId) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  document.querySelectorAll("[data-section]").forEach((button) => {
    button.addEventListener("click", () => showSection(button.dataset.section));
  });
  document.querySelectorAll('a[href="#inicio"]').forEach((link) => link.addEventListener("click", (event) => {
    event.preventDefault();
    showSection("inicio");
  }));
  document.getElementById("print-button").addEventListener("click", () => window.print());
}

function setupProductionSimulator() {
  const input = document.getElementById("production-quantity");
  const error = document.getElementById("production-error");
  const ids = {
    quantity: document.getElementById("production-result-qty"),
    fixed: document.getElementById("production-result-fixed"),
    variable: document.getElementById("production-result-variable"),
    total: document.getElementById("production-result-total"),
    average: document.getElementById("production-result-average")
  };
  const update = () => {
    const raw = input.value.trim();
    const quantity = Number(raw);
    const valid = raw !== "" && Number.isSafeInteger(quantity) && quantity >= 0;
    if (!valid) {
      error.textContent = "Ingresa una cantidad entera igual o mayor que cero.";
      setHidden(error, false);
      input.setAttribute("aria-invalid", "true");
      return;
    }
    setHidden(error, true);
    input.removeAttribute("aria-invalid");
    const variable = quantity * COSTS.variable;
    const total = COSTS.fixed + variable;
    ids.quantity.textContent = formatNumber(quantity, 0);
    ids.fixed.textContent = formatCop(COSTS.fixed);
    ids.variable.textContent = formatCop(variable);
    ids.total.textContent = formatCop(total);
    ids.average.textContent = quantity > 0 ? formatCop(total / quantity) : "No aplica (0 unidades)";
  };
  input.addEventListener("input", update);
  update();
}

function setupBudgetSimulator() {
  const input = document.getElementById("available-budget");
  const error = document.getElementById("budget-error");
  const warning = document.getElementById("budget-warning");
  const results = {
    available: document.getElementById("budget-result-available"),
    variable: document.getElementById("budget-result-variable"),
    quantity: document.getElementById("budget-result-qty"),
    total: document.getElementById("budget-result-total"),
    balance: document.getElementById("budget-result-balance"),
    check: document.getElementById("budget-check-message")
  };
  const update = () => {
    const budget = parseNonNegativeNumber(input);
    if (budget === null) {
      error.textContent = "Ingresa un valor numérico igual o mayor que cero.";
      setHidden(error, false);
      input.setAttribute("aria-invalid", "true");
      return;
    }
    setHidden(error, true);
    input.removeAttribute("aria-invalid");
    const belowFixed = budget < COSTS.fixed;
    const availableForVariable = Math.max(0, budget - COSTS.fixed);
    const quantity = belowFixed ? 0 : Math.floor(availableForVariable / COSTS.variable);
    const total = COSTS.fixed + quantity * COSTS.variable;
    const balance = budget - total;
    results.available.textContent = formatCop(budget);
    results.variable.textContent = formatCop(availableForVariable);
    results.quantity.textContent = `${formatNumber(quantity, 0)} ${quantity === 1 ? "organizador" : "organizadores"}`;
    results.total.textContent = formatCop(total);
    results.balance.textContent = formatCop(balance);
    if (belowFixed) {
      warning.textContent = `Presupuesto insuficiente para cubrir los costos fijos de ${formatCop(COSTS.fixed)}. No hay presupuesto suficiente para iniciar la producción.`;
      setHidden(warning, false);
      results.check.textContent = `No se recomienda producción: el presupuesto es inferior a los costos fijos por ${formatCop(COSTS.fixed - budget)}.`;
    } else {
      setHidden(warning, true);
      const nextCost = COSTS.fixed + (quantity + 1) * COSTS.variable;
      const overage = nextCost - budget;
      results.check.textContent = `${formatCop(total)} + ${formatCop(balance)} = ${formatCop(budget)}. ${formatNumber(quantity + 1, 0)} unidades costarían ${formatCop(nextCost)}, ${formatCop(overage)} por encima del presupuesto.`;
    }
  };
  input.addEventListener("input", update);
  update();
}

function readStoredRecords(messageElement) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("El formato guardado no es una lista.");
    return parsed.filter((record) => record && typeof record.id === "string" &&
      typeof record.code === "string" && Number.isFinite(record.length) && record.length > 0 &&
      Number.isFinite(record.width) && record.width > 0 && Number.isFinite(record.area) &&
      CONDITIONS.includes(record.condition) && DESTINATIONS.includes(record.destination));
  } catch (error) {
    messageElement.textContent = `No se pudieron leer los registros guardados: ${error.message}`;
    messageElement.classList.add("error");
    setHidden(messageElement, false);
    return [];
  }
}

function setupRemnantRegister() {
  const form = document.getElementById("remnant-form");
  const codeInput = document.getElementById("remnant-code");
  const lengthInput = document.getElementById("remnant-length");
  const widthInput = document.getElementById("remnant-width");
  const conditionInput = document.getElementById("remnant-condition");
  const destinationInput = document.getElementById("remnant-destination");
  const areaOutput = document.getElementById("remnant-area");
  const message = document.getElementById("remnant-message");
  const loadMessage = document.getElementById("register-load-message");
  const tableBody = document.getElementById("remnant-table-body");
  let records = readStoredRecords(loadMessage);

  const areaPreview = () => {
    const length = parseNonNegativeNumber(lengthInput);
    const width = parseNonNegativeNumber(widthInput);
    areaOutput.textContent = length !== null && length > 0 && width !== null && width > 0
      ? `${formatNumber(length * width, 2)} cm²`
      : "—";
  };
  const save = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      setHidden(loadMessage, true);
      loadMessage.classList.remove("error");
      return true;
    } catch (error) {
      loadMessage.textContent = `No se pudieron guardar los registros en este navegador: ${error.message}`;
      loadMessage.classList.add("error");
      setHidden(loadMessage, false);
      return false;
    }
  };
  const updateIndicators = () => {
    const totalArea = records.reduce((sum, record) => sum + record.area, 0);
    document.getElementById("registered-area").textContent = `${formatNumber(totalArea, 2)} cm²`;
    const destinations = [
      ["Almacenamiento", "destination-storage"],
      ["Reutilización", "destination-reuse"],
      ["Reciclaje", "destination-recycle"],
      ["Descarte", "destination-discard"]
    ];
    destinations.forEach(([destination, id]) => {
      const matches = records.filter((record) => record.destination === destination);
      const area = matches.reduce((sum, record) => sum + record.area, 0);
      document.getElementById(id).textContent = `${matches.length} ${matches.length === 1 ? "registro" : "registros"} · ${formatNumber(area, 2)} cm²`;
    });
  };
  const render = () => {
    tableBody.innerHTML = "";
    document.getElementById("remnant-register-block").dataset.hasRecords = records.length > 0 ? "true" : "false";
    if (records.length === 0) {
      const row = document.createElement("tr");
      row.className = "empty-row";
      const cell = document.createElement("td");
      cell.colSpan = 6;
      cell.textContent = "Todavía no hay sobrantes registrados.";
      row.appendChild(cell);
      tableBody.appendChild(row);
    } else {
      records.forEach((record) => {
        const row = document.createElement("tr");
        [record.code, `${formatNumber(record.length)} × ${formatNumber(record.width)} cm`, `${formatNumber(record.area)} cm²`, record.condition, record.destination].forEach((value) => {
          const cell = document.createElement("td");
          cell.textContent = value;
          row.appendChild(cell);
        });
        const actionCell = document.createElement("td");
        actionCell.className = "screen-only";
        const removeButton = document.createElement("button");
        removeButton.className = "remove-record";
        removeButton.type = "button";
        removeButton.dataset.removeId = record.id;
        removeButton.textContent = "Eliminar";
        removeButton.setAttribute("aria-label", `Eliminar registro ${record.code}`);
        actionCell.appendChild(removeButton);
        row.appendChild(actionCell);
        tableBody.appendChild(row);
      });
    }
    updateIndicators();
  };

  [lengthInput, widthInput].forEach((input) => input.addEventListener("input", areaPreview));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    message.classList.remove("error");
    const code = codeInput.value.trim();
    const length = parseNonNegativeNumber(lengthInput);
    const width = parseNonNegativeNumber(widthInput);
    const condition = conditionInput.value;
    const destination = destinationInput.value;
    const invalid = !code || length === null || length <= 0 || width === null || width <= 0 ||
      !CONDITIONS.includes(condition) || !DESTINATIONS.includes(destination);
    if (invalid) {
      message.textContent = "Completa todos los campos: código, largo y ancho mayores que cero, estado y destino válidos.";
      message.classList.add("error");
      setHidden(message, false);
      return;
    }
    const newRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      code,
      length,
      width,
      area: length * width,
      condition,
      destination
    };
    records.push(newRecord);
    save();
    render();
    form.reset();
    areaPreview();
    message.textContent = "Registro agregado correctamente.";
    message.classList.remove("error");
    setHidden(message, false);
  });
  tableBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-remove-id]");
    if (!button) return;
    records = records.filter((record) => record.id !== button.dataset.removeId);
    save();
    render();
    message.textContent = "Registro eliminado.";
    message.classList.remove("error");
    setHidden(message, false);
  });
  document.getElementById("export-csv").addEventListener("click", () => {
    if (records.length === 0) {
      message.textContent = "No hay registros para exportar. Agrega al menos un sobrante primero.";
      message.classList.add("error");
      setHidden(message, false);
      return;
    }
    const escapeCsv = (value) => {
      let safeValue = String(value);
      if (/^[\s]*[=+\-@]/.test(safeValue)) safeValue = "'" + safeValue;
      return `"${safeValue.replace(/"/g, '""')}"`;
    };
    const rows = [
      ["Código", "Largo (cm)", "Ancho (cm)", "Área (cm²)", "Estado", "Destino"],
      ...records.map((record) => [record.code, record.length, record.width, record.area, record.condition, record.destination])
    ];
    const csv = "\uFEFF" + rows.map((row) => row.map(escapeCsv).join(";")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "registros-sobrantes-carton.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    message.textContent = "Archivo CSV descargado correctamente.";
    message.classList.remove("error");
    setHidden(message, false);
  });
  render();
  areaPreview();
}

document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  renderCutPlan();
  renderCostChart();
  setupProductionSimulator();
  setupBudgetSimulator();
  setupRemnantRegister();
});
