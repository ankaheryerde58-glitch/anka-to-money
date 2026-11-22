
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");

const TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = String(process.env.ADMIN_ID || "");

if (!TOKEN) {
  throw new Error("BOT_TOKEN Render Environment bölümünde tanımlanmalı.");
}

const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();

app.get("/", (req, res) => {
  res.send("ANKA TO MONEY aktif.");
});

app.get("/health", (req, res) => {
  res.json({ status: "online", bot: "ANKA TO MONEY" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("ANKA TO MONEY sunucusu aktif: " + PORT);
});

const sessions = new Map();

const coins = ["TRX", "USDT", "ETH", "BNB"];

const commissionTiers = [
  { min: 10000, rate: 10 },
  { min: 5000, rate: 9 },
  { min: 2000, rate: 8 },
  { min: 1000, rate: 7 },
  { min: 500, rate: 6 },
  { min: 300, rate: 5 }
];

function getRate(amount) {
  const tier = commissionTiers.find(item => amount >= item.min);
  return tier ? tier.rate : null;
}

function mainMenu() {
  return {
    inline_keyboard: [
      [{ text: "💳 TL İLE KRİPTO SATIN AL", callback_data: "buy" }],
      [{ text: "💰 KRİPTO BOZDUR - TL AL", callback_data: "sell" }],
      [{ text: "📊 KOMİSYON ORANLARI", callback_data: "rates" }],
      [{ text: "ℹ️ NASIL ÇALIŞIR?", callback_data: "info" }],
      [{ text: "🛟 DESTEK", callback_data: "support" }]
    ]
  };
}

function coinMenu() {
  return {
    inline_keyboard: [
      [
        { text: "TRX", callback_data: "coin_TRX" },
        { text: "USDT", callback_data: "coin_USDT" }
      ],
      [
        { text: "ETH", callback_data: "coin_ETH" },
        { text: "BNB", callback_data: "coin_BNB" }
      ],
      [{ text: "⬅️ Ana Menü", callback_data: "home" }]
    ]
  };
}

function welcome(name) {
  return (
    "🟡 *ANKA TO MONEY*\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    "Hoş geldin, " + name + "!\n\n" +
    "Kripto işlemlerini kolayca hesapla.\n\n" +
    "💎 Desteklenen varlıklar:\n" +
    "• TRX\n• USDT\n• ETH\n• BNB\n\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    "⚠️ Bu bot şu anda DEMO modundadır.\n" +
    "Gerçek para veya kripto transferi yapılmaz."
  );
}

function ratesText() {
  return (
    "📊 *ANKA KOMİSYON ORANLARI*\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    "300 TL → %5 komisyon\n" +
    "500 TL → %6 komisyon\n" +
    "1.000 TL → %7 komisyon\n" +
    "2.000 TL → %8 komisyon\n" +
    "5.000 TL → %9 komisyon\n" +
    "10.000 TL → %10 komisyon\n\n" +
    "Komisyon, girilen TL tutarının karşılığıdır.\n" +
    "━━━━━━━━━━━━━━━━━━"
  );
}

bot.onText(/\/start/, async (msg) => {
  sessions.delete(msg.from.id);

  await bot.sendMessage(
    msg.chat.id,
    welcome(msg.from.first_name || "Müşteri"),
    {
      parse_mode: "Markdown",
      reply_markup: mainMenu()
    }
  );
});

bot.onText(/\/admin/, async (msg) => {
  if (String(msg.from.id) !== ADMIN_ID || !ADMIN_ID) {
    return bot.sendMessage(msg.chat.id, "⛔ Bu alan sadece yöneticilere açıktır.");
  }

  const text =
    "👑 ANKA YÖNETİCİ PANELİ\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    "Bot durumu: 🟢 Aktif\n" +
    "Çalışma modu: DEMO\n" +
    "Aktif kullanıcı oturumu: " + sessions.size + "\n\n" +
    "Gerçek transferler kapalıdır.";

  bot.sendMessage(msg.chat.id, text);
});

bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const data = query.data;

  await bot.answerCallbackQuery(query.id);

  if (data === "home") {
    sessions.delete(userId);
    return bot.sendMessage(
      chatId,
      welcome(query.from.first_name || "Müşteri"),
      { parse_mode: "Markdown", reply_markup: mainMenu() }
    );
  }

  if (data === "buy" || data === "sell") {
    sessions.set(userId, {
      direction: data,
      step: "coin"
    });

    const title = data === "buy"
      ? "💳 TL İLE KRİPTO SATIN AL"
      : "💰 KRİPTO BOZDUR - TL AL";

    return bot.sendMessage(
      chatId,
      title + "\n\nHangi kripto varlığı seçmek istiyorsun?",
      { reply_markup: coinMenu() }
    );
  }

  if (data === "rates") {
    return bot.sendMessage(chatId, ratesText(), {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "⬅️ Ana Menü", callback_data: "home" }]
        ]
      }
    });
  }

  if (data === "info") {
    return bot.sendMessage(
      chatId,
      "ℹ️ ANKA TO MONEY\n\n" +
      "Bu bot, TL ve kripto işlemleri için teklif hesaplama arayüzüdür.\n\n" +
      "1. İşlem yönünü seç.\n" +
      "2. Kripto varlığını seç.\n" +
      "3. TL karşılığını gir.\n" +
      "4. Komisyon hesaplamanı görüntüle.\n\n" +
      "⚠️ Şu anda gerçek ödeme, kripto yatırma veya çekme yapılmaz. Gösterilen sonuçlar demo hesaplamasıdır.",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "⬅️ Ana Menü", callback_data: "home" }]
          ]
        }
      }
    );
  }

  if (data === "support") {
    return bot.sendMessage(
      chatId,
      "🛟 Destek için yöneticimizle iletişime geçebilirsin.\n\n" +
      "Yönetici desteği: @" + (process.env.SUPPORT_USERNAME || "ANKA_DESTEK"),
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "⬅️ Ana Menü", callback_data: "home" }]
          ]
        }
      }
    );
  }

  if (data.startsWith("coin_")) {
    const session = sessions.get(userId);

    if (!session || session.step !== "coin") {
      return bot.sendMessage(chatId, "Önce ana menüden işlem yönünü seç.");
    }

    const coin = data.replace("coin_", "");

    if (!coins.includes(coin)) return;

    session.coin = coin;
    session.step = "amount";
    sessions.set(userId, session);

    return bot.sendMessage(
      chatId,
      "✅ Seçilen varlık: " + coin + "\n\n" +
      "Lütfen hesaplamak istediğin tutarın TL karşılığını yaz.\n\n" +
      "Örnek: 1000\n\n" +
      "Minimum hesaplama tutarı: 300 TL\n" +
      "⚠️ Bu tutar yalnızca demo hesaplaması içindir."
    );
  }
});

bot.on("message", async (msg) => {
  if (!msg.text || msg.text.startsWith("/")) return;

  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const session = sessions.get(userId);

  if (!session || session.step !== "amount") return;

  const amountText = msg.text.replace(",", ".");
  const amount = Number(amountText);

  if (!Number.isFinite(amount) || amount < 300 || amount > 1000000) {
    return bot.sendMessage(
      chatId,
      "❌ Geçerli bir tutar gir. Minimum 300 TL."
    );
  }

  const rate = getRate(amount);

  if (!rate) {
    return bot.sendMessage(chatId, "❌ Bu tutar için komisyon oranı bulunamadı.");
  }

  const fee = amount * rate / 100;
  const net = amount - fee;

  const direction = session.direction === "buy"
    ? "TL İLE KRİPTO SATIN AL"
    : "KRİPTO BOZDUR - TL AL";

  const result =
    "🟡 ANKA TO MONEY\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    "📋 DEMO HESAPLAMA\n\n" +
    "İşlem: " + direction + "\n" +
    "Kripto: " + session.coin + "\n" +
    "TL karşılığı: " + amount.toLocaleString("tr-TR") + " TL\n" +
    "Komisyon oranı: %" + rate + "\n" +
    "Komisyon tutarı: " + fee.toLocaleString("tr-TR", {
      maximumFractionDigits: 2
    }) + " TL\n" +
    "━━━━━━━━━━━━━━━━━━\n" +
    "Hesaplanan net tutar: " + net.toLocaleString("tr-TR", {
      maximumFractionDigits: 2
    }) + " TL\n\n" +
    "⚠️ Bu bir demo hesaplamasıdır.\n" +
    "Canlı kur kullanılmamıştır. Gerçek ödeme veya kripto transferi yapılmaz.";

  sessions.delete(userId);

  return bot.sendMessage(chatId, result, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔄 Yeni Hesaplama", callback_data: "home" }],
        [{ text: "📊 Komisyon Oranları", callback_data: "rates" }]
      ]
    }
  });
});

bot.on("polling_error", (error) => {
  console.error("Telegram bağlantı hatası:", error.message);
});

console.log("🟡 ANKA TO MONEY Telegram botu başlatıldı.");
