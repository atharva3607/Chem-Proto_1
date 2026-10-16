/* ==========================================================================
   Experiment Step Animation Pipeline Engine (v4.0 CAD Quality)
   Orbital Stirring Sequence, Catenoid Slime Stretch & Exploded View Lerps
   ========================================================================== */

class AnimationPipeline {
  constructor(sceneController, labObjectsManager, liquidManager) {
    this.sceneCtrl = sceneController;
    this.labObjects = labObjectsManager;
    this.liquid = liquidManager;

    this.currentStep = 1;
    this.isAnimating = false;
    this.stirProgress = 0;
    this.stirringAngle = 0;

    this.stepConfigs = {
      1: {
        title: 'Step 1: Add Fevicol / PVA Glue',
        badge: 'Step 1 of 7',
        reagentKey: 'fevicol',
        desc: 'Fevicol bottle glides over the beaker and tilts, pouring thick white PVA glue into the glass vessel.',
        note: 'Fevicol contains polyvinyl alcohol (PVA) long-chain polymers, which act as the main liquid structural foundation for slime synthesis.',
        height: 0.45,
        color: 0xffffff,
        pourColor: 0xffffff,
        soundType: 'pour',
        soundDuration: 2.2
      },
      2: {
        title: 'Step 2: Add Food Colouring Agent',
        badge: 'Step 2 of 7',
        reagentKey: 'colour',
        desc: 'The colour dropper bottle hovers over the beaker and adds dye droplets, forming swirling color streaks in the glue.',
        note: 'Colouring agent blends into the PVA polymer matrix to give the slime its vibrant visual appearance.',
        height: 0.52,
        color: 0x3a86ff,
        pourColor: 0xd946ef,
        soundType: 'pour',
        soundDuration: 1.8
      },
      3: {
        title: 'Step 3: Add Calcium Carbonate (CaCO₃)',
        badge: 'Step 3 of 7',
        reagentKey: 'caco3',
        desc: 'A measuring spoon scoops white Calcium Carbonate powder and sprinkles fine particles into the mixture.',
        note: 'Calcium Carbonate acts as an insoluble mineral filler that modifies the density, opacity, and tactile consistency of the slime.',
        height: 0.60,
        color: 0x4895ef,
        isPowder: true,
        soundType: 'sprinkle',
        soundDuration: 1.8
      },
      4: {
        title: 'Step 4: Add Baking Soda (NaHCO₃)',
        badge: 'Step 4 of 7',
        reagentKey: 'bakingSoda',
        desc: 'Sodium Bicarbonate powder is measured and sprinkled into the coloured liquid mixture.',
        note: 'Baking Soda acts as a pH buffer, conditioning the solution for optimal ionic interaction during cross-linking.',
        height: 0.68,
        color: 0x4cc9f0,
        isPowder: true,
        soundType: 'sprinkle',
        soundDuration: 1.8
      },
      5: {
        title: 'Step 5: Add Perfume / Fragrance',
        badge: 'Step 5 of 7',
        reagentKey: 'perfume',
        desc: 'The fragrance atomizer sprays aroma droplets, emitting glowing scent particles into the beaker.',
        note: 'Fragrance neutralizes synthetic polymer odors, leaving a pleasant scent in the finished laboratory slime.',
        height: 0.72,
        color: 0x4361ee,
        isScent: true,
        soundType: 'pour',
        soundDuration: 1.5
      },
      6: {
        title: 'Step 6: Add Borax Solution (Cross-Linker)',
        badge: 'Step 6 of 7',
        reagentKey: 'borax',
        desc: 'Transparent Borax solution is slowly poured into the beaker, initiating instant polymer cross-linking.',
        note: 'Borax provides borate ions B(OH)₄⁻ which form reversible cross-links between PVA hydroxyl groups, transforming the liquid into a flexible viscoelastic gel!',
        height: 0.85,
        color: 0x7209b7,
        pourColor: 0x00f2fe,
        isCrossLink: true,
        soundType: 'pour',
        soundDuration: 2.5
      },
      7: {
        title: 'Step 7: Stir Until Slime Forms',
        badge: 'Step 7 of 7',
        desc: 'The glass stirring rod enters the beaker. Click STIR to rotate the rod in an orbital path and synthesize slime!',
        note: 'Stirring promotes uniform cross-link distribution throughout the polymer matrix until 100% slime formation is achieved.',
        isStirStep: true
      }
    };
  }

  runStepAnimation(stepNum, onComplete) {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.currentStep = stepNum;

    const config = this.stepConfigs[stepNum];
    if (!config) {
      this.isAnimating = false;
      if (onComplete) onComplete();
      return;
    }

    this.sceneCtrl.animateCameraTo(
      new THREE.Vector3(0, 2.5, 3.8),
      new THREE.Vector3(0, 1.25, 0),
      1.2
    );

    if (config.reagentKey) {
      const reagent = this.labObjects.reagentMap[config.reagentKey];
      if (reagent) {
        const group = reagent.group;
        const initialPos = reagent.initialPos;

        if (window.gsap) {
          const tl = gsap.timeline({
            onComplete: () => {
              this.isAnimating = false;
              if (onComplete) onComplete();
            }
          });

          tl.to(group.position, {
            x: 0.5,
            y: 2.5,
            z: 0.3,
            duration: 1.0,
            ease: 'power2.out'
          });

          tl.to(group.rotation, {
            z: -Math.PI / 3,
            duration: 0.5,
            ease: 'power2.inOut',
            onStart: () => {
              if (config.soundType === 'pour' && window.soundEngine) {
                window.soundEngine.playPour(config.soundDuration);
              } else if (config.soundType === 'sprinkle' && window.soundEngine) {
                window.soundEngine.playSprinkle(config.soundDuration);
              }

              const streamOrigin = new THREE.Vector3(0.5, 2.3, 0.3);

              if (config.isPowder) {
                this.liquid.triggerPowderStream(streamOrigin, 0.6, config.soundDuration);
              } else if (config.isScent) {
                this.liquid.triggerScentEffect(config.soundDuration);
              } else {
                this.liquid.triggerPourStream(streamOrigin, 0.6, config.pourColor || 0xffffff, config.soundDuration);
              }

              this.liquid.setFluidState(config.height, config.color, config.isCrossLink);
            }
          });

          tl.to({}, { duration: config.soundDuration });

          tl.to(group.rotation, {
            z: 0,
            duration: 0.5,
            ease: 'power2.inOut'
          });
          tl.to(group.position, {
            x: initialPos[0],
            y: initialPos[1],
            z: initialPos[2],
            duration: 0.8,
            ease: 'power2.out'
          });
        } else {
          this.liquid.setFluidState(config.height, config.color, config.isCrossLink);
          this.isAnimating = false;
          if (onComplete) onComplete();
        }
        return;
      }
    }

    if (config.isStirStep) {
      const rod = this.labObjects.stirringRod;
      if (rod && window.gsap) {
        gsap.to(rod.position, {
          x: 0,
          y: 1.25,
          z: 0,
          duration: 1.0
        });
        gsap.to(rod.rotation, {
          z: Math.PI / 16,
          duration: 1.0,
          onComplete: () => {
            this.isAnimating = false;
            if (onComplete) onComplete();
          }
        });
      } else {
        this.isAnimating = false;
        if (onComplete) onComplete();
      }
      return;
    }

    this.isAnimating = false;
    if (onComplete) onComplete();
  }

  doStirIncrement(onComplete) {
    if (this.stirProgress >= 100) return;

    this.stirProgress += 20;
    if (window.soundEngine) window.soundEngine.playStir();

    const rod = this.labObjects.stirringRod;
    if (rod) {
      const orbitRadius = 0.35;
      const targetAngle = (this.stirProgress / 100) * Math.PI * 4;

      if (window.gsap) {
        gsap.to(this, {
          stirringAngle: targetAngle,
          duration: 0.6,
          ease: 'power2.inOut',
          onUpdate: () => {
            const rx = Math.cos(this.stirringAngle) * orbitRadius;
            const rz = Math.sin(this.stirringAngle) * orbitRadius;
            
            rod.position.set(rx, 1.25, rz);
            rod.rotation.set(Math.sin(this.stirringAngle) * 0.16, 0, Math.cos(this.stirringAngle) * 0.16);

            this.liquid.updateStirringRodPos(rx, rz, true);
          },
          onComplete: () => {
            setTimeout(() => {
              this.liquid.updateStirringRodPos(0, 0, false);
            }, 300);
          }
        });
      }
    }

    if (this.stirProgress >= 100) {
      if (window.soundEngine) window.soundEngine.playSuccessChime();
      if (onComplete) onComplete();
    }
  }

  testSlimeStretch(onComplete) {
    const rod = this.labObjects.stirringRod;
    const stretchMesh = this.liquid.createStretchSlime(rod);

    if (rod && window.gsap) {
      if (window.soundEngine) window.soundEngine.playPour(2.2);

      stretchMesh.visible = true;
      const tl = gsap.timeline({
        onComplete: () => {
          stretchMesh.visible = false;
          if (onComplete) onComplete();
        }
      });

      tl.to(rod.position, {
        y: 2.85,
        duration: 1.6,
        ease: 'power2.out',
        onUpdate: () => {
          const h = (rod.position.y - 1.2);
          stretchMesh.scale.set(1 - h * 0.28, h * 1.25, 1 - h * 0.28);
          stretchMesh.position.y = 1.2 + h * 0.5;
        }
      });

      tl.to({}, { duration: 0.5 });

      tl.to(rod.position, {
        y: 1.25,
        duration: 1.3,
        ease: 'bounce.out',
        onUpdate: () => {
          const h = Math.max(0.01, rod.position.y - 1.2);
          stretchMesh.scale.set(1 - h * 0.28, h * 1.25, 1 - h * 0.28);
          stretchMesh.position.y = 1.2 + h * 0.5;
        }
      });
    }
  }

  toggleWireframe(isWireframe) {
    this.labObjects.toggleWireframe(isWireframe);
    this.liquid.toggleWireframe(isWireframe);
  }

  reset() {
    this.currentStep = 1;
    this.stirProgress = 0;
    this.isAnimating = false;
    this.liquid.setFluidState(0.01, 0xffffff, false);
    this.liquid.updateStirringRodPos(0, 0, false);
    
    Object.values(this.labObjects.reagentMap).forEach(r => {
      r.group.position.set(...r.initialPos);
      r.group.rotation.set(0, 0, 0);
    });

    const rod = this.labObjects.stirringRod;
    if (rod) {
      rod.position.set(0.5, 1.8, 0);
      rod.rotation.set(0, 0, -Math.PI / 14);
    }
  }
}

window.AnimationPipeline = AnimationPipeline;
