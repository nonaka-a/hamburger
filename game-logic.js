Object.assign(hamburgerGame, {
    startGame() { this.elements.titleScreen.style.display = 'none'; this.elements.gameWrapper.style.display = 'flex'; this.sounds.bgm.play().catch(e => {}); this.initializePanels(); this.bindGameEvents(); this.updateUI(); this.newCustomer(); },

    handleItemClick(id, type) { if (!this.state.isAcceptingOrder || this.state.minigameActive) return; const grillableItems = ['patty', 'bacon', 'egg']; if (type === 'ingredient') { if (this.data.ingredients[id].stock <= 0) return; if (grillableItems.includes(id)) { this.startGrillMinigame(id); } else { this.addIngredient(id, 'normal'); } } else if (type === 'drink') { if (this.data.drinks[id].stock <= 0) return; this.startPourMinigame(id); } },

    newCustomer() { this.setCustomerMessage('いらっしゃいませ！'); this.state.isAcceptingOrder = false; setTimeout(() => { const customerIndex = Math.floor(Math.random() * this.data.customers.length); const customerImageFile = this.data.customers[customerIndex]; this.state.currentCustomer = customerImageFile; this.elements.customerImage.src = this.config.IMAGE_PATH + customerImageFile; this.elements.customerImage.classList.add('visible'); this.generateOrder(); this.updateUI(); this.setCustomerMessage('これください！'); this.state.isAcceptingOrder = true; this.playSound(this.sounds.order); }, 1500); },

    generateOrder() { const { middleIngredients, drinks } = this.data; const n = Math.floor(Math.random() * 4) + 1; const t = []; for (let i = 0; i < n; i++) { t.push(middleIngredients[Math.floor(Math.random() * middleIngredients.length)]); } this.state.currentOrder.burger = ['bottom-bun', ...t, 'top-bun']; this.state.currentOrder.drink = null; if (this.state.currentCustomer === 'customer7.png') { this.state.currentOrder.drink = 'orange-juice'; } else if (this.state.currentCustomer === 'customer6.png') { this.state.currentOrder.drink = 'coke'; } else { if (Math.random() < 0.5) { const availableDrinks = Object.keys(drinks).filter(id => drinks[id].stock > 0); if (availableDrinks.length > 0) { const drinkId = availableDrinks[Math.floor(Math.random() * availableDrinks.length)]; this.state.currentOrder.drink = drinkId; } } } },

    serveOrder() { if (!this.state.isAcceptingOrder || this.state.playerSelection.burger.length === 0) return; this.state.isAcceptingOrder = false; const bC = JSON.stringify(this.state.playerSelection.burger.map(i => i.id).sort()) === JSON.stringify([...this.state.currentOrder.burger].sort()); const dC = (this.state.playerSelection.drink ? this.state.playerSelection.drink.id : null) === this.state.currentOrder.drink; if (bC && dC) { this.playSound(this.sounds.success); let earnings = 0; this.state.playerSelection.burger.forEach(item => { const data = this.data.ingredients[item.id]; const multiplier = data.qualityMultipliers ? data.qualityMultipliers[item.quality] : 1; earnings += data.price * multiplier; }); if (this.state.playerSelection.drink) { const item = this.state.playerSelection.drink; const data = this.data.drinks[item.id]; const multiplier = data.qualityMultipliers ? data.qualityMultipliers[item.quality] : 1; earnings += data.price * multiplier; } const finalEarnings = Math.round(earnings); this.state.money += finalEarnings; const bN = this.getBurgerName(this.state.currentOrder.burger); this.showMoneyPopup(finalEarnings); this.setCustomerMessage(`「${bN}」おいしい！`); this.showCompletedBurger(bN, finalEarnings); } else { this.playSound(this.sounds.failure); this.setCustomerMessage('あれ、ちがうみたい…'); setTimeout(() => { this.state.playerSelection.burger = []; this.state.playerSelection.drink = null; this.updateUI(); this.setCustomerMessage('もう一度お願い！'); this.playSound(this.sounds.order); this.state.isAcceptingOrder = true; }, 2000); } this.updateUI(); },

    addIngredient(id, quality) { if (!this.state.isAcceptingOrder) return; this.playSound(this.sounds.select); this.data.ingredients[id].stock--; this.state.playerSelection.burger.push({ id, quality }); this.updateUI(); },

    addDrink(id, quality) { if (!this.state.isAcceptingOrder) return; if (quality === 'failed') { this.state.playerSelection.drink = null; this.playSound(this.sounds.failure); this.updateUI(); return; } if (this.state.playerSelection.drink) { this.data.drinks[this.state.playerSelection.drink.id].stock++; } this.state.playerSelection.drink = { id, quality }; this.data.drinks[id].stock--; this.playSound(this.sounds.select); this.updateUI(); },

    undoLastIngredient() { if (this.state.playerSelection.burger.length === 0) return; this.playSound(this.sounds.select); const removed = this.state.playerSelection.burger.pop(); if (removed && this.data.ingredients[removed.id].stock !== Infinity) { this.data.ingredients[removed.id].stock++; } this.updateUI(); },

    trashOrder(silent = false) { if (this.state.playerSelection.burger.length === 0 && !this.state.playerSelection.drink) return; if (!silent) this.playSound(this.sounds.failure); if (this.state.playerSelection.drink) { const drinkId = this.state.playerSelection.drink.id; if (this.data.drinks[drinkId].stock < this.config.MAX_STOCK) { this.data.drinks[drinkId].stock++; } this.state.playerSelection.drink = null; } this.state.playerSelection.burger.forEach(item => { if (this.data.ingredients[item.id].stock !== Infinity && this.data.ingredients[item.id].stock < this.config.MAX_STOCK) { this.data.ingredients[item.id].stock++; } }); this.state.playerSelection.burger = []; this.updateUI(); },

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
        
        const vegetables = ['lettuce', 'tomato', 'pickles', 'onion', 'avocado'];
        const uniqueVegetablesInBurger = new Set(middle.filter(ing => vegetables.includes(ing)));
        const isMeatFree = !h('patty') && !h('bacon') && !h('egg');

        if (isMeatFree && uniqueVegetablesInBurger.size >= 3) { return "ベジタブルガーデンサンド"; }
        
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

    resetForNextCustomer() { this.state.currentOrder = { burger: [], drink: null }; this.state.playerSelection = { burger: [], drink: null }; this.elements.customerImage.classList.remove('visible'); this.state.currentCustomer = null; this.newCustomer(); }
});