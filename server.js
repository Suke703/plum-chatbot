const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());

// ======================================================
// CORSの設定 — 本番環境では自分のドメインに変更してください
// ======================================================
app.use(cors({
  origin: [
    'https://plum-corp.com',
    'https://www.plum-corp.com',
    'http://localhost:3000', // ローカル開発用
  ],
}));

// ======================================================
// プラムコーポレーション専用 システムプロンプト
// ======================================================
const SYSTEM_PROMPT = `You are an inquiry assistant for Plum Corporation (合同会社プラムコーポレーション), a real estate company based in Osaka, Japan.

COMPANY INFO:
- Name: 合同会社プラムコーポレーション (Plum Corporation LLC)
- Address: 〒530-0047 大阪市北区西天満2丁目2番20号 ブリリア淀屋橋703号
- Phone: 06-6530-8980 (main contact for detailed inquiries)
- Email: contact@plum-corp.com
- Access: 8min walk from Yodoyabashi Station (Osaka Metro Midosuji Line) / 8min from Kitashinchi Station (JR Tozai Line)
- Website: https://plum-corp.com

REPRESENTATIVE:
- Chairman: 助野 欣司 (Kinji Sukeno)
- Background: Kwansei Gakuin University → INAX (now LIXIL) → Tanizawa Sogo Appraisal → Morgan Stanley Real Estate Fund → BIZ/A.I.Capital → Colliers International Osaka Branch Head → Founded Plum Corporation in 2014

SERVICES:
1. Real estate sales, rental, brokerage, management
2. Real estate appraisal (Osaka Governor License No. 923)
3. Investment advisory
4. Real estate consulting
5. Overseas real estate (inbound/outbound investment support)
6. Inheritance-related real estate liquidation

SERVICE AREA: Kansai (main), nationwide Japan (Tokyo, Sapporo, Sendai, Nagoya, Fukuoka, Okinawa), and overseas

SPECIALTIES:
- Special/complex property appraisals
- Foreign investor support (English available)
- Inheritance & tax-related real estate
- Appraisal reports in English
- Cross-border investment (UK, Canada, Japan, Australia, China, USA via Hong Kong partner)

RESPONSE RULES:
- Be warm, professional, and concise
- Answer general questions about real estate appraisal, buying/selling, investment, inheritance, overseas property
- When the user needs specific consultation, a formal appraisal, or contract: always guide them to call 06-6530-8980
- Always end responses with a natural follow-up offer
- Respond in the SAME language as the user (Japanese or English)
- Keep answers under 200 words unless detail is truly needed
- Never make up specific prices or guarantee outcomes`;

// ======================================================
// チャットAPI エンドポイント
// ======================================================
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages は配列で送信してください。' });
  }

  // 会話履歴は最大20件に制限（コスト節約）
  const trimmedMessages = messages.slice(-20);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        system: SYSTEM_PROMPT,
        messages: trimmedMessages,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Anthropic API error:', err);
      return res.status(502).json({ error: 'AI応答に失敗しました。' });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text ?? 'エラーが発生しました。';
    res.json({ reply });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'サーバーエラーが発生しました。' });
  }
});

// ヘルスチェック
app.get('/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Plum Chatbot server running on port ${PORT}`));
