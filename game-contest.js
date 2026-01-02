Object.assign(hamburgerGame, {
    // ==========================================
    // トールバーガーコンテスト機能
    // ==========================================
    
    contest: {
        active: false,
        timer: 20,
        interval: null,
        spawnInterval: null,
        animationId: null,
        ctx: null,
        canvas: null,
        playerX: 0,
        playerVX: 0,
        lastPlayerX: 0,
        playerWidth: 80,
        items: [],
        stack: [], // {..., swayOffsetX, swayVX, squashOffsetY, squashVY}
        scoreHeight: 0,
        keys: {},
        imageCache: {},
        topBunMode: false,
        gameOver: false,
        isCollapsing: false,
        isMeasuring: false,
        measureProgress: 0,
        cameraZoom: 1.0, 
        backgroundImage: null,
        countdown: 0, 
        isCountingDown: false
    },

    openContestMenu() {
        if (this.state.minigameActive) return;
        this.state.minigameActive = true;
        
        if (this.playContestBgm) this.playContestBgm();

        this.elements.contestGameModal.style.display = 'flex';
        this.elements.contestStartScreen.style.display = 'block';
        this.elements.contestPlayScreen.style.display = 'none';
        this.elements.contestResultScreen.style.display = 'none';
        this.elements.contestRankingScreen.style.display = 'none';
    },

    closeContestMenu() {
        this.elements.contestGameModal.style.display = 'none';
        this.state.minigameActive = false;
        
        if (this.stopContestBgm) this.stopContestBgm();
        
        this.endContestGame();
    },

    async startContestGame() {
        this.elements.contestStartScreen.style.display = 'none';
        this.elements.contestPlayScreen.style.display = 'block';
        
        this.contest.canvas = this.elements.contestCanvas;
        this.contest.ctx = this.contest.canvas.getContext('2d');
        this.contest.active = true;
        this.contest.timer = 20;
        this.contest.stack = [];
        this.contest.items = [];
        this.contest.scoreHeight = 0;
        this.contest.topBunMode = false;
        this.contest.gameOver = false;
        this.contest.isCollapsing = false;
        this.contest.isMeasuring = false;
        this.contest.measureProgress = 0;
        this.contest.cameraZoom = 1.0;
        this.contest.keys = {};
        
        this.contest.isCountingDown = true;
        this.contest.countdown = 3;
        
        this.contest.playerX = this.contest.canvas.width / 2 - this.contest.playerWidth / 2;
        this.contest.lastPlayerX = this.contest.playerX;
        this.contest.playerVX = 0;

        await this.preloadContestImages();
        this.bindContestControls();

        this.elements.contestTimer.textContent = this.contest.timer;
        this.elements.contestHeight.textContent = "0";
        
        this.contestLoop();

        this.runCountdown(() => {
            this.contest.isCountingDown = false;
            this.startContestLogic();
        });
    },

    runCountdown(callback) {
        const countStep = () => {
            if (!this.contest.active) return;
            if (this.contest.countdown > 0) {
                this.playSound(this.sounds.select);
                setTimeout(() => {
                    this.contest.countdown--;
                    if (this.contest.countdown === 0) {
                        this.playSound(this.sounds.rankUp);
                    }
                    countStep();
                }, 1000);
            } else {
                setTimeout(() => {
                    callback();
                }, 500);
            }
        };
        countStep();
    },

    startContestLogic() {
        if (this.contest.interval) clearInterval(this.contest.interval);
        this.contest.interval = setInterval(() => {
            if (this.contest.gameOver || this.contest.isCollapsing || this.contest.isMeasuring) return;
            
            if (this.contest.timer > 0) {
                this.contest.timer--;
                this.elements.contestTimer.textContent = this.contest.timer;
            } else if (!this.contest.topBunMode) {
                this.contest.topBunMode = true;
                this.spawnContestItem('top-bun');
            }
        }, 1000);

        if (this.contest.spawnInterval) clearInterval(this.contest.spawnInterval);
        this.contest.spawnInterval = setInterval(() => {
            if (this.contest.gameOver || this.contest.topBunMode || this.contest.isCollapsing || this.contest.isMeasuring) return;
            const ingredients = this.data.middleIngredients;
            const id = ingredients[Math.floor(Math.random() * ingredients.length)];
            this.spawnContestItem(id);
        }, 600);
    },

    async preloadContestImages() {
        const promises = [];
        const required = ['bottom-bun', 'top-bun', ...this.data.middleIngredients];
        required.forEach(id => {
            if (!this.contest.imageCache[id]) {
                const img = new Image();
                img.src = this.config.IMAGE_PATH + this.data.ingredients[id].image;
                this.contest.imageCache[id] = img;
                promises.push(new Promise(resolve => img.onload = resolve));
            }
        });

        if (!this.contest.backgroundImage) {
            const bg = new Image();
            bg.src = 'images/contest-bg.jpg'; 
            this.contest.backgroundImage = bg;
            promises.push(new Promise(resolve => bg.onload = resolve).catch(() => {}));
        }

        if (promises.length > 0) await Promise.all(promises);
    },

    spawnContestItem(id) {
        const img = this.contest.imageCache[id];
        const baseWidth = 70;
        const aspectRatio = img.naturalHeight / img.naturalWidth;
        const width = baseWidth;
        const height = baseWidth * aspectRatio;
        
        let x;
        if (id === 'top-bun') {
            x = (this.contest.canvas.width / 2) - (width / 2);
        } else {
            x = Math.random() * (this.contest.canvas.width - width);
        }

        this.contest.items.push({
            id: id,
            x: x,
            y: -150,
            width: width,
            height: height,
            speed: 3 + Math.random() * 2 + (this.contest.stack.length * 0.1),
            image: img
        });
    },

    bindContestControls() {
        this.contest.keydownHandler = e => this.contest.keys[e.key] = true;
        this.contest.keyupHandler = e => this.contest.keys[e.key] = false;
        
        document.addEventListener('keydown', this.contest.keydownHandler);
        document.addEventListener('keyup', this.contest.keyupHandler);

        const movePlayer = (clientX) => {
            if (!this.contest.canvas || this.contest.isCollapsing || this.contest.isMeasuring || this.contest.isCountingDown) return;
            const rect = this.contest.canvas.getBoundingClientRect();
            const scaleX = this.contest.canvas.width / rect.width;
            let mouseX = (clientX - rect.left) * scaleX;
            
            const newX = mouseX - this.contest.playerWidth / 2;
            
            let diff = newX - this.contest.playerX;
            
            this.applySwayForce(diff);

            this.contest.playerX = newX;
            
            if (this.contest.playerX < 0) this.contest.playerX = 0;
            if (this.contest.playerX > this.contest.canvas.width - this.contest.playerWidth) {
                this.contest.playerX = this.contest.canvas.width - this.contest.playerWidth;
            }
        };

        this.contest.mousemoveHandler = e => movePlayer(e.clientX);
        this.contest.touchmoveHandler = e => { e.preventDefault(); movePlayer(e.touches[0].clientX); };

        this.contest.canvas.addEventListener('mousemove', this.contest.mousemoveHandler);
        this.contest.canvas.addEventListener('touchmove', this.contest.touchmoveHandler, { passive: false });
    },

    // 揺れの計算ロジック修正
    applySwayForce(velocity) {
        // 現在の高さに基づいた全体の揺れやすさ (200cmで最大)
        const currentTotalHeight = this.contest.scoreHeight || 0;
        const baseSensitivity = Math.min(1.0, 0.2 + (currentTotalHeight / 200) * 0.8);

        this.contest.stack.forEach((item, index) => {
            if (typeof item.swayVX === 'undefined') item.swayVX = 0;
            
            // 個別の高さ係数 (上層ほど大きく揺れる)
            // baseSensitivity と掛け合わせることで、低いタワーの時は全体的に揺れず、
            // 高くなると上層が激しく揺れるようになる
            const layerFactor = (index + 1) * 0.25; 
            
            const force = -velocity * baseSensitivity * layerFactor;
            
            item.swayVX += force * 0.2;
        });
    },

    applySquashForce() {
        this.contest.stack.forEach((item, index) => {
            if (typeof item.squashVY === 'undefined') item.squashVY = 0;
            const impact = 3 + (index * 0.2); 
            item.squashVY += impact; 
        });
    },

    unbindContestControls() {
        document.removeEventListener('keydown', this.contest.keydownHandler);
        document.removeEventListener('keyup', this.contest.keyupHandler);
        if (this.contest.canvas) {
            this.contest.canvas.removeEventListener('mousemove', this.contest.mousemoveHandler);
            this.contest.canvas.removeEventListener('touchmove', this.contest.touchmoveHandler);
        }
    },

    contestLoop() {
        if (!this.contest.active) return;
        this.updateContestState();
        this.drawContest();
        if (this.contest.active) {
            this.contest.animationId = requestAnimationFrame(() => this.contestLoop());
        }
    },

    updateContestState() {
        this.contest.lastPlayerX = this.contest.playerX;

        const speed = 12; 
        let moveDiff = 0;

        if (!this.contest.isCollapsing && !this.contest.isMeasuring && !this.contest.isCountingDown) {
            if (this.contest.keys['ArrowLeft']) {
                this.contest.playerX -= speed;
                moveDiff = -speed;
            }
            if (this.contest.keys['ArrowRight']) {
                this.contest.playerX += speed;
                moveDiff = speed;
            }
            
            if (this.contest.playerX < 0) this.contest.playerX = 0;
            if (this.contest.playerX > this.contest.canvas.width - this.contest.playerWidth) {
                this.contest.playerX = this.contest.canvas.width - this.contest.playerWidth;
            }
            
            if (moveDiff !== 0) {
                this.applySwayForce(moveDiff);
            }
        }

        const currentVX = this.contest.playerX - this.contest.lastPlayerX;
        this.contest.playerVX += (currentVX - this.contest.playerVX) * 0.2;

        // --- 物理演算 (たわみ + 沈み込み) ---
        this.contest.stack.forEach((item) => {
            if (typeof item.swayOffsetX === 'undefined') {
                item.swayOffsetX = 0;
                item.swayVX = 0;
                item.squashOffsetY = 0;
                item.squashVY = 0;
            }

            // X軸 (たわみ)
            const springX = -item.swayOffsetX * 0.05; 
            item.swayVX += springX;
            item.swayVX *= 0.90; 
            item.swayOffsetX += item.swayVX;
            
            // Y軸 (沈み込み)
            const springY = -item.squashOffsetY * 0.2; 
            item.squashVY += springY;
            item.squashVY *= 0.80; 
            item.squashOffsetY += item.squashVY;

            const limitX = 150;
            if (item.swayOffsetX > limitX) item.swayOffsetX = limitX;
            if (item.swayOffsetX < -limitX) item.swayOffsetX = -limitX;
        });

        // -----------------------------

        if (this.contest.isCountingDown) return;

        const targetZoom = Math.max(0.5, 1.0 - (this.contest.scoreHeight / 2000));
        this.contest.cameraZoom += (targetZoom - this.contest.cameraZoom) * 0.05;

        if (this.contest.isMeasuring) {
            if (this.contest.measureProgress < 1.0) {
                this.contest.measureProgress += 0.02; 
                if (this.contest.measureProgress >= 1.0) {
                    this.contest.measureProgress = 1.0;
                    setTimeout(() => {
                        this.showContestResultScreen();
                    }, 2000);
                }
            }
            return;
        }

        if (this.contest.isCollapsing) {
            this.updateCollapseAnimation();
            return;
        }

        let currentStackHeight = 40; 
        this.contest.stack.forEach(item => currentStackHeight += item.height * 0.85);
        const catchY = this.contest.canvas.height - 50 - currentStackHeight;

        for (let i = this.contest.items.length - 1; i >= 0; i--) {
            const item = this.contest.items[i];
            item.y += item.speed;

            if (item.y + item.height > catchY && item.y < catchY + 30) {
                let baseX, baseWidth, sway = 0;
                
                if (this.contest.stack.length === 0) {
                    baseX = this.contest.playerX;
                    baseWidth = this.contest.playerWidth;
                } else {
                    const topItem = this.contest.stack[this.contest.stack.length - 1];
                    sway = topItem.swayOffsetX || 0;
                    baseX = this.contest.playerX + topItem.offsetX + sway;
                    baseWidth = topItem.width;
                }

                const isOverlapping = (item.x < baseX + baseWidth) && (item.x + item.width > baseX);

                if (item.y + item.height >= catchY) {
                    if (isOverlapping) {
                        const centerFalling = item.x + item.width / 2;
                        const centerBase = baseX + baseWidth / 2;
                        const diff = Math.abs(centerFalling - centerBase);
                        const threshold = (baseWidth / 2) + 5; 

                        if (diff > threshold) {
                            this.triggerCollapse(item, centerFalling > centerBase);
                            return;
                        } else {
                            if (item.id === 'top-bun') {
                                this.playSound(this.sounds.success);
                                this.finishContest(true);
                                return;
                            } else {
                                this.playSound(this.sounds.catch);
                                
                                this.applySquashForce();

                                this.contest.stack.push({
                                    ...item,
                                    offsetX: (item.x - this.contest.playerX),
                                    swayOffsetX: sway,
                                    swayVX: (this.contest.stack.length > 0 ? this.contest.stack[this.contest.stack.length-1].swayVX : 0),
                                    squashOffsetY: 0,
                                    squashVY: 0
                                });
                                this.contest.scoreHeight += Math.round(item.height * 0.5);
                                this.elements.contestHeight.textContent = this.contest.scoreHeight;
                                this.contest.items.splice(i, 1);
                                continue;
                            }
                        }
                    }
                }
            }

            if (item.y > this.contest.canvas.height) {
                if (item.id === 'top-bun') {
                    this.finishContest(false);
                    return;
                }
                this.contest.items.splice(i, 1);
            }
        }
    },

    triggerCollapse(triggerItem, fallDirection) {
        this.contest.isCollapsing = true;
        this.playSound(this.sounds.failure);

        triggerItem.currentAbsX = triggerItem.x;
        triggerItem.currentAbsY = triggerItem.y;
        triggerItem.vx = (fallDirection ? 1 : -1) * 3;
        triggerItem.vy = -5;
        triggerItem.rotation = 0;
        triggerItem.vr = (fallDirection ? 1 : -1) * 0.2;

        this.contest.stack.forEach((item, index) => {
            const sway = item.swayOffsetX || 0;
            const squash = item.squashOffsetY || 0;
            item.currentAbsX = this.contest.playerX + item.offsetX + sway;
            item.currentAbsY = this.contest.canvas.height - 90 - this.getStackYOffset(item) + squash;

            const force = (index + 1) / this.contest.stack.length;
            const dir = fallDirection ? 1 : -1;
            
            item.vx = dir * (2 + Math.random() * 3) * force;
            item.vy = -3 - (Math.random() * 5 * force);
            item.rotation = 0;
            item.vr = dir * (0.05 + (0.1 * force)); 
        });

        this.contest.items = []; 
        this.contest.stack.push(triggerItem);

        setTimeout(() => {
            this.finishContest(false);
        }, 2000);
    },

    updateCollapseAnimation() {
        const gravity = 0.5;
        const groundY = this.contest.canvas.height;

        this.contest.stack.forEach(item => {
            if (item.currentAbsX === undefined) return;
            item.currentAbsX += item.vx;
            item.currentAbsY += item.vy;
            item.vy += gravity;
            item.rotation += item.vr;

            if (item.currentAbsY + item.height > groundY) {
                item.currentAbsY = groundY - item.height;
                item.vy *= -0.6;
                item.vx *= 0.8;
                item.vr *= 0.8;
                if (Math.abs(item.vy) < 1) item.vy = 0;
            }
        });
    },
    
    getStackYOffset(targetItem) {
        let y = 0;
        for (let item of this.contest.stack) {
            if (item === targetItem) break;
            y += item.height * 0.85;
        }
        return y;
    },

    drawContest() {
        const ctx = this.contest.ctx;
        const cvs = this.contest.canvas;
        const zoom = this.contest.cameraZoom;

        ctx.clearRect(0, 0, cvs.width, cvs.height);

        if (this.contest.backgroundImage && this.contest.backgroundImage.complete) {
            ctx.drawImage(this.contest.backgroundImage, 0, 0, cvs.width, cvs.height);
        } else {
            ctx.fillStyle = "#fffbe6";
            ctx.fillRect(0, 0, cvs.width, cvs.height);
        }

        ctx.save();
        ctx.translate(cvs.width / 2, cvs.height);
        ctx.scale(zoom, zoom);
        ctx.translate(-cvs.width / 2, -cvs.height);

        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.fillRect(-500, cvs.height - 50, cvs.width + 1000, 50);

        const bBun = this.contest.imageCache['bottom-bun'];
        if (bBun) {
            ctx.drawImage(bBun, this.contest.playerX, cvs.height - 90, this.contest.playerWidth, 40);
        }

        if (this.contest.isCollapsing) {
            this.contest.stack.forEach(item => {
                ctx.save();
                ctx.translate(item.currentAbsX + item.width/2, item.currentAbsY + item.height/2);
                ctx.rotate(item.rotation);
                ctx.drawImage(item.image, -item.width/2, -item.height/2, item.width, item.height);
                ctx.restore();
            });
        } else {
            let stackY = cvs.height - 90;
            this.contest.stack.forEach(item => {
                stackY -= (item.height * 0.85);
                
                const sway = item.swayOffsetX || 0;
                const squash = item.squashOffsetY || 0;
                
                const drawX = this.contest.playerX + item.offsetX + sway;
                const drawY = stackY + squash;
                
                const tilt = sway * 0.005; 
                
                ctx.save();
                ctx.translate(drawX + item.width/2, drawY + item.height/2);
                ctx.rotate(tilt);
                ctx.drawImage(item.image, -item.width/2, -item.height/2, item.width, item.height);
                ctx.restore();
            });

            this.contest.items.forEach(item => {
                ctx.drawImage(item.image, item.x, item.y, item.width, item.height);
            });

            if (this.contest.isMeasuring) {
                const progress = this.contest.measureProgress;
                const bottomY = cvs.height - 70;
                
                const topItem = this.contest.stack[this.contest.stack.length - 1];
                let currentY = cvs.height - 90;
                this.contest.stack.forEach(item => { currentY -= (item.height * 0.85); });
                
                const sway = topItem.swayOffsetX || 0;
                const topX = this.contest.playerX + topItem.offsetX + sway;
                const topY = currentY + (topItem.squashOffsetY || 0);

                const startX = topX - 25; 
                const targetHeight = bottomY - topY; 
                
                const currentDrawHeight = targetHeight * progress;
                const currentDrawTopY = bottomY - currentDrawHeight;

                ctx.beginPath();
                ctx.moveTo(startX, bottomY);
                ctx.lineTo(startX, currentDrawTopY);
                ctx.strokeStyle = "#ffffff"; 
                ctx.lineWidth = 8;
                ctx.setLineDash([15, 10]); 
                ctx.stroke();
                ctx.setLineDash([]); 

                ctx.beginPath();
                ctx.moveTo(startX - 15, bottomY);
                ctx.lineTo(startX + 15, bottomY);
                ctx.moveTo(startX - 15, currentDrawTopY);
                ctx.lineTo(startX + 15, currentDrawTopY);
                ctx.lineWidth = 5;
                ctx.stroke();

                if (progress >= 1.0) {
                    ctx.font = "900 60px 'M PLUS Rounded 1c', sans-serif";
                    ctx.textAlign = "right";
                    ctx.textBaseline = "middle";
                    
                    const text = `${this.contest.scoreHeight}cm`;
                    const textX = startX - 30;
                    const textY = bottomY - (targetHeight / 2);

                    ctx.strokeStyle = "white";
                    ctx.lineWidth = 12;
                    ctx.lineJoin = "round";
                    ctx.strokeText(text, textX, textY);
                    
                    ctx.fillStyle = "#f39c12";
                    ctx.fillText(text, textX, textY);
                }
            }
        }
        
        ctx.restore();

        if (this.contest.topBunMode && !this.contest.isCollapsing && !this.contest.isMeasuring && !this.contest.isCountingDown) {
            ctx.fillStyle = "rgba(255, 0, 0, 0.8)";
            ctx.font = "bold 40px 'Kiwi Maru'";
            ctx.strokeStyle = "white";
            ctx.lineWidth = 4;
            ctx.textAlign = "center";
            ctx.strokeText("LAST ONE!!", cvs.width / 2, 150);
            ctx.fillText("LAST ONE!!", cvs.width / 2, 150);
        }

        if (this.contest.isCountingDown) {
            ctx.save();
            ctx.fillStyle = "rgba(0, 0, 0, 0.3)"; 
            ctx.fillRect(0, 0, cvs.width, cvs.height);
            
            ctx.font = "900 150px 'M PLUS Rounded 1c', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.lineWidth = 15;
            ctx.strokeStyle = "white";
            
            let text = this.contest.countdown > 0 ? this.contest.countdown : "GO!";
            let color = this.contest.countdown > 0 ? "#f1c40f" : "#e74c3c"; 

            ctx.strokeText(text, cvs.width / 2, cvs.height / 2);
            ctx.fillStyle = color;
            ctx.fillText(text, cvs.width / 2, cvs.height / 2);
            
            ctx.restore();
        }
    },

    finishContest(completed) {
        if (completed) {
            this.contest.scoreHeight += 50; 
            this.elements.contestHeight.textContent = this.contest.scoreHeight;
            
            this.contest.isMeasuring = true; 
            this.contest.measureProgress = 0;
        } else {
            this.contest.gameOver = true;
            this.endContestGame();
            this.showContestRanking(true);
        }
    },

    showContestResultScreen() {
        this.contest.gameOver = true;
        this.endContestGame();

        this.elements.contestPlayScreen.style.display = 'none';
        this.elements.contestResultScreen.style.display = 'block';
        this.elements.contestFinalHeight.textContent = this.contest.scoreHeight;
    },

    endContestGame() {
        clearInterval(this.contest.interval);
        clearInterval(this.contest.spawnInterval);
        cancelAnimationFrame(this.contest.animationId);
        this.unbindContestControls();
        this.contest.active = false;
        this.contest.isCollapsing = false;
        this.contest.isMeasuring = false;
        this.contest.isCountingDown = false;
    },

    submitContestScore() {
        const name = this.elements.contestPlayerName.value.trim() || "名無しバーガー";
        const score = this.contest.scoreHeight;
        
        if (!this.state.contestRanking) this.state.contestRanking = [];
        this.state.contestRanking.push({ name: name, score: score, date: new Date().toLocaleDateString() });
        this.state.contestRanking.sort((a, b) => b.score - a.score);
        this.state.contestRanking = this.state.contestRanking.slice(0, 10);
        
        this.saveGameData(); 
        this.showContestRanking();
    },

    showContestRanking(isFailed = false) {
        this.elements.contestPlayScreen.style.display = 'none';
        this.elements.contestResultScreen.style.display = 'none';
        this.elements.contestRankingScreen.style.display = 'block';
        
        const list = this.elements.contestRankingList;
        list.innerHTML = '';
        
        if (isFailed) {
            const msg = document.createElement('li');
            msg.style.color = 'var(--main-red)';
            msg.style.textAlign = 'center';
            msg.style.marginBottom = '10px';
            msg.style.fontWeight = 'bold';
            msg.textContent = '残念！記録なし...';
            list.appendChild(msg);
        }
        
        this.state.contestRanking.forEach((entry, index) => {
            const li = document.createElement('li');
            li.className = 'ranking-item';
            let rankBadge = `<span class="rank-badge">${index + 1}位</span>`;
            if (index === 0) rankBadge = `<span class="rank-badge" style="color:gold;">🥇</span>`;
            if (index === 1) rankBadge = `<span class="rank-badge" style="color:silver;">🥈</span>`;
            if (index === 2) rankBadge = `<span class="rank-badge" style="color:#cd7f32;">🥉</span>`;
            
            li.innerHTML = `${rankBadge} <span>${entry.name}</span> <span>${entry.score}cm</span>`;
            list.appendChild(li);
        });
        
        if (this.state.contestRanking.length === 0 && !isFailed) {
            list.innerHTML = '<li style="text-align:center;">まだ記録がありません</li>';
        }
    }
});