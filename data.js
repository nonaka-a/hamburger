const gameData = {
    customers: [
        'customer1.png', 'customer2.png', 'customer3.png', 'customer4.png',
        'customer5.png', 'customer6.png', 'customer7.png'
    ],
    displayOrder: [
        'top-bun', 'patty', 'bacon', 'egg', 'cheese', 'lettuce', 'bottom-bun', 'tomato',
        'pickles', 'onion', 'avocado'
    ],
    ingredients: {
        'top-bun': { name: '上のバンズ', price: 10, purchasePrice: 0, image: 'top-bun.png', height: 60, stock: Infinity },
        'patty': { name: 'パティ', price: 80, purchasePrice: 40, image: 'patty.png', height: 48, stock: 5, qualityNames: { excellent: '極上レアパティ', good: '絶妙パティ', bad: '焦げパティ' }, qualityMultipliers: { excellent: 2.0, good: 1.5, bad: 0.5, normal: 1 } },
        'cheese': { name: 'チーズ', price: 30, purchasePrice: 15, image: 'cheese.png', height: 30, stock: 5 },
        'lettuce': { name: 'レタス', price: 20, purchasePrice: 10, image: 'lettuce.png', height: 30, stock: 5 },
        'tomato': { name: 'トマト', price: 20, purchasePrice: 10, image: 'tomato.png', height: 30, stock: 5 },
        'bacon': { name: 'ベーコン', price: 60, purchasePrice: 30, image: 'bacon.png', height: 15, stock: 5, qualityNames: { excellent: 'カリカリベーコン', good: '香ばしベーコン', bad: 'しなしなベーコン' }, qualityMultipliers: { excellent: 1.8, good: 1.3, bad: 0.6, normal: 1 } },
        'egg': { name: '目玉焼き', price: 50, purchasePrice: 25, image: 'egg.png', height: 25, stock: 5, qualityNames: { excellent: 'とろとろ半熟エッグ', good: 'いい感じの目玉焼き', bad: '固焼きエッグ' }, qualityMultipliers: { excellent: 1.8, good: 1.3, bad: 0.7, normal: 1 } },
        'pickles': { name: 'ピクルス', price: 15, purchasePrice: 5, image: 'pickles.png', height: 10, stock: 5 },
        'onion': { name: 'オニオン', price: 15, purchasePrice: 5, image: 'onion.png', height: 12, stock: 5 },
        'avocado': { name: 'アボカド', price: 70, purchasePrice: 35, image: 'avocado.png', height: 20, stock: 5 },
        'bottom-bun': { name: '下のバンズ', price: 10, purchasePrice: 0, image: 'bottom-bun.png', height: 40, stock: Infinity }
    },
    middleIngredients: [
        'patty', 'cheese', 'lettuce', 'tomato', 'bacon', 'egg', 'pickles', 'onion', 'avocado'
    ],
    drinks: {
        'coke': { name: 'コーラ', price: 150, purchasePrice: 50, image: 'coke.png', stock: 5, qualityNames: { excellent: '神業コーラ', good: 'なみなみコーラ', normal: 'ふつうのコーラ' }, qualityMultipliers: { excellent: 1.5, good: 1.2, normal: 1 }, minigame: 'pour' },
        'orange-juice': { name: 'オレンジジュース', price: 150, purchasePrice: 50, image: 'orange-juice.png', stock: 5, qualityNames: { excellent: '神業オレンジ', good: 'なみなみオレンジ', normal: 'ふつうのオレンジ' }, qualityMultipliers: { excellent: 1.5, good: 1.2, normal: 1 }, minigame: 'pour' },
        'calpis': { name: 'カルピス', price: 150, purchasePrice: 50, image: 'calpis.png', stock: 5, qualityNames: { excellent: '神業カルピス', good: 'なみなみカルピス', normal: 'ふつうのカルピス' }, qualityMultipliers: { excellent: 1.5, good: 1.2, normal: 1 }, minigame: 'pour' },
        'potato': { name: 'ポテト', price: 200, purchasePrice: 60, image: 'potato.png', stock: 5, reqRank: 1, minigame: 'none' },
        'soft-cream': { name: 'ソフトクリーム', price: 250, purchasePrice: 80, image: 'soft-cream.png', stock: 5, reqRank: 2, minigame: 'none' }
    },
    shopItems: [
        {
            id: 'fridge_1',
            name: 'ふつうの冷蔵庫',
            price: 2500,
            description: '在庫を20個までストック',
            image: 'fridge-level1.png',
            type: 'stock',
            value: 20
        },
        {
            id: 'fridge_2',
            name: '大きな冷蔵庫',
            price: 3000,
            description: '在庫を30個までストック',
            image: 'fridge-level2.png',
            type: 'stock',
            value: 30,
            required: 'fridge_1'
        },
        {
            id: 'premium_pan',
            name: 'こげないフライパン',
            price: 2000,
            description: '焼きやすくなり、焼き材料の得点+20', // 説明文更新
            image: 'premium-pan.png',
            type: 'upgrade_grill'
        },
        {
            id: 'juice_server',
            name: 'ジュースサーバー',
            price: 2000,
            description: '注ぎやすくなり、ジュースの得点+20', // 説明文更新
            image: 'juice-server.png',
            type: 'upgrade_pour'
        },
        // --- 新商品追加 ---
        {
            id: 'vegetable_knife',
            name: '職人の野菜ほうちょう',
            price: 1500,
            description: '野菜がおいしく切れる！野菜の得点+20',
            image: 'vegetable-knife.png', // 画像ファイルを用意してください
            type: 'bonus_score',
            target: ['lettuce', 'tomato', 'pickles', 'onion', 'avocado'],
            value: 20
        },
        {
            id: 'buns_machine',
            name: '高級バンズマシーン',
            price: 2000,
            description: 'おいしいバンズに大変身。バンズの得点+10',
            image: 'buns-machine.png', // 画像ファイルを用意してください
            type: 'bonus_score',
            target: ['top-bun', 'bottom-bun'],
            value: 10
        },
        {
            id: 'connoisseur_glasses',
            name: '目利きのめがね',
            price: 2500,
            description: 'しいれ力がアップ！すべての材料の得点+10',
            image: 'glasses.png', // 画像ファイルを用意してください
            type: 'bonus_score_all_ingredients', // フラグで管理
            value: 10
        },
        {
            id: 'secret_sauce',
            name: '秘伝のソース',
            price: 3000,
            description: 'おいいしソースでパワーアップ。常に得点+50',
            image: 'secret-sauce.png', // 画像ファイルを用意してください
            type: 'bonus_score_always', // フラグで管理
            value: 50
        },
        // ------------------
        {
            id: 'jukebox',
            name: 'ジュークボックス',
            price: 2500,
            description: 'お店の音楽を変更できる',
            image: 'jukebox.png',
            type: 'unlock_bgm'
        }
    ]
};