Object.assign(hamburgerGame, {
    // ==========================================
    // ハングリー×アングリー コンテスト (リズムゲーム) v2
    // ==========================================
    hungryAngry: {
        active: false,
        audioCtx: null,
        bgmSource: null,
        bgmBuffer: null,
        startTime: 0,
        notes: [], 
        score: 0,
        combo: 0,
        maxCombo: 0,
        hunger: 50, // 修正: 初期値を50に変更
        isPlaying: false,
        animationId: null,
        ctx: null,
        canvas: null,

        // 設定
        laneTypes: ['burger', 'potato', 'coke', 'soft-cream'],
        targets: [
            { x: 120, y: 600, color: '#e74c3c' }, 
            { x: 260, y: 600, color: '#f1c40f' }, 
            // 修正: コーラとソフトクリームを若干左へずらす (740->700, 880->840)
            { x: 730, y: 600, color: '#3498db' }, 
            { x: 870, y: 600, color: '#2ecc71' }  
        ],
        spawnY: -50,
        fallDuration: 1.5,

        judgementWindows: {
            perfect: 0.1,
            good: 0.2,
            miss: 0.3
        },

        init() {
            this.canvas = document.getElementById('hungry-angry-canvas');
            if (this.canvas) {
                this.ctx = this.canvas.getContext('2d');
            }
            this.preloadImages();
            this.bindControls();
        },

        imageCache: {},
        preloadImages() {
            const images = {
                'burger': 'images/burger-icon.png',
                'potato': 'images/potato.png',
                'coke': 'images/coke.png',
                'soft-cream': 'images/soft-cream.png'
            };
            for (let key in images) {
                const img = new Image();
                img.src = images[key];
                this.imageCache[key] = img;
            }
        },

        async startGame() {
            // ★修正: BGM停止処理を強化
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

            // contest2.mp3 をロード
            const bgmUrl = hamburgerGame.config.SOUND_PATH + 'contest2.mp3';
            this.bgmBuffer = await this.loadAudio(bgmUrl);

            this.active = true;
            this.isPlaying = true;
            this.score = 0;
            this.combo = 0;
            this.hunger = 50; // 修正: スタート時50%
            this.notes = []; // 修正: ノーツを確実にクリア
            this.startTime = this.audioCtx.currentTime + 3;
            
            this.generateChart(this.bgmBuffer.duration, 128);

            document.getElementById('ha-score').textContent = '0';
            document.getElementById('ha-combo').textContent = '0';
            this.updateHungerUI(); // 修正: 初期表示更新
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
                if (this.active) this.finishGame(true);
            };
        },

        generateChart(duration, bpm) {
            this.notes = [];
            const beatDuration = 60 / bpm;
            let time = 0;
            
            time += beatDuration * 4;

            while (time < duration - 2) {
                if (Math.random() < 0.7) {
                    const lane = Math.floor(Math.random() * 4);
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
            const currentTime = this.audioCtx.currentTime - this.startTime;

            if (this.isPlaying) {
                this.hunger -= 2.5 / 60; 
                if (this.hunger <= 0) {
                    this.hunger = 0;
                    this.finishGame(false);
                }
                this.updateHungerUI();
            }

            this.notes.forEach(note => {
                if (!note.hit && !note.missed) {
                    if (currentTime > note.time + this.judgementWindows.miss) {
                        note.missed = true;
                        this.judge('miss');
                    }
                }
            });
        },

        draw() {
            const ctx = this.ctx;
            const cvs = this.canvas;
            const currentTime = this.audioCtx.currentTime - this.startTime;

            ctx.clearRect(0, 0, cvs.width, cvs.height);

            this.notes.forEach(note => {
                if (note.hit || note.missed) return;

                const spawnTime = note.time - this.fallDuration;
                let progress = (currentTime - spawnTime) / this.fallDuration;

                if (progress > 0 && progress < 1.5) { 
                    const x = note.startX; 
                    const y = this.spawnY + (note.targetY - this.spawnY) * progress;
                    
                    const size = 80;
                    const img = this.imageCache[note.type];
                    
                    if (img && img.complete) {
                        ctx.drawImage(img, x - size/2, y - size/2, size, size);
                    } else {
                        ctx.fillStyle = this.targets[note.laneIndex].color;
                        ctx.beginPath();
                        ctx.arc(x, y, size/2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            });
        },

        bindControls() {
            const buttons = [
                document.getElementById('btn-burger'),
                document.getElementById('btn-potato'),
                document.getElementById('btn-coke'),
                document.getElementById('btn-soft-cream')
            ];

            buttons.forEach((btn, index) => {
                if (!btn) return;
                
                // イベントリスナーの重複登録を防ぐため、一度削除するか、フラグ管理が必要だが
                // ここでは単純化のため cloneNode でリセットする手法をとるか、
                // init() が一度しか呼ばれない前提ならそのままでよい。
                // 今回は init() は一度きりの想定で既存コードを踏襲。
                
                const handleTap = (e) => {
                    if (!this.active || !this.isPlaying) return;
                    e.preventDefault(); 
                    
                    this.handleInput(index);
                    
                    btn.classList.add('active');
                    setTimeout(() => btn.classList.remove('active'), 100);
                };

                // 既存のリスナーが残っている場合の対策として、プロパティで管理してもよいが
                // ここではシンプルに既存の実装を維持しつつ、init呼び出し制御に委ねる
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
                
                this.showHitEffect(this.targets[laneIndex].x, this.targets[laneIndex].y, this.targets[laneIndex].color);

                if (diff <= this.judgementWindows.perfect) {
                    this.judge('perfect');
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
            const scoreEl = document.getElementById('ha-score');
            const comboEl = document.getElementById('ha-combo');

            let text = "";
            let color = "";

            if (rating === 'perfect') {
                text = "PERFECT!!";
                color = "#f1c40f";
                this.score += 500;
                this.hunger = Math.min(100, this.hunger + 6);
                this.combo++;
                hamburgerGame.playSound(hamburgerGame.sounds.catch);
            } else if (rating === 'good') {
                text = "GOOD!";
                color = "#3498db";
                this.score += 200;
                this.hunger = Math.min(100, this.hunger + 3);
                this.combo++;
                hamburgerGame.playSound(hamburgerGame.sounds.select);
            } else { 
                text = "BAD...";
                color = "#e74c3c";
                this.hunger -= 10;
                this.combo = 0;
                hamburgerGame.playSound(hamburgerGame.sounds.failure);
            }

            if (this.combo > this.maxCombo) this.maxCombo = this.combo;

            scoreEl.textContent = this.score;
            comboEl.textContent = this.combo;
            
            reactionEl.textContent = text;
            reactionEl.style.color = color;
            reactionEl.style.textShadow = "4px 4px 0 #000"; 
            
            reactionEl.style.animation = 'none';
            reactionEl.offsetHeight; 
            reactionEl.style.animation = 'judge-pop 0.3s ease-out';
            
            this.updateHungerUI();
        },

        updateHungerUI() {
            const meter = document.getElementById('ha-hunger-meter');
            if (meter) {
                meter.style.width = this.hunger + '%';
                
                if (this.hunger < 30) {
                    meter.style.background = '#e74c3c';
                } else if (this.hunger < 60) {
                    meter.style.background = '#f39c12';
                } else {
                    meter.style.background = 'linear-gradient(90deg, #f1c40f, #2ecc71)';
                }
            }
        },

        finishGame(completed) {
            this.isPlaying = false;
            if (this.bgmSource) {
                this.bgmSource.stop();
            }
            cancelAnimationFrame(this.animationId);
            
            const resultScreen = document.getElementById('contest-result-screen');
            const gameScreen = document.getElementById('hungry-angry-game-screen');
            
            gameScreen.style.display = 'none';
            resultScreen.style.display = 'block';
            
            let html = "";
            if (completed) {
                hamburgerGame.playSound(hamburgerGame.sounds.rankUp);
                html += `<h2 style="color:var(--main-orange)">審査員、大満足！</h2>`;
                html += `<p style="font-size:1.5em">スコア: ${this.score}</p>`;
                html += `<p>MAXコンボ: ${this.maxCombo}</p>`;
                const bonusMoney = Math.floor(this.score / 20);
                hamburgerGame.state.money += bonusMoney;
                hamburgerGame.state.totalRankScore += 100;
                html += `<p style="color:var(--main-green)">報酬: ${bonusMoney}円 GET!</p>`;
                hamburgerGame.updateUI();
                hamburgerGame.saveGameData();
            } else {
                hamburgerGame.playSound(hamburgerGame.sounds.failure);
                html += `<h2 style="color:var(--main-red)">審査員、激怒！</h2>`;
                html += `<p>お腹が空きすぎて帰ってしまった...</p>`;
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
            this.notes = []; // 修正: 終了時にノーツクリア
            if (this.bgmSource) {
                try { this.bgmSource.stop(); } catch(e){}
            }
            cancelAnimationFrame(this.animationId);
            const haScreen = document.getElementById('hungry-angry-game-screen');
            if (haScreen) haScreen.style.display = 'none';
        }
    }
});