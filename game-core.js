const hamburgerGame = {
    state: { money: 500, currentCustomer: null, currentOrder: { burger: [], drink: null }, playerSelection: { burger: [], drink: null }, isAcceptingOrder: false, minigameActive: false, restock: { selection: [], caughtItems: {} }, zoom: 1.0 },
    config: { MAX_STOCK: 10, IMAGE_PATH: 'images/', SOUND_PATH: 'sound/', },
    elements: {},
    sounds: {},
    data: gameData,
    catchGame: {
        ctx: null, canvas: null, basket: {}, items: [], interval: null, keys: {}, animationFrameId: null, imageCache: {}, timerInterval: null
    },

    // 初期化メソッド（全てのファイルが読み込まれた後に実行される）
    init() { 
        this.cacheElements(); 
        this.loadSounds(); 
        this.bindGlobalEvents(); 
        this.bindResizeEvent();
    }
};