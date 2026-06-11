// ============================================
// SNAPDROP — MAIN JAVASCRIPT v2
// API: api.theresav.biz.id/download/aio
// ============================================

// ── CONFIG ──────────────────────────────────
const API_BASE = 'https://api.theresav.biz.id/download/aio';
const API_KEY  = 'P4QlB';
const TIMEOUT  = 20000; // 20 detik

// CORS proxy fallback untuk download blob
const CORS_PROXIES = [
  (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`
];

// State download link global
window.videoDownloadLink = null;
window.musicDownloadLink = null;

// ============ THEME ============
const themeToggle = document.getElementById('themeToggle');
const prefersDark  = window.matchMedia('(prefers-color-scheme: dark)');

function updateTheme(isDark) {
  if (isDark) {
    document.body.classList.add('dark-mode');
    localStorage.setItem('theme', 'dark');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  } else {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('theme', 'light');
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
  }
}

const savedTheme = localStorage.getItem('theme');
updateTheme(savedTheme ? savedTheme === 'dark' : prefersDark.matches);

themeToggle.addEventListener('click', () => {
  updateTheme(!document.body.classList.contains('dark-mode'));
});

// ============ NAVBAR ============
const navbar   = document.getElementById('navbar');
const navMenu  = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);

  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 320) current = sec.getAttribute('id');
  });
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) link.classList.add('active');
  });
}, { passive: true });

// Hamburger
document.getElementById('hamburger').addEventListener('click', () => {
  navMenu.classList.toggle('open');
});
navLinks.forEach(l => l.addEventListener('click', () => navMenu.classList.remove('open')));

// Tutup menu saat klik di luar
document.addEventListener('click', (e) => {
  if (!navbar.contains(e.target)) navMenu.classList.remove('open');
});

// ============ INPUT ============
const urlInput = document.getElementById('url');
const clearBtn = document.getElementById('clearBtn');

urlInput.addEventListener('input', () => {
  clearBtn.style.display = urlInput.value ? 'flex' : 'none';
});

function clearInput() {
  urlInput.value = '';
  clearBtn.style.display = 'none';
  urlInput.focus();
}

// Enter untuk fetch
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') fetchMedia();
});

// ============ LOADING ============
function showLoading(text = 'Mengambil media...') {
  document.getElementById('loadingText').textContent = text;
  document.getElementById('loadingSpinner').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loadingSpinner').style.display = 'none';
}

// ============ FETCH MEDIA ============
async function fetchMedia() {
  const url = urlInput.value.trim();

  if (!url) {
    showToast('Masukkan URL terlebih dahulu!', 'error');
    return;
  }

  if (!isValidUrl(url)) {
    showToast('URL tidak valid. Pastikan link benar.', 'error');
    return;
  }

  clearPreview();
  document.getElementById('result').style.display = 'none';
  showLoading('Menghubungi server...');

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    const apiUrl   = `${API_BASE}?url=${encodeURIComponent(url)}&apikey=${API_KEY}`;
    const response = await fetch(apiUrl, { signal: controller.signal });

    clearTimeout(timer);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    hideLoading();

    // ── DEBUG: log seluruh response API ─────────────────────
    console.log('[SnapDrop] Full API response:', JSON.stringify(data, null, 2));

    // Validasi response
    if (!data.status) {
      showToast('Gagal mengambil media. Coba lagi.', 'error');
      return;
    }

    const result = data.result;
    // Toleran: beberapa API mengembalikan array kosong atau field berbeda
    if (!result) {
      showToast('Media tidak ditemukan. Pastikan URL benar dan publik.', 'error');
      return;
    }
    // Normalisasi: jika medias tidak ada tapi ada url langsung di result
    if (!result.medias || result.medias.length === 0) {
      if (result.url) {
        result.medias = [{ type: 'video', url: result.url }];
      } else if (result.video) {
        result.medias = [{ type: 'video', url: result.video }];
      } else if (result.audio || result.music) {
        result.medias = [{ type: 'audio', url: result.audio || result.music }];
      } else {
        showToast('Media tidak ditemukan. Pastikan URL benar dan publik.', 'error');
        return;
      }
    }

    renderResult(result, url);

  } catch (err) {
    hideLoading();
    if (err.name === 'AbortError') {
      showToast('Timeout. Koneksi lambat atau server sibuk.', 'error');
    } else {
      showToast('Terjadi kesalahan. Periksa URL dan coba lagi.', 'error');
    }
    console.error('[SnapDrop] fetchMedia error:', err);
  }
}

// ============ RENDER RESULT ============
function renderResult(result, originalUrl) {
  const preview  = document.getElementById('media-preview');
  const platform = result.source || detectPlatform(originalUrl);
  const caption  = result.title  || '';

  preview.innerHTML = '';

  // ── DEBUG: lihat semua media yang dikembalikan API ──────────
  console.log('[SnapDrop] Raw result:', result);
  console.log('[SnapDrop] Medias array:', result.medias);

  const medias = result.medias || [];

  // ── Cari video: type === 'video' ATAU ada quality/ext video ─
  const videoMedia = medias.find(m =>
    m.type === 'video' ||
    (m.url && (m.extension === 'mp4' || m.quality?.toLowerCase().includes('p')))
  );

  // ── Cari audio: type === 'audio' ATAU extension audio ───────
  const audioMedia = medias.find(m =>
    m.type === 'audio' ||
    m.extension === 'mp3' ||
    m.extension === 'm4a' ||
    m.type === 'music'
  );

  // Fallback: jika tidak ada yang cocok, ambil item pertama yang ada URL
  const anyMedia = medias.find(m => m.url);

  console.log('[SnapDrop] videoMedia:', videoMedia);
  console.log('[SnapDrop] audioMedia:', audioMedia);

  // ── RENDER VIDEO ─────────────────────────────────────────────
  const vUrl = videoMedia?.url || (anyMedia && !audioMedia ? anyMedia.url : null);
  if (vUrl) {
    const videoEl = document.createElement('video');
    videoEl.controls  = true;
    videoEl.preload   = 'metadata';
    videoEl.crossOrigin = 'anonymous'; // bantu CORS untuk beberapa CDN
    videoEl.style.cssText = 'width:100%;border-radius:12px;background:#000;display:block;';

    // Tambah beberapa source untuk kompatibilitas
    ['video/mp4', 'video/webm', 'video/ogg'].forEach(mime => {
      const s = document.createElement('source');
      s.src  = vUrl;
      s.type = mime;
      videoEl.appendChild(s);
    });

    videoEl.insertAdjacentText('beforeend', 'Browser kamu tidak mendukung video.');

    // Error handler: jika video gagal load, tampilkan pesan
    videoEl.addEventListener('error', () => {
      console.warn('[SnapDrop] Video element gagal load, mungkin CORS block preview');
      videoEl.outerHTML; // biarkan tetap tampil, download tetap bisa
    });

    preview.appendChild(videoEl);

    window.videoDownloadLink = vUrl;
    document.getElementById('download-video-btn').disabled = false;
  } else {
    document.getElementById('download-video-btn').disabled = true;
    window.videoDownloadLink = null;
  }

  // ── RENDER AUDIO ─────────────────────────────────────────────
  const aUrl = audioMedia?.url;
  if (aUrl) {
    const audioEl = document.createElement('audio');
    audioEl.controls    = true;
    audioEl.crossOrigin = 'anonymous';
    audioEl.style.cssText = 'width:100%;margin-top:12px;display:block;';

    const src = document.createElement('source');
    src.src  = aUrl;
    src.type = 'audio/mpeg';
    audioEl.appendChild(src);
    preview.appendChild(audioEl);

    window.musicDownloadLink = aUrl;
    document.getElementById('download-music-btn').disabled = false;
  } else {
    document.getElementById('download-music-btn').disabled = true;
    window.musicDownloadLink = null;
  }

  if (!vUrl && !aUrl) {
    showToast('Tidak ada media yang bisa didownload.', 'error');
    return;
  }

  // Meta info
  document.getElementById('platform').textContent = capitalize(platform);
  document.getElementById('caption').textContent  =
    caption.length > 130 ? caption.substring(0, 130) + '…' : caption;

  // Tampilkan result section
  const resultSection = document.getElementById('result');
  resultSection.style.display = 'block';
  setTimeout(() => resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);

  showToast('Media berhasil dimuat! 🎉', 'success');
}

// ============ SHOW / HIDE RESULT ============
function hideResult() {
  document.getElementById('result').style.display = 'none';
  clearInput();
  clearPreview();
}

// ============ AUTO DOWNLOAD ============
async function autoDownload(type) {
  const isAudio = type === 'music';
  const link    = isAudio ? window.musicDownloadLink : window.videoDownloadLink;

  if (!link) {
    showToast('Link download tidak tersedia.', 'error');
    return;
  }

  const btnId    = `download-${type}-btn`;
  const btn      = document.getElementById(btnId);
  const origHTML = btn.innerHTML;

  // Tampilkan state loading pada tombol
  btn.innerHTML = `
    <div class="dl-btn-icon"><i class="fas fa-spinner fa-spin"></i></div>
    <div class="dl-btn-info"><strong>Mengunduh...</strong><small>Jangan tutup halaman</small></div>
    <div class="dl-btn-arrow"><i class="fas fa-hourglass-half"></i></div>`;
  btn.disabled = true;

  const ext      = isAudio ? 'mp3' : 'mp4';
  const filename = `SnapDrop_${type}_${Date.now()}.${ext}`;

  try {
    await triggerDownload(link, filename, isAudio);
  } catch (err) {
    showToast(`Download gagal: ${err.message}`, 'error');
  }

  btn.innerHTML = origHTML;
  btn.disabled  = false;
}

// ============ TRIGGER DOWNLOAD (multi-fallback) ============
async function triggerDownload(url, filename, isAudio = false) {
  showToast(`Mempersiapkan ${filename}...`, 'success');

  // 1️⃣ Coba blob langsung (dengan override MIME untuk MP3)
  if (await tryBlobDownload(url, filename, isAudio)) return;

  // 2️⃣ CORS proxy fallback
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxyUrl = CORS_PROXIES[i](url);
    console.warn(`[SnapDrop] Coba CORS proxy ${i + 1}:`, proxyUrl);
    if (await tryBlobDownload(proxyUrl, filename, isAudio)) return;
  }

  // 3️⃣ Last resort: buka tab baru
  console.warn('[SnapDrop] Semua blob gagal, fallback tab baru');
  window.open(url, '_blank');
  showToast('Download dibuka di tab baru ↗', 'success');
}

// ============ BLOB DOWNLOAD HELPER ============
// isAudio = true  →  blob di-override ke audio/mpeg agar tersimpan sebagai MP3
// isAudio = false →  video, biarkan MIME asli (video/mp4 atau apapun)
async function tryBlobDownload(url, filename, isAudio = false) {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(45000),
      // Beberapa CDN butuh header ini untuk mengirim response penuh
      headers: { 'Accept': isAudio ? 'audio/*,*/*' : 'video/*,*/*' }
    });

    if (!res.ok) return false;

    let blob = await res.blob();
    if (blob.size === 0) return false;

    // ── KUNCI: override MIME type untuk audio ──────────────────
    // Banyak CDN mengembalikan video/mp4 walau isinya audio saja.
    // Dengan paksa set ke audio/mpeg, browser & OS mengenalnya sebagai MP3.
    if (isAudio) {
      blob = blob.slice(0, blob.size, 'audio/mpeg');
    }
    // ────────────────────────────────────────────────────────────

    const blobUrl = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    a.href        = blobUrl;
    a.download    = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Bebaskan memory setelah delay singkat
    setTimeout(() => URL.revokeObjectURL(blobUrl), 90000);

    showToast('Download berhasil! ✓', 'success');
    return true;

  } catch (err) {
    console.warn('[SnapDrop] tryBlobDownload gagal:', err.message);
    return false;
  }
}

// ============ CLEAR PREVIEW ============
function clearPreview() {
  const preview = document.getElementById('media-preview');
  preview.innerHTML = `
    <div class="preview-placeholder">
      <i class="fas fa-photo-film"></i>
      <p>Preview media akan muncul di sini</p>
    </div>`;
  document.getElementById('download-video-btn').disabled = true;
  document.getElementById('download-music-btn').disabled = true;
  window.videoDownloadLink = null;
  window.musicDownloadLink = null;
}

// ============ FAQ ============
function toggleFAQ(el) {
  const item     = el.parentElement;
  const isActive = item.classList.contains('active');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
  if (!isActive) item.classList.add('active');
}

// ============ TOAST ============
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  const isErr = type === 'error';

  toast.style.background = isErr
    ? 'rgba(239,68,68,0.95)'
    : 'rgba(16,185,129,0.95)';

  const icon = isErr ? 'exclamation-circle' : 'check-circle';
  toast.innerHTML = `<i class="fas fa-${icon} toast-icon"></i><span>${msg}</span>`;
  toast.style.display = 'flex';

  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.style.display = 'none'; }, 3400);
}

// ============ HELPERS ============
function isValidUrl(str) {
  try { return Boolean(new URL(str)); } catch { return false; }
}

function detectPlatform(url) {
  const u = url.toLowerCase();
  if (u.includes('tiktok'))                            return 'TikTok';
  if (u.includes('instagram'))                         return 'Instagram';
  if (u.includes('youtube') || u.includes('youtu.be')) return 'YouTube';
  if (u.includes('facebook') || u.includes('fb.watch')) return 'Facebook';
  if (u.includes('twitter') || u.includes('x.com'))    return 'Twitter/X';
  if (u.includes('reddit'))                            return 'Reddit';
  if (u.includes('pinterest'))                         return 'Pinterest';
  if (u.includes('snapchat'))                          return 'Snapchat';
  if (u.includes('linkedin'))                          return 'LinkedIn';
  return 'Media';
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + K → fokus input
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    urlInput.focus();
    urlInput.select();
  }
  // Escape → tutup result atau navMenu
  if (e.key === 'Escape') {
    if (document.getElementById('result').style.display !== 'none') hideResult();
    navMenu.classList.remove('open');
  }
});

// ============ UNLOAD WARNING ============
window.addEventListener('beforeunload', (e) => {
  if (document.getElementById('result').style.display !== 'none') {
    e.preventDefault();
    e.returnValue = '';
  }
});

// ============ PRELOADER ============
window.addEventListener('load', () => {
  const pre = document.getElementById('preloader');
  setTimeout(() => {
    pre.style.opacity = '0';
    setTimeout(() => { pre.style.display = 'none'; }, 600);
  }, 1500);
});

// ============ SCROLL ANIMATION ============
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target); // observasi sekali saja
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.feat-card, .plat-card, .faq-item, .step-item').forEach((el, i) => {
  el.style.opacity    = '0';
  el.style.transform  = 'translateY(22px)';
  el.style.transition = `opacity .5s ease ${i * 0.04}s, transform .5s ease ${i * 0.04}s`;
  observer.observe(el);
});

// ============ HERO STATS COUNTER ANIMATION ============
function animateCount(el, target, suffix = '') {
  let current = 0;
  const step  = Math.ceil(target / 30);
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current + suffix;
    if (current >= target) clearInterval(timer);
  }, 40);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Stats sudah statis (10+, 4K, 0, ∞), tidak perlu animasi count
      // Tapi kita beri subtle fade-in
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.3 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
  heroStats.style.opacity   = '0';
  heroStats.style.transform = 'translateY(16px)';
  heroStats.style.transition = 'opacity .7s ease .3s, transform .7s ease .3s';
  statsObserver.observe(heroStats);
}

console.log('%c⚡ SnapDrop v2 Ready', 'color:#7c3aed; font-size:14px; font-weight:bold;');
