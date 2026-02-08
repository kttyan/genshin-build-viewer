/**
 * api.js
 * 役割：Enka.Network APIからデータを取得する
 */

const API_BASE_URL = 'https://enka.network/api/uid';
const PROXY_URL = 'https://api.allorigins.win/get?url=';

export async function fetchGenshinData(uid) {
    try {
        // 本来のアドレスをエンコードしてプロキシに渡す
        const targetUrl = encodeURIComponent(`${API_BASE_URL}/${uid}`);
        // UIDを使ってAPIリクエストを送信
        const response = await fetch(`${API_BASE_URL}/${uid}`);

        // エラーチェック (404:見つからない, 500:サーバーエラーなど)
        if (!response.ok) {
            console.error(`API Error: ${response.status}`);
            return null;
        }
        // AllOrigins経由の場合、データは contents というキーの中に文字列として入っています
        const json = await response.json();
        // 文字列として返ってきた中身をJSONオブジェクトに変換して返す
        return JSON.parse(json.contents);
        
    } catch (error) {
        // 通信エラーなどの場合
        console.error("Network Error:", error);
        return null;
    }

}
