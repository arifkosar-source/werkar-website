(()=>{
  const isInternalHtml=(href)=>href&&/\.html(?:[?#]|$)/i.test(href)&&!/^(?:https?:|mailto:|tel:)/i.test(href);
  const storageKey='werkarLang';
  const currentHasGerman=()=>{try{return new URLSearchParams(location.search).get('lang')==='de'||localStorage.getItem(storageKey)==='de'}catch(e){return new URLSearchParams(location.search).get('lang')==='de'}};
  const updateLinks=(german)=>document.querySelectorAll('a[href]').forEach(a=>{
    const href=a.getAttribute('href'); if(!isInternalHtml(href))return;
    const hashAt=href.indexOf('#'), hash=hashAt>=0?href.slice(hashAt):'', before=hashAt>=0?href.slice(0,hashAt):href;
    const queryAt=before.indexOf('?'), file=queryAt>=0?before.slice(0,queryAt):before, query=queryAt>=0?before.slice(queryAt+1):'';
    const params=new URLSearchParams(query);
    if(german) params.set('lang','de'); else params.delete('lang');
    const next=params.toString(); a.setAttribute('href',file+(next?'?'+next:'')+hash);
  });
  const activateGerman=()=>{try{localStorage.setItem(storageKey,'de')}catch(e){} updateLinks(true);};
  const clearGerman=()=>{try{localStorage.removeItem(storageKey)}catch(e){} updateLinks(false);};
  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('a[href="de-index.html"],a[href^="de-index.html?"]').forEach(a=>a.addEventListener('click',activateGerman));
    ['de','deBtn'].forEach(id=>{const b=document.getElementById(id);if(b)b.addEventListener('click',activateGerman);});
    ['tr','trBtn','en','enBtn'].forEach(id=>{const b=document.getElementById(id);if(b)b.addEventListener('click',clearGerman);});
    document.querySelectorAll('a[aria-label="Türkçe"],a[aria-label="English"]').forEach(a=>a.addEventListener('click',clearGerman));
    if(!currentHasGerman()){
      let isTurkish=false;try{isTurkish=localStorage.getItem(storageKey)==='tr'}catch(e){}
      const currentFile=location.pathname.split('/').pop().toLowerCase();
      if(isTurkish&&currentFile==='index.html'){
        location.replace('1-index.html'+location.search+location.hash);
      }
      return;
    }
    activateGerman();
    const file=location.pathname.split('/').pop().toLowerCase();
    if(file==='index.html'||file==='1-index.html'){
      const target='de-index.html?lang=de'+location.hash;
      if(!location.href.endsWith(target))location.replace(target);
      return;
    }
    if(typeof window.applyWerkarGerman==='function')window.applyWerkarGerman();
  });
})();
