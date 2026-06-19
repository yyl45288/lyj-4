const mercenaries = [
  {
    id: 'merc-1',
    name: '老兵杰克',
    description: '前正规军士兵，经验丰富，战斗力强。',
    wage: 80,
    combatPower: 25,
    riskReduction: 0.15,
    lossReduction: 0.2,
    icon: '🪖'
  },
  {
    id: 'merc-2',
    name: '猎手莎拉',
    description: '废土上的赏金猎人，擅长侦察和伏击。',
    wage: 100,
    combatPower: 30,
    riskReduction: 0.2,
    lossReduction: 0.25,
    icon: '🏹'
  },
  {
    id: 'merc-3',
    name: '机械师老周',
    description: '不仅能打，还能沿途修理车辆，减少故障风险。',
    wage: 120,
    combatPower: 20,
    riskReduction: 0.1,
    lossReduction: 0.15,
    special: 'vehicleRepair',
    icon: '🔧'
  },
  {
    id: 'merc-4',
    name: '狂战士铁锤',
    description: '战斗力超强的壮汉，但工资也高。',
    wage: 150,
    combatPower: 40,
    riskReduction: 0.25,
    lossReduction: 0.35,
    icon: '🔨'
  },
  {
    id: 'merc-5',
    name: '神枪手鹰眼',
    description: '百发百中的狙击手，能有效震慑劫匪。',
    wage: 130,
    combatPower: 35,
    riskReduction: 0.22,
    lossReduction: 0.3,
    icon: '🎯'
  }
];

const cityMercenaryAvailability = {
  'city-1': ['merc-1', 'merc-2', 'merc-4'],
  'city-2': ['merc-1', 'merc-3'],
  'city-3': ['merc-2', 'merc-3', 'merc-5'],
  'city-4': ['merc-4', 'merc-5', 'merc-2'],
  'city-5': ['merc-1', 'merc-3', 'merc-5']
};

module.exports = { mercenaries, cityMercenaryAvailability };
