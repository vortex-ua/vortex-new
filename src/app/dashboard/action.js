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
    console.error("Kritická chyba: Chýbajú Telegram credentials v .env súbore.");
    throw new Error("Konfigurácia servera je neúplná.");
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
        error: "Vyplňte prosím všetky povinné polia (Názov a Popis)." 
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
        message: "Vaša požiadavka bola úspešne uložená do systému." 
      };
    }

    // 🔹 ГОСТЬ → Отправка в TELEGRAM
    if (!phone || !mail) {
      return { 
        success: false, 
        error: "Pre odoslanie žiadosti ako hosť zadajte telefón a e-mail." 
      };
    }

    const message = `
🆕 <b>Nová žiadosť z webu (Hosť)</b>

📌 <b>Projekt:</b> ${title}
📝 <b>Popis:</b> ${description}
💰 <b>Rozpočet:</b> ${budget || "nešpecifikovaný"}

📞 <b>Telefón:</b> ${phone}
📧 <b>Email:</b> ${mail}
💬 <b>Telegram:</b> ${telegram || "nešpecifikovaný"}
`;

    await sendToTelegram(message);
    
    return { 
      success: true, 
      message: "Žiadosť bola úspešne odoslaná. Čoskoro sa vám ozveme." 
    };

  } catch (error) {
    // Логируем ошибку для разработчиков (не отдаем детали клиенту)
    console.error("Chyba v Server Action sendRequest:", error);
    
    return { 
      success: false, 
      error: "Vyskytla sa neočakávaná chyba na serveri. Skúste to prosím neskôr." 
    };
  }
}