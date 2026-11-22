
require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const express = require("express");

const app = express();
app.use(express.json());

const TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;
const PORT = process.env.PORT || 3000;

if (!TOKEN) {
  console.error("BOT_TOKEN eksik!");
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

const coins = {
  TRX: "TRON",
  USDT: "TETHER",
  ETH: "ETHEREUM",
  BNB: "BINANCE COIN"
};

function mainMenu() {
  return {
    inline_keyboard: [
      [{ text: "💱 KRİPTO BOZDUR", callback_data: "exchange" }],
      [{ text: "📊 GÜNCEL KURLAR", callback_data: "rates" }],
      [{ text: "🧮 KOMİSYON HESAPLA", callback_data: "calculator" }],
      [{ text: "📜 İŞLEMLERİM", callback_data: "history" }],
      [{ text: "☎️ DESTEK", callback_data: "support" }]
    ]
  };
}

bot.onText(/\/start/, (msg) => {
  const name = msg.from.first_name || "Müşteri";

  bot.sendMessage(
    msg.chat.id,
    `✦ ANKA TO MONEY ✦

Merhaba ${name}!

DİJİTAL VARLIK DÖNÜŞÜM MERKEZİ

━━━━━━━━━━━━━━━━━━

💎 TRX • USDT • ETH • BNB

Güvenli ve şeffaf işlem deneyimi.

━━━━━━━━━━━━━━━━━━

İşlem yapmak için aşağıdaki menüyü kullan.`,
    {
      reply_markup: mainMenu()
    }
  );
});

bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const action = query.data;

  await bot.answerCallbackQuery(query.id);

  if (action === "exchange") {
    const keyboard = Object.keys(coins).map((coin) => [
      { text: `${coin} - ${coins[coin]}`, callback_data: `coin_${coin}` }
    ]);

    bot.sendMessage(chatId, "💱 BOZDURMAK İSTEDİĞİN KRİPTO PARAYI SEÇ:", {
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  else if (action.startsWith("coin_")) {
    const coin = action.replace("coin_", "");

    bot.sendMessage(
      chatId,
      `Seçimin: ${coin}\n\nBu kripto için fiyat ve işlem altyapısı henüz yapılandırılmadı.`
    );
  }

  else if (action === "rates") {
    bot.sendMessage(
      chatId,
      "📊 GÜNCEL KURLAR\n\nCanlı piyasa bağlantısı henüz kurulmadı."
    );
  }

  else if (action === "calculator") {
    bot.sendMessage(
      chatId,
      "🧮 KOMİSYON HESAPLAMA\n\nÖrnek tarifemiz:\n\n300 TL → %5\n500 TL → %6\n1.000 TL → %7\n2.000 TL → %8\n5.000 TL → %9\n10.000 TL → %10\n\nBu oranlar örnek hesaplama içindir."
    );
  }

  else if (action === "history") {
    bot.sendMessage(chatId, "📜 Henüz işlem geçmişin bulunmuyor.");
  }

  else if (action === "support") {
    bot.sendMessage(chatId, "☎️ Destek için yöneticiyle iletişime geçebilirsin.");
  }
});

bot.onText(/\/admin/, (msg) => {
  if (String(msg.from.id) !== String(ADMIN_ID)) {
    return bot.sendMessage(msg.chat.id, "⛔ Yetkin yok.");
  }

  bot.sendMessage(
    msg.chat.id,
    "✦ ANKA TO MONEY ADMIN ✦\n\nBot çalışıyor.\nYönetici girişi başarılı."
  );
});

app.get("/", (req, res) => {
  res.send("ANKA TO MONEY BOT ACTIVE");
});

app.listen(PORT, () => {
  console.log(`ANKA TO MONEY server running on ${PORT}`);
});
