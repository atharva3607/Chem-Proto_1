/* ==========================================================================
   Master Application Orchestrator & State Controller (v4.0 CAD Quality)
   Connects CAD View, Realistic View, Wireframe, Exploded View & Experiment HUD
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Preloader Screen Progress Simulation
  const preloader = document.getElementById('preloader');
  const preloaderFill = document.getElementById('preloader-progress-fill');
  const preloaderStatus = document.getElementById('preloader-status-text');

  let loadProgress = 0;
  const loadInterval = setInterval(() => {
    loadProgress += Math.floor(Math.random() * 15) + 12;
    if (loadProgress >= 100) {
      loadProgress = 100;
      clearInterval(loadInterval);
      preloaderStatus.textContent = 'Laboratory Simulation Ready!';
      setTimeout(() => {
        preloader.classList.add('hidden');
      }, 400);
    }
    preloaderFill.style.width = `${loadProgress}%`;
  }, 90);

  // Initialize Core Engines
  const sceneCtrl = new SceneController('canvas-container');
  const labObjects = new LabObjectsManager(sceneCtrl.scene);
  const liquidMgr = new LiquidManager(sceneCtrl.scene, labObjects.beakerGroup);
  const animPipeline = new AnimationPipeline(sceneCtrl, labObjects, liquidMgr);
  const chemVisualizer = new PolymerChemistryVisualizer('crosslink-canvas');

  // DOM Elements
  const introScreen = document.getElementById('intro-screen');
  const btnStartExp = document.getElementById('btn-start-exp');

  const btnPrevStep = document.getElementById('btn-prev-step');
  const btnNextStep = document.getElementById('btn-next-step');
  const stepBadge = document.getElementById('step-badge');
  const stepTitle = document.getElementById('step-title');
  const stepDesc = document.getElementById('step-desc');
  const stepNote = document.getElementById('step-note');
  const miniChemWidget = document.getElementById('mini-chem-widget');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const progressText = document.getElementById('progress-indicator-text');

  const stirHud = document.getElementById('stir-hud');
  const btnStir = document.getElementById('btn-stir');
  const stirProgressFill = document.getElementById('stir-progress-fill');
  const stirPercentText = document.getElementById('stir-percent-text');

  const finalHud = document.getElementById('final-hud');
  const btnTestSlime = document.getElementById('btn-test-slime');
  const btnViewSummary = document.getElementById('btn-view-summary');

  const tooltipEl = document.getElementById('reagent-tooltip');

  const btnResetExp = document.getElementById('btn-reset-exp');
  const btnResetCam = document.getElementById('btn-reset-cam');
  const btnSoundToggle = document.getElementById('btn-sound-toggle');
  const soundIcon = document.getElementById('sound-icon');
  const btnFullscreen = document.getElementById('btn-fullscreen');

  // Mode Switcher Buttons
  const btnModeReal = document.getElementById('btn-mode-real');
  const btnModeCAD = document.getElementById('btn-mode-cad');
  const btnModeWireframe = document.getElementById('btn-mode-wireframe');
  const btnModeExploded = document.getElementById('btn-mode-exploded');

  let isWireframeActive = false;
  let isExplodedActive = false;

  // CAD & Inspection View Modes Handlers
  btnModeReal.addEventListener('click', () => {
    if (window.soundEngine) window.soundEngine.playClick();
    sceneCtrl.setCADViewMode(false);
    btnModeReal.classList.add('active');
    btnModeCAD.classList.remove('active');
  });

  btnModeCAD.addEventListener('click', () => {
    if (window.soundEngine) window.soundEngine.playClick();
    sceneCtrl.setCADViewMode(true);
    btnModeCAD.classList.add('active');
    btnModeReal.classList.remove('active');
  });

  btnModeWireframe.addEventListener('click', () => {
    if (window.soundEngine) window.soundEngine.playClick();
    isWireframeActive = !isWireframeActive;
    animPipeline.toggleWireframe(isWireframeActive);
    if (isWireframeActive) btnModeWireframe.classList.add('active');
    else btnModeWireframe.classList.remove('active');
  });

  btnModeExploded.addEventListener('click', () => {
    if (window.soundEngine) window.soundEngine.playClick();
    isExplodedActive = !isExplodedActive;
    labObjects.toggleExplodedView(isExplodedActive);
    if (isExplodedActive) btnModeExploded.classList.add('active');
    else btnModeExploded.classList.remove('active');
  });

  // Start Experiment
  btnStartExp.addEventListener('click', () => {
    if (window.soundEngine) window.soundEngine.playClick();
    introScreen.classList.add('hidden');
    
    sceneCtrl.animateCameraTo(
      new THREE.Vector3(0, 2.5, 3.8),
      new THREE.Vector3(0, 1.25, 0),
      1.5
    );
  });

  // Step UI State Manager
  function updateStepUI(stepNum) {
    const config = animPipeline.stepConfigs[stepNum];
    if (!config) return;

    stepBadge.textContent = config.badge || `Step ${stepNum} of 7`;
    stepTitle.textContent = config.title;
    stepDesc.textContent = config.desc;
    stepNote.innerHTML = `<i class="fa-solid fa-lightbulb"></i> ${config.note}`;

    const pct = Math.round((stepNum / 7) * 100);
    progressBarFill.style.width = `${pct}%`;
    progressText.textContent = `Experiment Progress: Step ${stepNum} / 7`;

    btnPrevStep.disabled = (stepNum <= 1 || animPipeline.isAnimating);
    btnNextStep.disabled = (stepNum >= 7 || animPipeline.isAnimating);

    if (stepNum === 6) {
      miniChemWidget.classList.add('active');
    } else {
      miniChemWidget.classList.remove('active');
    }

    if (stepNum === 7) {
      stirHud.classList.add('active');
      btnNextStep.style.display = 'none';
    } else {
      stirHud.classList.remove('active');
      btnNextStep.style.display = 'inline-flex';
    }

    animPipeline.runStepAnimation(stepNum, () => {
      btnPrevStep.disabled = (stepNum <= 1);
      btnNextStep.disabled = (stepNum >= 7);
    });
  }

  btnNextStep.addEventListener('click', () => {
    if (animPipeline.isAnimating || animPipeline.currentStep >= 7) return;
    if (window.soundEngine) window.soundEngine.playClick();
    updateStepUI(animPipeline.currentStep + 1);
  });

  btnPrevStep.addEventListener('click', () => {
    if (animPipeline.isAnimating || animPipeline.currentStep <= 1) return;
    if (window.soundEngine) window.soundEngine.playClick();
    updateStepUI(animPipeline.currentStep - 1);
  });

  // Stirring Action
  btnStir.addEventListener('click', () => {
    animPipeline.doStirIncrement(() => {
      stirHud.classList.remove('active');
      finalHud.classList.add('active');
    });

    const pct = animPipeline.stirProgress;
    stirProgressFill.style.width = `${pct}%`;
    stirPercentText.textContent = `Mixing Progress: ${pct}%`;
  });

  btnTestSlime.addEventListener('click', () => {
    btnTestSlime.disabled = true;
    animPipeline.testSlimeStretch(() => {
      btnTestSlime.disabled = false;
    });
  });

  btnViewSummary.addEventListener('click', () => {
    openModal('summary-modal');
  });

  // Controls & Modals
  btnResetExp.addEventListener('click', () => {
    if (window.soundEngine) window.soundEngine.playClick();
    animPipeline.reset();
    finalHud.classList.remove('active');
    stirHud.classList.remove('active');
    updateStepUI(1);
    sceneCtrl.resetCamera();
  });

  btnResetCam.addEventListener('click', () => {
    if (window.soundEngine) window.soundEngine.playClick();
    sceneCtrl.resetCamera();
  });

  btnSoundToggle.addEventListener('click', () => {
    const isMuted = window.soundEngine.toggleMute();
    soundIcon.className = isMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
  });

  btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  function openModal(modalId) {
    if (window.soundEngine) window.soundEngine.playClick();
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      if (modalId === 'chemistry-modal') chemVisualizer.start();
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      if (modalId === 'chemistry-modal') chemVisualizer.stop();
    }
  }

  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-modal');
      closeModal(modalId);
    });
  });

  document.getElementById('nav-exp').addEventListener('click', () => sceneCtrl.resetCamera());
  document.getElementById('nav-materials').addEventListener('click', () => openModal('materials-modal'));
  document.getElementById('nav-chemistry').addEventListener('click', () => openModal('chemistry-modal'));
  document.getElementById('nav-about').addEventListener('click', () => openModal('about-modal'));

  document.getElementById('btn-chem-before').addEventListener('click', () => chemVisualizer.setState('before'));
  document.getElementById('btn-chem-after').addEventListener('click', () => chemVisualizer.setState('after'));

  document.querySelectorAll('.material-card').forEach(card => {
    card.addEventListener('click', () => {
      const reagentKey = card.getAttribute('data-reagent');
      const reagent = labObjects.reagentMap[reagentKey];
      if (reagent) {
        closeModal('materials-modal');
        const pos = reagent.group.position;
        sceneCtrl.animateCameraTo(
          new THREE.Vector3(pos.x, pos.y + 1.2, pos.z + 2.5),
          new THREE.Vector3(pos.x, pos.y + 0.6, pos.z),
          1.5
        );
      }
    });
  });

  sceneCtrl.onObjectClickCallback = (userData) => {
    if (userData.isBeaker) {
      sceneCtrl.animateCameraTo(
        new THREE.Vector3(0, 2.2, 3.0),
        new THREE.Vector3(0, 1.1, 0),
        1.2
      );
    } else if (userData.key) {
      const pos = userData.container.position;
      sceneCtrl.animateCameraTo(
        new THREE.Vector3(pos.x, pos.y + 1.2, pos.z + 2.5),
        new THREE.Vector3(pos.x, pos.y + 0.6, pos.z),
        1.5
      );
    }
  };

  updateStepUI(1);

  // 60 FPS Animation Loop
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    liquidMgr.update(delta);
    sceneCtrl.updateRaycasting(labObjects.interactiveObjects, tooltipEl);
    sceneCtrl.render();
  }

  animate();
});
