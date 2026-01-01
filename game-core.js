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
        maxStock: 20, // data.jsの初期冷蔵庫に合わせて20に変更推奨ですが、ロジックで上書きされるので10のままでも可
        purchasedItems: [],
        bgmIndex: 0,
        // --- ここから追加 ---
        day: 1,
        time: 600, // 10:00 = 60 * 10
        isShopOpen: false,
        gameTimer: null,
        dailyStats: {
            revenue: 0,
            expenses: 0,
            customers: 0,
            score: 0
        }

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
    }
};