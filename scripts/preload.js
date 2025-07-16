const controllerEnabled = process.argv.includes("--controller-support");

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

if (controllerEnabled) {
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

    let gamepadIndex = null;
    let animationFrame = null;
    const analogThreshold = 0.5;

    const keyMappings = {
      up: ["ArrowUp", 38],
      down: ["ArrowDown", 40],
      left: ["ArrowLeft", 37],
      right: ["ArrowRight", 39],
      enter: ["Enter", 13],
      escape: ["Escape", 27],
    };

    function createKeyboardEvent(type, key) {
      const [code, keyCode] = keyMappings[key];
      const event = new KeyboardEvent(type, {
        key: code,
        code: code,
        keyCode: keyCode,
        which: keyCode,
        bubbles: true,
        cancelable: true,
        composed: true,
      });

      document.activeElement.dispatchEvent(event);
    }

    function handleButtonState(stateName, isPressed) {
      if (buttonStates[stateName] !== isPressed) {
        buttonStates[stateName] = isPressed;
        const key = stateToKeyMap[stateName];
        createKeyboardEvent(isPressed ? "keydown" : "keyup", key);
      }
    }

    function processGamepad() {
      const gamepad = navigator.getGamepads()[gamepadIndex];
      if (!gamepad) return;

      handleButtonState("dpadUp", gamepad.buttons[12]?.pressed);
      handleButtonState("dpadDown", gamepad.buttons[13]?.pressed);
      handleButtonState("dpadLeft", gamepad.buttons[14]?.pressed);
      handleButtonState("dpadRight", gamepad.buttons[15]?.pressed);

      handleButtonState("analogLeft", gamepad.axes[0] < -analogThreshold);
      handleButtonState("analogRight", gamepad.axes[0] > analogThreshold);
      handleButtonState("analogUp", gamepad.axes[1] < -analogThreshold);
      handleButtonState("analogDown", gamepad.axes[1] > analogThreshold);

      handleButtonState("buttonA", gamepad.buttons[0]?.pressed);
      handleButtonState("buttonB", gamepad.buttons[1]?.pressed);

      animationFrame = requestAnimationFrame(processGamepad);
    }

    window.addEventListener("gamepadconnected", (event) => {
      console.log("Gamepad connected:", event.gamepad.id);
      gamepadIndex = event.gamepad.index;
      if (animationFrame === null) {
        processGamepad();
      }
    });

    window.addEventListener("gamepaddisconnected", () => {
      console.log("Gamepad disconnected");
      cancelAnimationFrame(animationFrame);
      gamepadIndex = null;
      animationFrame = null;

      Object.entries(buttonStates).forEach(([stateName, isPressed]) => {
        if (isPressed) {
          buttonStates[stateName] = false;
          const key = stateToKeyMap[stateName];
          createKeyboardEvent("keyup", key);
        }
      });
    });
  });
}
