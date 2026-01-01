const hamburgerGame = {
    state: { 
        money: 500, 
        currentCustomer: null, 
        currentOrder: { burger: [], drink: null }, 
        playerSelection: { burger: [], drink: null }, 
        isAcceptingOrder: false, 
        minigameActive: false, 
        restock: { selection: [], caughtItems: {} }, 
        zoom: 1.0,
        maxStock: 10,
        purchasedItems: [],
        bgmIndex: 0,
        day: 1,
        time: 600, 
        isShopOpen: false,
        gameTimer: null,
        dailyStats: {
            revenue: 0,
            expenses: 0,
            customers: 0,
            score: 0
        },
        totalRankScore: 0,
        currentRank: 0
    },
    rankData: {
        thresholds: [1000, 2500, 4000, 6000, 10000]
    },
    config: { IMAGE_PATH: 'images/', SOUND_PATH: 'sound/', },
    elements: {},
    sounds: {},
    data: gameData,
    catchGame: {
        ctx: null, canvas: null, basket: {}, items: [], interval: null, keys: {}, animationFrameId: null, imageCache: {}, timerInterval: null
    },

    init() { 
        this.cacheElements(); 
        this.loadSounds(); 
        this.bindGlobalEvents(); 
        this.bindResizeEvent();
        
        // 星の生成
        if (this.initRankDisplay) {
            this.initRankDisplay();
        }

        // セーブデータのロード
        this.loadGameData();
        
        // ランク表示更新（ロードしたスコアを反映）
        if (this.updateRankDisplay) {
            this.updateRankDisplay();
        }
    },

    saveGameData() {
        const saveData = {
            money: this.state.money,
            day: this.state.day,
            maxStock: this.state.maxStock,
            purchasedItems: this.state.purchasedItems,
            totalRankScore: this.state.totalRankScore,
            currentRank: this.state.currentRank,
            ingredientsStock: {},
            drinksStock: {}
        };

        for (const id in this.data.ingredients) {
            saveData.ingredientsStock[id] = this.data.ingredients[id].stock;
        }
        for (const id in this.data.drinks) {
            saveData.drinksStock[id] = this.data.drinks[id].stock;
        }

        try {
            localStorage.setItem('hamburgerGameSave', JSON.stringify(saveData));
        } catch (e) {
            console.error("Save Failed", e);
        }
    },

    loadGameData() {
        const savedJson = localStorage.getItem('hamburgerGameSave');
        if (savedJson) {
            try {
                const savedData = JSON.parse(savedJson);
                
                if (savedData.money !== undefined) this.state.money = savedData.money;
                if (savedData.day !== undefined) this.state.day = savedData.day;
                if (savedData.maxStock !== undefined) this.state.maxStock = savedData.maxStock;
                if (savedData.purchasedItems !== undefined) this.state.purchasedItems = savedData.purchasedItems;
                if (savedData.totalRankScore !== undefined) this.state.totalRankScore = savedData.totalRankScore;
                if (savedData.currentRank !== undefined) this.state.currentRank = savedData.currentRank;

                if (savedData.ingredientsStock) {
                    for (const id in savedData.ingredientsStock) {
                        if (this.data.ingredients[id]) {
                            this.data.ingredients[id].stock = savedData.ingredientsStock[id];
                        }
                    }
                }
                if (savedData.drinksStock) {
                    for (const id in savedData.drinksStock) {
                        if (this.data.drinks[id]) {
                            this.data.drinks[id].stock = savedData.drinksStock[id];
                        }
                    }
                }
                
                if (this.state.purchasedItems.includes('jukebox')) {
                    const jukebox = document.querySelector('#jukebox-object');
                    if (jukebox) jukebox.style.display = 'block';
                }

            } catch (e) {
                console.error("Load Failed", e);
            }
        }
    },

    resetGameData() {
        localStorage.removeItem('hamburgerGameSave');
        location.reload();
    }
};