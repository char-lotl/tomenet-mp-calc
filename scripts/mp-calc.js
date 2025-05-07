// Assigning names to DOM objects corresponding to key page elements.
const allInputs = document.querySelector('#all-inputs');

const manapointsOutput = document.querySelector('#mana-points-output');
const mimicManapointsOutput = document.querySelector('#mimic-mana-points-output');
const mimicryOutputSection = document.querySelector('#mimicry-output-section');

const dexInput = document.querySelector('#dex-score-input-row');
const intInput = document.querySelector('#int-score-input-row');
const wisInput = document.querySelector('#wis-score-input-row');
const chaInput = document.querySelector('#cha-score-input-row');
const statInputs = [dexInput, intInput, wisInput, chaInput];

const mimicrySkillInput = document.querySelector('#mimicry-skill-input');

const hpCalcLink = document.querySelector('#hp-calc-link');

const [DEX, INT, WIS, CHA] = [0, 1, 2, 3];

// Default character profile values.
const profile = {
  playerLevel: 1,
  playerClass: "istar",
  dexIntWisChaManaPercents: [0, 85, 15, 0],
  manaPoolDivisor: 3000,
  plusManaDivisor: 100,
  abilityScores: [10, 10, 10, 10],
  magicSkill: 0,
  mimicrySkill: 0,
  plusMP: 0,
  canLearnMimicry: false,
  canMimic: false,
  priestLike: false,
  mimicCastRate: 4,
  mimicSpellSpeedPlusMana: 0,
  mimicSpellSpeedPlusStats: 0
};

// Pairs character classes with their MP computation data.
const classParser = {
  "istar": [0, 85, 15, 0, 3000, 100, false],
  "priest": [0, 15, 85, 0, 3750, 130, false],
  "rogue": [0, 85, 15, 0, 5500, 150, false],
  "mimic": [0, 85, 15, 0, 5000, 130, true],
  "paladin": [0, 15, 85, 0, 5500, 150, false],
  "ranger": [0, 85, 15, 0, 5000, 130, false],
  "adventurer": [0, 50, 50, 0, 5500, 150, true],
  "druid": [0, 15, 85, 0, 4000, 130, false],
  "shaman": [0, 100, 100, 0, 4000, 130, true], // unique rule, needs exception
  "runemaster": [35, 65, 0, 0, 3000, 100, false],
  "mindcrafter": [0, 85, 5, 10, 4000, 130, false],
  "death-knight": [0, 15, 85, 0, 5000, 150, false],
  "hell-knight": [0, 15, 85, 0, 5000, 150, false]
};

// Relates character Intelligence values with MP bonuses.
const adjMagMana = [
  0, 0, 0, 0, 0, 1, 2, 2, 2, 2,
  2, 2, 2, 2, 2, 3, 3, 3, 3, 3,
  4, 4, 5, 6, 7, 8, 9, 10, 11, 12,
  13, 13, 14, 14, 15, 15, 15, 16
];

// Entry 0 in the above array corresponds to stat value 3.
// So there's an offset of 3 from the stat value to the index.
const ADJ_MAG_MANA_OFFSET = 3;

const statParser = {
  "three": 3,
  "four": 4,
  "five": 5,
  "six": 6,
  "seven": 7,
  "eight": 8,
  "nine": 9,
  "ten": 10,
  "eleven": 11,
  "twelve": 12,
  "thirteen": 13,
  "fourteen": 14,
  "fifteen": 15,
  "sixteen": 16,
  "seventeen": 17,
  "eighteen": 18,
  "eighteen-ten": 19,
  "eighteen-twenty": 20,
  "eighteen-thirty": 21,
  "eighteen-forty": 22,
  "eighteen-fifty": 23,
  "eighteen-sixty": 24,
  "eighteen-seventy": 25,
  "eighteen-eighty": 26,
  "eighteen-ninety": 27,
  "eighteen-one-hundred": 28,
  "eighteen-one-hundred-ten": 29,
  "eighteen-one-hundred-twenty": 30,
  "eighteen-one-hundred-thirty": 31,
  "eighteen-one-hundred-forty": 32,
  "eighteen-one-hundred-fifty": 33,
  "eighteen-one-hundred-sixty": 34,
  "eighteen-one-hundred-seventy": 35,
  "eighteen-one-hundred-eighty": 36,
  "eighteen-one-hundred-ninety": 37,
  "eighteen-two-hundred": 38,
  "eighteen-two-hundred-ten": 39,
  "eighteen-two-hundred-twenty": 40
};

// Pairs HTML select elements for stats with their stat constant.
const statNameParser = {
  "dexScore": DEX,
  "intScore": INT,
  "wisScore": WIS,
  "chaScore": CHA
};

// Associates entry fields with their corresponding validation regexes.
const patternSelector = {
  "playerLevel": /^[1-9][0-9]?$/,                           // 1 to 99
  "magicSkill": /^([1-4]?\d(\.\d\d?\d?)?|50(.00?0?)?)$/,    // 0.000 to 50.000
  "mimicrySkill": /^([1-4]?\d(\.\d\d?\d?)?|50(.00?0?)?)$/,  // ditto
  "plusMP": /^-?(1?[0-9]|2[0-5])$/,                         // -25 to 25
  "mimicCastRate": /^([1-9]|1[0125])$/                      // 1 to 12, or 15
};

// Handles the offset between array indices and raw stat values,
// due to stats not going lower than 3.
const getManaBonus = function(statValue) {
  return adjMagMana[statValue - ADJ_MAG_MANA_OFFSET];
}

// Computes an level-dependent value relevant to MP computation.
const getPlayerLevelsEff = function(level) {
  const tmpLev = level * 10;
  if (level <= 50) {
    return tmpLev;
  } else if (level <= 70) {
    return 500 + Math.floor((tmpLev - 500) / 2);
  } else if (level <= 85) {
    return 600 + Math.floor((tmpLev - 700) / 3);
  } else {
    return 650 + Math.floor((tmpLev - 850) / 4);
  }
}

// Computes an class-and-stat-dependent value relevant to MP computation.
const getWeightedBonus = function(manaPercents, abilityScores) {
  return manaPercents[DEX] * getManaBonus(abilityScores[DEX]) +
         manaPercents[INT] * getManaBonus(abilityScores[INT]) +
         manaPercents[WIS] * getManaBonus(abilityScores[WIS]) +
         manaPercents[CHA] * getManaBonus(abilityScores[CHA]);
}

// Performs the final steps of MP computation.
const manaFromParameters = function(p, abilityScores, toMana, playerLevelsEff, manaPercents) {
  const weightedBonus = getWeightedBonus(manaPercents, abilityScores);
  const fromStats = Math.floor(weightedBonus * playerLevelsEff / p.manaPoolDivisor);

  const fromMagicSkill = Math.floor(p.magicSkill * 4);
  const baseMP = fromMagicSkill + fromStats;

  const afterPlusMP = baseMP + Math.trunc(baseMP * toMana / p.plusManaDivisor) + 1;
  const afterMimicrySkill = afterPlusMP + (p.canLearnMimicry ? (p.mimicrySkill > 30 ? (Math.floor(p.mimicrySkill) - 30) * 5 : 0) : 0);
  const afterFloor = (afterMimicrySkill < 1) ? 1 : afterMimicrySkill;

  return afterFloor;
}

// The top level of the process of recomputing MP
// due to a change in character parameters, closely
// following the logic laid out in the game source.
const recompute = function(p) {

  const level = p.playerLevel;
  const playerLevelsEff = getPlayerLevelsEff(level);

  const manaPercents = p.playerClass === "shaman" ?
    (p.abilityScores[INT] > p.abilityScores[WIS] ? [0, 100, 0, 0] : [0, 0, 100, 0]) :
    p.dexIntWisChaManaPercents;

  const mimicWisBoost = p.priestLike ? Math.floor(p.mimicSpellSpeedPlusStats / 2) : 0;
  const mimicBoostedWis = p.abilityScores[WIS] + mimicWisBoost;
  const mimicBoostedInt = p.abilityScores[INT] + p.mimicSpellSpeedPlusStats - mimicWisBoost;

  const mimicAbilityScores = [
    p.abilityScores[DEX],
    mimicBoostedInt > 40 ? 40 : mimicBoostedInt,
    mimicBoostedWis > 40 ? 40 : mimicBoostedWis,
    p.abilityScores[CHA]
  ];

  const toMana = p.plusMP * 10;
  const mimicToMana = toMana + p.mimicSpellSpeedPlusMana;

  const playerFormMP = manaFromParameters(p, p.abilityScores, toMana, playerLevelsEff, manaPercents);
  const mimicFormMP = manaFromParameters(p, mimicAbilityScores, mimicToMana, playerLevelsEff, manaPercents);

  return [playerFormMP, mimicFormMP];

};

const displayValueIn = function(value, container) {
  container.textContent = value;
}

const clearDisplay = function(container) {
  container.textContent = "";
}

// Wiring up outputs.
const updateOutput = function() {
  
  const [playerManapoints, mimicryManapoints] = recompute(profile);
  displayValueIn(playerManapoints, manapointsOutput);
  displayValueIn(mimicryManapoints, mimicManapointsOutput);

  /*const banned = classBans[profile.playerRace].includes(profile.playerClass);
  if (banned) {
    bannedRaceClassComboWarning.removeAttribute("hidden");
  } else {
    bannedRaceClassComboWarning.setAttribute("hidden", "");
  }*/

};

updateOutput();

// Wiring up inputs.
allInputs.addEventListener('change', e => {
  const changedFieldID = e.target.id;
  const changedFieldType = e.target.type;
  const changedFieldValue = e.target.value;
  if (changedFieldType === 'select-one') {
    if (changedFieldID === 'playerClass') {
      profile.playerClass = changedFieldValue;
      const classData = classParser[changedFieldValue];
      profile.dexIntWisChaManaPercents = classData.slice(0, 4);
      profile.manaPoolDivisor = classData[4];
      profile.plusManaDivisor = classData[5];
      profile.canLearnMimicry = classData[6];
      profile.canMimic = profile.canLearnMimicry || (profile.playerClass === "druid");
      for (let i = 0; i < 4; i++) {
        if (profile.dexIntWisChaManaPercents[i] == 0) {
          statInputs[i].setAttribute("hidden", ""); // We don't need to see Cha on a Ranger...
        } else {
          statInputs[i].removeAttribute("hidden"); // But we do need to see it on a Mindcrafter!
        }
      }
      if (profile.canLearnMimicry) {
        mimicrySkillInput.removeAttribute("hidden");
      } else {
        mimicrySkillInput.setAttribute("hidden", "");
      }
      if (profile.canMimic) {
        mimicryOutputSection.removeAttribute("hidden");
      } else {
        mimicryOutputSection.setAttribute("hidden", "");
      }
    } else if (changedFieldID === 'priestLike') { // Assumption: class and stats and priest-like-ness are the only select-ones here.
      profile.priestLike = (changedFieldValue === 'priest-like');
    } else {
      const statIndex = statNameParser[changedFieldID];
      const statValue = statParser[changedFieldValue];
      profile.abilityScores[statIndex] = statValue;
    }
  } else if (changedFieldType === 'checkbox') {
    profile[changedFieldID] = e.target.checked;
  } else if (changedFieldType === 'number') {
    profile[changedFieldID] = Number(changedFieldValue);
  } else {
    console.log(changedFieldType);
    console.log(changedFieldValue);
  }
  updateOutput();
});

allInputs.addEventListener('input', e => {
  const changedFieldID = e.target.id;
  if (e.target.type === 'text') {
    const validInput = patternSelector[changedFieldID].test(e.target.value);
    if (validInput) {
      e.target.removeAttribute("invalid");
      profile[changedFieldID] = Number(e.target.value);
      if (changedFieldID === 'mimicCastRate') {
        profile.mimicSpellSpeedPlusMana = ((profile.mimicCastRate < 4) ? (65 - 15 * profile.mimicCastRate) : 0);
        profile.mimicSpellSpeedPlusStats = ((profile.mimicCastRate < 4) ? Math.floor((12 - 3 * profile.mimicCastRate) / 2) : 0);
      }
    } else {
      e.target.setAttribute("invalid", "");
    }
  }
  updateOutput();
});
