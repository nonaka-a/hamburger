Object.assign(hamburgerGame, {
    startGame() { 
        this.elements.titleScreen.style.display = 'none'; 
        this.elements.gameWrapper.style.display = 'flex'; 
        
        // --- ゲーム開始時にUIを表示 ---
        this.elements.shopButton.style.display = 'flex';
        this.elements.settingsIcon.style.display = 'flex';
        document.querySelector('#time-display-container').style.display = 'flex';

        // コンテストボタンの表示制御（ランク3以上なら表示）
        if (this.state.currentRank >= 3 && this.elements.contestButton) {
             this.elements.contestButton.style.display = 'flex';
        } else if (this.elements.contestButton) {
             this.elements.contestButton.style.display = 'none';
        }
        // --------------------------------

        this.sounds.bgm.play().catch(e => {}); 
        this.initializePanels(); 
        this.bindGameEvents(); 
        
        this.updateUI(); 
        this.startDay(); 
    },

    startDay() {
        this.state.time = 600; // 10:00
        this.state.isShopOpen = false;
        this.state.dailyStats = { revenue: 0, expenses: 0, customers: 0, score: 0 };
        this.updateTimeDisplay();
        
        this.showDayStart(() => {
            this.state.isShopOpen = true;
            this.newCustomer();
            
            if (this.state.gameTimer) clearInterval(this.state.gameTimer);
            this.state.gameTimer = setInterval(() => {
                if (this.state.minigameActive) return; // ミニゲーム中は止めるが、営業中チェックは外す（閉店処理中でも時間は止めたくない場合）
                // ただし、閉店後は isShopOpen=false になるが、最後の客対応中は時計を止めたいので、
                // updateTime内で時間上限チェックをする方式に変更。
                
                this.updateTime();
            }, 300);
        });
    },

    updateTime() {
        // 20:00 (1200分) 未満なら進める
        if (this.state.time < 1200) {
            this.state.time++;
            this.updateTimeDisplay();
        }

        // 20:00になったら終了試行
        if (this.state.time >= 1200) { 
            this.tryEndDay();
        }
    },

    tryEndDay() {
        // 閉店時間になったので、新規客ストップフラグを立てる
        this.state.isShopOpen = false;

        // 接客中（オーダー受付中 または 提供待ち）ならまだ終了しない
        if (this.state.currentCustomer) {
            return; 
        }

        // 接客中でなければ終了処理へ
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
        this.state.playerSelection = { burger: [], drink: null };
        this.state.currentOrder = { burger: [], drink: null };
        this.updateUI();
        
        this.startDay();
    },

    handleItemClick(id, type) { 
        // 閉店時間過ぎても接客中なら操作可能にするため !this.state.isShopOpen のチェックは外すか、currentCustomerがいるなら許可する
        // ここでは「接客中(currentCustomerあり)ならOK」とする
        if (!this.state.currentCustomer && !this.state.isShopOpen) return; 
        if (!this.state.isAcceptingOrder || this.state.minigameActive) return; 

        const grillableItems = ['patty', 'bacon', 'egg']; 
        if (type === 'ingredient') { 
            if (this.data.ingredients[id].stock <= 0) return; 
            if (grillableItems.includes(id)) { this.startGrillMinigame(id); } else { this.addIngredient(id, 'normal'); } 
        } else if (type === 'drink') { 
            if (this.data.drinks[id].stock <= 0) return; 
            this.startPourMinigame(id); 
        } 
    },

    newCustomer() { 
        if (!this.state.isShopOpen) return; // 開店中のみ
        this.setCustomerMessage('いらっしゃいませ！'); 
        this.state.isAcceptingOrder = false; 
        setTimeout(() => { 
            // 待機中に閉店時間になった場合のガード
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

    generateOrder() { const { middleIngredients, drinks } = this.data; const n = Math.floor(Math.random() * 4) + 1; const t = []; for (let i = 0; i < n; i++) { t.push(middleIngredients[Math.floor(Math.random() * middleIngredients.length)]); } this.state.currentOrder.burger = ['bottom-bun', ...t, 'top-bun']; this.state.currentOrder.drink = null; if (this.state.currentCustomer === 'customer7.png') { this.state.currentOrder.drink = 'orange-juice'; } else if (this.state.currentCustomer === 'customer6.png') { this.state.currentOrder.drink = 'coke'; } else { if (Math.random() < 0.5) { const availableDrinks = Object.keys(drinks).filter(id => drinks[id].stock > 0); if (availableDrinks.length > 0) { const drinkId = availableDrinks[Math.floor(Math.random() * availableDrinks.length)]; this.state.currentOrder.drink = drinkId; } } } },

    serveOrder() { 
        if (!this.state.isAcceptingOrder || this.state.playerSelection.burger.length === 0) return; 
        this.state.isAcceptingOrder = false; 
        const bC = JSON.stringify(this.state.playerSelection.burger.map(i => i.id).sort()) === JSON.stringify([...this.state.currentOrder.burger].sort()); const dC = (this.state.playerSelection.drink ? this.state.playerSelection.drink.id : null) === this.state.currentOrder.drink; 
        
        if (bC && dC) { 
        this.playSound(this.sounds.success); 

        let earnings = 0; 
        let baseScore = 0;
        let bonusScore = 0;

        // アイテム所持判定
        const hasPan = this.state.purchasedItems.includes('premium_pan');
        const hasServer = this.state.purchasedItems.includes('juice_server');
        const hasKnife = this.state.purchasedItems.includes('vegetable_knife');
        const hasBunsMachine = this.state.purchasedItems.includes('buns_machine');
        const hasGlasses = this.state.purchasedItems.includes('connoisseur_glasses');
        const hasSauce = this.state.purchasedItems.includes('secret_sauce');

        // 定義データ取得（価格等はdata.jsを参照するが、ボーナス値はロジック内で固定またはdata.jsから取得）
        // ここではロジック内で処理します

        this.state.playerSelection.burger.forEach(item => { 
            const data = this.data.ingredients[item.id]; 
            const multiplier = data.qualityMultipliers ? data.qualityMultipliers[item.quality] : 1; 
            earnings += data.price * multiplier; 
            
            // 基本点
            let itemScore = 10;

            // 品質ボーナス
            if (item.quality === 'excellent') bonusScore += 20;
            else if (item.quality === 'good') bonusScore += 10;
            else if (item.quality === 'bad') bonusScore -= 10;

            // --- アイテム効果 ---
            
            // 1. フライパン効果 (焼き対象なら+20)
            if (hasPan && ['patty', 'bacon', 'egg'].includes(item.id)) {
                itemScore += 20;
            }

            // 2. 野菜包丁効果
            if (hasKnife && ['lettuce', 'tomato', 'pickles', 'onion', 'avocado'].includes(item.id)) {
                itemScore += 20;
            }

            // 3. バンズマシーン効果
            if (hasBunsMachine && ['top-bun', 'bottom-bun'].includes(item.id)) {
                itemScore += 10;
            }

            // 4. 目利きのめがね (すべての材料+10)
            if (hasGlasses) {
                itemScore += 10;
            }

            baseScore += itemScore;
        }); 

        if (this.state.playerSelection.drink) { 
            const item = this.state.playerSelection.drink; 
            const data = this.data.drinks[item.id]; 
            const multiplier = data.qualityMultipliers ? data.qualityMultipliers[item.quality] : 1; 
            earnings += data.price * multiplier; 
            
            let itemScore = 10;

            if (item.quality === 'excellent') bonusScore += 20;
            else if (item.quality === 'good') bonusScore += 10;

            // --- アイテム効果 ---

            // 1. ジュースサーバー効果
            if (hasServer) {
                itemScore += 20;
            }
            
            // 2. 目利きのめがね (ジュースも材料とみなすなら+10)
            // 「すべての材料」の解釈によりますが、ここでは食材全般として加算します
            if (hasGlasses) {
                itemScore += 10;
            }

            baseScore += itemScore;
        } 

        // --- 5. 秘伝のソース (常に+50) ---
        if (hasSauce) {
            baseScore += 50;
        }
        // -----------------------------

        const finalEarnings = Math.round(earnings); 
        this.state.money += finalEarnings;  

            this.state.dailyStats.revenue += finalEarnings;
            this.state.dailyStats.customers++;
            
            const earnedScore = baseScore + bonusScore;
            this.state.dailyStats.score += earnedScore;
            
            // --- ランクスコア加算と表示更新 ---
            this.state.totalRankScore += earnedScore;
            this.updateRankDisplay();
            // -----------------------------

            const bN = this.getBurgerName(this.state.currentOrder.burger); 
            this.showMoneyPopup(finalEarnings); 
            this.setCustomerMessage(`「${bN}」おいしい！`); 
            this.showCompletedBurger(bN, finalEarnings, earnedScore, bonusScore); 
        } else { 
            // ... (失敗時の処理) ...
            this.playSound(this.sounds.failure); 
            this.setCustomerMessage('あれ、ちがうみたい…'); 
            setTimeout(() => { 
                if (!this.state.isShopOpen) return;
                this.state.playerSelection.burger = []; 
                this.state.playerSelection.drink = null; 
                this.updateUI(); 
                this.setCustomerMessage('もう一度お願い！'); 
                this.playSound(this.sounds.order); 
                this.state.isAcceptingOrder = true; 
            }, 2000); 
        } 
        this.updateUI(); 
    },

    addIngredient(id, quality) { if (!this.state.isAcceptingOrder) return; this.playSound(this.sounds.select); this.data.ingredients[id].stock--; this.state.playerSelection.burger.push({ id, quality }); this.updateUI(); },

    addDrink(id, quality) { if (!this.state.isAcceptingOrder) return; if (quality === 'failed') { this.state.playerSelection.drink = null; this.playSound(this.sounds.failure); this.updateUI(); return; } if (this.state.playerSelection.drink) { this.data.drinks[this.state.playerSelection.drink.id].stock++; } this.state.playerSelection.drink = { id, quality }; this.data.drinks[id].stock--; this.playSound(this.sounds.select); this.updateUI(); },

    undoLastIngredient() { if (this.state.playerSelection.burger.length === 0) return; this.playSound(this.sounds.select); const removed = this.state.playerSelection.burger.pop(); if (removed && this.data.ingredients[removed.id].stock !== Infinity) { this.data.ingredients[removed.id].stock++; } this.updateUI(); },

    trashOrder(silent = false) { 
        if (this.state.playerSelection.burger.length === 0 && !this.state.playerSelection.drink) return;
        if (!silent) this.playSound(this.sounds.failure);
        
        if (this.state.playerSelection.drink) {
            const drinkId = this.state.playerSelection.drink.id;
            if (this.data.drinks[drinkId].stock < this.state.maxStock) { this.data.drinks[drinkId].stock++; }
            this.state.playerSelection.drink = null;
        }
        
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
        this.state.currentOrder = { burger: [], drink: null }; 
        this.state.playerSelection = { burger: [], drink: null }; 
        this.elements.customerImage.classList.remove('visible'); 
        this.state.currentCustomer = null; 
        
        // 修正: 閉店状態（isShopOpen=false）なら終了処理へ
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