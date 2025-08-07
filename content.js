// --- 配置区 ---
// 翻页距离：0.1 代表滚动当前窗口高度的 10%
// 0.1 类似于 PageDown, 1.0 会滚动整个页面
const PAGE_SCROLL_RATIO = 0.1; 

// --- 核心逻辑 ---
let gamepadIndex;
// 用于存储上一帧的按键状态，以检测“按下”事件而不是“按住”状态
let previousButtonStates = []; 

window.addEventListener("gamepadconnected", (event) => {
  console.log("手柄已连接 (翻页模式):", event.gamepad);
  gamepadIndex = event.gamepad.index;
  // 初始化按键状态数组
  previousButtonStates = Array(event.gamepad.buttons.length).fill(false);
  requestAnimationFrame(pollGamepadForPageTurn);
});

window.addEventListener("gamepaddisconnected", (event) => {
  console.log("手柄已断开:", event.gamepad);
  if (gamepadIndex === event.gamepad.index) {
    gamepadIndex = undefined;
  }
});

// 检查按钮是否是“新按下”的
function isButtonPressed(gamepad, buttonIndex) {
  // 当前帧按钮是按下的，并且上一帧按钮是弹起的
  return gamepad.buttons[buttonIndex]?.pressed && !previousButtonStates[buttonIndex];
}

function pollGamepadForPageTurn() {
  if (gamepadIndex === undefined) {
    return;
  }

  const gamepad = navigator.getGamepads()[gamepadIndex];
  if (!gamepad) {
    // 更新上一帧状态后继续轮询
    requestAnimationFrame(pollGamepadForPageTurn);
    return;
  }

  // --- 按键映射 (翻页模式) ---
  // 方向键上: 按钮 12
  // 方向键下: 按钮 13
  // 方向键左: 按钮 14
  // 方向键右: 按钮 15

  const scrollDistanceY = window.innerHeight * PAGE_SCROLL_RATIO;
  const scrollDistanceX = window.innerWidth * PAGE_SCROLL_RATIO;

  let dx = 0;
  let dy = 0;

  if (isButtonPressed(gamepad, 12)) { // 方向键上
    dy = -scrollDistanceY;
  } else if (isButtonPressed(gamepad, 13)) { // 方向键下
    dy = scrollDistanceY;
  }

  if (isButtonPressed(gamepad, 14)) { // 方向键左
    dx = -scrollDistanceX;
  } else if (isButtonPressed(gamepad, 15)) { // 方向键右
    dx = scrollDistanceX;
  }
  
  if (dx !== 0 || dy !== 0) {
    window.scrollBy({
      top: dy,
      left: dx,
      behavior: "smooth"
    });
  }

  // --- 更新状态 ---
  // 在帧的末尾，记录当前所有按钮的状态，供下一帧比较
  previousButtonStates = gamepad.buttons.map(b => b.pressed);

  // 继续下一帧的轮询
  requestAnimationFrame(pollGamepadForPageTurn);
}

// 初始检查
const gamepads = navigator.getGamepads();
for (const gp of gamepads) {
    if (gp) {
        gamepadIndex = gp.index;
        console.log("检测到已连接的手柄 (翻页模式):", gp);
        previousButtonStates = Array(gp.buttons.length).fill(false);
        requestAnimationFrame(pollGamepadForPageTurn);
        break;
    }
}