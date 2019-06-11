const Define = require('../base/commonDefine');
const _ = require('lodash');
class CQuadrantTree {
	constructor() {
		this.MAXNODES = 341;
		this.LEFT1CHILD = 0;
		this.LEFT2CHILD = 1;
		this.LEFT3CHILD = 2;
		this.m_asNode = [];
		this.m_anLeafIndex = new Array(256);		// 最终成功的叶结点数组
		this.m_cnPath = 0;				// 从根结点到叶节点的路径数
	}
	// **************************************************************************************
	//
	// 初始化四叉树
	//
	// **************************************************************************************

	Init() {
		for (let i = 0; i < 256; i++) {
			this.m_anLeafIndex[i] = 0;
		}
		for (let i = 0; i < this.MAXNODES; i++) {
			this.m_asNode[i] = new Define.stoneGroup();
		}
		this.m_cnPath = 0;
	}

	// **************************************************************************************
	//
	// 构造四叉树
	// 传进来的麻将牌数组默认普通牌在前，混牌在后
	//
	// **************************************************************************************
	Create(sRoot, asStone, cnNormalStone, cnHun) {
		this.Init();
		// 根结点
		this.m_asNode[0] = sRoot;

		if (cnNormalStone + cnHun == 0) {
			// 单钓，只有一对将
			this.m_cnPath = 1;

			return true;
		}

		// 为避免出现重复的情况，在剩下的牌全是混时在本层下面构造一个左叶子结点，立即返回
		if (cnNormalStone == 0) {
			// 最多只会有5个混，在已有将的情况下，混的个数只能是3的整数倍
			this.CreateHunLeaf(1, asStone, 0);
			return true;
		}

		console.log("1111111111111111110:CreateLeftChild" + JSON.stringify(asStone))
		let bSuccess = this.CreateLeftChild(0, this.LEFT1CHILD, asStone, cnNormalStone, cnHun);
		console.log("1111111111111111111:CreateLeftChild" + bSuccess + JSON.stringify(asStone))
		let bsus = this.CreateLeftChild(0, this.LEFT2CHILD, asStone, cnNormalStone, cnHun);
		bSuccess |= bsus;
		console.log("1111111111111111112:CreateLeftChild" + bsus + JSON.stringify(asStone))
		let bus1 = this.CreateLeftChild(0, this.LEFT3CHILD, asStone, cnNormalStone, cnHun);
		bSuccess |= bus1;
		console.log("1111111111111111113:CreateRightChild" + bus1 + JSON.stringify(asStone))
		let bus2 = this.CreateRightChild(0, asStone, cnNormalStone, cnHun);
		bSuccess |= bus2;
		console.log("1111111111111111114:CreateRightChild" + bus1 + JSON.stringify(asStone))
		return bSuccess;
	}

	// **************************************************************************************
	//
	// 获得一条从根结点到叶节点的路径
	//
	// **************************************************************************************
	GetPath(nPathIndex, asGroup, idx) {
		let cnGroup = idx;
		let nIndex = this.m_anLeafIndex[nPathIndex];
		while (nIndex > 0) {
			console.log("ppppppppppppppppppppppp" + nIndex + ":::" + JSON.stringify(this.m_asNode[nIndex]))
			asGroup[cnGroup] = _.cloneDeep(this.m_asNode[nIndex]);
			nIndex = (nIndex - 1) >> 2;
			cnGroup++;
		}

		// 再将根结点拷进去
		asGroup[cnGroup] = _.cloneDeep(this.m_asNode[0]);
		//console.log("ppppppppppppppppppppppptt"+JSON.stringify(asGroup))
		////console.log("mmmmmmmm_anLeafIndex:"+JSON.stringify(this.m_anLeafIndex)+":::this.m_asNode:"+JSON.stringify(this.m_asNode))
		return true;
	}

	// **************************************************************************************
	//
	// 构造左边的三棵子树( 顺 )，nChild指明构造第几棵子树
	// 第n棵子树取第一个牌作为顺的第n张
	//
	// **************************************************************************************
	CreateLeftChild(nParentIndex, nChild, asStone, cnNormalStone, cnHun) {
		if (asStone[0].nColor >= 3) {
			// 风牌箭牌肯定不能配成顺
			return false;
		}

		// 当前结点下标
		let nIndex = (nParentIndex << 2) + nChild + 1;
		// 初始化当前要用到的结点
		this.m_asNode[nIndex] = new Define.stoneGroup();

		// 顺余牌数组
		let asSpareStone = [];
		for (let i = 0; i < Define.MAX_HAND_COUNT - 3; i++) {

			////console.log("aaaaaaaaaaaaaaaaaaaaaaa"+Judge.Define.stoneObj)
			asSpareStone[i] = new Define.stoneObj();
			////console.log("ssssssssssssssssssssss")
		}

		let cnSpareStone = cnNormalStone;
		let cnSpareHun = cnHun;	// 剩余的混
		let cbdata = this.CreateShun(asStone, cnSpareStone, cnSpareHun, nChild, this.m_asNode[nIndex], asSpareStone);
		if (!cbdata) {
			return false;
		}
		cnSpareStone = cbdata.cnNormalStone;
		cnSpareHun = cbdata.cnHun;

		//console.log("kkkkkkkkkkkkkkkkkkk:"+cnSpareStone)
		// 本层成功
		if (cnSpareStone + cnSpareHun >= 3) {
			// 为避免出现重复的情况，在剩下的牌全是混时在本层下面构造一个左叶子结点，立即返回
			if (cnSpareStone == 0) {
				// 最多只会有5个混，在已有将的情况下，混的个数只能是3的整数倍
				this.CreateHunLeaf((nIndex << 2) + 1, asStone, cnNormalStone);
				return true;
			}

			//console.log("ssffffffffffffffff1"+cnSpareStone)
			let bSuccess = this.CreateLeftChild(nIndex, this.LEFT1CHILD,
				asSpareStone, cnSpareStone, cnSpareHun);
			//console.log("ssffffffffffffffff2:"+bSuccess+":"+cnSpareStone)
			bSuccess |= this.CreateLeftChild(nIndex, this.LEFT2CHILD,
				asSpareStone, cnSpareStone, cnSpareHun);
			//console.log("ssffffffffffffffff3:"+bSuccess+":"+cnSpareStone)
			bSuccess |= this.CreateLeftChild(nIndex, this.LEFT3CHILD,
				asSpareStone, cnSpareStone, cnSpareHun);
			//console.log("ssffffffffffffffff4:"+bSuccess+":"+cnSpareStone)
			bSuccess |= this.CreateRightChild(nIndex, asSpareStone, cnSpareStone, cnSpareHun);
			//console.log("ssffffffffffffffff15:"+bSuccess+":"+cnSpareStone)
			return bSuccess;
		}
		else {
			console.log("ssssdsdsdsfsafafafagg:" + cnSpareStone + "::" + cnSpareHun + ":::" + JSON.stringify(asSpareStone))
			// 没牌了，本条路径可行
			this.m_anLeafIndex[this.m_cnPath] = nIndex;
			this.m_cnPath++;
		}

		return true;
	}

	// **************************************************************************************
	//
	// 构造右子树(刻)
	//
	// **************************************************************************************
	CreateRightChild(nParentIndex, asStone, cnNormalStone, cnHun) {
		// 当前结点下标
		let nIndex = (nParentIndex << 2) + 4;

		// 顺余牌数组
		let asSpareStone = [];
		for (let j = 0; j < Define.MAX_HAND_COUNT - 3; j++) {
			asSpareStone[j] = new Define.stoneObj();
		}
		let cnSpareStone = cnNormalStone;
		let cnSpareHun = cnHun;	// 剩余的混

		// 初始化当前要用到的结点
		this.m_asNode[nIndex] = new Define.stoneGroup();
		this.m_asNode[nIndex].nGroupStyle = Define.GROUP_STYLE_KE;
		this.m_asNode[nIndex].asStone[0] = _.cloneDeep(asStone[0]);

		let cnSameStone = 1;
		let i = 1;
		for (i = 1; i < cnNormalStone; i++) {
			if (asStone[0].nColor != asStone[i].nColor || asStone[0].nWhat != asStone[i].nWhat) {
				// 都是不相干的牌了
				break;
			}
			this.m_asNode[nIndex].asStone[cnSameStone] = _.cloneDeep(asStone[i]);
			cnSameStone++;
			if (cnSameStone == 3) {
				// 已找到3张了
				i++;// 指向下一张，方便统一处理，因为在上面的break出口，i 是指向下一张的
				break;
			}
		}

		let perdata = this.PerfectGroup(this.m_asNode[nIndex], 0, asStone + cnNormalStone, cnSpareHun);
		if (!perdata.mark) {
			return false;
		}
		cnSpareHun = perdata.Hun;
		// 本层成功，剩下的牌应该是中间的几张
		cnSpareStone -= cnSameStone;
		if (cnSpareStone + cnSpareHun >= 3) {
			// 为避免出现重复的情况，在剩下的牌全是混时在本层下面构造一个左叶子结点，立即返回
			if (cnSpareStone == 0) {
				// 最多只会有5个混，在已有将的情况下，混的个数只能是3的整数倍
				this.CreateHunLeaf((nIndex << 2) + 1, asStone, cnNormalStone);
				return true;
			}
			//console.log("ggggggggg"+JSON.stringify(asSpareStone))
			Define._memcpy(asSpareStone, 0, asStone, i, (cnSpareStone + cnSpareHun));

			let bSuccess = this.CreateLeftChild(nIndex, this.LEFT1CHILD,
				asSpareStone, cnSpareStone, cnSpareHun);
			bSuccess |= this.CreateLeftChild(nIndex, this.LEFT2CHILD,
				asSpareStone, cnSpareStone, cnSpareHun);
			bSuccess |= this.CreateLeftChild(nIndex, this.LEFT3CHILD,
				asSpareStone, cnSpareStone, cnSpareHun);
			bSuccess |= this.CreateRightChild(nIndex, asSpareStone, cnSpareStone, cnSpareHun);
			return bSuccess;
		}
		else {
			// 没牌了，本条路径可行
			this.m_anLeafIndex[this.m_cnPath] = nIndex;
			this.m_cnPath++;
		}

		return true;
	}

	// **************************************************************************************
	//
	// 构造一个全是混的叶子结点
	//
	// **************************************************************************************
	CreateHunLeaf(nLeafIndex, asHun, idx) {
		this.m_asNode[nLeafIndex].nGroupStyle = Define.GROUP_STYLE_HUN;
		Define._memcpy(this.m_asNode[nLeafIndex].asStone, 0, asHun, idx, 3);
		this.m_anLeafIndex[this.m_cnPath] = nLeafIndex;
		this.m_cnPath++;
	}

	// **************************************************************************************
	//
	// 给定一个牌数组，以这个牌数组的第一张牌为基础，构造一个顺牌分组，nBaseIndex指明第一张牌
	// 在这个分组里要放置的位置
	//
	// **************************************************************************************
	CreateShun(asStone, cnNormalStone, cnHun, nBaseIndex, sGroup, asSpareStone) {
		console.log("sssssssCreateShun:" + JSON.stringify(asStone) + ":" + cnNormalStone + ":" + cnHun);
		////console.log("bggggggggggggggg:"+JSON.stringify(asStone));
		// 因为asStone里的牌是从小到大排列的，如果取第一张作为顺的第二或第三张，必然要用混来补充
		if (nBaseIndex > cnHun) {
			// nBaseIndex == 2 则要求 cnHun >= 2，nBaseIndex == 1 则要求 cnHun >= 1
			return false;
		}

		if (asStone[0].nWhat == Define.STONE_NO8 && nBaseIndex == 0 // 第一张牌是8，不能作顺的第一张
			|| asStone[0].nWhat == Define.STONE_NO9 && nBaseIndex < 2// 第一张牌是9，只能作顺的第三张
			|| asStone[0].nWhat == Define.STONE_NO1 && nBaseIndex > 0// 第一张牌是1，只能作顺的第一张
			|| asStone[0].nWhat == Define.STONE_NO2 && nBaseIndex == 2)// 第一张牌是2，不能作顺的第三张
		{
			return false;
		}

		sGroup.nGroupStyle = Define.GROUP_STYLE_SHUN;
		sGroup.asStone[nBaseIndex] = asStone[0];
		let cnScrapStone = 0;

		// 如果取第一张作顺的第三张，不用找了，直接用混填充
		////console.log("sssssssssssssss0a:"+cnNormalStone+":"+JSON.stringify(sGroup))
		let i = 1; // 循环结束后i指向剩下的第一张牌
		if (nBaseIndex != 2) {
			for (i = 1; i < cnNormalStone; i++) {
				if (asStone[i].nColor != asStone[0].nColor) {
					// 后面都是不相干的牌了
					// 这个时候i指向的这个牌是剩下的第一个无用的牌
					break;
				}
				let nDiff = asStone[i].nWhat - asStone[0].nWhat;
				if (nDiff > (2 - nBaseIndex)) {
					// 后面都是不相干的牌了
					// 这个时候i指向的这个牌是剩下的第一个无用的牌
					break;
				}

				// 这张牌满足要求
				let nIndex = nBaseIndex + nDiff;
				////console.log("ssssssssssssssakas"+nBaseIndex+":"+nIndex+":"+JSON.stringify(sGroup))
				if (sGroup.asStone[nIndex].nID == 0) {
					// 拷到分组里
					sGroup.asStone[nIndex] = asStone[i];
					////console.log("hhhhhhhh:"+nIndex+":"+JSON.stringify(sGroup))
				}
				else {
					// 已经有这张牌了，拷到剩余牌数组里
					asSpareStone[cnScrapStone] = asStone[i];
					cnScrapStone++;
					////console.log("hhhhhhhh1:"+nIndex+":"+JSON.stringify(asSpareStone))
				}

				if (nIndex == 2) {
					// 最后一张牌也找到了，跳出
					// 这个时候i+1指向的牌才是剩下的第一个无用的牌
					////console.log("hhhhhhhh2:")
					i++;
					break;
				}
			}
		}
		else {
			// 没经过循环，i指向第二张牌（第一张牌已被用掉了），下面会将用不到的牌拷出去
			//i = 0;
			i = 1;
		}

		// 如果这个分组缺牌，用混填充
		let cnScrapHun = cnHun;	// 剩下的混数
		let asHun = [];
		Define._memcpy(asHun, 0, asStone, cnNormalStone, (asStone.length - cnNormalStone - 1));
		let perdata = this.PerfectGroup(sGroup, nBaseIndex, asHun, cnScrapHun)
		if (!perdata.mark) {
			return false;
		}
		cnScrapHun = perdata.Hun;

		// 终于分好了，剩下的牌应该是中间的几张
		Define._memcpy(asSpareStone, cnScrapStone, asStone, i /*+ 1*/, (cnNormalStone + cnHun - i/* - 1 */));

		// 剩下的普通牌数 = 原普通牌数 - 3 + 用掉的混数
		cnNormalStone = cnNormalStone - 3 + cnHun - cnScrapHun;
		////console.log("nnnnnnnnnnnn:"+cnNormalStone);
		cnHun = cnScrapHun;
		console.log("sssssssCreateShun1:" + JSON.stringify(sGroup) + ":::" + JSON.stringify(asSpareStone));
		return { cnNormalStone: cnNormalStone, cnHun: cnHun };

		/*	下面的代码在for( i = 1; i < cnNormalStone; i++ )这个循环有三个跳出点，前两个跳出点和
		 第三个跳出点i所指向的牌不同，前两个跳出点i指向剩下的第一个无用的牌，而第三个跳出点i+1
		 指向的才是第一个无用的牌，而且，if ( nBaseIndex != 2 )的else分支为i赋值跟第三个跳出
		 点相同。
		 memcpy( asSpareStone + cnScrapStone, asStone + i + 1, ( cnNormalStone + cnHun - i - 1 ) * sizeof( Define.stoneObj ) );
		 这条语句是相对于第三个跳出点的处理，所以出错
	
		 ASSERT( cnNormalStone > 0 && nBaseIndex >= 0 && nBaseIndex < 3 );
	
		 // 因为asStone里的牌是从小到大排列的，如果取第一张作为顺的第二或第三张，必然要用混来补充
		 if ( nBaseIndex > cnHun )
		 {
		 // nBaseIndex == 2 则要求 cnHun >= 2，nBaseIndex == 1 则要求 cnHun >= 1
		 return false;
		 }
	
		 sGroup.nGroupStyle = GROUP_STYLE_SHUN;
		 sGroup.asStone[nBaseIndex] = asStone[0];
		 let cnScrapStone = 0;
	
		 // 如果取第一张作顺的第三张，不用找了，直接用混填充
		 let i = 1; // 循环结束后i指向找到的最后一张牌
		 if ( nBaseIndex != 2 )
		 {
		 for( i = 1; i < cnNormalStone; i++ )
		 {
		 if ( asStone[i].nColor != asStone[0].nColor )
		 {
		 // 后面都是不相干的牌了
		 break;
		 }
		 let nDiff = asStone[i].nWhat - asStone[0].nWhat;
		 if ( nDiff > ( 2 - nBaseIndex ) )
		 {
		 // 后面都是不相干的牌了
		 break;
		 }
	
		 // 这张牌满足要求
		 let nIndex = nBaseIndex + nDiff;
		 if ( sGroup.asStone[nIndex].nID == 0 )
		 {
		 // 拷到分组里
		 sGroup.asStone[nIndex] = asStone[i];
		 }
		 else
		 {
		 // 已经有这张牌了，拷到剩余牌数组里
		 asSpareStone[cnScrapStone] = asStone[i];
		 cnScrapStone++;
		 }
	
		 if ( nIndex == 2 )
		 {
		 // 最后一张牌也找到了，跳出
		 break;
		 }
		 }
		 }
		 else
		 {
		 // 没经过循环，i指向第一张牌，下面会将用不到的牌拷出去
		 i = 0;
		 }
	
		 // 如果这个分组缺牌，用混填充
		 let cnScrapHun = cnHun;	// 剩下的混数
		 if ( !this.PerfectGroup( sGroup, nBaseIndex, asStone + cnNormalStone, cnScrapHun ) )
		 {
		 // 失败，这个分组无法填充完整
		 return false;
		 }
	
		 // 终于分好了，剩下的牌应该是中间的几张
		 memcpy( asSpareStone + cnScrapStone, asStone + i + 1,
		 ( cnNormalStone + cnHun - i - 1 ) * sizeof( Define.stoneObj ) );
		 // 剩下的普通牌数 = 原普通牌数 - 3 + 用掉的混数
		 cnNormalStone = cnNormalStone -  3 + cnHun - cnScrapHun;
		 cnHun = cnScrapHun;
	
		 return true;
		 */
	}


	// **************************************************************************************
	//
	// 是否一个完备的分组，如果不完备，在需要的地方补充混
	//
	// **************************************************************************************
	PerfectGroup(sGroup, nBaseIndex, asHun, cnHun) {
		for (let i = 0; i < 3; i++) {
			if (i == nBaseIndex) {
				continue;
			}
			if (sGroup.asStone[i].nID == 0) {
				if (cnHun == 0) {
					return { mark: false, Hun: cnHun };
				}
				// 在最后面取一张混
				cnHun--;
				sGroup.asStone[i] = _.cloneDeep(asHun[cnHun]);
				// 将这张混变成需要的牌
				sGroup.asStone[i].nColor = sGroup.asStone[nBaseIndex].nColor;
				if (sGroup.nGroupStyle == Define.GROUP_STYLE_SHUN) {
					sGroup.asStone[i].nWhat = sGroup.asStone[nBaseIndex].nWhat + i - nBaseIndex;
				}
				else {
					sGroup.asStone[i].nWhat = sGroup.asStone[nBaseIndex].nWhat;
				}
			}
		}
		//console.log("ggggggggggg:"+JSON.stringify(sGroup));
		return { mark: true, Hun: cnHun };
	}

	GetPathCount() {
		return this.m_cnPath;
	}

}; 
module.exports = CQuadrantTree;
