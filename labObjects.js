/* ==========================================================================
   Procedural 3D Laboratory Equipment & Reagents Generator (v4.0 CAD Quality)
   Revolved THREE.LatheGeometry Glass Beaker, Wireframe & Exploded View Modes
   ========================================================================== */

class LabObjectsManager {
  constructor(scene) {
    this.scene = scene;
    this.interactiveObjects = [];
    this.reagentMap = {};
    
    // Core Mesh References
    this.table = null;
    this.beakerGroup = null;
    this.beakerGlass = null;
    this.glassMaterial = null;
    this.stirringRod = null;
    this.rodMaterial = null;

    this.isExploded = false;
    this.isWireframe = false;

    this.createLabEnvironment();
    this.createLathePBRGlassBeaker();
    this.createReagentContainers();
    this.createLabTools();
  }

  createContactShadow(width, length, opacity = 0.4) {
    const shadowGeo = new THREE.PlaneGeometry(width, length);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: opacity,
      depthWrite: false
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.005;
    return shadow;
  }

  createBeakerMarkingsTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 512, 512);

    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.font = 'bold 26px Inter, monospace';

    const volumes = ['250 mL', '200 mL', '150 mL', '100 mL', '50 mL'];
    const startY = 120;
    const stepY = 70;

    volumes.forEach((vol, idx) => {
      const y = startY + idx * stepY;
      
      ctx.beginPath();
      ctx.moveTo(180, y);
      ctx.lineTo(240, y);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillText(vol, 255, y + 8);

      if (idx < volumes.length - 1) {
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(200, y + stepY / 2);
        ctx.lineTo(235, y + stepY / 2);
        ctx.stroke();
        ctx.lineWidth = 4;
      }
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  createLabelTexture(text, subtext = '', bgColor = '#ffffff', textColor = '#000000') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 256, 128);

    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 250, 122);

    ctx.fillStyle = textColor;
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, subtext ? 48 : 64);

    if (subtext) {
      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.fillText(subtext, 128, 88);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  createLabEnvironment() {
    const labGroup = new THREE.Group();

    const tableGeo = new THREE.BoxGeometry(18, 0.4, 10);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x0a0f1d,
      roughness: 0.12,
      metalness: 0.25,
    });
    this.table = new THREE.Mesh(tableGeo, tableMat);
    this.table.position.set(0, -0.2, 0);
    this.table.receiveShadow = true;
    labGroup.add(this.table);

    const trimGeo = new THREE.BoxGeometry(18.05, 0.08, 10.05);
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x00f2fe,
      roughness: 0.2,
      metalness: 0.9,
      emissive: 0x00f2fe,
      emissiveIntensity: 0.25
    });
    const trim = new THREE.Mesh(trimGeo, trimMat);
    trim.position.set(0, -0.05, 0);
    labGroup.add(trim);

    const legGeo = new THREE.CylinderGeometry(0.2, 0.2, 6, 16);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    [[-8.5, -3.2, -4.5], [8.5, -3.2, -4.5], [-8.5, -3.2, 4.5], [8.5, -3.2, 4.5]].forEach(pos => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(...pos);
      labGroup.add(leg);
    });

    const wallGeo = new THREE.PlaneGeometry(30, 15);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x05080d, roughness: 0.9 });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(0, 4.5, -6);
    labGroup.add(wall);

    const shelfGeo = new THREE.BoxGeometry(16, 0.2, 1.5);
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.5 });
    const shelf = new THREE.Mesh(shelfGeo, shelfMat);
    shelf.position.set(0, 3.5, -5.2);
    shelf.receiveShadow = true;
    labGroup.add(shelf);

    this.scene.add(labGroup);
  }

  // CAD Revolved Lathe Beaker (THREE.LatheGeometry with Hollow Interior & Wall Thickness)
  createLathePBRGlassBeaker() {
    this.beakerGroup = new THREE.Group();
    this.beakerGroup.position.set(0, 0, 0);

    const shadow = this.createContactShadow(2.6, 2.6, 0.55);
    this.beakerGroup.add(shadow);

    // Profile Control Points for Revolved Lathe Geometry
    const points = [];
    // Base disk center
    points.push(new THREE.Vector2(0.0, 0.0));
    points.push(new THREE.Vector2(1.22, 0.0));
    // Outer bottom rounded transition corner
    points.push(new THREE.Vector2(1.25, 0.15));
    // Outer glass wall
    points.push(new THREE.Vector2(1.25, 2.58));
    // Top rounded rim curve
    points.push(new THREE.Vector2(1.22, 2.62));
    points.push(new THREE.Vector2(1.15, 2.58));
    // Inner glass wall (2mm wall thickness)
    points.push(new THREE.Vector2(1.15, 0.18));
    // Inner bottom base corner (3.5mm thick base)
    points.push(new THREE.Vector2(1.12, 0.15));
    points.push(new THREE.Vector2(0.0, 0.15));

    const beakerLatheGeo = new THREE.LatheGeometry(points, 64);

    this.glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.28,
      roughness: 0.02,
      metalness: 0.0,
      transmission: 0.98,
      ior: 1.52,
      thickness: 0.35,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.beakerGlass = new THREE.Mesh(beakerLatheGeo, this.glassMaterial);
    this.beakerGlass.castShadow = true;
    this.beakerGlass.receiveShadow = true;
    this.beakerGlass.renderOrder = 2;
    this.beakerGroup.add(this.beakerGlass);

    // Spout Lip Extension Cutout Mesh
    const spoutGeo = new THREE.CylinderGeometry(0.18, 0.08, 0.3, 16, 1, false, -Math.PI / 3, (2 * Math.PI) / 3);
    const spoutMesh = new THREE.Mesh(spoutGeo, this.glassMaterial);
    spoutMesh.position.set(0, 2.58, 1.22);
    spoutMesh.rotation.x = Math.PI / 6;
    spoutMesh.renderOrder = 2;
    this.beakerGroup.add(spoutMesh);

    // Volumetric Printed Measurement Markings (50 mL - 250 mL)
    const markingsGeo = new THREE.CylinderGeometry(1.252, 1.252, 2.5, 64, 1, true);
    const markingsTex = this.createBeakerMarkingsTexture();
    const markingsMat = new THREE.MeshBasicMaterial({
      map: markingsTex,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide
    });
    const markingsMesh = new THREE.Mesh(markingsGeo, markingsMat);
    markingsMesh.position.y = 1.3;
    markingsMesh.rotation.y = -Math.PI / 3;
    markingsMesh.renderOrder = 3;
    this.beakerGroup.add(markingsMesh);

    this.beakerGlass.userData = {
      name: 'Borosilicate Glass Beaker',
      role: 'Main Reaction Vessel (250mL capacity)',
      isBeaker: true
    };
    this.interactiveObjects.push(this.beakerGlass);

    this.scene.add(this.beakerGroup);
  }

  createReagentContainers() {
    const createBottle = (key, name, formula, role, bodyColor, labelBg, pos) => {
      const container = new THREE.Group();
      container.position.set(...pos);

      const shadow = this.createContactShadow(1.2, 1.2, 0.45);
      container.add(shadow);

      const bodyGeo = new THREE.CylinderGeometry(0.5, 0.55, 1.4, 32);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: bodyColor,
        roughness: 0.25,
        metalness: 0.1
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.7;
      body.castShadow = true;
      body.receiveShadow = true;
      container.add(body);

      const neckGeo = new THREE.CylinderGeometry(0.22, 0.25, 0.35, 24);
      const neck = new THREE.Mesh(neckGeo, bodyMat);
      neck.position.y = 1.55;
      container.add(neck);

      const capGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.25, 24);
      const capMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = 1.8;
      container.add(cap);

      const labelGeo = new THREE.CylinderGeometry(0.52, 0.57, 0.8, 32, 1, true);
      const labelTexture = this.createLabelTexture(name, formula, labelBg, '#000000');
      const labelMat = new THREE.MeshBasicMaterial({ map: labelTexture, side: THREE.DoubleSide });
      const label = new THREE.Mesh(labelGeo, labelMat);
      label.position.y = 0.7;
      label.rotation.y = Math.PI / 2;
      container.add(label);

      body.userData = { key, name, formula, role, container, initialPos: pos.slice() };
      this.interactiveObjects.push(body);
      this.reagentMap[key] = { group: container, body, initialPos: pos.slice() };

      this.scene.add(container);
    };

    const createJar = (key, name, formula, role, bodyColor, labelBg, pos) => {
      const container = new THREE.Group();
      container.position.set(...pos);

      const shadow = this.createContactShadow(1.3, 1.3, 0.45);
      container.add(shadow);

      const bodyGeo = new THREE.BoxGeometry(0.9, 1.2, 0.9);
      const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.35 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.6;
      body.castShadow = true;
      container.add(body);

      const lidGeo = new THREE.BoxGeometry(0.95, 0.2, 0.95);
      const lidMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
      const lid = new THREE.Mesh(lidGeo, lidMat);
      lid.position.y = 1.25;
      container.add(lid);

      const labelGeo = new THREE.PlaneGeometry(0.85, 0.7);
      const labelTexture = this.createLabelTexture(name, formula, labelBg, '#000000');
      const labelMat = new THREE.MeshBasicMaterial({ map: labelTexture });
      const label = new THREE.Mesh(labelGeo, labelMat);
      label.position.set(0, 0.6, 0.46);
      container.add(label);

      body.userData = { key, name, formula, role, container, initialPos: pos.slice() };
      this.interactiveObjects.push(body);
      this.reagentMap[key] = { group: container, body, initialPos: pos.slice() };

      this.scene.add(container);
    };

    const createPerfume = (key, name, formula, role, pos) => {
      const container = new THREE.Group();
      container.position.set(...pos);

      const shadow = this.createContactShadow(0.9, 0.9, 0.45);
      container.add(shadow);

      const bodyGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.1, 24);
      const bodyMat = new THREE.MeshPhysicalMaterial({
        color: 0x9d4edd,
        transmission: 0.85,
        roughness: 0.1,
        transparent: true,
        opacity: 0.75
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.55;
      body.castShadow = true;
      container.add(body);

      const nozzleGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.3, 16);
      const nozzleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
      const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
      nozzle.position.y = 1.25;
      container.add(nozzle);

      const labelGeo = new THREE.PlaneGeometry(0.6, 0.5);
      const labelTexture = this.createLabelTexture(name, formula, '#f3e8ff', '#581c87');
      const labelMat = new THREE.MeshBasicMaterial({ map: labelTexture });
      const label = new THREE.Mesh(labelGeo, labelMat);
      label.position.set(0, 0.55, 0.36);
      container.add(label);

      body.userData = { key, name, formula, role, container, initialPos: pos.slice() };
      this.interactiveObjects.push(body);
      this.reagentMap[key] = { group: container, body, initialPos: pos.slice() };

      this.scene.add(container);
    };

    createBottle('fevicol', 'FEVICOL', 'PVA Glue', 'Polymer Base Material', 0xf8fafc, '#0284c7', [-3.2, 0, -1.0]);
    createBottle('borax', 'BORAX', 'Na2B4O7', 'Cross-Linking Agent', 0xe0f2fe, '#00f2fe', [3.2, 0, -1.0]);
    createJar('caco3', 'CaCO3', 'Calcium Carb', 'Texture & Filler', 0xf1f5f9, '#e2e8f0', [2.2, 0, 1.5]);
    createJar('bakingSoda', 'BAKING SODA', 'NaHCO3', 'Consistency Modifier', 0xcff4fc, '#38bdf8', [-2.2, 0, 1.5]);
    createPerfume('perfume', 'PERFUME', 'Fragrance', 'Aroma Enhancer', [-3.6, 0, 0.6]);
    createBottle('colour', 'COLOUR', 'Food Dye', 'Visual Pigment', 0xfae8ff, '#d946ef', [3.6, 0, 0.6]);
  }

  createLabTools() {
    const rodGroup = new THREE.Group();
    const rodGeo = new THREE.CylinderGeometry(0.045, 0.045, 3.2, 24);
    
    this.rodMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.95,
      roughness: 0.04,
      transparent: true,
      opacity: 0.7,
      ior: 1.5
    });

    this.stirringRod = new THREE.Mesh(rodGeo, this.rodMaterial);
    this.stirringRod.position.set(0.5, 1.8, 0);
    this.stirringRod.rotation.z = -Math.PI / 14;
    this.stirringRod.renderOrder = 1;
    rodGroup.add(this.stirringRod);

    this.scene.add(rodGroup);

    const spoonGroup = new THREE.Group();
    spoonGroup.position.set(-1.1, 0.05, 2.0);

    const shadow = this.createContactShadow(1.5, 0.6, 0.35);
    spoonGroup.add(shadow);

    const handleGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.4, 16);
    const metalMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.92, roughness: 0.15 });
    const handle = new THREE.Mesh(handleGeo, metalMat);
    handle.rotation.z = Math.PI / 2;
    spoonGroup.add(handle);

    const bowlGeo = new THREE.SphereGeometry(0.2, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const bowl = new THREE.Mesh(bowlGeo, metalMat);
    bowl.position.x = 0.7;
    bowl.rotation.x = Math.PI;
    spoonGroup.add(bowl);

    this.scene.add(spoonGroup);
  }

  // Toggle Polygon Wireframe Mode for Beaker & Stirrer Topology Demonstration
  toggleWireframe(isWireframe) {
    this.isWireframe = isWireframe;
    if (this.glassMaterial) this.glassMaterial.wireframe = isWireframe;
    if (this.rodMaterial) this.rodMaterial.wireframe = isWireframe;
  }

  // Toggle CAD Exploded View (Separates components vertically with leader lines)
  toggleExplodedView(isExploded) {
    this.isExploded = isExploded;

    if (window.gsap) {
      if (isExploded) {
        gsap.to(this.stirringRod.position, { y: 3.2, duration: 1.2, ease: 'power2.inOut' });
        gsap.to(this.beakerGroup.position, { y: 1.0, duration: 1.2, ease: 'power2.inOut' });
      } else {
        gsap.to(this.stirringRod.position, { y: 1.8, duration: 1.0, ease: 'power2.inOut' });
        gsap.to(this.beakerGroup.position, { y: 0.0, duration: 1.0, ease: 'power2.inOut' });
      }
    } else {
      this.stirringRod.position.y = isExploded ? 3.2 : 1.8;
      this.beakerGroup.position.y = isExploded ? 1.0 : 0.0;
    }

    const explodedLabels = document.getElementById('exploded-labels');
    if (explodedLabels) {
      if (isExploded) explodedLabels.classList.add('active');
      else explodedLabels.classList.remove('active');
    }
  }
}

window.LabObjectsManager = LabObjectsManager;
