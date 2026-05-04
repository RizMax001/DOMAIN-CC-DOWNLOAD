// ============================================
// SCRIPT FOR PREMIUM DOWNLOADER
// ============================================

// Clear input on focus
document.getElementById('url').addEventListener('focus', function() {
  const clearBtn = document.getElementById('clearBtn');
  if (this.value) {
    clearBtn.style.display = 'block';
  }
});

document.getElementById('url').addEventListener('blur', function() {
  const clearBtn = document.getElementById('clearBtn');
  if (!this.value) {
    clearBtn.style.display = 'none';
  }
});

document.getElementById('url').addEventListener('input', function() {
  const clearBtn = document.getElementById('clearBtn');
  if (this.value) {
    clearBtn.style.display = 'block';
  } else {
    clearBtn.style.display = 'none';
  }
});

// Navbar scroll effect
window.addEventListener('scroll', function() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');
  
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    if (scrollY >= sectionTop - 200) {
      current = section.getAttribute('id');
    }
  });
  
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href').substring(1) === current) {
      link.classList.add('active');
    }
  });
});

// Show Loading Spinner
function showLoading() {
  const spinner = document.getElementById('loadingSpinner');
  spinner.style.display = 'flex';
}

// Hide Loading Spinner
function hideLoading() {
  const spinner = document.getElementById('loadingSpinner');
  spinner.style.display = 'none';
}

// Fetch Media
async function fetchMedia() {
  const url = document.getElementById('url').value.trim();
  if (!url) {
    alert("Masukkan URL!");
    return;
  }

  clearPreview();
  showLoading();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`https://api.theresav.biz.id/download/aio?url=${encodeURIComponent(url)}&apikey=P4QlB`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    hideLoading();

    if (!data.status) {
      alert("API mengembalikan status gagal. Silakan coba lagi.");
      return;
    }

    if (!data.result || !data.result.medias || data.result.medias.length === 0) {
      alert("Gagal mengambil media. Pastikan URL benar dan supported platform.");
      return;
    }

    const mediaPreview = document.getElementById('media-preview');
    const medias = data.result.medias;
    const platformName = data.result.source || "Unknown";
    const caption = data.result.title || "No caption";

    mediaPreview.innerHTML = '';

    const videoMedia = medias.find(media => media.type === 'video');
    if (videoMedia && videoMedia.url) {
      mediaPreview.innerHTML += `<video controls width="100%"><source src="${videoMedia.url}" type="video/mp4"></video>`;
      document.getElementById('download-video-btn').disabled = false;
      window.videoDownloadLink = videoMedia.url;
    } else {
      document.getElementById('download-video-btn').disabled = true;
    }

    const musicMedia = medias.find(media => media.type === 'audio');
    if (musicMedia && musicMedia.url) {
      mediaPreview.innerHTML += `<audio controls width="100%"><source src="${musicMedia.url}" type="audio/mpeg"></audio>`;
      document.getElementById('download-music-btn').disabled = false;
      window.musicDownloadLink = musicMedia.url;
    } else {
      document.getElementById('download-music-btn').disabled = true;
    }

    if (!videoMedia && !musicMedia) {
      alert("Media tidak ditemukan dalam response. Platform mungkin tidak didukung.");
      return;
    }

    document.getElementById('platform').textContent = platformName;
    document.getElementById('caption').textContent = caption.substring(0, 100) + (caption.length > 100 ? '...' : '');

    showResult();

  } catch (error) {
    hideLoading();
    console.error('Error:', error);
    
    if (error.name === 'AbortError') {
      alert("Request timeout. Silakan coba lagi.");
    } else {
      alert("Terjadi kesalahan saat mengambil data. Pastikan URL benar dan coba lagi.\n\nError: " + error.message);
    }
  }
}

// Show Result Section
function showResult() {
  const resultSection = document.getElementById('result');
  resultSection.style.display = 'block';
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Hide Result Section
function hideResult() {
  document.getElementById('result').style.display = 'none';
  document.getElementById('url').value = '';
  document.getElementById('clearBtn').style.display = 'none';
}

// Download Media
function autoDownload(type) {
  let downloadLink;

  if (type === 'video') {
    downloadLink = window.videoDownloadLink;
  } else if (type === 'music') {
    downloadLink = window.musicDownloadLink;
  }

  if (!downloadLink) {
    alert("Link download tidak tersedia. Silakan coba lagi.");
    return;
  }

  const downloadBtn = document.getElementById(`download-${type}-btn`);
  const originalHTML = downloadBtn.innerHTML;
  downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sedang download...';
  downloadBtn.disabled = true;

  fetch(downloadLink, {
    mode: 'cors',
    credentials: 'omit'
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      return response.blob();
    })
    .then(blob => {
      if (blob.size === 0) {
        throw new Error("Downloaded file is empty");
      }

      const a = document.createElement('a');
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = generateFileName(type);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      downloadBtn.innerHTML = originalHTML;
      downloadBtn.disabled = false;

      alert("Download berhasil!");
      hideResult();
    })
    .catch(err => {
      console.error('Download failed:', err);
      alert("Terjadi kesalahan dalam mengunduh file.\n\nError: " + err.message);
      
      downloadBtn.innerHTML = originalHTML;
      downloadBtn.disabled = false;
    });
}

// Generate File Name
function generateFileName(type) {
  const timestamp = new Date().getTime();
  const randomSuffix = Math.random().toString(36).substr(2, 5);
  const extension = type === 'video' ? 'mp4' : 'mp3';
  return `download_${timestamp}_${randomSuffix}.${extension}`;
}

// Clear Preview
function clearPreview() {
  document.getElementById('media-preview').innerHTML = `
    <div class="preview-placeholder">
      <i class="fas fa-file-video"></i>
      <p>Media akan ditampilkan di sini</p>
    </div>
  `;
  document.getElementById('download-video-btn').disabled = true;
  document.getElementById('download-music-btn').disabled = true;
  
  window.videoDownloadLink = null;
  window.musicDownloadLink = null;
}

// Toggle FAQ
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

// Smooth scroll for links
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

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  clearPreview();
});
