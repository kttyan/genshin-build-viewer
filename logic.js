/**
 * logic.js
 * 役割：データの計算、変換、外部マスタデータ（名簿）の管理
 * 解説：APIから受け取った生のデータを、人間が見やすい形（日本語、画像URL、%表記など）に変換します。
 */

let characterMaster = null;
let localeMaster = null;

// 1. マスタデータの読み込み (Enka.Networkの辞書データ)
export async function loadMasterData() {
    try {
        const charRes = await fetch('https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/characters.json');
        characterMaster = await charRes.json();

        const locRes = await fetch('https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/loc.json');
        const locData = await locRes.json();
        // 日本語データを取得 (jpがなければja)
        localeMaster = locData['jp'] || locData['ja'] || {}; 
        console.log("✅ マスタデータ同期完了");
    } catch (e) {
        console.error("❌ マスタデータ読み込みエラー:", e);
        characterMaster = {};
        localeMaster = {};
    }
}

// 辞書ID(Hash)から日本語名を取得するヘルパー関数
function getNameFromHash(hash) {
    if (!localeMaster || !hash) return null;
    return localeMaster[String(hash)] || null;
}

// 2. キャラクター基本情報の取得
export function getCharacterInfo(avatarId) {
    const elementJapanese = {
        "Ice": "氷", "Fire": "炎", "Electric": "雷", "Wind": "風", 
        "Water": "水", "Grass": "草", "Rock": "岩"
    };

    const charData = (characterMaster && characterMaster[avatarId]) ? characterMaster[avatarId] : null;

    if (charData) {
        const jpName = getNameFromHash(charData.NameTextMapHash) || `キャラ(${avatarId})`;
        const elementKey = charData.Element || "None";
        const element = elementJapanese[elementKey] || elementKey;

        return {
            name: jpName,
            element: element,
            elementKey: elementKey, 
            sideIcon: charData.SideIconName || ""
        };
    }
    // 未実装キャラの場合
    return { name: `未登録(${avatarId})`, element: "？", elementKey: "Unknown" };
}

// 3. 基本の画像URL生成 (Enka.Network)
export function getIconUrl(iconName) {
    return iconName ? `https://enka.network/ui/${iconName}.png` : '';
}

/**
 * 属性アイコンのURL生成
 * 解説: Enkaには属性アイコンがないため、Paimon.moeの安定したリソースを使用します。
 * "Fire" -> "pyro" のようにグローバル名に変換します。
 */
export function getElementIconUrl(elementInput) {
    if (!elementInput) return '';

    const mapping = {
        // 日本語 -> 英語
        "炎": "pyro", "水": "hydro", "風": "anemo", "雷": "electro",
        "氷": "cryo", "岩": "geo", "草": "dendro",
        
        // Enka内部キー -> 英語
        "Fire": "pyro", "Water": "hydro", "Wind": "anemo", "Electric": "electro",
        "Ice": "cryo", "Rock": "geo", "Grass": "dendro",

        // 既に英語の場合
        "Pyro": "pyro", "Hydro": "hydro", "Anemo": "anemo", "Electro": "electro",
        "Cryo": "cryo", "Geo": "geo", "Dendro": "dendro"
    };

    const name = mapping[elementInput];
    if (!name) return ''; // 未登録属性の場合は画像を表示しない

    return `https://raw.githubusercontent.com/MadeBaruna/paimon-moe/main/static/images/elements/${name}.png`;
}

// 立ち絵（スプラッシュアート）のURL生成
export function getSplashArtUrl(avatarId) {
    const charData = (characterMaster && characterMaster[avatarId]) ? characterMaster[avatarId] : null;
    
    // データに直接定義されていればそれを使う
    if (charData && charData.SplashIconName) {
         return getIconUrl(charData.SplashIconName);
    }
    // 定義されていない場合、SideIconNameからファイル名を推測
    if (charData) {
        let baseName = "";
        if (charData.SideIconName) {
            baseName = charData.SideIconName.replace("UI_AvatarIcon_Side_", "");
        } else if (charData.IconName) {
            baseName = charData.IconName.replace("UI_AvatarIcon_", "");
        }
        if (baseName) {
            return getIconUrl(`UI_Gacha_AvatarImg_${baseName}`);
        }
    }
    // それでもダメなら旅人（男）
    return getIconUrl("UI_Gacha_AvatarImg_PlayerBoy");
}

// キャラアイコン（セレクター用）
export function getCharacterIconUrl(avatarId) {
    const charData = (characterMaster && characterMaster[avatarId]) ? characterMaster[avatarId] : null;
    let iconName = "UI_AvatarIcon_PlayerBoy";
    if (charData) {
        if (charData.SideIconName) iconName = charData.SideIconName.replace('_Side', '');
        else if (charData.IconName) iconName = charData.IconName;
    }
    return getIconUrl(iconName);
}

// 4. ステータスの整形
export function formatStats(propMap) {
    if (!propMap) return [];
    const defs = [
        { id: "2000", name: "最大HP", pct: false }, { id: "2001", name: "攻撃力", pct: false },
        { id: "2002", name: "防御力", pct: false }, { id: "28", name: "元素熟知", pct: false },
        { id: "20", name: "会心率", pct: true }, { id: "22", name: "会心ダメ", pct: true },
        { id: "23", name: "元チャ効率", pct: true }
    ];
    return defs.map(d => {
        const val = propMap[d.id] || 0;
        // パーセント指定がある項目は%を付ける
        return { name: d.name, value: d.pct ? (val * 100).toFixed(1) + "%" : Math.floor(val).toLocaleString() };
    });
}

// 5. 武器データの整形
export function formatWeapon(equipList) {
    const weapon = equipList.find(item => item.flat.itemType === "ITEM_WEAPON");
    if (!weapon) return null;
    
    const statNameMap = { "FIGHT_PROP_BASE_ATTACK": "基礎攻撃力", "FIGHT_PROP_ATTACK_PERCENT": "攻撃力%", "FIGHT_PROP_CRITICAL": "会心率", "FIGHT_PROP_CRITICAL_HURT": "会心ダメ", "FIGHT_PROP_CHARGE_EFFICIENCY": "元チャ", "FIGHT_PROP_ELEMENT_MASTERY": "元素熟知", "FIGHT_PROP_HP_PERCENT": "HP%", "FIGHT_PROP_DEFENSE_PERCENT": "防御力%" };
    
    const stats = weapon.flat.weaponStats.map(s => {
        const isPercent = s.appendPropId.includes("PERCENT") || s.appendPropId.includes("CRITICAL") || s.appendPropId.includes("HURT") || s.appendPropId.includes("EFFICIENCY");
        return { name: statNameMap[s.appendPropId] || s.appendPropId, value: isPercent ? `${s.statValue}%` : s.statValue };
    });
    
    return {
        name: getNameFromHash(weapon.flat.nameTextMapHash) || "武器",
        level: weapon.weapon.level,
        icon: getIconUrl(weapon.flat.icon),
        mainStat: stats[0],
        subStat: stats[1]
    };
}

// 6. 聖遺物データの整形
export function formatArtifacts(equipList) {
    if (!equipList) return [];
    const statNameMap = { "FIGHT_PROP_HP": "HP", "FIGHT_PROP_HP_PERCENT": "HP%", "FIGHT_PROP_ATTACK": "攻撃力", "FIGHT_PROP_ATTACK_PERCENT": "攻撃力%", "FIGHT_PROP_DEFENSE": "防御力", "FIGHT_PROP_DEFENSE_PERCENT": "防御力%", "FIGHT_PROP_ELEMENT_MASTERY": "元素熟知", "FIGHT_PROP_CHARGE_EFFICIENCY": "元チャ", "FIGHT_PROP_CRITICAL": "会心率", "FIGHT_PROP_CRITICAL_HURT": "会心ダメ", "FIGHT_PROP_FIRE_ADD_HURT": "炎バフ", "FIGHT_PROP_WATER_ADD_HURT": "水バフ", "FIGHT_PROP_ELEC_ADD_HURT": "雷バフ", "FIGHT_PROP_ICE_ADD_HURT": "氷バフ", "FIGHT_PROP_WIND_ADD_HURT": "風バフ", "FIGHT_PROP_ROCK_ADD_HURT": "岩バフ", "FIGHT_PROP_GRASS_ADD_HURT": "草バフ", "FIGHT_PROP_PHYSICAL_ADD_HURT": "物理バフ" };
    const slotOrder = ["EQUIP_BRACER", "EQUIP_NECKLACE", "EQUIP_SHOES", "EQUIP_RING", "EQUIP_DRESS"];
    
    return equipList
        .filter(item => item.flat.itemType === "ITEM_RELIQUARY") // 聖遺物のみ抽出
        .sort((a, b) => slotOrder.indexOf(a.flat.equipType) - slotOrder.indexOf(b.flat.equipType)) // 部位順にソート
        .map(art => {
            const ms = art.flat.reliquaryMainstat;
            const isPercent = ms.mainPropId.includes("PERCENT") || ms.mainPropId.includes("CRITICAL") || ms.mainPropId.includes("HURT") || ms.mainPropId.includes("EFFICIENCY");
            return {
                name: getNameFromHash(art.flat.setNameTextMapHash) || "聖遺物",
                level: art.reliquary.level - 1,
                mainStatName: statNameMap[ms.mainPropId] || ms.mainPropId,
                mainStatValue: isPercent ? `${ms.statValue.toFixed(1)}%` : Math.floor(ms.statValue).toLocaleString(),
                iconUrl: getIconUrl(art.flat.icon)
            };
        });
}

// 7. ユーザーアイコン取得
export function getProfileIconUrl(profilePicture) {
    if (!profilePicture) return getIconUrl("UI_AvatarIcon_PlayerBoy");
    if (profilePicture.avatarId) return getCharacterIconUrl(profilePicture.avatarId);
    return getIconUrl(`UI_AvatarIcon_Item_${profilePicture.id}`);
}

// 8. 属性ごとのテーマカラー（ダークモード用）
export function getElementColor(elementName) {
    const colors = {
        "炎": "#FF5C5C", // Pyro: 赤
        "水": "#4CC2F1", // Hydro: 水色
        "風": "#74C2A8", // Anemo: 青緑
        "雷": "#CF72FF", // Electro: 紫
        "草": "#A5C83B", // Dendro: 黄緑
        "氷": "#9FD6E3", // Cryo: 薄い水色
        "岩": "#E2B015", // Geo: 黄土色
        "物理": "#AAAAAA",
        "Unknown": "#888888"
    };
    return colors[elementName] || "#FFFFFF";
}