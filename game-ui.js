// --- START OF FILE game-ui.js ---

Object.assign(hamburgerGame, {
    cacheElements() {
        const s = {
            titleScreen: '#title-screen', startButton: '#start-button', gameWrapper: '#game-wrapper', statusBar: '#status-bar', money: '#money',
            settingsIcon: '#settings-icon', settingsPanel: '#settings-panel', zoomInButton: '#zoom-in-button', zoomOutButton: '#zoom-out-button', fullscreenButton: '#fullscreen-button', soundToggleButton: '#sound-toggle-button', closeSettingsButton: '#close-settings-button', fixedContainer: '#fixed-container',
            customerImage: '#customer-image', customerMessage: '#customer-message', orderList: '#order-list', burgerStack: '#burger-stack', ingredientsPanel: '#ingredients-panel', drinksPanel: '#drinks-panel', drinkDisplay: '#drink-display', drinkDisplayContainer: '#drink-display-container',
            serveButton: '#serve-button', undoButton: '#undo-button', trashButton: '#trash-button',
            showRestockButton: '#show-restock-button',
            completedBurgerModal: '#completed-burger-modal', minigameDock: '#minigame-dock', grillMinigame: '#grill-minigame', grillCursor: '#grill-cursor', grillStopButton: '#grill-stop-button', pourMinigame: '#pour-minigame', pourLiquid: '#pour-liquid', pourButton: '#pour-button',
            grillItemImage: '#grill-item-image',
            restockGameModal: '#restock-game-modal', restockSelectionScreen: '#restock-selection-screen', restockItemList: '#restock-item-list', restockTotalCost: '#restock-total-cost', restockConfirmSelectionButton: '#restock-confirm-selection-button',
            restockMinigameScreen: '#restock-minigame-screen', minigameHud: '#minigame-hud', minigameTimer: '#minigame-timer', minigameRealtimeScore: '#minigame-realtime-score', catchGameCanvas: '#catch-game-canvas',
            restockResultScreen: '#restock-result-screen', restockResultList: '#restock-result-list', restockReturnToGameButton: '#restock-return-to-game-button',
            restockAgainButton: '#restock-again-button',
            restockConfirmPopup: '#restock-confirm-popup', restockConfirmMessage: '#restock-confirm-message', restockPayButton: '#restock-pay-button', restockCancelButton: '#restock-cancel-button',
            restockCancelSelectionButton: '#restock-cancel-selection-button',
            restockAbortButton: '#restock-abort-button',
            shopButton: '#shop-button', shopModal: '#shop-modal', shopItemsContainer: '#shop-items-container', closeShopButton: '#close-shop-button', bgmChangeButton: '#bgm-change-button',
            jukeboxObject: '#jukebox-object', bgmSelectModal: '#bgm-select-modal', closeBgmModal: '#close-bgm-modal', bgmList: '#bgm-list',

            dayDisplay: '#day-display', clockDisplay: '#clock-display',
            dayStartOverlay: '#day-start-overlay', dayStartText: '#day-start-text',
            dailyResultModal: '#daily-result-modal', nextDayButton: '#next-day-button',
            resultRevenue: '#result-revenue', resultExpenses: '#result-expenses', resultProfit: '#result-profit', resultCustomers: '#result-customers', resultScore: '#result-score',

            rankStarsContainer: '#rank-stars-container',
            rankUpModal: '#rank-up-modal', rankUpStarCount: '#rank-up-star-count', closeRankUpButton: '#close-rank-up-button',
            rankUpStarsDisplay: '#rank-up-stars-display',

            rankInfoModal: '#rank-info-modal',
            rankInfoStars: '#rank-info-stars',
            rankCurrentScore: '#rank-current-score',
            rankNextTarget: '#rank-next-target',
            closeRankInfoButton: '#close-rank-info-button',

            resetSaveButton: '#reset-save-button',
            resetConfirmModal: '#reset-confirm-modal',
            resetYesButton: '#reset-yes-button',
            resetNoButton: '#reset-no-button',

            contestButton: '#contest-button',
            contestGameModal: '#contest-game-modal',
            contestStartScreen: '#contest-start-screen',
            contestStartButton: '#contest-start-button',
            contestCloseButton: '#contest-close-button',
            contestPlayScreen: '#contest-play-screen',
            contestCanvas: '#contest-canvas',
            contestTimer: '#contest-timer',
            contestHeight: '#contest-height',
            contestResultScreen: '#contest-result-screen',
            contestFinalHeight: '#contest-final-height',
            contestPlayerName: '#contest-player-name',
            contestSubmitButton: '#contest-submit-button',
            contestRankingScreen: '#contest-ranking-screen',
            contestRankingList: '#contest-ranking-list',
            contestRankingCloseButton: '#contest-ranking-close-button',

            contestUnlockModal: '#contest-unlock-modal',
            contestUnlockCloseButton: '#contest-unlock-close-button'
        };
        for (const k in s) { this.elements[k] = document.querySelector(s[k]); }
    },

    bindGlobalEvents() {
        this.elements.startButton.addEventListener('click', () => this.startGame());
        this.elements.settingsIcon.addEventListener('click', () => this.toggleSettingsPanel());
        this.elements.closeSettingsButton.addEventListener('click', () => this.toggleSettingsPanel());
        this.elements.zoomInButton.addEventListener('click', () => this.changeZoom(0.1));
        this.elements.zoomOutButton.addEventListener('click', () => this.changeZoom(-0.1));
        this.elements.fullscreenButton.addEventListener('click', () => this.toggleFullscreen());
        this.elements.soundToggleButton.addEventListener('click', () => this.toggleSound());
        this.elements.shopButton.addEventListener('click', () => this.openShop());
        this.elements.closeShopButton.addEventListener('click', () => this.closeShop());
        this.elements.bgmChangeButton.addEventListener('click', () => this.cycleBgm());
        this.elements.jukeboxObject.addEventListener('click', () => this.openBgmSelect());
        this.elements.closeBgmModal.addEventListener('click', () => this.closeBgmSelect());

        this.elements.nextDayButton.addEventListener('click', () => this.nextDay());
        
        this.elements.closeRankUpButton.addEventListener('click', () => {
            this.elements.rankUpModal.style.display = 'none';
            this.showNextUnlockNotification();
        });

        this.elements.rankStarsContainer.addEventListener('click', () => this.showRankInfo());
        this.elements.closeRankInfoButton.addEventListener('click', () => {
            this.elements.rankInfoModal.style.display = 'none';
        });

        this.elements.resetSaveButton.addEventListener('click', () => {
            this.elements.resetConfirmModal.style.display = 'flex';
            this.elements.settingsPanel.classList.remove('open');
        });

        this.elements.resetNoButton.addEventListener('click', () => {
            this.elements.resetConfirmModal.style.display = 'none';
        });

        this.elements.resetYesButton.addEventListener('click', () => {
            this.resetGameData();
        });

        if (this.elements.contestButton) {
            this.elements.contestButton.addEventListener('click', () => this.openContestMenu());
        }
        if (this.elements.contestCloseButton) {
            this.elements.contestCloseButton.addEventListener('click', () => this.closeContestMenu());
        }
        if (this.elements.contestStartButton) {
            this.elements.contestStartButton.addEventListener('click', () => this.startContestGame());
        }
        if (this.elements.contestSubmitButton) {
            this.elements.contestSubmitButton.addEventListener('click', () => this.submitContestScore());
        }
        if (this.elements.contestRankingCloseButton) {
            this.elements.contestRankingCloseButton.addEventListener('click', () => {
                this.elements.contestRankingScreen.style.display = 'none';
                this.closeContestMenu();
            });
        }

        if (this.elements.contestUnlockCloseButton) {
            this.elements.contestUnlockCloseButton.addEventListener('click', () => {
                this.elements.contestUnlockModal.style.display = 'none';
                this.showNextUnlockNotification(); 
            });
        }
        
        const hungryCloseBtn = document.getElementById('contest-hungry-unlock-close-button');
        if (hungryCloseBtn) {
            hungryCloseBtn.addEventListener('click', () => {
                document.getElementById('contest-hungry-unlock-modal').style.display = 'none';
                this.showNextUnlockNotification(); 
            });
        }

        this.elements.bgmList.querySelectorAll('.bgm-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.selectBgm(index);
                this.updateBgmListUI();
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'p' || e.key === 'P') {
                this.state.money += 1000;
                this.showMoneyPopup(1000);
                this.updateUI();
                if (this.elements.shopModal.style.display === 'flex') {
                    this.renderShopItems();
                }
                this.saveGameData();
            }
            if (e.key === 'o' || e.key === 'O') {
                this.state.totalRankScore += 500;
                this.updateRankDisplay();
                console.log("Debug: +500 Rank Score (Total: " + this.state.totalRankScore + ")");
                this.saveGameData();
            }
        });
    },

    bindGameEvents() {
        this.elements.ingredientsPanel.addEventListener('click', e => { const b = e.target.closest('button'); if (b) this.handleItemClick(b.dataset.id, 'ingredient'); });
        this.elements.drinksPanel.addEventListener('click', e => { const b = e.target.closest('button'); if (b) this.handleItemClick(b.dataset.id, 'drink'); });
        this.elements.serveButton.addEventListener('click', () => this.serveOrder());
        this.elements.undoButton.addEventListener('click', () => this.undoLastIngredient());
        this.elements.trashButton.addEventListener('click', () => this.trashOrder());
        this.elements.showRestockButton.addEventListener('click', () => this.startRestockFlow());
        this.elements.restockConfirmSelectionButton.addEventListener('click', () => this.showRestockConfirmPopup());

        if (this.elements.restockReturnToGameButton) {
            this.elements.restockReturnToGameButton.addEventListener('click', () => {
                this.closeRestockFlow();
                this.saveGameData();
            });
        }

        this.elements.restockAgainButton.addEventListener('click', () => this.restartRestockFlow());
        this.elements.restockPayButton.addEventListener('click', () => this.processPaymentAndStartMinigame());
        this.elements.restockCancelButton.addEventListener('click', () => this.hideRestockConfirmPopup());
        this.elements.restockCancelSelectionButton.addEventListener('click', () => this.cancelRestockFlow());
        this.elements.restockAbortButton.addEventListener('click', () => this.abortCatchMinigame());
    },

    bindResizeEvent() {
        window.addEventListener('resize', () => this.updateGameScale());
        this.updateGameScale();
    },

    updateGameScale() {
        const containerWidth = 1280;
        const containerHeight = 720;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const scaleX = viewportWidth / containerWidth;
        const scaleY = viewportHeight / containerHeight;
        const fitScale = Math.min(scaleX, scaleY);
        const finalScale = fitScale * this.state.zoom;
        this.elements.fixedContainer.style.transform = `scale(${finalScale})`;
    },

    changeZoom(delta) {
        this.state.zoom = Math.max(0.5, Math.min(1.5, this.state.zoom + delta));
        this.updateGameScale();
    },

    toggleSettingsPanel() { this.elements.settingsPanel.classList.toggle('open'); },
    toggleFullscreen() {
        if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(err => { console.error(`Error: ${err.message}`); }); } else { if (document.exitFullscreen) { document.exitFullscreen(); } }
    },

    initializePanels() {
        const c = (id, d) => {
            const b = document.createElement('button');
            b.dataset.id = id;
            b.innerHTML = `<img src="${this.config.IMAGE_PATH + d.image}"><span>${d.name}</span>`;
            if (d.stock !== Infinity) { b.innerHTML += `<div class="stock-display">${d.stock}</div>`; }

            if (d.reqRank && this.state.currentRank < d.reqRank) {
                b.style.display = 'none';
            }

            return b;
        };
        this.data.displayOrder.forEach(id => { if (this.data.ingredients[id]) { this.elements.ingredientsPanel.appendChild(c(id, this.data.ingredients[id])); } });
        for (const id in this.data.drinks) { this.elements.drinksPanel.appendChild(c(id, this.data.drinks[id])); }
    },

    updateUI() {
        this.elements.money.textContent = this.state.money;
        const u = (items, p) => { Object.keys(items).forEach(id => { const b = p.querySelector(`[data-id="${id}"]`); if (b) { const d = items[id]; const s = b.querySelector('.stock-display'); if (s) s.textContent = d.stock; b.disabled = d.stock <= 0; b.classList.toggle('out-of-stock', d.stock <= 0); } }); };
        u(this.data.ingredients, this.elements.ingredientsPanel);
        u(this.data.drinks, this.elements.drinksPanel);
        
        const selectedSideIds = this.state.playerSelection.sides.map(s => s.id);
        this.elements.drinksPanel.querySelectorAll('button').forEach(b => { 
            b.classList.toggle('selected', selectedSideIds.includes(b.dataset.id)); 
        });
        
        const h = this.state.playerSelection.burger.length > 0 || this.state.playerSelection.sides.length > 0;
        this.elements.serveButton.disabled = this.state.playerSelection.burger.length === 0;
        this.elements.undoButton.disabled = this.state.playerSelection.burger.length === 0;
        this.elements.trashButton.disabled = !h;

        this.elements.showRestockButton.disabled = false;

        this.elements.orderList.innerHTML = '';
        if (this.state.currentOrder.burger.length > 0) {
            [...this.state.currentOrder.burger].reverse().forEach(id => { const li = document.createElement('li'); const data = this.data.ingredients[id]; const nameHTML = id.includes('bun') ? data.name : `<b>${data.name}</b>`; li.innerHTML = `<img src="${this.config.IMAGE_PATH + data.image}" alt="${data.name}">${nameHTML}`; this.elements.orderList.appendChild(li); });
            
            this.state.currentOrder.sides.forEach(id => {
                const li = document.createElement('li'); 
                const data = this.data.drinks[id]; 
                li.innerHTML = `<img src="${this.config.IMAGE_PATH + data.image}" alt="${data.name}"><b>${data.name}</b>`; 
                this.elements.orderList.appendChild(li); 
            });
        } else { this.elements.orderList.innerHTML = '<li>（ご注文はまだかな？）</li>'; }
        
        this.elements.burgerStack.innerHTML = '';
        this.state.playerSelection.burger.forEach((item, index) => {
            const container = document.createElement('div');
            container.className = 'ingredient-image-stack';
            
            // 重なりを調整するために高さを制限
            container.style.height = '30px'; 
            container.style.width = '100%';
            container.style.position = 'relative';
            container.style.display = 'flex';
            container.style.justifyContent = 'center';
            container.style.alignItems = 'flex-end';
            container.style.overflow = 'visible'; // 画像とエフェクトのはみ出しを許可

            // 指示のあったマージン設定（column-reverseなので視覚的な重なり調整）
            // ただし height:30px が効いているため、追加のマージンは不要かもしれないが
            // 指示通り記述を残すならここ（ただし挙動に注意）
            // container.style.marginTop = '20px'; 
            
            const img = document.createElement('img');
            img.src = this.config.IMAGE_PATH + this.data.ingredients[item.id].image;
            img.style.height = 'auto';
            img.style.maxHeight = 'none'; // 親の高さ制限を無視
            img.style.position = 'absolute'; // 絶対配置で下揃えを確実に
            img.style.bottom = '0';
            img.style.left = '50%';
            img.style.transform = 'translateX(-50%)';
            
            container.appendChild(img);

            if (item.quality !== 'normal') {
                const effect = document.createElement('div');
                effect.className = `quality-effect quality-${item.quality}`;
                
                // エフェクトのサイズと位置を強制指定して小さくなるのを防ぐ
                effect.style.width = '150px'; 
                effect.style.height = '150px';
                effect.style.position = 'absolute';
                effect.style.left = '50%';
                effect.style.top = '50%';
                effect.style.transform = 'translate(-50%, -50%)';
                effect.style.zIndex = '10';
                effect.style.pointerEvents = 'none';

                container.appendChild(effect);
                
                void effect.offsetWidth;
                effect.style.animation = 'none';
                requestAnimationFrame(() => {
                    effect.style.animation = '';
                });
            }
            this.elements.burgerStack.appendChild(container);
        });
        
         const drinkDisplay = this.elements.drinkDisplay;
        const container = this.elements.drinkDisplayContainer;
        const sideCount = this.state.playerSelection.sides.length;

        if (sideCount > 0) {
            let html = '';
            this.state.playerSelection.sides.forEach(item => {
                const data = this.data.drinks[item.id];
                html += `<img src="${this.config.IMAGE_PATH + data.image}" alt="${data.name}" style="height: 90%; width: auto; object-fit: contain; margin: 0 5px;">`;
            });
            drinkDisplay.innerHTML = html;
            
            drinkDisplay.style.flexWrap = 'nowrap';
            drinkDisplay.style.justifyContent = 'center';
            drinkDisplay.style.alignItems = 'center';
            
            if (sideCount > 1) {
                drinkDisplay.style.width = 'auto';
                drinkDisplay.style.minWidth = '120px';
            } else {
                drinkDisplay.style.width = '120px';
            }
            
            // 修正: 3つ以上ある場合、バーガーと被らないようにコンテナ全体を右にずらす
            if (sideCount >= 3) {
                container.style.transform = 'translateX(60px)'; // 右へ60px移動
            } else {
                container.style.transform = 'translateX(0)';
            }
            
        } else { 
            drinkDisplay.innerHTML = '<span>（のみもの）</span>'; 
            drinkDisplay.style.flexWrap = 'nowrap';
            drinkDisplay.style.width = '120px';
            container.style.transform = 'translateX(0)';
        }
        
        container.classList.toggle('visible', sideCount > 0);
    },

    setCustomerMessage(text) { this.elements.customerMessage.textContent = text; },

    showMoneyPopup(amount) { const p = document.createElement('div'); p.textContent = `${amount > 0 ? '+' : ''}${amount}円`; p.className = `money-popup ${amount > 0 ? 'plus' : 'minus'}`; this.elements.statusBar.appendChild(p); p.addEventListener('animationend', () => p.remove()); },

    showCompletedBurger(burgerName, earnings, totalScore, bonusScore) {
        const { completedBurgerModal } = this.elements;
        completedBurgerModal.innerHTML = '';
        const container = document.createElement('div');
        container.className = 'completed-burger-container';

        const scoreContainer = document.createElement('div');
        scoreContainer.className = 'burger-score-badge';
        scoreContainer.innerHTML = `<div class="score-label">できばえ</div><div class="score-value">${totalScore}${bonusScore !== 0 ? `<span class="score-bonus ${bonusScore > 0 ? 'plus' : 'minus'}">(${bonusScore > 0 ? '+' : ''}${bonusScore})</span>` : ''}</div><div class="score-unit">点</div>`;
        container.appendChild(scoreContainer);

        const visualsContainer = document.createElement('div'); 
        visualsContainer.className = 'completed-visuals'; 
        const imageContainer = document.createElement('div'); 
        imageContainer.className = 'burger-image-container'; 
        imageContainer.style.zIndex = 20;
        let currentHeight = 0;
        this.state.currentOrder.burger.forEach((id, index) => { const img = document.createElement('img'); img.src = this.config.IMAGE_PATH + this.data.ingredients[id].image; img.className = 'completed-ingredient-image'; img.style.bottom = `${currentHeight}px`; img.style.zIndex = index; img.style.animationDelay = `${index * 0.15}s`; imageContainer.appendChild(img); currentHeight += this.data.ingredients[id].height; }); 
        visualsContainer.appendChild(imageContainer);
        
        this.state.currentOrder.sides.forEach((id, idx) => {
            const drinkImg = document.createElement('img'); 
            drinkImg.src = this.config.IMAGE_PATH + this.data.drinks[id].image; 
            drinkImg.className = 'completed-drink-image'; 
            drinkImg.style.marginLeft = (10 + (idx * 5)) + 'px'; 
            drinkImg.style.zIndex = 10 + idx;
            visualsContainer.appendChild(drinkImg); 
        });
        
        let finalBurgerName = burgerName;
        if (this.state.playerSelection.sides.length > 0) {
            const sideNames = this.state.playerSelection.sides.map(s => {
                const d = this.data.drinks[s.id];
                const qName = d.qualityNames ? d.qualityNames[s.quality] : null;
                return qName || d.name;
            });
            finalBurgerName += ` + ${sideNames.join(' + ')}`;
        }
        
        const nameEl = document.createElement('div'); nameEl.className = 'burger-name'; nameEl.textContent = finalBurgerName; const priceEl = document.createElement('div'); priceEl.className = 'burger-price'; priceEl.textContent = `${earnings}円で売れました！`; container.appendChild(visualsContainer); container.appendChild(nameEl); container.appendChild(priceEl); completedBurgerModal.appendChild(container); completedBurgerModal.style.display = 'flex';
        setTimeout(() => { completedBurgerModal.style.display = 'none'; this.resetForNextCustomer(); }, 3500);
    },

    openShop() { if (this.state.minigameActive) return; this.elements.shopModal.style.display = 'flex'; this.renderShopItems(); },
    closeShop() { this.elements.shopModal.style.display = 'none'; },
    renderShopItems() {
        this.elements.shopItemsContainer.innerHTML = '';
        this.data.shopItems.forEach(item => {
            const isPurchased = this.state.purchasedItems.includes(item.id);
            const canBuy = this.state.money >= item.price;
            if (item.required && !this.state.purchasedItems.includes(item.required)) { return; }
            const el = document.createElement('div'); el.className = `shop-item ${isPurchased ? 'purchased' : ''}`;
            el.innerHTML = `<img src="${this.config.IMAGE_PATH + item.image}" alt="${item.name}"><h4>${item.name}</h4><div class="desc">${item.description}</div>${isPurchased ? `<div class="purchased-badge">購入済み</div>` : `<div class="price">${item.price}円</div><button class="buy-button" ${!canBuy ? 'disabled' : ''}>購入する</button>`}`;
            if (!isPurchased) { const btn = el.querySelector('.buy-button'); btn.addEventListener('click', () => this.buyItem(item)); }
            this.elements.shopItemsContainer.appendChild(el);
        });
    },

    openBgmSelect() {
        if (this.state.minigameActive) return;
        this.elements.bgmSelectModal.style.display = 'flex';
        this.updateBgmListUI();
    },

    closeBgmSelect() {
        this.elements.bgmSelectModal.style.display = 'none';
    },

    updateBgmListUI() {
        this.elements.bgmList.querySelectorAll('.bgm-option').forEach(btn => {
            const index = parseInt(btn.dataset.index);
            btn.classList.toggle('active', index === this.state.bgmIndex);
        });
    },

    updateTimeDisplay() {
        if (!this.elements.clockDisplay) return;
        const hours = Math.floor(this.state.time / 60);
        const minutes = this.state.time % 60;
        this.elements.clockDisplay.textContent = `${hours}:${minutes.toString().padStart(2, '0')}`;
        this.elements.dayDisplay.textContent = `${this.state.day}日目`;
    },

    showDayStart(callback) {
        this.elements.dayStartText.textContent = `${this.state.day}日目 スタート`;
        this.elements.dayStartOverlay.style.display = 'flex';
        setTimeout(() => {
            this.elements.dayStartOverlay.style.display = 'none';
            if (callback) callback();
        }, 3000);
    },

    showDailyResult() {
        const { revenue, expenses, customers, score } = this.state.dailyStats;
        const profit = revenue - expenses;

        const fmtMoney = (val) => (val >= 0 ? '+' : '') + val;

        this.elements.resultRevenue.textContent = fmtMoney(revenue);
        this.elements.resultExpenses.textContent = expenses > 0 ? '-' + expenses : '0';

        this.elements.resultProfit.textContent = fmtMoney(profit);
        this.elements.resultProfit.style.color = profit >= 0 ? 'var(--main-green)' : 'var(--main-red)';

        this.elements.resultCustomers.textContent = customers;
        this.elements.resultScore.textContent = score;

        this.elements.dailyResultModal.style.display = 'flex';
    },

    initRankDisplay() {
        const container = this.elements.rankStarsContainer;
        if (!container) return;
        container.innerHTML = '';

        const starPath = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

        for (let i = 0; i < 5; i++) {
            const svgNS = "http://www.w3.org/2000/svg";
            const svg = document.createElementNS(svgNS, "svg");
            svg.setAttribute("width", "30");
            svg.setAttribute("height", "30");
            svg.setAttribute("viewBox", "0 0 24 24");
            svg.style.margin = "0 2px";
            svg.style.filter = "drop-shadow(1px 1px 1px rgba(0,0,0,0.3))";

            const defs = document.createElementNS(svgNS, "defs");
            const linearGradient = document.createElementNS(svgNS, "linearGradient");
            const gradId = `rank-grad-${i}`;
            linearGradient.setAttribute("id", gradId);
            linearGradient.setAttribute("x1", "0%");
            linearGradient.setAttribute("y1", "0%");
            linearGradient.setAttribute("x2", "100%");
            linearGradient.setAttribute("y2", "0%");

            const stop1 = document.createElementNS(svgNS, "stop");
            stop1.setAttribute("offset", "0%");
            stop1.setAttribute("stop-color", "#ffd700");
            stop1.setAttribute("id", `rank-stop-${i}`);

            const stop2 = document.createElementNS(svgNS, "stop");
            stop2.setAttribute("offset", "0%");
            stop2.setAttribute("stop-color", "transparent");
            stop2.setAttribute("id", `rank-stop-trans-${i}`);

            linearGradient.appendChild(stop1);
            linearGradient.appendChild(stop2);
            defs.appendChild(linearGradient);
            svg.appendChild(defs);

            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("d", starPath);
            path.setAttribute("fill", `url(#${gradId})`);
            path.setAttribute("stroke", "#6d4c41");
            path.setAttribute("stroke-width", "2");
            path.setAttribute("stroke-linejoin", "round");

            svg.appendChild(path);
            container.appendChild(svg);
        }
    },

    unlockNotificationQueue: [],

    updateRankDisplay() {
        const score = this.state.totalRankScore;
        const thresholds = this.rankData.thresholds;

        let prevThreshold = 0;
        let newRank = 0;

        for (let i = 0; i < 5; i++) {
            const target = thresholds[i];
            const range = target - prevThreshold;
            const currentInZone = Math.max(0, score - prevThreshold);

            let percent = 0;
            if (score >= target) {
                percent = 100;
                newRank = i + 1;
            } else if (score > prevThreshold) {
                percent = (currentInZone / range) * 100;
            } else {
                percent = 0;
            }

            const stopEl = document.getElementById(`rank-stop-${i}`);
            const stopTransEl = document.getElementById(`rank-stop-trans-${i}`);
            if (stopEl && stopTransEl) {
                stopEl.setAttribute("offset", `${percent}%`);
                stopTransEl.setAttribute("offset", `${percent}%`);
            }

            prevThreshold = target;
        }

        if (newRank > this.state.currentRank) {
            const oldRank = this.state.currentRank;
            this.state.currentRank = newRank;

            this.unlockNotificationQueue = []; 

            if (oldRank < 3 && newRank >= 3) {
                this.unlockNotificationQueue.push(() => {
                    if (this.elements.contestUnlockModal) {
                        this.playSound(this.sounds.success);
                        this.elements.contestUnlockModal.style.display = 'flex';
                    }
                });
            }

            if (oldRank < 4 && newRank >= 4) {
                this.unlockNotificationQueue.push(() => {
                    const modal = document.getElementById('contest-hungry-unlock-modal');
                    if (modal) {
                        this.playSound(this.sounds.success);
                        modal.style.display = 'flex';
                    }
                });
            }

            Object.keys(this.data.drinks).forEach(id => {
                const item = this.data.drinks[id];
                if (item.reqRank && oldRank < item.reqRank && newRank >= item.reqRank) {
                    this.unlockNotificationQueue.push(() => {
                        this.showItemUnlockModal(item);
                        const btn = this.elements.drinksPanel.querySelector(`button[data-id="${id}"]`);
                        if (btn) btn.style.display = 'flex';
                    });
                }
            });

            this.showRankUpPopup(newRank);
        }

        if (this.elements.titleScreen.style.display === 'none') {
            if (this.state.currentRank >= 3) {
                if (this.elements.contestButton) {
                    this.elements.contestButton.style.display = 'flex';
                }
            }
        }
    },

    showRankUpPopup(rank) {
        this.elements.rankUpStarCount.textContent = rank;

        const container = this.elements.rankUpStarsDisplay;
        container.innerHTML = '';

        const starPath = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";
        const svgNS = "http://www.w3.org/2000/svg";

        for (let i = 0; i < rank; i++) {
            const svg = document.createElementNS(svgNS, "svg");
            svg.setAttribute("width", "60");
            svg.setAttribute("height", "60");
            svg.setAttribute("viewBox", "0 0 24 24");

            svg.style.opacity = "0";
            svg.style.transform = "scale(0)";
            svg.style.transition = `all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${i * 0.2}s`;

            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("d", starPath);
            path.setAttribute("fill", "#ffd700");
            path.setAttribute("stroke", "#6d4c41");
            path.setAttribute("stroke-width", "1.5");
            path.setAttribute("stroke-linejoin", "round");

            svg.appendChild(path);
            container.appendChild(svg);

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    svg.style.opacity = "1";
                    svg.style.transform = "scale(1)";
                });
            });
        }

        this.playSound(this.sounds.success);

        setTimeout(() => {
            this.playSound(this.sounds.rankUp);
        }, 800);

        this.elements.rankUpModal.style.display = 'flex';
    },

    showNextUnlockNotification() {
        if (this.unlockNotificationQueue.length > 0) {
            const nextAction = this.unlockNotificationQueue.shift();
            nextAction();
        }
    },

    showRankInfo() {
        const modal = this.elements.rankInfoModal;
        const starContainer = this.elements.rankInfoStars;
        const currentScoreEl = this.elements.rankCurrentScore;
        const nextTargetEl = this.elements.rankNextTarget;

        starContainer.innerHTML = '';
        const starPath = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";
        const svgNS = "http://www.w3.org/2000/svg";

        const displayRank = this.state.currentRank || 0;
        for (let i = 0; i < 5; i++) {
            const svg = document.createElementNS(svgNS, "svg");
            svg.setAttribute("width", "40");
            svg.setAttribute("height", "40");
            svg.setAttribute("viewBox", "0 0 24 24");

            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("d", starPath);
            path.setAttribute("stroke", "#6d4c41");
            path.setAttribute("stroke-width", "2");
            path.setAttribute("stroke-linejoin", "round");

            if (i < displayRank) {
                path.setAttribute("fill", "#ffd700"); 
            } else {
                path.setAttribute("fill", "#eee"); 
            }

            svg.appendChild(path);
            starContainer.appendChild(svg);
        }

        const currentScore = this.state.totalRankScore;
        currentScoreEl.textContent = currentScore;

        let nextTarget = "MAX";
        if (displayRank < 5) {
            nextTarget = this.rankData.thresholds[displayRank];
        }
        nextTargetEl.textContent = nextTarget;

        modal.style.display = 'flex';
    },

    showItemUnlockModal(item) {
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '7500',
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        });

        const panel = document.createElement('div');
        panel.className = 'game-panel';
        Object.assign(panel.style, {
            width: '700px', textAlign: 'center', border: '10px solid var(--main-orange)', padding: '40px',
            backgroundColor: 'var(--panel-bg)', borderRadius: '25px'
        });

        const title = document.createElement('h2');
        title.innerHTML = `祝！${item.name}開放！`;
        Object.assign(title.style, {
            color: 'var(--main-yellow)', fontSize: '3em', margin: '0 0 20px',
            textShadow: '3px 3px 0 var(--dark-brown)'
        });

        const img = document.createElement('img');
        img.src = this.config.IMAGE_PATH + item.image;
        Object.assign(img.style, {
            width: '200px', height: 'auto', objectFit: 'contain', marginBottom: '20px',
            filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.2))'
        });

        const msg = document.createElement('p');
        msg.innerHTML = `お店のランクがあがって<br><strong>${item.name}</strong>を提供できるようになりました！`;
        Object.assign(msg.style, {
            fontSize: '1.8em', fontWeight: '800', lineHeight: '1.4',
            color: 'var(--dark-brown)', margin: '10px 0 30px'
        });

        const btn = document.createElement('button');
        btn.textContent = 'わかった！';
        btn.className = 'action-button-style';
        Object.assign(btn.style, {
            backgroundColor: 'var(--main-green)', fontSize: '1.5em', padding: '15px 50px',
            color: 'white', border: 'none', borderRadius: '20px',
            boxShadow: '0 6px 0 var(--dark-brown)'
        });

        btn.onclick = () => {
            overlay.remove();
            this.showNextUnlockNotification(); 
        };

        panel.appendChild(title);
        panel.appendChild(img);
        panel.appendChild(msg);
        panel.appendChild(btn);
        overlay.appendChild(panel);

        this.elements.fixedContainer.appendChild(overlay);
        this.playSound(this.sounds.success);
    }
});