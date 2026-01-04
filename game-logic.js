// --- START OF FILE game-logic.js ---

Object.assign(hamburgerGame, {
    startGame() {
        this.elements.titleScreen.style.display = 'none';
        this.elements.gameWrapper.style.display = 'flex';

        this.elements.shopButton.style.display = 'flex';
        this.elements.settingsIcon.style.display = 'flex';
        document.querySelector('#time-display-container').style.display = 'flex';

        if (this.state.currentRank >= 3 && this.elements.contestButton) {
            this.elements.contestButton.style.display = 'flex';
        } else if (this.elements.contestButton) {
            this.elements.contestButton.style.display = 'none';
        }

        this.sounds.bgm.play().catch(e => { });
        this.initializePanels();
        this.bindGameEvents();

        this.state.currentOrder = { burger: [], sides: [] }; 
        this.state.playerSelection = { burger: [], sides: [] }; 

        this.updateUI();
        this.startDay();
    },

    startDay() {
        this.state.time = 600; 
        this.state.isShopOpen = false;
        this.state.dailyStats = { revenue: 0, expenses: 0, customers: 0, score: 0 };
        this.updateTimeDisplay();

        this.showDayStart(() => {
            this.state.isShopOpen = true;
            this.newCustomer();

            if (this.state.gameTimer) clearInterval(this.state.gameTimer);
            this.state.gameTimer = setInterval(() => {
                if (this.state.minigameActive) return; 
                this.updateTime();
            }, 300);
        });
    },

    updateTime() {
        if (this.state.time < 1200) {
            this.state.time++;
            this.updateTimeDisplay();
        }

        if (this.state.time >= 1200) {
            this.tryEndDay();
        }
    },

    tryEndDay() {
        this.state.isShopOpen = false;

        if (this.state.currentCustomer) {
            return;
        }

        this.endDay();
    },

    endDay() {
        this.state.isShopOpen = false;
        clearInterval(this.state.gameTimer);
        this.state.isAcceptingOrder = false;
        this.elements.customerImage.classList.remove('visible');
        this.setCustomerMessage('本日の営業は終了しました');

        this.saveGameData();

        setTimeout(() => {
            this.showDailyResult();
        }, 1500);
    },

    nextDay() {
        this.elements.dailyResultModal.style.display = 'none';

        this.state.day++;
        this.state.currentCustomer = null;
        this.state.playerSelection = { burger: [], sides: [] };
        this.state.currentOrder = { burger: [], sides: [] };
        this.updateUI();

        this.startDay();
    },

    handleItemClick(id, type) {
        if (!this.state.currentCustomer && !this.state.isShopOpen) return;
        if (!this.state.isAcceptingOrder || this.state.minigameActive) return;

        const grillableItems = ['patty', 'bacon', 'egg'];
        if (type === 'ingredient') {
            if (this.data.ingredients[id].stock <= 0) return;
            if (grillableItems.includes(id)) { this.startGrillMinigame(id); } else { this.addIngredient(id, 'normal'); }
        } else if (type === 'drink') {
            const drinkData = this.data.drinks[id];
            if (drinkData.stock <= 0) return;

            if (drinkData.minigame === 'pour') {
                this.startPourMinigame(id);
            } else {
                this.addDrink(id, 'normal');
            }
        }
    },

    newCustomer() {
        if (!this.state.isShopOpen) return; 
        this.setCustomerMessage('いらっしゃいませ！');
        this.state.isAcceptingOrder = false;
        setTimeout(() => {
            if (!this.state.isShopOpen) {
                this.tryEndDay();
                return;
            }

            const customerIndex = Math.floor(Math.random() * this.data.customers.length);
            const customerImageFile = this.data.customers[customerIndex];
            this.state.currentCustomer = customerImageFile;
            this.elements.customerImage.src = this.config.IMAGE_PATH + customerImageFile;
            this.elements.customerImage.classList.add('visible');
            this.generateOrder();
            this.updateUI();
            this.setCustomerMessage('これください！');
            this.state.isAcceptingOrder = true;
            this.playSound(this.sounds.order);
        }, 1500);
    },

    generateOrder() {
        const { middleIngredients, drinks } = this.data;
        const n = Math.floor(Math.random() * 4) + 1;
        const t = [];
        for (let i = 0; i < n; i++) { t.push(middleIngredients[Math.floor(Math.random() * middleIngredients.length)]); }
        this.state.currentOrder.burger = ['bottom-bun', ...t, 'top-bun'];
        
        this.state.currentOrder.sides = [];
        const currentRank = this.state.currentRank || 0;

        // 固定客の特例処理を先に記述し、return するかフラグ管理する
        if (this.state.currentCustomer === 'customer7.png') {
            // customer7: オレンジジュースは必ず注文
            this.state.currentOrder.sides = ['orange-juice'];

            // さらに解放状況に応じてポテトとソフトクリームを追加
            if (currentRank >= 1) {
                this.state.currentOrder.sides.push('potato');
            }
            if (currentRank >= 2) {
                this.state.currentOrder.sides.push('soft-cream');
            }
            return;
        } else if (this.state.currentCustomer === 'customer6.png') {
            this.state.currentOrder.sides = ['coke'];
            return;
        }

        // 通常客のランダム生成ロジック (既存コード)
        const drinkOptions = ['coke', 'orange-juice', 'calpis'].filter(id => {
            const d = drinks[id];
            return !d.reqRank || currentRank >= d.reqRank;
        });
        const otherSideOptions = ['potato', 'soft-cream'].filter(id => {
            const d = drinks[id];
            return !d.reqRank || currentRank >= d.reqRank;
        });

        if (drinkOptions.length > 0 && Math.random() < 0.7) {
            const drinkId = drinkOptions[Math.floor(Math.random() * drinkOptions.length)];
            this.state.currentOrder.sides.push(drinkId);
        }

        otherSideOptions.forEach(id => {
            if (Math.random() < 0.3) {
                this.state.currentOrder.sides.push(id);
            }
        });
    },

    serveOrder() {
        if (!this.state.isAcceptingOrder || this.state.playerSelection.burger.length === 0) return;
        this.state.isAcceptingOrder = false;

        const bC = JSON.stringify(this.state.playerSelection.burger.map(i => i.id).sort()) === JSON.stringify([...this.state.currentOrder.burger].sort());
        
        const orderSides = [...this.state.currentOrder.sides].sort();
        const playerSides = this.state.playerSelection.sides.map(s => s.id).sort();
        const dC = JSON.stringify(orderSides) === JSON.stringify(playerSides);

        if (bC && dC) {
            this.playSound(this.sounds.success);

            let earnings = 0;
            let baseScore = 0;
            let bonusScore = 0;

            const hasPan = this.state.purchasedItems.includes('premium_pan');
            const hasServer = this.state.purchasedItems.includes('juice_server');
            const hasKnife = this.state.purchasedItems.includes('vegetable_knife');
            const hasBunsMachine = this.state.purchasedItems.includes('buns_machine');
            const hasGlasses = this.state.purchasedItems.includes('connoisseur_glasses');
            const hasSauce = this.state.purchasedItems.includes('secret_sauce');

            this.state.playerSelection.burger.forEach(item => {
                const data = this.data.ingredients[item.id];
                const multiplier = data.qualityMultipliers ? data.qualityMultipliers[item.quality] : 1;
                earnings += data.price * multiplier;

                let itemScore = 10;
                if (item.quality === 'excellent') bonusScore += 20;
                else if (item.quality === 'good') bonusScore += 10;
                else if (item.quality === 'bad') bonusScore -= 10;

                if (hasPan && ['patty', 'bacon', 'egg'].includes(item.id)) itemScore += 20;
                if (hasKnife && ['lettuce', 'tomato', 'pickles', 'onion', 'avocado'].includes(item.id)) itemScore += 20;
                if (hasBunsMachine && ['top-bun', 'bottom-bun'].includes(item.id)) itemScore += 10;
                if (hasGlasses) itemScore += 10;

                baseScore += itemScore;
            });

            this.state.playerSelection.sides.forEach(item => {
                const data = this.data.drinks[item.id];
                const multiplier = data.qualityMultipliers ? (data.qualityMultipliers[item.quality] || 1) : 1;
                earnings += data.price * multiplier;

                let itemScore = 10;
                if (item.quality === 'excellent') bonusScore += 20;
                else if (item.quality === 'good') bonusScore += 10;

                if (hasServer && ['coke', 'orange-juice', 'calpis'].includes(item.id)) itemScore += 20;
                if (hasGlasses) itemScore += 10;

                baseScore += itemScore;
            });

            if (hasSauce) baseScore += 50;

            const finalEarnings = Math.round(earnings);
            this.state.money += finalEarnings;
            this.state.dailyStats.revenue += finalEarnings;
            this.state.dailyStats.customers++;
            const earnedScore = baseScore + bonusScore;
            this.state.dailyStats.score += earnedScore;
            this.state.totalRankScore += earnedScore;
            this.updateRankDisplay();

            const bN = this.getBurgerName(this.state.currentOrder.burger);
            this.showMoneyPopup(finalEarnings);
            this.setCustomerMessage(`「${bN}」おいしい！`);
            this.showCompletedBurger(bN, finalEarnings, earnedScore, bonusScore);
        } else {
            this.playSound(this.sounds.failure);
            this.setCustomerMessage('あれ、ちがうみたい…');
            setTimeout(() => {
                if (!this.state.isShopOpen) return;
                this.state.playerSelection.burger = [];
                this.state.playerSelection.sides = [];
                this.updateUI();
                this.setCustomerMessage('もう一度お願い！');
                this.playSound(this.sounds.order);
                this.state.isAcceptingOrder = true;
            }, 2000);
        }
        this.updateUI();
    },

    addIngredient(id, quality) { if (!this.state.isAcceptingOrder) return; this.playSound(this.sounds.select); this.data.ingredients[id].stock--; this.state.playerSelection.burger.push({ id, quality }); this.updateUI(); },

    addDrink(id, quality) { 
        if (!this.state.isAcceptingOrder) return; 
        
        if (quality === 'failed') { 
            this.playSound(this.sounds.failure); 
            this.updateUI(); 
            return; 
        } 

        const existingIndex = this.state.playerSelection.sides.findIndex(s => s.id === id);
        
        if (existingIndex > -1) {
            // ミニゲームなしアイテム(ポテト等)はトグル動作でキャンセル
            if (this.data.drinks[id].minigame === 'none') {
                this.data.drinks[id].stock++;
                this.state.playerSelection.sides.splice(existingIndex, 1);
                this.playSound(this.sounds.select);
            } else {
                // ミニゲームありアイテム(ジュース)は品質上書き
                this.state.playerSelection.sides[existingIndex].quality = quality;
                this.playSound(this.sounds.select);
            }
        } else {
            // 新規追加
            this.state.playerSelection.sides.push({ id, quality });
            this.data.drinks[id].stock--;
            this.playSound(this.sounds.select);
        }
        
        this.updateUI(); 
    },

    undoLastIngredient() { if (this.state.playerSelection.burger.length === 0) return; this.playSound(this.sounds.select); const removed = this.state.playerSelection.burger.pop(); if (removed && this.data.ingredients[removed.id].stock !== Infinity) { this.data.ingredients[removed.id].stock++; } this.updateUI(); },

    trashOrder(silent = false) {
        if (this.state.playerSelection.burger.length === 0 && this.state.playerSelection.sides.length === 0) return;
        if (!silent) this.playSound(this.sounds.failure);

        this.state.playerSelection.sides.forEach(item => {
            if (this.data.drinks[item.id].stock < this.state.maxStock) {
                this.data.drinks[item.id].stock++;
            }
        });
        this.state.playerSelection.sides = [];

        this.state.playerSelection.burger.forEach(item => {
            if (this.data.ingredients[item.id].stock !== Infinity && this.data.ingredients[item.id].stock < this.state.maxStock) {
                this.data.ingredients[item.id].stock++;
            }
        });
        this.state.playerSelection.burger = [];
        this.updateUI();
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

    resetForNextCustomer() {
        this.state.currentOrder = { burger: [], sides: [] };
        this.state.playerSelection = { burger: [], sides: [] };
        this.elements.customerImage.classList.remove('visible');
        this.state.currentCustomer = null;

        if (!this.state.isShopOpen) {
            this.endDay();
            return;
        }

        this.newCustomer();
    },

    buyItem(item) {
        if (this.state.money < item.price) return;

        this.state.money -= item.price;
        this.state.dailyStats.expenses += item.price;
        this.state.totalRankScore += 500;
        this.updateRankDisplay();
        this.state.purchasedItems.push(item.id);
        this.showMoneyPopup(-item.price);
        this.updateUI();
        this.playSound(this.sounds.success);
        this.saveGameData();
        if (item.type === 'stock') {
            this.state.maxStock = item.value;
        } else if (item.type === 'unlock_bgm') {
            this.elements.jukeboxObject.style.display = 'block';

            const overlay = document.createElement('div');
            Object.assign(overlay.style, {
                position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
                backgroundColor: 'rgba(0,0,0,0.5)', zIndex: '4999',
                borderRadius: '30px'
            });
            this.elements.fixedContainer.appendChild(overlay);

            const notice = document.createElement('div');
            Object.assign(notice.style, {
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: '700px', backgroundColor: '#fff',
                border: '10px solid var(--dark-brown)', borderRadius: '40px',
                padding: '60px', zIndex: '5000', textAlign: 'center',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px'
            });

            const title = document.createElement('h3');
            title.textContent = 'お買い上げありがとうございます！';
            Object.assign(title.style, {
                margin: '0', color: 'var(--main-orange)',
                fontSize: '3em', fontWeight: '800'
            });

            const message = document.createElement('p');
            message.innerHTML = 'ジュークボックスが届きました。<br>クリックして曲を変えてみよう！';
            Object.assign(message.style, {
                fontSize: '2em', margin: '0', lineHeight: '1.6',
                fontWeight: 'bold', color: 'var(--dark-brown)'
            });

            const btn = document.createElement('button');
            btn.textContent = 'OK';
            Object.assign(btn.style, {
                padding: '20px 80px', fontSize: '2.2em', fontWeight: '800',
                background: 'var(--main-green)', color: 'white',
                border: '4px solid var(--dark-brown)', borderRadius: '20px',
                cursor: 'pointer', boxShadow: '0 8px 0 var(--dark-brown)'
            });

            btn.onclick = () => {
                notice.remove();
                overlay.remove();
            };

            btn.onmousedown = () => {
                btn.style.transform = 'translateY(4px)';
                btn.style.boxShadow = '0 4px 0 var(--dark-brown)';
            };
            btn.onmouseup = () => {
                btn.style.transform = 'translateY(0)';
                btn.style.boxShadow = '0 8px 0 var(--dark-brown)';
            };
            btn.onmouseleave = () => {
                btn.style.transform = 'translateY(0)';
                btn.style.boxShadow = '0 8px 0 var(--dark-brown)';
            };

            notice.appendChild(title);
            notice.appendChild(message);
            notice.appendChild(btn);
            this.elements.fixedContainer.appendChild(notice);
        }
        this.renderShopItems();
    }
});