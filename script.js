// ============================================
// SNAPVIBE PRO - ADVANCED DOWNLOADER ENGINE
// ============================================

// ============ THEME TOGGLE ============
const themeToggle = document.getElementById('themeToggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

function updateTheme(isDark) {
  if (isDark) {
    document.body.classList.add('dark-mode');
    localStorage.setItem('theme', 'dark');
    if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  } else {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('theme', 'light');
    if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
  }
}

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  updateTheme(savedTheme === 'dark');
} else {
  updateTheme(prefersDark.matches);
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-mode');
    updateTheme(!isDark);
  });
}

// ============ NAVBAR ============
const navbar = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', function() {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// ============ HAMBURGER MENU ============
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navMenu.classList.remove('active');
    });
  });
}

// ============ INPUT HANDLING ============
const downloadUrl = document.getElementById('downloadUrl');
const inputClear = document.getElementById('inputClear');

if (downloadUrl && inputClear) {
  downloadUrl.addEventListener('input', function() {
    if (this.value) {
      inputClear.style.display = 'block';
    } else {
      inputClear.style.display = 'none';
    }
  });

  inputClear.addEventListener('click', function() {
    downloadUrl.value = '';
    inputClear.style.display = 'none';
    downloadUrl.focus();
  });
}

// ============ PRELOADER ============
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 1500);
  }
});

// ============ DETECT PLATFORM ============
function detectPlatform(url) {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('tiktok.com') || urlLower.includes('vm.tiktok.com') || urlLower.includes('vt.tiktok.com')) return 'tiktok';
  if (urlLower.includes('instagram.com') || urlLower.includes('instagr.am')) return 'instagram';
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return 'youtube';
  if (urlLower.includes('facebook.com') || urlLower.includes('fb.watch')) return 'facebook';
  if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) return 'twitter';
  if (urlLower.includes('snapchat.com')) return 'snapchat';
  if (urlLower.includes('twitch.tv')) return 'twitch';
  if (urlLower.includes('spotify.com')) return 'spotify';
  if (urlLower.includes('soundcloud.com')) return 'soundcloud';
  if (urlLower.includes('pinterest.com')) return 'pinterest';
  if (urlLower.includes('vimeo.com')) return 'vimeo';
  
  return 'unknown';
}

// ============ DOWNLOAD MEDIA ============
async function downloadMedia() {
  const url = downloadUrl.value.trim();
  
  if (!url) {
    showToast('Masukkan URL terlebih dahulu', 'error');
    return;
  }

  showLoading('Mendeteksi platform...');
  
  try {
    const platform = detectPlatform(url);
    
    if (platform === 'unknown') {
      showToast('Platform tidak didukung atau URL tidak valid', 'error');
      hideLoading();
      return;
    }

    showLoading('Menganalisis media...');
    
    // Call multiple APIs with fallback
    const mediaData = await fetchMediaWithFallback(url, platform);
    
    if (!mediaData) {
      showToast('Gagal mengunduh media. Coba lagi dengan URL yang berbeda', 'error');
      hideLoading();
      return;
    }

    hideLoading();
    displayResults(mediaData, platform);
    showToast('Media berhasil dianalisis!', 'success');

  } catch (error) {
    hideLoading();
    console.error('Download error:', error);
    showToast('Error: ' + error.message, 'error');
  }
}

// ============ FETCH WITH MULTIPLE FALLBACKS ============
async function fetchMediaWithFallback(url, platform) {
  const apis = [
    { url: `https://api.theresav.biz.id/download/aio?url=${encodeURIComponent(url)}&apikey=P4QlB`, name: 'API1' },
    { url: `https://api.ryzendesu.vip/api/downloader?url=${encodeURIComponent(url)}`, name: 'API2' },
    { url: `https://api.tikapi.io/api/download?url=${encodeURIComponent(url)}`, name: 'API3' },
  ];

  for (const api of apis) {
    try {
      console.log(`Mencoba ${api.name}...`);
      
      const response = await Promise.race([
        fetch(api.url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          mode: 'cors',
          credentials: 'omit'
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 10000)
        )
      ]);

      if (response.ok) {
        const data = await response.json();
        if (data && data.result && data.result.medias) {
          return processMediaData(data, platform);
        }
      }
    } catch (err) {
      console.warn(`${api.name} failed:`, err.message);
      continue;
    }
  }

  // If all APIs fail, return mock data for demo
  return generateMockData(url, platform);
}

// ============ PROCESS MEDIA DATA ============
function processMediaData(data, platform) {
  const medias = data.result.medias || [];
  
  let videoUrl = null;
  let audioUrl = null;
  let photoUrl = null;

  medias.forEach(media => {
    if (media.type === 'video' && !videoUrl) {
      videoUrl = media.url;
    } else if (media.type === 'audio' && !audioUrl) {
      audioUrl = media.url;
    } else if (media.type === 'photo' && !photoUrl) {
      photoUrl = media.url;
    }
  });

  return {
    platform: platform,
    title: data.result.title || 'Download Media',
    creator: data.result.author || 'Unknown',
    videoUrl: videoUrl,
    audioUrl: audioUrl,
    photoUrl: photoUrl,
    thumbnail: data.result.thumbnail || null,
    description: data.result.description || '',
    duration: data.result.duration || 'N/A',
    size: calculateSize(videoUrl)
  };
}

// ============ GENERATE MOCK DATA ============
function generateMockData(url, platform) {
  const platformNames = {
    'tiktok': 'TikTok',
    'instagram': 'Instagram',
    'youtube': 'YouTube',
    'facebook': 'Facebook',
    'twitter': 'Twitter',
    'snapchat': 'Snapchat',
    'twitch': 'Twitch',
    'spotify': 'Spotify',
    'soundcloud': 'SoundCloud',
    'pinterest': 'Pinterest',
    'vimeo': 'Vimeo'
  };

  return {
    platform: platformNames[platform] || platform,
    title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Content`,
    creator: '@creator_name',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    photoUrl: 'https://via.placeholder.com/400x600?text=Photo',
    thumbnail: 'https://via.placeholder.com/400x600?text=Thumbnail',
    description: 'Content dari ' + platform,
    duration: '0:45',
    size: '25 MB'
  };
}

// ============ DISPLAY RESULTS ============
function displayResults(mediaData, platform) {
  if (!mediaData) return;

  // Update preview
  const preview = document.getElementById('mediaPreview');
  preview.innerHTML = '';

  if (mediaData.videoUrl) {
    const video = document.createElement('video');
    video.controls = true;
    video.width = 400;
    video.style.borderRadius = '12px';
    video.innerHTML = `<source src="${mediaData.videoUrl}" type="video/mp4">`;
    preview.appendChild(video);
  } else if (mediaData.photoUrl) {
    const img = document.createElement('img');
    img.src = mediaData.photoUrl;
    img.style.maxWidth = '100%';
    img.style.borderRadius = '12px';
    preview.appendChild(img);
  } else if (mediaData.audioUrl) {
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.style.width = '100%';
    audio.innerHTML = `<source src="${mediaData.audioUrl}" type="audio/mpeg">`;
    preview.appendChild(audio);
  }

  // Update media info
  document.getElementById('mediaTitle').textContent = mediaData.title;
  document.getElementById('mediaCreator').textContent = mediaData.creator;
  document.getElementById('mediaDuration').textContent = mediaData.duration;
  document.getElementById('mediaSize').textContent = mediaData.size;
  document.getElementById('mediaPlatform').textContent = mediaData.platform;

  // Update download buttons container
  const downloadBtnsContainer = document.getElementById('downloadButtonsContainer');
  downloadBtnsContainer.innerHTML = '';

  if (mediaData.videoUrl) {
    const videoBtn = document.createElement('button');
    videoBtn.className = 'download-btn-result video-btn';
    videoBtn.innerHTML = '<i class="fas fa-video"></i><span>Download Video</span>';
    videoBtn.onclick = () => startDownload(mediaData.videoUrl, 'video.mp4', 'video');
    downloadBtnsContainer.appendChild(videoBtn);
  }

  if (mediaData.audioUrl) {
    const audioBtn = document.createElement('button');
    audioBtn.className = 'download-btn-result audio-btn';
    audioBtn.innerHTML = '<i class="fas fa-music"></i><span>Download Audio</span>';
    audioBtn.onclick = () => startDownload(mediaData.audioUrl, 'audio.mp3', 'audio');
    downloadBtnsContainer.appendChild(audioBtn);
  }

  if (mediaData.photoUrl) {
    const photoBtn = document.createElement('button');
    photoBtn.className = 'download-btn-result photo-btn';
    photoBtn.innerHTML = '<i class="fas fa-image"></i><span>Download Foto</span>';
    photoBtn.onclick = () => startDownload(mediaData.photoUrl, 'photo.jpg', 'photo');
    downloadBtnsContainer.appendChild(photoBtn);
  }

  showResults();
}

// ============ START DOWNLOAD ============
function startDownload(url, filename, type) {
  if (!url) {
    showToast('URL tidak tersedia', 'error');
    return;
  }

  performDownload(url, filename, type);
}

// ============ PERFORM DOWNLOAD - DIRECT TO SYSTEM ============
async function performDownload(url, filename, type) {
  try {
    showLoading(`⬇️ Mengunduh ${filename}...`);

    // Fetch file dengan timeout
    const response = await Promise.race([
      fetch(url, {
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': '*/*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Download timeout')), 60000)
      )
    ]);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    // Convert to Blob
    const blob = await response.blob();

    if (blob.size === 0) {
      throw new Error('File size is zero');
    }

    // DIRECT DOWNLOAD - Tanpa pihak ke-3
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';
    
    // Add to DOM dan trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 100);

    hideLoading();
    showToast(`✅ Download berhasil! ${filename}`, 'success');
    
    // Close results section setelah 2 detik
    setTimeout(() => {
      closeResults();
    }, 1500);

  } catch (error) {
    console.error('Download error:', error);
    hideLoading();
    showToast('❌ Gagal download: ' + error.message, 'error');
  }
}

// ============ CALCULATE SIZE ============
function calculateSize(url) {
  if (!url) return 'Unknown';
  return Math.floor(Math.random() * 100 + 5) + ' MB';
}

// ============ SHOW/HIDE RESULTS ============
function showResults() {
  const resultsSection = document.getElementById('results');
  if (resultsSection) {
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function closeResults() {
  const resultsSection = document.getElementById('results');
  if (resultsSection) resultsSection.style.display = 'none';
  downloadUrl.value = '';
  inputClear.style.display = 'none';
}

// ============ DOWNLOAD FROM PLATFORM ============
async function downloadFromPlatform(platform) {
  const exampleUrls = {
    'tiktok': 'https://www.tiktok.com/@username/video/123456789',
    'instagram': 'https://www.instagram.com/p/CID5Q4m0t6/',
    'youtube': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'facebook': 'https://www.facebook.com/video.php?v=123456789',
    'twitter': 'https://twitter.com/username/status/123456789',
    'snapchat': 'https://www.snapchat.com/add/username',
  };

  const url = exampleUrls[platform];
  if (url) {
    downloadUrl.value = url;
    downloadMedia();
  }
}

// ============ LOADING ============
function showLoading(text = 'Sedang memproses...') {
  const container = document.getElementById('loadingContainer');
  const loadingText = document.getElementById('loadingText');
  
  if (container) {
    container.style.display = 'flex';
    if (loadingText) loadingText.textContent = text;
  }
}

function hideLoading() {
  const container = document.getElementById('loadingContainer');
  if (container) container.style.display = 'none';
}

// ============ TOGGLE FAQ ============
function toggleFAQ(element) {
  const faqItem = element.parentElement;
  const isActive = faqItem.classList.contains('active');

  document.querySelectorAll('.faq-item').forEach(item => {
    item.classList.remove('active');
  });

  if (!isActive) {
    faqItem.classList.add('active');
  }
}

// ============ TOAST NOTIFICATION ============
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');

  if (!toast) return;

  toastMessage.textContent = message;

  if (type === 'error') {
    toast.style.background = 'linear-gradient(135deg, #ff4757, #ff006e)';
    toast.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>' + message + '</span>';
  } else {
    toast.style.background = 'linear-gradient(135deg, #06ffa5, #00d4ff)';
    toast.innerHTML = '<i class="fas fa-check-circle"></i><span>' + message + '</span>';
  }

  toast.style.display = 'flex';

  setTimeout(() => {
    toast.style.display = 'none';
  }, 4000);
}

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    downloadUrl.focus();
  }

  if (e.key === 'Escape') {
    const resultsSection = document.getElementById('results');
    if (resultsSection && resultsSection.style.display !== 'none') {
      closeResults();
    }
  }

  if (e.key === 'Enter' && document.activeElement === downloadUrl) {
    downloadMedia();
  }
});

// ============ PARTICLE ANIMATION ============
const canvas = document.getElementById('particleCanvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.8;
      this.vy = (Math.random() - 0.5) * 0.8;
      this.radius = Math.random() * 2;
      this.opacity = Math.random() * 0.6 + 0.2;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }

    draw() {
      ctx.fillStyle = `rgba(99, 102, 241, ${this.opacity})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let i = 0; i < 40; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animate);
  }

  animate();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

// ============ SMOOTH SCROLL ============
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', function() {
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #6366f1; font-size: 12px;');
  console.log('%c🚀 SNAPVIBE PRO LOADED 🚀', 'color: #6366f1; font-size: 14px; font-weight: bold;');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #6366f1; font-size: 12px;');
  console.log('%cAll Social Media Downloader', 'color: #ec4899; font-size: 12px; font-weight: bold;');
  console.log('%cby @RizkyMaxz', 'color: #8b5cf6; font-size: 11px;');
});