import Link from 'next/link';
import Image from 'next/image'; // Подключаем оптимизацию изображений
import { sql } from '@/lib/db'; // Наш безопасный Neon клиент

import Section_about from './components/section-about';
import Faq from './components/Faq';
import Footer from './components/Footer';
import Requests from './components/Requests';
import Arsenal from './components/Arsenal';
import Header from './components/Header';
import Reviews from './components/ReviewsSection';

export const dynamic = 'force-dynamic';

// 🚀 SEO Optimalizácia pre slovenský trh
export const metadata = {
  title: 'Digitálna Agentúra | Tvorba moderných webových stránok',
  description: 'Zistite, ako naša agentúra transformuje nápady na úspešné digitálne projekty. Pozrite si naše portfólio a transparentný proces práce.',
  keywords: 'tvorba webu, digitálna agentúra, slovensko, web development, eshop na mieru',
};

export default async function Home() {
  let projects = [];

  try {
    // 1. Bezpečný dotaz cez Neon (tagged templates)
    // 2. LIMIT 10 presunutý priamo do databázy pre maximálny výkon
    projects = await sql`
      SELECT
        portfolio_projects.id,
        portfolio_projects.title,
        portfolio_projects.site_url,
        portfolio_images.image_url AS main_image
      FROM portfolio_projects
      LEFT JOIN portfolio_images
        ON portfolio_images.project_id = portfolio_projects.id
        AND portfolio_images.is_main = true
      ORDER BY portfolio_projects.id DESC
      LIMIT 10;
    `;
  } catch (error) {
    console.error('Chyba pri načítaní projektov z databázy Neon:', error);
  }

  return (
    <>
      <Header />
      <main>
        {/* Sekcia Portfólio */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Naše projekty hovoria <span>za seba</span></h2>
            <div className="project-cont grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Ochrana pred prázdnymi dátami */}
              {projects && projects.length > 0 ? (
                projects.map(project => (
                  <Link href={`/projects/${project.id}`} className="project-item block rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow" key={project.id}>
                    {/* Moderný prístup k obrázkom pre lepšie Core Web Vitals */}
                    <div className="relative w-full h-56 bg-gray-100">
                      <Image 
                        src={project.main_image || '/placeholder.jpg'} 
                        alt={`Projekt ${project.title}`}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                    <div className="p-4 bg-white">
                      <h4 className="text-lg font-semibold text-gray-900">{project.title}</h4>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-gray-500">Momentálne pripravujeme ukážky našich projektov.</p>
              )}
            </div>
          </div>
        </section>

        {/* <Section_about/> */}
        <Arsenal />

        {/* Sekcia Proces (Lokalizovaná do slovenčiny) */}
        <section className="process py-16 bg-gray-50">
          <div className='container mx-auto px-4'>
            <h2 className="text-3xl font-bold text-center mb-12">Ako <span>pracujeme</span></h2>
            <div className="process-content grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              
              <div className="process-item flex flex-col items-center text-center">
                <Image src="https://us8w2gtarj9lxoe8.public.blob.vercel-storage.com/01.png" alt="Výskum" width={80} height={80} className="mb-4" />
                <p className="font-medium">Výskum potrieb a definovanie jasného zadania</p>
              </div>
              
              <div className="process-item flex flex-col items-center text-center">
                <Image src="https://us8w2gtarj9lxoe8.public.blob.vercel-storage.com/02.png" alt="Prototyp" width={80} height={80} className="mb-4" />
                <p className="font-medium">Vytvorenie konceptu a prototypu</p>
              </div>
              
              <div className="process-item flex flex-col items-center text-center">
                <Image src="https://us8w2gtarj9lxoe8.public.blob.vercel-storage.com/03.png" alt="Úpravy" width={80} height={80} className="mb-4" />
                <p className="font-medium">Diskusia o detailoch a úpravy</p>
              </div>
              
              <div className="process-item flex flex-col items-center text-center">
                <Image src="https://us8w2gtarj9lxoe8.public.blob.vercel-storage.com/04.png" alt="Vývoj" width={80} height={80} className="mb-4" />
                <p className="font-medium">Vývoj dizajnu a funkcionality</p>
              </div>
              
              <div className="process-item flex flex-col items-center text-center">
                <Image src="https://us8w2gtarj9lxoe8.public.blob.vercel-storage.com/05.png" alt="Testovanie" width={80} height={80} className="mb-4" />
                <p className="font-medium">Testovanie, revízia a optimalizácia</p>
              </div>
              
              <div className="process-item flex flex-col items-center text-center">
                <Image src="https://us8w2gtarj9lxoe8.public.blob.vercel-storage.com/06.png" alt="Prezentácia" width={80} height={80} className="mb-4" />
                <p className="font-medium">Prezentácia finálneho riešenia</p>
              </div>
              
              <div className="process-item flex flex-col items-center text-center">
                <Image src="https://us8w2gtarj9lxoe8.public.blob.vercel-storage.com/07.png" alt="Spustenie" width={80} height={80} className="mb-4" />
                <p className="font-medium">Spustenie projektu a technická podpora</p>
              </div>
              
              <div className="process-item flex flex-col items-center text-center">
                <Image src="https://us8w2gtarj9lxoe8.public.blob.vercel-storage.com/08.png" alt="Odovzdanie" width={80} height={80} className="mb-4" />
                <p className="font-medium">Odovzdanie všetkých materiálov a prístupov</p>
              </div>

            </div>
          </div>
        </section>

        <Faq />
        <Reviews />
        <Requests />
      </main>

      <Footer />
    </>
  );
}