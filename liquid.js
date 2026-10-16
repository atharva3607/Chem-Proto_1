/* ==========================================================================
   Dynamic Deformable Slime Mesh, Meniscus Curve & Trapped Micro-Bubbles (v4.0)
   Includes slime-glass contact meniscus, internal micro-bubble spheres & wireframe
   ========================================================================== */

class LiquidManager {
  constructor(scene, beakerGroup) {
    this.scene = scene;
    this.beakerGroup = beakerGroup;

    this.liquidMesh = null;
    this.liquidLevel = 0.01;
    this.targetLevel = 0.01;
    this.liquidRadius = 1.14;

    this.streamParticles = null;
    this.powderParticles = null;
    this.scentParticles = null;

    // Trapped Micro-Bubbles Group
    this.microBubblesGroup = null;
    this.microBubbleMeshes = [];

    // Liquid & Colour Blend State
    this.liquidColor = new THREE.Color(0xffffff);
    this.targetColor = new THREE.Color(0xffffff);
    this.liquidMaterial = null;

    // Soft-Body Deform State
    this.time = 0;
    this.isCrossLinked = false;
    this.isStirring = false;
    this.rodPos = new THREE.Vector2(0, 0);
    this.currentDeformations = null;

    this.stretchMesh = null;

    this.initLiquidMesh();
    this.initTrappedMicroBubbles();
    this.initParticleEmitters();
  }

  initLiquidMesh() {
    // High-Density Cylinder Geometry (64 radial x 32 height segments)
    const liquidGeo = new THREE.CylinderGeometry(this.liquidRadius, this.liquidRadius, 1, 64, 32);
    liquidGeo.translate(0, 0.5, 0);

    const pos = liquidGeo.attributes.position;
    // Form Liquid-Glass Contact Meniscus Curve at top outer rim
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      if (y > 0.4) {
        const dist = Math.sqrt(x * x + z * z);
        if (dist > 1.0) {
          // Curved meniscus wall contact lift
          const meniscusLift = Math.pow((dist - 1.0) / 0.14, 2) * 0.06;
          pos.setY(i, y + meniscusLift);
        }
      }
    }

    this.originalPositions = new Float32Array(liquidGeo.attributes.position.array.length);
    this.originalPositions.set(liquidGeo.attributes.position.array);

    this.currentDeformations = new Float32Array(liquidGeo.attributes.position.count);

    // PBR Slime Material
    this.liquidMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.12,
      metalness: 0.0,
      transmission: 0.35,
      transparent: true,
      opacity: 0.95,
      ior: 1.42,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05
    });

    this.liquidMesh = new THREE.Mesh(liquidGeo, this.liquidMaterial);
    this.liquidMesh.position.set(0, 0.16, 0);
    this.liquidMesh.scale.set(1, 0.01, 1);
    this.liquidMesh.renderOrder = 1;
    this.beakerGroup.add(this.liquidMesh);
  }

  // Trapped Air Micro-Bubbles embedded inside Slime Volume
  initTrappedMicroBubbles() {
    this.microBubblesGroup = new THREE.Group();
    const bubbleGeo = new THREE.SphereGeometry(1, 12, 12);
    const bubbleMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.95,
      roughness: 0.05,
      transparent: true,
      opacity: 0.6
    });

    const numBubbles = 18;
    for (let i = 0; i < numBubbles; i++) {
      const scale = 0.015 + Math.random() * 0.02;
      const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
      
      const r = (Math.random() * 0.8) + 0.1;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = 0.2 + Math.random() * 0.6;

      bubble.position.set(x, y, z);
      bubble.scale.set(scale, scale, scale);
      bubble.userData = { initialY: y, speed: 0.2 + Math.random() * 0.5 };
      this.microBubblesGroup.add(bubble);
      this.microBubbleMeshes.push(bubble);
    }

    this.microBubblesGroup.visible = false; // Visible when liquid accumulates
    this.beakerGroup.add(this.microBubblesGroup);
  }

  initParticleEmitters() {
    const streamCount = 250;
    const streamGeo = new THREE.BufferGeometry();
    const streamPos = new Float32Array(streamCount * 3);
    for (let i = 0; i < streamCount * 3; i += 3) {
      streamPos[i + 1] = -100;
    }
    streamGeo.setAttribute('position', new THREE.BufferAttribute(streamPos, 3));
    const streamMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.07,
      transparent: true,
      opacity: 0.85
    });
    this.streamParticles = new THREE.Points(streamGeo, streamMat);
    this.scene.add(this.streamParticles);

    const powderCount = 300;
    const powderGeo = new THREE.BufferGeometry();
    const powderPos = new Float32Array(powderCount * 3);
    for (let i = 0; i < powderCount * 3; i += 3) {
      powderPos[i + 1] = -100;
    }
    powderGeo.setAttribute('position', new THREE.BufferAttribute(powderPos, 3));
    const powderMat = new THREE.PointsMaterial({
      color: 0xf8fafc,
      size: 0.05,
      transparent: true,
      opacity: 0.9
    });
    this.powderParticles = new THREE.Points(powderGeo, powderMat);
    this.scene.add(this.powderParticles);

    const scentCount = 90;
    const scentGeo = new THREE.BufferGeometry();
    const scentPos = new Float32Array(scentCount * 3);
    for (let i = 0; i < scentCount * 3; i += 3) {
      scentPos[i + 1] = -100;
    }
    scentGeo.setAttribute('position', new THREE.BufferAttribute(scentPos, 3));
    const scentMat = new THREE.PointsMaterial({
      color: 0xc77dff,
      size: 0.09,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    this.scentParticles = new THREE.Points(scentGeo, scentMat);
    this.scene.add(this.scentParticles);
  }

  triggerPourStream(originPos, targetY = 0.5, colorHex = 0xffffff, duration = 2.2) {
    this.streamParticles.material.color.setHex(colorHex);
    const positions = this.streamParticles.geometry.attributes.position.array;

    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = originPos.x + (Math.random() - 0.5) * 0.12;
      positions[i + 1] = originPos.y - Math.random() * (originPos.y - targetY);
      positions[i + 2] = originPos.z + (Math.random() - 0.5) * 0.12;
    }
    this.streamParticles.geometry.attributes.position.needsUpdate = true;

    setTimeout(() => {
      for (let i = 0; i < positions.length; i += 3) positions[i + 1] = -100;
      this.streamParticles.geometry.attributes.position.needsUpdate = true;
    }, duration * 1000);
  }

  triggerPowderStream(originPos, targetY = 0.8, duration = 1.8) {
    const positions = this.powderParticles.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = originPos.x + (Math.random() - 0.5) * 0.22;
      positions[i + 1] = originPos.y - Math.random() * (originPos.y - targetY);
      positions[i + 2] = originPos.z + (Math.random() - 0.5) * 0.22;
    }
    this.powderParticles.geometry.attributes.position.needsUpdate = true;

    setTimeout(() => {
      for (let i = 0; i < positions.length; i += 3) positions[i + 1] = -100;
      this.powderParticles.geometry.attributes.position.needsUpdate = true;
    }, duration * 1000);
  }

  triggerScentEffect(duration = 2.5) {
    const positions = this.scentParticles.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = (Math.random() - 0.5) * 1.6;
      positions[i + 1] = 1.2 + Math.random() * 1.5;
      positions[i + 2] = (Math.random() - 0.5) * 1.6;
    }
    this.scentParticles.geometry.attributes.position.needsUpdate = true;

    setTimeout(() => {
      for (let i = 0; i < positions.length; i += 3) positions[i + 1] = -100;
      this.scentParticles.geometry.attributes.position.needsUpdate = true;
    }, duration * 1000);
  }

  setFluidState(targetHeight, targetColorHex = null, isCrossLinked = false) {
    this.targetLevel = targetHeight;
    if (targetColorHex !== null) {
      this.targetColor.setHex(targetColorHex);
    }
    if (isCrossLinked) {
      this.isCrossLinked = true;
      this.liquidMaterial.transmission = 0.45;
      this.liquidMaterial.roughness = 0.08;
      this.liquidMaterial.clearcoat = 1.0;
      this.liquidMaterial.ior = 1.46;
    }
  }

  updateStirringRodPos(rodX, rodZ, isStirring = true) {
    this.rodPos.set(rodX, rodZ);
    this.isStirring = isStirring;
  }

  createStretchSlime(rodMesh) {
    if (this.stretchMesh) {
      this.beakerGroup.remove(this.stretchMesh);
    }

    const stretchGeo = new THREE.CylinderGeometry(0.06, 0.85, 1.8, 32, 24);
    const stretchMat = this.liquidMaterial.clone();
    stretchMat.transparent = true;
    stretchMat.opacity = 0.88;

    this.stretchMesh = new THREE.Mesh(stretchGeo, stretchMat);
    this.stretchMesh.position.set(0, 1.2, 0);
    this.stretchMesh.visible = false;
    this.beakerGroup.add(this.stretchMesh);

    return this.stretchMesh;
  }

  toggleWireframe(isWireframe) {
    if (this.liquidMaterial) this.liquidMaterial.wireframe = isWireframe;
  }

  update(delta) {
    this.time += delta * (this.isCrossLinked ? 1.2 : 2.2);

    if (this.liquidMesh) {
      this.liquidLevel += (this.targetLevel - this.liquidLevel) * 0.05;
      this.liquidMesh.scale.y = Math.max(0.01, this.liquidLevel);

      this.liquidColor.lerp(this.targetColor, 0.05);
      this.liquidMaterial.color.copy(this.liquidColor);

      // Show micro-bubbles when liquid height > 0.1
      if (this.microBubblesGroup) {
        this.microBubblesGroup.visible = (this.liquidLevel > 0.1);
        // Scale micro-bubbles group height to match liquid height
        this.microBubblesGroup.scale.y = Math.max(0.01, this.liquidLevel);
      }

      // Vertex Soft-Body Deformation Loop
      const geo = this.liquidMesh.geometry;
      const pos = geo.attributes.position;
      const orig = this.originalPositions;
      const def = this.currentDeformations;

      for (let i = 0; i < pos.count; i++) {
        const origX = orig[i * 3];
        const origY = orig[i * 3 + 1];
        const origZ = orig[i * 3 + 2];

        if (origY > 0.4) {
          const waveAmp = this.isCrossLinked ? 0.02 : 0.04;
          const idleWave = Math.sin(origX * 4 + this.time) * Math.cos(origZ * 4 + this.time) * waveAmp;

          let targetDeform = 0;
          if (this.isStirring) {
            const dx = origX - this.rodPos.x;
            const dz = origZ - this.rodPos.y;
            const dist = Math.sqrt(dx * dx + dz * dz);
            targetDeform = -Math.exp(-dist * 3.5) * 0.09 + (dist * 0.035);
          }

          const currentDef = def[i] || 0;
          const lerpRate = this.isCrossLinked ? 0.06 : 0.12;
          const nextDef = currentDef + (targetDeform - currentDef) * lerpRate;
          def[i] = nextDef;

          pos.setY(i, origY + idleWave + nextDef);
        }
      }
      pos.needsUpdate = true;
    }

    if (this.scentParticles) {
      const positions = this.scentParticles.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        if (positions[i] > 0) {
          positions[i] += 0.015;
          if (positions[i] > 3.5) positions[i] = 1.2;
        }
      }
      this.scentParticles.geometry.attributes.position.needsUpdate = true;
    }
  }
}

window.LiquidManager = LiquidManager;
