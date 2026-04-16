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

      // Clear preview sebelum menampilkan media baru
      mediaPreview.innerHTML = '';

      // Menampilkan satu video pertama yang ditemukan
      const videoMedia = medias.find(media => media.type === 'video');
      if (videoMedia) {
        mediaPreview.innerHTML += `<video controls><source src="${videoMedia.url}" type="video/mp4"></video>`;
        document.getElementById('download-video-btn').disabled = false;
      }

      // Menampilkan media lainnya (audio, gambar)
      medias.forEach(media => {
        if (media.type === 'audio') {
          document.getElementById('download-music-btn').disabled = false;
        } else if (media.type === 'image') {
          mediaPreview.innerHTML += `<img src="${media.url}" alt="Image" style="max-width: 100%; margin-bottom: 10px;">`;
          document.getElementById('download-image-btn').disabled = false;
        }
      });

      // Menyimpan link unduhan untuk masing-masing tipe media
      window.videoDownloadLink = videoMedia?.url;
      window.musicDownloadLink = medias.find(m => m.type === 'audio')?.url;
      window.imageDownloadLink = medias.find(m => m.type === 'image')?.url;

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

// Fungsi untuk mendownload media (video, musik, gambar)
function autoDownload(type) {
  let downloadLink;
  let fileExtension;

  if (type === 'video') {
    downloadLink = window.videoDownloadLink;
    fileExtension = 'mp4';
  } else if (type === 'music') {
    downloadLink = window.musicDownloadLink;
    fileExtension = 'mp3';
  } else if (type === 'image') {
    downloadLink = window.imageDownloadLink;
    fileExtension = 'jpg';
  }

  if (downloadLink) {
    const filename = generateRandomFileName(fileExtension);
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

        // Menghapus semua media pratinjau setelah download selesai
        clearPreview();
        document.getElementById('result').style.display = 'none';  // Sembunyikan hasil setelah download
      })
      .catch(err => {
        console.error('Download failed:', err);
        alert("Terjadi kesalahan dalam mengunduh file.");
      });
  }
}

// Membuat nama file acak untuk setiap media
function generateRandomFileName(extension) {
  const timestamp = new Date().getTime();
  const randomSuffix = Math.random().toString(36).substr(2, 5);
  return `file_${timestamp}_${randomSuffix}.${extension}`;
}

// Fungsi untuk membersihkan semua elemen pratinjau media
function clearPreview() {
  document.getElementById('media-preview').innerHTML = ''; // Menghapus elemen media preview
  document.getElementById('download-video-btn').disabled = true; // Menonaktifkan tombol download video
  document.getElementById('download-music-btn').disabled = true; // Menonaktifkan tombol download musik
  document.getElementById('download-image-btn').disabled = true; // Menonaktifkan tombol download gambar
}
