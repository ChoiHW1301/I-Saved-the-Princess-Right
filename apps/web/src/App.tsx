import type { JSX } from 'react';
import { GameCanvas } from './game/GameCanvas.js';

export function App(): JSX.Element {
  return (
    <main style={{ minHeight: '100vh', margin: 0, background: '#11130f', color: '#f1dfbd', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', letterSpacing: '0.08em' }}>
        <strong>CARAVAN ESCORT</strong>
        <span>ESCORT THE PRINCESS · THE DEMON KEEP</span>
      </header>
      <section style={{ position: 'relative', width: 'min(100vw, 1280px)', aspectRatio: '16 / 9', margin: '0 auto', border: '1px solid #665743', overflow: 'hidden', boxShadow: '0 20px 70px #0009' }}>
        <GameCanvas />
        <div style={{ position: 'absolute', top: 18, left: 22, pointerEvents: 'none', textShadow: '0 2px 6px #000' }}>
          <div style={{ fontSize: 12, color: '#d9ba7c', letterSpacing: '.16em' }}>STAGE 01 · DEMON KEEP</div>
          <strong style={{ fontSize: 20 }}>마차를 지켜라</strong>
        </div>
        <div style={{ position: 'absolute', right: 20, top: 18, fontSize: 12, textAlign: 'right', lineHeight: 1.8, color: '#ead7b6', textShadow: '0 2px 6px #000', pointerEvents: 'none' }}>
          <div>WASD / 방향키 이동</div><div>마차는 목적지를 향해 이동 중</div>
        </div>
      </section>
      <footer style={{ maxWidth: 1280, margin: '0 auto', padding: '14px 4px', display: 'flex', justifyContent: 'space-between', color: '#a99b81', fontSize: 13 }}>
        <span>용사 · 검술 숙련도 I</span><span>성채 바깥길을 지나고 있습니다</span>
      </footer>
    </main>
  );
}
