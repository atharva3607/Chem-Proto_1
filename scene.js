/* ==========================================================================
   Three.js 3D Scene Controller & Studio Environment Engine (v4.0 CAD Quality)
   50mm Lens Perspective, CAD Studio Grid Floor & Environment Map
   ========================================================================== */

class SceneController {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.envMap = null;
    this.gridHelper = null;
    this.bgGroup = null;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // 50mm Lens Equivalent Close-Up Camera Position (FOV = 38 deg)
    this.defaultCamPos = new THREE.Vector3(0, 2.5, 3.8);
    this.defaultTargetPos = new THREE.Vector3(0, 1.25, 0);

    this.hoveredObject = null;
    this.onObjectClickCallback = null;
    this.isCADMode = false;

    this.initScene();
    this.initEnvironmentMap();
    this.initLighting();
    this.initBackgroundDetails();
    this.initCADGrid();
    this.initControls();
    this.initEvents();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x05080d, 0.03);

    // 50mm Lens Perspective Camera (FOV 38 deg to eliminate wide-angle distortion)
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 50);
    this.camera.position.copy(this.defaultCamPos);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);
  }

  initEnvironmentMap() {
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileCubemapShader();

    const envScene = new THREE.Scene();
    const envGeo = new THREE.BoxGeometry(10, 10, 10);
    const envMat = new THREE.MeshBasicMaterial({
      color: 0x1e293b,
      side: THREE.BackSide
    });
    const envBox = new THREE.Mesh(envGeo, envMat);
    envScene.add(envBox);

    const panel1 = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    panel1.position.set(0, 4.9, 0);
    panel1.rotation.x = Math.PI / 2;
    envScene.add(panel1);

    const panel2 = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 5),
      new THREE.MeshBasicMaterial({ color: 0x00f2fe })
    );
    panel2.position.set(-4.9, 0, 0);
    panel2.rotation.y = Math.PI / 2;
    envScene.add(panel2);

    this.envMap = pmremGenerator.fromScene(envScene).texture;
    this.scene.environment = this.envMap;
    pmremGenerator.dispose();
  }

  initLighting() {
    const hemiLight = new THREE.HemisphereLight(0xe2e8f0, 0x05080d, 0.65);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(4, 7, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 18;
    keyLight.shadow.camera.left = -5;
    keyLight.shadow.camera.right = 5;
    keyLight.shadow.camera.top = 5;
    keyLight.shadow.camera.bottom = -5;
    keyLight.shadow.bias = -0.0003;
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.65);
    fillLight.position.set(-4, 3, -3);
    this.scene.add(fillLight);

    const rimLight = new THREE.SpotLight(0x00f2fe, 3.8);
    rimLight.position.set(-2.5, 5, -2);
    rimLight.angle = Math.PI / 4;
    rimLight.penumbra = 0.5;
    rimLight.target.position.set(0, 1.3, 0);
    this.scene.add(rimLight);
    this.scene.add(rimLight.target);
  }

  initBackgroundDetails() {
    this.bgGroup = new THREE.Group();

    const flaskMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.5,
      metalness: 0.3,
      transparent: true,
      opacity: 0.6
    });

    const flaskPositions = [-5.5, -3.5, 3.5, 5.5];
    flaskPositions.forEach(x => {
      const flaskGeo = new THREE.ConeGeometry(0.4, 0.8, 16);
      const flask = new THREE.Mesh(flaskGeo, flaskMat);
      flask.position.set(x, 3.9, -5.0);
      this.bgGroup.add(flask);

      const neckGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 12);
      const neck = new THREE.Mesh(neckGeo, flaskMat);
      neck.position.set(x, 4.4, -5.0);
      this.bgGroup.add(neck);
    });

    const bgLight = new THREE.PointLight(0x9d4edd, 1.2, 10);
    bgLight.position.set(0, 3.8, -4.8);
    this.bgGroup.add(bgLight);

    this.scene.add(this.bgGroup);
  }

  // CAD Studio Measurement Floor Grid Helper
  initCADGrid() {
    this.gridHelper = new THREE.GridHelper(14, 28, 0x00f2fe, 0x475569);
    this.gridHelper.position.y = 0.01;
    this.gridHelper.visible = false;
    this.scene.add(this.gridHelper);
  }

  // Toggle CAD Inspection Studio View vs Realistic Laboratory View
  setCADViewMode(isCAD) {
    this.isCADMode = isCAD;
    this.gridHelper.visible = isCAD;
    this.bgGroup.visible = !isCAD;

    const container = document.getElementById('canvas-container');
    if (isCAD) {
      this.scene.fog.color.setHex(0x1e293b);
      this.scene.fog.density = 0.015;
      if (container) container.classList.add('cad-mode');
    } else {
      this.scene.fog.color.setHex(0x05080d);
      this.scene.fog.density = 0.03;
      if (container) container.classList.remove('cad-mode');
    }
  }

  initControls() {
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
    this.controls.minDistance = 1.8;
    this.controls.maxDistance = 7.5;
    this.controls.target.copy(this.defaultTargetPos);
  }

  initEvents() {
    window.addEventListener('resize', () => this.onWindowResize());
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('click', (e) => this.onClick(e));
  }

  onWindowResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  onClick(event) {
    if (this.hoveredObject && this.onObjectClickCallback) {
      this.onObjectClickCallback(this.hoveredObject.userData);
    }
  }

  animateCameraTo(targetCamPos, targetLookAt, duration = 1.4) {
    if (window.gsap) {
      gsap.to(this.camera.position, {
        x: targetCamPos.x,
        y: targetCamPos.y,
        z: targetCamPos.z,
        duration: duration,
        ease: 'power2.inOut'
      });
      gsap.to(this.controls.target, {
        x: targetLookAt.x,
        y: targetLookAt.y,
        z: targetLookAt.z,
        duration: duration,
        ease: 'power2.inOut',
        onUpdate: () => this.controls.update()
      });
    } else {
      this.camera.position.copy(targetCamPos);
      this.controls.target.copy(targetLookAt);
      this.controls.update();
    }
  }

  resetCamera() {
    this.animateCameraTo(this.defaultCamPos, this.defaultTargetPos, 1.2);
  }

  updateRaycasting(interactiveObjects, tooltipEl) {
    if (!this.raycaster || !this.camera) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(interactiveObjects, true);

    if (intersects.length > 0) {
      let hitObj = intersects[0].object;
      while (hitObj && !hitObj.userData.name && hitObj.parent) {
        hitObj = hitObj.parent;
      }

      if (hitObj && hitObj.userData.name) {
        if (this.hoveredObject !== hitObj) {
          if (this.hoveredObject && this.hoveredObject.material && this.hoveredObject.material.emissive) {
            this.hoveredObject.material.emissive.setHex(0x000000);
          }
          this.hoveredObject = hitObj;
          document.body.style.cursor = 'pointer';

          if (hitObj.material && hitObj.material.emissive) {
            hitObj.material.emissive.setHex(0x00f2fe);
            hitObj.material.emissiveIntensity = 0.35;
          }
        }

        if (tooltipEl) {
          tooltipEl.textContent = hitObj.userData.name + (hitObj.userData.formula ? ` (${hitObj.userData.formula})` : '');
          tooltipEl.style.left = (this.mouse.x * 0.5 + 0.5) * window.innerWidth + 15 + 'px';
          tooltipEl.style.top = (-this.mouse.y * 0.5 + 0.5) * window.innerHeight + 15 + 'px';
          tooltipEl.classList.add('visible');
        }
        return;
      }
    }

    if (this.hoveredObject) {
      if (this.hoveredObject.material && this.hoveredObject.material.emissive) {
        this.hoveredObject.material.emissive.setHex(0x000000);
      }
      this.hoveredObject = null;
      document.body.style.cursor = 'default';
    }
    if (tooltipEl) tooltipEl.classList.remove('visible');
  }

  render() {
    if (this.controls) this.controls.update();
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

window.SceneController = SceneController;
