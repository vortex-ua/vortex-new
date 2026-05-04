// src/app/reviews/page.js
import { sql } from "@/lib/db"; // Используем наш настроенный клиент Neon
import { CreateReviews } from "../admin/reviews";
import { redirect } from "next/navigation";
import Link from "next/link";
import styles from "./Reviews.module.css";

// 🚀 Senior Architect Tip: Используем ISR вместо force-dynamic. 
// Страница будет статичной и быстрой, обновляясь в фоне раз в 10 минут.
export const revalidate = 600; 

// SEO Мета-данные для словацкого рынка
export const metadata = {
  title: 'Recenzie klientov | Naša Agentúra',
  description: 'Prečítajte si skúsenosti našich klientov alebo nám zanechajte vlastnú spätnú väzbu.',
};

export default async function Reviews({ searchParams }) {
  // Next.js 15: searchParams je Promise, musíme ho awaitnuť
  const params = await searchParams;
  const isSuccess = params?.success === 'true';

  let projects = [];
  let reviews = [];

  try {
    // Получаем проекты для селекта (Neon синтаксис: возвращает массив напрямую)
    projects = await sql`
      SELECT id, title
      FROM portfolio_projects
      ORDER BY id DESC
    `;

    // Получаем опубликованные отзывы
    reviews = await sql`
      SELECT
        r.id,
        r.author_name,
        r.rating,
        r.text,
        p.title AS project_title
      FROM portfolio_reviews r
      JOIN portfolio_projects p
        ON p.id = r.project_id
      WHERE r.is_public = true
      ORDER BY r.id DESC
    `;
  } catch (error) {
    console.error("Chyba pri načítaní dát z databázy:", error);
  }

  // Server Action для обработки формы
  async function submitReview(formData) {
    "use server";
    
    try {
      await CreateReviews(formData);
    } catch (e) {
      console.error("Chyba pri vytváraní recenzie:", e);
      return;
    }
    redirect("/reviews?success=true"); 
  }

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.mainTitle}>Recenzie <span>našich klientov</span></h2>

        {/* ZOZNAM RECENZIÍ */}
        <div className={styles.reviewsList}>
          {reviews.length === 0 ? (
            <p className={styles.emptyMessage}>
              Zatiaľ neboli publikované žiadne recenzie. Buďte prvý!
            </p>
          ) : (
            reviews.map((review) => (
              <div className={styles.reviewCard} key={review.id}>
                <div className={styles.cardHeader}>
                  <div>
                    <span className={styles.projectBadge}>
                      Projekt: {review.project_title}
                    </span>
                    <h4 className={styles.authorName}>{review.author_name}</h4>
                  </div>

                  <div className={styles.ratingBadge}>
                    <span>★</span> {review.rating}/5
                  </div>
                </div>

                <p className={styles.reviewText}>{review.text}</p>
              </div>
            ))
          )}
        </div>

        {/* FORMA ALEBO POTVRDENIE */}
        <div className={styles.formWrapper}>
          {isSuccess ? (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <h3 className={styles.formTitle}>Ďakujeme!</h3>
              <p style={{ marginBottom: "1rem", color: "var(--text-color, #666)" }}>
                Vaša recenzia bola úspešne odoslaná a čaká na schválenie administrátorom.
              </p>
              
              <Link 
                href="/reviews" 
                className={styles.submitButton} 
                style={{ display: "inline-block", textDecoration: "none" }}
              >
                Napísať ďalšiu recenziu
              </Link>
            </div>
          ) : (
            <form action={submitReview} className={styles.formGrid}>
              <h3 className={styles.formTitle}>Napíšte recenziu</h3>

              <select name="project_id" required className={styles.select}>
                <option value="">Vyberte projekt...</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>

              <input
                name="author_name"
                placeholder="Vaše meno"
                required
                className={styles.input}
              />

              <select name="raiting" required className={styles.select}>
                <option value="">Hodnotenie (1-5)</option>
                <option value="5">5 — Výborné</option>
                <option value="4">4 — Veľmi dobré</option>
                <option value="3">3 — Dobré</option>
                <option value="2">2 — Slabšie</option>
                <option value="1">1 — Nedostatočné</option>
              </select>

              <textarea
                name="text"
                placeholder="Povedzte nám viac o vašej skúsenosti..."
                required
                className={styles.textarea}
              />

              <button type="submit" className={styles.submitButton}>
                Odoslať spätnú väzbu
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}