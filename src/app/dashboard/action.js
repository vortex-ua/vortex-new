"use server";

import { sql } from "@/lib/db"; // Используем наш Neon инстанс
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Функция отправки в Telegram (скрыта от клиента)
async function sendToTelegram(text) {
  const token = process.env.TG_BOT_TOKEN;
  const chatId = process.env.TG_CHAT_ID;

  // Проверка наличия ключей окружения для безопасного деплоя
  if (!token || !chatId) {
    console.error("Critical error: Missing Telegram credentials in .env.");
    throw new Error("Server configuration is incomplete.");
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });

  if (!res.ok) {
    throw new Error(`Telegram API chyba: ${res.status}`);
  }
}

export async function sendRequest(formData) {
  try {
    const session = await getServerSession(authOptions);

    const data = formData instanceof FormData
      ? Object.fromEntries(formData)
      : formData || {};

    // 🔹 Стандартизированное извлечение данных
    const title = typeof data.title === 'string' ? data.title.trim() : '';
    const description = typeof data.description === 'string' ? data.description.trim() : '';
    const budget = typeof data.budget === 'string' ? data.budget.trim() : '';
    const telegram = typeof data.telegram === 'string' ? data.telegram.trim() : '';
    const phone = typeof data.phone === 'string' ? data.phone.trim() : '';
    const mail = typeof data.mail === 'string' ? data.mail.trim() : '';

    // 🔐 Серверная валидация
    if (!title || !description) {
      return { 
        success: false, 
        error: "Please fill out all required fields (Title and Description)." 
      };
    }

    // 🔹 АВТОРИЗОВАННЫЙ ПОЛЬЗОВАТЕЛЬ → Сохранение в Neon DB
    if (session) {
      // Используем шаблонные строки Neon для безопасности
      await sql`
        INSERT INTO project_requests (user_id, title, description, budget)
        VALUES (${session.user.id}, ${title}, ${description}, ${budget || null})
      `;

      // Инвалидация кэша для мгновенного обновления UI
      revalidatePath("/dashboard");
      return { 
        success: true, 
        message: "Your request has been successfully saved." 
      };
    }

    // 🔹 ГОСТЬ → Отправка в TELEGRAM
    if (!phone || !mail) {
      return { 
        success: false, 
        error: "To submit a request as a guest, please provide phone and email." 
      };
    }

    const message = `
🆕 <b>New request from website (Guest)</b>

📌 <b>Project:</b> ${title}
📝 <b>Description:</b> ${description}
💰 <b>Budget:</b> ${budget || "unspecified"}

📞 <b>Phone:</b> ${phone}
📧 <b>Email:</b> ${mail}
💬 <b>Telegram:</b> ${telegram || "unspecified"}
`;

    await sendToTelegram(message);
    
    return { 
      success: true, 
      message: "Your request was sent successfully. We will contact you soon." 
    };

  } catch (error) {
    // Логируем ошибку для разработчиков (не отдаем детали клиенту)
    console.error("Error in Server Action sendRequest:", error);
    
    return { 
      success: false, 
      error: "An unexpected server error occurred. Please try again later." 
    };
  }
}