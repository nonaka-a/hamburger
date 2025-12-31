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
            restockAbortButton: '#restock-abort-button'
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
    },

    bindGameEvents() {
        this.elements.ingredientsPanel.addEventListener('click', e => { const b = e.target.closest('button'); if (b) this.handleItemClick(b.dataset.id, 'ingredient'); });
        this.elements.drinksPanel.addEventListener('click', e => { const b = e.target.closest('button'); if (b) this.handleItemClick(b.dataset.id, 'drink'); });
        this.elements.serveButton.addEventListener('click', () => this.serveOrder());
        this.elements.undoButton.addEventListener('click', () => this.undoLastIngredient());
        this.elements.trashButton.addEventListener('click', () => this.trashOrder());
        this.elements.showRestockButton.addEventListener('click', () => this.startRestockFlow());
        this.elements.restockConfirmSelectionButton.addEventListener('click', () => this.showRestockConfirmPopup());
        this.elements.restockReturnToGameButton.addEventListener('click', () => this.closeRestockFlow());
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

    toggleSettingsPanel() {
        this.elements.settingsPanel.classList.toggle('open');
    },

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => { console.error(`Error: ${err.message}`); });
        } else {
            if (document.exitFullscreen) { document.exitFullscreen(); }
        }
    },

    initializePanels() { 
        const c = (id, d) => { const b = document.createElement('button'); b.dataset.id = id; b.innerHTML = `<img src="${this.config.IMAGE_PATH + d.image}"><span>${d.name}</span>`; if (d.stock !== Infinity) { b.innerHTML += `<div class="stock-display">${d.stock}</div>`; } return b; }; 
        this.data.displayOrder.forEach(id => { if (this.data.ingredients[id]) { this.elements.ingredientsPanel.appendChild(c(id, this.data.ingredients[id])); } }); 
        for (const id in this.data.drinks) { this.elements.drinksPanel.appendChild(c(id, this.data.drinks[id])); } 
    },

    updateUI() {
        this.elements.money.textContent = this.state.money;
        const u = (items, p) => { Object.keys(items).forEach(id => { const b = p.querySelector(`[data-id="${id}"]`); if (b) { const d = items[id]; const s = b.querySelector('.stock-display'); if (s) s.textContent = d.stock; b.disabled = d.stock <= 0; b.classList.toggle('out-of-stock', d.stock <= 0); } }); };
        u(this.data.ingredients, this.elements.ingredientsPanel);
        u(this.data.drinks, this.elements.drinksPanel);
        this.elements.drinksPanel.querySelectorAll('button').forEach(b => { b.classList.toggle('selected', this.state.playerSelection.drink && this.state.playerSelection.drink.id === b.dataset.id); });
        const h = this.state.playerSelection.burger.length > 0 || this.state.playerSelection.drink;
        this.elements.serveButton.disabled = this.state.playerSelection.burger.length === 0;
        this.elements.undoButton.disabled = this.state.playerSelection.burger.length === 0;
        this.elements.trashButton.disabled = !h;
        this.elements.showRestockButton.disabled = this.state.minigameActive;
        this.elements.orderList.innerHTML = '';
        if (this.state.currentOrder.burger.length > 0) {
            [...this.state.currentOrder.burger].reverse().forEach(id => { const li = document.createElement('li'); const data = this.data.ingredients[id]; const nameHTML = id.includes('bun') ? data.name : `<b>${data.name}</b>`; li.innerHTML = `<img src="${this.config.IMAGE_PATH + data.image}" alt="${data.name}">${nameHTML}`; this.elements.orderList.appendChild(li); });
            if (this.state.currentOrder.drink) { const li = document.createElement('li'); const data = this.data.drinks[this.state.currentOrder.drink]; li.innerHTML = `<img src="${this.config.IMAGE_PATH + data.image}" alt="${data.name}"><b>${data.name}</b>`; this.elements.orderList.appendChild(li); }
        } else { this.elements.orderList.innerHTML = '<li>（ご注文はまだかな？）</li>'; }
        this.elements.burgerStack.innerHTML = '';
        this.state.playerSelection.burger.forEach(item => { const container = document.createElement('div'); container.className = 'ingredient-image-stack'; const img = document.createElement('img'); img.src = this.config.IMAGE_PATH + this.data.ingredients[item.id].image; container.appendChild(img); if (item.quality !== 'normal') { const effect = document.createElement('div'); effect.className = `quality-effect quality-${item.quality}`; effect.style.animation = 'none'; requestAnimationFrame(() => { effect.style.animation = ''; }); container.appendChild(effect); } this.elements.burgerStack.appendChild(container); });
        if (this.state.playerSelection.drink) { this.elements.drinkDisplay.innerHTML = `<img src="${this.config.IMAGE_PATH + this.data.drinks[this.state.playerSelection.drink.id].image}" alt="${this.data.drinks[this.state.playerSelection.drink.id].name}">`; } else { this.elements.drinkDisplay.innerHTML = '<span>（のみもの）</span>'; }
        this.elements.drinkDisplayContainer.classList.toggle('visible', this.state.playerSelection.drink && this.state.playerSelection.drink.id);
    },

    setCustomerMessage(text) { this.elements.customerMessage.textContent = text; },

    showMoneyPopup(amount) { const p = document.createElement('div'); p.textContent = `${amount > 0 ? '+' : ''}${amount}円`; p.className = `money-popup ${amount > 0 ? 'plus' : 'minus'}`; this.elements.statusBar.appendChild(p); p.addEventListener('animationend', () => p.remove()); },

    showCompletedBurger(burgerName, earnings) { 
        const { completedBurgerModal } = this.elements; completedBurgerModal.innerHTML = ''; const container = document.createElement('div'); container.className = 'completed-burger-container'; const visualsContainer = document.createElement('div'); visualsContainer.className = 'completed-visuals'; const imageContainer = document.createElement('div'); imageContainer.className = 'burger-image-container'; let currentHeight = 0; 
        this.state.currentOrder.burger.forEach((id, index) => { const img = document.createElement('img'); img.src = this.config.IMAGE_PATH + this.data.ingredients[id].image; img.className = 'completed-ingredient-image'; img.style.bottom = `${currentHeight}px`; img.style.zIndex = index; img.style.animationDelay = `${index * 0.15}s`; imageContainer.appendChild(img); currentHeight += this.data.ingredients[id].height; }); visualsContainer.appendChild(imageContainer); 
        if (this.state.currentOrder.drink) { const drinkImg = document.createElement('img'); drinkImg.src = this.config.IMAGE_PATH + this.data.drinks[this.state.currentOrder.drink].image; drinkImg.className = 'completed-drink-image'; visualsContainer.appendChild(drinkImg); } 
        let finalBurgerName = burgerName; if (this.state.playerSelection.drink) { const drinkData = this.data.drinks[this.state.playerSelection.drink.id]; const qualityName = drinkData.qualityNames[this.state.playerSelection.drink.quality]; finalBurgerName += ` + ${qualityName || drinkData.name}`; } 
        const nameEl = document.createElement('div'); nameEl.className = 'burger-name'; nameEl.textContent = finalBurgerName; const priceEl = document.createElement('div'); priceEl.className = 'burger-price'; priceEl.textContent = `${earnings}円で売れました！`; container.appendChild(visualsContainer); container.appendChild(nameEl); container.appendChild(priceEl); completedBurgerModal.appendChild(container); completedBurgerModal.style.display = 'flex'; 
        setTimeout(() => { completedBurgerModal.style.display = 'none'; this.resetForNextCustomer(); }, 3500); 
    }
});