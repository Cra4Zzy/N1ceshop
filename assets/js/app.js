(() => {
  const $ = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));
  const BASE = (document.body && document.body.dataset && document.body.dataset.base) ? document.body.dataset.base : "";

  // Reveal
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting){
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, {threshold: 0.12});
  $$('.reveal').forEach(el => io.observe(el));

  // Drawer
  const drawer = $('#drawer');
  const burger = $('#burger');
  const drawerClose = $('#drawerClose');
  const openDrawer = () => drawer?.classList.add('open');
  const closeDrawer = () => drawer?.classList.remove('open');
  burger?.addEventListener('click', openDrawer);
  drawerClose?.addEventListener('click', closeDrawer);
  drawer?.addEventListener('click', (e)=>{ if(e.target === drawer) closeDrawer(); });
  $$('#drawer a').forEach(a => a.addEventListener('click', closeDrawer));

  // Active nav
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  $$('[data-navlink]').forEach(a => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    a.classList.toggle('active', href === path);
  });

  // Footer year
  const y = $('#year'); if(y) y.textContent = new Date().getFullYear();

  // Products
  const grid = $('#productGrid');
  const state = { all: [], query: '', sort: 'featured', category: document.body.dataset.category || '',
    subcat: "all"
  };
  const money = (p) => `${p.currency || '€'}${p.price}`;
  const escapeHtml = (str) => String(str ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'","&#039;");
  const badgeClass = (b) => {
    const s = (b || '').toLowerCase();
    // map common labels to premium styles
    if (s.includes('new')) return 'new';
    if (s.includes('hot') || s.includes('limited') || s.includes('drop')) return 'hot';
    if (s.includes('best') || s.includes('seller') || s.includes('premium') || s.includes('editor') || s.includes('must')) return 'premium';
    return '';
  };

  // Modal
  const modal = $('#modal');
  const modalImg = $('#modalImg');
  const modalTitle = $('#modalTitle');
  const modalDesc = $('#modalDesc');
  const modalPrice = $('#modalPrice');
  const modalLink = $('#modalLink');
  const modalClose = $('#modalClose');
  function openModal(id){
    const p = state.all.find(x => x.id === id);
    if(!p) return;
    modalImg.src = `${BASE}${p.image}`;
    modalTitle.textContent = p.title;
    modalDesc.textContent = p.desc;
    modalPrice.textContent = `${p.currency || '€'}${p.price}`;
    modalLink.href = p.link;
    modal.classList.add('open');
  }
  function closeModal(){ modal.classList.remove('open'); }
  modalClose?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e)=>{ if(e.target === modal) closeModal(); });
  window.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeModal(); });

  
  function setEmptyState(show){
    if(!grid) return;
    let empty = document.querySelector('.empty-state');
    if(show){
      if(!empty){
        empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.innerHTML = `
          <div class="empty-card reveal visible">
            <h3>Keine Treffer</h3>
            <p>Probier einen anderen Filter oder lösche deine Suche.</p>
            <button class="btn primary" type="button" data-reset="1">Alle anzeigen</button>
          </div>
        `;
      }
      grid.innerHTML = '';
      grid.appendChild(empty);
      const resetBtn = empty.querySelector('[data-reset]');
      if(resetBtn){
        resetBtn.addEventListener('click', () => {
          state.subcat = 'all';
          state.query = '';
          const si = document.querySelector('#searchInput');
          if(si) si.value = '';
          const wrap = document.querySelector('.subcategories');
          if(wrap){
            wrap.querySelectorAll('.subcat-btn').forEach(b => b.classList.remove('is-active'));
            const allBtn = wrap.querySelector('[data-filter="all"]');
            if(allBtn) allBtn.classList.add('is-active');
          }
          render();
        });
      }
    } else if(empty){
      empty.remove();
    }
  }

  function animateGridIn(){
    if(!grid) return;
    // simple stagger: add class after paint
    const items = grid.querySelectorAll('.product');
    requestAnimationFrame(() => {
      items.forEach((el, i) => {
        el.style.animationDelay = `${Math.min(i*40, 240)}ms`;
        el.classList.add('product--in');
      });
    });
  }

function render(){
    if(!grid) return;
    const q = state.query.trim().toLowerCase();
    let items = state.all.filter(p => (!q || (p.title||'').toLowerCase().includes(q) || (p.desc||'').toLowerCase().includes(q) || (p.badge||'').toLowerCase().includes(q)) && (state.subcat==='all' || (p.subcat||'all')===state.subcat));
    if(state.sort === 'price-asc') items.sort((a,b) => parseFloat(a.price) - parseFloat(b.price));
    if(state.sort === 'price-desc') items.sort((a,b) => parseFloat(b.price) - parseFloat(a.price));
    if(state.sort === 'title') items.sort((a,b) => (a.title||'').localeCompare(b.title||''));

    if(items.length === 0){
      setEmptyState(true);
      return;
    }
    setEmptyState(false);

    grid.innerHTML = items.map(p => `
      <article class="product reveal" data-subcat="${p.subcat || 'all'}">
        <div class="media"><img src="${BASE}${p.image}" alt="${escapeHtml(p.title)}"></div>
        <div class="body">
          <div style="display:flex;gap:10px;align-items:center;justify-content:space-between">
            <h3>${escapeHtml(p.title)}</h3>
            ${p.badge ? `<span class="badge ${badgeClass(p.badge)}">${escapeHtml(p.badge)}</span>` : ''}
          </div>
          <p>${escapeHtml(p.desc || '')}</p>
          <div class="price-row">
            <div class="price">${money(p)}</div>
            <span class="pill">Affiliate</span>
          </div>
          <div class="actions">
            <a class="btn primary" href="${p.link}" target="_blank" rel="noopener">Zum Deal</a>
            <button class="btn ghost" type="button" data-open="${p.id}">Details</button>
          </div>
        </div>
      </article>
    `).join('');

    grid.querySelectorAll('.reveal').forEach(el => io.observe(el));
    grid.querySelectorAll('[data-open]').forEach(btn => btn.addEventListener('click', () => openModal(btn.dataset.open)));
    animateGridIn();
  }

  
  function initTicker(){
    const wrap = document.getElementById('n1ceFlip');
    const card = document.getElementById('flipCard');
    const front = document.getElementById('flipFront');
    const back = document.getElementById('flipBack');
    if(!wrap || !card || !front || !back) return;

    const slogans = [
      "N1CESHOP — IHRE BESTE AUSWAHL AN PRODUKTEN",
      "NEUE DROPS LIVE — CHECK DIE HEISSESTEN DEALS",
      "HYPE PRODUKTE • SMART PICKS • DIREKT ZUM DEAL",
      "LIMITED VIBES — NUR DIE BESTEN FINDS",
      "TRANSPARENT & SCHNELL: 1 KLICK ZUM PARTNER-SHOP"
    ];

    let i = 0;
    front.textContent = slogans[0];
    back.textContent = slogans[1];

    const interval = parseInt(wrap.dataset.interval || "2600", 10);

    const doFlip = () => {
      const next = slogans[(i+1) % slogans.length];
      back.textContent = next;

      // trigger flip
      card.classList.remove('is-flipping');
      // force reflow
      void card.offsetWidth;
      card.classList.add('is-flipping');

      // after flip, swap content
      setTimeout(() => {
        front.textContent = next;
        card.classList.remove('is-flipping');
        i = (i+1) % slogans.length;
      }, 720);
    };

    setInterval(doFlip, interval);
  }

async function initProducts(){
    if(!grid) return;
    try{
      const res = await fetch(`${BASE}assets/data/products.json`, {cache:'no-store'});
      const data = await res.json();
      state.all = (data[state.category] || []).map(x => ({...x, currency: x.currency || '€'}));
      const count = $('#count'); if(count) count.textContent = String(state.all.length);
      
    // Subcategory filter (shop-like)
    const subcatWrap = document.querySelector('.subcategories');
    if(subcatWrap){
      subcatWrap.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-filter]');
        if(!btn) return;
        state.subcat = btn.dataset.filter || 'all';
        subcatWrap.querySelectorAll('.subcat-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        render();
      });
    }

render();
    }catch(err){
      grid.innerHTML = `<div class="pill">products.json konnte nicht geladen werden. Bitte über Live Server / http.server öffnen.</div>`;
      console.error(err);
    }
  }

  $('#searchInput')?.addEventListener('input', (e)=>{ state.query = e.target.value || ''; render(); });
  $('#sortSelect')?.addEventListener('change', (e)=>{ state.sort = e.target.value; render(); });


  // Featured products (index)
  const featuredGrid = $('#featuredGrid');
  async function initFeatured(){
    if(!featuredGrid) return;
    try{
      const res = await fetch(`${BASE}assets/data/products.json`, {cache:'no-store'});
      const data = await res.json();
      const picks = [];
      if(Array.isArray(data.drops) && data.drops[0]) picks.push(data.drops[0]);
      if(Array.isArray(data.women) && data.women[0]) picks.push(data.women[0]);
      if(Array.isArray(data.men) && data.men[0]) picks.push(data.men[0]);

      featuredGrid.innerHTML = picks.map(p => `
        <div class="mini-card">
          <div class="img"><img src="${BASE}${p.image}" alt="${escapeHtml(p.title)}"></div>
          <div class="txt">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
              <h3>${escapeHtml(p.title)}</h3>
              ${p.badge ? `<span class="badge ${badgeClass(p.badge)}">${escapeHtml(p.badge)}</span>` : ''}
            </div>
            <p>${escapeHtml(p.desc || '')}</p>
            <div class="mini-row">
              <div class="mini-price">${money(p)}</div>
              <a class="btn primary mini-cta" href="${p.link}" target="_blank" rel="noopener">Zum Deal</a>
            </div>
          </div>
        </div>
      `).join('');
    }catch(err){
      featuredGrid.innerHTML = `<div class="pill">Featured Produkte konnten nicht geladen werden.</div>`;
      console.error(err);
    }
  }

  initTicker();
  initProducts();
  initFeatured();
})();
