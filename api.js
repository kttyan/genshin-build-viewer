/**
 * api.js
 * 役割：Enka.Network APIとの安定した非同期通信の管理
 */

// Enka.Networkの公式APIエンドポイント
const API_BASE_URL = 'https://enka.network/api/uid';

// 利用するCORSプロキシのリスト（1つ目が混雑している場合に備え、予備を用意）
const PROXIES = [
    'https://api.allorigins.win/get?url=', // 汎用プロキシ
    'https://corsproxy.io/?'               // 予備の高速プロキシ
];

/**
 * 指定されたUIDのプレイヤーデータを取得する
 * @param {string} uid - 原神のゲーム内UID
 * @returns {Object|null} 取得したデータ。失敗時はnull。
 */
export async function fetchGenshinData(uid) {
    const MAX_RETRIES = 3; // 最大リトライ回数

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            // 【キャッシュ対策】URLの末尾に現在の時刻を付与し、ブラウザが古いデータを使い回すのを防ぐ
            const targetUrl = `${API_BASE_URL}/${uid}?t=${Date.now()}`;
            
            // 【プロキシ選択】ループ回数に応じて使用するプロキシを切り替える（i=0は1つ目、i=1は2つ目...）
            const proxy = PROXIES[i % PROXIES.length];
            
            // プロキシごとに異なるURL組み立て方式に対応
            const finalUrl = proxy.includes('allorigins') 
                ? `${proxy}${encodeURIComponent(targetUrl)}` 
                : `${proxy}${targetUrl}`;

            console.log(`🚀 検索試行 ${i + 1}回目... (${proxy.split('/')[2]})`);

            // 【タイムアウト設定】8秒以上かかる場合は「応答なし」と判断して中断する
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            // 通信実行
            const response = await fetch(finalUrl, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

            // データの解析
            const rawData = await response.json();
            
            // 【プロキシごとのデータ抽出】
            // AllOrigins経由の場合は 'contents' プロパティ内にJSON文字列が入っているため、それをパース
            // 他のプロキシの場合は、そのままデータとして使用
            const result = rawData.contents ? JSON.parse(rawData.contents) : rawData;
            
            console.log("✅ データの取得に成功しました！");
            return result;

        } catch (error) {
            // エラーが発生した場合は警告を表示し、次のリトライ（または終了）へ進む
            console.warn(`⚠️ 試行 ${i + 1}回目が失敗しました:`, error.message);

            if (i === MAX_RETRIES - 1) {
                console.error("❌ 全てのリトライに失敗しました。ネットワーク環境やAPIの状態を確認してください。");
                return null;
            }

            // 【待機】次のリトライまで0.5秒間待つ
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
}
