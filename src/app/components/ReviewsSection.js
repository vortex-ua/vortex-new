import { sql } from '@/lib/db';
import ReviewsSlider from './ReviewsSlider'; // Ваш клиентский компонент (должен иметь 'use client' внутри)

// 🚀 Senior Архитектура: ISR (Incremental Static Regeneration)
// Кэшируем результаты на 1 час (3600 секунд) для мгновенной загрузки страницы
// Это радикально улучшает Core Web Vitals (LCP, TTFB)
export const revalidate = 3600;

export default async function ReviewsSection() {
    let reviews = [];

    try {
        // 1. Используем безопасные тегированные шаблоны Neon (sql`...`)
        // 2. Метод возвращает массив напрямую, поэтому убираем { rows }
        const data = await sql`
            SELECT
              id,
              project_id,
              author_name,
              rating,
              text,
              created_at
            FROM portfolio_reviews
            WHERE is_public = true
            ORDER BY created_at DESC
        `;

        // Безопасная сериализация дат для передачи в Client Component
        // Проверяем наличие created_at, чтобы избежать ошибки .toISOString() of null
        reviews = data.map((r) => ({
            ...r,
            created_at: r.created_at ? new Date(r.created_at).toISOString() : null,
        }));

    } catch (error) {
        // Логируем ошибку на сервере для отладки
        console.error('Chyba pri načítaní recenzií z databázy Neon:', error);
        // В случае ошибки reviews остается пустым массивом, UI не падает
    }

    return (
        <section className="py-16 bg-gray-50 overflow-hidden">
            <div className="container mx-auto px-4">
                {/* Локализация для словацкого рынка */}
                <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
                    Čo o nás hovoria <span className="text-blue-600">klienti</span>
                </h2>

                {/* Защита от пустого рендера */}
                {reviews && reviews.length > 0 ? (
                    <ReviewsSlider reviews={reviews} />
                ) : (
                    <p className="text-center text-gray-500">
                        Momentálne pre vás pripravujeme nové referencie od našich klientov.
                    </p>
                )}
            </div>
        </section>
    );
}