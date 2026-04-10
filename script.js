// Fungsi untuk mengambil video dan musik TikTok
async function fetchVideo() {
  const url = document.getElementById('tiktok-url').value;
  if (!url) {
    alert("Silakan masukkan URL TikTok.");
    return;
  }

  try {
    const response = await fetch(`https://api.deline.web.id/downloader/tiktok?url=${encodeURIComponent(url)}`);
    const data = await response.json();

    if (data.status) {
      const videoLink = data.result.download;
      const musicLink = data.result.music;

      const resultDiv = document.getElementById('result');
      resultDiv.style.display = 'block';

      const videoElement = document.getElementById('video-preview');
      const videoSource = document.getElementById('video-source');
      
      videoSource.src = videoLink;
      videoElement.load();

      // Mengaktifkan tombol download
      document.getElementById('download-video-btn').disabled = false;
      document.getElementById('download-music-btn').disabled = false;

      // Menyimpan link download secara global
      window.videoDownloadLink = videoLink;
      window.musicDownloadLink = musicLink;
    } else {
      alert("Error: Tidak dapat mengambil video. Periksa URL dan coba lagi.");
    }
  } catch (error) {
    console.error('Error:', error);
    alert("Terjadi kesalahan. Silakan coba lagi.");
  }
}

// Fungsi untuk memulai download otomatis
function autoDownload(type) {
  let downloadLink = type === 'video' ? window.videoDownloadLink : window.musicDownloadLink;

  if (downloadLink) {
    const fileName = generateRandomFilename(type);
    
    const xhr = new XMLHttpRequest();
    xhr.open("GET", downloadLink, true);
    xhr.responseType = "blob";
    
    xhr.onload = function() {
      const blob = xhr.response;
      const a = document.createElement("a");
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
    
    xhr.send();
  }
}

// Fungsi untuk menghasilkan nama file acak
function generateRandomFilename(type) {
  const randomString = Math.random().toString(36).substring(2, 15); // Membuat string acak
  const extension = type === 'video' ? 'mp4' : 'mp3'; // Menentukan ekstensi berdasarkan jenis media
  return `${randomString}.${extension}`; // Mengembalikan nama file yang diacak
}