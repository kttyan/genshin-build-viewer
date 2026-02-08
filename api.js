/**
 * api.js
 * 役割：Enka.Network APIからデータを取得する (リトライ & 複数プロキシ対応版)
 */

const API_BASE_URL = 'https://enka.network/api/uid';

// 予備を含めたプロキシリスト（1つ目がダメなら次を試す）
const PROXIES = [
    'https://api.allorigins.win/get?url=',
    'https://corsproxy.io/?'
];

export async function fetchGenshinData(uid) {
    // 成功するまで最大3回トライする
    for (let i = 0; i < 3; i++) {
        try {
            // キャッシュ回避用のタイムスタンプ
            const targetUrl = `${API_BASE_URL}/${uid}?t=${Date.now()}`;
            
            // ループごとに使うプロキシを変える
            const proxy = PROXIES[i % PROXIES.length];
            const finalUrl = proxy.includes('allorigins') 
                ? `${proxy}${encodeURIComponent(targetUrl)}` 
                : `${proxy}${targetUrl}`;

            console.log(`🚀 検索試行 ${i + 1}回目...`);

            // タイムアウト（8秒）を設定して、遅すぎる場合は諦めて次に進む
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(finalUrl, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error("HTTPエラー");

            const data = await response.json();
            
            // alloriginsの場合は中身を取り出す、corsproxyの場合はそのまま
            const result = data.contents ? JSON.parse(data.contents) : data;
            
            console.log("✅ 取得成功！");
            return result;

        } catch (error) {
            console.warn(`⚠️ 試行 ${i + 1}回目失敗:`, error.message);
            // 3回目もダメだったら終了
            if (i === 2) {
                console.error("❌ 全てのリトライが失敗しました。");
                return null;
            }
            // 次の試行まで少し待つ（0.5秒）
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
}
