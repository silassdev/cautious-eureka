(function(){
  const form = document.getElementById('f');
  const urlInput = document.getElementById('url');
  const outArea = document.getElementById('outArea');
  const shortUrlEl = document.getElementById('shortUrl');
  const originalMeta = document.getElementById('originalMeta');
  const shortenBtn = document.getElementById('shortenBtn');
  const btnLabel = document.getElementById('btnLabel');
  const btnSpinner = document.getElementById('btnSpinner');
  const copyBtn = document.getElementById('copyBtn');
  const openBtn = document.getElementById('openBtn');
  const clearBtn = document.getElementById('clearBtn');
  const toast = document.getElementById('toast');

  document.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
    urlInput.value = c.dataset.example;
    urlInput.focus();
  }));

  clearBtn.addEventListener('click', () => {
    urlInput.value = '';
    urlInput.focus();
    hideResult();
  });

  copyBtn.addEventListener('click', async () => {
    const txt = shortUrlEl.textContent;
    if (!txt) return;
    try {
      await navigator.clipboard.writeText(txt);
      showToast('Copied to clipboard');
    } catch (err) {
      showToast('Copy failed — try manual');
    }
  });

  function showToast(msg){
    toast.textContent = msg;
    toast.style.display = 'block';
    clearTimeout(toast._t);
    toast._t = setTimeout(()=> toast.style.display = 'none', 2500);
  }

  function setLoading(loading){
    if (loading){
      btnSpinner.style.display = '';
      btnLabel.style.opacity = 0.6;
      shortenBtn.disabled = true;
      shortenBtn.setAttribute('aria-busy','true');
    } else {
      btnSpinner.style.display = 'none';
      btnLabel.style.opacity = 1;
      shortenBtn.disabled = false;
      shortenBtn.removeAttribute('aria-busy');
    }
  }

  function showResult(shortUrl, original){
    outArea.style.display = '';
    shortUrlEl.textContent = shortUrl;
    originalMeta.textContent = original;
    openBtn.href = shortUrl;
  }

  function hideResult(){
    outArea.style.display = 'none';
    shortUrlEl.textContent = '';
    originalMeta.textContent = '';
  }

  function demoShort(original){
    const rand = Math.random().toString(36).slice(2,9);
    return location.origin + '/' + rand;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const val = urlInput.value.trim();
    if (!val) return;
    setLoading(true);
    try {
      const res = await fetch('/api/shorten', {
        method:'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ originalUrl: val })
      });

      let data;
      try { data = await res.json(); } catch(err){ data = null; }

      if (res.ok && data && data.shortUrl){
        showResult(data.shortUrl, val);
        showToast('Shortened successfully');
      } else {
        const fake = demoShort(val);
        showResult(fake, '(demo) ' + val);
        showToast('API not available — showing demo short URL');
        console.warn('Shorten API error', res.status, data);
      }
    } catch (err){
      const fake = demoShort(val);
      showResult(fake, '(demo) ' + val);
      showToast('Network error — demo short URL created');
      console.error(err);
    } finally {
      setLoading(false);
    }
  });

  urlInput.addEventListener('keydown', (e)=>{
    if (e.key === 'Enter') {
      e.preventDefault();
      shortenBtn.click();
    }
  });

  window.addEventListener('focus', () => {
    if (!urlInput.value) urlInput.focus();
  });
})();
