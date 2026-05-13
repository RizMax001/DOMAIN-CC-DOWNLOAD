// ============================================
// MEDIABOX - ADVANCED JAVASCRIPT ENGINE
// ============================================

// ============ THEME TOGGLE ============
const themeToggle = document.getElementById('themeToggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

function updateTheme(isDark) {
  if (isDark) {
    document.body.classList.add('dark-mode');
    localStorage.setItem('theme', 'dark');
    if (themeToggle) {
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
  } else {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('theme', 'light');
    if (themeToggle) {
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
  }
}

// Load saved theme
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

// ============ NAVBAR SCROLL EFFECT ============
const navbar = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', function() {
  // Add shadow to navbar on scroll
  if (window.scrollY > 50) {
    if (navbar) navbar.classList.add('scrolled');
  } else {
    if (navbar) navbar.classList.remove('scrolled');
  }

  // Update active nav link
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    if (scrollY >= sectionTop - 300) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (href.substring(1) === current) {
      link.classList.add('active');
    }
  });
});

// ============ HAMBURGER MENU ============
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    if (navMenu) navMenu.classList.toggle('active');
  });
}

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    if (hamburger) hamburger.classList.remove('active');
    if (navMenu) navMenu.classList.remove('active');
  });
});

// ============ INPUT HANDLING ============
const urlInput = document.getElementById('url');
const clearBtn = document.getElementById('clearBtn');

if (urlInput && clearBtn) {
  urlInput.addEventListener('focus', function() {
    if (this.value) {
      clearBtn.style.display = 'block';
    }
  });

  urlInput.addEventListener('blur', function() {
    if (!this.value) {
      clearBtn.style.display = 'none';
    }
  });

  urlInput.addEventListener('input', function() {
    if (this.value) {
      clearBtn.style.display = 'block';
    } else {
      clearBtn.style.display = 'none';
    }
  });
}

// ============ LOADING SPINNER ============
function showLoading() {
  const spinner = document.getElementById('loadingSpinner');
  if (spinner) spinner.style.display = 'flex';
}

function hideLoading() {
  const spinner = document.getElementById('loadingSpinner');
  if (spinner) spinner.style.display = 'none';
}

// ============ GALLERY SYSTEM ============
class PhotoGallery {
  constructor() {
    this.photos = this.loadPhotos();
    this.initGallery();
  }

  loadPhotos() {
    const stored = localStorage.getItem('galleryPhotos');
    return stored ? JSON.parse(stored) : [];
  }

  savePhotos() {
    localStorage.setItem('galleryPhotos', JSON.stringify(this.photos));
  }

  addPhoto(dataUrl) {
    this.photos.push({
      id: Date.now(),
      data: dataUrl,
      timestamp: new Date().toLocaleString()
    });
    this.savePhotos();
    this.render();
  }

  deletePhoto(id) {
    this.photos = this.photos.filter(p => p.id !== id);
    this.savePhotos();
    this.render();
  }

  downloadPhoto(dataUrl, filename) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename || `photo_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('ðŸ“¥ Foto berhasil didownload!', 'success');
  }

  initGallery() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('photoInput');

    if (!uploadArea || !fileInput) return;

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      this.handleFiles(e.dataTransfer.files);
    });

    // Click to upload
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      this.handleFiles(e.target.files);
    });

    this.render();
  }

  handleFiles(files) {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.addPhoto(e.target.result);
          showToast('âœ¨ Foto berhasil ditambahkan!', 'success');
        };
        reader.readAsDataURL(file);
      } else {
        showToast('âŒ Hanya file gambar yang diterima!', 'error');
      }
    });
  }

  render() {
    const gallery = document.getElementById('photoGallery');
    if (!gallery) return;

    if (this.photos.length === 0) {
      gallery.innerHTML = '<p class="empty-gallery">Tidak ada foto. Mulai upload sekarang!</p>';
      return;
    }

    gallery.innerHTML = this.photos.map(photo => `
      <div class="photo-item">
        <img src="${photo.data}" alt="photo">
        <div class="photo-overlay">
          <button class="photo-btn btn-preview" onclick="photoGallery.previewPhoto('${photo.data}')">
            <i class="fas fa-eye"></i> Preview
          </button>
          <button class="photo-btn btn-download" onclick="photoGallery.downloadPhoto('${photo.data}', 'photo_${photo.id}.png')">
            <i class="fas fa-download"></i> Download
          </button>
          <button class="photo-btn btn-delete" onclick="photoGallery.deletePhoto(${photo.id})">
            <i class="fas fa-trash"></i> Hapus
          </button>
        </div>
        <p class="photo-date">${photo.timestamp}</p>
      </div>
    `).join('');
  }

  previewPhoto(dataUrl) {
    const modal = document.getElementById('previewModal');
    const modalImg = document.getElementById('previewImage');
    if (modal && modalImg) {
      modalImg.src = dataUrl;
      modal.style.display = 'flex';
    }
  }
}

let photoGallery;

// ============ MODAL HANDLER ============
function closeModal() {
  const modal = document.getElementById('previewModal');
  if (modal) modal.style.display = 'none';
}

window.addEventListener('click', (e) => {
  const modal = document.getElementById('previewModal');
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});

// ============ FETCH MEDIA ============
async function fetchMedia() {
  const url = document.getElementById('url')?.value.trim();
  
  if (!url) {
    showToast('Paste URL terlebih dahulu!', 'error');
    return;
  }

  clearPreview();
  showLoading();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    // Main API call with better CORS handling
    const response = await fetch(`https://api.theresav.biz.id/download/aio?url=${encodeURIComponent(url)}&apikey=P4QlB`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      credentials: 'omit'
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 0 || response.type === 'opaque') {
        throw new Error('CORS Error - Server tidak mengizinkan akses');
      }
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    hideLoading();

    if (!data.status) {
      showToast('API Error. Silakan coba lagi.', 'error');
      return;
    }

    if (!data.result || !data.result.medias || data.result.medias.length === 0) {
      showToast('Media tidak ditemukan. Check URL Anda.', 'error');
      return;
    }

    const mediaPreview = document.getElementById('media-preview');
    const medias = data.result.medias;
    const platformName = data.result.source || "Unknown";
    const caption = data.result.title || "No caption";

    if (mediaPreview) mediaPreview.innerHTML = '';

    const videoMedia = medias.find(media => media.type === 'video');
    if (videoMedia && videoMedia.url) {
      const videoUrl = videoMedia.url;
      const videoHtml = `<video controls width="100%" crossorigin="anonymous" style="border-radius: 8px;"><source src="${videoUrl}" type="video/mp4">Browser Anda tidak mendukung video tag</video>`;
      if (mediaPreview) mediaPreview.innerHTML += videoHtml;
      const videoBtn = document.getElementById('download-video-btn');
      if (videoBtn) {
        videoBtn.disabled = false;
        window.videoDownloadLink = videoUrl;
      }
    } else {
      const videoBtn = document.getElementById('download-video-btn');
      if (videoBtn) videoBtn.disabled = true;
    }

    const musicMedia = medias.find(media => media.type === 'audio');
    if (musicMedia && musicMedia.url) {
      const audioUrl = musicMedia.url;
      const audioHtml = `<audio controls width="100%" crossorigin="anonymous" style="width: 100%; margin-top: 1rem;"><source src="${audioUrl}" type="audio/mpeg">Browser Anda tidak mendukung audio tag</audio>`;
      if (mediaPreview) mediaPreview.innerHTML += audioHtml;
      const musicBtn = document.getElementById('download-music-btn');
      if (musicBtn) {
        musicBtn.disabled = false;
        window.musicDownloadLink = audioUrl;
      }
    } else {
      const musicBtn = document.getElementById('download-music-btn');
      if (musicBtn) musicBtn.disabled = true;
    }

    if (!videoMedia && !musicMedia) {
      showToast('Media tidak ditemukan.', 'error');
      return;
    }

    const platformEl = document.getElementById('platform');
    const captionEl = document.getElementById('caption');
    if (platformEl) platformEl.textContent = platformName;
    if (captionEl) captionEl.textContent = caption.substring(0, 100) + (caption.length > 100 ? '...' : '');

    showResult();
    showToast('âœ¨ Media dimuat berhasil!', 'success');

  } catch (error) {
    hideLoading();
    console.error('MediaBox Error:', error);
    
    if (error.name === 'AbortError') {
      showToast('Timeout. Coba lagi.', 'error');
    } else if (error.message.includes('CORS')) {
      showToast('CORS Error - Coba lagi dengan URL berbeda.', 'error');
    } else if (error.message.includes('Failed to fetch')) {
      showToast('Network Error - Periksa koneksi internet Anda.', 'error');
    } else {
      showToast('Error: ' + error.message, 'error');
    }
  }
}

// ============ SHOW/HIDE RESULT ============
function showResult() {
  const resultSection = document.getElementById('result');
  if (resultSection) {
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function hideResult() {
  const resultSection = document.getElementById('result');
  if (resultSection) resultSection.style.display = 'none';
  const urlInput = document.getElementById('url');
  if (urlInput) urlInput.value = '';
  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) clearBtn.style.display = 'none';
}

// ============ AUTO DOWNLOAD WITH CORS HANDLING ============
function autoDownload(type) {
  let downloadLink;

  if (type === 'video') {
    downloadLink = window.videoDownloadLink;
  } else if (type === 'music') {
    downloadLink = window.musicDownloadLink;
  }

  if (!downloadLink) {
    showToast('Link tidak tersedia.', 'error');
    return;
  }

  const downloadBtn = document.getElementById(`download-${type}-btn`);
  if (!downloadBtn) return;

  const originalHTML = downloadBtn.innerHTML;
  downloadBtn.innerHTML = '<div class="option-icon"><i class="fas fa-spinner fa-spin"></i></div><div class="option-info"><h4>Downloading...</h4><p>Jangan tutup halaman</p></div>';
  downloadBtn.disabled = true;

  // Multiple download strategies
  downloadWithRetry(downloadLink, type, downloadBtn, originalHTML, 0);
}

async function downloadWithRetry(url, type, downloadBtn, originalHTML, attempt = 0) {
  const maxAttempts = 3;

  try {
    // Strategy 1: Direct fetch with CORS
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Accept': '*/*',
        'Origin': window.location.origin
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();
    
    if (blob.size === 0) {
      throw new Error("File kosong - Download gagal");
    }

    // Successfully downloaded, create download link
    downloadFile(blob, type, downloadBtn, originalHTML);

  } catch (err) {
    console.error(`Download attempt ${attempt + 1} failed:`, err);

    if (attempt < maxAttempts - 1) {
      // Retry with slight delay
      showToast(`Retry download... (Attempt ${attempt + 2}/${maxAttempts})`, 'error');
      setTimeout(() => {
        downloadWithRetry(url, type, downloadBtn, originalHTML, attempt + 1);
      }, 1000);
    } else {
      // All attempts failed, try alternative method
      console.log('Trying alternative download method...');
      downloadFileWithElement(url, type, downloadBtn, originalHTML);
    }
  }
}

function downloadFile(blob, type, downloadBtn, originalHTML) {
  try {
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = generateFileName(type);
    a.style.display = 'none';
    document.body.appendChild(a);
    
    // Trigger download
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      downloadBtn.innerHTML = originalHTML;
      downloadBtn.disabled = false;
      showToast('âš¡ Download berhasil!', 'success');
      hideResult();
    }, 100);

  } catch (err) {
    console.error('Download file error:', err);
    downloadBtn.innerHTML = originalHTML;
    downloadBtn.disabled = false;
    showToast('Download error: ' + err.message, 'error');
  }
}

// Alternative download using anchor tag directly
function downloadFileWithElement(url, type, downloadBtn, originalHTML) {
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = generateFileName(type);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      downloadBtn.innerHTML = originalHTML;
      downloadBtn.disabled = false;
      showToast('âš¡ Download dimulai!', 'success');
      hideResult();
    }, 500);

  } catch (err) {
    console.error('Alternative download error:', err);
    downloadBtn.innerHTML = originalHTML;
    downloadBtn.disabled = false;
    showToast('Download error: ' + err.message, 'error');
  }
}

// ============ GENERATE FILE NAME ============
function generateFileName(type) {
  const timestamp = new Date().getTime();
  const randomSuffix = Math.random().toString(36).substr(2, 5);
  const extension = type === 'video' ? 'mp4' : 'mp3';
  return `MediaBox_${timestamp}_${randomSuffix}.${extension}`;
}

// ============ CLEAR PREVIEW ============
function clearPreview() {
  const mediaPreview = document.getElementById('media-preview');
  if (mediaPreview) {
    mediaPreview.innerHTML = `
      <div class="preview-placeholder">
        <i class="fas fa-film"></i>
        <p>Media akan ditampilkan di sini</p>
      </div>
    `;
  }
  
  const videoBtn = document.getElementById('download-video-btn');
  const musicBtn = document.getElementById('download-music-btn');
  if (videoBtn) videoBtn.disabled = true;
  if (musicBtn) musicBtn.disabled = true;
  
  window.videoDownloadLink = null;
  window.musicDownloadLink = null;
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
  
  if (!toast || !toastMessage) return;
  
  toastMessage.textContent = message;
  toast.style.display = 'flex';
  
  // Change color based on type
  if (type === 'error') {
    toast.style.background = 'linear-gradient(135deg, #ff4757, #ff006e)';
    toast.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>' + message + '</span>';
  } else {
    toast.style.background = 'linear-gradient(135deg, #06ffa5, #00d4ff)';
    toast.innerHTML = '<i class="fas fa-check-circle"></i><span>' + message + '</span>';
  }

  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

// ============ SMOOTH SCROLL ============
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
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

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + K to focus input
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    if (urlInput) urlInput.focus();
  }

  // Escape to close result
  if (e.key === 'Escape') {
    const resultSection = document.getElementById('result');
    if (resultSection && resultSection.style.display !== 'none') {
      hideResult();
    }
  }

  // Enter to search
  if (e.key === 'Enter' && document.activeElement === urlInput) {
    fetchMedia();
  }
});

// ============ PREVENT DOUBLE CLICK ON BUTTONS ============
document.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('dblclick', (e) => {
    e.preventDefault();
  });
});

// ============ INTERSECTION OBSERVER FOR ANIMATIONS ============
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observe all elements with animations
document.querySelectorAll('.feature-card, .platform-item, .faq-item, .footer-section').forEach(el => {
  observer.observe(el);
});

// ============ PAGE VISIBILITY ============
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('%cMediaBox: Page hidden', 'color: #00d4ff;');
  } else {
    console.log('%cMediaBox: Page visible', 'color: #06ffa5;');
  }
});

// ============ UNLOAD WARNING ============
window.addEventListener('beforeunload', (e) => {
  const resultSection = document.getElementById('result');
  if (resultSection && resultSection.style.display !== 'none') {
    e.preventDefault();
    e.returnValue = '';
  }
});

// ============ PARALLAX EFFECT ============
document.addEventListener('mousemove', (e) => {
  const orbs = document.querySelectorAll('.orb');
  const mouseX = e.clientX / window.innerWidth;
  const mouseY = e.clientY / window.innerHeight;
  
  orbs.forEach((orb, index) => {
    const offset = (index + 1) * 20;
    orb.style.transform = `translate(${mouseX * offset}px, ${mouseY * offset}px)`;
  });
});

// ============ INITIALIZE ============
document.addEventListener('DOMContentLoaded', function() {
  // Initialize gallery
  photoGallery = new PhotoGallery();
  
  clearPreview();
  
  // Add fade-in animation to body
  document.body.style.animation = 'fadeInUp 0.6s ease';
  
  // Log initialization
  console.log('%câ•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—', 'color: #00d4ff; font-size: 12px;');
  console.log('%câ•‘  ðŸŽ¬ MEDIABOX INITIALIZED ðŸŽ¬  â•‘', 'color: #00d4ff; font-size: 12px; font-weight: bold;');
  console.log('%câ•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•', 'color: #00d4ff; font-size: 12px;');
  console.log('%cMediaBox - All-in-One Media Platform', 'color: #8338ec; font-size: 14px; font-weight: bold;');
});