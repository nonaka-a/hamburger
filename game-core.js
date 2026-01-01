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
        // --- 追加: 現在のランク ---
        currentRank: 0
        // -----------------------
    },
    // ここがランクの閾値データです
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
        
        // game-ui.jsのメソッド呼び出し
        if (this.initRankDisplay) {
            this.initRankDisplay();
        }
    }
};