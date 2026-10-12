import { readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.join(root, 'images', 'projects');
const dataOutput = path.join(root, 'js', 'projects-gallery-data.js');
const csvOutput = path.join(projectRoot, 'PROJE-GORSEL-KATALOGU.csv');
const allowed = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const excludedFolders = new Set(['99-incelenecek']);
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
const known = {
  '01-konut-projeleri': { en: 'Residential Projects', tr: 'Konut Projeleri', de: 'Wohnprojekte', product: 'renovation-custom' },
  '02-ticari-projeler': { en: 'Commercial Projects', tr: 'Ticari Projeler', de: 'Gewerbeprojekte', product: 'facades' },
  '03-kapi-ve-giris': { en: 'Doors & Entry', tr: 'Kapı ve Giriş', de: 'Türen und Eingänge', product: 'doors' },
  '04-pencere-ve-cam': { en: 'Windows & Glass', tr: 'Pencere ve Cam', de: 'Fenster und Glas', product: 'windows' },
  '05-surme-ve-katlanir': { en: 'Sliding & Folding', tr: 'Sürme ve Katlanır', de: 'Schiebe- und Faltsysteme', product: 'sliding-folding' },
  '06-pergola-ve-golgelendirme': { en: 'Pergolas & Shade', tr: 'Pergola ve Gölgelendirme', de: 'Pergolen und Beschattung', product: 'bioclimatic-pergolas' },
  '07-montaj-oncesi-sonrasi': { en: 'Installation', tr: 'Montaj Öncesi / Sonrası', de: 'Montage', product: 'installation' },
  '08-cam-kupeste-ve-korkuluk': { en: 'Glass Railings', tr: 'Cam Küpeşte ve Korkuluk', de: 'Glasgeländer', product: 'stairs-railings' },
  '09-kis-bahcesi': { en: 'Winter Gardens', tr: 'Kış Bahçeleri', de: 'Wintergärten', product: 'winter-gardens' },
  '10-ofis-bolme': { en: 'Office Partitions', tr: 'Ofis Bölme Sistemleri', de: 'Bürotrennwände', product: 'office-partitions' },
  '11-aluminyum-cit-ve-bahce-sistemleri': { en: 'Aluminium Fences & Garden Systems', tr: 'Alüminyum Çit ve Bahçe Sistemleri', de: 'Aluminiumzäune und Gartensysteme', product: 'aluminium-fences-garden' }
};
const humanize = value => value.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, letter => letter.toLocaleUpperCase('en'));
const slugify = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('en').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const csvEscape = value => '"' + String(value).replace(/"/g, '""') + '"';
async function collect(dir, relative = '') {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const rel = path.posix.join(relative, entry.name);
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...await collect(full, rel));
    else if (entry.isFile() && allowed.has(path.extname(entry.name).toLowerCase())) found.push({ full, relative: rel, name: entry.name });
  }
  return found;
}
function labelsFor(folder) {
  if (known[folder]) return known[folder];
  const plain = folder.replace(/^\d+[-_]?/, '').replace(/[-_]+/g, ' ').trim();
  const tr = humanize(plain || folder);
  const key = slugify(folder);
  const localized = [
    { test: /dusakabin|shower|bathroom/, en: 'Shower Enclosures & Bath Systems', tr: 'Duşakabin ve Banyo Sistemleri', de: 'Duschkabinen und Badsysteme', product: 'shower-interior-glass' },
    { test: /pergola|golgelendirme|awning/, en: 'Pergolas & Shade', tr: 'Pergola ve Gölgelendirme', de: 'Pergola-Systeme', product: 'bioclimatic-pergolas' },
    { test: /surme|katlanir|sliding|folding/, en: 'Sliding & Folding', tr: 'Sürme ve Katlanır', de: 'Schiebe- und Faltsysteme', product: 'sliding-folding' },
    { test: /kis-bahcesi|winter-garden/, en: 'Winter Gardens', tr: 'Kış Bahçeleri', de: 'Wintergärten', product: 'winter-gardens' },
    { test: /ofis|office/, en: 'Office Partitions', tr: 'Ofis Bölme Sistemleri', de: 'Bürotrennwände', product: 'office-partitions' },
    { test: /cit|fence/, en: 'Aluminium Fences & Garden Systems', tr: 'Alüminyum Çit ve Bahçe Sistemleri', de: 'Aluminiumzäune und Gartensysteme', product: 'aluminium-fences-garden' },
    { test: /pencere|window/, en: 'Windows & Glass', tr: 'Pencere ve Cam', de: 'Fenster und Glas', product: 'windows' },
    { test: /kapi|door/, en: 'Doors & Entry', tr: 'Kapı ve Giriş', de: 'Türen und Eingänge', product: 'doors' },
    { test: /kupeste|railing|stairs/, en: 'Glass Railings', tr: 'Cam Küpeşte ve Korkuluk', de: 'Glasgeländer', product: 'stairs-railings' }
  ].find(item => item.test.test(key));
  if (localized) return localized;
  const product = null;
  return { en: tr, tr, de: tr, product };
}
function titlesFor(file, folder, ordinal, labels) {
  const stem = path.basename(file, path.extname(file));
  const normalized = slugify(stem);
  const folderBase = slugify(folder.replace(/^\d+[-_]?/, ''));
  const generic = /^images(?:-\d+)?$/.test(normalized);
  const numberMatch = stem.match(/\((\d+)\)/) || stem.match(/(?:^|[-_])(\d{1,3})$/);
  const number = String(numberMatch ? Number(numberMatch[1]) : ordinal).padStart(2, '0');
  const suffix = folderBase && normalized.startsWith(folderBase + '-') ? normalized.slice(folderBase.length + 1) : '';
  if (generic || /^\d{1,3}$/.test(suffix)) return { en: labels.en + ' Project ' + number, tr: labels.tr + ' Projesi ' + number, de: labels.de + ' Projekt ' + number };
  let title = humanize(stem.replace(/-\d{3,4}x\d{3,4}$/i, ''));
  title = title.replace(/\b(fw|si|sp|ewt|hss|ssi|oval)\s?(\d+)/gi, (_, code, digits) => code.toUpperCase() + ' ' + digits);
  return { en: title, tr: title, de: title };
}

const dirs = (await readdir(projectRoot, { withFileTypes: true }))
  .filter(entry => entry.isDirectory() && !excludedFolders.has(entry.name) && !entry.name.startsWith('.'))
  .sort((a, b) => collator.compare(a.name, b.name));
const projects = [];
const csvRows = [['SourceFolder', 'Kategori', 'Dosya', 'Uzanti', 'BoyutKB']];
for (const dir of dirs) {
  const labels = labelsFor(dir.name);
  const files = (await collect(path.join(projectRoot, dir.name))).sort((a, b) => collator.compare(a.relative, b.relative));
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const title = titlesFor(file.relative, dir.name, i + 1, labels);
    const rel = file.relative.split(path.sep).join('/');
    const size = (await stat(file.full)).size;
    projects.push({ category: dir.name, categoryEn: labels.en, categoryTr: labels.tr, categoryDe: labels.de, file: rel, titleEn: title.en, titleTr: title.tr, titleDe: title.de, product: labels.product, sizeBytes: size });
    csvRows.push([dir.name, dir.name, rel, path.extname(file.name).toLowerCase(), (size / 1024).toFixed(1)]);
  }
}
const data = '// Generated by scripts/sync-project-gallery.mjs. Edit source folders, then rerun the generator.\nwindow.WERKAR_PROJECTS = ' + JSON.stringify(projects, null, 2) + ';\n';
await writeFile(dataOutput, data, 'utf8');
await writeFile(csvOutput, csvRows.map(row => row.map(csvEscape).join(',')).join('\r\n') + '\r\n', 'utf8');
console.log(`Project gallery synced: ${projects.length} images in ${new Set(projects.map(item => item.category)).size} populated categories.`);
console.log('Unclassified 99-incelenecek folder was excluded.');