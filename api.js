/**
 * api.js
 * 役割：Enka.Network APIからデータを取得する
 */

const API_BASE_URL = 'https://enka.network/api/uid';

export async function fetchGenshinData(uid) {
    try {
        // UIDを使ってAPIリクエストを送信
        const response = await fetch(`${API_BASE_URL}/${uid}`);

        // エラーチェック (404:見つからない, 500:サーバーエラーなど)
        if (!response.ok) {
            console.error(`API Error: ${response.status}`);
            return null;
        }

        // データをJSON形式で受け取る
        const data = await response.json();
        return data;
    } catch (error) {
        // 通信エラーなどの場合
        console.error("Network Error:", error);
        return null;
    }
}