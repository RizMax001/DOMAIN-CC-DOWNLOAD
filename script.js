// DOWNSOSMED v8.1 - VIDEO, PHOTO, AUDIO
// API: http://api.ikyyxd.my.id/download/all-in-one
// Made with 💜 by RizkyMaxz

const API_BASE = 'http://api.ikyyxd.my.id/download/all-in-one';
const TIMEOUT = 20000;

// CORS Proxies for API
const API_PROXIES = [
  (u) => 'https://corsproxy.io/?' + encodeURIComponent(u),
  (u) => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u)
];

let downloadLinks = [];

// Theme
var themeToggle = document.getElementById('themeToggle');
if(localStorage.getItem('theme')==='light') document.body.classList.remove('dark-mode');
themeToggle.addEventListener('click', function(){
  var isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme', isDark?'dark':'light');
  themeToggle.innerHTML = isDark?'<i class="fas fa-sun"></i>':'<i class="fas fa-moon"></i>';
});

// Navbar scroll
window.addEventListener('scroll', function(){
  var navbar = document.getElementById('navbar');
  navbar.classList.toggle('scrolled', window.scrollY > 40);
});

// Hamburger menu
document.getElementById('hamburger').addEventListener('click', function(){
  document.getElementById('navMenu').classList.toggle('open');
});

// Input handling
var urlInput = document.getElementById('url');
var clearBtn = document.getElementById('clearBtn');

urlInput.addEventListener('input', function(){
  clearBtn.style.display = urlInput.value ? 'flex' : 'none';
});

clearBtn.addEventListener('click', function(){
  urlInput.value = '';
  clearBtn.style.display = 'none';
  urlInput.focus();
});

urlInput.addEventListener('keydown', function(e){
  if(e.key === 'Enter') fetchMedia();
});

// Loading
function showLoading(text){
  document.getElementById('loadingText').textContent = text || 'Memuat...';
  document.getElementById('loadingSpinner').style.display = 'flex';
}

function hideLoading(){
  document.getElementById('loadingSpinner').style.display = 'none';
}

// Fetch media
async function fetchMedia(){
  var url = urlInput.value.trim();
  
  if(!url){
    showToast('Masukkan URL!', 'error');
    return;
  }
  
  try {
    new URL(url);
  } catch(e) {
    showToast('URL tidak valid!', 'error');
    return;
  }
  
  clearPreview();
  document.getElementById('result').style.display = 'none';
  showLoading('Menghubungi server...');
  
  // Try direct fetch first, then proxy
  var apiUrl = API_BASE + '?url=' + encodeURIComponent(url);
  var fetched = false;
  
  async function tryFetch(fetchUrl){
    try {
      var controller = new AbortController();
      var timer = setTimeout(function(){ controller.abort() }, TIMEOUT);
      
      var response = await fetch(fetchUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      clearTimeout(timer);
      
      if(!response.ok) throw new Error('HTTP ' + response.status);
      
      var text = await response.text();
      var data = JSON.parse(text);
      
      return data;
    } catch(e) {
      return null;
    }
  }
  
  // Try direct
  var data = await tryFetch(apiUrl);
  
  // If failed, try proxies
  if(!data){
    for(var i = 0; i < API_PROXIES.length; i++){
      showLoading('Mencoba proxy... (' + (i+1) + '/' + API_PROXIES.length + ')');
      data = await tryFetch(API_PROXIES[i](apiUrl));
      if(data) break;
    }
  }
  
  hideLoading();
  
  if(!data){
    showToast('Gagal terhubung ke server! Coba lagi.', 'error');
    return;
  }
  
  if(!data.status || !data.result){
    showToast('Media tidak ditemukan!', 'error');
    return;
  }
  
  if(data.result.error){
    showToast('Gagal mengambil media!', 'error');
    return;
  }
  
  renderMedia(data.result);
}

// Render media
function renderMedia(result){
  var preview = document.getElementById('media-preview');
  var dlBtns = document.getElementById('dl-btns');
  
  preview.innerHTML = '';
  dlBtns.innerHTML = '';
  downloadLinks = [];
  
  var platform = result.source || 'Media';
  var author = result.author || '';
  var title = result.title || '';
  
  document.getElementById('platform').innerHTML = '<i class="fas fa-play-circle"></i> ' + platform;
  document.getElementById('author').textContent = author ? '@' + author : '';
  
  var captionEl = document.getElementById('caption');
  if(title && !/^https?:\/\//i.test(title)){
    captionEl.style.display = '';
    captionEl.textContent = title.length > 120 ? title.substring(0, 120) + '…' : title;
  } else {
    captionEl.style.display = 'none';
  }
  
  var medias = result.medias || [];
  
  // Separate media types
  var videos = [];
  var photos = [];
  var audio = null;
  
  for(var i = 0; i < medias.length; i++){
    var m = medias[i];
    var type = (m.type || '').toLowerCase();
    var ext = (m.extension || '').toLowerCase();
    
    if(type === 'video' || ext === 'mp4' || (m.quality && m.quality.toLowerCase().includes('video'))){
      videos.push(m);
    } else if(type === 'image' || ['jpg','jpeg','png','webp','gif'].indexOf(ext) !== -1){
      photos.push(m);
    } else if(type === 'audio' || ext === 'mp3'){
      audio = m;
    }
  }
  
  console.log('Videos:', videos);
  console.log('Photos:', photos);
  console.log('Audio:', audio);
  
  // Priority: Video > Photo > Audio
  if(videos.length > 0){
    // Show video
    var videoEl = document.createElement('video');
    videoEl.controls = true;
    videoEl.src = videos[0].url;
    videoEl.style.cssText = 'width:100%;max-height:480px;object-fit:contain;background:#000';
    preview.appendChild(videoEl);
    
    // Video download button
    addButton(dlBtns, 'video', videos[0].url, 'Video HD', 'MP4 • Tanpa Watermark', 'fa-video', 'dl-video');
    
    downloadLinks.push({type: 'video', url: videos[0].url});
    
  } else if(photos.length > 0){
    // Show photo(s)
    if(photos.length === 1){
      // Single photo
      var imgEl = document.createElement('img');
      imgEl.src = photos[0].url;
      imgEl.alt = 'Photo';
      imgEl.style.cssText = 'width:100%;max-height:480px;object-fit:contain;background:#000;cursor:pointer';
      imgEl.onclick = function(){ window.open(photos[0].url, '_blank') };
      preview.appendChild(imgEl);
      
      // Single photo button
      addButton(dlBtns, 'photo_0', photos[0].url, 'Foto', 'JPG/PNG • HD', 'fa-image', 'dl-photo');
      downloadLinks.push({type: 'photo', url: photos[0].url});
      
    } else {
      // Multiple photos with slider
      createSlider(preview, photos);
      
      // Individual buttons for each photo
      for(var j = 0; j < photos.length; j++){
        var photoNum = j + 1;
        addButton(dlBtns, 'photo_' + j, photos[j].url, 'Foto ' + photoNum, 'JPG/PNG • ' + photoNum + '/' + photos.length, 'fa-image', 'dl-photo');
        downloadLinks.push({type: 'photo', url: photos[j].url, name: 'Foto ' + photoNum});
      }
    }
    
  } else if(audio){
    // Show audio
    var audioEl = document.createElement('audio');
    audioEl.controls = true;
    audioEl.src = audio.url;
    audioEl.style.cssText = 'width:100%;max-width:380px;margin:16px auto;display:block';
    preview.appendChild(audioEl);
    
    // Audio button
    addButton(dlBtns, 'audio', audio.url, 'Audio MP3', 'High Quality', 'fa-music', 'dl-music');
    downloadLinks.push({type: 'audio', url: audio.url});
  }
  
  if(downloadLinks.length === 0){
    showToast('Media tidak tersedia!', 'error');
    return;
  }
  
  var resultSection = document.getElementById('result');
  resultSection.style.display = 'block';
  setTimeout(function(){
    resultSection.scrollIntoView({behavior: 'smooth', block: 'center'});
  }, 80);
  
  showToast('Media berhasil dimuat! 🎉', 'success');
}

// Create photo slider
function createSlider(container, photos){
  var slider = document.createElement('div');
  slider.className = 'gallery-slider';
  
  var slides = document.createElement('div');
  slides.className = 'gallery-slides';
  
  for(var i = 0; i < photos.length; i++){
    var slide = document.createElement('div');
    slide.className = 'gallery-slide';
    
    var img = document.createElement('img');
    img.src = photos[i].url;
    img.alt = 'Photo ' + (i + 1);
    img.style.cssText = 'width:100%;max-height:480px;object-fit:contain;background:#000;cursor:pointer';
    
    var photoUrl = photos[i].url;
    img.onclick = function(url){ return function(){ window.open(url, '_blank') } }(photoUrl);
    
    slide.appendChild(img);
    slides.appendChild(slide);
  }
  
  slider.appendChild(slides);
  
  // Navigation buttons
  if(photos.length > 1){
    var prevBtn = document.createElement('button');
    prevBtn.className = 'gallery-nav prev';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.onclick = function(){ changeSlide(-1) };
    slider.appendChild(prevBtn);
    
    var nextBtn = document.createElement('button');
    nextBtn.className = 'gallery-nav next';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.onclick = function(){ changeSlide(1) };
    slider.appendChild(nextBtn);
    
    // Dots
    var dots = document.createElement('div');
    dots.className = 'gallery-dots';
    
    for(var j = 0; j < photos.length; j++){
      var dot = document.createElement('button');
      dot.className = 'gallery-dot' + (j === 0 ? ' active' : '');
      dot.onclick = (function(idx){ return function(){ goToSlide(idx) } })(j);
      dots.appendChild(dot);
    }
    slider.appendChild(dots);
    
    // Counter
    var counter = document.createElement('div');
    counter.className = 'gallery-counter';
    counter.id = 'slideCounter';
    counter.textContent = '1 / ' + photos.length;
    slider.appendChild(counter);
  }
  
  container.appendChild(slider);
  
  window.currentSlide = 0;
  window.totalPhotos = photos.length;
}

// Slider controls
function changeSlide(dir){
  window.currentSlide = (window.currentSlide + dir + window.totalPhotos) % window.totalPhotos;
  updateSlider();
}

function goToSlide(idx){
  window.currentSlide = idx;
  updateSlider();
}

function updateSlider(){
  var slidesEl = document.querySelector('.gallery-slides');
  var dots = document.querySelectorAll('.gallery-dot');
  var counter = document.getElementById('slideCounter');
  
  if(slidesEl){
    slidesEl.style.transform = 'translateX(-' + (window.currentSlide * 100) + '%)';
  }
  
  for(var i = 0; i < dots.length; i++){
    dots[i].classList.toggle('active', i === window.currentSlide);
  }
  
  if(counter){
    counter.textContent = (window.currentSlide + 1) + ' / ' + window.totalPhotos;
  }
}

// Add download button
function addButton(container, type, url, title, subtitle, icon, btnClass){
  var btn = document.createElement('button');
  btn.className = 'dl-btn ' + btnClass;
  btn.onclick = (function(u, t){ return function(){ downloadFile(u, t) } })(url, type);
  
  btn.innerHTML = 
    '<i class="fas ' + icon + '"></i>' +
    '<div class="dl-info"><strong>' + title + '</strong><small>' + subtitle + '</small></div>' +
    '<i class="fas fa-download dl-arrow"></i>';
  
  container.appendChild(btn);
}

// Download file
function downloadFile(url, type){
  var ext = 'mp4';
  if(type.indexOf('photo') !== -1) ext = 'jpg';
  else if(type === 'audio') ext = 'mp3';
  
  var filename = 'DownSosmed_' + ext + '_' + Date.now() + '.' + ext;
  
  showToast('Mempersiapkan download...', 'success');
  
  // Try blob download with CORS
  tryBlobDownload(url, filename, type === 'audio')
    .then(function(success){
      if(!success){
        // Fallback: try with proxy
        return tryBlobDownloadWithProxy(url, filename, type === 'audio');
      }
    })
    .then(function(success){
      if(!success){
        // Last fallback: open in new tab
        window.open(url, '_blank');
        showToast('Download di tab baru ↗', 'success');
      }
    })
    .catch(function(err){
      console.warn('Download error:', err);
      window.open(url, '_blank');
      showToast('Download di tab baru ↗', 'success');
    });
}

async function tryBlobDownload(url, filename, isAudio){
  return new Promise(function(resolve){
    fetch(url)
      .then(function(res){
        if(!res.ok) throw new Error('Fetch failed');
        return res.blob();
      })
      .then(function(blob){
        if(blob.size === 0) throw new Error('Empty blob');
        
        if(isAudio){
          blob = blob.slice(0, blob.size, 'audio/mpeg');
        }
        
        var blobUrl = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(function(){ URL.revokeObjectURL(blobUrl) }, 60000);
        
        showToast('Download berhasil! ✓', 'success');
        resolve(true);
      })
      .catch(function(err){
        console.warn('Blob download failed:', err);
        resolve(false);
      });
  });
}

async function tryBlobDownloadWithProxy(url, filename, isAudio){
  var proxies = [
    'https://corsproxy.io/?' + encodeURIComponent(url),
    'https://api.allorigins.win/raw?url=' + encodeURIComponent(url)
  ];
  
  for(var i = 0; i < proxies.length; i++){
    var success = await tryBlobDownload(proxies[i], filename, isAudio);
    if(success) return true;
  }
  
  return false;
}

// Hide result
function hideResult(){
  document.getElementById('result').style.display = 'none';
  urlInput.value = '';
  clearBtn.style.display = 'none';
  clearPreview();
}

// Clear preview
function clearPreview(){
  document.getElementById('media-preview').innerHTML = '';
  document.getElementById('dl-btns').innerHTML = '';
  downloadLinks = [];
}

// FAQ toggle
function toggleFAQ(el){
  var item = el.parentElement;
  var isActive = item.classList.contains('active');
  
  var items = document.querySelectorAll('.faq-item');
  for(var i = 0; i < items.length; i++){
    items[i].classList.remove('active');
  }
  
  if(!isActive){
    item.classList.add('active');
  }
}

// Toast notification
function showToast(msg, type){
  type = type || 'success';
  var toast = document.getElementById('toast');
  
  toast.className = type === 'error' ? 'error' : '';
  toast.querySelector('i').className = type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
  document.getElementById('toastMessage').textContent = msg;
  
  toast.classList.add('show');
  
  clearTimeout(toast._t);
  toast._t = setTimeout(function(){
    toast.classList.remove('show');
  }, 3500);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e){
  if((e.ctrlKey || e.metaKey) && e.key === 'k'){
    e.preventDefault();
    urlInput.focus();
    urlInput.select();
  }
  if(e.key === 'Escape'){
    var result = document.getElementById('result');
    if(result.style.display !== 'none') hideResult();
    document.getElementById('navMenu').classList.remove('open');
  }
});

// Preloader
window.addEventListener('load', function(){
  var pre = document.getElementById('preloader');
  pre.style.opacity = '0';
  setTimeout(function(){
    pre.style.display = 'none';
  }, 300);
});

// Scroll progress & back to top
window.addEventListener('scroll', function(){
  var scrolled = window.scrollY;
  var max = document.documentElement.scrollHeight - window.innerHeight;
  var pct = max > 0 ? (scrolled / max) * 100 : 0;
  
  document.getElementById('scrollProgress').style.width = pct + '%';
  document.getElementById('backTop').classList.toggle('show', scrolled > 350);
}, {passive: true});

document.getElementById('backTop').addEventListener('click', function(){
  window.scrollTo({top: 0, behavior: 'smooth'});
});

// Reveal animations
var observer = new IntersectionObserver(function(entries){
  entries.forEach(function(entry){
    if(entry.isIntersecting){
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  });
}, {threshold: 0.08});

var revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
for(var i = 0; i < revealEls.length; i++){
  observer.observe(revealEls[i]);
}

// Smooth anchor links
var anchorLinks = document.querySelectorAll('a[href^="#"]');
for(var i = 0; i < anchorLinks.length; i++){
  anchorLinks[i].addEventListener('click', function(e){
    var target = document.querySelector(this.getAttribute('href'));
    if(target){
      e.preventDefault();
      target.scrollIntoView({behavior: 'smooth'});
    }
  });
}

console.log('%c📥 DownSosmed v8 Ready!', 'color:#7c3aed;font-size:14px;font-weight:bold;');