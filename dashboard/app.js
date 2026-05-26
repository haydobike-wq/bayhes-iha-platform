import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";

const BAUD_RATE = 115200;
const STALE_DATA_MS = 1800;

const performanceConstants = {
  wingArea: 0.30306,
  clMax: 1.30,
  clTakeoff: 0.80,
  cdTakeoff: 0.08,
  motorThrust: 22.58,
  gravity: 9.81,
  airDensity: 1.225,
  takeoffSpeedFactor: 1.30,
  rollingFriction: 0.04,
};

const pageParents = {
  homePage: null,
  rocketSystemsPage: "homePage",
  bayhesPage: "rocketSystemsPage",
  ihaSystemsPage: "homePage",
  performancePage: "ihaSystemsPage",
  imuSimulationPage: "ihaSystemsPage",
};

let currentPage = "homePage";

const imuState = {
  raw: { roll: 0, pitch: 0, yaw: 0 },
  offset: { roll: 0, pitch: 0, yaw: 0 },
  lastDataAt: null,
  port: null,
  reader: null,
  readableClosed: null,
  keepReading: false,
  disconnecting: false,
};

const elements = {
  pages: [...document.querySelectorAll(".page")],
  bayhesForm: document.querySelector("#bayhesForm"),
  performanceForm: document.querySelector("#performanceForm"),
  connectButton: document.querySelector("#connectButton"),
  disconnectButton: document.querySelector("#disconnectButton"),
  calibrateButton: document.querySelector("#calibrateButton"),
  connectionStatus: document.querySelector("#connectionStatus"),
  supportWarning: document.querySelector("#supportWarning"),
  messageBox: document.querySelector("#messageBox"),
  rollValue: document.querySelector("#rollValue"),
  pitchValue: document.querySelector("#pitchValue"),
  yawValue: document.querySelector("#yawValue"),
  dataStatus: document.querySelector("#dataStatus"),
  lastDataTime: document.querySelector("#lastDataTime"),
  sceneBadge: document.querySelector("#sceneBadge"),
  canvas: document.querySelector("#sceneCanvas"),
  rollInvert: document.querySelector("#rollInvert"),
  pitchInvert: document.querySelector("#pitchInvert"),
  yawInvert: document.querySelector("#yawInvert"),
};

const serialSupported = "serial" in navigator;
elements.supportWarning.classList.toggle("hidden", serialSupported);
elements.connectButton.disabled = !serialSupported;

document.addEventListener("click", (event) => {
  const control = event.target.closest("[data-page-target]");
  if (!control) return;
  event.preventDefault();
  showPage(control.dataset.pageTarget);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const control = event.target.closest("[data-page-target]");
  if (!control) return;
  event.preventDefault();
  showPage(control.dataset.pageTarget);
});

elements.bayhesForm.addEventListener("submit", handleBayhesSubmit);
elements.performanceForm.addEventListener("submit", handlePerformanceSubmit);
elements.connectButton.addEventListener("click", connectSerial);
elements.disconnectButton.addEventListener("click", () => disconnectSerial("Bağlantı kesildi"));
elements.calibrateButton.addEventListener("click", calibrateView);
window.addEventListener("resize", resizeRenderer);
window.addEventListener("popstate", (event) => {
  const pageId = event.state?.page || pageParents[currentPage] || "homePage";
  showPage(pageId, false);
});
window.addEventListener("beforeunload", () => {
  imuState.keepReading = false;
  imuState.reader?.cancel().catch(() => {});
});

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070d16);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(4.5, 3, 6.5);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas: elements.canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

scene.add(new THREE.HemisphereLight(0xffffff, 0x1b2a3a, 1.6));

const keyLight = new THREE.DirectionalLight(0xffffff, 2);
keyLight.position.set(4, 6, 5);
scene.add(keyLight);

const grid = new THREE.GridHelper(10, 20, 0x2d5670, 0x1b2a3a);
grid.position.y = -1.12;
scene.add(grid);

const axes = new THREE.AxesHelper(2);
axes.position.set(-3.6, -1.05, -3.4);
scene.add(axes);

const aircraft = createAircraft();
scene.add(aircraft);

const initialPage = getInitialPageId();
history.replaceState({ page: "homePage" }, "", "#homePage");
showPage("homePage", false);
if (initialPage !== "homePage") {
  showPage(initialPage, true);
}
updateReadouts();
animate();

function getInitialPageId() {
  const hashPage = window.location.hash.replace("#", "");
  return document.querySelector(`#${hashPage}`)?.classList.contains("page") ? hashPage : "homePage";
}

function showPage(pageId, pushHistory = true) {
  const target = document.querySelector(`#${pageId}`);
  if (!target) return;
  if (pageId === currentPage && pushHistory) return;

  if (document.querySelector("#imuSimulationPage").classList.contains("page-active") && pageId !== "imuSimulationPage" && imuState.port) {
    disconnectSerial("IMU ekranından çıkıldı. Bağlantı kapatıldı.");
  }

  elements.pages.forEach((page) => {
    page.classList.toggle("page-active", page.id === pageId);
  });

  const titles = {
    homePage: "Avionix Aerospace Görev ve Operasyon Paneli",
    rocketSystemsPage: "Avionix Roket Sistemleri",
    bayhesPage: "Avionix BAYHES",
    ihaSystemsPage: "Avionix İHA Sistemleri",
    performancePage: "Avionix Performans Parametreleri",
    imuSimulationPage: "Avionix IMU Uçuş Simülasyonu",
  };

  document.title = titles[pageId] ?? titles.homePage;
  currentPage = pageId;
  if (pushHistory && window.location.hash !== `#${pageId}`) {
    history.pushState({ page: pageId }, "", `#${pageId}`);
  }
  window.scrollTo(0, 0);
  resizeRenderer();
}

function handleBayhesSubmit(event) {
  event.preventDefault();

  const velocity = Number(document.querySelector("#bayhesVelocity").value);
  const angleDeg = Number(document.querySelector("#bayhesAngle").value);
  const height = Number(document.querySelector("#bayhesHeight").value);
  const safetyFactor = Number(document.querySelector("#bayhesSafety").value);
  const g = 9.81;

  if (![velocity, angleDeg, height, safetyFactor].every(Number.isFinite) || velocity <= 0 || angleDeg <= 0 || angleDeg >= 90 || safetyFactor < 1) {
    setText("#bayhesTime", "Geçersiz veri");
    setText("#bayhesAltitude", "-");
    setText("#bayhesRange", "-");
    setText("#bayhesSafeRadius", "-");
    return;
  }

  const angleRad = THREE.MathUtils.degToRad(angleDeg);
  const vx = velocity * Math.cos(angleRad);
  const vy = velocity * Math.sin(angleRad);
  const flightTime = (vy + Math.sqrt(vy * vy + 2 * g * height)) / g;
  const maxAltitude = height + (vy * vy) / (2 * g);
  const range = vx * flightTime;
  const safeRadius = range * safetyFactor;

  setText("#bayhesTime", `${flightTime.toFixed(2)} s`);
  setText("#bayhesAltitude", `${maxAltitude.toFixed(1)} m`);
  setText("#bayhesRange", `${range.toFixed(1)} m`);
  setText("#bayhesSafeRadius", `${safeRadius.toFixed(1)} m`);
}

function handlePerformanceSubmit(event) {
  event.preventDefault();

  const massKg = Number(document.querySelector("#aircraftWeightKg").value);
  const runwayLength = Number(document.querySelector("#runwayLengthM").value);
  const c = performanceConstants;

  if (![massKg, runwayLength].every(Number.isFinite) || massKg <= 0 || runwayLength <= 0) {
    resetPerformanceResults("Geçersiz veri");
    return;
  }

  const weightN = massKg * c.gravity;
  const stallSpeed = Math.sqrt((2 * weightN) / (c.airDensity * c.wingArea * c.clMax));
  const takeoffSpeed = stallSpeed * c.takeoffSpeedFactor;
  const dynamicPressure = 0.5 * c.airDensity * takeoffSpeed * takeoffSpeed;
  const drag = dynamicPressure * c.wingArea * c.cdTakeoff;
  const liftAtTakeoff = dynamicPressure * c.wingArea * c.clTakeoff;
  const rollingResistance = c.rollingFriction * Math.max(weightN - liftAtTakeoff, 0);
  const netForce = c.motorThrust - drag - rollingResistance;
  const acceleration = netForce / massKg;
  const requiredRunway = acceleration > 0 ? (takeoffSpeed * takeoffSpeed) / (2 * acceleration) : Infinity;
  const takeoffTime = acceleration > 0 ? takeoffSpeed / acceleration : Infinity;
  const thrustWeightRatio = c.motorThrust / weightN;
  const minimumSafeRunway = Number.isFinite(requiredRunway) ? requiredRunway * 1.20 : Infinity;
  const runwayMargin = runwayLength - minimumSafeRunway;
  const runwayIsEnough = Number.isFinite(minimumSafeRunway) && runwayLength >= minimumSafeRunway;
  const runwayUsage = Number.isFinite(minimumSafeRunway) ? (minimumSafeRunway / runwayLength) * 100 : Infinity;

  let thrustStatus = "YETERSİZ";
  let thrustTone = "bad";
  if (thrustWeightRatio >= 0.55) {
    thrustStatus = "YETERLİ";
    thrustTone = "ok";
  } else if (thrustWeightRatio >= 0.40) {
    thrustStatus = "SINIRDA";
    thrustTone = "warn";
  }

  const runwayStatus = runwayIsEnough ? "YETERLİ" : "YETERSİZ";
  const runwayTone = runwayIsEnough ? "ok" : "bad";

  let decision = "KALKIŞ RİSKLİ / UYGUN DEĞİL";
  let decisionTone = "bad";
  let risk = "YÜKSEK";
  let riskTone = "bad";

  if (runwayIsEnough && thrustStatus === "YETERLİ") {
    decision = "KALKIŞ UYGUN";
    decisionTone = "ok";
    risk = "DÜŞÜK";
    riskTone = "ok";
  } else if (runwayIsEnough && thrustStatus === "SINIRDA") {
    decision = "KALKIŞ SINIRDA";
    decisionTone = "warn";
    risk = "ORTA";
    riskTone = "warn";
  }

  setText("#stallSpeedMsResult", `${stallSpeed.toFixed(2)} m/s`);
  setText("#stallSpeedKmhResult", `${(stallSpeed * 3.6).toFixed(1)} km/h`);
  setText("#takeoffSpeedMsResult", `${takeoffSpeed.toFixed(2)} m/s`);
  setText("#takeoffSpeedKmhResult", `${(takeoffSpeed * 3.6).toFixed(1)} km/h`);
  setText("#requiredRunwayResult", Number.isFinite(requiredRunway) ? `${requiredRunway.toFixed(1)} m` : "Yetersiz itki");
  setText("#minimumSafeRunwayResult", Number.isFinite(minimumSafeRunway) ? `${minimumSafeRunway.toFixed(1)} m` : "-");
  setText("#runwayMarginResult", Number.isFinite(runwayMargin) ? `${runwayMargin.toFixed(1)} m` : "-");
  setText("#takeoffTimeResult", Number.isFinite(takeoffTime) ? `${takeoffTime.toFixed(1)} s` : "-");
  setText("#takeoffAccelerationResult", acceleration > 0 ? `${acceleration.toFixed(2)} m/s²` : "Yetersiz");
  setText("#thrustWeightResult", thrustWeightRatio.toFixed(2));
  setText("#thrustStatusResult", thrustStatus);
  setText("#runwayStatusResult", runwayStatus);
  setText("#runwayUsageResult", Number.isFinite(runwayUsage) ? `%${runwayUsage.toFixed(0)}` : "-");
  setText("#takeoffDecisionResult", decision);
  setText("#riskLevelResult", risk);

  setCardTone("#thrustStatusCard", thrustTone);
  setCardTone("#runwayStatusCard", runwayTone);
  setCardTone("#takeoffDecisionCard", decisionTone);
  setCardTone("#riskLevelCard", riskTone);
  setCardTone("#runwayMarginCard", runwayIsEnough ? "ok" : "bad");
  setCardTone("#runwayUsageCard", runwayUsage <= 80 ? "ok" : runwayUsage <= 100 ? "warn" : "bad");
}

function resetPerformanceResults(message) {
  [
    "#stallSpeedMsResult",
    "#stallSpeedKmhResult",
    "#takeoffSpeedMsResult",
    "#takeoffSpeedKmhResult",
    "#requiredRunwayResult",
    "#minimumSafeRunwayResult",
    "#runwayMarginResult",
    "#takeoffTimeResult",
    "#takeoffAccelerationResult",
    "#thrustWeightResult",
    "#thrustStatusResult",
    "#runwayStatusResult",
    "#runwayUsageResult",
    "#takeoffDecisionResult",
    "#riskLevelResult",
  ].forEach((selector) => setText(selector, selector === "#takeoffDecisionResult" ? message : "-"));
}

function setCardTone(selector, tone) {
  const card = document.querySelector(selector);
  card.classList.remove("tone-ok", "tone-warn", "tone-bad");
  card.classList.add(`tone-${tone}`);
}

function setText(selector, value) {
  document.querySelector(selector).textContent = value;
}

async function connectSerial() {
  if (!serialSupported) {
    showMessage("Web Serial API desteklenmiyor. Lütfen Chrome veya Edge kullanın.", true);
    return;
  }

  clearMessage();
  elements.connectButton.disabled = true;

  try {
    imuState.port = await navigator.serial.requestPort();
    await imuState.port.open({ baudRate: BAUD_RATE });
    imuState.keepReading = true;
    imuState.disconnecting = false;
    setConnectionStatus("Bağlandı", "online");
    setButtons(true);
    readSerialLoop();
  } catch (error) {
    const message = error?.name === "NotFoundError"
      ? "Port seçimi iptal edildi. Bağlanmak için tekrar deneyebilirsiniz."
      : `Bağlantı açılamadı: ${error.message || "Bilinmeyen hata"}`;
    showMessage(message, true);
    setConnectionStatus("Bağlı değil", "offline");
    setButtons(false);
  }
}

async function readSerialLoop() {
  const textDecoder = new TextDecoderStream();
  imuState.readableClosed = imuState.port.readable.pipeTo(textDecoder.writable).catch(() => {});
  imuState.reader = textDecoder.readable.getReader();
  let buffer = "";

  try {
    while (imuState.keepReading) {
      const { value, done } = await imuState.reader.read();
      if (done) break;

      buffer += value;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const parsed = parseOrientationLine(line.trim());
        if (parsed) applyOrientation(parsed);
      }
    }
  } catch (error) {
    if (!imuState.disconnecting) {
      showMessage(`Bağlantı kesildi: ${error.message || "Cihazdan veri okunamadı."}`, true);
      setConnectionStatus("Bağlantı kesildi", "error");
    }
  } finally {
    await closeSerialResources();
    if (!imuState.disconnecting) {
      setButtons(false);
      setConnectionStatus("Bağlantı kesildi", "error");
    }
  }
}

async function disconnectSerial(message = "Bağlantı kesildi") {
  imuState.disconnecting = true;
  imuState.keepReading = false;
  setButtons(false);

  try {
    await imuState.reader?.cancel();
  } catch {
    // Reader can already be released after cable unplug.
  }

  await closeSerialResources();
  setConnectionStatus("Bağlı değil", "offline");
  showMessage(message, false);
  imuState.disconnecting = false;
}

async function closeSerialResources() {
  try {
    imuState.reader?.releaseLock();
  } catch {
    // Ignore already-released readers.
  }

  try {
    await imuState.readableClosed;
  } catch {
    // Expected while disconnecting.
  }

  try {
    if (imuState.port?.readable || imuState.port?.writable) {
      await imuState.port.close();
    }
  } catch {
    // Browser may close the port first.
  }

  imuState.reader = null;
  imuState.readableClosed = null;
  imuState.port = null;
  imuState.keepReading = false;
}

function parseOrientationLine(line) {
  if (!line) return null;

  if (line.startsWith("{")) {
    try {
      const data = JSON.parse(line);
      return normalizeOrientation(data.roll, data.pitch, data.yaw);
    } catch {
      return null;
    }
  }

  const matches = [...line.matchAll(/\b(ROLL|PITCH|YAW)\s*:\s*(-?\d+(?:\.\d+)?)/gi)];
  if (matches.length < 3) return null;

  const values = {};
  for (const match of matches) {
    values[match[1].toLowerCase()] = Number(match[2]);
  }

  return normalizeOrientation(values.roll, values.pitch, values.yaw);
}

function normalizeOrientation(roll, pitch, yaw) {
  const next = {
    roll: Number(roll),
    pitch: Number(pitch),
    yaw: Number(yaw),
  };

  return Object.values(next).every(Number.isFinite) ? next : null;
}

function applyOrientation(next) {
  imuState.raw = next;
  imuState.lastDataAt = Date.now();
  updateReadouts();
}

function calibrateView() {
  imuState.offset = { ...imuState.raw };
  updateReadouts();
  showMessage("Kalibrasyon uygulandı. Mevcut açılar model referansı kabul edildi.", false);
}

function getDisplayAngles() {
  return {
    roll: (imuState.raw.roll - imuState.offset.roll) * (elements.rollInvert.checked ? -1 : 1),
    pitch: (imuState.raw.pitch - imuState.offset.pitch) * (elements.pitchInvert.checked ? -1 : 1),
    yaw: (imuState.raw.yaw - imuState.offset.yaw) * (elements.yawInvert.checked ? -1 : 1),
  };
}

function updateReadouts() {
  const display = getDisplayAngles();
  elements.rollValue.value = display.roll.toFixed(2);
  elements.pitchValue.value = display.pitch.toFixed(2);
  elements.yawValue.value = display.yaw.toFixed(2);

  if (imuState.lastDataAt) {
    elements.lastDataTime.textContent = new Date(imuState.lastDataAt).toLocaleTimeString("tr-TR");
  }
}

function updateDataStatus() {
  const hasRecentData = imuState.lastDataAt && Date.now() - imuState.lastDataAt < STALE_DATA_MS;
  const label = hasRecentData ? "Canlı veri" : "Veri bekleniyor";
  elements.dataStatus.textContent = label;
  elements.sceneBadge.textContent = label;
  elements.sceneBadge.classList.toggle("live", Boolean(hasRecentData));
}

function updateAircraftRotation() {
  const display = getDisplayAngles();
  aircraft.rotation.order = "YXZ";
  aircraft.rotation.y = THREE.MathUtils.degToRad(display.yaw);
  aircraft.rotation.x = THREE.MathUtils.degToRad(display.roll);
  aircraft.rotation.z = THREE.MathUtils.degToRad(display.pitch);
}

function createAircraft() {
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xe7eef7, metalness: 0.18, roughness: 0.42 });
  const wingMaterial = new THREE.MeshStandardMaterial({ color: 0x35c7df, metalness: 0.06, roughness: 0.5 });
  const noseMaterial = new THREE.MeshStandardMaterial({ color: 0xf7c76b, metalness: 0.06, roughness: 0.45 });
  const tailMaterial = new THREE.MeshStandardMaterial({ color: 0x6aa7ff, metalness: 0.06, roughness: 0.48 });

  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 3.1, 32), bodyMaterial);
  fuselage.rotation.z = Math.PI / 2;
  group.add(fuselage);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 32), noseMaterial);
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = 1.85;
  group.add(nose);

  const mainWing = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 4.1), wingMaterial);
  mainWing.position.x = 0.08;
  group.add(mainWing);

  const horizontalTail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 1.35), tailMaterial);
  horizontalTail.position.set(-1.72, 0.12, 0);
  group.add(horizontalTail);

  const verticalTail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.82, 0.08), tailMaterial);
  verticalTail.position.set(-1.82, 0.5, 0);
  group.add(verticalTail);

  return group;
}

function resizeRenderer() {
  const width = elements.canvas.clientWidth;
  const height = elements.canvas.clientHeight;

  if (width > 0 && height > 0 && (elements.canvas.width !== width || elements.canvas.height !== height)) {
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
  }
}

function animate() {
  requestAnimationFrame(animate);
  resizeRenderer();
  updateReadouts();
  updateDataStatus();
  updateAircraftRotation();
  renderer.render(scene, camera);
}

function setButtons(connected) {
  elements.connectButton.disabled = connected || !serialSupported;
  elements.disconnectButton.disabled = !connected;
}

function setConnectionStatus(message, type) {
  elements.connectionStatus.textContent = message;
  elements.connectionStatus.classList.toggle("status-online", type === "online");
  elements.connectionStatus.classList.toggle("status-offline", type === "offline");
  elements.connectionStatus.classList.toggle("status-error", type === "error");
}

function showMessage(message, warning) {
  elements.messageBox.textContent = message;
  elements.messageBox.classList.toggle("notice-warning", warning);
  elements.messageBox.classList.remove("hidden");
}

function clearMessage() {
  elements.messageBox.textContent = "";
  elements.messageBox.classList.add("hidden");
}
