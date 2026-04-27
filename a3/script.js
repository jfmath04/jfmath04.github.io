// ******************** View Switching Logic ********************
document.getElementById("computer-hotspot").addEventListener("click", () => {
  document.getElementById("setup").classList.remove("active");
  document.getElementById("computer").classList.add("active");
  resizeCanvas();
  connectorVisibility(false);
});
document.getElementById("monitor-hotspot").addEventListener("click", () => {
  document.getElementById("setup").classList.remove("active");
  document.getElementById("monitor").classList.add("active");
  resizeCanvas();
  connectorVisibility(true);
});
document.getElementById("screen-hotspot").addEventListener("click", () => {
  document.getElementById("setup").classList.remove("active");
  document.getElementById("screen").classList.add("active");
  showScreenContent();
});
document
  .getElementById("screen-hotspot-monitor")
  .addEventListener("click", () => {
    document.getElementById("screen").classList.remove("active");
    document.getElementById("monitor").classList.add("active");
    resizeCanvas();
    connectorVisibility(true);
  });
document
  .getElementById("monitor-hotspot-screen")
  .addEventListener("click", () => {
    document.getElementById("monitor").classList.remove("active");
    document.getElementById("screen").classList.add("active");
    showScreenContent();
  });
document.getElementById("back-arrow-computer").addEventListener("click", () => {
  clearCanvases();
  document.getElementById("computer").classList.remove("active");
  document.getElementById("setup").classList.add("active");
});
document.getElementById("back-arrow-monitor").addEventListener("click", () => {
  clearCanvases();
  document.getElementById("monitor").classList.remove("active");
  document.getElementById("setup").classList.add("active");
});
document.getElementById("back-arrow-screen").addEventListener("click", () => {
  document.getElementById("screen").classList.remove("active");
  document.getElementById("setup").classList.add("active");
});

// ******************** Draggable Connectors Logic ******************
function makeDraggable(el) {
  el.addEventListener("mousedown", (e) => {
    e.preventDefault();
    el.style.cursor = "grabbing";
    document.body.classList.add("dragging");

    el.style.bottom = "";
    el.style.right = "";

    const offsetX = e.clientX - el.offsetLeft;
    const offsetY = e.clientY - el.offsetTop;

    let lastX = e.clientX;
    let lastY = e.clientY;
    const matrix = new DOMMatrix(getComputedStyle(el).transform);
    let smoothAngle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
    const smoothing = 0.1;

    // Move element with mouse
    function onMouseMove(e) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;

      el.style.left = e.clientX - offsetX + "px";
      el.style.top = e.clientY - offsetY + "px";

      if (dx !== 0 || dy !== 0) {
        let angle = Math.atan2(dy, dx) * (180 / Math.PI) - 90;

        // Clamp angle to the 180° half facing away from wire start point
        const startFrac = wireStartPoints.get(el);
        if (startFrac) {
          const startX = startFrac.x * powerComputerCanvas.width;
          const startY = startFrac.y * powerComputerCanvas.height;
          const connX = e.clientX - offsetX + el.offsetWidth / 2;
          const connY = e.clientY - offsetY + el.offsetHeight / 2;
          const awayAngle =
            Math.atan2(connY - startY, connX - startX) * (180 / Math.PI) - 90;
          let diff = angle - awayAngle;
          while (diff > 180) diff -= 360;
          while (diff < -180) diff += 360;
          if (diff > 90 || diff < -90) angle = awayAngle;
        }

        let delta = angle - smoothAngle;
        while (delta > 180) delta -= 360;
        while (delta < -180) delta += 360;
        smoothAngle += delta * smoothing;
        el.style.transform = `rotate(${smoothAngle}deg)`;
      }

      lastX = e.clientX;
      lastY = e.clientY;
    }

    function onMouseUp() {
      el.style.cursor = 'url("assets/cursors/grab.png") 11 11, grab';
      document.body.classList.remove("dragging");
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  el.style.cursor = 'url("assets/cursors/grab.png") 11 11, grab';
}

document.querySelectorAll(".connector").forEach(makeDraggable);

// ******************** Connector Logic ******************
// Plugged images
const plugTop = document.getElementById("power-plug-top-img");
const plugBottom = document.getElementById("power-plug-bottom-img");
const hdmiComputerPlug = document.getElementById("hdmi-computer-plugged-img");
const usb1Plug = document.getElementById("usb-bottom-1-plugged-img");
const usb2Plug = document.getElementById("usb-bottom-2-plugged-img");
const hdmi1Plug = document.getElementById("hdmi-1-top-plugged-img");
const hdmi2Plug = document.getElementById("hdmi-2-top-plugged-img");

// Ports
const outletTop = document.getElementById("outlet-hotspot-top");
const outletBottom = document.getElementById("outlet-hotspot-bottom");
const hdmiComputerPort = document.getElementById("computer-hotspot-hdmi");
const usb1Port = document.getElementById("computer-hotspot-usb-top");
const usb2Port = document.getElementById("computer-hotspot-usb-bottom");
const hdmi1Port = document.getElementById("monitor-hotspot-hdmi-1");
const hdmi2Port = document.getElementById("monitor-hotspot-hdmi-2");

// Connectors
const powerMonitor = document.getElementById("power-monitor-img");
const powerComputerBottom = document.getElementById(
  "power-computer-bottom-img",
);
const usbMouseBottom = document.getElementById("usb-mouse-bottom-img");
const usbKeyboardBottom = document.getElementById("usb-keyboard-bottom-img");
const hdmiComputer = document.getElementById("hdmi-bottom-img");

const powerComputerTop = document.getElementById("power-computer-top-img");
const usbMouseTop = document.getElementById("usb-mouse-top-img");
const usbKeyboardTop = document.getElementById("usb-keyboard-top-img");
const hdmiMonitor = document.getElementById("hdmi-top-img");

// Track plugged in state
const pluggedIn = new Map([
  [powerMonitor, false],
  [powerComputerBottom, false],
  [usbMouseBottom, false],
  [usbKeyboardBottom, false],
  [hdmiComputer, false],

  [powerComputerTop, false],
  [usbMouseTop, false],
  [usbKeyboardTop, false],
  [hdmiMonitor, false],
]);

const pairs = new Map([
  [powerComputerTop, powerComputerBottom],
  [usbMouseTop, usbMouseBottom],
  [usbKeyboardTop, usbKeyboardBottom],
]);

function connectorVisibility(monitorView) {
  for (const [top, bottom] of pairs.entries()) {
    if (monitorView) {
      const bottomPlugged = pluggedIn.get(bottom);
      top.style.display = bottomPlugged ? "none" : "block";
    } else {
      const topPlugged = pluggedIn.get(top);
      bottom.style.display = topPlugged ? "none" : "block";
    }
  }
}

// Multi-port system
function makePortSystem(hotspots, plugImgs, connectors) {
  let pluggedInto = Array(hotspots.length).fill(null);
  let currentDragger = null;

  // When dragging, detect if over a port
  function onDragMove(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const overIndex = hotspots.findIndex(
      (hotspot, index) => el === hotspot && pluggedInto[index] === null,
    );
    currentDragger.style.opacity = overIndex !== -1 ? "0" : "1";
    plugImgs.forEach((plugImg, index) => {
      if (pluggedInto[index] === null) {
        if (overIndex === index) {
          plugImg.style.display = "block";
          wireStartPoints.set(plugImg, wireStartPoints.get(currentDragger));
          canvases.set(plugImg, canvases.get(currentDragger));
        } else {
          plugImg.style.display = "none";
          wireStartPoints.delete(plugImg);
          canvases.delete(plugImg);
        }
      }
    });
  }

  // On drag start, disable pointer events on plugs and track the dragged connector
  function startDrag(connector) {
    const pluggedIndex = pluggedInto.findIndex((plug) => plug === connector);
    if (pluggedIndex !== -1) {
      pluggedInto[pluggedIndex] = null;
    }
    currentDragger = connector;
    connector.style.pointerEvents = "none";
    plugImgs.forEach((plugImg) => (plugImg.style.pointerEvents = "none"));
    document.addEventListener("mousemove", onDragMove);
  }

  // On drag end, check if over a port to plug in
  function endDrag(e) {
    if (!currentDragger) return;
    document.removeEventListener("mousemove", onDragMove);
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const overIndex = hotspots.findIndex(
      (hotspot, index) => el === hotspot && pluggedInto[index] === null,
    );
    currentDragger.style.pointerEvents = "";
    plugImgs.forEach((plugImg) => (plugImg.style.pointerEvents = ""));
    if (overIndex !== -1) {
      pluggedInto[overIndex] = currentDragger;
      currentDragger.style.display = "none";
      const plug = plugImgs[overIndex];
      plug.style.display = "block";
      wireStartPoints.set(plug, wireStartPoints.get(currentDragger));
      canvases.set(plug, canvases.get(currentDragger));
      pluggedIn.set(currentDragger, true);
      new Audio("assets/plug-in.mp3").play();
      if (currentDragger === hdmiMonitor || currentDragger === hdmiComputer)
        updateHdmiState(true);
      if (currentDragger === usbMouseBottom) {
        updateMouseState(true);
      }
      if (currentDragger === usbKeyboardBottom) {
        updateKeyboardState(true);
      }
    } else {
      currentDragger.style.opacity = "1";
      plugImgs.forEach((plugImg, index) => {
        if (pluggedInto[index] === null) {
          plugImg.style.display = "none";
          wireStartPoints.delete(plugImg);
          canvases.delete(plugImg);
        }
      });
      pluggedIn.set(currentDragger, false);
      if (currentDragger === powerComputerBottom) updateComputerState(false);
      if (currentDragger === powerMonitor) updateMonitorState(false);
      if (currentDragger === hdmiMonitor || currentDragger === hdmiComputer)
        updateHdmiState(false);
      if (currentDragger === usbMouseBottom) updateMouseState(false);
      if (currentDragger === usbKeyboardBottom) updateKeyboardState(false);
    }
    currentDragger = null;
  }

  // Attach event listeners
  connectors.forEach((c) =>
    c.addEventListener("mousedown", () => startDrag(c)),
  );
  document.addEventListener("mouseup", endDrag);

  // When clicking a plug image, trigger drag on the connected connector
  plugImgs.forEach((plugImg, index) => {
    plugImg.addEventListener("mousedown", (e) => {
      const connector = pluggedInto[index];
      if (!connector) return;
      e.preventDefault();
      connector.style.display = "";
      connector.style.opacity = "0";
      connector.style.left = e.clientX - connector.offsetWidth / 2 + "px";
      connector.style.top = e.clientY - connector.offsetHeight / 2 + "px";
      connector.dispatchEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          clientX: e.clientX,
          clientY: e.clientY,
        }),
      );
    });
  });
}

makePortSystem(
  [outletTop, outletBottom],
  [plugTop, plugBottom],
  [powerMonitor, powerComputerBottom],
);
makePortSystem(
  [usb1Port, usb2Port],
  [usb1Plug, usb2Plug],
  [usbMouseBottom, usbKeyboardBottom],
);

makePortSystem([hdmiComputerPort], [hdmiComputerPlug], [hdmiComputer]);

makePortSystem([hdmi1Port, hdmi2Port], [hdmi1Plug, hdmi2Plug], [hdmiMonitor]);

// ******************** Wire Logic ******************
const powerMonitorCanvas = document.getElementById("power-monitor-canvas");
const powerMonitorCtx = powerMonitorCanvas.getContext("2d");
const powerComputerCanvas = document.getElementById(
  "power-computer-bottom-canvas",
);
const powerComputerCtx = powerComputerCanvas.getContext("2d");
const usbMouseCanvas = document.getElementById("usb-mouse-bottom-canvas");
const usbMouseCtx = usbMouseCanvas.getContext("2d");
const usbKeyboardCanvas = document.getElementById("usb-keyboard-bottom-canvas");
const usbKeyboardCtx = usbKeyboardCanvas.getContext("2d");
const hdmiCanvas = document.getElementById("hdmi-bottom-canvas");
const hdmiCtx = hdmiCanvas.getContext("2d");

const powerComputerTopCanvas = document.getElementById(
  "power-computer-top-canvas",
);
const powerComputerTopCtx = powerComputerTopCanvas.getContext("2d");
const usbMouseTopCanvas = document.getElementById("usb-mouse-top-canvas");
const usbMouseTopCtx = usbMouseTopCanvas.getContext("2d");
const usbKeyboardTopCanvas = document.getElementById("usb-keyboard-top-canvas");
const usbKeyboardTopCtx = usbKeyboardTopCanvas.getContext("2d");
const hdmiTopCanvas = document.getElementById("hdmi-top-canvas");
const hdmiTopCtx = hdmiTopCanvas.getContext("2d");

function resizeCanvas() {
  for (const c of [
    powerMonitorCanvas,
    powerComputerCanvas,
    usbMouseCanvas,
    usbKeyboardCanvas,
    hdmiCanvas,

    powerComputerTopCanvas,
    usbMouseTopCanvas,
    usbKeyboardTopCanvas,
    hdmiTopCanvas,
  ]) {
    c.width = c.offsetWidth;
    c.height = c.offsetHeight;
  }
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Wire start points as fractions of canvas size {x, y}
// These represent where each cable exits the screen edge toward its peripheral
const wireStartPoints = new Map([
  [powerMonitor, { x: 0.04, y: 0.0 }], // monitor power — left edge
  [powerComputerBottom, { x: 0.9, y: 0.6 }], // computer power — bottom edge toward outlet
  [usbMouseBottom, { x: 0.315, y: 0.0 }], // mouse usb — bottom right
  [usbKeyboardBottom, { x: -0.01, y: 0.4 }], // keyboard usb — bottom center
  [hdmiComputer, { x: 0.523, y: 0.0 }], // hdmi — left edge toward monitor

  [powerComputerTop, { x: 0.824, y: 1.1 }], // computer power — bottom edge toward outlet
  [usbMouseTop, { x: 0.15, y: 1.1 }], // mouse usb — bottom right
  [usbKeyboardTop, { x: 0.35, y: 1.1 }], // keyboard usb — bottom center
  [hdmiMonitor, { x: 0.6, y: 1.1 }], // hdmi — left edge toward monitor
]);

// Fixed exit angles (radians) for plug images.
const plugAngles = new Map([
  [plugTop, Math.PI],
  [plugBottom, Math.PI],
  [hdmiComputerPlug, -Math.PI / 2],
  [usb1Plug, -Math.PI / 2],
  [usb2Plug, -Math.PI / 2],
  [hdmi1Plug, Math.PI],
  [hdmi2Plug, Math.PI],
]);

const canvases = new Map([
  [powerMonitor, { canvas: powerMonitorCanvas, ctx: powerMonitorCtx }],
  [powerComputerBottom, { canvas: powerComputerCanvas, ctx: powerComputerCtx }],
  [usbMouseBottom, { canvas: usbMouseCanvas, ctx: usbMouseCtx }],
  [usbKeyboardBottom, { canvas: usbKeyboardCanvas, ctx: usbKeyboardCtx }],
  [hdmiComputer, { canvas: hdmiCanvas, ctx: hdmiCtx }],

  [
    powerComputerTop,
    { canvas: powerComputerTopCanvas, ctx: powerComputerTopCtx },
  ],
  [usbMouseTop, { canvas: usbMouseTopCanvas, ctx: usbMouseTopCtx }],
  [usbKeyboardTop, { canvas: usbKeyboardTopCanvas, ctx: usbKeyboardTopCtx }],
  [hdmiMonitor, { canvas: hdmiTopCanvas, ctx: hdmiTopCtx }],
]);

const wireWidthFactor = new Map([
  [powerMonitor, 0.2],
  [powerComputerBottom, 0.2],
  [usbMouseBottom, 0.15],
  [usbKeyboardBottom, 0.15],
  [hdmiComputer, 0.2],
  [plugTop, 0.15],
  [plugBottom, 0.15],
  [hdmiComputerPlug, 0.2],
  [usb1Plug, 0.1],
  [usb2Plug, 0.1],
  [powerComputerTop, 0.2],
  [usbMouseTop, 0.15],
  [usbKeyboardTop, 0.15],
  [hdmiMonitor, 0.2],
  [hdmi1Plug, 0.25],
  [hdmi2Plug, 0.25],
]);

function getConnectorCenter(el, canvas) {
  const rect = el.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2 - canvasRect.left,
    y: rect.top + rect.height / 2 - canvasRect.top,
  };
}

function clearCanvases() {
  for (const { canvas, ctx } of canvases.values()) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function drawWires() {
  clearCanvases();
  for (const [el, startFrac] of wireStartPoints) {
    const canvas = canvases.get(el).canvas;
    const ctx = canvases.get(el).ctx;
    if (!canvas || !ctx) continue;

    if (el.style.display === "none" || el.style.opacity === "0") continue;
    if (el.offsetWidth === 0 && el.offsetHeight === 0) continue;

    const start = {
      x: startFrac.x * canvas.width,
      y: startFrac.y * canvas.height,
    };
    const center = getConnectorCenter(el, canvas);

    // Control point exits from connector tip along its facing direction
    const matrix = new DOMMatrix(getComputedStyle(el).transform);
    const angleRad = plugAngles.has(el)
      ? plugAngles.get(el)
      : Math.atan2(matrix.b, matrix.a);
    const halfH = Math.max(el.offsetWidth, el.offsetHeight) / 2;

    // Wire attaches to the back of the connector (opposite to facing direction)
    const trimOffset = 10;
    let end = {
      x: center.x + Math.sin(angleRad) * (halfH - trimOffset),
      y: center.y - Math.cos(angleRad) * (halfH - trimOffset),
    };
    if (el === plugTop || el === plugBottom) {
      end = {
        x: center.x,
        y: center.y,
      };
    }

    if (el === hdmi1Plug || el === hdmi2Plug) {
      end = {
        x: center.x,
        y: center.y + halfH * 0.25,
      };
    }

    const ctrlDist = halfH * (center.y / canvas.height) * 4;
    // ctrl1: exits connector tip in its facing direction
    const ctrl1 = {
      x: end.x + Math.sin(angleRad) * ctrlDist,
      y: end.y - Math.cos(angleRad) * ctrlDist,
    };

    // ctrl2: near start point, pulled down by gravity
    const droop = canvas.height * (center.y / canvas.height) * 0.3;
    const ctrl2 = {
      x: start.x,
      y: start.y + droop,
    };

    const wireWidth =
      Math.min(el.offsetWidth, el.offsetHeight) * wireWidthFactor.get(el);

    // Draw border (wider, darker stroke underneath)
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.bezierCurveTo(ctrl2.x, ctrl2.y, ctrl1.x, ctrl1.y, end.x, end.y);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = wireWidth + 2;
    ctx.lineCap = "round";
    ctx.stroke();

    // Draw fill (narrower stroke on top)
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.bezierCurveTo(ctrl2.x, ctrl2.y, ctrl1.x, ctrl1.y, end.x, end.y);
    ctx.strokeStyle = "#FFF";
    ctx.lineWidth = wireWidth;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  requestAnimationFrame(drawWires);
}

drawWires();

const buttonPressSound = new Audio("assets/button-press.mp3");
function playButtonPress() {
  buttonPressSound.currentTime = 0;
  buttonPressSound.play();
}

// ******************** Screen Cursor Elements ********************
const screenCursor = document.getElementById("screen-cursor");
const screenAreaEl = document.getElementById("screen-area");

// ******************** Power Logic ********************
// Computer
let computerOn = false;
const computerPower = document.getElementById("computer-hotspot-power");
const computerImg = document.getElementById("computer-img");
const computerOnImg = document.getElementById("computer-on-img");
const setupOnImg = document.getElementById("setup-on-img");

function updateComputerState(on) {
  computerOn = on;
  computerOnImg.style.opacity = on ? "1" : "0";
  setupOnImg.style.display = on ? "block" : "none";
  if (monitorOn && !booting) showScreenContent();
  updateScreenAreaCursor();
}

computerPower.addEventListener("click", () => {
  playButtonPress();
  if (computerOn) {
    updateComputerState(false);
  } else if (pluggedIn.get(powerComputerBottom)) {
    updateComputerState(true);
  }
});

// Monitor
let monitorOn = false;
const screenPower = document.getElementById("screen-hotspot-power");
const screenImg = document.getElementById("screen-img");
const screenOnImg = document.getElementById("screen-on-img");
const stickyNote = document.getElementById("sticky-note-hotspot");

// Screen
const bootDiv = document.getElementById("boot");
const screenEmpty = document.getElementById("screen-empty-boot");
const logoImg = document.getElementById("logo-img");

const screenContent = document.getElementById("screen-content");
const noDisplay = document.getElementById("no-display");
const screenDesktop = document.getElementById("desktop");
const screenBrowserContent = document.getElementById("browser-content");
const screenNewTab = document.getElementById("screen-newtab");
const screenError = document.getElementById("screen-error");
const screenSuccess = document.getElementById("screen-success");
const screenBrowser = document.getElementById("screen-browser");
const searchBar = document.getElementById("search-bar");

const browserSearch = document.getElementById("search-hotspot");
const browserClose = document.getElementById("browser-close-hotspot");

let booting = false;

logoImg.addEventListener("animationend", () => {
  logoImg.classList.remove("animating");
  bootDiv.style.display = "none";

  if (booting) {
    booting = false;
    showScreenContent();
    updateScreenAreaCursor();
  }
});

function updateMonitorState(on) {
  monitorOn = on;
  screenOnImg.style.opacity = on ? "1" : "0";
  if (on) {
    booting = true;
    bootDiv.style.display = "block";
    screenOnImg.addEventListener("transitionend", function handler() {
      screenOnImg.removeEventListener("transitionend", handler);
      if (!booting) return;
      setTimeout(() => {
        if (!booting) return;
        screenEmpty.style.opacity = "1";
        setTimeout(() => {
          if (!booting) return;
          logoImg.classList.add("animating");
        }, 1000);
      }, 1000);
    });
  } else {
    booting = false;
    bootDiv.style.display = "none";
    screenContent.style.display = "none";
    logoImg.classList.remove("animating");
    screenCursor.style.display = "none";
    updateScreenAreaCursor();
  }
}

screenPower.addEventListener("click", () => {
  playButtonPress();
  if (monitorOn) {
    updateMonitorState(false);
  } else if (pluggedIn.get(powerMonitor)) {
    updateMonitorState(true);
  }
});

let hdmi1 = false;
let hdmi2 = false;
let keyboard = false;
let mouse = false;

function updateHdmiState(plugged) {
  const connectorPlugged =
    pluggedIn.get(hdmiMonitor) && pluggedIn.get(hdmiComputer);
  hdmi1 = plugged && connectorPlugged && hdmi1Plug.style.display === "block";
  hdmi2 = plugged && connectorPlugged && hdmi2Plug.style.display === "block";
  if (monitorOn && !booting) showScreenContent();
  updateScreenAreaCursor();
}

function updateKeyboardState(plugged) {
  keyboard = plugged && pluggedIn.get(usbKeyboardBottom);
}

function updateMouseState(plugged) {
  mouse = plugged && pluggedIn.get(usbMouseBottom);
  updateScreenAreaCursor();
}

function updateScreenAreaCursor() {
  const active = mouse && monitorOn && !booting && hasHdmiContent();
  screenAreaEl.classList.toggle("mouse-active", active);
  screenCursor.style.display = active ? "block" : "none";
}

let screenActive = noDisplay;

function showScreenContent() {
  if (!monitorOn) return;
  screenContent.style.display = "block";
  screenActive.style.display = "none";
  const activeHdmi =
    displayState === 0 ? hdmi1 : displayState === 1 ? hdmi2 : false;
  if (!computerOn || !activeHdmi) {
    noDisplay.style.display = "block";
    screenActive = noDisplay;
    toggleBrowserContent(false);
  } else {
    screenDesktop.style.display = "block";
    screenActive = screenDesktop;
    toggleBrowserContent(browserActive);
  }
}

function switchScreenContent(screen) {
  screenActive.style.display = "none";
  screen.style.display = "block";
  screenActive = screen;
}

let browserActive = false;
let browserTab = screenNewTab;

function toggleBrowserContent(on) {
  if (on) {
    screenBrowserContent.style.display = "block";
    switchBrowserContent(browserTab);
  } else {
    screenBrowserContent.style.display = "none";
  }
}

function switchBrowserContent(tab) {
  browserTab.style.display = "none";
  tab.style.display = "block";
  browserTab = tab;
}

screenBrowser.addEventListener("click", () => {
  browserActive = !browserActive;
  toggleBrowserContent(browserActive);
});

browserClose.addEventListener("click", () => {
  browserActive = false;
  toggleBrowserContent(false);
});

target = "w-o-r-l-d-w-i-d-e-w-e-b.org";

let successShown = false;
let restart = document.getElementById("restart-btn");
restart.addEventListener("click", () => location.reload());

function launchCats() {
  const area = screenBrowserContent;
  const W = area.offsetWidth;
  const H = area.offsetHeight;
  const catsPerEdge = 3;
  const peekAmount = 0.8;

  const cats = [];

  for (let edge = 0; edge < 4; edge++) {
    for (let j = 0; j < catsPerEdge; j++) {
      const size = 100 + Math.random() * 100;
      const overflow = size * 1.5;
      const t = (j + 0.5 + (Math.random() - 0.5) * 0.6) / catsPerEdge;
      let startX, startY, peekX, peekY, angle;

      if (edge === 0) {
        startX = t * (W - size);
        startY = -overflow;
        peekX = startX;
        peekY = -size * (1 - peekAmount);
        angle = 180;
      } else if (edge === 1) {
        startX = t * (W - size);
        startY = H + overflow - size;
        peekX = startX;
        peekY = H - size * peekAmount;
        angle = 0;
      } else if (edge === 2) {
        startX = -overflow;
        startY = t * (H - size);
        peekX = -size * (1 - peekAmount);
        peekY = startY;
        angle = 90;
      } else {
        startX = W + overflow - size;
        startY = t * (H - size);
        peekX = W - size * peekAmount;
        peekY = startY;
        angle = -90;
      }

      angle += Math.random() * 20 - 10;
      cats.push({ size, startX, startY, peekX, peekY, angle });
    }
  }

  // Shuffle
  for (let i = cats.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cats[i], cats[j]] = [cats[j], cats[i]];
  }

  cats.forEach(({ size, startX, startY, peekX, peekY, angle }, index) => {
    const cat = document.createElement("img");
    cat.src = "assets/cat.png";
    cat.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: auto;
      pointer-events: none;
      z-index: 20;
      left: ${startX}px;
      top: ${startY}px;
      transform: rotate(${angle}deg);
    `;
    area.appendChild(cat);

    const isLast = index === cats.length - 1;
    setTimeout(() => {
      cat
        .animate(
          [
            { left: startX + "px", top: startY + "px" },
            { left: peekX + "px", top: peekY + "px", offset: 0.4 },
            { left: peekX + "px", top: peekY + "px", offset: 0.6 },
            { left: startX + "px", top: startY + "px" },
          ],
          { duration: 3000, easing: "ease-in-out", fill: "forwards" },
        )
        .finished.then(() => {
          cat.remove();
          if (isLast) restart.style.display = "block";
        });
    }, index * 700);
  });
}

function handleSearch() {
  const query = searchBar.value.trim().replace(/\/$/, "").toLowerCase();
  if (query === "") return;
  if (query === target || query === "https://" + target) {
    switchBrowserContent(screenSuccess);
    if (!successShown) {
      successShown = true;
      launchCats();
    }
  } else {
    switchBrowserContent(screenError);
  }
}

searchBar.addEventListener("keydown", (e) => {
  if (!keyboard) {
    e.preventDefault();
    return;
  }
  if (e.key === "Enter") handleSearch();
});

searchBar.addEventListener("paste", (e) => {
  if (!keyboard) e.preventDefault();
});

browserSearch.addEventListener("click", handleSearch);
stickyNote.addEventListener("click", () => {
  navigator.clipboard.writeText(target);
});

// ******************** Display Select Logic ********************
const displayChangeDiv = document.getElementById("display-change");
const displaySelect = document.getElementById("display-select");
const screenHotspotDisplay = document.getElementById("screen-hotspot-display");

// top % positions for display-select: 0=HDMI1, 1=HDMI2, 2=DP
const displayPositions = ["14%", "39%", "64%"];
let displayState = 0;
let displayVisible = false;
let displayHideTimer = null;

function showDisplayChange() {
  if (displayHideTimer) clearTimeout(displayHideTimer);
  displayChangeDiv.style.display = "block";
  requestAnimationFrame(() => {
    displayChangeDiv.style.opacity = "1";
  });
  displayVisible = true;
  displayHideTimer = setTimeout(hideDisplayChange, 2000);
}

function hideDisplayChange() {
  displayChangeDiv.style.opacity = "0";
  displayVisible = false;
  showScreenContent();
  displayChangeDiv.addEventListener(
    "transitionend",
    () => {
      displayChangeDiv.style.display = "none";
      updateScreenAreaCursor();
    },
    { once: true },
  );
}

screenHotspotDisplay.addEventListener("click", () => {
  if (!monitorOn || booting) return;
  playButtonPress();
  if (displayVisible) {
    displayState = (displayState + 1) % 3;
    displaySelect.style.top = displayPositions[displayState];
    if (displayHideTimer) clearTimeout(displayHideTimer);
    displayHideTimer = setTimeout(hideDisplayChange, 2000);
  } else {
    showDisplayChange();
    return;
  }
});

// ******************** Screen Cursor Logic ********************

function hasHdmiContent() {
  const activeHdmi =
    displayState === 0 ? hdmi1 : displayState === 1 ? hdmi2 : false;
  return computerOn && activeHdmi;
}

document.addEventListener("mousemove", (e) => {
  if (!monitorOn || booting || !hasHdmiContent()) {
    screenCursor.style.display = "none";
    return;
  }

  if (mouse) {
    const rect = screenAreaEl.getBoundingClientRect();
    const inside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
    if (inside) {
      const wrapRect = screenCursor.parentElement.getBoundingClientRect();
      const w = screenCursor.naturalWidth;
      const h = screenCursor.naturalHeight;
      const x =
        Math.max(rect.left, Math.min(e.clientX, rect.right - w)) -
        wrapRect.left;
      const y =
        Math.max(rect.top, Math.min(e.clientY, rect.bottom - h)) - wrapRect.top;
      screenCursor.style.left = x + "px";
      screenCursor.style.top = y + "px";
      screenCursor.style.display = "none";
    } else {
      screenCursor.style.display = "block";
    }
  } else {
    screenCursor.style.display = "block";
  }
});
