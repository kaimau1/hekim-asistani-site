// ═══ Anket — Firebase Firestore tabanlı oylama ═══
// Firestore: anket_istatistik/toplam (realtime sayaçlar) + anket_oylari/{voterId}
// Firestore yoksa / hata olursa localStorage fallback.

(function() {
  const SECENEKLER = ['kullanirim', 'begendim', 'denerim', 'kullanmam'];
  const KENDI_OY_KEY  = 'anketKendiOyum';
  const VOTER_ID_KEY  = 'anketVoterId';
  const LOCAL_OY_KEY  = 'anketOylari_local'; // sadece fallback

  // ── Voter ID ────────────────────────────────
  function voterIdAl() {
    try {
      if (window._currentUid) return 'u_' + window._currentUid;
      let id = localStorage.getItem(VOTER_ID_KEY);
      if (!id) {
        id = 'anon_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now().toString(36);
        localStorage.setItem(VOTER_ID_KEY, id);
      }
      return id;
    } catch (_) {
      return 'anon_' + Date.now();
    }
  }

  function kendiOyumAl()     { try { return localStorage.getItem(KENDI_OY_KEY) || null; } catch(_) { return null; } }
  function kendiOyumKaydet(o){ try { localStorage.setItem(KENDI_OY_KEY, o); } catch(_) {} }
  function kendiOyumuSil()   { try { localStorage.removeItem(KENDI_OY_KEY); } catch(_) {} }

  // ── LocalStorage fallback ──────────────────
  function localOylariAl() {
    try { const k = localStorage.getItem(LOCAL_OY_KEY); if (k) return JSON.parse(k); } catch(_) {}
    return { kullanirim:0, begendim:0, denerim:0, kullanmam:0 };
  }
  function localOylariKaydet(o) { try { localStorage.setItem(LOCAL_OY_KEY, JSON.stringify(o)); } catch(_) {} }

  // ── UI ──────────────────────────────────────
  function uiGuncelle(oylar) {
    const toplam = SECENEKLER.reduce((t,k) => t + (oylar[k]||0), 0);
    SECENEKLER.forEach(s => {
      const sayi = oylar[s] || 0;
      const yuzde = toplam > 0 ? Math.round((sayi/toplam)*100) : 0;
      const ad = s.charAt(0).toUpperCase() + s.slice(1);
      const sayiEl = document.getElementById('say'+ad);
      const ytEl   = document.getElementById('yt'+ad);
      const barEl  = document.getElementById('bar'+ad);
      if (sayiEl) sayiEl.textContent = sayi;
      if (ytEl)   ytEl.textContent = yuzde + '%';
      if (barEl)  barEl.style.width = yuzde + '%';
    });
    const tplEl = document.getElementById('anketToplam');
    if (tplEl) tplEl.textContent = toplam;
  }

  function sonucGoster(kendi) {
    document.getElementById('anketSecenekler').hidden = true;
    document.getElementById('anketSonuc').hidden = false;
    document.querySelectorAll('.anket-btn').forEach(b => {
      b.classList.toggle('secili', b.dataset.oy === kendi);
    });
  }
  function secenekleriGoster() {
    document.getElementById('anketSecenekler').hidden = false;
    document.getElementById('anketSonuc').hidden = true;
    document.querySelectorAll('.anket-btn').forEach(b => b.classList.remove('secili'));
  }

  // ── Firestore ───────────────────────────────
  let fb = null;
  let statDocRef = null;
  let firestoreAktif = false;

  function firebaseBekle() {
    if (window._firebase?.db) return Promise.resolve(true);
    return new Promise(resolve => {
      let zaman = 0;
      const int = setInterval(() => {
        if (window._firebase?.db) { clearInterval(int); resolve(true); return; }
        zaman += 100;
        if (zaman > 4000) { clearInterval(int); resolve(false); }
      }, 100);
      window.addEventListener('firebase-hazir', () => { clearInterval(int); resolve(true); }, { once: true });
    });
  }

  async function firestoreBasla() {
    const hazir = await firebaseBekle();
    if (!hazir) {
      console.warn('[Anket] Firebase erişilemedi, localStorage fallback');
      uiGuncelle(localOylariAl());
      return;
    }
    fb = window._firebase;
    const { db, doc, onSnapshot } = fb;
    statDocRef = doc(db, 'anket_istatistik', 'toplam');
    firestoreAktif = true;
    onSnapshot(
      statDocRef,
      snap => uiGuncelle(snap.data() || {}),
      err => {
        console.warn('[Anket] Firestore onSnapshot hata, fallback:', err?.message || err);
        firestoreAktif = false;
        uiGuncelle(localOylariAl());
      }
    );
  }

  // ── Oy verme ────────────────────────────────
  async function oyVer(secim) {
    if (!SECENEKLER.includes(secim)) return;
    const onceki = kendiOyumAl();
    if (onceki === secim) { sonucGoster(secim); return; }

    if (firestoreAktif && fb && statDocRef) {
      const { db, doc, writeBatch, increment, serverTimestamp } = fb;
      const voterId = voterIdAl();
      const oyRef = doc(db, 'anket_oylari', voterId);
      const batch = writeBatch(db);
      const statDelta = { [secim]: increment(1) };
      if (onceki) statDelta[onceki] = increment(-1);
      batch.set(statDocRef, statDelta, { merge: true });
      batch.set(oyRef, { secim, uid: window._currentUid || null, ts: serverTimestamp() });
      try {
        await batch.commit();
      } catch (err) {
        console.warn('[Anket] Firestore yazma hata:', err?.message || err);
      }
    } else {
      const oylar = localOylariAl();
      if (onceki) oylar[onceki] = Math.max(0, (oylar[onceki]||0)-1);
      oylar[secim] = (oylar[secim]||0) + 1;
      localOylariKaydet(oylar);
      uiGuncelle(oylar);
    }
    kendiOyumKaydet(secim);
    sonucGoster(secim);
  }

  async function oyDegistir() {
    const onceki = kendiOyumAl();
    if (firestoreAktif && fb && statDocRef && onceki) {
      const { db, doc, writeBatch, increment } = fb;
      const voterId = voterIdAl();
      const oyRef = doc(db, 'anket_oylari', voterId);
      const batch = writeBatch(db);
      batch.set(statDocRef, { [onceki]: increment(-1) }, { merge: true });
      batch.delete(oyRef);
      try { await batch.commit(); } catch(_) {}
    } else if (onceki) {
      const oylar = localOylariAl();
      oylar[onceki] = Math.max(0, (oylar[onceki]||0)-1);
      localOylariKaydet(oylar);
      uiGuncelle(oylar);
    }
    kendiOyumuSil();
    secenekleriGoster();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const anketBolumu = document.getElementById('anket');
    if (!anketBolumu || anketBolumu.hidden) return;

    document.querySelectorAll('.anket-btn').forEach(btn => {
      btn.addEventListener('click', () => oyVer(btn.dataset.oy));
    });
    const degBtn = document.getElementById('btnAnketDegistir');
    if (degBtn) degBtn.addEventListener('click', oyDegistir);

    const kendi = kendiOyumAl();
    if (kendi && SECENEKLER.includes(kendi)) sonucGoster(kendi);

    firestoreBasla();
  });
})();
