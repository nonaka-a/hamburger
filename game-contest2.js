// --- START OF FILE game-contest2.js ---

Object.assign(hamburgerGame, {
    // ==========================================
    // リズム・バーガータワー コンテスト (旧ハングリー×アングリー)
    // ==========================================
    hungryAngry: {
        active: false,
        audioCtx: null,
        bgmSource: null,
        bgmBuffer: null,
        startTime: 0,
        notes: [], 
        score: 0,
        heightScore: 0, 
        combo: 0,
        maxCombo: 0,
        isPlaying: false,
        animationId: null,
        ctx: null,
        canvas: null,
        bgElement: null, 

        // 積み上げ・カメラ制御
        stack: [], 
        isFinishing: false, 
        topBunY: -1000, 
        
        // カメラ制御用
        cameraY: 0, 
        targetCameraY: 0,
        
        // 沈み込みアニメーション用
        bounceY: 0,
        bounceVelocity: 0,

        // 終了演出用フェーズ管理
        // 0: 通常プレイ
        // 1: トップバンズ落下
        // 2: 下までカメラ戻す
        // 3: 下から上へゆっくりスクロールアップ
        // 4: てっぺんで停止して高さ表示
        finishPhase: 0, 
        finishTimer: 0, 

        // 設定: 6レーン
        laneTypes: ['patty', 'egg', 'bacon', 'cheese', 'tomato', 'lettuce'],
        
        // ターゲット位置 (キャンバス幅1000px基準)
        targets: [
            { x: 100, y: 600, color: '#8d6e63', key: 'patty' }, 
            { x: 230, y: 600, color: '#f1c40f', key: 'egg' }, 
            { x: 360, y: 600, color: '#e74c3c', key: 'bacon' }, 
            { x: 630, y: 600, color: '#f39c12', key: 'cheese' },
            { x: 760, y: 600, color: '#e74c3c', key: 'tomato' },
            { x: 890, y: 600, color: '#2ecc71', key: 'lettuce' }
        ],
        spawnY: -50,
        fallDuration: 1.5,
        centerX: 500, 
        baseY: 600,   

        judgementWindows: {
            perfect: 0.1,
            good: 0.2,
            miss: 0.3
        },

        init() {
            this.canvas = document.getElementById('hungry-angry-canvas');
            this.bgElement = document.getElementById('ha-bg-overlay');
            if (this.canvas) {
                this.ctx = this.canvas.getContext('2d');
            }
            this.preloadImages();
            this.bindControls();
            this.injectStyles();
        },

        injectStyles() {
            if (document.getElementById('ha-animation-styles')) return;
            const style = document.createElement('style');
            style.id = 'ha-animation-styles';
            style.innerHTML = `
                @keyframes judge-pop {
                    0% { transform: scale(0.5); opacity: 0; }
                    50% { transform: scale(1.2); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        },

        imageCache: {},
        preloadImages() {
            const ingredients = [
                'top-bun', 'bottom-bun', 
                'patty', 'egg', 'bacon', 
                'cheese', 'tomato', 'lettuce'
            ];
            
            ingredients.forEach(id => {
                if (hamburgerGame.data.ingredients[id]) {
                    const img = new Image();
                    img.src = hamburgerGame.config.IMAGE_PATH + hamburgerGame.data.ingredients[id].image;
                    this.imageCache[id] = img;
                }
            });
        },

        async startGame() {
            if (hamburgerGame.pauseCurrentBgm) {
                hamburgerGame.pauseCurrentBgm();
            }
            if (hamburgerGame.sounds && hamburgerGame.sounds.contest) {
                hamburgerGame.sounds.contest.pause();
                hamburgerGame.sounds.contest.currentTime = 0;
            }

            if (!this.canvas) this.init();
            
            if (!this.audioCtx) {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (this.audioCtx.state === 'suspended') {
                await this.audioCtx.resume();
            }

            const bgmUrl = hamburgerGame.config.SOUND_PATH + 'contest2.mp3';
            this.bgmBuffer = await this.loadAudio(bgmUrl);

            this.active = true;
            this.isPlaying = true;
            this.isFinishing = false;
            this.finishPhase = 0;
            this.finishTimer = 0;
            this.score = 0;
            this.heightScore = 0;
            this.combo = 0;
            this.notes = []; 
            this.startTime = this.audioCtx.currentTime + 3;
            this.topBunY = -1000;
            
            this.cameraY = 0;
            this.targetCameraY = 0;
            this.bounceY = 0;
            this.bounceVelocity = 0;
            
            if (this.bgElement) {
                this.bgElement.style.transform = `translateY(0px)`;
            }

            this.stack = [];
            this.addStackItem('bottom-bun', false); 

            this.generateChart(this.bgmBuffer.duration, 128);

            document.getElementById('ha-height').textContent = '0';
            document.getElementById('ha-combo').textContent = '0';
            document.getElementById('ha-judge-reaction').textContent = '';
            
            this.runCountdown(() => {
                this.playBgm();
                this.loop();
            });
        },

        async loadAudio(url) {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            return await this.audioCtx.decodeAudioData(arrayBuffer);
        },

        playBgm() {
            if (this.bgmSource) {
                try { this.bgmSource.stop(); } catch(e){}
            }
            this.bgmSource = this.audioCtx.createBufferSource();
            this.bgmSource.buffer = this.bgmBuffer;
            const gainNode = this.audioCtx.createGain();
            gainNode.gain.value = 0.5;
            this.bgmSource.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);
            this.bgmSource.start(0);
            
            this.bgmSource.onended = () => {
                if (this.active && !this.isFinishing) {
                    this.startFinishSequence();
                }
            };
        },

        generateChart(duration, bpm) {
            this.notes = [];
            const beatDuration = 60 / bpm;
            let time = 0;
            time += beatDuration * 4; 

            while (time < duration) {
                if (Math.random() < 0.7) { 
                    const lane = Math.floor(Math.random() * 6);
                    const startX = this.targets[lane].x; 

                    this.notes.push({
                        time: time,
                        type: this.laneTypes[lane],
                        laneIndex: lane,
                        startX: startX,
                        targetX: this.targets[lane].x,
                        targetY: this.targets[lane].y,
                        hit: false,
                        missed: false
                    });
                }
                const step = Math.random() < 0.3 ? beatDuration / 2 : beatDuration;
                time += step;
            }
        },

        runCountdown(callback) {
            const overlay = document.getElementById('ha-overlay');
            overlay.style.display = 'flex';
            
            overlay.style.fontFamily = "'M PLUS Rounded 1c', sans-serif";
            overlay.style.textShadow = "4px 4px 0 #000";
            
            let count = 3;
            overlay.textContent = count;
            hamburgerGame.playSound(hamburgerGame.sounds.select);

            const interval = setInterval(() => {
                count--;
                if (count > 0) {
                    overlay.textContent = count;
                    hamburgerGame.playSound(hamburgerGame.sounds.select);
                } else if (count === 0) {
                    overlay.textContent = "GO!";
                    overlay.style.color = "#f1c40f";
                    hamburgerGame.playSound(hamburgerGame.sounds.rankUp);
                } else {
                    clearInterval(interval);
                    overlay.style.display = 'none';
                    callback();
                }
            }, 1000);
        },

        loop() {
            if (!this.active) return;
            this.update();
            this.draw();
            this.animationId = requestAnimationFrame(() => this.loop());
        },

        update() {
            if (!this.isPlaying && this.finishPhase === 0) return;
            
            const currentTime = this.audioCtx.currentTime - this.startTime;

            // --- カメラ追従処理 (通常時) ---
            if (this.finishPhase === 0) {
                const stackPixelHeight = this.getStackPixelHeight();
                const followOffset = -50; 
                // 修正: 係数を0.85に変更
                this.targetCameraY = Math.max(0, (stackPixelHeight - 50) * 0.85);
                this.cameraY += (this.targetCameraY - this.cameraY) * 0.2;
            }

            // --- 背景スクロール ---
            if (this.bgElement) {
                // 修正: スクロール係数を0.5に変更して、より上の方まで表示されるようにする
                this.bgElement.style.transform = `translateY(${this.cameraY * 0.5}px)`;
            }

            // --- 沈み込み物理演算 ---
            const k = 0.2; 
            const damping = 0.8; 
            const force = -this.bounceY * k;
            this.bounceVelocity += force;
            this.bounceVelocity *= damping;
            this.bounceY += this.bounceVelocity;

            // --- 終了演出フェーズ管理 ---
            if (this.isFinishing) {
                const targetTopBunY = this.getStackTopY();
                const stackPixelHeight = this.baseY - targetTopBunY;

                // Phase 1: トップバンズ落下
                if (this.finishPhase === 1) {
                    // カメラは一旦トップが見える位置で待機
                    this.targetCameraY = Math.max(0, stackPixelHeight - 200);
                    this.cameraY += (this.targetCameraY - this.cameraY) * 0.1;

                    if (this.topBunY < targetTopBunY) {
                        this.topBunY += 25; 
                    } else {
                        this.topBunY = targetTopBunY;
                        this.bounceVelocity = 15; // 着地衝撃
                        
                        setTimeout(() => {
                            this.finishPhase = 2;
                        }, 500);
                    }
                }
                // Phase 2: 下までカメラ戻す
                else if (this.finishPhase === 2) {
                    this.targetCameraY = 0;
                    this.cameraY += (this.targetCameraY - this.cameraY) * 0.05;

                    if (Math.abs(this.cameraY) < 10) {
                        this.cameraY = 0;
                        this.finishPhase = 3; 
                    }
                }
                // Phase 3: 下から上へゆっくりスクロールアップ
                else if (this.finishPhase === 3) {
                    // てっぺんが見える位置まで
                    const targetHeight = Math.max(0, stackPixelHeight - 250); 
                    this.targetCameraY = targetHeight;
                    
                    const speed = 4; 
                    if (this.cameraY < this.targetCameraY) {
                        this.cameraY += speed;
                    } else {
                        this.cameraY = this.targetCameraY;
                        this.finishPhase = 4;
                        this.finishTimer = Date.now(); 
                    }
                }
                // Phase 4: てっぺんで停止して2秒待機
                else if (this.finishPhase === 4) {
                    if (Date.now() - this.finishTimer > 2000) {
                        if(this.active) this.finishGame(true);
                        this.finishPhase = 5; 
                    }
                }
                
                return;
            }

            // ノーツ判定
            this.notes.forEach(note => {
                if (!note.hit && !note.missed) {
                    if (currentTime > note.time + this.judgementWindows.miss) {
                        note.missed = true;
                        this.judge('miss');
                    }
                }
            });
        },

        getStackTopY() {
            const burgerScale = 0.8;
            let currentY = this.baseY; 

            this.stack.forEach((item) => {
                const img = this.imageCache[item.id];
                let height = item.height; 
                
                if (img && img.naturalWidth > 0) {
                    const width = 150 * burgerScale;
                    const aspectRatio = img.naturalHeight / img.naturalWidth;
                    height = width * aspectRatio;
                }
                
                currentY -= height * 0.6;
            });
            
            return currentY;
        },

        getStackPixelHeight() {
            return this.baseY - this.getStackTopY();
        },

        draw() {
            const ctx = this.ctx;
            const cvs = this.canvas;
            const currentTime = this.audioCtx.currentTime - this.startTime;

            ctx.clearRect(0, 0, cvs.width, cvs.height);

            ctx.save();
            ctx.translate(0, this.cameraY); 

            // --- バーガースタック描画 ---
            const drawBaseY = this.baseY + this.bounceY; 
            let currentY = drawBaseY;
            const burgerScale = 0.8;

            this.stack.forEach((item, index) => {
                const img = this.imageCache[item.id];
                if (img) {
                    const width = 150 * burgerScale; 
                    const aspectRatio = img.naturalHeight / img.naturalWidth;
                    const height = width * aspectRatio;
                    
                    // 中央に描画 (currentYは底辺)
                    ctx.drawImage(img, this.centerX - width/2, currentY - height, width, height);
                    
                    // 次のアイテムの底辺Y座標
                    currentY -= height * 0.6; 
                }
            });

            // トップバンズ (終了演出中)
            if (this.isFinishing) {
                const img = this.imageCache['top-bun'];
                if (img) { 
                    const width = 150 * burgerScale;
                    const aspectRatio = img.naturalHeight / img.naturalWidth;
                    const height = width * aspectRatio;
                    // topBunY はバンズの「底辺」Y座標
                    ctx.drawImage(img, this.centerX - width/2, this.topBunY + this.bounceY - height, width, height);
                }
            }
            
            // Phase 4: 高さ表示
            if (this.finishPhase === 4) {
                ctx.font = "900 60px 'M PLUS Rounded 1c', sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.strokeStyle = "white";
                ctx.lineWidth = 12;
                
                const text = `${this.heightScore}cm`;
                const textX = this.centerX;
                const textY = this.topBunY - 150 + this.bounceY;

                ctx.strokeText(text, textX, textY);
                ctx.fillStyle = "#f39c12";
                ctx.fillText(text, textX, textY);
            }

            ctx.restore();

            // --- ノーツ描画 ---
            if (!this.isFinishing) {
                this.notes.forEach(note => {
                    if (note.hit || note.missed) return;

                    const spawnTime = note.time - this.fallDuration;
                    let progress = (currentTime - spawnTime) / this.fallDuration;

                    if (progress > 0 && progress < 1.3) { 
                        const x = note.startX; 
                        const y = this.spawnY + (note.targetY - this.spawnY) * progress;
                        
                        const width = 70;
                        const height = 50; 
                        const img = this.imageCache[note.type];
                        
                        if (img && img.complete) {
                            ctx.drawImage(img, x - width/2, y - height/2, width, height);
                        } else {
                            ctx.fillStyle = this.targets[note.laneIndex].color;
                            ctx.beginPath();
                            ctx.arc(x, y, 30, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    }
                });
            }

            // --- ターゲットラインガイド ---
            this.targets.forEach(t => {
                ctx.beginPath();
                ctx.arc(t.x, t.y, 40, 0, Math.PI * 2);
                ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
                ctx.lineWidth = 3;
                ctx.stroke();
            });
        },

        addStackItem(id, animate = true) {
            const data = hamburgerGame.data.ingredients[id];
            if (data) {
                const burgerScale = 0.8;
                this.stack.push({
                    id: id,
                    height: (data.height || 30) * burgerScale
                });
                
                if (animate) {
                    this.bounceVelocity = 15; 
                }
                
                if (id !== 'bottom-bun') {
                    this.heightScore += 8;
                    document.getElementById('ha-height').textContent = this.heightScore;
                }
            }
        },

        bindControls() {
            const mapping = [
                { id: 'btn-patty', lane: 0 },
                { id: 'btn-egg', lane: 1 },
                { id: 'btn-bacon', lane: 2 },
                { id: 'btn-cheese', lane: 3 },
                { id: 'btn-tomato', lane: 4 },
                { id: 'btn-lettuce', lane: 5 }
            ];

            mapping.forEach(map => {
                const btn = document.getElementById(map.id);
                if (!btn) return;
                
                const handleTap = (e) => {
                    if (!this.active || !this.isPlaying || this.isFinishing) return;
                    e.preventDefault(); 
                    
                    this.handleInput(map.lane);
                    
                    btn.classList.add('active');
                    setTimeout(() => btn.classList.remove('active'), 100);
                };

                btn.onmousedown = handleTap;
                btn.ontouchstart = handleTap;
            });
        },

        handleInput(laneIndex) {
            const currentTime = this.audioCtx.currentTime - this.startTime;
            
            const targetNote = this.notes.find(n => 
                !n.hit && !n.missed && 
                n.laneIndex === laneIndex && 
                Math.abs(n.time - currentTime) < this.judgementWindows.miss
            );

            if (targetNote) {
                const diff = Math.abs(targetNote.time - currentTime);
                targetNote.hit = true;
                
                this.addStackItem(targetNote.type);
                this.showHitEffect(this.targets[laneIndex].x, this.targets[laneIndex].y, this.targets[laneIndex].color);

                if (diff <= this.judgementWindows.perfect) {
                    this.judge('perfect');
                    // PERFECTなら2個積み
                    this.addStackItem(targetNote.type, true); 
                } else if (diff <= this.judgementWindows.good) {
                    this.judge('good');
                } else {
                    this.judge('good'); 
                }
            }
        },

        showHitEffect(x, y, color) {
            const screen = document.getElementById('hungry-angry-game-screen');
            const el = document.createElement('div');
            el.className = 'judge-effect';
            el.style.left = x + 'px';
            el.style.top = y + 'px';
            el.style.borderColor = color;
            screen.appendChild(el);
            setTimeout(() => el.remove(), 400);
        },

        judge(rating) {
            const reactionEl = document.getElementById('ha-judge-reaction');
            const comboEl = document.getElementById('ha-combo');

            let text = "";
            let color = "";

            if (rating === 'perfect') {
                text = "PERFECT!!";
                color = "#f1c40f";
                this.score += 500;
                this.combo++;
                hamburgerGame.playSound(hamburgerGame.sounds.catch);
            } else if (rating === 'good') {
                text = "GOOD!";
                color = "#3498db";
                this.score += 200;
                this.combo++;
                hamburgerGame.playSound(hamburgerGame.sounds.select);
            } else { 
                text = "MISS...";
                color = "#e74c3c";
                this.combo = 0;
                hamburgerGame.playSound(hamburgerGame.sounds.failure);
            }

            if (this.combo > this.maxCombo) this.maxCombo = this.combo;

            comboEl.textContent = this.combo;
            
            reactionEl.textContent = text;
            reactionEl.style.color = color;
            reactionEl.style.textShadow = "4px 4px 0 #000"; 
            
            reactionEl.style.animation = 'none';
            reactionEl.offsetHeight; 
            reactionEl.style.animation = 'judge-pop 0.3s ease-out';
        },

        startFinishSequence() {
            this.isFinishing = true;
            this.finishPhase = 1; 
            this.topBunY = -1000; 
            document.getElementById('ha-judge-reaction').textContent = '';
        },

        finishGame(completed) {
            this.isPlaying = false;
            this.isFinishing = false;
            this.finishPhase = 0;
            if (this.bgmSource) {
                try { this.bgmSource.stop(); } catch(e){}
            }
            cancelAnimationFrame(this.animationId);
            
            const resultScreen = document.getElementById('contest-result-screen');
            const gameScreen = document.getElementById('hungry-angry-game-screen');
            
            gameScreen.style.display = 'none';
            resultScreen.style.display = 'block';
            
            let html = "";
            if (completed) {
                hamburgerGame.playSound(hamburgerGame.sounds.rankUp);

                html += `<h2 style="color:var(--main-orange)">巨大バーガー完成！</h2>`;
                html += `<p style="font-size:1.5em">高さ: ${this.heightScore}cm</p>`;
                html += `<p>スコア: ${this.score} / コンボ: ${this.maxCombo}</p>`;
                
                const bonusMoney = Math.floor(this.score / 20);
                hamburgerGame.state.money += bonusMoney;
                hamburgerGame.state.totalRankScore += 100;
                html += `<p style="color:var(--main-green)">報酬: ${bonusMoney}円 GET!</p>`;
                hamburgerGame.updateUI();
                hamburgerGame.saveGameData();
            } else {
                hamburgerGame.playSound(hamburgerGame.sounds.failure);
                html += `<h2 style="color:var(--main-red)">ゲームオーバー...</h2>`;
                html += `<p>スコア: ${this.score}</p>`;
            }
            
            html += `<button id="ha-close-btn" class="action-button-style" style="margin-top:20px; background-color:var(--main-blue)">とじる</button>`;
            
            resultScreen.innerHTML = html;

            setTimeout(() => {
                const closeBtn = document.getElementById('ha-close-btn');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        if (typeof hamburgerGame.contest.closeContestMenu === 'function') {
                            hamburgerGame.contest.closeContestMenu();
                        } else {
                            this.close();
                            hamburgerGame.elements.contestGameModal.style.display = 'none';
                            hamburgerGame.state.minigameActive = false;
                            if (hamburgerGame.resumeCurrentBgm) hamburgerGame.resumeCurrentBgm();
                        }
                    });
                }
            }, 0);
        },
        
        close() {
            this.active = false;
            this.isPlaying = false;
            this.isFinishing = false;
            this.notes = []; 
            if (this.bgmSource) {
                try { this.bgmSource.stop(); } catch(e){}
            }
            cancelAnimationFrame(this.animationId);
            const haScreen = document.getElementById('hungry-angry-game-screen');
            if (haScreen) haScreen.style.display = 'none';
        }
    }
});