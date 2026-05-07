// src/app/reviews/page.js
import { sql } from "@/lib/db"; // Используем наш настроенный клиент Neon
import { CreateReviews } from "../admin/reviews";
import { redirect } from "next/navigation";
import Link from "next/link";
import styles from "./Reviews.module.css";

// 🚀 Senior Architect Tip: Используем ISR вместо force-dynamic. 
// Страница будет статичной и быстрой, обновляясь в фоне раз в 10 минут.
export const revalidate = 600; 

// SEO metadata for English site
export const metadata = {
  title: 'Client reviews | Our Agency',
  description: 'Read our clients’ experiences or leave your own feedback.',
};

export default async function Reviews({ searchParams }) {
  // Next.js 15: searchParams is a Promise, so we await it
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
    console.error("Error loading data from database:", error);
  }

  // Server Action для обработки формы
  async function submitReview(formData) {
    "use server";
    
    try {
      await CreateReviews(formData);
    } catch (e) {
      console.error("Error creating review:", e);
      return;
    }
    redirect("/reviews?success=true"); 
  }

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.mainTitle}>Reviews <span>from our clients</span></h2>

        {/* REVIEWS LIST */}
        <div className={styles.reviewsList}>
          {reviews.length === 0 ? (
            <p className={styles.emptyMessage}>
              No reviews have been published yet. Be the first!
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
              <h3 className={styles.formTitle}>Thank you!</h3>
              <p style={{ marginBottom: "1rem", color: "var(--text-color, #666)" }}>
                Your review has been submitted successfully and is awaiting admin approval.
              </p>
              
              <Link 
                href="/reviews" 
                className={styles.submitButton} 
                style={{ display: "inline-block", textDecoration: "none" }}
              >
                Write another review
              </Link>
            </div>
          ) : (
            <form action={submitReview} className={styles.formGrid}>
              <h3 className={styles.formTitle}>Write a review</h3>

              <select name="project_id" required className={styles.select}>
                <option value="">Choose a project...</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>

              <input
                name="author_name"
                placeholder="Your name"
                required
                className={styles.input}
              />

              <select name="raiting" required className={styles.select}>
                <option value="">Rating (1-5)</option>
                <option value="5">5 — Excellent</option>
                <option value="4">4 — Very good</option>
                <option value="3">3 — Good</option>
                <option value="2">2 — Fair</option>
                <option value="1">1 — Poor</option>
              </select>

              <textarea
                name="text"
                placeholder="Tell us more about your experience..."
                required
                className={styles.textarea}
              />

              <button type="submit" className={styles.submitButton}>
                Submit feedback
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}