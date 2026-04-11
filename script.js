function showPlatform(platform) {
  // Reset all platforms
  const allBtns = document.querySelectorAll('.platform-btn');
  allBtns.forEach(btn => btn.classList.remove('selected'));

  // Hide all sections
  document.getElementById('tiktok-section').style.display = 'none';
  document.getElementById('instagram-section').style.display = 'none';

  // Show the selected section and highlight the selected button
  if (platform === 'tiktok') {
    document.getElementById('tiktok-section').style.display = 'block';
    document.querySelectorAll('.platform-btn')[0].classList.add('selected');
  } else if (platform === 'instagram') {
    document.getElementById('instagram-section').style.display = 'block';
    document.querySelectorAll('.platform-btn')[1].classList.add('selected');
  }

  // Clear previous media result when switching platform
  document.getElementById('media-preview').innerHTML = '';
  document.getElementById('result').style.display = 'none';
}

async function fetchTikTok() {
  const url = document.getElementById('tiktok-url').value;
  if (!url) {
    alert("Masukkan URL TikTok!");
    return;
  }

  try {
    const response = await fetch(`https://api.deline.web.id/downloader/tiktok?url=${encodeURIComponent(url)}`);
    const data = await response.json();

    if (data.status) {
      const videoLink = data.result.download;
      const musicLink = data.result.music;

      const mediaPreview = document.getElementById('media-preview');
      mediaPreview.innerHTML = `<video controls><source src="${videoLink}" type="video/mp4"></video>`;

      document.getElementById('download-video-btn').disabled = !videoLink;
      document.getElementById('download-music-btn').disabled = !musicLink;

      window.videoDownloadLink = videoLink;
      window.musicDownloadLink = musicLink;

      document.getElementById('result').style.display = 'block';
    } else {
      alert("Gagal mengambil video TikTok.");
    }
  } catch (error) {
    console.error('Error:', error);
    alert("Terjadi kesalahan, coba lagi.");
  }
}

async function fetchInstagram() {
  const url = document.getElementById('instagram-url').value;
  if (!url) {
    alert("Masukkan URL Instagram!");
    return;
  }

  try {
    const response = await fetch(`https://api.deline.web.id/downloader/ig?url=${encodeURIComponent(url)}`);
    const data = await response.json();

    if (data.status) {
      const videoLink = data.result.media.videos[0];
      const imageLink = data.result.media.images[0];

      const mediaPreview = document.getElementById('media-preview');
      if (videoLink) {
        mediaPreview.innerHTML = `<video controls><source src="${videoLink}" type="video/mp4"></video>`;
      } else if (imageLink) {
        mediaPreview.innerHTML = `<img src="${imageLink}" alt="Instagram Image">`;
      }

      document.getElementById('download-video-btn').disabled = !videoLink;
      document.getElementById('download-music-btn').disabled = true; // No music for Instagram

      window.videoDownloadLink = videoLink;

      document.getElementById('result').style.display = 'block';
    } else {
      alert("Gagal mengambil media dari Instagram.");
    }
  } catch (error) {
    console.error('Error:', error);
    alert("Terjadi kesalahan, coba lagi.");
  }
}

function autoDownload(type) {
  let downloadLink = type === 'video' ? window.videoDownloadLink : window.musicDownloadLink;

  if (downloadLink) {
    // Fetch the file from the URL and create a Blob
    fetch(downloadLink)
      .then(response => response.blob())  // Convert response to Blob
      .then(blob => {
        const a = document.createElement("a");
        const url = URL.createObjectURL(blob);  // Create object URL for the Blob
        a.href = url;
        a.download = type === 'video' ? "video.mp4" : "audio.mp3";
        
        // Trigger download directly, no delay
        document.body.appendChild(a);
        a.click();  // Start download
        document.body.removeChild(a);

        // Clean up the object URL
        URL.revokeObjectURL(url);
      })
      .catch(err => {
        console.error('Download failed:', err);
        alert("Terjadi kesalahan dalam mengunduh file.");
      });
  }
}

// Function to clear input field when '❌' is clicked
function clearInput(inputId) {
  document.getElementById(inputId).value = ''; // Mengosongkan isi input field
}
