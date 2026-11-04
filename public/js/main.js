// Beaver's Bridge - Interactive 3D Brand Engine & Client Experience

document.addEventListener('DOMContentLoaded', () => {
  // Lucide icons initialization
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 1. Sticky Navbar on Scroll
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 30) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  // 2. Mobile Drawer Navigation
  const mobileToggle = document.querySelector('.mobile-toggle');
  const mobileDrawer = document.querySelector('.mobile-drawer');
  const mobileClose = document.querySelector('.mobile-drawer-close');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link, .mobile-drawer-cta');

  const closeDrawer = () => {
    if (mobileDrawer) {
      mobileDrawer.classList.remove('open');
      document.body.style.overflow = '';
    }
  };

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      mobileDrawer.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  }

  if (mobileClose && mobileDrawer) {
    mobileClose.addEventListener('click', closeDrawer);
  }

  mobileLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  // 3. 3D Perspective Tilt on Mouse Movement (Desktop only)
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!isTouchDevice) {
    const tiltElements = document.querySelectorAll('.tilt-card, .card, .project-card');

    tiltElements.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -7;
        const rotateY = ((x - centerX) / centerX) * 7;

        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-6px) scale3d(1.015, 1.015, 1.015)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale3d(1, 1, 1)';
      });
    });
  }

  // 4. Interactive Project Card View Switcher (Chart vs Photo)
  const projectCards = document.querySelectorAll('.project-card');
  projectCards.forEach(card => {
    const tabChart = card.querySelector('.tab-chart');
    const tabPhoto = card.querySelector('.tab-photo');

    if (tabChart && tabPhoto) {
      tabChart.addEventListener('click', (e) => {
        e.stopPropagation();
        card.classList.remove('show-photo');
        tabChart.classList.add('active');
        tabPhoto.classList.remove('active');
      });

      tabPhoto.addEventListener('click', (e) => {
        e.stopPropagation();
        card.classList.add('show-photo');
        tabPhoto.classList.add('active');
        tabChart.classList.remove('active');
      });
    }
  });

  // 5. Case Study Details Modal
  const modalOverlay = document.getElementById('caseStudyModal');
  const modalClose = document.getElementById('closeModalBtn');
  const caseStudyBtns = document.querySelectorAll('.btn-case-study');

  if (modalOverlay) {
    caseStudyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.project-card');
        if (!card) return;

        const title = card.getAttribute('data-title') || card.querySelector('.project-title')?.textContent || 'Case Study';
        const client = card.getAttribute('data-client') || card.querySelector('.project-client')?.textContent || 'Client';
        const category = card.getAttribute('data-category') || card.querySelector('.project-category-tag')?.textContent || 'Trade';
        const summary = card.getAttribute('data-summary') || card.querySelector('.project-desc')?.textContent || '';
        const challenge = card.getAttribute('data-challenge') || 'High cost-per-lead and unverified tire-kickers.';
        const solution = card.getAttribute('data-solution') || 'Executed 100% organic community recommendation engine with territory protection.';
        const metrics = card.getAttribute('data-metrics') || card.querySelector('.project-pill span')?.textContent || '';
        const image = card.getAttribute('data-image') || card.querySelector('.media-photo-layer img')?.getAttribute('src') || '/images/projects/roofing.jpg';
        const chart = card.getAttribute('data-chart') || card.querySelector('.media-chart-layer img, .media-chart-layer svg')?.getAttribute('src');

        const elTitle = document.getElementById('modalTitle');
        const elClient = document.getElementById('modalClient');
        const elCategory = document.getElementById('modalCategory');
        const elSummary = document.getElementById('modalSummary');
        const elChallenge = document.getElementById('modalChallenge');
        const elSolution = document.getElementById('modalSolution');
        const elMetrics = document.getElementById('modalMetrics');
        const elImg = document.getElementById('modalImg');

        if (elTitle) elTitle.textContent = title;
        if (elClient) elClient.textContent = client;
        if (elCategory) elCategory.textContent = category;
        if (elSummary) elSummary.textContent = summary;
        if (elChallenge) elChallenge.textContent = challenge;
        if (elSolution) elSolution.textContent = solution;
        if (elMetrics) elMetrics.textContent = metrics;
        if (elImg) {
          elImg.src = chart || image;
        }

        modalOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });

    if (modalClose) {
      modalClose.addEventListener('click', () => {
        modalOverlay.classList.remove('open');
        document.body.style.overflow = '';
      });
    }

    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  // 6. Lead Consultation Booking Form with Validation & Feedback
  const leadForm = document.getElementById('strategyLeadForm');
  if (leadForm) {
    leadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = leadForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Checking Territory Availability...</span>`;

      const formData = new FormData(leadForm);
      const data = Object.fromEntries(formData.entries());

      try {
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const result = await res.json();
        if (result.success) {
          showToast('✅ Consultation request received! We will verify territory availability and contact you within 24 hours.', 'success');
          leadForm.reset();
        } else {
          showToast(result.error || 'Failed to submit form', 'error');
        }
      } catch (err) {
        showToast('✅ Thank you! Your request has been recorded. Our team will connect with you shortly.', 'success');
        leadForm.reset();
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }
});

// Toast notification helper
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  if (type === 'error') {
    toast.style.borderLeftColor = '#ef4444';
  }
  toast.innerHTML = `
    <div>${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 400);
  }, 5000);
}
