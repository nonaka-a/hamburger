Object.assign(hamburgerGame, {
    startGrillMinigame(id) {
        this.state.minigameActive = true; const { minigameDock, grillMinigame, grillCursor, grillStopButton, grillItemImage } = this.elements;
        const itemData = this.data.ingredients[id];

        grillItemImage.src = this.config.IMAGE_PATH + itemData.image;
        const titleElement = grillMinigame.querySelector('h3');
        titleElement.textContent = `${itemData.name}を焼こう！`;

        minigameDock.style.display = 'block'; grillMinigame.style.display = 'block'; this.playSound(this.sounds.grill, true);
        let animation; grillCursor.style.animation = 'none';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => { animation = grillCursor.animate([{ left: '0%' }, { left: `calc(100% - 8px)` }], { duration: 1000, direction: 'alternate', iterations: Infinity, easing: 'linear' }); });
        });
        const stopHandler = () => {
            grillStopButton.onclick = null;
            this.sounds.grill.pause(); if (animation) animation.pause();
            const pos = (grillCursor.offsetLeft / grillMinigame.querySelector('.grill-meter-bar').offsetWidth) * 100;
            let quality = 'bad';
            let resultText = '';

            if (pos >= 45 && pos <= 55) {
                quality = 'excellent';
                resultText = 'パーフェクト！';
            } else if (pos >= 30 && pos <= 70) {
                quality = 'good';
                resultText = 'グッド！';
            } else if (pos >= 15 && pos <= 85) {
                quality = 'normal';
            }

            if (resultText) {
                this.playSound(this.sounds.minigameSuccess);
                const textEl = document.createElement('div');
                textEl.textContent = resultText;
                textEl.className = `minigame-result-text ${quality}`;
                minigameDock.appendChild(textEl);
            }

            setTimeout(() => {
                this.addIngredient(id, quality);
                minigameDock.style.display = 'none'; grillMinigame.style.display = 'none';
                grillItemImage.src = "";
                if (animation) animation.cancel();
                const existingTextEl = minigameDock.querySelector('.minigame-result-text');
                if (existingTextEl) { existingTextEl.remove(); }
                this.state.minigameActive = false;
            }, 1200);
        };
        grillStopButton.onclick = stopHandler;
    },

    startPourMinigame(id) { this.state.minigameActive = true; const { minigameDock, pourMinigame, pourLiquid, pourButton } = this.elements; minigameDock.style.display = 'block'; pourMinigame.style.display = 'block'; pourLiquid.style.height = '0%'; pourLiquid.style.backgroundColor = id === 'coke' ? '#3e2723' : id === 'orange-juice' ? '#ff9800' : '#e3f2fd'; let interval; const startPour = () => { this.playSound(this.sounds.pour, true); interval = setInterval(() => { pourLiquid.style.height = `${Math.min(100, parseFloat(pourLiquid.style.height) + 1)}%`; }, 20); }; const stopPour = () => { this.sounds.pour.pause(); clearInterval(interval); const height = parseFloat(pourLiquid.style.height); let quality = 'failed'; if (height >= 75 && height <= 85) quality = 'excellent'; else if (height >= 65 && height <= 95) quality = 'good'; else if (height >= 50) quality = 'normal'; this.addDrink(id, quality); minigameDock.style.display = 'none'; pourMinigame.style.display = 'none'; this.state.minigameActive = false; pourButton.removeEventListener('mousedown', startPour); pourButton.removeEventListener('mouseup', stopPour); pourButton.removeEventListener('mouseleave', stopPour); }; pourButton.addEventListener('mousedown', startPour); pourButton.addEventListener('mouseup', stopPour); pourButton.addEventListener('mouseleave', stopPour); },

    startRestockFlow() { if (this.state.minigameActive) return; this.state.minigameActive = true; this.state.restock.selection = []; this.elements.restockGameModal.style.display = 'flex'; this.elements.restockSelectionScreen.style.display = 'block'; this.elements.restockMinigameScreen.style.display = 'none'; this.elements.restockResultScreen.style.display = 'none'; this.populateRestockSelection(); this.updateRestockCost(); },
    
    populateRestockSelection() {
        const listEl = this.elements.restockItemList; listEl.innerHTML = ''; const allItems = { ...this.data.ingredients, ...this.data.drinks };
        [...this.data.middleIngredients, ...Object.keys(this.data.drinks)].forEach(id => {
            const item = allItems[id]; if (item.purchasePrice === undefined) return; const btn = document.createElement('button'); btn.className = 'restock-item-button'; btn.dataset.id = id;
            btn.innerHTML = `<img src="${this.config.IMAGE_PATH + item.image}" alt="${item.name}"><span>${item.name}</span><span class="restock-item-stock">在庫: ${item.stock}</span>`;
            btn.addEventListener('click', () => this.handleRestockSelection(id)); listEl.appendChild(btn);
        });
    },

    handleRestockSelection(id) {
        const selection = this.state.restock.selection; const index = selection.indexOf(id);
        if (index > -1) { selection.splice(index, 1); } else { if (selection.length < 3) { selection.push(id); } }
        const allButtons = this.elements.restockItemList.querySelectorAll('.restock-item-button');
        allButtons.forEach(btn => { const btnId = btn.dataset.id; btn.classList.toggle('selected', selection.includes(btnId)); btn.classList.toggle('disabled', selection.length >= 3 && !selection.includes(btnId)); });
        this.updateRestockCost();
    },

    updateRestockCost() {
        let totalCost = 0; const allItems = { ...this.data.ingredients, ...this.data.drinks };
        this.state.restock.selection.forEach(id => { totalCost += allItems[id].purchasePrice * 5; });
        this.elements.restockTotalCost.textContent = totalCost;
        this.elements.restockConfirmSelectionButton.disabled = this.state.restock.selection.length === 0 || this.state.money < totalCost;
    },

    showRestockConfirmPopup() {
        const selection = this.state.restock.selection; if (selection.length === 0) return; const allItems = { ...this.data.ingredients, ...this.data.drinks };
        let totalCost = 0; selection.forEach(id => { totalCost += allItems[id].purchasePrice * 5; }); if (this.state.money < totalCost) { alert("お金が足りません！"); return; }
        this.elements.restockConfirmMessage.innerHTML = `合計 ${totalCost}円を支払って<br>仕入れゲームを始めますか？`; this.elements.restockConfirmPopup.style.display = 'flex';
    },

    hideRestockConfirmPopup() { this.elements.restockConfirmPopup.style.display = 'none'; },

    processPaymentAndStartMinigame() {
        this.hideRestockConfirmPopup(); const allItems = { ...this.data.ingredients, ...this.data.drinks };
        let totalCost = 0; this.state.restock.selection.forEach(id => { totalCost += allItems[id].purchasePrice * 5; });
        this.state.money -= totalCost; this.showMoneyPopup(-totalCost); this.updateUI();
        this.elements.restockSelectionScreen.style.display = 'none'; this.elements.restockMinigameScreen.style.display = 'block'; this.startCatchMinigame();
    },

    async startCatchMinigame() {
        this.catchGame.canvas = this.elements.catchGameCanvas; this.catchGame.ctx = this.catchGame.canvas.getContext('2d');
        this.state.restock.caughtItems = {}; this.state.restock.selection.forEach(id => this.state.restock.caughtItems[id] = 0);
        await this.preloadCatchGameImages();
        this.catchGame.basket = { x: this.catchGame.canvas.width / 2 - 50, y: this.catchGame.canvas.height - 70, width: 100, height: 60, speed: 10, image: this.catchGame.imageCache.basket };
        this.catchGame.items = []; this.catchGame.keys = {};

        // キーボード操作設定
        this.keydownHandler = e => this.catchGame.keys[e.key] = true; 
        this.keyupHandler = e => this.catchGame.keys[e.key] = false;
        document.addEventListener('keydown', this.keydownHandler); 
        document.addEventListener('keyup', this.keyupHandler);

        // --- マウス・タッチ操作設定 ---
        const moveBasket = (clientX) => {
            if (!this.catchGame.canvas) return;
            const rect = this.catchGame.canvas.getBoundingClientRect();
            const scaleX = this.catchGame.canvas.width / rect.width;
            let mouseX = (clientX - rect.left) * scaleX;
            this.catchGame.basket.x = mouseX - this.catchGame.basket.width / 2;
            if (this.catchGame.basket.x < 0) this.catchGame.basket.x = 0;
            if (this.catchGame.basket.x > this.catchGame.canvas.width - this.catchGame.basket.width) {
                this.catchGame.basket.x = this.catchGame.canvas.width - this.catchGame.basket.width;
            }
        };

        this.catchGame.mousemoveHandler = e => { moveBasket(e.clientX); };
        this.catchGame.touchmoveHandler = e => { e.preventDefault(); const touch = e.touches[0]; moveBasket(touch.clientX); };

        this.catchGame.canvas.addEventListener('mousemove', this.catchGame.mousemoveHandler);
        this.catchGame.canvas.addEventListener('touchmove', this.catchGame.touchmoveHandler, { passive: false });

        this.updateRealtimeScore();
        let timeLeft = 15;
        this.elements.minigameTimer.textContent = timeLeft;
        this.catchGame.timerInterval = setInterval(() => {
            timeLeft--; this.elements.minigameTimer.textContent = timeLeft;
            if (timeLeft <= 0) { clearInterval(this.catchGame.timerInterval); this.endCatchMinigame(); }
        }, 1000);

        const itemsToSpawn = [];
        this.state.restock.selection.forEach(id => {
            for (let i = 0; i < 20; i++) { itemsToSpawn.push(id); }
        });
        for (let i = itemsToSpawn.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [itemsToSpawn[i], itemsToSpawn[j]] = [itemsToSpawn[j], itemsToSpawn[i]];
        }

        this.catchGame.interval = setInterval(() => {
            if (itemsToSpawn.length > 0) { this.spawnCatchItem(itemsToSpawn.pop()); } else { clearInterval(this.catchGame.interval); }
        }, 250);

        this.gameLoop();
    },

    preloadCatchGameImages() {
        const promises = []; const allItems = { ...this.data.ingredients, ...this.data.drinks };
        this.state.restock.selection.forEach(id => { const img = new Image(); img.src = this.config.IMAGE_PATH + allItems[id].image; this.catchGame.imageCache[id] = img; promises.push(new Promise(resolve => img.onload = resolve)); });
        const basketImg = new Image(); basketImg.src = this.config.IMAGE_PATH + 'basket.png'; this.catchGame.imageCache.basket = basketImg; promises.push(new Promise(resolve => basketImg.onload = resolve));
        return Promise.all(promises);
    },

    spawnCatchItem(forcedId = null) {
        const id = forcedId || this.state.restock.selection[Math.floor(Math.random() * this.state.restock.selection.length)];
        this.catchGame.items.push({ x: Math.random() * (this.catchGame.canvas.width - 40), y: -50, width: 50, height: 40, speed: 3 + Math.random() * 3, id: id, image: this.catchGame.imageCache[id] });
    },

    gameLoop() { this.updateGameState(); this.drawGame(); this.catchGame.animationFrameId = requestAnimationFrame(() => this.gameLoop()); },

    updateGameState() {
        if (!this.catchGame.basket) return;
        if (this.catchGame.keys['ArrowLeft'] && this.catchGame.basket.x > 0) { this.catchGame.basket.x -= this.catchGame.basket.speed; }
        if (this.catchGame.keys['ArrowRight'] && this.catchGame.basket.x < this.catchGame.canvas.width - this.catchGame.basket.width) { this.catchGame.basket.x += this.catchGame.basket.speed; }
        for (let i = this.catchGame.items.length - 1; i >= 0; i--) {
            const item = this.catchGame.items[i]; item.y += item.speed;
            if (item.y > this.catchGame.canvas.height) { this.catchGame.items.splice(i, 1); continue; }
            if (item.x < this.catchGame.basket.x + this.catchGame.basket.width && item.x + item.width > this.catchGame.basket.x && item.y < this.catchGame.basket.y + this.catchGame.basket.height && item.y + item.height > this.catchGame.basket.y) {
                this.state.restock.caughtItems[item.id]++; this.catchGame.items.splice(i, 1); this.playSound(this.sounds.catch); this.updateRealtimeScore();
            }
        }
    },

    drawGame() {
        if (!this.catchGame.ctx) return; const { ctx, canvas, basket, items } = this.catchGame; ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (basket && basket.image && basket.image.complete) { ctx.drawImage(basket.image, basket.x, basket.y, basket.width, basket.height); }
        items.forEach(item => { if (item.image && item.image.complete) { ctx.drawImage(item.image, item.x, item.y, item.width, item.height); } });
    },

    updateRealtimeScore() {
        const scoreEl = this.elements.minigameRealtimeScore; scoreEl.innerHTML = ''; const allItems = { ...this.data.ingredients, ...this.data.drinks };
        for (const id in this.state.restock.caughtItems) {
            const count = this.state.restock.caughtItems[id]; const itemData = allItems[id];
            const div = document.createElement('div');
            div.innerHTML = `<img src="${this.config.IMAGE_PATH + itemData.image}"> ${count}`;
            scoreEl.appendChild(div);
        }
    },

    endCatchMinigame() {
        cancelAnimationFrame(this.catchGame.animationFrameId); clearInterval(this.catchGame.interval); clearInterval(this.catchGame.timerInterval);
        if (this.keydownHandler) document.removeEventListener('keydown', this.keydownHandler);
        if (this.keyupHandler) document.removeEventListener('keyup', this.keyupHandler);
        if (this.catchGame.mousemoveHandler) { this.catchGame.canvas.removeEventListener('mousemove', this.catchGame.mousemoveHandler); }
        if (this.catchGame.touchmoveHandler) { this.catchGame.canvas.removeEventListener('touchmove', this.catchGame.touchmoveHandler); }
        this.catchGame.keys = {};
        this.elements.restockMinigameScreen.style.display = 'none'; this.elements.restockResultScreen.style.display = 'block'; this.showRestockResult();
    },

    showRestockResult() {
        const resultEl = this.elements.restockResultList; resultEl.innerHTML = ''; const allItems = { ...this.data.ingredients, ...this.data.drinks };
        if (Object.values(this.state.restock.caughtItems).every(v => v === 0) && this.state.restock.selection.length > 0) { resultEl.innerHTML = '<p style="font-size: 1.5em;">なにもとれませんでした…</p>'; return; }
        for (const id in this.state.restock.caughtItems) {
            const count = this.state.restock.caughtItems[id]; const itemData = allItems[id];
            const itemDiv = document.createElement('div'); itemDiv.className = 'result-item'; let imagesHTML = '';
            for (let i = 0; i < count; i++) { imagesHTML += `<img src="${this.config.IMAGE_PATH + itemData.image}">`; }
            itemDiv.innerHTML = `<p>${itemData.name} ${count}</p><div class="result-images">${imagesHTML}</div>`; resultEl.appendChild(itemDiv);
        }
    },

    applyRestockResults() {
        const allItems = { ...this.data.ingredients, ...this.data.drinks };
        for (const id in this.state.restock.caughtItems) {
            const count = this.state.restock.caughtItems[id];
            if (count > 0) {
                const currentStock = allItems[id].stock;
                const newStock = Math.min(currentStock + count, this.config.MAX_STOCK);
                const addedAmount = newStock - currentStock;
                if (addedAmount > 0) {
                    allItems[id].stock = newStock;
                    const button = this.elements.ingredientsPanel.querySelector(`[data-id="${id}"]`) || this.elements.drinksPanel.querySelector(`[data-id="${id}"]`);
                    if (button) {
                        const popup = document.createElement('span'); popup.className = 'stock-popup-animation'; popup.textContent = `+${addedAmount}`;
                        button.style.position = 'relative'; button.appendChild(popup); popup.addEventListener('animationend', () => popup.remove());
                    }
                }
            }
        }
        this.updateUI();
    },

    closeRestockFlow() { this.applyRestockResults(); this.elements.restockGameModal.style.display = 'none'; this.state.minigameActive = false; },
    
    restartRestockFlow() {
        this.applyRestockResults(); this.state.restock.selection = [];
        this.elements.restockSelectionScreen.style.display = 'block'; this.elements.restockMinigameScreen.style.display = 'none';
        this.elements.restockResultScreen.style.display = 'none'; this.populateRestockSelection(); this.updateRestockCost();
    },
    
    cancelRestockFlow() { this.elements.restockGameModal.style.display = 'none'; this.state.minigameActive = false; },
    
    abortCatchMinigame() {
        if (confirm("ゲームを中断しますか？支払ったお金は戻りません。")) {
            cancelAnimationFrame(this.catchGame.animationFrameId);
            clearInterval(this.catchGame.interval);
            if (this.catchGame.timerInterval) { clearInterval(this.catchGame.timerInterval); }
            if(this.keydownHandler) document.removeEventListener('keydown', this.keydownHandler);
            if(this.keyupHandler) document.removeEventListener('keyup', this.keyupHandler);
            if (this.catchGame.mousemoveHandler) { this.catchGame.canvas.removeEventListener('mousemove', this.catchGame.mousemoveHandler); }
            if (this.catchGame.touchmoveHandler) { this.catchGame.canvas.removeEventListener('touchmove', this.catchGame.touchmoveHandler); }
            this.catchGame.keys = {};
            this.cancelRestockFlow();
        }
    }
});