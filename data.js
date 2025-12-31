const gameData = {
    customers: [
        'customer1.png',
        'customer2.png',
        'customer3.png',
        'customer4.png',
        'customer5.png',
        'customer6.png', // 追加
        'customer7.png'  // 追加
    ],
    displayOrder: [
        
        'top-bun',
        'patty',
        'bacon',
        'egg',
        'cheese',
        'lettuce',
        'bottom-bun',
        'tomato',
    
        'pickles',
        'onion',
        'avocado'
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
        'coke': { name: 'コーラ', price: 150, purchasePrice: 50, image: 'coke.png', stock: 5, qualityNames: { excellent: '神業コーラ', good: 'なみなみコーラ', normal: 'ふつうのコーラ' }, qualityMultipliers: { excellent: 1.5, good: 1.2, normal: 1 } },
        'orange-juice': { name: 'オレンジジュース', price: 150, purchasePrice: 50, image: 'orange-juice.png', stock: 5, qualityNames: { excellent: '神業オレンジ', good: 'なみなみオレンジ', normal: 'ふつうのオレンジ' }, qualityMultipliers: { excellent: 1.5, good: 1.2, normal: 1 } },
        'calpis': { name: 'カルピス', price: 150, purchasePrice: 50, image: 'calpis.png', stock: 5, qualityNames: { excellent: '神業カルピス', good: 'なみなみカルピス', normal: 'ふつうのカルピス' }, qualityMultipliers: { excellent: 1.5, good: 1.2, normal: 1 } }
    }
};