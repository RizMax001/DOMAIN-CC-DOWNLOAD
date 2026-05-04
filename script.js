// Menampilkan loading spinner
function showLoading() {
  const spinner = document.querySelector('.loading-spinner');
  spinner.style.display = 'flex';
}

// Menyembunyikan loading spinner
function hideLoading() {
  const spinner = document.querySelector('.loading-spinner');
  spinner.style.display = 'none';
}

// Fungsi untuk mendapatkan media dari URL yang dimasukkan
async function fetchMedia() {
  const url = document.getElementById('url').value.trim();
  if (!url) {
    alert("Masukkan URL!");
    return;
  }

  clearPreview();
  showLoading();

  try {
    // Menambah timeout untuk request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 detik timeout

    const response = await fetch(`https://api.theresav.biz.id/download/aio?url=${encodeURIComponent(url)}&apikey=P4QlB`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Cek apakah response OK
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();

    hideLoading();

    // Validasi data dengan lebih ketat
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

    // Cari video
    const videoMedia = medias.find(media => media.type === 'video');
    if (videoMedia && videoMedia.url) {
      mediaPreview.innerHTML += `<video controls width="100%"><source src="${videoMedia.url}" type="video/mp4"></video>`;
      document.getElementById('download-video-btn').disabled = false;
      window.videoDownloadLink = videoMedia.url;
    } else {
      document.getElementById('download-video-btn').disabled = true;
    }

    // Cari audio/music
    const musicMedia = medias.find(media => media.type === 'audio');
    if (musicMedia && musicMedia.url) {
      mediaPreview.innerHTML += `<audio controls width="100%"><source src="${musicMedia.url}" type="audio/mpeg"></audio>`;
      document.getElementById('download-music-btn').disabled = false;
      window.musicDownloadLink = musicMedia.url;
    } else {
      document.getElementById('download-music-btn').disabled = true;
    }

    // Jika tidak ada video dan audio, tampilkan pesan
    if (!videoMedia && !musicMedia) {
      alert("Media tidak ditemukan dalam response. Platform mungkin tidak didukung.");
      return;
    }

    // Update media details dengan ID yang tepat
    document.getElementById('platform').textContent = platformName;
    document.getElementById('caption').textContent = caption.substring(0, 100) + (caption.length > 100 ? '...' : '');

    document.getElementById('result').style.display = 'block';
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

// Fungsi untuk mendownload media
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
  const originalText = downloadBtn.innerHTML;
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

      // Reset button
      downloadBtn.innerHTML = originalText;
      downloadBtn.disabled = false;

      clearPreview();
      document.getElementById('result').style.display = 'none';
    })
    .catch(err => {
      console.error('Download failed:', err);
      alert("Terjadi kesalahan dalam mengunduh file.\n\nError: " + err.message);
      
      // Reset button
      downloadBtn.innerHTML = originalText;
      downloadBtn.disabled = false;
    });
}

function generateFileName(type) {
  const timestamp = new Date().getTime();
  const randomSuffix = Math.random().toString(36).substr(2, 5);
  const extension = type === 'video' ? 'mp4' : 'mp3';
  return `download_${timestamp}_${randomSuffix}.${extension}`;
}

function clearPreview() {
  document.getElementById('media-preview').innerHTML = `
    <div style="text-align: center; color: #999; padding: 40px 20px;">
      <i class="fas fa-file-video" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
      <p>Media akan ditampilkan di sini</p>
    </div>
  `;
  document.getElementById('download-video-btn').disabled = true;
  document.getElementById('download-music-btn').disabled = true;
  
  // Clear stored links
  window.videoDownloadLink = null;
  window.musicDownloadLink = null;
}
