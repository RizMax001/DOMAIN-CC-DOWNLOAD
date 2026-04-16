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

  // Menentukan link download berdasarkan jenis media
  if (type === 'video') {
    downloadLink = window.videoDownloadLink;
  } else if (type === 'music') {
    downloadLink = window.musicDownloadLink;
  } else if (type === 'image') {
    downloadLink = window.imageDownloadLink;
  }

  // Cek apakah link download ada
  if (downloadLink) {
    // Nama file akan dihasilkan secara otomatis
    const filename = generateRandomFileName(); // Menghasilkan nama file tanpa ekstensi
    fetch(downloadLink)
      .then(response => response.blob()) // Mengambil file blob
      .then(blob => {
        const a = document.createElement('a');
        const url = URL.createObjectURL(blob); // Membuat URL blob
        a.href = url;
        a.download = filename;  // Nama file yang sudah dihasilkan
        document.body.appendChild(a);
        a.click();  // Mengklik link untuk memulai download
        document.body.removeChild(a);
        URL.revokeObjectURL(url);  // Membebaskan URL yang sudah dibuat

        // Menghapus semua media pratinjau setelah download selesai
        clearPreview();
        document.getElementById('result').style.display = 'none';  // Menyembunyikan hasil setelah download
      })
      .catch(err => {
        console.error('Download failed:', err);
        alert("Terjadi kesalahan dalam mengunduh file.");
      });
  }
}

// Fungsi untuk membuat nama file acak tanpa ekstensi
function generateRandomFileName() {
  const timestamp = new Date().getTime(); // Menggunakan waktu saat ini sebagai bagian dari nama file
  const randomSuffix = Math.random().toString(36).substr(2, 5); // Membuat bagian acak
  return `file_${timestamp}_${randomSuffix}`; // Nama file tanpa ekstensi
}

// Fungsi untuk membersihkan semua elemen pratinjau media
function clearPreview() {
  document.getElementById('media-preview').innerHTML = ''; // Menghapus elemen media preview
  document.getElementById('download-video-btn').disabled = true; // Menonaktifkan tombol download video
  document.getElementById('download-music-btn').disabled = true; // Menonaktifkan tombol download musik
  document.getElementById('download-image-btn').disabled = true; // Menonaktifkan tombol download gambar
}