import { sql } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Slider from '@/app/components/Slider';
import styles from './ProjectPage.module.css';

// 🚀 Senior Architect: ISR (Incremental Static Regeneration)
// The page is generated statically and refreshed every hour for extremely fast loading.
export const revalidate = 3600;

// Helper function to format URLs
const formatUrl = (url) => {
  if (!url) return "#";
  return url.startsWith('http') ? url : `https://${url}`;
};

// 1. SEO: Dynamic metadata generation for each project
export async function generateMetadata({ params }) {
  const { id } = await params;
  
  try {
    const projectInfo = await sql`
      SELECT title, description FROM portfolio_projects WHERE id = ${id} LIMIT 1
    `;
    
    if (projectInfo.length > 0) {
      return {
        title: `${projectInfo[0].title} | Our Portfolio`,
        description: projectInfo[0].description,
        openGraph: {
          title: `${projectInfo[0].title} | Digital Agency`,
          description: projectInfo[0].description,
          locale: 'en_US',
          type: 'article',
        },
      };
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
  }
  return { title: 'Project details | Digital Agency' };
}

export default async function ProjectPage({ params }) {
  const { id } = await params;

  let projectRows = [];
  let reviews = [];

  try {
    // 2. SAFE PROJECT QUERY (Neon)
    projectRows = await sql`
      SELECT
        p.id,
        p.title,
        p.description,
        p.tech_stack,
        p.client_name,
        p.created_at,
        p.site_url,
        i.image_url,
        i.is_main
      FROM portfolio_projects p
      LEFT JOIN portfolio_images i ON i.project_id = p.id
      WHERE p.id = ${id}
    `;

    // 3. SAFE REVIEWS QUERY (Neon)
    reviews = await sql`
      SELECT 
        id,
        author_name,
        rating,
        text,
        created_at
      FROM portfolio_reviews 
      WHERE project_id = ${id} AND is_public = true
      ORDER BY created_at DESC
    `;
  } catch (error) {
    console.error('Database error:', error);
  }

  // If the project does not exist, return a proper 404 status for Google
  if (!projectRows || projectRows.length === 0) {
    notFound(); 
  }

  // ===== Aggregate project object =====
  const project = {
    id: projectRows[0].id,
    title: projectRows[0].title,
    created_at: projectRows[0].created_at,
    client_name: projectRows[0].client_name,
    description: projectRows[0].description,
    site_url: projectRows[0].site_url,
    tech_stack: projectRows[0].tech_stack,
    images: []
  };

  projectRows.forEach(row => {
    if (row.image_url) {
      project.images.push({
        image_url: row.image_url,
        is_main: row.is_main
      });
    }
  });

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.contentGrid}>

          {/* LEFT SIDE: INFO */}
          <div className={styles.infoColumn}>
            <h1 className={styles.title}>{project.title}</h1>

            <Link href={formatUrl(project.site_url)} target="_blank" className={styles.link}>
              {project.site_url ? "View project online" : "Link unavailable"} &rarr;
            </Link>

            <div className={styles.date}>
              <span className="font-semibold">Published on: </span>
              {new Date(project.created_at).toLocaleDateString('en-US')}
            </div>

            <p className={styles.description}>{project.description}</p>

            {/* RECENZIE */}
            <div className={styles.reviewsContainer}>
              {reviews.length > 0 && <h3 className="text-2xl font-bold mb-4">Client reviews</h3>}
              
              {reviews.map(rev => (
                <div key={rev.id} className={styles.reviewCard}>
                  <div className={styles.reviewTop}>
                    <strong className={styles.author}>{rev.author_name}</strong>
                    <span className={styles.rating}>★ {rev.rating}/5</span>
                  </div>
                  <div className={styles.containerInfo}>
                    <span className={styles.reviewText}>„{rev.text}“</span>
                    <small className={styles.reviewDate}>
                      {new Date(rev.created_at).toLocaleDateString('sk-SK')}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </div>

{/* RIGHT SIDE: SLIDER / GALLERY */}
          <div className={styles.galleryColumn}>
            {/* Guard against empty data: render Slider only if images exist */}
            {project.images.length > 0 ? (
               <Slider images={project.images} />
            ) : (
              <div className="bg-gray-100 w-full h-64 flex items-center justify-center rounded-xl text-gray-400">
                Images are coming soon...
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}