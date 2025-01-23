import { Request, Response } from "express";
import TelegramBot from "node-telegram-bot-api";
import { SocksProxyAgent } from "socks-proxy-agent";
import {
  IContactRequest,
  IContactResponse,
} from "../interfaces/Contact.interface";
import { Contact, IContact } from "../models/contactModel";

// توکن رو از env میخونیم
const token = process.env.TELEGRAM_BOT_TOKEN || "";
if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN is not set in environment variables");
}

// آی‌دی ادمین برای ارسال پیام‌ها
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || "";
if (!ADMIN_CHAT_ID) {
  throw new Error("ADMIN_CHAT_ID is not set in environment variables");
}

// تنظیمات پراکسی SOCKS
const socksAgent = new SocksProxyAgent("socks5h://127.0.0.1:10808");

const bot = new TelegramBot(token, {
  polling: true,
  request: {
    agent: socksAgent,
  } as any,
});

console.log("Telegram bot is starting with SOCKS proxy...");

// تعریف type های request و response
type ContactRequest = Request<
  {},
  {},
  {
    name: string;
    email: string;
    phone: string;
    message: string;
  }
>;

type ContactResponse = Response<{
  success: boolean;
  message: string;
  data?: IContact;
}>;

// دریافت اطلاعات فرم و ارسال به تلگرام
export const sendContactToTelegram = async (
  req: ContactRequest,
  res: ContactResponse
) => {
  const { name, email, phone, message } = req.body;
  console.log("Received contact request:", { name, email, phone, message });

  try {
    // ذخیره در دیتابیس
    const newContact = new Contact({
      name,
      email,
      phone,
      message,
    });
    await newContact.save();
    console.log("Contact saved to database:", newContact);

    // ارسال به تلگرام
    const text = `📥 درخواست همکاری جدید:
- 👤 نام: ${name}
- ✉️ ایمیل: ${email}
- 📱 شماره تماس: ${phone}
- 📝 پیام: ${message}`;

    try {
      await bot.sendMessage(ADMIN_CHAT_ID, text);
      console.log("Message sent to Telegram successfully");
    } catch (telegramError) {
      console.error("Telegram sending failed:", telegramError);
      // Continue execution even if Telegram fails
    }

    res.status(200).json({
      success: true,
      message: "درخواست شما با موفقیت ثبت شد",
      data: newContact.toObject(),
    });
  } catch (error) {
    console.error("Error details:", error);
    res.status(500).json({
      success: false,
      message: "خطا در ثبت درخواست. لطفا دوباره تلاش کنید",
    });
  }
};

// پیام خوشامدگویی برای کاربران در تلگرام
bot.onText(/\/start/, (msg) => {
  console.log("Received /start command from:", msg.chat.id);
  bot
    .sendMessage(
      msg.chat.id,
      "سلام! از شما متشکریم که با ما تماس گرفتید. لطفاً پیام خود را ارسال کنید، به زودی با شما تماس خواهیم گرفت. 😊"
    )
    .then(() => {
      console.log("Welcome message sent successfully");
    })
    .catch((error) => {
      console.error("Error sending welcome message:", error);
    });
});

bot.on("error", (error) => {
  console.error("Telegram bot error:", error);
});

bot.on("polling_error", (error) => {
  console.error("Polling error:", error);
});

// پاسخ خودکار به پیام‌های کاربران
bot.on("message", (msg) => {
  if (msg.text && !msg.text.startsWith("/")) {
    bot.sendMessage(
      msg.chat.id,
      "✅ اطلاعات شما ثبت شد! به زودی با شما تماس خواهیم گرفت. اگر سوالی دارید، همینجا مطرح کنید."
    );
  }
});
