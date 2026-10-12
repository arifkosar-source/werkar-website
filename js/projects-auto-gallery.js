(function(){
  'use strict';
  const projects=Array.isArray(window.WERKAR_PROJECTS)?window.WERKAR_PROJECTS:[];
  const filters=document.getElementById('projectFilters');
  const gallery=document.getElementById('projectGallery');
  if(!filters||!gallery)return;
  const text={
    en:{all:'All Projects',empty:'Project photos will appear here as they are added.'},
    tr:{all:'Tüm Projeler',empty:'Proje fotoğrafları eklendikçe burada görünecek.'},
    de:{all:'Alle Projekte',empty:'Projektfotos erscheinen hier, sobald sie hinzugefügt wurden.'}
  };
  const language=()=>document.documentElement.lang.toLowerCase().startsWith('tr')?'tr':document.documentElement.lang.toLowerCase().startsWith('de')?'de':'en';
  const escape=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const encoded=path=>path.split('/').map(encodeURIComponent).join('/');
  const categories=[...new Map(projects.map(item=>[item.category,{id:item.category,en:item.categoryEn,tr:item.categoryTr,de:item.categoryDe}])).values()];
  let active='all';
  function renderFilters(){
    const lang=language();
    const items=[{id:'all',label:text[lang].all,count:projects.length},...categories.map(category=>({id:category.id,label:category[lang]||category.en,count:projects.filter(project=>project.category===category.id).length}))].filter(item=>item.count>0||item.id==='all');
    filters.innerHTML=items.map(item=>'<button class="filter'+(active===item.id?' active':'')+'" type="button" data-filter="'+escape(item.id)+'" aria-pressed="'+(active===item.id)+'">'+escape(item.label)+'<span class="filter-count">'+item.count+'</span></button>').join('');
    filters.setAttribute('aria-label',lang==='tr'?'Proje kategorileri':lang==='de'?'Projektkategorien':'Project categories');
  }
  function renderCards(){
    const lang=language();
    const items=active==='all'?projects:projects.filter(item=>item.category===active);
    gallery.innerHTML=items.length?items.map(item=>{
      const src=encoded('images/projects/'+item.category+'/'+item.file);
      const languageKey=lang==='tr'?'Tr':lang==='de'?'De':'En';
      const title=item['title'+languageKey]||item.titleEn;
      const category=item['category'+languageKey]||item.categoryEn;
      const alt='WERKAR — '+category+' — '+title;
      const href=item.product?'product-detail.html?product='+encodeURIComponent(item.product)+(lang==='de'?'&lang=de':''):src;
      return '<article class="project-tile" data-category="'+escape(item.category)+'"><a href="'+escape(href)+'"'+(item.product?'':' target="_blank" rel="noopener noreferrer"')+' aria-label="'+escape(title+' — '+category)+'"><img src="'+escape(src)+'" alt="'+escape(alt)+'" loading="lazy" decoding="async"><div class="project-tile-info"><strong>'+escape(title)+'</strong><small>'+escape(category)+'</small></div></a></article>';
    }).join(''):'<p class="project-gallery-empty">'+escape(text[lang].empty)+'</p>';
  }
  function select(id){active=id;renderFilters();gallery.classList.add('is-changing');window.setTimeout(()=>{renderCards();gallery.classList.remove('is-changing')},100)}
  filters.addEventListener('click',event=>{const button=event.target.closest('[data-filter]');if(button)select(button.dataset.filter)});
  ['en','tr','de','enBtn','trBtn','deBtn'].forEach(id=>{const button=document.getElementById(id);if(button)button.addEventListener('click',()=>window.setTimeout(()=>{renderFilters();renderCards()},0))});
  window.addEventListener('werkar:languagechange',()=>{renderFilters();renderCards()});
  renderFilters();
  renderCards();
})();