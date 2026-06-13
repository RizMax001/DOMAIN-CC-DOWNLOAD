// DOWNSOSMED v7 - VIDEO, PHOTO, AUDIO
// API: http://api.ikyyxd.my.id/download/all-in-one
// Made with 💜 by RizkyMaxz

const API_BASE = 'http://api.ikyyxd.my.id/download/all-in-one';
const TIMEOUT = 20000;

const CORS_PROXIES = [
  u => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`
];

let mediaLinks = { videos: [], photos: [], audio: null };

// Theme
const themeToggle = document.getElementById('themeToggle');
if(localStorage.getItem('theme')==='light') document.body.classList.remove('dark-mode');
themeToggle.addEventListener('click',()=>{
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme',isDark?'dark':'light');
  themeToggle.innerHTML = isDark?'<i class="fas fa-sun"></i>':'<i class="fas fa-moon"></i>';
});

// Navbar
const navbar = document.getElementById('navbar');
const navMenu = document.getElementById('navMenu');
window.addEventListener('scroll',()=>{
  navbar.classList.toggle('scrolled',window.scrollY>40);
  let cur='';
  document.querySelectorAll('section[id]').forEach(s=>{if(window.scrollY>=s.offsetTop-280)cur=s.getAttribute('id')});
  document.querySelectorAll('.nav-link').forEach(l=>l.classList.toggle('active',l.getAttribute('href')===`#${cur}`));
},{passive:true});
document.getElementById('hamburger').addEventListener('click',()=>navMenu.classList.toggle('open'));
document.querySelectorAll('.nav-link').forEach(l=>l.addEventListener('click',()=>navMenu.classList.remove('open')));

// Input
const urlInput = document.getElementById('url');
const clearBtn = document.getElementById('clearBtn');
urlInput.addEventListener('input',()=>clearBtn.style.display=urlInput.value?'flex':'none');
clearBtn.addEventListener('click',()=>{urlInput.value='';clearBtn.style.display='none';urlInput.focus()});
urlInput.addEventListener('keydown',e=>{if(e.key==='Enter')fetchMedia()});

// Loading
const showLoading=t=>{document.getElementById('loadingText').textContent=t||'Memuat...';document.getElementById('loadingSpinner').style.display='flex'};
const hideLoading=()=>{document.getElementById('loadingSpinner').style.display='none'};

// Fetch
async function fetchMedia(){
  const url = urlInput.value.trim();
  if(!url){showToast('Masukkan URL!','error');return}
  if(!isValidUrl(url)){showToast('URL tidak valid!','error');return}
  
  clearPreview();
  document.getElementById('result').style.display='none';
  showLoading('Menghubungi server...');
  
  try{
    const ctrl=new AbortController();
    const timer=setTimeout(()=>ctrl.abort(),TIMEOUT);
    const res=await fetch(`${API_BASE}?url=${encodeURIComponent(url)}`,{signal:ctrl.signal});
    clearTimeout(timer);
    if(!res.ok)throw new Error(`HTTP ${res.status}`);
    
    const data=await res.json();
    hideLoading();
    
    if(!data.status||!data.result){showToast('Media tidak ditemukan!','error');return}
    if(data.result.error){showToast('Gagal mengambil media!','error');return}
    
    renderResult(data.result);
  }catch(e){
    hideLoading();
    showToast(e.name==='AbortError'?'Timeout! Coba lagi.':'Terjadi kesalahan!','error');
  }
}

// Render
function renderResult(r){
  const preview=document.getElementById('media-preview');
  const dlBtns=document.getElementById('dl-btns');
  preview.innerHTML='';
  dlBtns.innerHTML='';
  
  mediaLinks = { videos: [], photos: [], audio: null };
  
  const platform = r.source||'Media';
  const author = r.author||'';
  const title = r.title||'';
  
  document.getElementById('platform').innerHTML=`<i class="fas fa-play-circle"></i> ${platform}`;
  document.getElementById('author').textContent=author?`@${author}`:'';
  const capEl=document.getElementById('caption');
  if(title&&!title.match(/^https?:\/\//i)){
    capEl.style.display='';
    capEl.textContent=title.length>120?title.slice(0,120)+'…':title;
  }else{capEl.style.display='none'}
  
  const medias = r.medias||[];
  
  // Categorize media
  const videos = medias.filter(m=>m.type==='video'||m.extension==='mp4'||m.quality?.includes('video'));
  const photos = medias.filter(m=>m.type==='image'||['jpg','jpeg','png','webp','gif'].includes(m.extension?.toLowerCase()));
  const audio = medias.find(m=>m.type==='audio'||m.extension==='mp3'||m.quality?.includes('audio'));
  
  console.log('Videos:', videos);
  console.log('Photos:', photos);
  console.log('Audio:', audio);
  
  // Render based on priority: video > photo > audio
  if(videos.length > 0){
    // Show video first
    mediaLinks.videos = videos.map(v=>v.url);
    const v=document.createElement('video');
    v.controls=true;
    v.src=videos[0].url;
    v.style.cssText='width:100%;max-height:480px;object-fit:contain;background:#000';
    preview.appendChild(v);
    
    // Add download buttons
    addDownloadBtn(dlBtns,'video',videos[0].url,'Video HD','MP4 • Tanpa Watermark');
    
    // If more videos
    if(videos.length > 1){
      addDownloadBtn(dlBtns,'video2',videos[1].url,'Video Alternatif','Kualitas lain');
    }
  }
  else if(photos.length > 0){
    // Show photo(s) with slider
    mediaLinks.photos = photos.map(p=>p.url);
    
    if(photos.length === 1){
      // Single photo - no slider
      const img=document.createElement('img');
      img.src=photos[0].url;
      img.alt='Photo';
      img.style.cssText='width:100%;max-height:480px;object-fit:contain;background:#000;cursor:pointer';
      img.onclick = () => window.open(photos[0].url, '_blank');
      preview.appendChild(img);
      
      // Single photo download button
      addDownloadBtn(dlBtns,'photo',photos[0].url,'Foto','JPG/PNG • HD Quality');
    }else{
      // Multiple photos - create slider
      createSlider(preview, photos.map(p=>p.url));
      
      // Add individual download buttons for each photo
      photos.forEach((photo, index) => {
        const photoNum = index + 1;
        addDownloadBtn(dlBtns,`photo_${index}`,photo.url,`Foto ${photoNum}`,`JPG/PNG • ${photoNum}/${photos.length}`);
      });
    }
  }
  else if(audio){
    // Audio only
    mediaLinks.audio = audio.url;
    const a=document.createElement('audio');
    a.controls=true;
    a.src=audio.url;
    a.style.cssText='width:100%;max-width:380px;margin:16px auto;display:block';
    preview.appendChild(a);
    
    addDownloadBtn(dlBtns,'audio',audio.url,'Audio MP3','High Quality');
  }
  
  if(mediaLinks.videos.length === 0 && mediaLinks.photos.length === 0 && !mediaLinks.audio){
    showToast('Media tidak tersedia!','error');
    return;
  }
  
  const result=document.getElementById('result');
  result.style.display='block';
  setTimeout(()=>result.scrollIntoView({behavior:'smooth',block:'center'}),60);
  showToast('Media berhasil dimuat! 🎉','success');
}

// Create Slider for Multiple Images
function createSlider(container, images){
  const slider = document.createElement('div');
  slider.className = 'gallery-slider';
  
  const slidesWrap = document.createElement('div');
  slidesWrap.className = 'gallery-slides';
  
  images.forEach((src, i) => {
    const slide = document.createElement('div');
    slide.className = 'gallery-slide';
    const img = document.createElement('img');
    img.src = src;
    img.alt = `Photo ${i+1}`;
    img.style.cssText = 'width:100%;max-height:480px;object-fit:contain;background:#000;cursor:pointer';
    img.onclick = () => window.open(src, '_blank');
    slide.appendChild(img);
    slidesWrap.appendChild(slide);
  });
  
  slider.appendChild(slidesWrap);
  
  // Navigation buttons
  if(images.length > 1){
    const prevBtn = document.createElement('button');
    prevBtn.className = 'gallery-nav prev';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.onclick = () => goToSlide(-1);
    slider.appendChild(prevBtn);
    
    const nextBtn = document.createElement('button');
    nextBtn.className = 'gallery-nav next';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.onclick = () => goToSlide(1);
    slider.appendChild(nextBtn);
    
    // Dots
    const dots = document.createElement('div');
    dots.className = 'gallery-dots';
    images.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'gallery-dot' + (i===0?' active':'');
      dot.onclick = () => goToSlideExact(i);
      dots.appendChild(dot);
    });
    slider.appendChild(dots);
    
    // Counter
    const counter = document.createElement('div');
    counter.className = 'gallery-counter';
    counter.id = 'galleryCounter';
    counter.textContent = `1 / ${images.length}`;
    slider.appendChild(counter);
  }
  
  container.appendChild(slider);
  
  // Slider state
  window.currentSlide = 0;
  window.totalSlides = images.length;
}

// Slider Navigation
function goToSlide(direction){
  window.currentSlide = (window.currentSlide + direction + window.totalSlides) % window.totalSlides;
  updateSlider();
}

function goToSlideExact(index){
  window.currentSlide = index;
  updateSlider();
}

function updateSlider(){
  const slides = document.querySelector('.gallery-slides');
  const dots = document.querySelectorAll('.gallery-dot');
  const counter = document.getElementById('galleryCounter');
  
  if(slides){
    slides.style.transform = `translateX(-${window.currentSlide * 100}%)`;
  }
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === window.currentSlide);
  });
  if(counter){
    counter.textContent = `${window.currentSlide + 1} / ${window.totalSlides}`;
  }
}

// Add Download Button
function addDownloadBtn(container, type, url, title, subtitle){
  const icon = type === 'video' ? 'fa-video' : type === 'photo' ? 'fa-image' : 'fa-music';
  const btnClass = type === 'video' || type === 'video2' ? 'dl-video' : type === 'photo' ? 'dl-photo' : 'dl-music';
  
  const btn = document.createElement('button');
  btn.className = `dl-btn ${btnClass}`;
  btn.onclick = () => downloadFile(url, type);
  btn.innerHTML = `
    <i class="fas ${icon}"></i>
    <div class="dl-info"><strong>${title}</strong><small>${subtitle}</small></div>
    <i class="fas fa-download dl-arrow"></i>
  `;
  container.appendChild(btn);
}

// Download
async function downloadFile(url, type){
  let ext = 'mp4';
  if(type.startsWith('photo')) ext = 'jpg';
  else if(type === 'audio') ext = 'mp3';
  
  const filename = `DownSosmed_${ext}_${Date.now()}`;
  
  showToast('Mempersiapkan download...', 'success');
  
  if(await tryBlob(url, `${filename}.${ext}`, type === 'audio')) return;
  for(const p of CORS_PROXIES){
    if(await tryBlob(p(url), `${filename}.${ext}`, type === 'audio')) return;
  }
  window.open(url, '_blank');
  showToast('Download di tab baru ↗', 'success');
}

async function tryBlob(url, filename, isAudio){
  try{
    const res=await fetch(url,{signal:AbortSignal.timeout(40000)});
    if(!res.ok)return false;
    let blob=await res.blob();
    if(isAudio) blob=blob.slice(0,blob.size,'audio/mpeg');
    if(blob.size === 0) return false;
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(a.href),50000);
    showToast('Download berhasil! ✓', 'success');
    return true;
  }catch(e){console.warn('Blob failed:',e);return false}
}

// Hide
function hideResult(){
  document.getElementById('result').style.display='none';
  urlInput.value='';clearBtn.style.display='none';
  clearPreview();
}

function clearPreview(){
  document.getElementById('media-preview').innerHTML='';
  document.getElementById('dl-btns').innerHTML='';
  mediaLinks = { videos: [], photos: [], audio: null };
}

// FAQ
function toggleFAQ(el){
  const item=el.parentElement;
  const active=item.classList.contains('active');
  document.querySelectorAll('.faq-item').forEach(i=>i.classList.remove('active'));
  if(!active)item.classList.add('active');
}

// Toast
function showToast(msg,type='success'){
  const toast=document.getElementById('toast');
  toast.className=type==='error'?'error':'';
  toast.querySelector('i').className=type==='error'?'fas fa-exclamation-circle':'fas fa-check-circle';
  document.getElementById('toastMessage').textContent=msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t=setTimeout(()=>toast.classList.remove('show'),3000);
}

const isValidUrl=s=>{try{return!!new URL(s)}catch{return false}};

// Keyboard
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();urlInput.focus();urlInput.select()}
  if(e.key==='Escape'){
    if(document.getElementById('result').style.display!=='none')hideResult();
    navMenu.classList.remove('open');
  }
});

// Preloader
window.addEventListener('load',()=>{
  const pre=document.getElementById('preloader');
  pre.style.opacity='0';
  setTimeout(()=>{pre.style.display='none'},300);
});

// Scroll UI
const progress=document.getElementById('scrollProgress');
const backTop=document.getElementById('backTop');
window.addEventListener('scroll',()=>{
  const scrolled=window.scrollY;
  const max=document.documentElement.scrollHeight-window.innerHeight;
  progress.style.width=(scrolled/max*100)+'%';
  backTop.classList.toggle('show',scrolled>350);
},{passive:true});
backTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));

// Reveal
const obs=new IntersectionObserver(e=>{
  e.forEach(el=>{if(el.isIntersecting){el.target.classList.add('in-view');obs.unobserve(el.target)}})
},{threshold:.08});
document.querySelectorAll('.reveal,.reveal-stagger').forEach(el=>obs.observe(el));

// Smooth anchors
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    const t=document.querySelector(a.getAttribute('href'));
    if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'})}
  })
});

console.log('%c📥 DownSosmed v7 Ready!', 'color:#7c3aed;font-size:14px;font-weight:bold;');