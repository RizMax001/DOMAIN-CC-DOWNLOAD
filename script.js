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

function generateRandomFileName(extension) {
  const timestamp = new Date().getTime();  // Current timestamp (milliseconds)
  const randomSuffix = Math.random().toString(36).substr(2, 5);  // Random string of 5 characters
  return `file_${timestamp}_${randomSuffix}.${extension}`;  // Randomized filename
}

function autoDownload(type) {
  let downloadLink = type === 'video' ? window.videoDownloadLink : window.musicDownloadLink;
  
  // Determine file extension based on type
  let extension = '';
  if (type === 'video') {
    extension = 'mp4';
  } else if (type === 'music') {
    extension = 'mp3';
  } else if (type === 'image') {
    extension = 'jpg';
    downloadLink = window.imageDownloadLink; // Update link if it's image
  }

  if (downloadLink) {
    const filename = generateRandomFileName(extension);  // Generate random filename

    fetch(downloadLink)
      .then(response => response.blob())  // Convert response to Blob
      .then(blob => {
        const a = document.createElement("a");
        const url = URL.createObjectURL(blob);  // Create object URL for the Blob
        a.href = url;
        a.download = filename;  // Set the filename to the random one generated
        
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

function clearInput(inputId) {
  document.getElementById(inputId).value = ''; // Mengosongkan isi input field
}