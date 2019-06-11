let Define = require('../base/commonDefine');
let FKMJConstData = require('../base/constData');
/////////////////////
const _ = require('lodash');
let Judge = require('./judge');
/////////////////////////
class CJudgeDecorator {
	constructor(eRule) {
		this.m_pJudge = Judge.createjudge(eRule);		//判断对象的指针
		this.m_nQuanWind = "";	//圈风
	}
	Init() {
		return this.m_pJudge.Init();
	}
	/************************************************************************/
	/* 验和，默认为国标规则
	 /* arrHandCards：手牌
	 /* oneCardIndex: 输入牌，就是别人打出的牌，如果是自己摸到的牌，这变量就是一个无效值
	 /* weaveItem：吃碰杠的牌信息
	 /* weaveItemCount:吃碰杠的数量
	 /* cbHuaPaiCardData：花牌数据
	 /* cbHuaPaiCount：花牌数量
	 /* nWinMode：和牌模式
	 /* nMenWind：门风
	 /* ChiHuResult:和牌检验结果
	 /************************************************************************/
	CheckWin(arrHandCards, oneCardIndex, weaveItem, weaveItemCount, cbHuaPaiCardData, cbHuaPaiCount, nWinMode, nMenWind, ChiHuResult) {
		let checkParam = new Define.checkParam();

		this.FillCheckParam(arrHandCards, oneCardIndex, weaveItem, weaveItemCount, cbHuaPaiCardData, cbHuaPaiCount, nWinMode, nMenWind, checkParam);

		let huResult = new Define.huresult();
		let checkResult = this.m_pJudge.CheckWin(checkParam, huResult);
		if (checkResult == Define.F_NOENOUGHFANS || checkResult == Define.T_OK) {
			// 和牌，填充
			ChiHuResult.dwChiHuKind |= FKMJConstData.CHK_PING_HU;
			ChiHuResult.dwChiHuRight = 0;
			ChiHuResult.dwWinTimes = huResult.nMaxFans;
			Define._memcpy(ChiHuResult.detailTimes, 0, huResult.anFans, 0, Define.MAXFANS);
			console.log("222222222222:" + JSON.stringify(ChiHuResult) + ":::" + JSON.stringify(huResult))
			for (let i = 0; i < ChiHuResult.detailTimes.length; i++) {
				if (ChiHuResult.detailTimes[i] > 0) {
					console.log("222222222222:1:" + i);
				}
			}
		}

		return checkResult;
	}

	/************************************************************************/
	/* arrHandCards：手牌
	 /* weaveItem：吃碰杠的信息
	 /* weaveItemCount:吃碰杠的数量
	 /* cbHuaPaiCardData：花牌数据
	 /* cbHuaPaiCount：花牌数量
	 /* nWinMode：和牌模式
	 /* nMenWind：门风
	 /************************************************************************/
	CheckTing(arrHandCards, weaveItem, weaveItemCount, cbHuaPaiCardData, cbHuaPaiCount, nWinMode, nMenWind) {
		let checkParam = new Define.checkParam();
		this.FillCheckParam(arrHandCards, Define.INVALID_CARD_INDEX, weaveItem, weaveItemCount, cbHuaPaiCardData, cbHuaPaiCount, nWinMode, nMenWind, checkParam);

		let vsCallInfo = [];
		let result = this.m_pJudge.CheckTing(checkParam, vsCallInfo);
		return result;
	}

	/************************************************************************/
	/* 吃碰杠检验,返回可供选择的组数
	 /* arrHandCards:手牌
	 /* oneCardIndex: 输入牌，就是别人打出的牌，如果是自己摸到的牌，这变量就是一个无效值
	 /* weaveItem:吃碰杠的牌
	 /* weaveItemCount:吃碰杠数量
	 /* nCheckMask:检测吃、碰、还是杠
	 /* bZiMo:是自己摸的牌，用于杠的检测，如果是自己摸的，就要检测台面上碰过的牌
	 /* nMenWind:门风
	 /* gangCardResult:[out]检测的结果
	 /* 返回值：吃碰杠的数量
	 /************************************************************************/
	CheckShowTile(arrHandCards, oneCardIndex, weaveItem, weaveItemCount, cbHuaPaiCardData, cbHuaPaiCount, nCheckMask, bZiMo, nMenWind, mahGroup) {
		let sCheckParam = new Define.checkParam();
		let nWinMode = 0;
		if (bZiMo) {
			nWinMode |= Define.WIN_MODE_ZIMO;
		}
		this.FillCheckParam(arrHandCards, oneCardIndex, weaveItem, weaveItemCount, cbHuaPaiCardData, cbHuaPaiCount, nWinMode, nMenWind, sCheckParam);

		let count = this.m_pJudge.CheckShowTile(sCheckParam, nCheckMask, mahGroup);

		return count;
	}

	/************************************************************************/
	/* 设置混牌，输入原生牌值就行了，函数会自动换换成疯狂麻将的牌值进行保存
	 /************************************************************************/
	SetHun(cbCardData) {
		let stone = this.SwitchToStone(cbCardData);
		//let hunID = Define.TILE_ID(stone.nColor, stone.nWhat, 0xF);
		this.m_pJudge.SetHun(stone);
	}

	//设置圈风
	SetQuanWind(nQuanWind) {
		this.m_nQuanWind = nQuanWind;
	}

	/************************************************************************/
	/* 将原生的牌值转换为疯狂麻将的牌值
	 /* 数值对应：原生牌中万，条，饼的数值是1-9，对应到疯狂麻将中的数值应该是0-8
	 /*			 原生牌中的东南西北数值是1-4，对应到疯狂麻将中的数值应该是0-3
	 /*			 原生牌中的中发白数值是5-7，对应到疯狂麻将中的数值应该是0-2
	 /************************************************************************/
	SwitchToStone(cbCardData) {
		let nColor = 0;
		let nWhat = 0;
		if (((cbCardData & 0x00F0) >> 4) == Define.COLOR_WAN) {
			nColor = Define.COLOR_WAN;
			nWhat = (cbCardData & 0x000F) - 1;
		}
		else if (((cbCardData & 0x00F0) >> 4) == Define.COLOR_TIAO) {
			nColor = Define.COLOR_TIAO;
			nWhat = (cbCardData & 0x000F) - 1;
		}
		else if (((cbCardData & 0x00F0) >> 4) == Define.COLOR_BING) {
			nColor = Define.COLOR_BING;
			nWhat = (cbCardData & 0x000F) - 1;
		}
		else if (((cbCardData & 0x00F0) >> 4) == Define.COLOR_FENG_JIAN) {
			if ((cbCardData & 0x000F) >= 1 && (cbCardData & 0x000F) <= 4) {
				nColor = Define.COLOR_WIND;
				nWhat = (cbCardData & 0x000F) - 1;
			}
			else {
				nColor = Define.COLOR_JIAN;
				nWhat = (cbCardData & 0x000F) - 4 - 1;
			}
		}

		let stone = new Define.stoneObj();
		stone.nID = Define.TILE_ID(nColor, nWhat, 0xF);	//具体的ID不知道如何产生的
		stone.nColor = nColor;
		stone.nWhat = nWhat;

		return stone;
	}


	/************************************************************************/
	/* 将疯狂麻将中的牌值转换成原生的牌值
	 /* 数值对应：原生牌中万，条，饼的数值是1-9，对应到疯狂麻将中的数值应该是0-8
	 /*			 原生牌中的东南西北数值是1-4，对应到疯狂麻将中的数值应该是0-3
	 /*			 原生牌中的中发白数值是5-7，对应到疯狂麻将中的数值应该是0-2
	 /************************************************************************/
	SwitchstoneToCardData(stone) {
		let cbCardData = 0;
		let nColor = stone.nColor;
		let nWhat = stone.nWhat;
		if (nColor == Define.COLOR_WIND) {
			cbCardData = (nColor << 4) + nWhat + 1;
		}
		else if (nColor == Define.COLOR_JIAN) {
			cbCardData = (nColor << 4) + nWhat + 5;
		}
		else {
			cbCardData = (nColor << 4) + nWhat + 1;
		}
		return cbCardData;
	}

	/************************************************************************/
	/* 将CardData转换成CardIndex
	 /* Index从0开始
	 /************************************************************************/
	SwitchToCardIndex(cbCardData) {
		cbCardData &= 0x00FF;
		return ((cbCardData & FKMJConstData.MASK_COLOR) >> 4) * 9 + (cbCardData & FKMJConstData.MASK_VALUE) - 1;
	}

	/************************************************************************/
	/* 将CardIndex转换成CardData
	 /************************************************************************/
	SwitchToCardData(CardIndex) {
		return (Math.floor(CardIndex / 9) << 4) | (CardIndex % 9 + 1);
	}

	/************************************************************************/
	/* 转换成疯狂麻将的组结构
	 /************************************************************************/
	SwitchToStoneGroup(weaveItem) {
		let stoneGroup = new Define.stoneGroup();
		if (weaveItem.cbWeaveKind & FKMJConstData.WIK_LEFT) {
			stoneGroup.nGroupStyle = Define.GROUP_STYLE_SHUN;
			let stone = this.SwitchToStone(weaveItem.cbCenterCard);
			if (stone.nWhat > Define.STONE_NO7) {
				stoneGroup.nGroupStyle = 0;
			}
			else {
				stoneGroup.asStone[0] = stone;
				stone.nWhat += 1;	//后一张牌
				stoneGroup.asStone[1] = stone;
				stone.nWhat += 1;	//再后一张牌
				stoneGroup.asStone[2] = stone;
			}
		}
		else if (weaveItem.cbWeaveKind & FKMJConstData.WIK_CENTER) {
			stoneGroup.nGroupStyle = Define.GROUP_STYLE_SHUN;
			let stone = this.SwitchToStone(weaveItem.cbCenterCard);
			if (stone.nWhat == Define.STONE_NO1 || stone.nWhat == Define.STONE_NO9) {
				stoneGroup.nGroupStyle = 0;
			}
			else {
				stone.nWhat -= 1;	//前一张牌
				stoneGroup.asStone[0] = stone;
				stone.nWhat += 1;	//当前牌
				stoneGroup.asStone[1] = stone;
				stone.nWhat += 1;	//后一张牌
				stoneGroup.asStone[2] = stone;
			}
		}
		else if (weaveItem.cbWeaveKind & FKMJConstData.WIK_RIGHT) {
			stoneGroup.nGroupStyle = Define.GROUP_STYLE_SHUN;
			let stone = this.SwitchToStone(weaveItem.cbCenterCard);
			if (stone.nWhat < Define.STONE_NO3) {
				stoneGroup.nGroupStyle = 0;
			}
			else {
				stone.nWhat -= 2;	//前两张牌
				stoneGroup.asStone[0] = stone;
				stone.nWhat += 1;	//前一张牌
				stoneGroup.asStone[1] = stone;
				stone.nWhat += 1;	//当前牌
				stoneGroup.asStone[2] = stone;
			}
		}
		else if (weaveItem.cbWeaveKind & FKMJConstData.WIK_PENG) {
			stoneGroup.nGroupStyle = Define.GROUP_STYLE_KE;
			let stone = this.SwitchToStone(weaveItem.cbCenterCard);
			stoneGroup.asStone[0] = stoneGroup.asStone[1] = stoneGroup.asStone[2] = stone;
		}
		else if (weaveItem.cbWeaveKind & FKMJConstData.WIK_GANG) {
			if (weaveItem.cbPublicCard == true) {
				//明杠
				stoneGroup.nGroupStyle = Define.GROUP_STYLE_MINGGANG;
			}
			else {
				//暗杠
				stoneGroup.nGroupStyle = Define.GROUP_STYLE_ANGANG;
			}
			let stone = this.SwitchToStone(weaveItem.cbCenterCard);
			for (let i = 0; i < 4; ++i) {
				stoneGroup.asStone[i] = stone;
			}
		}
		else {

		}

		return stoneGroup;
	}

	/************************************************************************/
	/* 填充CHECKPARAM结构
	 /* arrHandCards:手牌
	 /* weaveItem:吃碰杠的牌
	 /* weaveItemCount:吃碰杠的数量
	 /* checkParam:[out]输出结果
	 /************************************************************************/
	FillCheckParam(arrHandCards, oneCardIndex, weaveItem, weaveItemCount, cbHuaPaiCardData, cbHuaPaiCount, nWinMode, nMenWind, checkParam) {
		//初始化输出结果

		//手牌和手牌张数
		let cardCount = 0;	//麻将牌数量
		console.log("vvvvvvvvvvvvvvvvv:" + oneCardIndex + ":" + this.SwitchToCardData(oneCardIndex) + ":" + JSON.stringify(this.SwitchToStone(this.SwitchToCardData(oneCardIndex))));
		if (oneCardIndex != Define.INVALID_CARD_INDEX)
			checkParam.asHandStone[cardCount++] = _.cloneDeep(this.SwitchToStone(this.SwitchToCardData(oneCardIndex)));
		if (oneCardIndex != Define.INVALID_CARD_INDEX && (nWinMode & Define.WIN_MODE_ZIMO) == Define.WIN_MODE_ZIMO) {
			if (arrHandCards[oneCardIndex] > 0) {
				arrHandCards[oneCardIndex]--;
			}
		}
		for (let i = 0; i < 34; ++i) {
			if (arrHandCards[i] > 0) {
				for (let j = 0; j < arrHandCards[i]; ++j) {
					let cbCardData = this.SwitchToCardData(i);
					checkParam.asHandStone[cardCount++] = _.cloneDeep(this.SwitchToStone(cbCardData));
				}
			}
		}
		checkParam.cnHandStone = cardCount;

		//吃碰杠的信息
		let count = weaveItemCount;
		if (count > 6) count = 6;
		for (let i = 0; i < count; ++i) {
			checkParam.asShowGroup[i] = _.cloneDeep(this.SwitchToStoneGroup(weaveItem[i]));
		}
		checkParam.cnShowGroups = count;
		//花牌数量
		checkParam.cnFlower = cbHuaPaiCount;
		for (let i = 0; i < checkParam.cnFlower; ++i) {
			checkParam.asFlower[i] = _.cloneDeep(this.SwitchToStone(cbHuaPaiCardData[i]));
		}

		//明暗杠数量
		for (let i = 0; i < count; ++i) {
			if (checkParam.asShowGroup[i].nGroupStyle == Define.GROUP_STYLE_MINGGANG) {
				++checkParam.cnMinGang;
			}
			if (checkParam.asShowGroup[i].nGroupStyle == Define.GROUP_STYLE_ANGANG) {
				++checkParam.cnAnGang;
			}
		}

		//和牌方式组合&最低番数
		checkParam.nWinMode = nWinMode;
		checkParam.nMinFan = 0;

		//门风、圈风
		checkParam.nMenWind = nMenWind;
		checkParam.nQuanWind = this.m_nQuanWind;
	}
};

