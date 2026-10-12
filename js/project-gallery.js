(function(){
  'use strict';
  const fallbackGroups={
    '01-konut-projeleri':{en:'Residential Projects',tr:'Konut Projeleri',de:'Wohnprojekte'},
    '02-ticari-projeler':{en:'Commercial Projects',tr:'Ticari Projeler',de:'Gewerbeprojekte'},
    '03-kapi-ve-giris':{en:'Doors & Entry',tr:'Kapı ve Giriş',de:'Türen und Eingänge'},
    '04-pencere-ve-cam':{en:'Windows & Glass',tr:'Pencere ve Cam',de:'Fenster und Glas'},
    '05-surme-ve-katlanir':{en:'Sliding & Folding',tr:'Sürme ve Katlanır',de:'Schiebe- und Faltsysteme'},
    '06-pergola-ve-golgelendirme':{en:'Pergolas & Shade',tr:'Pergola ve Gölgelendirme',de:'Pergola-Systeme'},
    '07-montaj-oncesi-sonrasi':{en:'Installation',tr:'Montaj Öncesi / Sonrası',de:'Montage'},
    '08-cam-kupeste-ve-korkuluk':{en:'Glass Railings',tr:'Cam Küpeşte ve Korkuluk',de:'Glasgeländer'},
    '09-kis-bahcesi':{en:'Winter Gardens',tr:'Kış Bahçeleri',de:'Wintergärten'},
    '10-ofis-bolme':{en:'Office Partitions',tr:'Ofis Bölme Sistemleri',de:'Bürotrennwände'},
    '11-aluminyum-cit-ve-bahce-sistemleri':{en:'Aluminium Fences & Garden Systems',tr:'Alüminyum Çit ve Bahçe Sistemleri',de:'Aluminiumzäune und Gartensysteme'},
    '12-dusakabin-ve-banyo-sistemleri':{en:'Shower Enclosures & Bath Systems',tr:'Duşakabin ve Banyo Sistemleri',de:'Duschkabinen und Badsysteme'}
  };
  const productCategory={
    doors:'03-kapi-ve-giris',windows:'04-pencere-ve-cam','sliding-folding':'05-surme-ve-katlanir',sliding:'05-surme-ve-katlanir',
    facades:'02-ticari-projeler','glass-aluminum':'04-pencere-ve-cam','bioclimatic-pergolas':'06-pergola-ve-golgelendirme',
    'retractable-pergolas':'06-pergola-ve-golgelendirme',pergola:'06-pergola-ve-golgelendirme',awnings:'06-pergola-ve-golgelendirme',
    'winter-gardens':'09-kis-bahcesi','stairs-railings':'08-cam-kupeste-ve-korkuluk',
    'renovation-custom':'07-montaj-oncesi-sonrasi','office-partitions':'10-ofis-bolme',installation:'07-montaj-oncesi-sonrasi',
    'aluminium-fences-garden':'11-aluminyum-cit-ve-bahce-sistemleri'
  };
  const categorySlug=value=>String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ö/g,'o').replace(/ç/g,'c').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const humanize=value=>String(value||'').replace(/^\d+[-_]?/,'').replace(/[-_]+/g,' ').replace(/\s+/g,' ').trim().replace(/\b\w/g,c=>c.toLocaleUpperCase('en'))||'Other Projects';
  function inferCategory(item,pathMatch,label){
    const explicit=item.category||item.folder||item.categorySlug||pathMatch?.[1];
    if(explicit)return explicit;
    const search=categorySlug([label,item.alt,item.titleTr,item.titleEn,item.name,item.file,item.src,item.path].filter(Boolean).join(' '));
    if(/dusakabin|shower|bathroom/.test(search))return '12-dusakabin-ve-banyo-sistemleri';
    if(/kis-bahcesi|winter-garden/.test(search))return '09-kis-bahcesi';
    if(/ofis-bolme|office-partition/.test(search))return '10-ofis-bolme';
    if(/aluminyum-cit|garden-fence|aluminium-fence/.test(search))return '11-aluminyum-cit-ve-bahce-sistemleri';
    if(/surme|katlanir|sliding|folding/.test(search))return '05-surme-ve-katlanir';
    if(/pencere|window/.test(search))return '04-pencere-ve-cam';
    if(/kapi|door/.test(search))return '03-kapi-ve-giris';
    if(/pergola|golgelendirme|awning/.test(search))return '06-pergola-ve-golgelendirme';
    if(/kupeste|railing|stairs/.test(search))return '08-cam-kupeste-ve-korkuluk';
    return label?categorySlug(label):'other-projects';
  }
  const rawProjects=Array.isArray(window.WERKAR_PROJECTS)?window.WERKAR_PROJECTS:[];
  const projects=rawProjects.map(item=>{
    const source=String(item.src||item.path||item.file||'').replace(/\\/g,'/');
    const pathMatch=source.match(/(?:^|\/)images\/projects\/([^/]+)\/(.+)$/i);
    const label=Array.isArray(item.tags)?item.tags[0]:(item.categoryLabel||item.categoryName||item.tag||item.label||'');
    const category=inferCategory(item,pathMatch,label);
    const file=item.filename||pathMatch?.[2]||item.file||source;
    const known=fallbackGroups[category]||{};
    const categoryTr=item.categoryTr||item.categoryLabelTr||String(label||known.tr||humanize(category));
    return {...item,category,file,categoryEn:item.categoryEn||item.categoryLabelEn||known.en||humanize(category),categoryTr,categoryDe:item.categoryDe||item.categoryLabelDe||known.de||humanize(category)};
  }).filter(item=>item.category&&item.file);
  const groups={};
  projects.forEach(item=>{if(!groups[item.category])groups[item.category]={en:item.categoryEn,tr:item.categoryTr,de:item.categoryDe}});  const section=document.getElementById('projectGallerySection');
  const filters=document.getElementById('projectGalleryFilters');
  const grid=document.getElementById('projectGalleryGrid');
  const dialog=document.getElementById('projectGalleryDialog');
  const dialogImage=document.getElementById('projectGalleryDialogImage');
  const dialogTitle=document.getElementById('projectGalleryDialogTitle');
  const closeButton=document.getElementById('projectGalleryClose');
  if(!section||!filters||!grid||!dialog)return;
  const locale=()=>['tr','de'].includes(document.documentElement.lang)?document.documentElement.lang:'en';
  const copy={en:{all:'All projects',open:'Open image',project:'Project',application:'Application',empty:'No project images are available in this group yet.'},tr:{all:'Tüm Projeler',open:'Görseli büyüt',project:'Proje',application:'Uygulama',empty:'Bu grupta henüz proje görseli bulunmuyor.'},de:{all:'Alle Projekte',open:'Bild öffnen',project:'Projekt',application:'Anwendung',empty:'Für diese Gruppe sind noch keine Projektbilder verfügbar.'}};
  const safe=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const categoryName=(slug,lang=locale())=>{const group=groups[slug]||{};return group[lang]||group.en||slug};
  const toUrl=path=>path.split('/').map(encodeURIComponent).join('/');
  const titleFor=(file,slug,index,lang=locale())=>{
    const base=file.replace(/\.[^.]+$/,'');
    if(/^images(?:\s*\(\d+\))?$/i.test(base))return categoryName(slug,lang)+' — '+copy[lang].project+' '+String(index).padStart(2,'0');
    return base.replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim().replace(/\b\w/g,c=>c.toUpperCase());
  };
  const projectCount=slug=>projects.filter(project=>project.category===slug).length;
  const groupList=[...new Set(projects.map(project=>project.category))].filter(slug=>projectCount(slug)>0);
  const requestedProduct=new URLSearchParams(window.location.search).get('product');
  const dataCategory=projects.find(project=>project.product===requestedProduct)?.category||projects.find(project=>project.category===requestedProduct||categorySlug(project.category)===categorySlug(requestedProduct))?.category;
  const requestedCategory=dataCategory||productCategory[requestedProduct];
  let active=requestedCategory&&projectCount(requestedCategory)>0?requestedCategory:'all';
  function renderFilters(){
    const lang=locale();
    filters.setAttribute('aria-label',lang==='tr'?'Proje kategorileri':lang==='de'?'Projektkategorien':'Project categories');
    closeButton.setAttribute('aria-label',lang==='tr'?'Görseli kapat':lang==='de'?'Bild schließen':'Close image');
    const list=[{id:'all',label:copy[lang].all},...groupList.map(id=>({id,label:categoryName(id,lang)}))];
    filters.innerHTML=list.map(item=>'<button type="button" class="project-filter'+(item.id===active?' is-active':'')+'" data-filter="'+safe(item.id)+'" aria-pressed="'+(item.id===active)+'">'+safe(item.label)+'<span>'+ (item.id==='all'?projects.length:projectCount(item.id))+'</span></button>').join('');
  }
  function renderCards(){
    const lang=locale();
    const chosen=active==='all'?projects:projects.filter(item=>item.category===active);
    const indices={};
    if(!chosen.length){grid.innerHTML='<p class="project-gallery-empty" role="status">'+safe(copy[lang].empty)+'</p>';grid.classList.remove('is-changing');return}
    grid.innerHTML=chosen.map(item=>{
      indices[item.category]=(indices[item.category]||0)+1;
      const group=categoryName(item.category,lang);
      const languageKey=lang==='tr'?'Tr':lang==='de'?'De':'En';
      const title=item['title'+languageKey]||titleFor(item.file,item.category,indices[item.category],lang);
      const src=toUrl('images/projects/'+item.category+'/'+item.file);
      const alt='Project gallery — '+group+' — '+title;
      return '<article class="project-card"><button class="project-card-button" type="button" data-project-src="'+safe(src)+'" data-project-title="'+safe(title)+'" data-project-alt="'+safe(alt)+'" aria-label="'+safe(copy[lang].open+': '+title)+'"><span class="project-card-media"><img src="'+safe(src)+'" alt="'+safe(alt)+'" loading="lazy" decoding="async"><span class="project-card-overlay"><span>'+safe(copy[lang].open)+' <i aria-hidden="true">↗</i></span></span></span><span class="project-card-copy"><span class="project-card-title">'+safe(title)+'</span><span class="project-card-category">'+safe(group)+'</span></span></button></article>';
    }).join('');
    grid.classList.remove('is-changing');
  }
  function setFilter(id){
    active=id;
    grid.classList.add('is-changing');
    renderFilters();
    window.setTimeout(renderCards,100);
  }
  filters.addEventListener('click',event=>{const button=event.target.closest('[data-filter]');if(button)setFilter(button.dataset.filter)});
  grid.addEventListener('click',event=>{
    const button=event.target.closest('[data-project-src]');
    if(!button)return;
    dialogImage.src=button.dataset.projectSrc;
    dialogImage.alt=button.dataset.projectAlt;
    dialogTitle.textContent=button.dataset.projectTitle;
    if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
  });
  closeButton.addEventListener('click',()=>dialog.close?dialog.close():dialog.removeAttribute('open'));
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close?dialog.close():dialog.removeAttribute('open')});
  dialog.addEventListener('close',()=>{dialogImage.removeAttribute('src');dialogImage.alt=''});
  ['enBtn','trBtn','deBtn'].forEach(id=>{const button=document.getElementById(id);if(button)button.addEventListener('click',()=>window.setTimeout(()=>{renderFilters();renderCards()},0))});
  window.addEventListener('werkar:languagechange',()=>{renderFilters();renderCards()});

  renderFilters();
  renderCards();
})();

