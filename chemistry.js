/* ==========================================================================
   Polymer Chemistry Visualizer (PVA + Borax Reaction Engine)
   Renders 2D Canvas animated molecular diagram for cross-linking
   ========================================================================== */

class PolymerChemistryVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.state = 'after'; // 'before' or 'after'
    this.animationId = null;
    this.time = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * (window.devicePixelRatio || 1);
    this.canvas.height = rect.height * (window.devicePixelRatio || 1);
    this.ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    this.width = rect.width;
    this.height = rect.height;
  }

  setState(newState) {
    this.state = newState;
  }

  start() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    const loop = () => {
      this.time += 0.03;
      this.draw();
      this.animationId = requestAnimationFrame(loop);
    };
    loop();
  }

  stop() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }

  draw() {
    if (!this.ctx) return;
    const w = this.width;
    const h = this.height;
    this.ctx.clearRect(0, 0, w, h);

    // Background gradient
    const bgGrad = this.ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#070a14');
    bgGrad.addColorStop(1, '#0f172a');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, w, h);

    // Grid lines for scientific HUD feel
    this.ctx.strokeStyle = 'rgba(0, 242, 254, 0.05)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, h);
      this.ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(w, y);
      this.ctx.stroke();
    }

    // Draw PVA polymer chains (3 horizontal strands)
    const yPositions = [h * 0.28, h * 0.5, h * 0.72];
    const isCrosslinked = (this.state === 'after');

    yPositions.forEach((yBase, strandIdx) => {
      this.ctx.beginPath();
      this.ctx.lineWidth = 4;
      this.ctx.strokeStyle = '#00f2fe';
      this.ctx.shadowColor = '#00f2fe';
      this.ctx.shadowBlur = 10;

      const numPoints = 25;
      const xStep = w / (numPoints - 1);

      for (let i = 0; i < numPoints; i++) {
        const x = i * xStep;
        // Motion amplitude higher if not cross-linked
        const amp = isCrosslinked ? 4 : 12;
        const speed = isCrosslinked ? 0.8 : 2.5;
        const wave = Math.sin(this.time * speed + i * 0.4 + strandIdx * 2.0) * amp;
        const y = yBase + wave;

        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.stroke();
      this.ctx.shadowBlur = 0; // Reset shadow

      // Draw hydroxyl (-OH) functional group nodes along strands
      for (let i = 2; i < numPoints - 2; i += 4) {
        const x = i * xStep;
        const amp = isCrosslinked ? 4 : 12;
        const speed = isCrosslinked ? 0.8 : 2.5;
        const wave = Math.sin(this.time * speed + i * 0.4 + strandIdx * 2.0) * amp;
        const y = yBase + wave;

        this.ctx.beginPath();
        this.ctx.arc(x, y, 5, 0, Math.PI * 2);
        this.ctx.fillStyle = '#9d4edd';
        this.ctx.fill();
      }
    });

    // Draw Borax Cross-links if in 'after' state
    if (isCrosslinked) {
      const crossLinkXIndices = [4, 10, 16, 21];
      const numPoints = 25;
      const xStep = w / (numPoints - 1);

      // Connect strand 0 to 1, and strand 1 to 2
      const pairs = [[0, 1], [1, 2]];

      pairs.forEach(([s1, s2]) => {
        crossLinkXIndices.forEach((i, cIdx) => {
          const x = i * xStep;
          const wave1 = Math.sin(this.time * 0.8 + i * 0.4 + s1 * 2.0) * 4;
          const y1 = yPositions[s1] + wave1;

          const wave2 = Math.sin(this.time * 0.8 + i * 0.4 + s2 * 2.0) * 4;
          const y2 = yPositions[s2] + wave2;

          // Borate ion cross-link line
          this.ctx.beginPath();
          this.ctx.lineWidth = 3;
          this.ctx.strokeStyle = '#f72585';
          this.ctx.shadowColor = '#f72585';
          this.ctx.shadowBlur = 12;
          this.ctx.setLineDash([4, 4]);
          this.ctx.moveTo(x, y1);
          this.ctx.lineTo(x, y2);
          this.ctx.stroke();
          this.ctx.setLineDash([]);
          this.ctx.shadowBlur = 0;

          // Borate Ion center node B(OH)4-
          const midY = (y1 + y2) / 2;
          const pulse = Math.sin(this.time * 3 + cIdx) * 1.5;

          this.ctx.beginPath();
          this.ctx.arc(x, midY, 8 + pulse, 0, Math.PI * 2);
          this.ctx.fillStyle = '#f72585';
          this.ctx.fill();

          this.ctx.fillStyle = '#ffffff';
          this.ctx.font = 'bold 9px Inter, sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('B', x, midY);
        });
      });
    }

    // Legend Overlay
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = '11px Inter, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(
      isCrosslinked 
        ? 'STATE: Cross-Linked Elastic Polymer Network (Gel / Slime)'
        : 'STATE: Linear PVA Polymer Chains (Liquid Fluid)',
      15, 20
    );
  }
}

window.PolymerChemistryVisualizer = PolymerChemistryVisualizer;
