// ============================================
// DOMAIN ANALYZER PRO - ADVANCED ENGINE
// ============================================

// ============ THEME TOGGLE ============
const themeToggle = document.getElementById('themeToggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

function updateTheme(isDark) {
  if (isDark) {
    document.body.classList.add('dark-mode');
    localStorage.setItem('theme', 'dark');
    if (themeToggle) {
      themeToggle.innerHTML = '<i class="fas fa-sun"></i><span class="toggle-label">Light</span>';
    }
  } else {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('theme', 'light');
    if (themeToggle) {
      themeToggle.innerHTML = '<i class="fas fa-moon"></i><span class="toggle-label">Dark</span>';
    }
  }
}

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  updateTheme(savedTheme === 'dark');
} else {
  updateTheme(prefersDark.matches);
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-mode');
    updateTheme(!isDark);
  });
}

// ============ NAVBAR SCROLL EFFECT ============
const navbar = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', function() {
  if (window.scrollY > 50) {
    if (navbar) navbar.classList.add('scrolled');
  } else {
    if (navbar) navbar.classList.remove('scrolled');
  }

  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    if (scrollY >= sectionTop - 300) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (href.substring(1) === current) {
      link.classList.add('active');
    }
  });
});

// ============ HAMBURGER MENU ============
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    if (navMenu) navMenu.classList.toggle('active');
  });
}

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    if (hamburger) hamburger.classList.remove('active');
    if (navMenu) navMenu.classList.remove('active');
  });
});

// ============ INPUT HANDLING ============
const domainInput = document.getElementById('domainInput');
const clearBtn = document.getElementById('clearBtn');

if (domainInput && clearBtn) {
  domainInput.addEventListener('focus', function() {
    if (this.value) clearBtn.style.display = 'block';
  });

  domainInput.addEventListener('blur', function() {
    if (!this.value) clearBtn.style.display = 'none';
  });

  domainInput.addEventListener('input', function() {
    if (this.value) {
      clearBtn.style.display = 'block';
    } else {
      clearBtn.style.display = 'none';
    }
  });

  clearBtn.addEventListener('click', function() {
    domainInput.value = '';
    clearBtn.style.display = 'none';
    domainInput.focus();
  });
}

// ============ LOADING SPINNER ============
function showLoading() {
  const spinner = document.getElementById('loadingSpinner');
  if (spinner) spinner.style.display = 'flex';
}

function hideLoading() {
  const spinner = document.getElementById('loadingSpinner');
  if (spinner) spinner.style.display = 'none';
}

// ============ DOMAIN VALIDATION ============
function isValidDomain(domain) {
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9]{2,}$/i;
  return domainRegex.test(domain);
}

// ============ ANALYZE DOMAIN FUNCTION ============
async function analyzeDomain() {
  const domain = domainInput?.value.trim().toLowerCase();
  
  if (!domain) {
    showToast('Enter a domain to analyze', 'error');
    return;
  }

  if (!isValidDomain(domain)) {
    showToast('Invalid domain format', 'error');
    return;
  }

  showLoading();
  
  try {
    // Simulate API call with mock data (Replace with real API)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockData = {
      whois: {
        domain: domain,
        registrar: 'Example Registrar Inc.',
        created: '2015-03-15',
        updated: '2024-06-04',
        expires: '2025-03-15',
        status: 'Active'
      },
      dns: {
        a: '93.184.216.34',
        mx: 'mail.' + domain,
        ns: 'ns1.' + domain + ', ns2.' + domain,
        cname: 'www.' + domain,
        txt: 'v=spf1 include:_spf.google.com ~all',
        soa: 'Primary DNS Server'
      },
      ssl: {
        provider: 'Let\'s Encrypt',
        validFrom: '2024-01-15',
        expires: '2025-01-15',
        algorithm: 'RSA-2048',
        keysize: '2048 bits',
        status: 'Valid'
      },
      stats: {
        age: '9 years',
        rank: '#1,234',
        alexa: '#5,678',
        authority: '87/100',
        backlinks: '45,230',
        value: '$125,000 - $250,000'
      },
      ip: {
        address: '93.184.216.34',
        country: 'United States',
        isp: 'Verizon Communications',
        hosting: 'Verizon Hosting',
        lat: '37.7749',
        lon: '-122.4194'
      },
      security: {
        malware: 'Clean',
        phishing: 'Safe',
        spam: 'Low',
        reputation: 'Excellent',
        trust: 'High',
        score: '95/100'
      }
    };

    displayResults(mockData);
    hideLoading();
    showToast('Domain analyzed successfully!', 'success');

  } catch (error) {
    hideLoading();
    console.error('Analysis error:', error);
    showToast('Error analyzing domain: ' + error.message, 'error');
  }
}

// ============ ANALYZE DOMAIN QUICK ============
function analyzeDomainQuick(domain) {
  domainInput.value = domain;
  analyzeDomain();
}

// ============ DISPLAY RESULTS ============
function displayResults(data) {
  if (!data) return;

  // Update WHOIS
  document.getElementById('whois-domain').textContent = data.whois.domain || '-';
  document.getElementById('whois-registrar').textContent = data.whois.registrar || '-';
  document.getElementById('whois-created').textContent = data.whois.created || '-';
  document.getElementById('whois-updated').textContent = data.whois.updated || '-';
  document.getElementById('whois-expires').textContent = data.whois.expires || '-';
  document.getElementById('whois-status').textContent = data.whois.status || '-';
  document.getElementById('resultsDomain').textContent = data.whois.domain || '-';

  // Update DNS
  document.getElementById('dns-a').textContent = data.dns.a || '-';
  document.getElementById('dns-mx').textContent = data.dns.mx || '-';
  document.getElementById('dns-ns').textContent = data.dns.ns || '-';
  document.getElementById('dns-cname').textContent = data.dns.cname || '-';
  document.getElementById('dns-txt').textContent = data.dns.txt || '-';
  document.getElementById('dns-soa').textContent = data.dns.soa || '-';

  // Update SSL
  document.getElementById('ssl-provider').textContent = data.ssl.provider || '-';
  document.getElementById('ssl-valid-from').textContent = data.ssl.validFrom || '-';
  document.getElementById('ssl-expires').textContent = data.ssl.expires || '-';
  document.getElementById('ssl-algo').textContent = data.ssl.algorithm || '-';
  document.getElementById('ssl-keysize').textContent = data.ssl.keysize || '-';
  document.getElementById('ssl-status').textContent = data.ssl.status || '-';

  // Update Stats
  document.getElementById('stats-age').textContent = data.stats.age || '-';
  document.getElementById('stats-rank').textContent = data.stats.rank || '-';
  document.getElementById('stats-alexa').textContent = data.stats.alexa || '-';
  document.getElementById('stats-authority').textContent = data.stats.authority || '-';
  document.getElementById('stats-backlinks').textContent = data.stats.backlinks || '-';
  document.getElementById('stats-value').textContent = data.stats.value || '-';

  // Update IP
  document.getElementById('ip-address').textContent = data.ip.address || '-';
  document.getElementById('ip-country').textContent = data.ip.country || '-';
  document.getElementById('ip-isp').textContent = data.ip.isp || '-';
  document.getElementById('ip-hosting').textContent = data.ip.hosting || '-';
  document.getElementById('ip-lat').textContent = data.ip.lat || '-';
  document.getElementById('ip-lon').textContent = data.ip.lon || '-';

  // Update Security
  document.getElementById('sec-malware').textContent = data.security.malware || '-';
  document.getElementById('sec-phishing').textContent = data.security.phishing || '-';
  document.getElementById('sec-spam').textContent = data.security.spam || '-';
  document.getElementById('sec-reputation').textContent = data.security.reputation || '-';
  document.getElementById('sec-trust').textContent = data.security.trust || '-';
  document.getElementById('sec-score').textContent = data.security.score || '-';

  showResults();
}

// ============ SHOW/HIDE RESULTS ============
function showResults() {
  const resultsSection = document.getElementById('results');
  if (resultsSection) {
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function hideResults() {
  const resultsSection = document.getElementById('results');
  if (resultsSection) resultsSection.style.display = 'none';
  if (domainInput) domainInput.value = '';
  if (clearBtn) clearBtn.style.display = 'none';
}

// ============ EXPORT RESULTS ============
function exportResults(format) {
  const domain = document.getElementById('resultsDomain').textContent;
  const results = {
    domain: domain,
    timestamp: new Date().toISOString(),
    whois: {
      registrar: document.getElementById('whois-registrar').textContent,
      created: document.getElementById('whois-created').textContent,
      expires: document.getElementById('whois-expires').textContent,
      status: document.getElementById('whois-status').textContent
    },
    dns: {
      a: document.getElementById('dns-a').textContent,
      mx: document.getElementById('dns-mx').textContent,
      ns: document.getElementById('dns-ns').textContent
    },
    ssl: {
      provider: document.getElementById('ssl-provider').textContent,
      status: document.getElementById('ssl-status').textContent
    },
    ip: {
      address: document.getElementById('ip-address').textContent,
      country: document.getElementById('ip-country').textContent
    }
  };

  if (format === 'json') {
    downloadJSON(results);
  } else if (format === 'csv') {
    downloadCSV(results);
  } else if (format === 'pdf') {
    showToast('PDF export coming soon', 'info');
  }
}

function downloadJSON(data) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `domain-analysis-${data.domain}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('JSON exported successfully', 'success');
}

function downloadCSV(data) {
  let csv = 'Domain Analysis Report\n';
  csv += `Domain,${data.domain}\n`;
  csv += `Timestamp,${data.timestamp}\n\n`;
  csv += 'WHOIS Information\n';
  csv += `Registrar,${data.whois.registrar}\n`;
  csv += `Created,${data.whois.created}\n`;
  csv += `Expires,${data.whois.expires}\n`;
  csv += `Status,${data.whois.status}\n\n`;
  csv += 'DNS Records\n';
  csv += `A Record,${data.dns.a}\n`;
  csv += `MX Record,${data.dns.mx}\n`;
  csv += `NS Record,${data.dns.ns}\n\n`;
  csv += 'SSL Certificate\n';
  csv += `Provider,${data.ssl.provider}\n`;
  csv += `Status,${data.ssl.status}\n\n`;
  csv += 'IP & Hosting\n';
  csv += `IP Address,${data.ip.address}\n`;
  csv += `Country,${data.ip.country}\n`;

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `domain-analysis-${data.domain}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('CSV exported successfully', 'success');
}

// ============ COPY TO CLIPBOARD ============
function copyToClipboard() {
  const domain = document.getElementById('resultsDomain').textContent;
  const text = `Domain: ${domain}\n`;
  const whoisInfo = `Registrar: ${document.getElementById('whois-registrar').textContent}\n`;
  const dnsInfo = `DNS A: ${document.getElementById('dns-a').textContent}\n`;
  const ipInfo = `IP: ${document.getElementById('ip-address').textContent}`;
  
  const fullText = text + whoisInfo + dnsInfo + ipInfo;
  
  navigator.clipboard.writeText(fullText).then(() => {
    showToast('Results copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Failed to copy to clipboard', 'error');
  });
}

// ============ TOGGLE FAQ ============
function toggleFAQ(element) {
  const faqItem = element.parentElement;
  const isActive = faqItem.classList.contains('active');
  
  document.querySelectorAll('.faq-item').forEach(item => {
    item.classList.remove('active');
  });
  
  if (!isActive) {
    faqItem.classList.add('active');
  }
}

// ============ TOAST NOTIFICATION ============
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  
  if (!toast || !toastMessage) return;
  
  toastMessage.textContent = message;
  toast.style.display = 'flex';
  
  if (type === 'error') {
    toast.style.background = 'linear-gradient(135deg, #ff4757, #ff006e)';
    toast.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>' + message + '</span><button class="toast-close"><i class="fas fa-xmark"></i></button>';
  } else if (type === 'info') {
    toast.style.background = 'linear-gradient(135deg, #3498db, #2980b9)';
    toast.innerHTML = '<i class="fas fa-info-circle"></i><span>' + message + '</span><button class="toast-close"><i class="fas fa-xmark"></i></button>';
  } else {
    toast.style.background = 'linear-gradient(135deg, #06ffa5, #00d4ff)';
    toast.innerHTML = '<i class="fas fa-check-circle"></i><span>' + message + '</span><button class="toast-close"><i class="fas fa-xmark"></i></button>';
  }

  document.querySelector('.toast-close')?.addEventListener('click', () => {
    toast.style.display = 'none';
  });

  setTimeout(() => {
    toast.style.display = 'none';
  }, 3500);
}

// ============ API MODAL ============
function showApiModal() {
  const modal = document.getElementById('apiModal');
  if (modal) modal.style.display = 'flex';
}

function closeApiModal() {
  const modal = document.getElementById('apiModal');
  if (modal) modal.style.display = 'none';
}

window.addEventListener('click', (e) => {
  const modal = document.getElementById('apiModal');
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});

// ============ SMOOTH SCROLL ============
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    if (domainInput) domainInput.focus();
  }

  if (e.key === 'Escape') {
    const resultsSection = document.getElementById('results');
    if (resultsSection && resultsSection.style.display !== 'none') {
      hideResults();
    }
  }

  if (e.key === 'Enter' && document.activeElement === domainInput) {
    analyzeDomain();
  }
});

// ============ INTERSECTION OBSERVER ============
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

document.querySelectorAll('.feature-card, .tool-card, .faq-item, .footer-col').forEach(el => {
  observer.observe(el);
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'all 0.6s ease';
});

// ============ PARTICLE CANVAS ANIMATION ============
const canvas = document.getElementById('particleCanvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  
  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.radius = Math.random() * 1.5;
      this.opacity = Math.random() * 0.5 + 0.2;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }

    draw() {
      ctx.fillStyle = `rgba(99, 102, 241, ${this.opacity})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let i = 0; i < 30; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animate);
  }

  animate();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

// ============ INITIALIZE ============
document.addEventListener('DOMContentLoaded', function() {
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #6366f1; font-size: 12px;');
  console.log('%c🌐 DOMAIN ANALYZER PRO INITIALIZED 🌐', 'color: #6366f1; font-size: 14px; font-weight: bold;');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #6366f1; font-size: 12px;');
  console.log('%cAdvanced Domain Intelligence Platform', 'color: #8b5cf6; font-size: 12px; font-weight: bold;');
  console.log('%cby @RizkyMaxz', 'color: #ec4899; font-size: 11px;');
});
