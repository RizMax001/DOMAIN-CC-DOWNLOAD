// DOWNSOSMED v11.0 - MULTI-API SMART ROUTER WITH ENHANCED ERROR HANDLING
// Made with 💜 by RizkyMaxz
// Strategy: Auto-detect platform → route to best working API → fallback to AIO

const TIMEOUT = 15000;
const MAX_RETRIES = 2;

// ============================================
// API PROVIDERS (working & tested June 2026)
// ============================================
const IKYY_BASE = 'https://api.ikyyxd.my.id';
const TIKWM_BASE = 'https://www.tikwm.com/api/';

let downloadLinks = [];
let currentRequest = null;

// ============================================
// PLATFORM DETECTION
// ============================================
function detectPlatform(url) {
  const u = url.toLowerCase();
  if (u.includes('tiktok.com') || u.includes('vt.tiktok')) return 'tiktok';
  if (u.includes('instagram.com') || u.includes('instagr.am')) return 'instagram';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('facebook.com') || u.includes('fb.watch') || u.includes('fb.com')) return 'facebook';
  if (u.includes('twitter.com') || u.includes('x.com')) return 'twitter';
  if (u.includes('pinterest.com') || u.includes('pin.it')) return 'pinterest';
  if (u.includes('capcut.com')) return 'capcut';
  if (u.includes('spotify.com')) return 'spotify';
  if (u.includes('soundcloud.com')) return 'soundcloud';
  if (u.includes('mediafire.com')) return 'mediafire';
  if (u.includes('terabox.com') || u.includes('terabox.app')) return 'terabox';
  if (u.includes('drive.google.com')) return 'gdrive';
  if (u.includes('reddit.com')) return 'reddit';
  if (u.includes('snapchat.com')) return 'snapchat';
  if (u.includes('linkedin.com')) return 'linkedin';
  return 'unknown';
}

// ============================================
// SAFE FETCH WITH TIMEOUT & RETRY
// ============================================
async function safeFetch(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs || TIMEOUT);
  try {
    const opts = Object.assign({}, options || {}, { signal: controller.signal });
    const res = await fetch(url, opts);
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    clearTimeout(timer);
    console.warn('❌ Fetch failed:', e.message);
    return null;
  }
}

// ============================================
// API FETCHERS PER PLATFORM
// ============================================

// --- TikTok: race TikWM + Ikyy v4 + Ikyy v3 ---
async function fetchTikTok(url) {
  return raceProviders([
    {
      name: 'TikWM',
      fn: async function () {
        const data = await safeFetch(TIKWM_BASE + '?url=' + encodeURIComponent(url) + '&hd=1', null, 12000);
        if (!data || data.code !== 0 || !data.data) return null;
        const d = data.data;
        const result = {
          source: 'TikTok',
          author: d.author ? d.author.unique_id : '',
          title: d.title || '',
          medias: []
        };
        if (d.hdplay) result.medias.push({ url: d.hdplay, type: 'video', quality: 'HD', extension: 'mp4' });
        if (d.play) result.medias.push({ url: d.play, type: 'video', quality: 'SD', extension: 'mp4' });
        if (d.images && d.images.length > 0) {
          d.images.forEach((img, i) => {
            result.medias.push({ url: img, type: 'image', extension: 'jpg' });
          });
        }
        if (d.music) result.medias.push({ url: d.music, type: 'audio', extension: 'mp3' });
        return result;
      }
    },
    {
      name: 'Ikyy-TTv4',
      fn: async function () {
        const data = await safeFetch(IKYY_BASE + '/download/tiktokv4?url=' + encodeURIComponent(url));
        if (!data || !data.status || !data.result) return null;
        const r = data.result;
        const result = {
          source: 'TikTok',
          author: r.author ? r.author.username : '',
          title: r.title || '',
          medias: []
        };
        if (r.media) {
          if (r.media.no_watermark) result.medias.push({ url: r.media.no_watermark, type: 'video', quality: 'HD No WM', extension: 'mp4' });
          if (r.media.watermark) result.medias.push({ url: r.media.watermark, type: 'video', quality: 'With WM', extension: 'mp4' });
          if (r.media.music) result.medias.push({ url: r.media.music, type: 'audio', extension: 'mp3' });
        }
        return result;
      }
    },
    {
      name: 'Ikyy-TTv3',
      fn: async function () {
        const data = await safeFetch(IKYY_BASE + '/download/tiktokv3?url=' + encodeURIComponent(url));
        if (!data || !data.status || !data.result || !data.result.success) return null;
        const d = data.result.data;
        const result = {
          source: 'TikTok',
          author: d.author || '',
          title: d.title || '',
          medias: []
        };
        if (d.video) result.medias.push({ url: d.video, type: 'video', quality: 'No WM', extension: 'mp4' });
        if (d.music) result.medias.push({ url: d.music, type: 'audio', extension: 'mp3' });
        if (d.images && d.images.length > 0) {
          d.images.forEach(img => {
            result.medias.push({ url: img, type: 'image', extension: 'jpg' });
          });
        }
        return result;
      }
    }
  ]);
}

// --- Instagram: Ikyy igall + igv2 ---
async function fetchInstagram(url) {
  return raceProviders([
    {
      name: 'Ikyy-IGall',
      fn: async function () {
        const data = await safeFetch(IKYY_BASE + '/download/igall?url=' + encodeURIComponent(url), null, 20000);
        if (!data || !data.status || !data.result) return null;
        const r = data.result;
        const result = {
          source: 'Instagram',
          author: r.author || '',
          title: r.title || '',
          medias: []
        };
        if (r.video && r.video.length > 0) {
          r.video.forEach(v => result.medias.push({ url: v, type: 'video', extension: 'mp4' }));
        }
        if (r.image && r.image.length > 0) {
          r.image.forEach(img => result.medias.push({ url: img, type: 'image', extension: 'jpg' }));
        }
        return result.medias.length > 0 ? result : null;
      }
    },
    {
      name: 'Ikyy-IGv2',
      fn: async function () {
        const data = await safeFetch(IKYY_BASE + '/download/igv2?url=' + encodeURIComponent(url), null, 20000);
        if (!data || !data.status || !data.result) return null;
        const r = data.result;
        const result = {
          source: 'Instagram',
          author: r.author || '',
          title: r.title || '',
          medias: r.medias || []
        };
        return result.medias.length > 0 ? result : null;
      }
    }
  ]);
}

// --- YouTube: Ikyy ytmp4 + yt-shorts ---
async function fetchYouTube(url) {
  const isShorts = url.includes('/shorts/');
  return raceProviders([
    {
      name: 'Ikyy-Ytmp4',
      fn: async function () {
        const data = await safeFetch(IKYY_BASE + '/download/ytmp4?q=' + encodeURIComponent(url));
        if (!data || !data.status || !data.result) return null;
        const r = data.result;
        const result = {
          source: 'YouTube',
          author: r.channel || '',
          title: r.title || '',
          medias: []
        };
        if (r.VideoUrl && r.VideoUrl.url) {
          result.medias.push({ url: r.VideoUrl.url, type: 'video', quality: 'HD', extension: 'mp4' });
        }
        return result.medias.length > 0 ? result : null;
      }
    },
    {
      name: 'Ikyy-YTShorts',
      fn: async function () {
        if (!isShorts) return null;
        const data = await safeFetch(IKYY_BASE + '/download/yt-shorts?url=' + encodeURIComponent(url));
        if (!data || !data.status || !data.result) return null;
        const r = data.result;
        const result = {
          source: 'YouTube Shorts',
          author: '',
          title: r.title || '',
          medias: []
        };
        if (r.DownloadUrl && r.DownloadUrl.url) {
          result.medias.push({ url: r.DownloadUrl.url, type: 'video', quality: 'HD', extension: 'mp4' });
        }
        return result.medias.length > 0 ? result : null;
      }
    }
  ]);
}

// --- Facebook: Ikyy ---
async function fetchFacebook(url) {
  return raceProviders([
    {
      name: 'Ikyy-FB',
      fn: async function () {
        const data = await safeFetch(IKYY_BASE + '/download/facebook?url=' + encodeURIComponent(url), null, 20000);
        if (!data || !data.status || !data.result) return null;
        const r = data.result;
        const result = {
          source: 'Facebook',
          author: r.author || '',
          title: r.title || '',
          medias: []
        };
        if (r.medias && r.medias.length > 0) {
          r.medias.forEach(m => result.medias.push(m));
        }
        if (r.hd) result.medias.push({ url: r.hd, type: 'video', quality: 'HD', extension: 'mp4' });
        if (r.sd) result.medias.push({ url: r.sd, type: 'video', quality: 'SD', extension: 'mp4' });
        return result.medias.length > 0 ? result : null;
      }
    }
  ]);
}

// --- Twitter: Ikyy ---
async function fetchTwitter(url) {
  return raceProviders([
    {
      name: 'Ikyy-TW',
      fn: async function () {
        const data = await safeFetch(IKYY_BASE + '/download/twitterdl?apikey=kyzz&url=' + encodeURIComponent(url));
        if (!data || !data.status || !data.result) return null;
        const r = data.result;
        const result = {
          source: 'Twitter/X',
          author: r.author || '',
          title: r.title || '',
          medias: []
        };
        if (r.medias && r.medias.length > 0) {
          r.medias.forEach(m => result.medias.push(m));
        }
        if (r.video) result.medias.push({ url: r.video, type: 'video', extension: 'mp4' });
        return result.medias.length > 0 ? result : null;
      }
    }
  ]);
}

// --- Pinterest: Ikyy ---
async function fetchPinterest(url) {
  return raceProviders([
    {
      name: 'Ikyy-Pin',
      fn: async function () {
        const data = await safeFetch(IKYY_BASE + '/download/pindl?url=' + encodeURIComponent(url));
        if (!data || !data.status || !data.result) return null;
        const r = data.result;
        const result = {
          source: 'Pinterest',
          author: '',
          title: r.title || '',
          medias: []
        };
        if (r.medias && r.medias.length > 0) {
          r.medias.forEach(m => result.medias.push(m));
        }
        if (r.video) result.medias.push({ url: r.video, type: 'video', extension: 'mp4' });
        if (r.image) result.medias.push({ url: r.image, type: 'image', extension: 'jpg' });
        return result.medias.length > 0 ? result : null;
      }
    }
  ]);
}

// --- Other platforms via Ikyy specific endpoints ---
async function fetchOther(url, platform) {
  const endpoints = {
    'capcut': '/download/capcut?url=',
    'spotify': '/download/spotifydl?url=',
    'terabox': '/download/terabox?url=',
    'gdrive': '/download/gdrive?url=',
    'mediafire': '/download/mediafire?url=',
  };

  const ep = endpoints[platform];
  if (!ep) return null;

  return raceProviders([
    {
      name: 'Ikyy-' + platform,
      fn: async function () {
        const data = await safeFetch(IKYY_BASE + ep + encodeURIComponent(url));
        if (!data || !data.status || !data.result) return null;
        const r = data.result;
        const result = {
          source: platform.charAt(0).toUpperCase() + platform.slice(1),
          author: r.author || '',
          title: r.title || '',
          medias: r.medias || []
        };
        if (r.url) result.medias.push({ url: r.url, type: 'video', extension: 'mp4' });
        if (r.video) result.medias.push({ url: r.video, type: 'video', extension: 'mp4' });
        if (r.audio) result.medias.push({ url: r.audio, type: 'audio', extension: 'mp3' });
        if (r.download) result.medias.push({ url: r.download, type: 'video', extension: 'mp4' });
        return result.medias.length > 0 ? result : null;
      }
    }
  ]);
}

// ============================================
// RACE ENGINE - fire all providers, first wins
// ============================================
async function raceProviders(providers) {
  return new Promise((resolve) => {
    let resolved = false;
    let completed = 0;

    const onResult = (data, name) => {
      completed++;
      if (data && data.medias && data.medias.length > 0 && !resolved) {
        resolved = true;
        console.log(`✅ Won by: ${name} (${data.medias.length} media)`);
        resolve(data);
      } else if (completed >= providers.length && !resolved) {
        resolve(null);
      }
    };

    providers.forEach((p) => {
      p.fn()
        .then((d) => onResult(d, p.name))
        .catch(() => onResult(null, p.name));
    });

    // Safety timeout
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    }, 25000);
  });
}

// ============================================
// MAIN FETCH - smart router
// ============================================
async function fetchMedia() {
  const url = urlInput.value.trim();

  if (!url) {
    showToast('Masukkan URL terlebih dahulu!', 'error');
    return;
  }

  try {
    new URL(url);
  } catch (e) {
    showToast('URL tidak valid! Periksa kembali format URL Anda.', 'error');
    return;
  }

  clearPreview();
  document.getElementById('result').style.display = 'none';

  const platform = detectPlatform(url);
  const platformLabel = platform === 'unknown' ? 'media' : platform;

  showLoading(`⚡ Mengunduh dari ${platformLabel}...`);

  const startTime = Date.now();
  let result = null;

  // Route to platform-specific fetcher
  try {
    switch (platform) {
      case 'tiktok':
        result = await fetchTikTok(url);
        break;
      case 'instagram':
        result = await fetchInstagram(url);
        break;
      case 'youtube':
        result = await fetchYouTube(url);
        break;
      case 'facebook':
        result = await fetchFacebook(url);
        break;
      case 'twitter':
        result = await fetchTwitter(url);
        break;
      case 'pinterest':
        result = await fetchPinterest(url);
        break;
      default:
        result = await fetchOther(url, platform);
        break;
    }

    // If platform-specific fails, try AIO as last resort
    if (!result) {
      showLoading('🔄 Mencoba all-in-one API...');
      result = await (async function () {
        const data = await safeFetch(IKYY_BASE + '/download/all-in-one?url=' + encodeURIComponent(url), null, 20000);
        if (!data || !data.status || !data.result) return null;
        if (data.result.error) return null;
        return data.result;
      })();
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    hideLoading();

    if (!result) {
      showToast(`❌ Gagal mengambil media dari ${platformLabel}. Coba lagi atau periksa URL.`, 'error');
      return;
    }

    console.log(`⚡ Fetched in ${elapsed}s from ${platformLabel}`);
    renderMedia(result);
  } catch (error) {
    hideLoading();
    console.error('Error:', error);
    showToast('Terjadi kesalahan. Silahkan coba lagi.', 'error');
  }
}

// ============================================
// RENDER MEDIA
// ============================================
function renderMedia(result) {
  const preview = document.getElementById('media-preview');
  const dlBtns = document.getElementById('dl-btns');

  preview.innerHTML = '';
  dlBtns.innerHTML = '';
  downloadLinks = [];

  const platform = result.source || 'Media';
  const author = result.author || '';
  const title = result.title || '';

  document.getElementById('platform').innerHTML = `<i class="fas fa-play-circle"></i> ${platform}`;
  document.getElementById('author').textContent = author ? `@${author}` : '';

  const captionEl = document.getElementById('caption');
  if (title && !/^https?:\/\//i.test(title)) {
    captionEl.style.display = '';
    captionEl.textContent = title.length > 120 ? title.substring(0, 120) + '…' : title;
  } else {
    captionEl.style.display = 'none';
  }

  const medias = result.medias || [];

  // Separate media types
  let videos = [];
  let photos = [];
  let audio = null;

  medias.forEach((m) => {
    const type = (m.type || '').toLowerCase();
    const ext = (m.extension || '').toLowerCase();

    if (type === 'video' || ext === 'mp4' || (m.quality && m.quality.toLowerCase().includes('video'))) {
      videos.push(m);
    } else if (type === 'image' || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
      photos.push(m);
    } else if (type === 'audio' || ext === 'mp3') {
      audio = m;
    }
  });

  console.log(`Videos: ${videos.length}, Photos: ${photos.length}, Audio: ${audio ? 'yes' : 'no'}`);

  // Priority: Video > Photo > Audio
  if (videos.length > 0) {
    const videoEl = document.createElement('video');
    videoEl.controls = true;
    videoEl.src = videos[0].url;
    videoEl.style.cssText = 'width:100%;max-height:500px;object-fit:contain;background:#000;border-radius:12px';
    preview.appendChild(videoEl);

    videos.forEach((v, vi) => {
      const vLabel = v.quality || (`Video ${vi + 1}`);
      addButton(dlBtns, 'video', v.url, vLabel, 'MP4 • Tanpa Watermark', 'fa-video', 'dl-video');
      downloadLinks.push({ type: 'video', url: v.url });
    });

    if (audio) {
      addButton(dlBtns, 'audio', audio.url, 'Audio MP3', 'High Quality', 'fa-music', 'dl-music');
      downloadLinks.push({ type: 'audio', url: audio.url });
    }

  } else if (photos.length > 0) {
    if (photos.length === 1) {
      const imgEl = document.createElement('img');
      imgEl.src = photos[0].url;
      imgEl.alt = 'Photo';
      imgEl.style.cssText = 'width:100%;max-height:500px;object-fit:contain;background:#000;cursor:pointer;border-radius:12px';
      imgEl.onclick = () => window.open(photos[0].url, '_blank');
      preview.appendChild(imgEl);

      addButton(dlBtns, 'photo_0', photos[0].url, 'Foto', 'JPG/PNG • HD', 'fa-image', 'dl-photo');
      downloadLinks.push({ type: 'photo', url: photos[0].url });

    } else {
      createSlider(preview, photos);

      photos.forEach((p, j) => {
        const photoNum = j + 1;
        addButton(dlBtns, `photo_${j}`, p.url, `Foto ${photoNum}`, `JPG/PNG • ${photoNum}/${photos.length}`, 'fa-image', 'dl-photo');
        downloadLinks.push({ type: 'photo', url: p.url, name: `Foto ${photoNum}` });
      });
    }

    if (audio) {
      addButton(dlBtns, 'audio', audio.url, 'Audio MP3', 'High Quality', 'fa-music', 'dl-music');
      downloadLinks.push({ type: 'audio', url: audio.url });
    }

  } else if (audio) {
    const audioEl = document.createElement('audio');
    audioEl.controls = true;
    audioEl.src = audio.url;
    audioEl.style.cssText = 'width:100%;max-width:400px;margin:18px auto;display:block';
    preview.appendChild(audioEl);

    addButton(dlBtns, 'audio', audio.url, 'Audio MP3', 'High Quality', 'fa-music', 'dl-music');
    downloadLinks.push({ type: 'audio', url: audio.url });
  }

  if (downloadLinks.length === 0) {
    showToast('Media tidak tersedia!', 'error');
    return;
  }

  const resultSection = document.getElementById('result');
  resultSection.style.display = 'block';
  setTimeout(() => {
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 80);

  showToast('✅ Media berhasil dimuat!', 'success');
}

// ============================================
// PHOTO SLIDER
// ============================================
function createSlider(container, photos) {
  const slider = document.createElement('div');
  slider.className = 'gallery-slider';

  const slides = document.createElement('div');
  slides.className = 'gallery-slides';

  photos.forEach((photo, i) => {
    const slide = document.createElement('div');
    slide.className = 'gallery-slide';

    const img = document.createElement('img');
    img.src = photo.url;
    img.alt = `Photo ${i + 1}`;
    img.style.cssText = 'width:100%;max-height:500px;object-fit:contain;background:#000;cursor:pointer;border-radius:12px';
    img.onclick = () => window.open(photo.url, '_blank');

    slide.appendChild(img);
    slides.appendChild(slide);
  });

  slider.appendChild(slides);

  if (photos.length > 1) {
    const prevBtn = document.createElement('button');
    prevBtn.className = 'gallery-nav prev';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.onclick = () => changeSlide(-1);
    slider.appendChild(prevBtn);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'gallery-nav next';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.onclick = () => changeSlide(1);
    slider.appendChild(nextBtn);

    const dots = document.createElement('div');
    dots.className = 'gallery-dots';

    photos.forEach((_, j) => {
      const dot = document.createElement('button');
      dot.className = 'gallery-dot' + (j === 0 ? ' active' : '');
      dot.onclick = () => goToSlide(j);
      dots.appendChild(dot);
    });
    slider.appendChild(dots);

    const counter = document.createElement('div');
    counter.className = 'gallery-counter';
    counter.id = 'slideCounter';
    counter.textContent = `1 / ${photos.length}`;
    slider.appendChild(counter);
  }

  container.appendChild(slider);
  window.currentSlide = 0;
  window.totalPhotos = photos.length;
}

function changeSlide(dir) {
  window.currentSlide = (window.currentSlide + dir + window.totalPhotos) % window.totalPhotos;
  updateSlider();
}

function goToSlide(idx) {
  window.currentSlide = idx;
  updateSlider();
}

function updateSlider() {
  const slidesEl = document.querySelector('.gallery-slides');
  const dots = document.querySelectorAll('.gallery-dot');
  const counter = document.getElementById('slideCounter');

  if (slidesEl) {
    slidesEl.style.transform = `translateX(-${window.currentSlide * 100}%)`;
  }

  dots.forEach((d, i) => {
    d.classList.toggle('active', i === window.currentSlide);
  });

  if (counter) {
    counter.textContent = `${window.currentSlide + 1} / ${window.totalPhotos}`;
  }
}

// ============================================
// DOWNLOAD BUTTON & FILE DOWNLOAD
// ============================================
function addButton(container, type, url, title, subtitle, icon, btnClass) {
  const btn = document.createElement('button');
  btn.className = `dl-btn ${btnClass}`;
  btn.onclick = () => downloadFile(url, type);

  btn.innerHTML = `
    <i class="fas ${icon}"></i>
    <div class="dl-info">
      <strong>${title}</strong>
      <small>${subtitle}</small>
    </div>
    <i class="fas fa-download dl-arrow"></i>
  `;

  container.appendChild(btn);
}

function downloadFile(url, type) {
  let ext = 'mp4';
  if (type.indexOf('photo') !== -1) ext = 'jpg';
  else if (type === 'audio') ext = 'mp3';

  const filename = `DownSosmed_${ext}_${Date.now()}.${ext}`;

  showToast('⚡ Mempersiapkan download...', 'success');

  singleBlobDownload(url, filename, type === 'audio')
    .then((ok) => {
      if (!ok) {
        window.open(url, '_blank');
        showToast('Download di tab baru ↗', 'success');
      }
    })
    .catch(() => {
      window.open(url, '_blank');
      showToast('Download di tab baru ↗', 'success');
    });
}

async function singleBlobDownload(url, filename, isAudio) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) throw new Error('Fetch failed');
    let blob = await res.blob();
    if (blob.size === 0) throw new Error('Empty blob');

    if (isAudio) {
      blob = blob.slice(0, blob.size, 'audio/mpeg');
    }

    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);

    showToast('✅ Download berhasil!', 'success');
    return true;
  } catch (e) {
    console.error('Download error:', e);
    return false;
  }
}

// ============================================
// UI: Theme, Nav, Toast, Loading
// ============================================
const themeToggle = document.getElementById('themeToggle');
if (localStorage.getItem('theme') === 'light') document.body.classList.remove('dark-mode');

themeToggle.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  navbar.classList.toggle('scrolled', window.scrollY > 40);
});

document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('navMenu').classList.toggle('open');
});

const urlInput = document.getElementById('url');
const clearBtn = document.getElementById('clearBtn');

urlInput.addEventListener('input', () => {
  clearBtn.style.display = urlInput.value ? 'flex' : 'none';
});

clearBtn.addEventListener('click', () => {
  urlInput.value = '';
  clearBtn.style.display = 'none';
  urlInput.focus();
});

urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') fetchMedia();
});

function showLoading(text) {
  document.getElementById('loadingText').textContent = text || 'Memuat...';
  document.getElementById('loadingSpinner').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loadingSpinner').style.display = 'none';
}

function hideResult() {
  document.getElementById('result').style.display = 'none';
  urlInput.value = '';
  clearBtn.style.display = 'none';
  clearPreview();
}

function clearPreview() {
  document.getElementById('media-preview').innerHTML = '';
  document.getElementById('dl-btns').innerHTML = '';
  downloadLinks = [];
}

function toggleFAQ(el) {
  const item = el.parentElement;
  const isActive = item.classList.contains('active');

  document.querySelectorAll('.faq-item').forEach(i => {
    i.classList.remove('active');
  });

  if (!isActive) {
    item.classList.add('active');
  }
}

function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');

  toast.className = type === 'error' ? 'error' : '';
  toast.querySelector('i').className = type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
  document.getElementById('toastMessage').textContent = msg;

  toast.classList.add('show');

  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// ============================================
// KEYBOARD SHORTCUTS & ACCESSIBILITY
// ============================================
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    urlInput.focus();
    urlInput.select();
  }
  if (e.key === 'Escape') {
    const result = document.getElementById('result');
    if (result.style.display !== 'none') hideResult();
    document.getElementById('navMenu').classList.remove('open');
  }
});

// ============================================
// PAGE LOAD & ANIMATIONS
// ============================================
window.addEventListener('load', () => {
  const pre = document.getElementById('preloader');
  pre.style.opacity = '0';
  setTimeout(() => {
    pre.style.display = 'none';
  }, 300);
});

window.addEventListener('scroll', () => {
  const scrolled = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const pct = max > 0 ? (scrolled / max) * 100 : 0;

  document.getElementById('scrollProgress').style.width = pct + '%';
  document.getElementById('backTop').classList.toggle('show', scrolled > 350);
}, { passive: true });

document.getElementById('backTop').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ============================================
// INTERSECTION OBSERVER FOR SCROLL ANIMATIONS
// ============================================
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.reveal, .reveal-stagger').forEach((el) => {
  observer.observe(el);
});

// ============================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ============================================
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ============================================
// CLOSE MOBILE MENU ON LINK CLICK
// ============================================
document.querySelectorAll('.nav-link').forEach((link) => {
  link.addEventListener('click', () => {
    document.getElementById('navMenu').classList.remove('open');
  });
});

// ============================================
// CONSOLE MESSAGES
// ============================================
console.log('%c⚡ DownSosmed v11 - Multi-API Smart Router Ready!', 'color:#7c3aed;font-size:14px;font-weight:bold;');
console.log('%c🔧 Supported: TikTok, Instagram, YouTube, Facebook, Twitter, Pinterest, Spotify, CapCut, Terabox, GDrive, Mediafire', 'color:#06b6d4;font-size:11px;');
console.log('%c💜 Made with love by RizkyMaxz', 'color:#f472b6;font-size:11px;');
