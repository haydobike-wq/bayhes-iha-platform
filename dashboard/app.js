import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";

const BAUD_RATE = 115200;
const STALE_DATA_MS = 1800;

const state = {
  activePage: "home",
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
  rollAxis: document.querySelector("#rollAxis"),
  pitchAxis: document.querySelector("#pitchAxis"),
  yawAxis: document.querySelector("#yawAxis"),
  performanceForm: document.querySelector("#performanceForm"),
  batteryWh: document.querySelector("#batteryWh"),
  powerW: document.querySelector("#powerW"),
  cruiseSpeed: document.querySelector("#cruiseSpeed"),
  payloadKg: document.querySelector("#payloadKg"),
  enduranceResult: document.querySelector("#enduranceResult"),
  rangeResult: document.querySelector("#rangeResult"),
  payloadResult: document.querySelector("#payloadResult"),
  pages: {
    home: document.querySelector("#homePage"),
    rocketSystems: document.querySelector("#rocketSystemsPage"),
    ihaSystems: document.querySelector("#ihaSystemsPage"),
    ihaPerformance: document.querySelector("#ihaPerformancePage"),
    bayhes: document.querySelector("#bayhesPage"),
    ihaMission: document.querySelector("#ihaMissionPage"),
    ihaAnalysis: document.querySelector("#ihaAnalysisPage"),
    rocketMission: document.querySelector("#rocketMissionPage"),
    rocketAnalysis: document.querySelector("#rocketAnalysisPage"),
    rocketTest: document.querySelector("#rocketTestPage"),
    imuSimulation: document.querySelector("#imuSimulationPage"),
  },
};

const serialSupported = "serial" in navigator;
elements.supportWarning.classList.toggle("hidden", serialSupported);
elements.connectButton.disabled = !serialSupported;

elements.connectButton.addEventListener("click", connectSerial);
elements.disconnectButton.addEventListener("click", () => disconnectSerial("Bağlantı kesildi."));
elements.calibrateButton.addEventListener("click", calibrateView);
elements.performanceForm.addEventListener("submit", handlePerformanceSubmit);

document.addEventListener("click", (event) => {
  const control = event.target.closest("[data-page-target]");
  if (!control) return;
  showPage(control.dataset.pageTarget);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const control = event.target.closest("[data-page-target]");
  if (!control) return;
  event.preventDefault();
  showPage(control.dataset.pageTarget);
});
window.addEventListener("resize", resizeRenderer);
window.addEventListener("beforeunload", () => {
  state.keepReading = false;
  state.reader?.cancel().catch(() => {});
});

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070a0f);
scene.fog = new THREE.Fog(0x070a0f, 9, 22);

const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 100);
camera.position.set(4.6, 3.1, 6.8);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas: elements.canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

scene.add(new THREE.HemisphereLight(0xdceeff, 0x17202b, 1.7));

const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
keyLight.position.set(4, 6, 5);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x6fb9ff, 0.7);
fillLight.position.set(-5, 2, -4);
scene.add(fillLight);

const grid = new THREE.GridHelper(10, 20, 0x365066, 0x182330);
grid.position.y = -1.15;
scene.add(grid);

const axes = new THREE.AxesHelper(2.2);
axes.position.set(-3.8, -1.08, -3.6);
scene.add(axes);

const aircraft = createAircraft();
scene.add(aircraft);

resizeRenderer();
updateReadouts();
showPage("home");
animate();

function showPage(pageName) {
  if (!elements.pages[pageName]) return;

  if (state.activePage === "imuSimulation" && pageName !== "imuSimulation" && state.port) {
    disconnectSerial("IMU ekranından çıkıldı. Bağlantı kapatıldı.");
  }

  state.activePage = pageName;
  for (const [name, page] of Object.entries(elements.pages)) {
    page.classList.toggle("page-active", name === pageName);
  }

  const titles = {
    home: "Avionix Aerospace Görev ve Operasyon Paneli",
    rocketSystems: "Avionix Roket Sistemleri",
    ihaSystems: "Avionix İHA Sistemleri",
    ihaPerformance: "Avionix İHA Performans Hesaplayıcı",
    bayhes: "Avionix Bayhes",
    ihaMission: "Avionix İHA Görev Operasyonu",
    ihaAnalysis: "Avionix İHA Analiz Paneli",
    rocketMission: "Avionix Roket Görev Planlama",
    rocketAnalysis: "Avionix Roket Uçuş Analizi",
    rocketTest: "Avionix Roket Yer Testleri",
    imuSimulation: "Avionix IMU Uçuş Simülasyonu",
  };

  document.title = titles[pageName] ?? titles.home;
  window.scrollTo({ top: 0, behavior: "instant" });
  resizeRenderer();
}

function handlePerformanceSubmit(event) {
  event.preventDefault();

  const batteryWh = Number(elements.batteryWh.value);
  const powerW = Number(elements.powerW.value);
  const cruiseSpeed = Number(elements.cruiseSpeed.value);
  const payloadKg = Number(elements.payloadKg.value);

  if (![batteryWh, powerW, cruiseSpeed, payloadKg].every(Number.isFinite) || batteryWh <= 0 || powerW <= 0 || cruiseSpeed <= 0) {
    elements.enduranceResult.textContent = "Geçersiz veri";
    elements.rangeResult.textContent = "-";
    elements.payloadResult.textContent = "-";
    return;
  }

  const payloadPenalty = Math.min(payloadKg * 0.035, 0.35);
  const enduranceHours = (batteryWh / powerW) * (1 - payloadPenalty);
  const enduranceMinutes = enduranceHours * 60;
  const rangeKm = enduranceHours * cruiseSpeed;

  elements.enduranceResult.textContent = `${enduranceMinutes.toFixed(1)} dk`;
  elements.rangeResult.textContent = `${rangeKm.toFixed(1)} km`;
  elements.payloadResult.textContent = `%${(payloadPenalty * 100).toFixed(1)} tüketim etkisi`;
}

async function connectSerial() {
  if (!serialSupported) {
    showMessage("Web Serial API desteklenmiyor. Lütfen Chrome veya Edge kullanın.", true);
    return;
  }

  clearMessage();
  elements.connectButton.disabled = true;

  try {
    state.port = await navigator.serial.requestPort();
    await state.port.open({ baudRate: BAUD_RATE });
    state.keepReading = true;
    state.disconnecting = false;
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
  state.readableClosed = state.port.readable.pipeTo(textDecoder.writable).catch(() => {});
  state.reader = textDecoder.readable.getReader();
  let buffer = "";

  try {
    while (state.keepReading) {
      const { value, done } = await state.reader.read();
      if (done) break;

      buffer += value;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const parsed = parseOrientationLine(line.trim());
        if (parsed) {
          applyOrientation(parsed);
        }
      }
    }
  } catch (error) {
    if (!state.disconnecting) {
      showMessage(`Bağlantı kesildi: ${error.message || "Cihazdan veri okunamadı."}`, true);
      setConnectionStatus("Bağlantı kesildi", "error");
    }
  } finally {
    await closeSerialResources();
    if (!state.disconnecting) {
      setButtons(false);
      setConnectionStatus("Bağlantı kesildi", "error");
    }
  }
}

async function disconnectSerial(message = "Bağlantı kesildi.") {
  state.disconnecting = true;
  state.keepReading = false;
  setButtons(false);

  try {
    await state.reader?.cancel();
  } catch {
    // Reader can already be released when the device is unplugged.
  }

  await closeSerialResources();
  setConnectionStatus("Bağlı değil", "offline");
  showMessage(message, false);
  state.disconnecting = false;
}

async function closeSerialResources() {
  try {
    state.reader?.releaseLock();
  } catch {
    // Ignore release errors from already-closed streams.
  }

  try {
    await state.readableClosed;
  } catch {
    // Stream closure errors are expected during disconnect.
  }

  try {
    if (state.port?.readable || state.port?.writable) {
      await state.port.close();
    }
  } catch {
    // The browser may close the port first after a cable unplug.
  }

  state.reader = null;
  state.readableClosed = null;
  state.port = null;
  state.keepReading = false;
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
  state.raw = next;
  state.lastDataAt = Date.now();
  updateReadouts();
}

function calibrateView() {
  state.offset = { ...state.raw };
  updateReadouts();
  showMessage("Kalibrasyon uygulandı. Mevcut açılar artık model referansı.", false);
}

function getDisplayAngles() {
  return {
    roll: (state.raw.roll - state.offset.roll) * (elements.rollInvert.checked ? -1 : 1),
    pitch: (state.raw.pitch - state.offset.pitch) * (elements.pitchInvert.checked ? -1 : 1),
    yaw: (state.raw.yaw - state.offset.yaw) * (elements.yawInvert.checked ? -1 : 1),
  };
}

function updateReadouts() {
  const display = getDisplayAngles();
  elements.rollValue.value = display.roll.toFixed(2);
  elements.pitchValue.value = display.pitch.toFixed(2);
  elements.yawValue.value = display.yaw.toFixed(2);

  if (state.lastDataAt) {
    elements.lastDataTime.textContent = new Date(state.lastDataAt).toLocaleTimeString("tr-TR");
  }
}

function updateDataStatus() {
  const hasRecentData = state.lastDataAt && Date.now() - state.lastDataAt < STALE_DATA_MS;
  const label = hasRecentData ? "Canlı veri" : "Veri bekleniyor";
  elements.dataStatus.textContent = label;
  elements.sceneBadge.textContent = label;
  elements.sceneBadge.classList.toggle("live", Boolean(hasRecentData));
}

function updateAircraftRotation() {
  const display = getDisplayAngles();
  const rotationByAxis = { x: 0, y: 0, z: 0 };

  rotationByAxis[elements.rollAxis.value] += THREE.MathUtils.degToRad(display.roll);
  rotationByAxis[elements.pitchAxis.value] += THREE.MathUtils.degToRad(display.pitch);
  rotationByAxis[elements.yawAxis.value] += THREE.MathUtils.degToRad(display.yaw);

  aircraft.rotation.order = "YXZ";
  aircraft.rotation.set(rotationByAxis.x, rotationByAxis.y, rotationByAxis.z);
}

function createAircraft() {
  const group = new THREE.Group();

  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xe3edf7, metalness: 0.22, roughness: 0.38 });
  const wingMaterial = new THREE.MeshStandardMaterial({ color: 0x40c6ad, metalness: 0.08, roughness: 0.5 });
  const noseMaterial = new THREE.MeshStandardMaterial({ color: 0xf0b85a, metalness: 0.08, roughness: 0.42 });
  const tailMaterial = new THREE.MeshStandardMaterial({ color: 0x7ea7ff, metalness: 0.08, roughness: 0.48 });

  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 3.2, 32), bodyMaterial);
  fuselage.rotation.z = Math.PI / 2;
  group.add(fuselage);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.62, 32), noseMaterial);
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = 1.9;
  group.add(nose);

  const mainWing = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.07, 4.2), wingMaterial);
  mainWing.position.x = 0.08;
  group.add(mainWing);

  const tailBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.45, 20), bodyMaterial);
  tailBoom.rotation.z = Math.PI / 2;
  tailBoom.position.x = -1.65;
  group.add(tailBoom);

  const horizontalTail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 1.45), tailMaterial);
  horizontalTail.position.set(-1.78, 0.12, 0);
  group.add(horizontalTail);

  const verticalTail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.86, 0.09), tailMaterial);
  verticalTail.position.set(-1.86, 0.52, 0);
  group.add(verticalTail);

  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 12), new THREE.MeshStandardMaterial({
    color: 0x16283a,
    metalness: 0.05,
    roughness: 0.18,
  }));
  cockpit.scale.set(1.35, 0.55, 0.72);
  cockpit.position.set(0.82, 0.2, 0);
  group.add(cockpit);

  return group;
}

function resizeRenderer() {
  const width = elements.canvas.clientWidth;
  const height = elements.canvas.clientHeight;

  if (elements.canvas.width !== width || elements.canvas.height !== height) {
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
