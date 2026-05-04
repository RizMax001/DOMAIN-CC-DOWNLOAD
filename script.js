// Menampilkan loading spinner
function showLoading() {
  const spinner = document.getElementById('loading-spinner');
  spinner.style.display = 'block';  // Menampilkan spinner loading
}

// Menyembunyikan loading spinner
function hideLoading() {
  const spinner = document.getElementById('loading-spinner');
  spinner.style.display = 'none';  // Menyembunyikan spinner loading
}

// Fungsi untuk mendapatkan media dari URL yang dimasukkan
async function fetchMedia() {
  const url = document.getElementById('url').value.trim();  // Mengambil dan membersihkan input URL
  if (!url) {
    alert("Masukkan URL!");
    return;
  }

  clearPreview();  // Clear previous media preview
  showLoading();  // Menampilkan spinner loading

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

    hideLoading();  // Menghilangkan spinner setelah mendapatkan hasil

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
    const platformName = data.result.source || "Unknown"; // Extracting platform
    const caption = data.result.title || "No caption"; // Caption of the media

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

    document.getElementById('media-details').innerHTML = `
      <p><strong>Platform:</strong> ${platformName}</p>
      <p><strong>Caption:</strong> ${caption}</p>
      <p><strong>By RizkyMaxz</strong></p>
    `;

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

// Fungsi untuk mendownload media dengan proxy
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
  const originalText = downloadBtn.textContent;
  downloadBtn.textContent = 'Sedang download...';
  downloadBtn.disabled = true;

  // Gunakan proxy untuk menghindari CORS issues
  const proxyUrl = `https://cors-anywhere.herokuapp.com/${downloadLink}`;

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
      downloadBtn.textContent = originalText;
      downloadBtn.disabled = false;

      clearPreview();
      document.getElementById('result').style.display = 'none';
    })
    .catch(err => {
      console.error('Download failed:', err);
      alert("Terjadi kesalahan dalam mengunduh file.\n\nError: " + err.message);
      
      // Reset button
      downloadBtn.textContent = originalText;
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
  document.getElementById('media-preview').innerHTML = ''; 
  document.getElementById('download-video-btn').disabled = true; 
  document.getElementById('download-music-btn').disabled = true;
  
  // Clear stored links
  window.videoDownloadLink = null;
  window.musicDownloadLink = null;
}
