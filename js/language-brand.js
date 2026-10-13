(()=>{
  const choices={en:'en',tr:'tr',de:'de'};
  const selected=()=>{
    if(new URLSearchParams(location.search).get('lang')==='de')return 'de';
    const file=location.pathname.split('/').pop().toLowerCase().replace(/\.html$/,'');
    if(file==='1-index')return 'tr';
    if(file==='de-index')return 'de';
    try { const saved=localStorage.getItem('werkarLang'); if(choices[saved])return saved; } catch(e) {}
    const pageLang=(document.documentElement.lang||'').slice(0,2).toLowerCase();
    return choices[pageLang]||'en';
  };
  const update=()=>{
    const lang=selected();
    const file=location.pathname.split('/').pop().toLowerCase().replace(/\.html$/,'');
    if(file==='index'||file==='1-index'||file==='de-index'){
      try { localStorage.setItem('werkarLang',lang); } catch(e) {}
    }
    document.querySelectorAll('.nav-tools a.lang').forEach(link=>{
      const label=(link.getAttribute('aria-label')||'').toLowerCase();
      const linkLang=label==='türkçe'?'tr':label==='deutsch'?'de':label==='english'?'en':'';
      link.classList.toggle('active',linkLang===lang);
    });
    document.querySelectorAll('.lang button').forEach(button=>{
      const buttonLang=button.id.toLowerCase().replace('btn','');
      if(choices[buttonLang])button.classList.toggle('active',buttonLang===lang);
    });
    document.querySelectorAll('img[src*="/brand/werkar-logo-"][src$=".svg"]').forEach(img=>{
      const src=img.getAttribute('src');
      if(!src)return;
      const localized=src.replace(/-(?:en|tr|de)(\.svg)$/,'$1').replace(/\.svg$/,`-${lang}.svg`);
      if(localized!==src)img.setAttribute('src',localized);
      const descriptions={tr:'WERKAR — Kapı, Pencere ve Mimari Çözümler',en:'WERKAR — Doors, Windows & Architectural Solutions',de:'WERKAR — Türen, Fenster und Architekturlösungen'};
      img.setAttribute('alt',descriptions[lang]);
    });
  };
  document.addEventListener('DOMContentLoaded',update);
  document.addEventListener('click',event=>{if(event.target.closest('#tr,#trBtn,#en,#enBtn,#de,#deBtn,.lang'))queueMicrotask(update)});
  window.addEventListener('werkar:languagechange',update);
  window.addEventListener('pageshow',update);
  update();
})();
