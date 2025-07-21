document.addEventListener("DOMContentLoaded", () => {
  Object.assign(document.body.appendChild(document.createElement("div")), {
    id: "drag",
    style: `
      z-index: 9999;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 40px;
      -webkit-app-region: drag;
    `,
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const buttonStates = {
    dpadUp: false,
    dpadDown: false,
    dpadLeft: false,
    dpadRight: false,
    analogUp: false,
    analogDown: false,
    analogLeft: false,
    analogRight: false,
    buttonA: false,
    buttonB: false,
  };

  const stateToKeyMap = {
    dpadUp: "up",
    dpadDown: "down",
    dpadLeft: "left",
    dpadRight: "right",
    analogUp: "up",
    analogDown: "down",
    analogLeft: "left",
    analogRight: "right",
    buttonA: "enter",
    buttonB: "escape",
  };

  const keyMappings = {
    up: ["ArrowUp", 38],
    down: ["ArrowDown", 40],
    left: ["ArrowLeft", 37],
    right: ["ArrowRight", 39],
    enter: ["Enter", 13],
    escape: ["Escape", 27],
  };

  // Debounce and repeat settings
  const repeatInitialDelay = 500;
  const repeatInterval = 50;
  const releaseTimers = {};
  const repeatInitialTimers = {};
  const repeatIntervalTimers = {};

  function createKeyboardEvent(type, key) {
    const [code, keyCode] = keyMappings[key];
    const evt = new KeyboardEvent(type, {
      key: code,
      code: code,
      keyCode,
      which: keyCode,
      bubbles: true,
      cancelable: true,
      composed: true,
    });
    document.dispatchEvent(evt);
  }

  function handleButtonState(name, isPressed) {
    if (isPressed && !buttonStates[name]) {
      if (releaseTimers[name]) {
        clearTimeout(releaseTimers[name]);
        delete releaseTimers[name];
      }
      buttonStates[name] = true;
      createKeyboardEvent("keydown", stateToKeyMap[name]);

      repeatInitialTimers[name] = setTimeout(() => {
        repeatIntervalTimers[name] = setInterval(() => {
          createKeyboardEvent("keydown", stateToKeyMap[name]);
        }, repeatInterval);
      }, repeatInitialDelay);
    } else if (!isPressed && buttonStates[name]) {
      buttonStates[name] = false;

      if (repeatInitialTimers[name]) {
        clearTimeout(repeatInitialTimers[name]);
        delete repeatInitialTimers[name];
      }
      if (repeatIntervalTimers[name]) {
        clearInterval(repeatIntervalTimers[name]);
        delete repeatIntervalTimers[name];
      }

      if (releaseTimers[name]) {
        clearTimeout(releaseTimers[name]);
      }
      createKeyboardEvent("keyup", stateToKeyMap[name]);
      delete releaseTimers[name];
    }
  }

  let gamepadIndex = null;
  let rafId = null;
  const analogThreshold = 0.5;

  function processGamepad() {
    const gp = navigator.getGamepads()[gamepadIndex];
    if (gp) {
      // D-Pad
      handleButtonState("dpadUp", gp.buttons[12]?.pressed);
      handleButtonState("dpadDown", gp.buttons[13]?.pressed);
      handleButtonState("dpadLeft", gp.buttons[14]?.pressed);
      handleButtonState("dpadRight", gp.buttons[15]?.pressed);

      // Analog stick
      handleButtonState("analogLeft", gp.axes[0] < -analogThreshold);
      handleButtonState("analogRight", gp.axes[0] > analogThreshold);
      handleButtonState("analogUp", gp.axes[1] < -analogThreshold);
      handleButtonState("analogDown", gp.axes[1] > analogThreshold);

      // Face buttons
      handleButtonState("buttonA", gp.buttons[0]?.pressed);
      handleButtonState("buttonB", gp.buttons[1]?.pressed);
    }
    rafId = requestAnimationFrame(processGamepad);
  }

  window.addEventListener("gamepadconnected", (e) => {
    console.log("Gamepad connected:", e.gamepad.id);
    gamepadIndex = e.gamepad.index;
    if (rafId === null) processGamepad();
  });

  window.addEventListener("gamepaddisconnected", () => {
    console.log("Gamepad disconnected");
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    gamepadIndex = null;

    Object.keys(buttonStates).forEach((name) => {
      if (buttonStates[name]) {
        buttonStates[name] = false;
        createKeyboardEvent("keyup", stateToKeyMap[name]);
      }
      if (releaseTimers[name]) {
        clearTimeout(releaseTimers[name]);
        delete releaseTimers[name];
      }
      if (repeatInitialTimers[name]) {
        clearTimeout(repeatInitialTimers[name]);
        delete repeatInitialTimers[name];
      }
      if (repeatIntervalTimers[name]) {
        clearInterval(repeatIntervalTimers[name]);
        delete repeatIntervalTimers[name];
      }
    });
  });
});
