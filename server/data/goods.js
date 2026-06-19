const goods = [
  {
    id: 'water',
    name: '净水',
    description: '废土中最珍贵的资源，干净的饮用水。',
    basePrice: 30,
    weight: 2,
    icon: '💧',
    isIllegal: false
  },
  {
    id: 'food',
    name: '干粮',
    description: '不易变质的压缩食物，商队必备。',
    basePrice: 25,
    weight: 1.5,
    icon: '🍞',
    isIllegal: false
  },
  {
    id: 'medicine',
    name: '药品',
    description: '抗生素和急救用品，救命的东西。',
    basePrice: 80,
    weight: 0.5,
    icon: '💊',
    isIllegal: false
  },
  {
    id: 'fuel',
    name: '燃料',
    description: '精炼汽油或柴油，驱动车辆的必需品。',
    basePrice: 50,
    weight: 3,
    icon: '⛽',
    isIllegal: false
  },
  {
    id: 'weapons',
    name: '武器',
    description: '各类枪械和近战武器，废土生存必备。',
    basePrice: 150,
    weight: 4,
    icon: '🔫',
    isIllegal: false
  },
  {
    id: 'steel',
    name: '钢材',
    description: '高质量的钢材，用于修理和制造。',
    basePrice: 60,
    weight: 5,
    icon: '🔩',
    isIllegal: false
  },
  {
    id: 'scrap',
    name: '废料',
    description: '各种可回收的废旧金属和零件。',
    basePrice: 15,
    weight: 3,
    icon: '🔧',
    isIllegal: false
  },
  {
    id: 'drugs',
    name: '黑市药品',
    description: '兴奋剂、止痛药等管制药品，利润丰厚但违法。',
    basePrice: 200,
    weight: 0.3,
    icon: '💉',
    isIllegal: true
  },
  {
    id: 'clothes',
    name: '布料衣物',
    description: '耐用的衣物和布料，抵御风沙和寒冷。',
    basePrice: 35,
    weight: 1,
    icon: '👕',
    isIllegal: false
  },
  {
    id: 'rare-alloys',
    name: '稀有合金',
    description: '来自旧世界的高科技合金材料，极其珍贵。',
    basePrice: 500,
    weight: 2,
    icon: '💎',
    isIllegal: true,
    blackMarketOnly: true
  },
  {
    id: 'nuclear-cores',
    name: '核能核心',
    description: '小型化的核能源核心，高危险高价值。',
    basePrice: 800,
    weight: 5,
    icon: '☢️',
    isIllegal: true,
    blackMarketOnly: true
  },
  {
    id: 'cyber-implants',
    name: '义体植入件',
    description: '军用级别的机械义体部件，黑市抢手货。',
    basePrice: 600,
    weight: 1.5,
    icon: '🦾',
    isIllegal: true,
    blackMarketOnly: true
  },
  {
    id: 'artifacts',
    name: '战前文物',
    description: '战前文明的珍贵文物，收藏家趋之若鹜。',
    basePrice: 450,
    weight: 1,
    icon: '🏺',
    isIllegal: true,
    blackMarketOnly: true
  },
  {
    id: 'stims',
    name: '强效兴奋剂',
    description: '军方规格的兴奋剂，能大幅提升体能但成瘾性强。',
    basePrice: 350,
    weight: 0.2,
    icon: '💊',
    isIllegal: true,
    blackMarketOnly: true
  }
];

module.exports = { goods };
