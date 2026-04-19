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

  // Hapus semua elemen pratinjau media saat tombol "Download All" ditekan
  clearPreview();

  showLoading();  // Menampilkan spinner loading

  try {
    const response = await fetch(`https://api.theresav.biz.id/download/aio?url=${encodeURIComponent(url)}&apikey=P4QlB`);
    const data = await response.json();

    hideLoading();  // Menghilangkan spinner setelah mendapatkan hasil

    if (data.status && data.result && data.result.medias) {
      const mediaPreview = document.getElementById('media-preview');
      const resultSection = document.getElementById('result');
      const medias = data.result.medias;

      // Extract media details
      const platformName = data.result.source; // Extracting platform (e.g. TikTok)
      const caption = data.result.title; // Caption of the media
      const duration = data.result.duration; // Duration of the media

      // Clear preview sebelum menampilkan media baru
      mediaPreview.innerHTML = '';

      // Menampilkan video pertama yang ditemukan
      const videoMedia = medias.find(media => media.type === 'video');
      if (videoMedia) {
        mediaPreview.innerHTML += `<video controls><source src="${videoMedia.url}" type="video/mp4"></video>`;
        document.getElementById('download-video-btn').disabled = false;
      }

      // Menampilkan musik (audio) pertama yang ditemukan
      const musicMedia = medias.find(media => media.type === 'audio');
      if (musicMedia) {
        mediaPreview.innerHTML += `<audio controls><source src="${musicMedia.url}" type="audio/mpeg"></audio>`;
        document.getElementById('download-music-btn').disabled = false;
      }

      // Display media details such as platform name, caption, and duration
      document.getElementById('media-details').innerHTML = `
        <p><strong>Platform:</strong> ${platformName}</p>
        <p><strong>Caption:</strong> ${caption}</p>
        <p><strong>By RizkyMaxz</strong></p>
      `;

      // Menyimpan link unduhan untuk masing-masing tipe media
      window.videoDownloadLink = videoMedia?.url;
      window.musicDownloadLink = musicMedia?.url;

      document.getElementById('result').style.display = 'block';
    } else {
      alert("Gagal mengambil media. Pastikan URL benar.");
    }
  } catch (error) {
    hideLoading();  // Menyembunyikan spinner jika terjadi kesalahan
    console.error('Error:', error);
    alert("Terjadi kesalahan saat mengambil data. Pastikan URL benar dan coba lagi.");
  }
}

// Fungsi untuk mendownload media (video, musik)
function autoDownload(type) {
  let downloadLink;

  if (type === 'video') {
    downloadLink = window.videoDownloadLink;
  } else if (type === 'music') {
    downloadLink = window.musicDownloadLink;
  }

  if (downloadLink) {
    const filename = generateRandomFileName();
    fetch(downloadLink)
      .then(response => response.blob())
      .then(blob => {
        const a = document.createElement('a');
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        clearPreview();
        document.getElementById('result').style.display = 'none';  
      })
      .catch(err => {
        console.error('Download failed:', err);
        alert("Terjadi kesalahan dalam mengunduh file.");
      });
  }
}

// Fungsi untuk membuat nama file acak
function generateRandomFileName() {
  const timestamp = new Date().getTime();
  const randomSuffix = Math.random().toString(36).substr(2, 5);
  return `file_${timestamp}_${randomSuffix}`; 
}

// Fungsi untuk membersihkan semua elemen pratinjau media
function clearPreview() {
  document.getElementById('media-preview').innerHTML = ''; 
  document.getElementById('download-video-btn').disabled = true; 
  document.getElementById('download-music-btn').disabled = true; 
}

// Fungsi untuk format durasi dalam format menit:detik
function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}