// Beaver's Bridge Client-Side Interactions

document.addEventListener('DOMContentLoaded', () => {
  // Lucide icons initialization if available
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 1. Sticky Navbar on Scroll
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
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

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      mobileDrawer.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  }

  if (mobileClose && mobileDrawer) {
    mobileClose.addEventListener('click', () => {
      mobileDrawer.classList.remove('open');
      document.body.style.overflow = '';
    });
  }

  // 3. Category Filter Tabs for Projects Portfolio
  const filterTabs = document.querySelectorAll('.category-tab');
  const projectCards = document.querySelectorAll('.project-card');

  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const selectedCategory = tab.getAttribute('data-category');
      projectCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        if (selectedCategory === 'All' || cardCategory === selectedCategory) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 4. Case Study Details Modal
  const modalOverlay = document.getElementById('caseStudyModal');
  const modalClose = document.getElementById('closeModalBtn');
  const caseStudyBtns = document.querySelectorAll('.btn-case-study');

  if (modalOverlay) {
    caseStudyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.project-card');
        const title = card.getAttribute('data-title');
        const client = card.getAttribute('data-client');
        const category = card.getAttribute('data-category');
        const summary = card.getAttribute('data-summary');
        const challenge = card.getAttribute('data-challenge');
        const solution = card.getAttribute('data-solution');
        const metrics = card.getAttribute('data-metrics');
        const image = card.getAttribute('data-image');
        const live = card.getAttribute('data-live');

        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalClient').textContent = client;
        document.getElementById('modalCategory').textContent = category;
        document.getElementById('modalSummary').textContent = summary;
        document.getElementById('modalChallenge').textContent = challenge || 'High customer acquisition cost and lack of community trust.';
        document.getElementById('modalSolution').textContent = solution || 'Executed organic community trust architecture.';
        document.getElementById('modalMetrics').textContent = metrics;
        
        const modalImg = document.getElementById('modalImg');
        if (modalImg && image) {
          modalImg.src = image;
        }

        const liveBtn = document.getElementById('modalLiveLink');
        if (liveBtn) {
          if (live && live.trim()) {
            liveBtn.href = live;
            liveBtn.style.display = 'inline-flex';
          } else {
            liveBtn.style.display = 'none';
          }
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

  // 5. FAQ Accordion
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    if (trigger) {
      trigger.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        faqItems.forEach(i => i.classList.remove('active'));
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });

  // 6. Lead Capture / Strategy Consultation Form
  const leadForm = document.getElementById('strategyLeadForm');
  if (leadForm) {
    leadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = leadForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Submitting Request...</span>`;

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
          showToast(result.message, 'success');
          leadForm.reset();
        } else {
          showToast(result.error || 'Failed to submit form', 'error');
        }
      } catch (err) {
        showToast('Network error. Please try again.', 'error');
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
    toast.style.borderColor = '#ef4444';
  }
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : '⚠️'}</span>
    <div>${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}
