// --- 配置区 ---
// 翻页距离：0.1 代表滚动当前窗口高度的 10%
// 0.1 类似于 PageDown, 1.0 会滚动整个页面
const PAGE_SCROLL_RATIO = 0.1; 
// 长按多久后开始连续滚动（毫秒）
const LONG_PRESS_DELAY = 300;
// 连续滚动的时间间隔（毫秒）
const SCROLL_INTERVAL = 100;

// --- 核心逻辑 ---
let gamepadIndex;
// 用于存储上一帧的按键状态，以检测"按下"事件
let previousButtonStates = [];
// 记录每个按键开始按下的时间
let buttonPressStartTime = {};
// 记录哪些按键已经处理过短按
let shortPressHandled = {};
// 用于节流连续滚动
let lastScrollTime = 0; 

window.addEventListener("gamepadconnected", (event) => {
  console.log("手柄已连接 (翻页模式):", event.gamepad);
  gamepadIndex = event.gamepad.index;
  // 初始化按键状态数组
  previousButtonStates = Array(event.gamepad.buttons.length).fill(false);
  buttonPressStartTime = {};
  shortPressHandled = {};
  requestAnimationFrame(pollGamepadForPageTurn);
});

window.addEventListener("gamepaddisconnected", (event) => {
  console.log("手柄已断开:", event.gamepad);
  if (gamepadIndex === event.gamepad.index) {
    gamepadIndex = undefined;
  }
});

// 检查按钮是否是"新按下"的
function isButtonPressed(gamepad, buttonIndex) {
  // 当前帧按钮是按下的，并且上一帧按钮是弹起的
  return gamepad.buttons[buttonIndex]?.pressed && !previousButtonStates[buttonIndex];
}

// 检查按钮是否被按住
function isButtonHeld(gamepad, buttonIndex) {
  return gamepad.buttons[buttonIndex]?.pressed;
}

// 检查按钮是否刚刚松开
function isButtonReleased(gamepad, buttonIndex) {
  // 当前帧按钮是弹起的，并且上一帧按钮是按下的
  return !gamepad.buttons[buttonIndex]?.pressed && previousButtonStates[buttonIndex];
}

function pollGamepadForPageTurn() {
  if (gamepadIndex === undefined) {
    return;
  }

  const gamepad = navigator.getGamepads()[gamepadIndex];
  if (!gamepad) {
    requestAnimationFrame(pollGamepadForPageTurn);
    return;
  }

  // --- 按键映射 (翻页模式) ---
  // 方向键上: 按钮 12
  // 方向键下: 按钮 13
  // 方向键左: 按钮 14
  // 方向键右: 按钮 15

  const now = Date.now();
  const scrollDistanceY = window.innerHeight * PAGE_SCROLL_RATIO;
  const scrollDistanceX = window.innerWidth * PAGE_SCROLL_RATIO;
  const buttons = [12, 13, 14, 15]; // 要检测的按键

  for (const buttonIndex of buttons) {
    // 检测按键刚按下
    if (isButtonPressed(gamepad, buttonIndex)) {
      buttonPressStartTime[buttonIndex] = now;
      shortPressHandled[buttonIndex] = false;
      
      // 立即执行短按滚动
      performScroll(buttonIndex, scrollDistanceY, scrollDistanceX);
      shortPressHandled[buttonIndex] = true;
      lastScrollTime = now;
    }
    
    // 检测按键松开
    if (isButtonReleased(gamepad, buttonIndex)) {
      delete buttonPressStartTime[buttonIndex];
      delete shortPressHandled[buttonIndex];
    }
    
    // 检测长按连续滚动
    if (isButtonHeld(gamepad, buttonIndex) && 
        buttonPressStartTime[buttonIndex] && 
        shortPressHandled[buttonIndex] &&
        now - buttonPressStartTime[buttonIndex] >= LONG_PRESS_DELAY &&
        now - lastScrollTime >= SCROLL_INTERVAL) {
      
      performScroll(buttonIndex, scrollDistanceY, scrollDistanceX);
      lastScrollTime = now;
    }
  }

  // --- 更新状态 ---
  // 在帧的末尾，记录当前所有按钮的状态，供下一帧比较
  previousButtonStates = gamepad.buttons.map(b => b.pressed);

  // 继续下一帧的轮询
  requestAnimationFrame(pollGamepadForPageTurn);
}

// 执行滚动的函数
function performScroll(buttonIndex, scrollDistanceY, scrollDistanceX) {
  let dx = 0;
  let dy = 0;

  if (buttonIndex === 12) { // 方向键上
    dy = -scrollDistanceY;
  } else if (buttonIndex === 13) { // 方向键下
    dy = scrollDistanceY;
  } else if (buttonIndex === 14) { // 方向键左
    dx = -scrollDistanceX;
  } else if (buttonIndex === 15) { // 方向键右
    dx = scrollDistanceX;
  }
  
  if (dx !== 0 || dy !== 0) {
    window.scrollBy({
      top: dy,
      left: dx,
      behavior: "smooth"
    });
  }
}

// 初始检查
const gamepads = navigator.getGamepads();
for (const gp of gamepads) {
    if (gp) {
        gamepadIndex = gp.index;
        console.log("检测到已连接的手柄 (翻页模式):", gp);
        previousButtonStates = Array(gp.buttons.length).fill(false);
        buttonPressStartTime = {};
        shortPressHandled = {};
        requestAnimationFrame(pollGamepadForPageTurn);
        break;
    }
}