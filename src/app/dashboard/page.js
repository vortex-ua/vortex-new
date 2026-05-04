export const dynamic = 'force-dynamic';

import { db } from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from 'next/link';
import ProjectForm from "./../dashboard/ProjectForm";
import Chat from './../components/Chat';

export default async function DashboardPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // В Next.js 15+ searchParams — это Promise
  const params = await searchParams;
  const chatWith = params.chatWith;
  const isAdmin = session.user.role === 'admin';

  if (chatWith && !isAdmin) {
    redirect("/dashboard");
  }

  let requests = [];
  let contacts = [];

  try {
    if (isAdmin) {
      // Исправленный запрос: используем четкие отступы и кавычки, если нужно
      const res = await db.query(`
        SELECT * FROM project_requests 
        ORDER BY created_at DESC
      `);
      requests = res.rows;

      if (!chatWith) {
        // Оптимизированный запрос контактов
        const contactRes = await db.query(`
          SELECT DISTINCT u.id, u.first_name, u.last_name, u.email 
          FROM chat_messages m
          JOIN users u ON m.sender_id = CAST(u.id AS TEXT)
          WHERE m.sender_id != 'admin'
        `);
        contacts = contactRes.rows;
      }
    } else {
      const res = await db.query(`
        SELECT * FROM project_requests 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `, [session.user.id]);
      requests = res.rows;
    }
  } catch (error) {
    console.error("Database Error:", error.message);
    // На продакшене лучше рендерить пустой массив или Error Boundary
  }

  return (
    <section className='dashboard' style={{ color: '#fff', padding: '20px' }}>
      <div className='infoUse-box'>
        <h1>{isAdmin ? 'Administračný panel' : 'Môj účet'}</h1>
        <div className='userInfo'>
          <span>👋 Vitajte, {session.user.name}</span>
          <span style={{ display: 'block', color: '#888' }}>{session.user.email}</span>
        </div>
      </div>

      <div className='gridDash' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '30px' }}>
        <div className='cardDash' style={{ background: '#111', padding: '20px', borderRadius: '12px' }}>
          <h2>{isAdmin ? 'Všetky požiadavky' : 'Nová žiadosť'}</h2>
          {!isAdmin ? <ProjectForm /> : <p>Zoznam prichádzajúcich dopytov od klientov.</p>}
        </div>

        <div className='cardDash' style={{ background: '#111', padding: '20px', borderRadius: '12px' }}>
          <h2>{isAdmin ? 'Log databázy' : 'Moje projekty'}</h2>
          {requests.length === 0 && <p className='empty'>Nenašli sa žiadne údaje</p>}
          <div className='requestsDash'>
            {requests.map(request => (
              <div key={request.id} className='requestDash' style={{ borderBottom: '1px solid #222', padding: '10px 0' }}>
                <div className='reqHeaderDash' style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{request.title}</strong>
                  <span className='statusDash' style={{ color: '#00ff00' }}>{request.status}</span>
                </div>
                <p className='descriptionDash' style={{ fontSize: '14px', color: '#ccc' }}>{request.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className='chat-section' style={{ marginTop: '50px' }}>
        <h2 style={{ marginBottom: '20px' }}>
          {isAdmin ? 'Komunikácia s klientmi' : 'Podpora / Chat s manažérom'}
        </h2>

        {isAdmin ? (
          <div>
            {chatWith ? (
              <>
                <Link href="/dashboard" style={{ color: '#0070f3', textDecoration: 'none', marginBottom: '15px', display: 'block' }}>
                  ← Späť na zoznam kontaktov
                </Link>
                <Chat 
                  roomId={`room_${chatWith}`} 
                  senderId={session.user.id} 
                  senderName="Administrátor"
                />
              </>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {contacts.length === 0 && <p style={{ color: '#666' }}>Žiadne aktívne správy.</p>}
                {contacts.map(c => (
                  <Link 
                    href={`?chatWith=${c.id}`} 
                    key={c.id} 
                    style={{
                      display: 'flex', justifyContent: 'space-between', padding: '15px',
                      background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px',
                      textDecoration: 'none', color: 'white'
                    }}
                  >
                    <div>
                      <strong>{`${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email}</strong>
                      <div style={{ fontSize: '12px', color: '#777' }}>{c.email}</div>
                    </div>
                    <span>Detail chatu →</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Chat 
            roomId={`room_${session.user.id}`} 
            senderId={session.user.id} 
            senderName={session.user.name}
          />
        )}
      </div>
    </section>
  );
}