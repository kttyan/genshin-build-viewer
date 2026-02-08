/**
 * api.js
 * 役割：Enka.Network APIからデータを取得する (CORS & キャッシュ対策済み)
 */

const API_BASE_URL = 'https://enka.network/api/uid';
// 信頼性の高いCORSプロキシを使用
const PROXY_URL = 'https://api.allorigins.win/get?url=';

export async function fetchGenshinData(uid) {
    try {
        // キャッシュを回避するために、URLの末尾に毎回違う数字（タイムスタンプ）を付け足します
        const targetUrl = encodeURIComponent(`${API_BASE_URL}/${uid}?t=${Date.now()}`);
        
        console.log("🚀 リクエスト送信中...");
        const response = await fetch(`${PROXY_URL}${targetUrl}`);

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const json = await response.json();
        
        // プロキシから返ってきたデータの中身(contents)を取り出す
        if (!json.contents) throw new Error("APIからの応答が空です");
        
        return JSON.parse(json.contents);
        
    } catch (error) {
        console.error("❌ API取得エラー:", error);
        return null;
    }
}
