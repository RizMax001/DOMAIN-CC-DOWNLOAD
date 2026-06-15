// DOWNSOSMED v10.0 - MULTI-API SMART ROUTER
// Made with 💜 by RizkyMaxz
// Strategy: Auto-detect platform → route to best working API

const TIMEOUT = 15000;

// ============================================
// API PROVIDERS (working & tested June 2026)
// ============================================

// Provider 1: Ikyy API (individual endpoints)
const IKYY_BASE = 'https://api.ikyyxd.my.id';

// Provider 2: TikWM (TikTok only, very fast)
const TIKWM_BASE = 'https://www.tikwm.com/api/';

let downloadLinks = [];

// ============================================
// PLATFORM DETECTION
// ============================================
function detectPlatform(url) {
  var u = url.toLowerCase();
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
// API FETCHERS PER PLATFORM
// ============================================

// Generic fetch with timeout
async function safeFetch(url, options, timeoutMs) {
  var controller = new AbortController();
  var timer = setTimeout(function () { controller.abort(); }, timeoutMs || TIMEOUT);
  try {
    var opts = Object.assign({}, options || {}, { signal: controller.signal });
    var res = await fetch(url, opts);
    clearTimeout(timer);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (e) {
    clearTimeout(timer);
    return null;
  }
}

// --- TikTok: race TikWM + Ikyy v4 + Ikyy v3 ---
async function fetchTikTok(url) {
  return raceProviders([
    {
      name: 'TikWM',
      fn: async function () {
        var data = await safeFetch(TIKWM_BASE + '?url=' + encodeURIComponent(url) + '&hd=1', null, 12000);
        if (!data || data.code !== 0 || !data.data) return null;
        var d = data.data;
        var result = {
          source: 'TikTok',
          author: d.author ? d.author.unique_id : '',
          title: d.title || '',
          medias: []
        };
        // HD video
        if (d.hdplay) {
          result.medias.push({ url: d.hdplay, type: 'video', quality: 'HD', extension: 'mp4' });
        }
        // Normal video
        if (d.play) {
          result.medias.push({ url: d.play, type: 'video', quality: 'SD', extension: 'mp4' });
        }
        // Images (slideshow)
        if (d.images && d.images.length > 0) {
          for (var i = 0; i < d.images.length; i++) {
            result.medias.push({ url: d.images[i], type: 'image', extension: 'jpg' });
          }
        }
        // Music
        if (d.music) {
          result.medias.push({ url: d.music, type: 'audio', extension: 'mp3' });
        }
        return result;
      }
    },
    {
      name: 'Ikyy-TTv4',
      fn: async function () {
        var data = await safeFetch(IKYY_BASE + '/download/tiktokv4?url=' + encodeURIComponent(url));
        if (!data || !data.status || !data.result) return null;
        var r = data.result;
        var result = {
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
        var data = await safeFetch(IKYY_BASE + '/download/tiktokv3?url=' + encodeURIComponent(url));
        if (!data || !data.status || !data.result || !data.result.success) return null;
        var d = data.result.data;
        var result = {
          source: 'TikTok',
          author: d.author || '',
          title: d.title || '',
          medias: []
        };
        if (d.video) result.medias.push({ url: d.video, type: 'video', quality: 'No WM', extension: 'mp4' });
        if (d.music) result.medias.push({ url: d.music, type: 'audio', extension: 'mp3' });
        // Images
        if (d.images && d.images.length > 0) {
          for (var i = 0; i < d.images.length; i++) {
            result.medias.push({ url: d.images[i], type: 'image', extension: 'jpg' });
          }
        }
        return result;
      }
    },
    {
      name: 'Ikyy-TTv2',
      fn: async function () {
        var data = await safeFetch(IKYY_BASE + '/download/tiktokkv2?url=' + encodeURIComponent(url));
        if (!data || !data.status || !data.result) return null;
        var r = data.result;
        var result = {
          source: 'TikTok',
          author: '',
          title: r.title || '',
          medias: []
        };
        if (r.video && r.video.length > 0) {
          result.medias.push({ url: r.video[0], type: 'video', quality: 'No WM', extension: 'mp4' });
        }
        if (r.image && r.image.length > 0) {
          for (var i = 0; i < r.image.length; i++) {
            result.medias.push({ url: r.image[i], type: 'image', extension: 'jpg' });
          }
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
        var data = await safeFetch(IKYY_BASE + '/download/igall?url=' + encodeURIComponent(url), null, 20000);
        if (!data || !data.status || !data.result) return null;
        var r = data.result;
        var result = {
          source: 'Instagram',
          author: '',
          title: '',
          medias: []
        };
        if (r.video && r.video.length > 0) {
          for (var i = 0; i < r.video.length; i++) {
            result.medias.push({ url: r.video[i], type: 'video', extension: 'mp4' });
          }
        }
        if (r.image && r.image.length > 0) {
          for (var j = 0; j < r.image.length; j++) {
            result.medias.push({ url: r.image[j], type: 'image', extension: 'jpg' });
          }
        }
        if (result.medias.length === 0) return null;
        return result;
      }
    },
    {
      name: 'Ikyy-IGv2',
      fn: async function () {
        var data = await safeFetch(IKYY_BASE + '/download/igv2?url=' + encodeURIComponent(url), null, 20000);
        if (!data || !data.status || !data.result) return null;
        var r = data.result;
        var result = {
          source: 'Instagram',
          author: r.author || '',
          title: r.title || '',
          medias: []
        };
        if (r.medias && r.medias.length > 0) {
          for (var i = 0; i < r.medias.length; i++) {
            result.medias.push(r.medias[i]);
          }
        }
        if (result.medias.length === 0) return null;
        return result;
      }
    }
  ]);
}

// --- YouTube: Ikyy ytmp4 + yt-shorts ---
async function fetchYouTube(url) {
  var isShorts = url.includes('/shorts/');
  return raceProviders([
    {
      name: 'Ikyy-Ytmp4',
      fn: async function () {
        var data = await safeFetch(IKYY_BASE + '/download/ytmp4?q=' + encodeURIComponent(url));
        if (!data || !data.status || !data.result) return null;
        var r = data.result;
        var result = {
          source: 'YouTube',
          author: '',
          title: r.title || '',
          medias: []
        };
        if (r.VideoUrl && r.VideoUrl.url) {
          result.medias.push({ url: r.VideoUrl.url, type: 'video', quality: 'HD', extension: 'mp4' });
        }
        return result;
      }
    },
    {
      name: 'Ikyy-YTShorts',
      fn: async function () {
        if (!isShorts) return null;
        var data = await safeFetch(IKYY_BASE + '/download/yt-shorts?url=' + encodeURIComponent(url));
        if (!data || !data.status || !data.result) return null;
        var r = data.result;
        var result = {
          source: 'YouTube Shorts',
          author: '',
          title: r.title || '',
          medias: []
        };
        if (r.DownloadUrl && r.DownloadUrl.url) {
          result.medias.push({ url: r.DownloadUrl.url, type: 'video', quality: 'HD', extension: 'mp4' });
        }
        return result;
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
        var data = await safeFetch(IKYY_BASE + '/download/facebook?url=' + encodeURIComponent(url), null, 20000);
        if (!data || !data.status || !data.result) return null;
        var r = data.result;
        var result = {
          source: 'Facebook',
          author: r.author || '',
          title: r.title || '',
          medias: []
        };
        if (r.medias && r.medias.length > 0) {
          for (var i = 0; i < r.medias.length; i++) {
            result.medias.push(r.medias[i]);
          }
        }
        if (r.hd) result.medias.push({ url: r.hd, type: 'video', quality: 'HD', extension: 'mp4' });
        if (r.sd) result.medias.push({ url: r.sd, type: 'video', quality: 'SD', extension: 'mp4' });
        if (result.medias.length === 0) return null;
        return result;
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
        var data = await safeFetch(IKYY_BASE + '/download/twitterdl?apikey=kyzz&url=' + encodeURIComponent(url));
        if (!data || !data.status || !data.result) return null;
        var r = data.result;
        var result = {
          source: 'Twitter/X',
          author: r.author || '',
          title: r.title || '',
          medias: []
        };
        if (r.medias && r.medias.length > 0) {
          for (var i = 0; i < r.medias.length; i++) {
            result.medias.push(r.medias[i]);
          }
        }
        if (r.video) result.medias.push({ url: r.video, type: 'video', extension: 'mp4' });
        if (result.medias.length === 0) return null;
        return result;
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
        var data = await safeFetch(IKYY_BASE + '/download/pindl?url=' + encodeURIComponent(url));
        if (!data || !data.status || !data.result) return null;
        var r = data.result;
        var result = {
          source: 'Pinterest',
          author: '',
          title: r.title || '',
          medias: []
        };
        if (r.medias && r.medias.length > 0) {
          for (var i = 0; i < r.medias.length; i++) {
            result.medias.push(r.medias[i]);
          }
        }
        if (r.video) result.medias.push({ url: r.video, type: 'video', extension: 'mp4' });
        if (r.image) result.medias.push({ url: r.image, type: 'image', extension: 'jpg' });
        if (result.medias.length === 0) return null;
        return result;
      }
    }
  ]);
}

// --- Other platforms via Ikyy specific endpoints ---
async function fetchOther(url, platform) {
  var endpoints = {
    'capcut': '/download/capcut?url=',
    'spotify': '/download/spotifydl?url=',
    'terabox': '/download/terabox?url=',
    'gdrive': '/download/gdrive?url=',
    'mediafire': '/download/mediafire?url=',
  };

  var ep = endpoints[platform];
  if (!ep) return null;

  return raceProviders([
    {
      name: 'Ikyy-' + platform,
      fn: async function () {
        var data = await safeFetch(IKYY_BASE + ep + encodeURIComponent(url));
        if (!data || !data.status || !data.result) return null;
        var r = data.result;
        var result = {
          source: platform.charAt(0).toUpperCase() + platform.slice(1),
          author: r.author || '',
          title: r.title || '',
          medias: r.medias || []
        };
        // Try common fields
        if (r.url) result.medias.push({ url: r.url, type: 'video', extension: 'mp4' });
        if (r.video) result.medias.push({ url: r.video, type: 'video', extension: 'mp4' });
        if (r.audio) result.medias.push({ url: r.audio, type: 'audio', extension: 'mp3' });
        if (r.download) result.medias.push({ url: r.download, type: 'video', extension: 'mp4' });
        if (result.medias.length === 0) return null;
        return result;
      }
    }
  ]);
}

// ============================================
// RACE ENGINE - fire all providers, first wins
// ============================================
async function raceProviders(providers) {
  return new Promise(function (resolve) {
    var resolved = false;
    var completed = 0;

    function onResult(data, name) {
      completed++;
      if (data && data.medias && data.medias.length > 0 && !resolved) {
        resolved = true;
        console.log('✅ Won by: ' + name + ' (' + data.medias.length + ' media)');
        resolve(data);
      } else if (completed >= providers.length && !resolved) {
        resolve(null);
      }
    }

    for (var i = 0; i < providers.length; i++) {
      (function (p) {
        p.fn()
          .then(function (d) { onResult(d, p.name); })
          .catch(function () { onResult(null, p.name); });
      })(providers[i]);
    }

    // Safety timeout
    setTimeout(function () {
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
  var url = urlInput.value.trim();

  if (!url) {
    showToast('Masukkan URL!', 'error');
    return;
  }

  try {
    new URL(url);
  } catch (e) {
    showToast('URL tidak valid!', 'error');
    return;
  }

  clearPreview();
  document.getElementById('result').style.display = 'none';

  var platform = detectPlatform(url);
  var platformLabel = platform === 'unknown' ? 'media' : platform;

  showLoading('⚡ Mengunduh dari ' + platformLabel + '...');

  var startTime = Date.now();
  var result = null;

  // Route to platform-specific fetcher
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
      var data = await safeFetch(IKYY_BASE + '/download/all-in-one?url=' + encodeURIComponent(url), null, 20000);
      if (!data || !data.status || !data.result) return null;
      if (data.result.error) return null;
      return data.result;
    })();
  }

  var elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  hideLoading();

  if (!result) {
    showToast('Gagal mengambil media! Platform: ' + platformLabel, 'error');
    return;
  }

  console.log('⚡ Fetched in ' + elapsed + 's from ' + platformLabel);
  renderMedia(result);
}

// ============================================
// RENDER MEDIA (same as before)
// ============================================
function renderMedia(result) {
  var preview = document.getElementById('media-preview');
  var dlBtns = document.getElementById('dl-btns');

  preview.innerHTML = '';
  dlBtns.innerHTML = '';
  downloadLinks = [];

  var platform = result.source || 'Media';
  var author = result.author || '';
  var title = result.title || '';

  document.getElementById('platform').innerHTML = '<i class="fas fa-play-circle"></i> ' + platform;
  document.getElementById('author').textContent = author ? '@' + author : '';

  var captionEl = document.getElementById('caption');
  if (title && !/^https?:\/\//i.test(title)) {
    captionEl.style.display = '';
    captionEl.textContent = title.length > 120 ? title.substring(0, 120) + '…' : title;
  } else {
    captionEl.style.display = 'none';
  }

  var medias = result.medias || [];

  // Separate media types
  var videos = [];
  var photos = [];
  var audio = null;

  for (var i = 0; i < medias.length; i++) {
    var m = medias[i];
    var type = (m.type || '').toLowerCase();
    var ext = (m.extension || '').toLowerCase();

    if (type === 'video' || ext === 'mp4' || (m.quality && m.quality.toLowerCase().includes('video'))) {
      videos.push(m);
    } else if (type === 'image' || ['jpg', 'jpeg', 'png', 'webp', 'gif'].indexOf(ext) !== -1) {
      photos.push(m);
    } else if (type === 'audio' || ext === 'mp3') {
      audio = m;
    }
  }

  console.log('Videos:', videos.length, 'Photos:', photos.length, 'Audio:', audio ? 'yes' : 'no');

  // Priority: Video > Photo > Audio
  if (videos.length > 0) {
    var videoEl = document.createElement('video');
    videoEl.controls = true;
    videoEl.src = videos[0].url;
    videoEl.style.cssText = 'width:100%;max-height:480px;object-fit:contain;background:#000';
    preview.appendChild(videoEl);

    // Add buttons for each video quality
    for (var vi = 0; vi < videos.length; vi++) {
      var vLabel = videos[vi].quality || ('Video ' + (vi + 1));
      addButton(dlBtns, 'video', videos[vi].url, vLabel, 'MP4 • Tanpa Watermark', 'fa-video', 'dl-video');
      downloadLinks.push({ type: 'video', url: videos[vi].url });
    }

    // Also add audio if available
    if (audio) {
      addButton(dlBtns, 'audio', audio.url, 'Audio MP3', 'High Quality', 'fa-music', 'dl-music');
      downloadLinks.push({ type: 'audio', url: audio.url });
    }

  } else if (photos.length > 0) {
    if (photos.length === 1) {
      var imgEl = document.createElement('img');
      imgEl.src = photos[0].url;
      imgEl.alt = 'Photo';
      imgEl.style.cssText = 'width:100%;max-height:480px;object-fit:contain;background:#000;cursor:pointer';
      imgEl.onclick = function () { window.open(photos[0].url, '_blank') };
      preview.appendChild(imgEl);

      addButton(dlBtns, 'photo_0', photos[0].url, 'Foto', 'JPG/PNG • HD', 'fa-image', 'dl-photo');
      downloadLinks.push({ type: 'photo', url: photos[0].url });

    } else {
      createSlider(preview, photos);

      for (var j = 0; j < photos.length; j++) {
        var photoNum = j + 1;
        addButton(dlBtns, 'photo_' + j, photos[j].url, 'Foto ' + photoNum, 'JPG/PNG • ' + photoNum + '/' + photos.length, 'fa-image', 'dl-photo');
        downloadLinks.push({ type: 'photo', url: photos[j].url, name: 'Foto ' + photoNum });
      }
    }

    // Also add audio if available (e.g. TikTok slideshow)
    if (audio) {
      addButton(dlBtns, 'audio', audio.url, 'Audio MP3', 'High Quality', 'fa-music', 'dl-music');
      downloadLinks.push({ type: 'audio', url: audio.url });
    }

  } else if (audio) {
    var audioEl = document.createElement('audio');
    audioEl.controls = true;
    audioEl.src = audio.url;
    audioEl.style.cssText = 'width:100%;max-width:380px;margin:16px auto;display:block';
    preview.appendChild(audioEl);

    addButton(dlBtns, 'audio', audio.url, 'Audio MP3', 'High Quality', 'fa-music', 'dl-music');
    downloadLinks.push({ type: 'audio', url: audio.url });
  }

  if (downloadLinks.length === 0) {
    showToast('Media tidak tersedia!', 'error');
    return;
  }

  var resultSection = document.getElementById('result');
  resultSection.style.display = 'block';
  setTimeout(function () {
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 80);

  showToast('Media berhasil dimuat! 🎉', 'success');
}

// ============================================
// PHOTO SLIDER
// ============================================
function createSlider(container, photos) {
  var slider = document.createElement('div');
  slider.className = 'gallery-slider';

  var slides = document.createElement('div');
  slides.className = 'gallery-slides';

  for (var i = 0; i < photos.length; i++) {
    var slide = document.createElement('div');
    slide.className = 'gallery-slide';

    var img = document.createElement('img');
    img.src = photos[i].url;
    img.alt = 'Photo ' + (i + 1);
    img.style.cssText = 'width:100%;max-height:480px;object-fit:contain;background:#000;cursor:pointer';

    var photoUrl = photos[i].url;
    img.onclick = function (url) { return function () { window.open(url, '_blank') } }(photoUrl);

    slide.appendChild(img);
    slides.appendChild(slide);
  }

  slider.appendChild(slides);

  if (photos.length > 1) {
    var prevBtn = document.createElement('button');
    prevBtn.className = 'gallery-nav prev';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.onclick = function () { changeSlide(-1) };
    slider.appendChild(prevBtn);

    var nextBtn = document.createElement('button');
    nextBtn.className = 'gallery-nav next';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.onclick = function () { changeSlide(1) };
    slider.appendChild(nextBtn);

    var dots = document.createElement('div');
    dots.className = 'gallery-dots';

    for (var j = 0; j < photos.length; j++) {
      var dot = document.createElement('button');
      dot.className = 'gallery-dot' + (j === 0 ? ' active' : '');
      dot.onclick = (function (idx) { return function () { goToSlide(idx) } })(j);
      dots.appendChild(dot);
    }
    slider.appendChild(dots);

    var counter = document.createElement('div');
    counter.className = 'gallery-counter';
    counter.id = 'slideCounter';
    counter.textContent = '1 / ' + photos.length;
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
  var slidesEl = document.querySelector('.gallery-slides');
  var dots = document.querySelectorAll('.gallery-dot');
  var counter = document.getElementById('slideCounter');

  if (slidesEl) {
    slidesEl.style.transform = 'translateX(-' + (window.currentSlide * 100) + '%)';
  }

  for (var i = 0; i < dots.length; i++) {
    dots[i].classList.toggle('active', i === window.currentSlide);
  }

  if (counter) {
    counter.textContent = (window.currentSlide + 1) + ' / ' + window.totalPhotos;
  }
}

// ============================================
// DOWNLOAD BUTTON & FILE DOWNLOAD
// ============================================
function addButton(container, type, url, title, subtitle, icon, btnClass) {
  var btn = document.createElement('button');
  btn.className = 'dl-btn ' + btnClass;
  btn.onclick = (function (u, t) { return function () { downloadFile(u, t) } })(url, type);

  btn.innerHTML =
    '<i class="fas ' + icon + '"></i>' +
    '<div class="dl-info"><strong>' + title + '</strong><small>' + subtitle + '</small></div>' +
    '<i class="fas fa-download dl-arrow"></i>';

  container.appendChild(btn);
}

function downloadFile(url, type) {
  var ext = 'mp4';
  if (type.indexOf('photo') !== -1) ext = 'jpg';
  else if (type === 'audio') ext = 'mp3';

  var filename = 'DownSosmed_' + ext + '_' + Date.now() + '.' + ext;

  showToast('⚡ Mempersiapkan download...', 'success');

  // Try direct blob download first
  singleBlobDownload(url, filename, type === 'audio')
    .then(function (ok) {
      if (!ok) {
        // Fallback: open in new tab
        window.open(url, '_blank');
        showToast('Download di tab baru ↗', 'success');
      }
    })
    .catch(function () {
      window.open(url, '_blank');
      showToast('Download di tab baru ↗', 'success');
    });
}

async function singleBlobDownload(url, filename, isAudio) {
  try {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 20000);

    var res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) throw new Error('Fetch failed');
    var blob = await res.blob();
    if (blob.size === 0) throw new Error('Empty blob');

    if (isAudio) {
      blob = blob.slice(0, blob.size, 'audio/mpeg');
    }

    var blobUrl = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(function () { URL.revokeObjectURL(blobUrl); }, 60000);

    showToast('Download berhasil! ✓', 'success');
    return true;
  } catch (e) {
    return false;
  }
}

// ============================================
// UI: Theme, Nav, Toast, etc
// ============================================
var themeToggle = document.getElementById('themeToggle');
if (localStorage.getItem('theme') === 'light') document.body.classList.remove('dark-mode');
themeToggle.addEventListener('click', function () {
  var isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

window.addEventListener('scroll', function () {
  var navbar = document.getElementById('navbar');
  navbar.classList.toggle('scrolled', window.scrollY > 40);
});

document.getElementById('hamburger').addEventListener('click', function () {
  document.getElementById('navMenu').classList.toggle('open');
});

var urlInput = document.getElementById('url');
var clearBtn = document.getElementById('clearBtn');

urlInput.addEventListener('input', function () {
  clearBtn.style.display = urlInput.value ? 'flex' : 'none';
});

clearBtn.addEventListener('click', function () {
  urlInput.value = '';
  clearBtn.style.display = 'none';
  urlInput.focus();
});

urlInput.addEventListener('keydown', function (e) {
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
  var item = el.parentElement;
  var isActive = item.classList.contains('active');

  var items = document.querySelectorAll('.faq-item');
  for (var i = 0; i < items.length; i++) {
    items[i].classList.remove('active');
  }

  if (!isActive) {
    item.classList.add('active');
  }
}

function showToast(msg, type) {
  type = type || 'success';
  var toast = document.getElementById('toast');

  toast.className = type === 'error' ? 'error' : '';
  toast.querySelector('i').className = type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
  document.getElementById('toastMessage').textContent = msg;

  toast.classList.add('show');

  clearTimeout(toast._t);
  toast._t = setTimeout(function () {
    toast.classList.remove('show');
  }, 3500);
}

document.addEventListener('keydown', function (e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    urlInput.focus();
    urlInput.select();
  }
  if (e.key === 'Escape') {
    var result = document.getElementById('result');
    if (result.style.display !== 'none') hideResult();
    document.getElementById('navMenu').classList.remove('open');
  }
});

window.addEventListener('load', function () {
  var pre = document.getElementById('preloader');
  pre.style.opacity = '0';
  setTimeout(function () {
    pre.style.display = 'none';
  }, 300);
});

window.addEventListener('scroll', function () {
  var scrolled = window.scrollY;
  var max = document.documentElement.scrollHeight - window.innerHeight;
  var pct = max > 0 ? (scrolled / max) * 100 : 0;

  document.getElementById('scrollProgress').style.width = pct + '%';
  document.getElementById('backTop').classList.toggle('show', scrolled > 350);
}, { passive: true });

document.getElementById('backTop').addEventListener('click', function () {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

var observer = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

var revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
for (var i = 0; i < revealEls.length; i++) {
  observer.observe(revealEls[i]);
}

var anchorLinks = document.querySelectorAll('a[href^="#"]');
for (var i = 0; i < anchorLinks.length; i++) {
  anchorLinks[i].addEventListener('click', function (e) {
    var target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

console.log('%c⚡ DownSosmed v10 - Multi-API Smart Router Ready!', 'color:#7c3aed;font-size:14px;font-weight:bold;');
console.log('%c🔧 Supported: TikTok, Instagram, YouTube, Facebook, Twitter, Pinterest, Spotify, CapCut, Terabox, GDrive, Mediafire', 'color:#06b6d4;font-size:11px;');
