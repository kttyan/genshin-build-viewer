/**
 * api.js
 * 役割：Enka.Network APIからデータを取得する
 */

const API_BASE_URL = 'https://enka.network/api/uid';
// CORSエラーを回避するための中継プロキシサーバー
const PROXY_URL = 'https://api.allorigins.win/get?url=';

export async function fetchGenshinData(uid) {
    try {
        // 本来のアドレスをエンコードしてプロキシに渡す
        const targetUrl = encodeURIComponent(`${API_BASE_URL}/${uid}`);
        const response = await fetch(`${PROXY_URL}${targetUrl}`);

        if (!response.ok) {
            console.error(`API Error: ${response.status}`);
            return null;
        }

        // AllOrigins経由の場合、データは contents というキーの中に文字列として入っています
        const json = await response.json();
        
        // 文字列として返ってきた中身をJSONオブジェクトに変換して返す
        return JSON.parse(json.contents);
        
    } catch (error) {
        console.error("Network Error (CORS or API down):", error);
        return null;
    }
}
