(() => {
  const form = document.getElementById('loginForm');
  const tokenInput = document.getElementById('token');
  const list = document.getElementById('inquiryList');
  const message = document.getElementById('message');
  const storageKey = 'werkarAdminToken';

  const setMessage = (text, error = false) => {
    message.textContent = text;
    message.style.color = error ? '#b4232d' : '#52616b';
  };

  async function api(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: { authorization: `Bearer ${sessionStorage.getItem(storageKey) || ''}`, ...(options.headers || {}) }
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `İstek başarısız (${response.status})`);
    return body;
  }

  function render(items) {
    list.replaceChildren();
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'panel muted';
      empty.textContent = 'Henüz proje talebi bulunmuyor.';
      list.append(empty);
      return;
    }
    for (const item of items) {
      const card = document.createElement('article');
      card.className = 'card';
      const title = document.createElement('h2');
      title.textContent = `${item.name} — ${item.category}`;
      const meta = document.createElement('div');
      meta.className = 'meta';
      const email = document.createElement('a'); email.href = `mailto:${encodeURIComponent(item.email)}`; email.textContent = item.email;
      const date = new Date(item.created_at);
      const when = document.createElement('span'); when.textContent = Number.isNaN(date.valueOf()) ? item.created_at : date.toLocaleString('tr-TR');
      meta.append(email, when);
      const extra = document.createElement('p');
      extra.className = 'meta';
      extra.textContent = [`Telefon: ${item.phone || '—'}`, `Proje türü: ${item.project_type || '—'}`, `Konum: ${item.location || '—'}`].join(' · ');
      const details = document.createElement('p'); details.className = 'details'; details.textContent = item.details;
      const footer = document.createElement('footer');
      const status = document.createElement('span'); status.className = 'status'; status.textContent = item.status === 'reviewed' ? 'İncelendi' : 'Yeni';
      const sent = document.createElement('span'); sent.className = 'muted'; sent.textContent = item.notification_sent ? 'E-posta bildirimi gönderildi' : 'E-posta bildirimi gönderilemedi / yapılandırılmadı';
      const button = document.createElement('button'); button.textContent = item.status === 'reviewed' ? 'Yeni olarak işaretle' : 'İncelendi olarak işaretle';
      button.addEventListener('click', async () => {
        button.disabled = true;
        try {
          await api(`/api/admin/inquiries/${encodeURIComponent(item.id)}/status`, {
            method: 'PATCH', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ status: item.status === 'reviewed' ? 'new' : 'reviewed' })
          });
          await load();
        } catch (error) { setMessage(error.message, true); button.disabled = false; }
      });
      footer.append(status, sent, button);
      card.append(title, meta, extra, details, footer);
      list.append(card);
    }
  }

  async function load() {
    setMessage('Talepler yükleniyor…');
    try {
      const data = await api('/api/admin/inquiries');
      render(data.inquiries || []);
      setMessage(`${(data.inquiries || []).length} kayıt gösteriliyor.`);
    } catch (error) { list.replaceChildren(); setMessage(error.message, true); }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const token = tokenInput.value.trim();
    sessionStorage.setItem(storageKey, token);
    await load();
  });
  document.getElementById('logout').addEventListener('click', () => {
    sessionStorage.removeItem(storageKey); tokenInput.value = ''; list.replaceChildren(); setMessage('Oturum kapatıldı.');
  });

  const saved = sessionStorage.getItem(storageKey);
  if (saved) { tokenInput.value = saved; load(); }
})();
