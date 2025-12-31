document.addEventListener('DOMContentLoaded', () => {
    const hamburgerGame = {
        state: { money: 500, currentCustomer: null, currentOrder: { burger: [], drink: null }, playerSelection: { burger: [], drink: null }, isAcceptingOrder: false, minigameActive: false, restock: { selection: [], caughtItems: {} }, zoom: 1.0 },
        config: { MAX_STOCK: 10, IMAGE_PATH: 'images/', SOUND_PATH: 'sound/', },
        elements: {},
        sounds: {},
        data: gameData,
        // --- Catch Minigame variables ---
        catchGame: {
            ctx: null, canvas: null, basket: {}, items: [], interval: null, keys: {}, animationFrameId: null, imageCache: {}, timerInterval: null
        },

        init() { this.cacheElements(); this.loadSounds(); this.bindGlobalEvents(); },
        cacheElements() {
            const s = {
                titleScreen: '#title-screen', startButton: '#start-button', gameWrapper: '#game-wrapper', statusBar: '#status-bar', money: '#money', 
                // soundToggleButton: '#sound-toggle-button', // 古い参照を削除
                settingsIcon: '#settings-icon', settingsPanel: '#settings-panel', zoomInButton: '#zoom-in-button', zoomOutButton: '#zoom-out-button', fullscreenButton: '#fullscreen-button', soundToggleButton: '#sound-toggle-button', closeSettingsButton: '#close-settings-button', fixedContainer: '#fixed-container', // 新規追加
                customerImage: '#customer-image', customerMessage: '#customer-message', orderList: '#order-list', burgerStack: '#burger-stack', ingredientsPanel: '#ingredients-panel', drinksPanel: '#drinks-panel', drinkDisplay: '#drink-display', drinkDisplayContainer: '#drink-display-container',
                serveButton: '#serve-button', undoButton: '#undo-button', trashButton: '#trash-button',
                showRestockButton: '#show-restock-button',
                completedBurgerModal: '#completed-burger-modal', minigameDock: '#minigame-dock', grillMinigame: '#grill-minigame', grillCursor: '#grill-cursor', grillStopButton: '#grill-stop-button', pourMinigame: '#pour-minigame', pourLiquid: '#pour-liquid', pourButton: '#pour-button',
                // Grill Minigame Visuals
                grillItemImage: '#grill-item-image',
                // New Restock Game Elements
                restockGameModal: '#restock-game-modal', restockSelectionScreen: '#restock-selection-screen', restockItemList: '#restock-item-list', restockTotalCost: '#restock-total-cost', restockConfirmSelectionButton: '#restock-confirm-selection-button',
                restockMinigameScreen: '#restock-minigame-screen', minigameHud: '#minigame-hud', minigameTimer: '#minigame-timer', minigameRealtimeScore: '#minigame-realtime-score', catchGameCanvas: '#catch-game-canvas',
                restockResultScreen: '#restock-result-screen', restockResultList: '#restock-result-list', restockReturnToGameButton: '#restock-return-to-game-button',
                restockAgainButton: '#restock-again-button',
                // Restock Confirm Popup
                restockConfirmPopup: '#restock-confirm-popup', restockConfirmMessage: '#restock-confirm-message', restockPayButton: '#restock-pay-button', restockCancelButton: '#restock-cancel-button',
                restockCancelSelectionButton: '#restock-cancel-selection-button',
                restockAbortButton: '#restock-abort-button'
            };
            for (const k in s) { this.elements[k] = document.querySelector(s[k]); }
        },
loadSounds() { const f = { bgm: 'bgm.mp3', select: 'select.mp3', success: 'success.mp3', order: 'order.mp3', failure: 'failure.mp3', grill: 'grill.mp3', pour: 'pour.mp3', catch: 'catch.mp3', minigameSuccess: 'minigame_success.mp3' }; for (const k in f) { this.sounds[k] = new Audio(this.config.SOUND_PATH + f[k]); } this.sounds.bgm.loop = true; this.sounds.bgm.volume = 0.3; this.sounds.grill.loop = true; this.sounds.pour.loop = true; },        bindGlobalEvents() { 
            this.elements.startButton.addEventListener('click', () => this.startGame()); 
            // Settings Events
            this.elements.settingsIcon.addEventListener('click', () => this.toggleSettingsPanel());
            this.elements.closeSettingsButton.addEventListener('click', () => this.toggleSettingsPanel());
            this.elements.zoomInButton.addEventListener('click', () => this.changeZoom(0.1));
            this.elements.zoomOutButton.addEventListener('click', () => this.changeZoom(-0.1));
            this.elements.fullscreenButton.addEventListener('click', () => this.toggleFullscreen());
            this.elements.soundToggleButton.addEventListener('click', () => this.toggleSound());
        },
        startGame() { this.elements.titleScreen.style.display = 'none'; this.elements.gameWrapper.style.display = 'flex'; this.sounds.bgm.play().catch(e => {}); this.initializePanels(); this.bindGameEvents(); this.updateUI(); this.newCustomer(); },
        initializePanels() { const c = (id, d) => { const b = document.createElement('button'); b.dataset.id = id; b.innerHTML = `<img src="${this.config.IMAGE_PATH + d.image}"><span>${d.name}</span>`; if (d.stock !== Infinity) { b.innerHTML += `<div class="stock-display">${d.stock}</div>`; } return b; }; this.data.displayOrder.forEach(id => { if (this.data.ingredients[id]) { this.elements.ingredientsPanel.appendChild(c(id, this.data.ingredients[id])); } }); for (const id in this.data.drinks) { this.elements.drinksPanel.appendChild(c(id, this.data.drinks[id])); } },
        bindGameEvents() {
            this.elements.ingredientsPanel.addEventListener('click', e => { const b = e.target.closest('button'); if (b) this.handleItemClick(b.dataset.id, 'ingredient'); });
            this.elements.drinksPanel.addEventListener('click', e => { const b = e.target.closest('button'); if (b) this.handleItemClick(b.dataset.id, 'drink'); });
            this.elements.serveButton.addEventListener('click', () => this.serveOrder());
            this.elements.undoButton.addEventListener('click', () => this.undoLastIngredient());
            this.elements.trashButton.addEventListener('click', () => this.trashOrder());
            this.elements.showRestockButton.addEventListener('click', () => this.startRestockFlow());
            // this.elements.soundToggleButton.addEventListener('click', () => this.toggleSound()); // 重複回避のため削除
            this.elements.restockConfirmSelectionButton.addEventListener('click', () => this.showRestockConfirmPopup());
            this.elements.restockReturnToGameButton.addEventListener('click', () => this.closeRestockFlow());
            this.elements.restockAgainButton.addEventListener('click', () => this.restartRestockFlow());
            this.elements.restockPayButton.addEventListener('click', () => this.processPaymentAndStartMinigame());
            this.elements.restockCancelButton.addEventListener('click', () => this.hideRestockConfirmPopup());
            this.elements.restockCancelSelectionButton.addEventListener('click', () => this.cancelRestockFlow());
            this.elements.restockAbortButton.addEventListener('click', () => this.abortCatchMinigame());
        },
        handleItemClick(id, type) { if (!this.state.isAcceptingOrder || this.state.minigameActive) return; const grillableItems = ['patty', 'bacon', 'egg']; if (type === 'ingredient') { if (this.data.ingredients[id].stock <= 0) return; if (grillableItems.includes(id)) { this.startGrillMinigame(id); } else { this.addIngredient(id, 'normal'); } } else if (type === 'drink') { if (this.data.drinks[id].stock <= 0) return; this.startPourMinigame(id); } },
        newCustomer() { this.setCustomerMessage('いらっしゃいませ！'); this.state.isAcceptingOrder = false; setTimeout(() => { const customerIndex = Math.floor(Math.random() * this.data.customers.length); const customerImageFile = this.data.customers[customerIndex]; this.state.currentCustomer = customerImageFile; this.elements.customerImage.src = this.config.IMAGE_PATH + customerImageFile; this.elements.customerImage.classList.add('visible'); this.generateOrder(); this.updateUI(); this.setCustomerMessage('これください！'); this.state.isAcceptingOrder = true; this.playSound(this.sounds.order); }, 1500); },
        generateOrder() { const { middleIngredients, drinks } = this.data; const n = Math.floor(Math.random() * 4) + 1; const t = []; for (let i = 0; i < n; i++) { t.push(middleIngredients[Math.floor(Math.random() * middleIngredients.length)]); } this.state.currentOrder.burger = ['bottom-bun', ...t, 'top-bun']; this.state.currentOrder.drink = null; if (this.state.currentCustomer === 'customer7.png') { this.state.currentOrder.drink = 'orange-juice'; } else if (this.state.currentCustomer === 'customer6.png') { this.state.currentOrder.drink = 'coke'; } else { if (Math.random() < 0.5) { const availableDrinks = Object.keys(drinks).filter(id => drinks[id].stock > 0); if (availableDrinks.length > 0) { const drinkId = availableDrinks[Math.floor(Math.random() * availableDrinks.length)]; this.state.currentOrder.drink = drinkId; } } } },
        serveOrder() { if (!this.state.isAcceptingOrder || this.state.playerSelection.burger.length === 0) return; this.state.isAcceptingOrder = false; const bC = JSON.stringify(this.state.playerSelection.burger.map(i => i.id).sort()) === JSON.stringify([...this.state.currentOrder.burger].sort()); const dC = (this.state.playerSelection.drink ? this.state.playerSelection.drink.id : null) === this.state.currentOrder.drink; if (bC && dC) { this.playSound(this.sounds.success); let earnings = 0; this.state.playerSelection.burger.forEach(item => { const data = this.data.ingredients[item.id]; const multiplier = data.qualityMultipliers ? data.qualityMultipliers[item.quality] : 1; earnings += data.price * multiplier; }); if (this.state.playerSelection.drink) { const item = this.state.playerSelection.drink; const data = this.data.drinks[item.id]; const multiplier = data.qualityMultipliers ? data.qualityMultipliers[item.quality] : 1; earnings += data.price * multiplier; } const finalEarnings = Math.round(earnings); this.state.money += finalEarnings; const bN = this.getBurgerName(this.state.currentOrder.burger); this.showMoneyPopup(finalEarnings); this.setCustomerMessage(`「${bN}」おいしい！`); this.showCompletedBurger(bN, finalEarnings); } else { this.playSound(this.sounds.failure); this.setCustomerMessage('あれ、ちがうみたい…'); setTimeout(() => { this.state.playerSelection.burger = []; this.state.playerSelection.drink = null; this.updateUI(); this.setCustomerMessage('もう一度お願い！'); this.playSound(this.sounds.order); this.state.isAcceptingOrder = true; }, 2000); } this.updateUI(); },
        addIngredient(id, quality) { if (!this.state.isAcceptingOrder) return; this.playSound(this.sounds.select); this.data.ingredients[id].stock--; this.state.playerSelection.burger.push({ id, quality }); this.updateUI(); },
        addDrink(id, quality) { if (!this.state.isAcceptingOrder) return; if (quality === 'failed') { this.state.playerSelection.drink = null; this.playSound(this.sounds.failure); this.updateUI(); return; } if (this.state.playerSelection.drink) { this.data.drinks[this.state.playerSelection.drink.id].stock++; } this.state.playerSelection.drink = { id, quality }; this.data.drinks[id].stock--; this.playSound(this.sounds.select); this.updateUI(); },
        undoLastIngredient() { if (this.state.playerSelection.burger.length === 0) return; this.playSound(this.sounds.select); const removed = this.state.playerSelection.burger.pop(); if (removed && this.data.ingredients[removed.id].stock !== Infinity) { this.data.ingredients[removed.id].stock++; } this.updateUI(); },
        trashOrder(silent = false) { if (this.state.playerSelection.burger.length === 0 && !this.state.playerSelection.drink) return; if (!silent) this.playSound(this.sounds.failure); if (this.state.playerSelection.drink) { const drinkId = this.state.playerSelection.drink.id; if (this.data.drinks[drinkId].stock < this.config.MAX_STOCK) { this.data.drinks[drinkId].stock++; } this.state.playerSelection.drink = null; } this.state.playerSelection.burger.forEach(item => { if (this.data.ingredients[item.id].stock !== Infinity && this.data.ingredients[item.id].stock < this.config.MAX_STOCK) { this.data.ingredients[item.id].stock++; } }); this.state.playerSelection.burger = []; this.updateUI(); },
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
getBurgerName(burgerIngredients) {
            const middle = burgerIngredients.filter(id => id !== 'top-bun' && id !== 'bottom-bun');
            const uniqueMiddle = new Set(middle);
            const h = (id) => middle.includes(id);
            const c = (id) => middle.filter(i => i === id).length;
            if (c('patty') >= 3) return "肉の壁バーガー";
            if (c('cheese') >= 3) return "チーズの雪崩バーガー";
            if (middle.length >= 6) return "タワーバーガー";
            if (h('patty') && h('cheese') && h('pickles') && h('onion')) return "王道クラシックバーガー";
            if (h('bacon') && h('lettuce') && h('tomato')) return "BLTサンド";
            if (h('avocado') && h('egg')) return "森の恵みと太陽のエッグバーガー";
            
            // --- ここからが修正箇所 ---
            const vegetables = ['lettuce', 'tomato', 'pickles', 'onion', 'avocado'];
            const uniqueVegetablesInBurger = new Set(middle.filter(ing => vegetables.includes(ing)));
            const isMeatFree = !h('patty') && !h('bacon') && !h('egg');

            // 条件: 肉/卵なし かつ 野菜の種類が3つ以上
            if (isMeatFree && uniqueVegetablesInBurger.size >= 3) {
                return "ベジタブルガーデンサンド";
            }
            // --- ここまで ---
            
            if (middle.length === 1) { const ingredientName = this.data.ingredients[middle[0]].name; return `シンプル${ingredientName}バーガー`; }
            if (middle.length === 2 && middle[0] === middle[1]) { const ingredientName = this.data.ingredients[middle[0]].name; return `ダブル${ingredientName}バーガー`; }
            let prefix = uniqueMiddle.size >= 4 ? '満腹' : '';
            if (h('patty') && h('bacon') && h('egg')) return `${prefix}ぜんぶのせDXバーガー`;
            if (c('patty') >= 2) return `${prefix}ダブルミートバーガー`;
            if (c('cheese') >= 2 || (h('patty') && h('cheese') && h('bacon'))) return `${prefix}こってりチーズバーガー`;
            if (h('avocado') && h('tomato') && h('lettuce')) return `${prefix}けんこうアボカドバーガー`;
            if (h('bacon')) return `${prefix}ジューシーベーコンバーガー`;
            if (h('egg')) return `${prefix}まんぷくエッグバーガー`;
            const a = ["わくわく", "にこにこ", "まんぷく", "おいしい", "スペシャル", "しあわせの"];
            const n = ["バーガー", "サンド"];
            const randomAdjective = prefix === '満腹' ? a.filter(adj => adj !== 'まんぷく')[Math.floor(Math.random() * (a.length - 1))] : a[Math.floor(Math.random() * a.length)];
            const randomNoun = n[Math.floor(Math.random() * n.length)];
            return `${prefix}${randomAdjective}${randomNoun}`;
        },
        
        startGrillMinigame(id) {
    this.state.minigameActive = true; const { minigameDock, grillMinigame, grillCursor, grillStopButton, grillItemImage } = this.elements;
    const itemData = this.data.ingredients[id];

    // 食材画像とタイトルを設定
    grillItemImage.src = this.config.IMAGE_PATH + itemData.image;
    const titleElement = grillMinigame.querySelector('h3');
    titleElement.textContent = `${itemData.name}を焼こう！`;

    minigameDock.style.display = 'block'; grillMinigame.style.display = 'block'; this.playSound(this.sounds.grill, true);
    let animation; grillCursor.style.animation = 'none';
    requestAnimationFrame(() => {
        requestAnimationFrame(() => { animation = grillCursor.animate([{ left: '0%' }, { left: `calc(100% - 8px)` }], { duration: 1000, direction: 'alternate', iterations: Infinity, easing: 'linear' }); });
    });
    const stopHandler = () => {
        grillStopButton.onclick = null; // ダブルクリックを防止
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

        // 結果テキストを表示
        if (resultText) {
            this.playSound(this.sounds.minigameSuccess); // 効果音を新しいものに変更
            const textEl = document.createElement('div');
            textEl.textContent = resultText;
            textEl.className = `minigame-result-text ${quality}`;
            // grillMinigame ではなく minigameDock に追加
            minigameDock.appendChild(textEl);
        }

        // 少し待ってからミニゲームを閉じる
        setTimeout(() => {
            this.addIngredient(id, quality);
            minigameDock.style.display = 'none'; grillMinigame.style.display = 'none';
            grillItemImage.src = ""; // 画像をリセット
            if (animation) animation.cancel();

            // 追加したテキスト要素を削除
            // grillMinigame ではなく minigameDock から探して削除
            const existingTextEl = minigameDock.querySelector('.minigame-result-text');
            if (existingTextEl) {
                existingTextEl.remove();
            }

            this.state.minigameActive = false;
        }, 1200); // テキスト表示のために少し待つ
    };
    grillStopButton.onclick = stopHandler;
},
       startPourMinigame(id) { this.state.minigameActive = true; const { minigameDock, pourMinigame, pourLiquid, pourButton } = this.elements; minigameDock.style.display = 'block'; pourMinigame.style.display = 'block'; pourLiquid.style.height = '0%'; pourLiquid.style.backgroundColor = id === 'coke' ? '#3e2723' : id === 'orange-juice' ? '#ff9800' : '#e3f2fd'; let interval; const startPour = () => { this.playSound(this.sounds.pour, true); interval = setInterval(() => { pourLiquid.style.height = `${Math.min(100, parseFloat(pourLiquid.style.height) + 1)}%`; }, 20); }; const stopPour = () => { this.sounds.pour.pause(); clearInterval(interval); const height = parseFloat(pourLiquid.style.height); let quality = 'failed'; if (height >= 75 && height <= 85) quality = 'excellent'; else if (height >= 65 && height <= 95) quality = 'good'; else if (height >= 50) quality = 'normal'; this.addDrink(id, quality); minigameDock.style.display = 'none'; pourMinigame.style.display = 'none'; this.state.minigameActive = false; pourButton.removeEventListener('mousedown', startPour); pourButton.removeEventListener('mouseup', stopPour); pourButton.removeEventListener('mouseleave', stopPour); }; pourButton.addEventListener('mousedown', startPour); pourButton.addEventListener('mouseup', stopPour); pourButton.addEventListener('mouseleave', stopPour); },
        showCompletedBurger(burgerName, earnings) { const { completedBurgerModal } = this.elements; completedBurgerModal.innerHTML = ''; const container = document.createElement('div'); container.className = 'completed-burger-container'; const visualsContainer = document.createElement('div'); visualsContainer.className = 'completed-visuals'; const imageContainer = document.createElement('div'); imageContainer.className = 'burger-image-container'; let currentHeight = 0; this.state.currentOrder.burger.forEach((id, index) => { const img = document.createElement('img'); img.src = this.config.IMAGE_PATH + this.data.ingredients[id].image; img.className = 'completed-ingredient-image'; img.style.bottom = `${currentHeight}px`; img.style.zIndex = index; img.style.animationDelay = `${index * 0.15}s`; imageContainer.appendChild(img); currentHeight += this.data.ingredients[id].height; }); visualsContainer.appendChild(imageContainer); if (this.state.currentOrder.drink) { const drinkImg = document.createElement('img'); drinkImg.src = this.config.IMAGE_PATH + this.data.drinks[this.state.currentOrder.drink].image; drinkImg.className = 'completed-drink-image'; visualsContainer.appendChild(drinkImg); } let finalBurgerName = burgerName; if (this.state.playerSelection.drink) { const drinkData = this.data.drinks[this.state.playerSelection.drink.id]; const qualityName = drinkData.qualityNames[this.state.playerSelection.drink.quality]; finalBurgerName += ` + ${qualityName || drinkData.name}`; } const nameEl = document.createElement('div'); nameEl.className = 'burger-name'; nameEl.textContent = finalBurgerName; const priceEl = document.createElement('div'); priceEl.className = 'burger-price'; priceEl.textContent = `${earnings}円で売れました！`; container.appendChild(visualsContainer); container.appendChild(nameEl); container.appendChild(priceEl); completedBurgerModal.appendChild(container); completedBurgerModal.style.display = 'flex'; setTimeout(() => { completedBurgerModal.style.display = 'none'; this.resetForNextCustomer(); }, 3500); },
        resetForNextCustomer() { this.state.currentOrder = { burger: [], drink: null }; this.state.playerSelection = { burger: [], drink: null }; this.elements.customerImage.classList.remove('visible'); this.state.currentCustomer = null; this.newCustomer(); },
        showMoneyPopup(amount) { const p = document.createElement('div'); p.textContent = `${amount > 0 ? '+' : ''}${amount}円`; p.className = `money-popup ${amount > 0 ? 'plus' : 'minus'}`; this.elements.statusBar.appendChild(p); p.addEventListener('animationend', () => p.remove()); },
        toggleSound() { 
            const isMuted = this.sounds.bgm.muted; 
            for (const key in this.sounds) { this.sounds[key].muted = !isMuted; } 
            
            // 更新されたボタンのUIロジック
            const btn = this.elements.soundToggleButton;
            if (isMuted) {
                // Now unmuted
                btn.classList.remove('sound-off');
                btn.classList.add('sound-on');
                btn.textContent = "音: オン";
            } else {
                // Now muted
                btn.classList.remove('sound-on');
                btn.classList.add('sound-off');
                btn.textContent = "音: オフ";
            }
        },
        toggleSettingsPanel() {
            this.elements.settingsPanel.classList.toggle('open');
        },
        changeZoom(delta) {
            this.state.zoom = Math.max(0.5, Math.min(1.5, this.state.zoom + delta));
            this.elements.fixedContainer.style.transform = `scale(${this.state.zoom})`;
        },
        toggleFullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable fullscreen: ${err.message}`);
                });
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        },
        playSound(sfx, loop = false) { sfx.currentTime = 0; sfx.loop = loop; sfx.play().catch(e => {}); },
        setCustomerMessage(text) { this.elements.customerMessage.textContent = text; },
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

            // キーボード操作
            this.keydownHandler = e => this.catchGame.keys[e.key] = true; this.keyupHandler = e => this.catchGame.keys[e.key] = false;
            document.addEventListener('keydown', this.keydownHandler); document.addEventListener('keyup', this.keyupHandler);

            // マウス操作
            this.catchGame.mousemoveHandler = e => {
                if (!this.catchGame.canvas) return;
                const rect = this.catchGame.canvas.getBoundingClientRect();
                let mouseX = e.clientX - rect.left;
                // バスケットの中心がマウスの位置に来るように調整
                this.catchGame.basket.x = mouseX - this.catchGame.basket.width / 2;
                // バスケットがcanvasの範囲外に出ないように制限
                if (this.catchGame.basket.x < 0) this.catchGame.basket.x = 0;
                if (this.catchGame.basket.x > this.catchGame.canvas.width - this.catchGame.basket.width) {
                    this.catchGame.basket.x = this.catchGame.canvas.width - this.catchGame.basket.width;
                }
            };
            this.catchGame.canvas.addEventListener('mousemove', this.catchGame.mousemoveHandler);

            this.updateRealtimeScore();
            let timeLeft = 15; // 制限時間を15秒に変更
            this.elements.minigameTimer.textContent = timeLeft;
            this.catchGame.timerInterval = setInterval(() => {
                timeLeft--; this.elements.minigameTimer.textContent = timeLeft;
                if (timeLeft <= 0) { clearInterval(this.catchGame.timerInterval); this.endCatchMinigame(); }
            }, 1000);

            // 各食材20個ずつのリストを作成してシャッフル
            const itemsToSpawn = [];
            this.state.restock.selection.forEach(id => {
                for (let i = 0; i < 20; i++) {
                    itemsToSpawn.push(id);
                }
            });
            for (let i = itemsToSpawn.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [itemsToSpawn[i], itemsToSpawn[j]] = [itemsToSpawn[j], itemsToSpawn[i]];
            }

            // 準備したリストからアイテムをスポーンさせる
            this.catchGame.interval = setInterval(() => {
                if (itemsToSpawn.length > 0) {
                    this.spawnCatchItem(itemsToSpawn.pop());
                } else {
                    clearInterval(this.catchGame.interval);
                }
            }, 250); // 3種類 * 20個 = 60個。 60 * 0.25s = 15秒で全て落ちる計算

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
                // " x " を削除し、スペースのみに変更
                div.innerHTML = `<img src="${this.config.IMAGE_PATH + itemData.image}"> ${count}`;
                scoreEl.appendChild(div);
            }
        },
        endCatchMinigame() {
            cancelAnimationFrame(this.catchGame.animationFrameId); clearInterval(this.catchGame.interval); clearInterval(this.catchGame.timerInterval);
            if (this.keydownHandler) document.removeEventListener('keydown', this.keydownHandler);
            if (this.keyupHandler) document.removeEventListener('keyup', this.keyupHandler);
            if (this.catchGame.mousemoveHandler) {
                this.catchGame.canvas.removeEventListener('mousemove', this.catchGame.mousemoveHandler);
            }
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
                // " x " を削除し、スペースのみに変更
                itemDiv.innerHTML = `<p>${itemData.name} ${count}</p><div class="result-images">${imagesHTML}</div>`; resultEl.appendChild(itemDiv);
            }
        },
        applyRestockResults() {
            const allItems = { ...this.data.ingredients, ...this.data.drinks };
            for (const id in this.state.restock.caughtItems) {
                const count = this.state.restock.caughtItems[id];
                if (count > 0) {
                    const currentStock = allItems[id].stock;
                    // 上限(MAX_STOCK)を超えないように新しい在庫数を計算
                    const newStock = Math.min(currentStock + count, this.config.MAX_STOCK);
                    // 実際に加算された量を計算
                    const addedAmount = newStock - currentStock;

                    if (addedAmount > 0) {
                        allItems[id].stock = newStock;
                        const button = this.elements.ingredientsPanel.querySelector(`[data-id="${id}"]`) || this.elements.drinksPanel.querySelector(`[data-id="${id}"]`);
                        if (button) {
                            const popup = document.createElement('span');
                            popup.className = 'stock-popup-animation';
                            // ポップアップには実際に加算された量を表示
                            popup.textContent = `+${addedAmount}`;
                            button.style.position = 'relative';
                            button.appendChild(popup);
                            popup.addEventListener('animationend', () => popup.remove());
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
        cancelRestockFlow() {
            this.elements.restockGameModal.style.display = 'none';
            this.state.minigameActive = false;
        },
        abortCatchMinigame() {
            if (confirm("ゲームを中断しますか？支払ったお金は戻りません。")) {
                cancelAnimationFrame(this.catchGame.animationFrameId);
                clearInterval(this.catchGame.interval);
                if (this.catchGame.timerInterval) { clearInterval(this.catchGame.timerInterval); }
                if(this.keydownHandler) document.removeEventListener('keydown', this.keydownHandler);
                if(this.keyupHandler) document.removeEventListener('keyup', this.keyupHandler);
                if (this.catchGame.mousemoveHandler) {
                    this.catchGame.canvas.removeEventListener('mousemove', this.catchGame.mousemoveHandler);
                }
                this.catchGame.keys = {};
                this.cancelRestockFlow();
            }
        },
    };
    hamburgerGame.init();
});