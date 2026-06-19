const events = [
  {
    id: 'bandit-attack',
    name: '强盗袭击',
    type: 'danger',
    description: '一群沙漠强盗从沙丘后冲出，包围了你的商队！',
    minDanger: 0.3,
    hasChoices: true,
    choices: [
      {
        id: 'fight',
        label: '⚔️ 奋起反抗',
        description: '与强盗们决一死战',
        effects: [
          { type: 'loseGoods', chance: 0.3, goodsLossPercent: 0.1 },
          { type: 'loseStamina', chance: 0.7, staminaLoss: 20 },
          { type: 'gainMoney', chance: 0.4, moneyGain: 200 }
        ]
      },
      {
        id: 'pay',
        label: '💰 交出买路财',
        description: '花钱消灾，缴纳保护费',
        effects: [
          { type: 'loseMoney', chance: 1.0, moneyLossPercent: 0.15 },
          { type: 'loseStamina', chance: 0.3, staminaLoss: 10 }
        ]
      },
      {
        id: 'flee',
        label: '🏃 尝试逃跑',
        description: '全速冲过路障，可能损失部分货物',
        effects: [
          { type: 'loseGoods', chance: 0.6, goodsLossPercent: 0.25 },
          { type: 'loseStamina', chance: 1.0, staminaLoss: 30 }
        ]
      }
    ]
  },
  {
    id: 'sandstorm',
    name: '沙暴来袭',
    type: 'danger',
    description: '天空突然变得昏黄，一场巨大的沙暴正在逼近！',
    minDanger: 0.2,
    hasChoices: true,
    choices: [
      {
        id: 'shelter',
        label: '🏕️ 就地扎营躲避',
        description: '寻找掩体等待沙暴过去',
        effects: [
          { type: 'loseStamina', chance: 1.0, staminaLoss: 15 },
          { type: 'useGoods', chance: 1.0, requiredGoods: 'water', amount: 2, staminaRestore: 5 }
        ]
      },
      {
        id: 'rush',
        label: '💨 强行穿越',
        description: '冒险加速前进，可能损失更多',
        effects: [
          { type: 'loseStamina', chance: 1.0, staminaLoss: 35 },
          { type: 'loseGoods', chance: 0.4, goodsLossPercent: 0.1 }
        ]
      }
    ]
  },
  {
    id: 'broken-vehicle',
    name: '车辆故障',
    type: 'danger',
    description: '你的运输车辆在颠簸的道路上抛锚了，需要修理。',
    minDanger: 0.15,
    hasChoices: true,
    choices: [
      {
        id: 'repair',
        label: '🔧 自己修理',
        description: '使用废料自己动手修理',
        effects: [
          { type: 'useGoods', chance: 1.0, requiredGoods: 'scrap', amount: 3, staminaLoss: 10 }
        ]
      },
      {
        id: 'hire',
        label: '👷 雇人修理',
        description: '花钱找当地人帮忙',
        effects: [
          { type: 'loseMoney', chance: 1.0, moneyLoss: 150 }
        ]
      },
      {
        id: 'abandon',
        label: '📦 抛弃部分货物减重',
        description: '轻装上路，下次再回来',
        effects: [
          { type: 'loseGoods', chance: 1.0, goodsLossPercent: 0.15 },
          { type: 'loseStamina', chance: 0.5, staminaLoss: 15 }
        ]
      }
    ]
  },
  {
    id: 'radiation-zone',
    name: '辐射区',
    type: 'danger',
    description: '你误入了一个高辐射区域，队员们开始感到不适。',
    minDanger: 0.4,
    hasChoices: true,
    choices: [
      {
        id: 'medicine',
        label: '💊 使用抗辐射药物',
        description: '使用药品缓解症状',
        effects: [
          { type: 'useGoods', chance: 1.0, requiredGoods: 'medicine', amount: 3, staminaRestore: 10 },
          { type: 'loseStamina', chance: 0.3, staminaLoss: 10 }
        ]
      },
      {
        id: 'quick',
        label: '⚡ 快速通过',
        description: '承受辐射但节省时间',
        effects: [
          { type: 'loseStamina', chance: 1.0, staminaLoss: 40 }
        ]
      },
      {
        id: 'detour',
        label: '🔄 绕路而行',
        description: '绕开辐射区，消耗更多物资',
        effects: [
          { type: 'loseStamina', chance: 1.0, staminaLoss: 20 },
          { type: 'useGoods', chance: 1.0, requiredGoods: 'fuel', amount: 2 },
          { type: 'useGoods', chance: 1.0, requiredGoods: 'water', amount: 2 }
        ]
      }
    ]
  },
  {
    id: 'friendly-travelers',
    name: '友好旅人',
    type: 'good',
    description: '你在路上遇到了一群友好的旅人，他们愿意与你分享物资和情报。',
    minDanger: 0.1,
    hasChoices: true,
    choices: [
      {
        id: 'accept',
        label: '🤝 接受帮助',
        description: '友好地接受他们的好意',
        effects: [
          { type: 'gainMoney', chance: 0.6, moneyGain: 100 },
          { type: 'gainGoods', chance: 1.0, goodsId: 'water', amount: 5 },
          { type: 'gainGoods', chance: 0.8, goodsId: 'food', amount: 5 },
          { type: 'restoreStamina', chance: 0.7, staminaRestore: 15 }
        ]
      },
      {
        id: 'trade',
        label: '🔄 交换情报',
        description: '用物资交换市场情报',
        effects: [
          { type: 'gainMoney', chance: 0.3, moneyGain: 50 },
          { type: 'restoreStamina', chance: 1.0, staminaRestore: 10 }
        ]
      },
      {
        id: 'decline',
        label: '👋 礼貌谢绝',
        description: '保持警惕，婉拒好意',
        effects: []
      }
    ]
  },
  {
    id: 'hidden-cache',
    name: '发现宝藏',
    type: 'good',
    description: '你在废墟中发现了一个隐藏的补给箱！',
    minDanger: 0.2,
    hasChoices: true,
    choices: [
      {
        id: 'take',
        label: '🎁 打开箱子',
        description: '看看里面有什么',
        effects: [
          { type: 'gainGoods', chance: 1.0, randomGoods: true, amount: 10 },
          { type: 'gainMoney', chance: 0.7, moneyGain: 300 }
        ]
      },
      {
        id: 'careful',
        label: '🔍 小心检查',
        description: '先检查是否有陷阱',
        effects: [
          { type: 'gainGoods', chance: 0.8, randomGoods: true, amount: 8 },
          { type: 'gainMoney', chance: 0.5, moneyGain: 200 },
          { type: 'loseStamina', chance: 0.2, staminaLoss: 10 }
        ]
      }
    ]
  },
  {
    id: 'merchant',
    name: '流浪商人',
    type: 'good',
    description: '一个神秘的流浪商人出现在你面前，提供了一笔特殊交易。',
    minDanger: 0.1,
    hasChoices: true,
    choices: [
      {
        id: 'trade-rare',
        label: '💎 购买稀有货物',
        description: '500金币购买稀有物资',
        cost: { money: 500 },
        effects: [
          { type: 'gainGoods', chance: 1.0, goodsId: 'rare-alloys', amount: 2 }
        ]
      },
      {
        id: 'trade-drugs',
        label: '💉 购买药品',
        description: '200金币购买黑市药品',
        cost: { money: 200 },
        effects: [
          { type: 'gainGoods', chance: 1.0, goodsId: 'drugs', amount: 5 }
        ]
      },
      {
        id: 'decline',
        label: '❌ 拒绝',
        description: '不感兴趣',
        effects: []
      }
    ]
  },
  {
    id: 'water-source',
    name: '发现水源',
    type: 'good',
    description: '你的商队发现了一处隐藏的地下水源！',
    minDanger: 0.1,
    hasChoices: false,
    effects: [
      { type: 'gainGoods', chance: 1.0, goodsId: 'water', amount: 10 },
      { type: 'restoreStamina', chance: 1.0, staminaRestore: 10 }
    ]
  },
  {
    id: 'checkpoint',
    name: '军阀关卡',
    type: 'neutral',
    description: '当地军阀设置的关卡挡住了去路，他们要求缴纳通行费。',
    minDanger: 0.25,
    hasChoices: true,
    choices: [
      {
        id: 'pay',
        label: '💰 缴纳通行费',
        description: '花钱买平安',
        effects: [
          { type: 'loseMoney', chance: 1.0, moneyLoss: 100 }
        ]
      },
      {
        id: 'bribe',
        label: '🎁 贿赂守卫',
        description: '用货物贿赂，可能更便宜',
        effects: [
          { type: 'loseGoods', chance: 1.0, goodsLossPercent: 0.08 },
          { type: 'gainMoney', chance: 0.2, moneyGain: 50 }
        ]
      },
      {
        id: 'sneak',
        label: '🌙 偷偷绕过',
        description: '冒险绕开关卡',
        effects: [
          { type: 'loseStamina', chance: 1.0, staminaLoss: 25 },
          { type: 'loseGoods', chance: 0.3, goodsLossPercent: 0.05 }
        ]
      }
    ]
  },
  {
    id: 'refugees',
    name: '难民求助',
    type: 'neutral',
    description: '一群饥饿的难民向你的商队求助，请求一些食物和水。',
    minDanger: 0.1,
    hasChoices: true,
    choices: [
      {
        id: 'help',
        label: '❤️ 慷慨相助',
        description: '分享你的物资',
        effects: [
          { type: 'useGoods', chance: 1.0, requiredGoods: 'food', amount: 5 },
          { type: 'useGoods', chance: 1.0, requiredGoods: 'water', amount: 5 },
          { type: 'gainMoney', chance: 0.3, moneyGain: 0 }
        ],
        rewardReputation: 10
      },
      {
        id: 'little',
        label: '🍞 给一点',
        description: '意思意思',
        effects: [
          { type: 'useGoods', chance: 1.0, requiredGoods: 'food', amount: 2 },
          { type: 'useGoods', chance: 1.0, requiredGoods: 'water', amount: 2 }
        ],
        rewardReputation: 3
      },
      {
        id: 'refuse',
        label: '🚫 拒绝',
        description: '自顾不暇',
        effects: [],
        rewardReputation: -5
      }
    ]
  },
  {
    id: 'ambush',
    name: '路匪伏击',
    type: 'danger',
    description: '前方道路似乎有异常，可能是个陷阱！',
    minDanger: 0.4,
    hasChoices: true,
    choices: [
      {
        id: 'fight',
        label: '⚔️ 正面突破',
        description: '硬闯过去',
        effects: [
          { type: 'loseGoods', chance: 0.5, goodsLossPercent: 0.3 },
          { type: 'loseStamina', chance: 0.8, staminaLoss: 35 },
          { type: 'gainMoney', chance: 0.3, moneyGain: 350 }
        ]
      },
      {
        id: 'detour',
        label: '🔄 绕道而行',
        description: '安全第一，绕远路',
        effects: [
          { type: 'loseStamina', chance: 1.0, staminaLoss: 20 },
          { type: 'useGoods', chance: 1.0, requiredGoods: 'fuel', amount: 3 }
        ]
      },
      {
        id: 'negotiate',
        label: '🗣️ 尝试谈判',
        description: '看看能不能谈拢',
        effects: [
          { type: 'loseMoney', chance: 0.6, moneyLossPercent: 0.2 },
          { type: 'loseGoods', chance: 0.4, goodsLossPercent: 0.1 }
        ]
      }
    ]
  },
  {
    id: 'caravan-meet',
    name: '商队相遇',
    type: 'neutral',
    description: '你在路上遇到了另一支商队，他们似乎也在做贸易。',
    minDanger: 0.15,
    hasChoices: true,
    choices: [
      {
        id: 'trade',
        label: '🤝 交换货物',
        description: '互通有无',
        effects: [
          { type: 'gainGoods', chance: 1.0, randomGoods: true, amount: 5 },
          { type: 'loseGoods', chance: 1.0, goodsLossPercent: 0.05 }
        ]
      },
      {
        id: 'info',
        label: '📋 交流情报',
        description: '交换市场信息',
        effects: [
          { type: 'restoreStamina', chance: 0.5, staminaRestore: 10 }
        ]
      },
      {
        id: 'ignore',
        label: '👋 擦肩而过',
        description: '各走各的路',
        effects: []
      }
    ]
  },
  {
    id: 'ruins-explore',
    name: '废墟探索',
    type: 'neutral',
    description: '你发现了一处战前建筑废墟，也许里面有值钱的东西。',
    minDanger: 0.2,
    hasChoices: true,
    choices: [
      {
        id: 'explore',
        label: '🔍 深入探索',
        description: '仔细搜索每个角落',
        effects: [
          { type: 'gainGoods', chance: 0.7, randomGoods: true, amount: 8 },
          { type: 'gainMoney', chance: 0.4, moneyGain: 250 },
          { type: 'loseStamina', chance: 0.6, staminaLoss: 20 }
        ]
      },
      {
        id: 'quick',
        label: '⚡ 快速搜刮',
        description: '拿了就走',
        effects: [
          { type: 'gainGoods', chance: 0.5, randomGoods: true, amount: 4 },
          { type: 'gainMoney', chance: 0.3, moneyGain: 100 },
          { type: 'loseStamina', chance: 0.3, staminaLoss: 10 }
        ]
      },
      {
        id: 'skip',
        label: '🚶 不冒险',
        description: '安全为上',
        effects: []
      }
    ]
  }
];

module.exports = { events };
