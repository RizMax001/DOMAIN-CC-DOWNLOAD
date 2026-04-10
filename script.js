async function fetchMedia() {
  const url = document.getElementById('tiktok-url').value;
  if (!url) {
    alert("Silakan masukkan URL.");
    return;
  }

  // Menentukan endpoint berdasarkan platform
  let apiUrl = '';
  let allowMusicDownload = false; // Variabel untuk mengecek apakah musik bisa diunduh

  if (url.includes('tiktok.com')) {
    apiUrl = `https://api.deline.web.id/downloader/tiktok?url=${encodeURIComponent(url)}`;
    allowMusicDownload = true; // TikTok mengizinkan audio
  } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
    apiUrl = `https://fgsi.dpdns.org/api/downloader/youtube/v2?apikey=fgsiapi-7f1e321-6d&url=${encodeURIComponent(url)}&type=`;
    allowMusicDownload = true; // YouTube mengizinkan audio
  } else if (url.includes('instagram.com')) {
    apiUrl = `https://fgsi.dpdns.org/api/downloader/instagram?apikey=fgsiapi-7f1e321-6d&url=${encodeURIComponent(url)}`;
  } else if (url.includes('terabox.com')) {
    apiUrl = `https://fgsi.dpdns.org/api/downloader/terabox?apikey=fgsiapi-7f1e321-6d&url=${encodeURIComponent(url)}`;
  } else if (url.includes('capcut.com')) {
    apiUrl = `https://fgsi.dpdns.org/api/downloader/capcut?apikey=fgsiapi-7f1e321-6d&url=${encodeURIComponent(url)}`;
  } else {
    alert("Platform tidak dikenali. Harap masukkan URL yang valid.");
    return;
  }

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.status) {
      let videoLink, musicLink;
      if (data.data && data.data.url) {
        videoLink = data.data.url[0].url; // Mendapatkan link video Instagram
        // Jika platform mendukung musik, aktifkan musik
        if (allowMusicDownload && data.data.music) {
          musicLink = data.data.music;
        }

        const resultDiv = document.getElementById('result');
        resultDiv.style.display = 'block';

        const videoElement = document.getElementById('video-preview');
        const videoSource = document.getElementById('video-source');
        
        if (videoLink) {
          videoSource.src = videoLink;
          videoElement.load();
        }

        // Menampilkan tombol download berdasarkan platform
        document.getElementById('download-video-btn').disabled = !videoLink;
        document.getElementById('download-music-btn').disabled = !musicLink;

        // Menyimpan link download secara global
        window.videoDownloadLink = videoLink;
        window.musicDownloadLink = musicLink;
      } else {
        alert("Error: Tidak dapat mengambil media. Periksa URL dan coba lagi.");
      }
    } else {
      alert("Error: Tidak dapat mengambil media. Periksa URL dan coba lagi.");
    }
  } catch (error) {
    console.error('Error:', error);
    alert("Terjadi kesalahan. Silakan coba lagi.");
  }
}
