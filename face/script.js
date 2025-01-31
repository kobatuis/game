const video = document.getElementById('video');
const faceCanvas = document.getElementById('face-canvas');
const character = document.getElementById('character');
const emotionDisplay = document.getElementById('emotion-display');
const timeDisplay = document.getElementById('time-display');
const startButton = document.getElementById('start-button');
const faceCtx = faceCanvas.getContext('2d');
const obstacles = document.querySelectorAll('.obstacle'); // 複数の障害物を取得
const characterImage = 'character.png'; // キャラクターの画像ファイル
const obstacleImage = 'obstacle.png'; // 障害物の画像ファイル
const goal = document.getElementById('goal'); // ゴールの要素を取得
const gameOverMessage = document.getElementById('game-over-message'); // ゲームオーバーメッセージの要素を取得
const goalMessage = document.getElementById('goal-message'); // ゴールメッセージの要素を取得
const gameTitle = document.getElementById('game-title'); // タイトル要素を取得

let characterX = 50;
let characterSpeed = 10;
let startTime = null;
let goalTime = null;
let startFlag = false;
let countdownTimer = null;
let countdownNumber = 3;
const characterWidth = 100; // キャラクターの幅を直接指定
const screenWidth = window.innerWidth; // 画面の幅を取得
const obstacleWidth = 50; // 障害物の幅
const obstacleHeight = 90; // 障害物の高さ
let obstaclePositions = []; // 障害物の位置を格納する配列
let isJumping = false; // ジャンプ中かどうか
let jumpHeight = 100; // ジャンプの高さ
let jumpDuration = 1000; // ジャンプの時間を1秒に設定
let jumpStartTime = 0; // ジャンプ開始時間
let jumpSpeed = jumpHeight / (jumpDuration / 30); // ジャンプの速度を調整
let jumpDirection = 1; // ジャンプの方向 (1: 上昇, -1: 下降)
let groundY = 300; // ここでピクセル指定を行います
const minDistance = 150; // キャラクターと障害物、障害物同士の最小距離
const goalDistance = 150; // ゴールと障害物の最小距離

// 音声要素を作成
const jumpSound = new Audio('jump.wav'); // ジャンプ音
const bgm = new Audio('bgm.wav'); // BGM
const clearSound = new Audio('clear.mp3'); // クリア音
const gameOverSound = new Audio('over.mp3'); // ゲームオーバー音
bgm.loop = true; // BGMをループさせる

// 地面のY座標を計算する関数
function calculateGroundY() {
    return window.innerHeight / 2;
}

// キャラクターの初期設定
character.style.backgroundImage = `url(${characterImage})`;
character.style.backgroundSize = 'cover'; // キャラクターのサイズに合わせて背景を調整
character.style.backgroundPosition = 'center'; // 中央に配置

// 障害物の初期位置を設定
function setObstaclePosition() {
    obstaclePositions = [];
    obstacles.forEach((obstacle, index) => {
        let obstacleX;
        let validPosition = false;
        while (!validPosition) {
            obstacleX = Math.random() * (screenWidth - obstacleWidth);
            validPosition = true;

            // キャラクターとの距離をチェック
            if (Math.abs(obstacleX - characterX) < minDistance) {
                validPosition = false;
                continue;
            }

            // 他の障害物との距離をチェック
            for (let i = 0; i < obstaclePositions.length; i++) {
                if (Math.abs(obstacleX - obstaclePositions[i].x) < minDistance) {
                    validPosition = false;
                    break;
                }
            }

            // ゴールとの距離をチェック
            if (Math.abs(obstacleX - goal.offsetLeft) < goalDistance) {
                validPosition = false;
            }
        }
        obstacle.style.left = `${obstacleX}px`;
        obstacle.style.bottom = `${groundY}px`;
        obstacle.style.backgroundImage = `url(${obstacleImage})`; // 障害物の画像を設定
        obstacle.style.backgroundSize = 'contain'; // 障害物のサイズに合わせて背景を調整
        obstacle.style.backgroundPosition = 'center'; // 中央に配置
        obstacle.style.backgroundRepeat = 'no-repeat'; // 背景を繰り返さない
        obstaclePositions.push({ x: obstacleX, y: groundY });
    });
}

// 障害物の位置をログ出力する関数
function logObstaclePositions() {
    obstacles.forEach((obstacle, index) => {
        const obstacleTop = obstacle.offsetTop; // 障害物の上端のY座標
        const obstacleBottom = obstacle.offsetTop + obstacle.offsetHeight; // 障害物の下端のY座標
        console.log(`Obstacle ${index + 1}: Top = ${obstacleTop}, Bottom = ${obstacleBottom}`);
    });
}

// ゴールの初期位置を設定
function setGoalPosition() {
    goal.style.bottom = `${groundY}px`;
}

// 顔認識モデルのロード
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('models'),
    faceapi.nets.faceExpressionNet.loadFromUri('models')
]).then(startVideo);

// Webカメラの起動
function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(error => {
            console.error("Webカメラが起動できませんでした:", error);
        });
}

// 初期表示設定
groundY = calculateGroundY(); // 地面のY座標を固定値で設定
character.style.bottom = `${groundY}px`; // キャラクターの初期位置を設定
setObstaclePosition(); // 障害物の初期位置を設定
setGoalPosition(); // ゴールの初期位置を設定
gameOverMessage.style.display = 'none'; // ゲームオーバーメッセージを非表示に設定
gameOverMessage.classList.remove('show'); // ゲームオーバーメッセージからshowクラスを削除
goalMessage.style.display = 'none'; // ゴールメッセージを非表示に設定
goalMessage.classList.remove('show'); // ゴールメッセージからshowクラスを削除
gameTitle.style.display = 'block'; // タイトルを表示

// キャラクターの位置とサイズを取得する関数
function updateCharacterPositionAndSize() {
    const characterTop = character.offsetTop; // キャラクターの上端のY座標
    const characterHeight = character.offsetHeight; // キャラクターの高さ
    console.log('Character Top:', characterTop);
    console.log('Character Height:', characterHeight);
}

// キャラクターの位置をログ出力する関数
function logCharacterPosition() {
    const characterTop = character.offsetTop; // キャラクターの上端のY座標
    const characterBottom = character.offsetTop + character.offsetHeight; // キャラクターの下端のY座標
    console.log(`Character: Top = ${characterTop}, Bottom = ${characterBottom}`);
}

// スタートボタンのクリックイベント
startButton.addEventListener('click', () => {
    if (!startFlag && countdownTimer === null) {
        countdownTimer = Date.now();
        startButton.style.display = 'none';
        startFlag = false;
        countdownNumber = 3;
        update();
    }
});

// ウィンドウサイズ変更時の処理
window.addEventListener('resize', () => {
    groundY = calculateGroundY(); // 地面のY座標を更新
    setObstaclePosition(); // 障害物の位置を更新
    setGoalPosition(); // ゴールの位置を更新
    character.style.bottom = `${groundY}px`; // キャラクターの位置を更新
    updateCharacterPositionAndSize(); // キャラクターの位置とサイズを更新
    logObstaclePositions(); // 障害物の位置をログ出力
});

// カウントダウンとゲームの更新
async function update() {
    if (countdownTimer !== null) {
        const elapsedTime = (Date.now() - countdownTimer) / 1000;
        if (elapsedTime >= 1) {
            countdownTimer = Date.now();
            countdownNumber -= 1;
        }
        if (countdownNumber > 0) {
            emotionDisplay.textContent = countdownNumber;
            requestAnimationFrame(update);
            return;
        } else {
            startTime = Date.now();
            startFlag = true;
            countdownTimer = null;
            emotionDisplay.textContent = '';
            bgm.play(); // カウントダウン後にBGMを再生
        }
    }

    if (!startFlag) {
        requestAnimationFrame(update);
        return;
    }

    // 顔認識
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
    faceCtx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
    if (detections && detections.length > 0) {
        const detection = detections[0];
        const { x, y, width, height } = detection.detection.box;

        // 顔部分のみを切り抜いて描画
        faceCanvas.width = width;
        faceCanvas.height = height;
        faceCtx.drawImage(video, x, y, width, height, 0, 0, width, height);

        const expressions = detection.expressions;
        const dominantEmotion = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
        let emotionText = '';
        switch (dominantEmotion) {
            case 'angry':
                emotionText = 'えがおになるとジャンプするよ';
                break;
            case 'disgusted':
                emotionText = 'えがおになるとジャンプするよ';
                break;
            case 'fearful':
                emotionText = 'えがおになるとジャンプするよ';
                break;
            case 'happy':
                emotionText = 'いいえがお！';
                break;
            case 'neutral':
                emotionText = 'えがおになるとジャンプするよ';
                break;
            case 'sad':
                emotionText = 'えがおになるとジャンプするよ';
                break;
            case 'surprised':
                emotionText = 'えがおになるとジャンプするよ';
                break;
            default:
                emotionText = '-';
        }
        emotionDisplay.textContent = `${emotionText}`;

        // 喜び感情の確率を取得
        const happyProb = expressions.happy || 0;

        // 移動速度を計算
        const currentSpeed = characterSpeed * (1 + happyProb * 1); // 移動速度を調整

        // キャラクターの移動
        if (dominantEmotion === 'happy' && happyProb > 0.2) {
            if (!isJumping) {
                isJumping = true;
                jumpDirection = 1;
                jumpStartTime = Date.now();
                jump();
            }
        } else {
            characterX += characterSpeed * 0.3; // 笑顔以外の場合は遅く前進
            if (characterX < 0) {
                characterX = 0;
            }
            // if (characterX + characterWidth >= screenWidth - 50) { // ゴール判定の条件を修正
            //     characterX = screenWidth - characterWidth - 50;
            //     if (goalTime === null) {
            //         goalTime = Date.now();
            //         alert("ゴール！");
            //         startFlag = false; // キャラクターの移動を停止
            //     }
            // }
        }
    } else {
        emotionDisplay.textContent = '';
        faceCanvas.width = 0;
        faceCanvas.height = 0;
        characterX += characterSpeed * 0.3; // 笑顔以外の場合は遅く前進
        if (characterX < 0) {
            characterX = 0;
        }
        // if (characterX + characterWidth >= screenWidth - 50) { // ゴール判定の条件を修正
        //     characterX = screenWidth - characterWidth - 50;
        //     if (goalTime === null) {
        //         goalTime = Date.now();
        //         alert("ゴール！");
        //         startFlag = false; // キャラクターの移動を停止
        //     }
        // }
    }

    // 衝突判定を行う関数
    function collision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }

    // ゴール判定
    if (collision({ x: characterX, y: character.offsetTop, width: characterWidth, height: character.offsetHeight }, 
                   { x: goal.offsetLeft, y: goal.offsetTop, width: goal.offsetWidth, height: goal.offsetHeight })) {
        if (goalTime === null) {
            goalTime = Date.now();
            bgm.pause(); // ゴール時にBGMを停止
            clearSound.currentTime = 0; // クリア音を最初から再生
            clearSound.play(); // クリア音を再生
            goalMessage.style.display = 'block'; // ゴールメッセージを表示
            goalMessage.classList.remove('show'); // ゴールメッセージからshowクラスを削除
            gameTitle.style.display = 'none'; // タイトルを非表示
            startFlag = false; // キャラクターの移動を停止
            emotionDisplay.style.display = 'none'; // ゴール時にemotionDisplayを非表示にする
        }
    }

    // 衝突判定
    for (let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i];
        const obstacleX = obstaclePositions[i].x;
        const obstacleY = obstaclePositions[i].y;
        if (collision({ x: characterX, y: character.offsetTop, width: characterWidth, height: character.offsetHeight }, 
                       { x: obstacleX, y: obstacleY, width: obstacleWidth, height: obstacleHeight })) {
            gameOverMessage.style.display = 'block'; // ゲームオーバーメッセージを表示
            gameOverMessage.classList.remove('show'); // ゲームオーバーメッセージからshowクラスを削除
            gameTitle.style.display = 'none'; // タイトルを非表示
            emotionDisplay.style.display = 'none'; // ゲームオーバー時にemotionDisplayを非表示
            bgm.pause(); // ゲームオーバー時にBGMを停止
            gameOverSound.currentTime = 0; // ゲームオーバー音を最初から再生
            gameOverSound.play(); // ゲームオーバー音を再生
            startFlag = false;
            return;
        }
    }

    character.style.left = `${characterX}px`;
    // タイム表示
    // if (startFlag && goalTime === null) {
    //     const elapsedTime = (Date.now() - startTime) / 1000;
    //     timeDisplay.textContent = `経過時間: ${elapsedTime.toFixed(2)}秒`;
    // } else if (goalTime !== null) {
    //     const elapsedTime = (goalTime - startTime) / 1000;
    //     timeDisplay.textContent = `ゴールタイム: ${elapsedTime.toFixed(2)}秒`;
    // }
    // 障害物の位置をログ出力
    logObstaclePositions(); // 障害物の位置をログ出力
    logCharacterPosition(); // キャラクターの位置をログ出力

    requestAnimationFrame(update);
}

// ジャンプ処理
function jump() {
    if (!isJumping) return;

    const jumpElapsedTime = Date.now() - jumpStartTime;
    const jumpProgress = jumpElapsedTime / jumpDuration;
    const jumpY = groundY + jumpHeight * Math.sin(jumpProgress * Math.PI);
    const jumpX = characterSpeed * 0.12; // ジャンプ中の前進量

    character.style.bottom = `${jumpY}px`;
    characterX += jumpX;

    // ジャンプ音を再生
    if (jumpProgress < 0.1) { // ジャンプの最初の部分で音を再生
        jumpSound.currentTime = 0; // 音を最初から再生
        jumpSound.play();
    }

    // キャラクターの位置とサイズを取得
    updateCharacterPositionAndSize();

    if (jumpProgress >= 1) {
        isJumping = false;
        character.style.bottom = `${groundY}px`;
        return;
    }

    requestAnimationFrame(jump);
}