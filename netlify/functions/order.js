exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { statusCode: 500, body: JSON.stringify({ error: "Telegram не налаштовано: додайте змінні середовища" }) };
  try {
    const o = JSON.parse(event.body || "{}");
    if (!o.name || !o.phone || !Array.isArray(o.items) || !o.items.length) return { statusCode: 400, body: JSON.stringify({ error: "Некоректне замовлення" }) };
    const esc = s => String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const lines = o.items.map(i => `• ${esc(i.name)} — ${i.quantity} × ${i.weight} г — ${i.price * i.quantity} грн`).join("\n");
    const message = `<b>🍣 НОВЕ ЗАМОВЛЕННЯ — SUSHI MIR</b>\n\n<b>Ім'я:</b> ${esc(o.name)}\n<b>Телефон:</b> ${esc(o.phone)}\n<b>Telegram:</b> ${esc(o.telegram || "не вказано")}\n<b>Отримання:</b> ${esc(o.receive)}\n\n<b>Замовлення:</b>\n${lines}\n\n<b>Разом: ${Number(o.total) || 0} грн</b>\n<b>Коментар:</b> ${esc(o.comment || "немає")}\n\n<i>${esc(o.createdAt || "")}</i>`;
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" })
    });
    const result = await response.json();
    if (!result.ok) throw new Error(result.description || "Telegram API error");
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message || "Не вдалося надіслати" }) };
  }
};
