const path = require('path');
const { rooms } = require('../state');

function registerAdminRoutes(app) {
    // ============================================
    // 🛡️ ADMIN DASHBOARD
    // ============================================
    app.get('/admin', (req, res) => {
        const roomList = Object.entries(rooms).map(([code, room]) => ({
            code,
            state: room.state,
            players: room.players.length,
            bots: room.players.filter(p => p.isBot).length,
            humans: room.players.filter(p => !p.isBot).length,
            round: room.currentRound,
            totalRounds: room.totalRounds,
            gameMode: room.gameMode || 'CLASSIC',
            isTutorial: !!room.isTutorial
        }));

        const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>لوحة المشرف — PLOT</title>
<style>
  body { background:#111; color:#E8DCC8; font-family:monospace; padding:24px; }
  h1 { color:#DAA520; border-bottom:1px solid #333; padding-bottom:8px; }
  .stats { display:flex; gap:16px; margin:16px 0; flex-wrap:wrap; }
  .stat { background:#1A1A1A; border:1px solid #333; padding:12px 20px; border-radius:4px; }
  .stat-val { font-size:2em; color:#DAA520; font-weight:bold; }
  .stat-lbl { font-size:0.75em; color:#888; }
  table { width:100%; border-collapse:collapse; margin-top:16px; }
  th { background:#1A1A1A; color:#DAA520; padding:8px 12px; text-align:right; font-size:0.85em; }
  td { padding:8px 12px; border-bottom:1px solid #222; font-size:0.9em; }
  tr:hover td { background:#1A1A1A; }
  .state { padding:2px 8px; border-radius:3px; font-size:0.8em; }
  .LOBBY { background:#2A4A2A; color:#6BC46B; }
  .PLAYING,.DRAFTING,.DISCUSSION,.QUALITY_VOTING,.CULPRIT_VOTING,.DRAMATIC_REVEAL { background:#4A3A1A; color:#DAA520; }
  .END { background:#1A1A2A; color:#6B6BBC; }
  .RESULTS { background:#3A1A1A; color:#C46B6B; }
  .refresh { background:#DAA520; color:#111; border:none; padding:8px 16px; cursor:pointer; border-radius:3px; margin-top:8px; }
  .empty { text-align:center; color:#555; padding:40px; }
  .tutorial { color:#888; font-size:0.8em; margin-right:4px; }
</style>
</head>
<body>
<h1>◈ لوحة المشرف — PLOT ◈</h1>
<button class="refresh" onclick="location.reload()">⟳ تحديث</button>

<div class="stats">
  <div class="stat"><div class="stat-val">${roomList.length}</div><div class="stat-lbl">غرف نشطة</div></div>
  <div class="stat"><div class="stat-val">${roomList.reduce((s, r) => s + r.humans, 0)}</div><div class="stat-lbl">لاعبون بشريون</div></div>
  <div class="stat"><div class="stat-val">${roomList.reduce((s, r) => s + r.bots, 0)}</div><div class="stat-lbl">بوتات</div></div>
  <div class="stat"><div class="stat-val">${roomList.filter(r => r.state !== 'LOBBY' && r.state !== 'END').length}</div><div class="stat-lbl">ألعاب جارية</div></div>
</div>

${roomList.length === 0 ? '<div class="empty">لا توجد غرف نشطة حالياً</div>' : `
<table>
<tr><th>الكود</th><th>الوضع</th><th>الحالة</th><th>الجولة</th><th>لاعبون</th><th>بوتات</th></tr>
${roomList.map(r => `<tr>
<td><b>${r.code}</b>${r.isTutorial ? '<span class="tutorial">(تدريب)</span>' : ''}</td>
<td>${r.gameMode}</td>
<td><span class="state ${r.state}">${r.state}</span></td>
<td>${r.round}/${r.totalRounds}</td>
<td>${r.humans}</td>
<td>${r.bots}</td>
</tr>`).join('')}
</table>`}

<p style="color:#444;font-size:0.75em;margin-top:24px">آخر تحديث: ${new Date().toLocaleTimeString('ar-SA')}</p>
</body></html>`;

        res.send(html);
    });

    // Admin JSON API
    app.get('/admin/api/rooms', (req, res) => {
        const data = Object.entries(rooms).map(([code, room]) => ({
            code,
            state: room.state,
            gameMode: room.gameMode,
            round: room.currentRound,
            totalRounds: room.totalRounds,
            isTutorial: !!room.isTutorial,
            players: room.players.map(p => ({
                name: p.name,
                role: p.role,
                isBot: !!p.isBot,
                connected: p.connected,
                score: p.score
            }))
        }));
        res.json({ rooms: data, total: data.length, timestamp: new Date().toISOString() });
    });
}

module.exports = registerAdminRoutes;
