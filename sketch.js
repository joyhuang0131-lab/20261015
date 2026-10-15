// 全域變數定義
let allQuestions = [];       // 存放從 CSV 讀取的所有 15 題題庫
let questions = [];          // 每次隨機抽出的 5 道題目
let currentQuestionIndex = 0; // 當前進行到第幾題
let score = 0;               // 玩家總得分
let selectedOption = -1;     // 當前點擊的選項 (-1 表示尚未選擇)
let isAnswered = false;      // 當前題目是否已經回答
let shakeOffset = 0;         // 錯誤選項的左右震盪位移量
let shakeTimer = 0;          // 震盪動畫計時器
let isLoading = true;        // 讀取狀態旗標

// 預先載入 CSV 題庫
function preload() {
  // 使用 p5.js 的 loadTable 讀取 questions.csv，設定 header: true 自動抓取欄位名稱
  loadTable('questions.csv', 'csv', 'header', 
    // 成功回呼函數
    function(table) {
      for (let i = 0; i < table.getRowCount(); i++) {
        let row = table.getRow(i);
        allQuestions.push({
          question: row.get('question'),
          options: [
            row.get('opt1'),
            row.get('opt2'),
            row.get('opt3'),
            row.get('opt4')
          ],
          answer: int(row.get('answer'))
        });
      }
      initQuiz(); // 題庫載入完成後初始化題目
      isLoading = false;
    },
    // 錯誤回呼函數
    function(err) {
      console.error("無法載入 questions.csv 檔案，請確認是否透過伺服器執行網頁：", err);
    }
  );
}

// p5.js 初始化設定
function setup() {
  createCanvas(windowWidth, windowHeight);
}

// 初始化測驗：從題庫中隨機抽取出 5 題
function initQuiz() {
  let shuffled = shuffle([...allQuestions]); // 複製並隨機打亂題庫順序
  questions = shuffled.slice(0, 5);          // 取前 5 題作為本次測驗題目
  currentQuestionIndex = 0;
  score = 0;
  isAnswered = false;
  selectedOption = -1;
}

// p5.js 主重複繪製循環
function draw() {
  background(240, 244, 248);

  // 如果還在載入 CSV 檔案，顯示載入提示
  if (isLoading) {
    fill(50);
    drawMixedText("正在載入題庫，請稍候...", width / 2, height / 2, 24, CENTER);
    return;
  }

  // 判斷是否已完成所有題目
  if (currentQuestionIndex < questions.length) {
    displayQuestion();
  } else {
    displayScore();
  }
}

/**
 * 智慧中英文字型混合渲染函數
 * 自動判斷字元：中文套用 Noto Serif TC，英文/數字/符號套用 Isometra
 */
function drawMixedText(str, x, y, size, align = CENTER) {
  push();
  textSize(size);
  
  let chars = str.split('');
  let totalWidth = 0;

  for (let i = 0; i < chars.length; i++) {
    let c = chars[i];
    if (isChinese(c)) {
      textFont("Noto Serif TC");
    } else {
      textFont("Isometra");
    }
    totalWidth += textWidth(c);
  }

  let currentX = x;
  if (align === CENTER) {
    currentX = x - totalWidth / 2;
  } else if (align === RIGHT) {
    currentX = x - totalWidth;
  }

  for (let i = 0; i < chars.length; i++) {
    let c = chars[i];
    if (isChinese(c)) {
      textFont("Noto Serif TC");
    } else {
      textFont("Isometra");
    }
    text(c, currentX, y);
    currentX += textWidth(c);
  }
  pop();
}

// 輔助函數：檢查字元是否為中文字元
function isChinese(char) {
  let charCode = char.charCodeAt(0);
  return (charCode >= 0x4e00 && charCode <= 0x9fff) || 
         (charCode >= 0x3400 && charCode-0x4dbf <= 0) ||
         (charCode >= 0xff00 && charCode <= 0xffef);
}

// 繪製問題與選項
function displayQuestion() {
  let q = questions[currentQuestionIndex]; 
  let baseUnit = min(width, height);

  let titleSize = constrain(baseUnit * 0.035, 14, 20);
  let questionSize = constrain(baseUnit * 0.045, 18, 28);
  let optionTextSize = constrain(baseUnit * 0.038, 15, 22);
  let tipSize = constrain(baseUnit * 0.03, 12, 18);

  // 繪製頂部進度資訊
  fill(100);
  drawMixedText(`題目 ${currentQuestionIndex + 1} / ${questions.length}`, width / 2, height * 0.08, titleSize, CENTER);

  // 繪製題目內文
  fill(30);
  let qY = height * 0.22;
  drawMixedText(q.question, width / 2, qY, questionSize, CENTER);

  // 計算選項按鈕佈局
  let optionWidth = min(width * 0.85, 550);
  let optionHeight = constrain(height * 0.08, 45, 65);
  let spacing = optionHeight + constrain(height * 0.02, 10, 20);
  let startY = height * 0.38;

  // 計算錯誤時的左右搖擺偏移量
  if (shakeTimer > 0) {
    shakeOffset = sin(frameCount * 0.8) * 12;
    shakeTimer--;
  } else {
    shakeOffset = 0;
  }

  // 繪製四個選項按鈕
  for (let i = 0; i < q.options.length; i++) {
    let x = width / 2 - optionWidth / 2;
    let y = startY + i * spacing;

    let bgColor = color(255);
    let textColor = color(50);

    if (isAnswered) {
      if (i === q.answer) {
        // 正確答案顯示 #b5e48c 背景顏色
        bgColor = color('#b5e48c');
      } else if (i === selectedOption) {
        // 答錯選項顯示 #bc4749 背景顏色並左右偏移
        bgColor = color('#bc4749');
        textColor = color(255);
        x += shakeOffset;
      }
    }

    fill(bgColor);
    stroke(200);
    strokeWeight(1.5);
    rectMode(CORNER);
    rect(x, y, optionWidth, optionHeight, 10);

    fill(textColor);
    let textX = width / 2 + (i === selectedOption && i !== q.answer ? shakeOffset : 0);
    drawMixedText(q.options[i], textX, y + optionHeight / 2, optionTextSize, CENTER);
  }

  // 繪製底部提示文字
  if (isAnswered) {
    fill(120);
    drawMixedText("點擊畫面任意處繼續下一題...", width / 2, height * 0.92, tipSize, CENTER);
  }
}

// 滑鼠/觸控點擊事件處理
function mousePressed() {
  if (isLoading) return;

  // 所有題目完成時，點擊重新初始化並再次隨機抽 5 題
  if (currentQuestionIndex >= questions.length) {
    initQuiz();
    return;
  }

  // 已回答狀態下，點擊進入下一題
  if (isAnswered) {
    currentQuestionIndex++;
    isAnswered = false;
    selectedOption = -1;
    return;
  }

  let q = questions[currentQuestionIndex];
  let optionWidth = min(width * 0.85, 550);
  let optionHeight = constrain(height * 0.08, 45, 65);
  let spacing = optionHeight + constrain(height * 0.02, 10, 20);
  let startY = height * 0.38;

  for (let i = 0; i < q.options.length; i++) {
    let x = width / 2 - optionWidth / 2;
    let y = startY + i * spacing;

    if (mouseX > x && mouseX < x + optionWidth && mouseY > y && mouseY < y + optionHeight) {
      selectedOption = i;
      isAnswered = true;

      if (i === q.answer) {
        score += 20; // 每題 20 分，共 5 題 100 分
      } else {
        shakeTimer = 30; // 答錯觸發震盪動畫
      }
      break;
    }
  }
}

// 繪製結算畫面
function displayScore() {
  let baseUnit = min(width, height);

  fill(30);
  drawMixedText("測驗完成！", width / 2, height * 0.35, constrain(baseUnit * 0.06, 24, 38), CENTER);

  fill(70);
  drawMixedText(`您的最終得分為: ${score} 分`, width / 2, height * 0.48, constrain(baseUnit * 0.045, 18, 28), CENTER);

  fill(120);
  drawMixedText("點擊畫面任意處重新開始測驗", width / 2, height * 0.62, constrain(baseUnit * 0.035, 14, 20), CENTER);
}

// 視窗或螢幕旋轉時自動調整畫布與佈局
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}