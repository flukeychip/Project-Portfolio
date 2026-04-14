(function () {
  'use strict';

  const carousel = document.getElementById('carousel');
  const projectsContainer = document.getElementById('project-details');
  let carouselScrollLocked = false;

  function toAssetPath(pathValue) {
    if (!pathValue || typeof pathValue !== 'string') return pathValue;
    if (
      pathValue.startsWith('assets/') ||
      pathValue.startsWith('http://') ||
      pathValue.startsWith('https://') ||
      pathValue.startsWith('data:')
    ) {
      return pathValue;
    }
    return 'assets/' + pathValue;
  }

  function normalizeProjectPaths(project) {
    return Object.assign({}, project, {
      model: toAssetPath(project.model),
      images: (project.images || []).map(toAssetPath),
      videos: (project.videos || []).map(toAssetPath),
      files: (project.files || []).map(function (file) {
        return Object.assign({}, file, { url: toAssetPath(file.url) });
      }),
      timeline: (project.timeline || []).map(function (item) {
        if (typeof item === 'string') return toAssetPath(item);
        if (!item || typeof item !== 'object') return item;
        return Object.assign({}, item, { src: toAssetPath(item.src) });
      })
    });
  }

  const normalizedProjects = projects.map(normalizeProjectPaths);

  // ── 3D Script Loader ───────────────────────────────────────
  function loadScriptsSequential(urls, callback) {
    function loadNext(i) {
      if (i >= urls.length) { callback(); return; }
      var s = document.createElement('script');
      s.src = urls[i];
      s.onload = function () { loadNext(i + 1); };
      document.head.appendChild(s);
    }
    loadNext(0);
  }

  // ── 3D Viewer Class with Mouse Tracking ───────────────────
  class Viewer3D {
    constructor(containerElement) {
      this.container = containerElement;
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.model = null;
      this.animationId = null;
      this.targetRotationX = 0;
      this.targetRotationY = 0;
      this.baseRotationY = 0;
      this.mouseListener = null;
      this.visible = false;
      this.observer = null;
      this.resizeObserver = null;
    }

    resize() {
      if (!this.container || !this.camera || !this.renderer) return;
      const width = Math.max(1, this.container.clientWidth);
      const height = Math.max(1, this.container.clientHeight);
      const aspect = width / height;
      const frustumSize = 6;
      this.camera.left = -frustumSize * aspect / 2;
      this.camera.right = frustumSize * aspect / 2;
      this.camera.top = frustumSize / 2;
      this.camera.bottom = -frustumSize / 2;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    }

    init() {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0xFAFAFC);

      // Orthographic camera — frustum updated in resize(); placeholder until first layout
      const frustumSize = 6;
      this.camera = new THREE.OrthographicCamera(
        -frustumSize / 2, frustumSize / 2,
        frustumSize / 2, -frustumSize / 2,
        0.1, 1000
      );
      this.camera.position.z = 10;

      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.container.appendChild(this.renderer.domElement);
      this.resize();

      // Lighting
      const light1 = new THREE.DirectionalLight(0xffffff, 0.8);
      light1.position.set(5, 5, 5);
      this.scene.add(light1);

      const light2 = new THREE.AmbientLight(0xffffff, 0.5);
      this.scene.add(light2);

      // Mouse tracking
      this.mouseListener = (e) => {
        const rect = this.container.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width * 2 - 1;   // -1 to 1
        const y = -(e.clientY - rect.top) / rect.height * 2 + 1;  // -1 to 1
        this.targetRotationY = this.baseRotationY + x * Math.PI / 4;   // ±45 degrees from base
        this.targetRotationX = y * Math.PI / 6;   // ±30 degrees
      };
      document.addEventListener('mousemove', this.mouseListener);

      // Only animate when visible in viewport
      this.observer = new IntersectionObserver((entries) => {
        this.visible = entries[0].isIntersecting;
        if (this.visible) {
          this.resize();
          if (!this.animationId) this.animate();
        }
      }, { threshold: 0.01, rootMargin: '0px 0px 10% 0px' });
      this.observer.observe(this.container);

      // Fix 0×0 canvas when the gallery lays out after paint (common on GitHub Pages)
      this.resizeObserver = new ResizeObserver(function () {
        this.resize();
        if (this.visible && this.model) this.renderer.render(this.scene, this.camera);
      }.bind(this));
      this.resizeObserver.observe(this.container);
      requestAnimationFrame(function () {
        this.resize();
        if (this.visible && this.model) this.renderer.render(this.scene, this.camera);
      }.bind(this));
    }

    loadModel(modelPath) {
      const loader = new THREE.GLTFLoader();
      loader.load(
        modelPath,
        (gltf) => {
          if (this.model) this.scene.remove(this.model);
          this.model = gltf.scene;
          this.scene.add(this.model);

          // Apply rotation first (floor-mounted orientation)
          this.model.rotation.y = Math.PI / 2;
          this.baseRotationY = Math.PI / 2;
          this.targetRotationY = Math.PI / 2;

          // Now compute bounding box with rotation applied
          const box = new THREE.Box3().setFromObject(this.model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 4 / maxDim;

          // Apply scale, then offset so the rotated+scaled geometric center sits at world origin
          this.model.scale.setScalar(scale);
          this.model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

          this.resize();
          if (this.visible && !this.animationId) this.animate();
          else if (this.visible) this.renderer.render(this.scene, this.camera);
        },
        undefined,
        (error) => console.error('Model load error:', error)
      );
    }

    animate() {
      if (!this.visible) {
        this.animationId = null;
        return;
      }
      this.animationId = requestAnimationFrame(() => this.animate());

      // Smooth rotation interpolation (lerp to target)
      if (this.model) {
        this.model.rotation.y += (this.targetRotationY - this.model.rotation.y) * 0.1;
        this.model.rotation.x += (this.targetRotationX - this.model.rotation.x) * 0.1;
      }

      this.renderer.render(this.scene, this.camera);
    }

    dispose() {
      // Stop animation loop and observer
      this.visible = false;
      if (this.animationId) cancelAnimationFrame(this.animationId);
      if (this.observer) { this.observer.disconnect(); this.observer = null; }
      if (this.resizeObserver) { this.resizeObserver.disconnect(); this.resizeObserver = null; }

      // Remove mouse listener
      if (this.mouseListener) {
        document.removeEventListener('mousemove', this.mouseListener);
      }

      // Clean up renderer
      if (this.renderer) {
        this.container.removeChild(this.renderer.domElement);
        this.renderer.dispose();
      }

      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.model = null;
      this.mouseListener = null;
    }
  }

  // ── Render Carousel ────────────────────────────────────────
  normalizedProjects.forEach(function (p) {
    const card = document.createElement('a');
    card.href = '#' + p.id;
    card.className = 'carousel-card';

    // Thumbnail priority: image → video (videos make great looping card previews)
    var thumb;
    if (p.images && p.images.length) {
      thumb = '<img src="' + p.images[0] + '" alt="' + p.name + '" class="carousel-img">';
    } else if (p.videos && p.videos.length) {
      thumb = '<video src="' + p.videos[0] + '" class="carousel-img" autoplay loop muted playsinline></video>';
    } else {
      thumb = '<div class="carousel-img" style="background: #f5f5f5; display: flex; align-items: center; justify-content: center; color: #999;">No photo</div>';
    }

    card.innerHTML =
      thumb +
      '<div class="carousel-info">' +
        '<h3>' + p.name + '</h3>' +
        '<p>' + p.tagline + '</p>' +
      '</div>';

    card.addEventListener('click', function (e) {
      e.preventDefault();
      // Unlock scroll hijacking and exit carousel mode
      inCarouselMode = false;
      carouselDone = true;
      // Scroll to project detail
      document.getElementById(p.id).scrollIntoView({ behavior: 'smooth' });
    });

    carousel.appendChild(card);
  });

  // ── Curtain Reveal & Carousel Interception ────────────────────────
  //
  // Geometry (all position: fixed, bottom: 0):
  //   Hero:     height = 100vh, z-index 100  (front curtain)
  //   Carousel: height = ch,    z-index 50   (behind hero)
  //
  // Phase 1 (0 → ch):
  //   Hero translates up by scrollY. Carousel stays at bottom.
  //   Ends when hero's bottom edge = carousel's top edge.
  //
  // Phase 2 (ch → (ch + vp) / 2):
  //   Hero + carousel move up together (hero: -scrollY, carousel: -(scrollY-ch)).
  //   Project details (normal flow) naturally move up at the same rate.
  //   Ends when carousel center = viewport center.
  //
  // Phase 3 (locked at scrollY2):
  //   Scroll locked. Wheel hijacked to scroll carousel horizontally.
  //   Ends when carousel fully scrolled across.
  //
  // Phase 4 (scrollY2 → end):
  //   Scroll resumes. Hero + carousel continue up. Project details emerge below.

  const hero      = document.querySelector('.hero');
  const carouselSection = document.querySelector('.carousel-section');
  const projectDetails  = document.getElementById('project-details');
  const scrollSpacer    = document.getElementById('scroll-spacer');

  // ── Hero CTA Button ───────────────────────────────────────
  var viewWorksBtn = document.querySelector('.btn-primary');
  if (viewWorksBtn) {
    viewWorksBtn.addEventListener('click', function(e) {
      e.preventDefault();
      // Scroll to carousel using the same boundary calculation as scroll hijacking
      // scrollY1 is where hero bottom meets carousel top (hero slides up by ch)
      window.scrollTo({ top: scrollY1, behavior: 'smooth' });
    });
  }

  const navH = document.querySelector('nav').offsetHeight;
  const vp   = window.innerHeight;
  const ch   = carouselSection.offsetHeight;

  // Get carousel's bottom padding and border to account for content end position
  const carouselStyle = window.getComputedStyle(carouselSection);
  const carouselPaddingBottom = parseFloat(carouselStyle.paddingBottom) || 0;
  const carouselBorderBottomWidth = parseFloat(carouselStyle.borderBottomWidth) || 0;
  const carouselBottomOffset = carouselPaddingBottom + carouselBorderBottomWidth;

  // Phase boundaries
  // scrollY1: hero bottom meets carousel top (hero slid up by ch)
  const scrollY1 = ch;
  // scrollY2: carousel center at viewport center
  // carousel top in vp at scrollY = vp - scrollY (after phase 1, carousel moves too)
  // carousel center = vp - scrollY + ch/2 = vp/2 → scrollY2 = vp/2 + ch/2
  const scrollY2 = Math.max(scrollY1, (vp + ch) / 2);

  // Spacer height = vp + ch
  // Proof: carousel bottom = vp - (scrollY - scrollY1) = vp + ch - scrollY
  //        project-details top in viewport = spacer - scrollY
  //        For these to always be equal: spacer = vp + ch
  // This holds across all scroll phases and all resolutions.
  function updateSpacer() {
    var newVp = window.innerHeight;
    var newCh = carouselSection.offsetHeight;
    var newNavH = document.querySelector('nav').offsetHeight;
    // project-details doc pos = navH + spacer; carousel bottom at scrollY1 = vp
    // solve: navH + spacer - scrollY1 = vp → spacer = vp + ch - navH
    scrollSpacer.style.height = (newVp + newCh - newNavH) + 'px';
  }
  updateSpacer();
  window.addEventListener('resize', updateSpacer);

  let inCarouselMode  = false;
  let carouselDone    = false;
  let blocking        = false;

  function applyTransforms(scrollY) {
    hero.style.transform = 'translateY(-' + scrollY + 'px)';
    if (scrollY <= scrollY1) {
      carouselSection.style.transform = 'translateY(0)';
      projectDetails.style.transform = 'translateY(0)';
    } else {
      var offset = scrollY - scrollY1;
      carouselSection.style.transform = 'translateY(-' + offset + 'px)';
      projectDetails.style.transform = 'translateY(0)';
    }
  }

  function carouselCenterInViewport() {
    var rect = carouselSection.getBoundingClientRect();
    return rect.top + rect.height / 2;
  }

  // Apply on page load (handles refreshes mid-page or at top)
  applyTransforms(window.scrollY);

  // ── Scroll Indicator ──────────────────────────────────────
  var scrollIndicator = document.querySelector('.scroll-indicator');
  if (scrollIndicator) {
    window.addEventListener('scroll', function() {
      var scrollY = window.scrollY;
      var maxScroll = vp / 2;  // Fade/rotate over half viewport height for faster response
      var progress = Math.min(1, scrollY / maxScroll);  // 0 to 1
      var opacity = Math.max(0, 1 - progress);
      var rotation = progress * 180;  // Rotate 0 to 180 degrees

      scrollIndicator.style.opacity = opacity;
      scrollIndicator.style.transform = 'translateX(-50%) rotateZ(' + rotation + 'deg)';

      if (opacity === 0) {
        scrollIndicator.style.pointerEvents = 'none';
      } else {
        scrollIndicator.style.pointerEvents = 'auto';
      }
    });
  }

  window.addEventListener('scroll', function () {
    if (blocking) return;
    var scrollY = window.scrollY;

    if (inCarouselMode) {
      blocking = true;
      window.scrollTo(0, scrollY2);
      blocking = false;
      applyTransforms(scrollY2);
      return;
    }

    applyTransforms(scrollY);

    // Enter carousel mode when carousel center reaches viewport center
    if (!carouselDone && !inCarouselMode && Math.abs(carouselCenterInViewport() - vp / 2) < 20) {
      inCarouselMode = true;
      blocking = true;
      window.scrollTo(0, scrollY2);
      blocking = false;
      applyTransforms(scrollY2);
    }
  });

  window.addEventListener('wheel', function (e) {
    if (carouselDone) {
      // Carousel permanently done — let browser scroll natively (preserves momentum like phase 1)
      return;
    }

    if (!inCarouselMode) return;
    e.preventDefault();

    var delta = e.deltaX + e.deltaY;
    carousel.scrollLeft += delta;
    var maxScroll = carousel.scrollWidth - carousel.clientWidth;

    if (delta < 0 && carousel.scrollLeft <= 0) {
      carousel.scrollLeft = 0;
      inCarouselMode = false;
      carouselDone = false;
    } else if (carousel.scrollLeft >= maxScroll - 2) {
      carousel.scrollLeft = maxScroll;
      inCarouselMode = false;
      carouselDone = true;
    }
  }, { passive: false });

  // ── Render Project Details ─────────────────────────────────
  var pending3D = [];

  normalizedProjects.forEach(function (p, idx) {
    const section = document.createElement('section');
    section.className = 'project-detail';
    section.id = p.id;

    const skillsHTML = p.skills
      .map(function (s) { return '<div class="skill-badge">' + s + '</div>'; })
      .join('');

    // Build media array with priority: 3D models → videos → images
    var mediaArray = [];
    if (p.model) {
      mediaArray.push({ type: '3d', src: p.model });
    }
    if (p.videos && p.videos.length) {
      p.videos.forEach(function(vid) {
        mediaArray.push({ type: 'video', src: vid });
      });
    }
    if (p.images && p.images.length) {
      p.images.forEach(function(img) {
        mediaArray.push({ type: 'image', src: img });
      });
    }

    // Build gallery HTML
    var galleryHTML = '';
    var hasMultipleMedia = mediaArray.length > 1;

    if (mediaArray.length === 0) {
      galleryHTML = '<div class="gallery-item"><p style="color: #999; padding: 4rem 2rem; text-align: center;">No media</p></div>';
    } else {
      // Create carousel container with navigation
      galleryHTML = '<div class="media-carousel" data-project="' + p.id + '">' +
        '<div class="media-viewer" id="viewer-' + p.id + '">';

      // Render first media item
      var firstMedia = mediaArray[0];
      if (firstMedia.type === '3d') {
        galleryHTML += '<div class="gallery-item gallery-item-3d" id="3d-' + p.id + '"></div>';
      } else if (firstMedia.type === 'video') {
        var allowSoundOnClick = p.id === 'parametric-speaker';
        var soundDataAttr = allowSoundOnClick ? ' data-allow-sound="true"' : '';
        var soundTitleAttr = allowSoundOnClick ? ' title="Click to enable sound"' : '';
        galleryHTML += '<div class="gallery-item gallery-item-video">' +
          '<video src="' + firstMedia.src + '" autoplay loop muted playsinline' + soundDataAttr + soundTitleAttr + '></video>' +
        '</div>';
      } else if (firstMedia.type === 'image') {
        galleryHTML += '<div class="gallery-item"><img src="' + firstMedia.src + '" alt="' + p.name + '"></div>';
      }

      galleryHTML += '</div>';

      // Add navigation arrows if multiple media
      if (hasMultipleMedia) {
        galleryHTML += '<button class="media-nav media-nav-prev" data-project="' + p.id + '">‹</button>' +
                       '<button class="media-nav media-nav-next" data-project="' + p.id + '">›</button>' +
                       '<div class="media-counter">' + (1) + ' / ' + mediaArray.length + '</div>';
      }

      galleryHTML += '</div>';
    }

    // Timeline — rendered OUTSIDE the grid so expanding it never shifts the 3D viewer
    var timelineHTML = '';
    if (p.timeline && p.timeline.length > 0) {
      var timelineItems = p.timeline.map(function(item, i) {
        var src   = typeof item === 'string' ? item : item.src;
        var label = typeof item === 'string' ? ('Step ' + (i + 1)) : item.label;
        return '<div class="timeline-item">' +
          '<span class="timeline-step">' + (i + 1) + '</span>' +
          '<img src="' + src + '" alt="' + label + '" loading="lazy">' +
          '<div class="timeline-label">' + label + '</div>' +
        '</div>';
      }).join('');

      timelineHTML =
        '<div class="timeline-section">' +
          '<button class="timeline-toggle" data-project="' + p.id + '">' +
            '<svg class="timeline-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="2 4 6 8 10 4"/></svg>' +
            'Build Timeline' +
          '</button>' +
          '<div class="timeline-photos" id="timeline-' + p.id + '">' +
            '<div class="timeline-track">' + timelineItems + '</div>' +
          '</div>' +
        '</div>';
    }

    section.innerHTML =
      '<h2 class="project-title">' + p.name + '</h2>' +
      '<div class="project-meta">' + p.tagline + '</div>' +
      '<div class="project-layout">' +
        '<div class="project-text">' +
          '<h4>About</h4>' +
          '<p>' + p.description + '</p>' +
          '<div class="skills-section">' +
            '<div class="skills-grid">' + skillsHTML + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="project-gallery">' +
          galleryHTML +
        '</div>' +
      '</div>' +
      timelineHTML;

    projectsContainer.appendChild(section);

    // Store media array on the section for carousel navigation
    section.mediaArray = mediaArray;
    section.currentMediaIndex = 0;

    // Queue 3D viewer init — scripts loaded after this loop
    if (mediaArray.length > 0 && mediaArray[0].type === '3d') {
      pending3D.push({ section: section, src: mediaArray[0].src });
    }
  });

  // Load Three.js only if at least one project has a 3D model
  if (pending3D.length > 0) {
    loadScriptsSequential(
      ['lib/three.min.js?v=2', 'lib/GLTFLoader.js?v=2'],
      function () {
        pending3D.forEach(function (item) {
          var container = document.getElementById('3d-' + item.section.id);
          var viewer = new Viewer3D(container);
          viewer.init();
          viewer.loadModel(item.src);
          item.section.viewer3d = viewer;
        });
      }
    );
  }

  // ── Timeline Toggle ────────────────────────────────────────
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.timeline-toggle');
    if (!btn) return;

    var projectId = btn.getAttribute('data-project');
    var panel = document.getElementById('timeline-' + projectId);
    var isOpen = panel.classList.contains('is-open');

    panel.classList.toggle('is-open', !isOpen);
    btn.classList.toggle('is-open', !isOpen);
  });

  // ── Media Carousel Navigation ──────────────────────────────
  document.addEventListener('click', function(e) {
    if (!e.target.classList.contains('media-nav')) return;

    var projectId = e.target.getAttribute('data-project');
    var section = document.getElementById(projectId);
    var mediaArray = section.mediaArray;
    var currentIndex = section.currentMediaIndex;
    var nextIndex;

    if (e.target.classList.contains('media-nav-next')) {
      nextIndex = (currentIndex + 1) % mediaArray.length;
    } else {
      nextIndex = (currentIndex - 1 + mediaArray.length) % mediaArray.length;
    }

    // Dispose old 3D viewer if exists
    if (section.viewer3d) {
      section.viewer3d.dispose();
      section.viewer3d = null;
    }

    // Clear and render new media (with fade-in animation)
    var viewer = section.querySelector('#viewer-' + projectId);
    viewer.innerHTML = '';
    viewer.classList.remove('media-fade-in');
    void viewer.offsetWidth; // force reflow so animation re-triggers
    viewer.classList.add('media-fade-in');

    var nextMedia = mediaArray[nextIndex];
    if (nextMedia.type === '3d') {
      var container = document.createElement('div');
      container.className = 'gallery-item gallery-item-3d';
      container.id = '3d-' + projectId;
      viewer.appendChild(container);

      var viewer3d = new Viewer3D(container);
      viewer3d.init();
      viewer3d.loadModel(nextMedia.src);
      section.viewer3d = viewer3d;
    } else if (nextMedia.type === 'video') {
      var vid = document.createElement('video');
      vid.src = nextMedia.src;
      vid.autoplay = true;
      vid.loop = true;
      vid.muted = true;
      vid.setAttribute('playsinline', '');
      if (projectId === 'parametric-speaker') {
        vid.setAttribute('data-allow-sound', 'true');
        vid.title = 'Click to enable sound';
      }
      var item = document.createElement('div');
      item.className = 'gallery-item gallery-item-video';
      item.appendChild(vid);
      viewer.appendChild(item);
    } else if (nextMedia.type === 'image') {
      var img = document.createElement('img');
      img.src = nextMedia.src;
      img.alt = section.querySelector('.project-title').textContent;
      var item = document.createElement('div');
      item.className = 'gallery-item';
      item.appendChild(img);
      viewer.appendChild(item);
    }

    section.currentMediaIndex = nextIndex;

    // Update counter
    var counter = section.querySelector('.media-counter');
    if (counter) {
      counter.textContent = (nextIndex + 1) + ' / ' + mediaArray.length;
    }

    syncSoundEnabledVideos();
  });

  var soundVideoObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var vid = entry.target;
      if (!entry.isIntersecting || entry.intersectionRatio < 0.6) {
        vid.muted = true;
        vid.pause();
      } else {
        vid.play().catch(function () {});
      }
    });
  }, { threshold: [0, 0.6, 1] });

  function syncSoundEnabledVideos() {
    var vids = document.querySelectorAll('video[data-allow-sound="true"]');
    vids.forEach(function (vid) {
      if (vid.dataset.soundObserved === 'true') return;
      vid.dataset.soundObserved = 'true';
      soundVideoObserver.observe(vid);
    });
  }

  // Parametric speaker videos stay muted until the user clicks.
  document.addEventListener('click', function (e) {
    var vid = e.target.closest('video[data-allow-sound="true"]');
    if (!vid) return;
    vid.muted = false;
    vid.play().catch(function () {});
  });

  syncSoundEnabledVideos();

})();
