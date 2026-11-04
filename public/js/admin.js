// Beaver's Bridge Admin Dashboard JavaScript

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 1. Projects Management (Add / Edit / Delete)
  const addProjectBtn = document.getElementById('addProjectBtn');
  const projectModal = document.getElementById('projectModal');
  const closeProjectModal = document.getElementById('closeProjectModal');
  const projectForm = document.getElementById('projectForm');
  const projectModalTitle = document.getElementById('projectModalTitle');

  if (addProjectBtn && projectModal) {
    addProjectBtn.addEventListener('click', () => {
      projectForm.reset();
      document.getElementById('projectId').value = '';
      projectModalTitle.textContent = 'Add New Project Case Study';
      projectModal.classList.add('open');
    });
  }

  if (closeProjectModal && projectModal) {
    closeProjectModal.addEventListener('click', () => {
      projectModal.classList.remove('open');
    });
  }

  // Edit Project button clicks
  document.querySelectorAll('.btn-edit-project').forEach(btn => {
    btn.addEventListener('click', () => {
      const data = JSON.parse(btn.getAttribute('data-project'));
      document.getElementById('projectId').value = data.id;
      document.getElementById('projectTitle').value = data.title;
      document.getElementById('projectClient').value = data.client;
      document.getElementById('projectCategory').value = data.category;
      document.getElementById('projectSummary').value = data.summary;
      document.getElementById('projectChallenge').value = data.challenge || '';
      document.getElementById('projectSolution').value = data.solution || '';
      document.getElementById('projectMetrics').value = data.metrics;
      document.getElementById('projectImageUrl').value = data.image_url || '';
      document.getElementById('projectLiveUrl').value = data.live_url || '';
      document.getElementById('projectSortOrder').value = data.sort_order || 0;
      document.getElementById('projectFeatured').checked = !!data.featured;

      projectModalTitle.textContent = 'Edit Project Case Study';
      projectModal.classList.add('open');
    });
  });

  // Project Form Submit (Create or Update)
  if (projectForm) {
    projectForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('projectId').value;
      const isEdit = !!id;
      const url = isEdit ? `/api/projects/${id}` : '/api/projects';
      const method = isEdit ? 'PUT' : 'POST';

      const formData = new FormData(projectForm);

      try {
        const res = await fetch(url, {
          method,
          body: formData
        });

        const result = await res.json();
        if (result.success) {
          alert(result.message);
          window.location.reload();
        } else {
          alert('Error: ' + result.error);
        }
      } catch (err) {
        alert('Request failed: ' + err.message);
      }
    });
  }

  // Delete Project
  document.querySelectorAll('.btn-delete-project').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const title = btn.getAttribute('data-title');
      if (confirm(`Are you sure you want to delete the project "${title}"?`)) {
        try {
          const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
          const result = await res.json();
          if (result.success) {
            window.location.reload();
          } else {
            alert('Failed to delete: ' + result.error);
          }
        } catch (err) {
          alert('Network error while deleting project');
        }
      }
    });
  });

  // 2. Testimonials Management
  const addTestimonialBtn = document.getElementById('addTestimonialBtn');
  const testimonialModal = document.getElementById('testimonialModal');
  const closeTestimonialModal = document.getElementById('closeTestimonialModal');
  const testimonialForm = document.getElementById('testimonialForm');
  const testimonialModalTitle = document.getElementById('testimonialModalTitle');

  if (addTestimonialBtn && testimonialModal) {
    addTestimonialBtn.addEventListener('click', () => {
      testimonialForm.reset();
      document.getElementById('testimonialId').value = '';
      testimonialModalTitle.textContent = 'Add Client Testimonial';
      testimonialModal.classList.add('open');
    });
  }

  if (closeTestimonialModal && testimonialModal) {
    closeTestimonialModal.addEventListener('click', () => {
      testimonialModal.classList.remove('open');
    });
  }

  document.querySelectorAll('.btn-edit-testimonial').forEach(btn => {
    btn.addEventListener('click', () => {
      const data = JSON.parse(btn.getAttribute('data-testimonial'));
      document.getElementById('testimonialId').value = data.id;
      document.getElementById('testimonialName').value = data.client_name;
      document.getElementById('testimonialRole').value = data.client_role;
      document.getElementById('testimonialCompany').value = data.client_company;
      document.getElementById('testimonialQuote').value = data.quote;
      document.getElementById('testimonialMetric').value = data.highlight_metric;
      document.getElementById('testimonialRating').value = data.rating;
      document.getElementById('testimonialAvatarUrl').value = data.avatar_url || '';
      document.getElementById('testimonialFeatured').checked = !!data.featured;

      testimonialModalTitle.textContent = 'Edit Client Testimonial';
      testimonialModal.classList.add('open');
    });
  });

  if (testimonialForm) {
    testimonialForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('testimonialId').value;
      const isEdit = !!id;
      const url = isEdit ? `/api/testimonials/${id}` : '/api/testimonials';
      const method = isEdit ? 'PUT' : 'POST';

      const formData = new FormData(testimonialForm);

      try {
        const res = await fetch(url, {
          method,
          body: formData
        });
        const result = await res.json();
        if (result.success) {
          alert(result.message);
          window.location.reload();
        } else {
          alert('Error: ' + result.error);
        }
      } catch (err) {
        alert('Request failed: ' + err.message);
      }
    });
  }

  document.querySelectorAll('.btn-delete-testimonial').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');
      if (confirm(`Delete testimonial from ${name}?`)) {
        try {
          const res = await fetch(`/api/testimonials/${id}`, { method: 'DELETE' });
          const result = await res.json();
          if (result.success) {
            window.location.reload();
          } else {
            alert('Error: ' + result.error);
          }
        } catch (err) {
          alert('Network error while deleting testimonial');
        }
      }
    });
  });

  // 3. Leads Management: Update Status & Delete
  document.querySelectorAll('.lead-status-select').forEach(select => {
    select.addEventListener('change', async () => {
      const id = select.getAttribute('data-id');
      const status = select.value;
      try {
        const res = await fetch(`/api/leads/${id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
        const result = await res.json();
        if (!result.success) {
          alert('Failed to update status: ' + result.error);
        }
      } catch (err) {
        alert('Network error updating status');
      }
    });
  });

  document.querySelectorAll('.btn-delete-lead').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');
      if (confirm(`Are you sure you want to delete lead inquiry from "${name}"?`)) {
        try {
          const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
          const result = await res.json();
          if (result.success) {
            window.location.reload();
          } else {
            alert('Failed: ' + result.error);
          }
        } catch (err) {
          alert('Network error deleting lead');
        }
      }
    });
  });

  // 4. Settings: Password Change Form
  const passwordForm = document.getElementById('passwordForm');
  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById('currentPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      if (newPassword !== confirmPassword) {
        alert('New passwords do not match!');
        return;
      }

      try {
        const res = await fetch('/api/settings/password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword
          })
        });

        const result = await res.json();
        if (result.success) {
          alert(result.message);
          passwordForm.reset();
        } else {
          alert('Failed: ' + result.error);
        }
      } catch (err) {
        alert('Network error while updating password');
      }
    });
  }

  // 5. Settings: Tab Navigation
  const tabBtns = document.querySelectorAll('.settings-tab-btn');
  const tabPanes = document.querySelectorAll('.settings-tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(targetId);
      if (targetPane) {
        targetPane.classList.add('active');
      }
    });
  });

  // Auto-activate tab from URL query param (e.g. /admin/settings?tab=tab-contact)
  const urlParams = new URLSearchParams(window.location.search);
  const activeTabParam = urlParams.get('tab') || window.location.hash.replace('#', '');
  if (activeTabParam) {
    const targetBtn = document.querySelector(`.settings-tab-btn[data-tab="${activeTabParam}"]`);
    if (targetBtn) {
      targetBtn.click();
    }
  }

  // 6. Settings: Live Hero Photo Preview & Reset
  const heroImageFileInput = document.getElementById('heroImageFile');
  const heroImageUrlInput = document.getElementById('heroImageUrl');
  const heroPhotoPreview = document.getElementById('heroPhotoPreview');
  const btnResetLogo = document.getElementById('btnResetLogo');

  if (heroImageFileInput && heroPhotoPreview) {
    heroImageFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const previewUrl = URL.createObjectURL(file);
        heroPhotoPreview.src = previewUrl;
      }
    });
  }

  if (heroImageUrlInput && heroPhotoPreview) {
    heroImageUrlInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val) {
        heroPhotoPreview.src = val;
      }
    });
  }

  if (btnResetLogo && heroPhotoPreview && heroImageUrlInput) {
    btnResetLogo.addEventListener('click', () => {
      heroImageUrlInput.value = '/images/logo.png';
      if (heroImageFileInput) heroImageFileInput.value = '';
      heroPhotoPreview.src = '/images/logo.png';
    });
  }

  // 7. Settings: Content Form Ajax Submission with Alert Banner
  const contentSettingsForm = document.getElementById('contentSettingsForm');
  const settingsAlert = document.getElementById('settingsAlert');

  function showSettingsAlert(message, isError = false) {
    if (!settingsAlert) return;
    settingsAlert.className = isError ? 'settings-alert alert-error' : 'settings-alert alert-success';
    settingsAlert.innerHTML = `
      <i data-lucide="${isError ? 'alert-triangle' : 'check-circle'}" style="width: 20px; height: 20px;"></i>
      <span>${message}</span>
    `;
    if (window.lucide) window.lucide.createIcons();
    settingsAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
      settingsAlert.style.opacity = '0';
      settingsAlert.style.transition = 'opacity 0.5s ease';
      setTimeout(() => {
        settingsAlert.className = 'settings-alert';
        settingsAlert.style.opacity = '1';
      }, 500);
    }, 4500);
  }

  if (contentSettingsForm) {
    contentSettingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtns = contentSettingsForm.querySelectorAll('.btn-save-content');
      submitBtns.forEach(b => {
        b.disabled = true;
        b.innerHTML = '<i data-lucide="loader-2" style="width: 17px; height: 17px;"></i> <span>Saving...</span>';
      });

      const formData = new FormData(contentSettingsForm);

      try {
        const res = await fetch('/api/settings/content', {
          method: 'POST',
          body: formData
        });

        const result = await res.json();
        if (result.success) {
          showSettingsAlert(result.message || 'Website settings updated successfully!');
          if (result.hero_image_url && heroPhotoPreview) {
            heroPhotoPreview.src = result.hero_image_url;
            if (heroImageUrlInput) heroImageUrlInput.value = result.hero_image_url;
          }
        } else {
          showSettingsAlert(result.error || 'Failed to update settings', true);
        }
      } catch (err) {
        showSettingsAlert('Network error while saving settings: ' + err.message, true);
      } finally {
        submitBtns.forEach(b => {
          b.disabled = false;
          b.innerHTML = '<i data-lucide="save" style="width: 17px; height: 17px;"></i> <span>Save Changes</span>';
        });
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }
});
