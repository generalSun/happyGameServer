const MJCONST = require('../../../util/common').MJCONST;
const _ = require('lodash');
const MJ_CARDS = [
  0x101, 0x102, 0x103, 0x104, 0x105, 0x106, 0x107, 0x108, 0x109,						//万子
  0x201, 0x202, 0x203, 0x204, 0x205, 0x206, 0x207, 0x208, 0x209,						//万子
  0x301, 0x302, 0x303, 0x304, 0x305, 0x306, 0x307, 0x308, 0x309,						//万子
  0x401, 0x402, 0x403, 0x404, 0x405, 0x406, 0x407, 0x408, 0x409,						//万子
  0x135, 0x136, 0x137,									        //风箭牌 东南西北中发白
  0x235, 0x236, 0x237,									        //风箭牌
  0x335, 0x336, 0x337,									        //风箭牌
  0x435, 0x436, 0x437,									        //风箭牌
];
class mjSpeedMJApi {
  constructor() { 

  }
  shuffleCard() {
    let cards = MJ_CARDS.slice();
    cards.sort((obj1, obj2) => {
      if (parseInt(Math.random() * 100) % 2) {
        return 1;
      }
      return -1;
    });
    return cards;
  }

  /**
   * 是否可以听
   * @param {*} cards 手牌列表
   * @param {*} allcards 剩余牌列表
   */
  canTing(cards, allcards = null) {
    if (!allcards) {
      allcards = MJ_CARDS.slice();
      for (let i = 0; i < cards.length; i++) {
        for (let j = 0; j < allcards.length; j++) {
          if (allcards[j] == cards[i]) {
            allcards.splice(j, 1);
            break;
          }
        }
      }
    }
    let result = {};
    for (let i = 0; i < allcards.length; i++){
      let idx = this.switchToCardIndex(allcards[i]);
      if (result[idx]) {
        result[idx].count++;
        continue;
      }
      let newCards = cards.slice();
      newCards.push(allcards[i]);
      let fan = this.canHu(newCards);
      if (fan > 0) {
        result[idx] = {
          idx,
          count: 1,
          fan
        }
      }
    }
    if (Object.keys(result).length) {
      return result;
    }
    return null;
  }

  /**
   * 是否可以报听
   * @param {*} handCards
   * 
   */
  canBaoTing(handCards) {
    let result = {};
    let allcards = MJ_CARDS.slice();
    for (let i = 0; i < handCards.length; i++){
      for (let j = 0; j < allcards.length; j++){
        if (allcards[j] == handCards[i]) {
          allcards.splice(j, 1);
          break;
        }
      }
    }
    for (let i = 0; i < handCards.length; i++){
      let newCards = handCards.slice();
      newCards.splice(i, 1);
      let outcard = handCards[i];
      let tings = this.canTing(newCards, allcards);
      if (tings) {
        result[outcard] = { tings };
      }
    }
    if (Object.keys(result).length) {
      return result;
    }
    return null;
  }

  /**
   * 是否可以胡
   * @param {*} orgcards
   * 返回具体番数
   */
  canHu(orgcards = []) {
    let vrCardstemp = [];
    for (i = 0; i < MJCONST.MAX_INDEX; i++) {
      vrCardstemp[i] = [];
    }
    for (let i = 0; i < orgcards.length; i++) {
      let idx = this.switchToCardIndex(orgcards[i]);
      vrCardstemp[idx].push(orgcards[i]);
    }
    // 先找到一对将牌
    for (let m = 0; m < MJCONST.MAX_INDEX; m++) {
      let vrCards = _.cloneDeep(vrCardstemp);
     
      if (vrCards[m].length >= 2) {
        
        let jiang = vrCards[m].splice(0, 2); //先找到一对将牌
        let cbKindItemCount = 0; // 牌中可以组合成3连张或一对的组合数
        let hukindItem = [];    //牌列中3张的组合
        let cards = orgcards.slice();
        for (var i = 0; i < MJCONST.MAX_INDEX; i++) {
          //同牌判断
          if (vrCards[i].length >= 3) {
            hukindItem[cbKindItemCount++] = {
              cards: [vrCards[i][0], vrCards[i][1], vrCards[i][2]],
              type: 0 //表示这是一个三张同牌
            };
          }

          //连牌判断
          if ((i < 27) && (vrCards[i].length > 0) && ((i % 9) < 7)) {
            for (var j = 1; j <= vrCards[i].length; j++) {
              if ((vrCards[i + 1].length >= j) && (vrCards[i + 2].length >= j)) {
                hukindItem[cbKindItemCount++] = {
                  cards: [vrCards[i][j - 1], vrCards[i + 1][j - 1], vrCards[i + 2][j - 1]],
                  type: 1 // 表示这是一个三张顺子
                };
              }
            }
          }
        }
        if (cbKindItemCount >= 1) {
          for (let i = 0; i < hukindItem.length; i++) {
            for (let j = 0; j < hukindItem[i].cards.length; j++) {
              for (let k = 0; k < cards.length; k++) {
                if (hukindItem[i].cards[j] == cards[k]) {
                  cards.splice(k, 1);
                  break;
                }
              }
            }
          }
          for (let i = 0; i < jiang.length; i++){
            for (let k = 0; k < cards.length; k++) {
              if (jiang[i] == cards[k]) {
                cards.splice(k, 1);
                break;
              }
            }
          }
        }
        if (cards.length == 0) {
          //说明受伤的牌可以胡，那么计算一下胡牌的番数
          let fan = 0;
          if (hukindItem[0].type == 0) {
            fan += 10;
            console.log('-1-', fan)
          }
          let ziyise = true; // 判断是否字一色
          for (let i = 0; i < orgcards.length; i++) {
            if (((orgcards[i] & MJCONST.MASK_COLOR) >> 4) != 3) {
              ziyise = false;
              break;
            }
          }
          if (ziyise) { // 是字一色 70番
            console.log('-2-', fan)
            return 70;
          }
          for (let i = 0; i < orgcards.length; i++) {
            if (((orgcards[i] & MJCONST.MASK_COLOR) >> 4) == 3) {
              fan += 10;
              console.log('-3-', fan)
            }
            else {
              fan += (orgcards[i] & MJCONST.MASK_VALUE);
              console.log('-4-', fan)
            }
          }
          console.log('-5-', fan)
          return fan;
        }
      }
    }
    return 0;
  }

  /************************************************************************/
  /* 将CardData转换成CardIndex
  /* Index从0开始
  /************************************************************************/
  switchToCardIndex(cbCardData) {
    cbCardData &= 0x00FF;
    return ((cbCardData & MJCONST.MASK_COLOR) >> 4) * 9 + (cbCardData & MJCONST.MASK_VALUE) - 1;
  }

  /************************************************************************/
  /* 将CardIndex转换成CardData
  /************************************************************************/
  switchToCardData(cbCardIndex) {
    return (Math.floor(cbCardIndex / 9) << 4) | (cbCardIndex % 9 + 1);
  }
}
module.exports = new mjSpeedMJApi();