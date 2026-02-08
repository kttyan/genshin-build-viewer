/**
 * dashboard.js
 * 役割：イベント監視、DOM操作、HTML生成
 * 解説：ユーザーの操作を受け取り、APIからデータを取得して画面を作ります。
 */

import { fetchGenshinData } from './api.js';
import { 
    loadMasterData, getCharacterInfo, getProfileIconUrl, 
    getCharacterIconUrl, formatStats, getSplashArtUrl, formatArtifacts, 
    getElementIconUrl, formatWeapon, getElementColor 
} from './logic.js';

// --- ★設定エリア ---
// ここにUIDを入力すると、ページを開いたときに自動でセットされます
const DEFAULT_UID = '801630705'; 

// --- HTML要素の取得 ---
const uidInput = document.getElementById('uid-input');
const fetchButton = document.getElementById('fetch-button');
const statusArea = document.getElementById('status-area');
const userHeader = document.getElementById('user-header');
const charSelector = document.getElementById('character-selector');
const charDetail = document.getElementById('character-detail');
const resultContainer = document.getElementById('result-container');

// --- 初期化処理 (ページ読み込み時) ---
window.addEventListener('DOMContentLoaded', async () => {
    // まずマスタデータ（キャラ名簿など）を読み込む
    await loadMasterData();

    // デフォルトUIDがあれば入力欄に入れる
    if (DEFAULT_UID) {
        uidInput.value = DEFAULT_UID;
        
        // ★ページを開いた瞬間に自動検索する
        await executeSearch(DEFAULT_UID);
    }
});

// --- ボタンクリック時の処理 ---
fetchButton.addEventListener('click', async () => {
    const uid = uidInput.value.trim();
    if (!uid) return alert("UIDを入力してください");
    await executeSearch(uid);
});

// --- 検索実行のメイン関数 ---
async function executeSearch(uid) {
    // 画面を一旦クリア
    resultContainer.classList.add('d-none');
    userHeader.innerHTML = '';
    charSelector.innerHTML = '';
    charDetail.innerHTML = '';
    statusArea.innerHTML = '<div class="text-center my-5 text-white"><div class="spinner-border text-primary"></div><p class="mt-2">データ取得中...</p></div>';

    // APIからデータ取得
    const data = await fetchGenshinData(uid);

    if (data && data.avatarInfoList) {
        // データ取得成功
        statusArea.innerHTML = '';
        resultContainer.classList.remove('d-none');

        // 各パーツを描画
        renderUserHeader(data.playerInfo);
        renderSelector(data.avatarInfoList);
        renderDetail(data.avatarInfoList[0]); // 最初は1人目を表示
    } else {
        // データ取得失敗
        statusArea.innerHTML = '<div class="alert alert-danger">データが見つかりませんでした。ゲーム内で詳細を表示設定にしているか確認してください。</div>';
    }
}

// --- ユーザー情報の描画 ---
function renderUserHeader(playerInfo) {
    if (!playerInfo) return;
    const iconUrl = getProfileIconUrl(playerInfo.profilePicture);
    userHeader.innerHTML = `
        <div class="card border-0 mb-4 shadow-sm" style="background-color: #25252b; color: #eee;">
            <div class="card-body d-flex align-items-center">
                <img src="${iconUrl}" class="rounded-circle border border-2 border-primary shadow" style="width: 64px;">
                <div class="ms-3">
                    <h2 class="h4 mb-1">${playerInfo.nickname}</h2>
                    <div class="small text-secondary">冒険ランク ${playerInfo.level} / 世界ランク ${playerInfo.worldLevel || 0}</div>
                </div>
            </div>
        </div>
    `;
}

// --- キャラ切り替えボタンの描画 ---
function renderSelector(avatarList) {
    charSelector.innerHTML = '';
    avatarList.forEach((char, index) => {
        const btn = document.createElement('button');
        // 選択中のキャラは枠線を青くする
        btn.className = `btn p-1 rounded-circle border border-3 ${index === 0 ? 'border-info' : 'border-transparent'} transition-all`;
        btn.style.width = '70px';
        btn.innerHTML = `<img src="${getCharacterIconUrl(char.avatarId)}" class="img-fluid rounded-circle bg-dark shadow-sm">`;
        
        // クリックイベント
        btn.addEventListener('click', () => {
            // 全ボタンの枠線をリセット
            document.querySelectorAll('#character-selector button').forEach(b => {
                b.classList.remove('border-info');
                b.classList.add('border-transparent');
            });
            // 押されたボタンだけ枠線を付ける
            btn.classList.remove('border-transparent');
            btn.classList.add('border-info');
            
            // 詳細カードを更新
            renderDetail(char);
        });
        charSelector.appendChild(btn);
    });
}

// --- ★メイン：キャラ詳細カードの描画 ---
function renderDetail(char) {
    const info = getCharacterInfo(char.avatarId);
    const level = char.propMap['4001'].val;
    const stats = formatStats(char.fightPropMap);
    const artifacts = formatArtifacts(char.equipList);
    const weapon = formatWeapon(char.equipList);
    
    // 属性に応じたテーマカラーを取得
    const themeColor = getElementColor(info.element);
    
    // カラーパレット定義
    const bgColor = "#1b1b22";     // 濃い背景
    const cardBg = "#25252b";      // 少し明るい背景
    const textColor = "#e0e0e0";   // 基本文字色
    const labelColor = "#aaaaaa";  // ラベル文字色

    // HTML生成
    charDetail.innerHTML = `
        <div class="card border-0 overflow-hidden mb-4 animate__animated animate__fadeIn" 
             style="background-color: ${bgColor}; color: ${textColor}; box-shadow: 0 0 20px ${themeColor}40; border: 1px solid ${themeColor}80;">
            
            <div class="row g-0">
                <div class="col-lg-4 d-flex align-items-center justify-content-center overflow-hidden position-relative" 
                     style="min-height: 500px; background: radial-gradient(circle at center, #3a3a45 0%, ${bgColor} 100%);">
                    
                    <img src="${getElementIconUrl(info.element)}" 
                         style="position: absolute; width: 300px; opacity: 0.1; filter: grayscale(100%); pointer-events: none;"
                         onerror="this.style.display='none'">

                    <img src="${getSplashArtUrl(char.avatarId)}" 
                         style="width: 100%; height: 100%; object-fit: cover; transform: scale(1.15); z-index: 1;"
                         onerror="this.src='https://enka.network/ui/UI_Gacha_AvatarImg_PlayerBoy.png'">
                </div>

                <div class="col-lg-4 p-4 border-end border-secondary" style="background-color: ${cardBg}; border-color: #444 !important;">
                    
                    <div class="d-flex align-items-center mb-4 border-bottom pb-3" style="border-color: #444 !important;">
                        <div class="position-relative me-3">
                            <img src="${getElementIconUrl(info.element)}" 
                                 style="width: 48px; height: 48px; filter: drop-shadow(0 0 8px ${themeColor});"
                                 onerror="this.style.display='none'">
                        </div>
                        <div>
                            <h2 class="fw-bold h3 mb-1" style="color: ${themeColor}; text-shadow: 0 0 10px ${themeColor}40;">${info.name}</h2>
                            <span class="badge" style="background-color: ${themeColor}; color: #111;">Lv. ${level}</span>
                        </div>
                    </div>

                    <h6 class="fw-bold mb-3 small" style="color: ${themeColor}; letter-spacing: 1px; opacity: 0.9;">BASE STATS</h6>
                    <div class="row g-2 mb-4">
                        ${stats.map(s => `
                            <div class="col-12 d-flex justify-content-between align-items-center py-1 border-bottom" style="font-size: 0.9rem; border-color: #444 !important;">
                                <span style="color: ${labelColor};">${s.name}</span>
                                <span class="fw-bold font-monospace text-white">${s.value}</span>
                            </div>
                        `).join('')}
                    </div>

                    <h6 class="fw-bold mb-2 small" style="color: ${themeColor}; letter-spacing: 1px; opacity: 0.9;">WEAPON</h6>
                    ${weapon ? `
                    <div class="p-3 rounded-3 d-flex align-items-center" style="background-color: #303038; border: 1px solid #555;">
                        <img src="${weapon.icon}" style="width: 50px; height: 50px; background-color: #444;" class="me-3 rounded shadow-sm">
                        <div class="flex-grow-1 overflow-hidden">
                            <div class="fw-bold text-white text-truncate mb-1">${weapon.name}</div>
                            <div class="d-flex justify-content-between small">
                                <span style="color: ${themeColor}; font-weight: bold;">${weapon.mainStat.name} ${weapon.mainStat.value}</span>
                                <span style="color: ${labelColor};">Lv.${weapon.level}</span>
                            </div>
                            <div class="small mt-1" style="color: #ddd;">
                                ${weapon.subStat ? `${weapon.subStat.name} <span class="fw-bold text-white">${weapon.subStat.value}</span>` : ''}
                            </div>
                        </div>
                    </div>` : '<div class="text-muted small">武器情報なし</div>'}
                </div>

                <div class="col-lg-4 p-4" style="background-color: ${bgColor};">
                    <h6 class="fw-bold mb-3 small" style="color: ${themeColor}; letter-spacing: 1px; opacity: 0.9;">ARTIFACTS</h6>
                    <div class="d-flex flex-column gap-2">
                        ${artifacts.map(art => `
                            <div class="p-2 px-3 rounded-3 d-flex align-items-center position-relative overflow-hidden" 
                                 style="background-color: #2a2a32; border-left: 4px solid ${themeColor}; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                                <img src="${art.iconUrl}" style="width: 42px; height: 42px; background-color: #333;" class="me-3 rounded-circle border border-secondary">
                                <div class="flex-grow-1" style="min-width: 0;">
                                    <div class="fw-bold text-white text-truncate small mb-1">${art.name}</div>
                                    <div class="d-flex align-items-center">
                                        <span class="badge bg-dark border border-secondary text-secondary me-2" style="font-size: 0.6rem;">+${art.level}</span>
                                        <span style="color: ${themeColor}; font-size: 0.75rem; font-weight: bold;">${art.mainStatName}</span>
                                    </div>
                                </div>
                                <div class="text-end ps-2">
                                    <div class="fw-bold font-monospace fs-5 text-white">${art.mainStatValue.replace('%','<small>%</small>')}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}