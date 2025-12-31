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
        bgmIndex: 0
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