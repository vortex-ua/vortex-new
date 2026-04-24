"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
async function sendToTelegram(text) {
  const token = process.env.TG_BOT_TOKEN;
  const chatId = process.env.TG_CHAT_ID;

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
    throw new Error("Ошибка отправки в Telegram");
  }
}

// export async function sendRequest(data) { 
//    const session = await getServerSession(authOptions);
   
//    const { title, description, budget, telegram, phone, mail } = data;

//   if (!title || !description) {
//     throw new Error("Заполните обязательные поля");
//   }

//   if (session) {
//     await db.query(
//       `INSERT INTO project_requests (user_id, title, description, budget)
//        VALUES ($1, $2, $3, $4)`,
//       [session.user.id, title, description, budget || null]
//     );

//     revalidatePath("/dashboard");
//     return;
//   }

//   if (!phone || !mail) {
//     throw new Error("Введите телефон и email");
//   }

//   const message = `
// 🆕 Заявка с сайта

// 📌 Проект: ${title}
// 📝 Описание: ${description}
// 💰 Бюджет: ${budget || "не указан"}

// 📞 Телефон: ${phone}
// 📧 Email: ${mail}
// 📧 telegram: ${telegram}
//   `;

//   await sendToTelegram(message);
// }
function getValue(data, key) {
  return data instanceof FormData ? data.get(key) : data?.[key];
}

export async function sendRequest(data) {
  const session = await getServerSession(authOptions);

  // 🔹 Универсально достаём данные
  const title = getValue(data, "title")?.toString().trim();
  const description = getValue(data, "description")?.toString().trim();
  const budget = getValue(data, "budget")?.toString().trim();
  const telegram = getValue(data, "telegram")?.toString().trim();
  const phone = getValue(data, "phone")?.toString().trim();
  const mail = getValue(data, "mail")?.toString().trim();

  // 🔐 Минимальная серверная валидация
  if (!title || !description) {
    return { error: "Заполните обязательные поля" };
  }

  // 🔹 АВТОРИЗОВАННЫЙ ПОЛЬЗОВАТЕЛЬ → БД
  if (session) {
    await db.query(
      `INSERT INTO project_requests (user_id, title, description, budget)
       VALUES ($1, $2, $3, $4)`,
      [session.user.id, title, description, budget || null]
    );

    revalidatePath("/dashboard");
    return { success: true };
  }

  // 🔹 ГОСТЬ → TELEGRAM
  if (!phone || !mail) {
    return { error: "Введите телефон и email" };
  }

  const message = `
🆕 Заявка с сайта

📌 Проект: ${title}
📝 Описание: ${description}
💰 Бюджет: ${budget || "не указан"}

📞 Телефон: ${phone}
📧 Email: ${mail}
📧 Telegram: ${telegram || "не указан"}
`;

  await sendToTelegram(message);
  return { success: true };
}