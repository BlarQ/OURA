'use client';

import { useEffect, useRef } from 'react';

interface Particle3D {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  color: string;
  alpha: number;
}

export default function Interactive3DBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let animationFrameId: number;
    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;
    let isHovering = false;

    // Generate 3D particles in a cubic volume
    const PARTICLE_COUNT = Math.min(Math.floor((width * height) / 18000), 55);
    const FOV = 450;
    const particles: Particle3D[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = (Math.random() - 0.5) * width * 1.2;
      const y = (Math.random() - 0.5) * height * 1.2;
      const z = (Math.random() - 0.5) * 600;

      // 85% subtle ink/slate dots, 15% sprout green accents
      const isSprout = Math.random() > 0.8;
      const color = isSprout ? '#98e58e' : '#040404';
      const size = isSprout ? 2.5 + Math.random() * 2 : 1.5 + Math.random() * 2;
      const alpha = isSprout ? 0.45 : 0.18;

      particles.push({
        x,
        y,
        z,
        baseX: x,
        baseY: y,
        baseZ: z,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        vz: (Math.random() - 0.5) * 0.3,
        size,
        color,
        alpha,
      });
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      isHovering = true;

      // Map mouse to rotation angles (-0.25 to +0.25 rad)
      targetRotY = ((e.clientX - width / 2) / (width / 2)) * 0.22;
      targetRotX = -((e.clientY - height / 2) / (height / 2)) * 0.22;
    };

    const handleMouseLeave = () => {
      isHovering = false;
      targetRotX = 0;
      targetRotY = 0;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    // 3D Rendering Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth camera rotation interpolation (spring damping)
      currentRotX += (targetRotX - currentRotX) * 0.04;
      currentRotY += (targetRotY - currentRotY) * 0.04;

      const cosX = Math.cos(currentRotX);
      const sinX = Math.sin(currentRotX);
      const cosY = Math.cos(currentRotY);
      const sinY = Math.sin(currentRotY);

      // Projected 2D screen coordinates for connecting lines
      const projected: { sx: number; sy: number; scale: number; p: Particle3D }[] = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Idle drift
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        // Bounding box bounce
        const boundX = width * 0.65;
        const boundY = height * 0.65;
        const boundZ = 350;

        if (p.x < -boundX || p.x > boundX) p.vx *= -1;
        if (p.y < -boundY || p.y > boundY) p.vy *= -1;
        if (p.z < -boundZ || p.z > boundZ) p.vz *= -1;

        // 3D Rotation Math (Around Y axis, then X axis)
        const x1 = p.x * cosY + p.z * sinY;
        const z1 = -p.x * sinY + p.z * cosY;

        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        // Perspective Projection
        const distance = FOV + z2;
        if (distance > 10) {
          const scale = FOV / distance;
          const sx = width / 2 + x1 * scale;
          const sy = height / 2 + y2 * scale;

          projected.push({ sx, sy, scale, p });

          // Draw particle
          const radius = Math.max(0.5, p.size * scale);
          ctx.beginPath();
          ctx.arc(sx, sy, radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.min(1, Math.max(0.05, p.alpha * scale));
          ctx.fill();
        }
      }

      // Draw connecting lines between close 3D neighbors
      const MAX_DIST = 140;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i];
          const p2 = projected[j];

          const dx = p1.sx - p2.sx;
          const dy = p1.sy - p2.sy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < MAX_DIST) {
            const lineAlpha = (1 - dist / MAX_DIST) * 0.12 * Math.min(p1.scale, p2.scale);
            ctx.beginPath();
            ctx.moveTo(p1.sx, p1.sy);
            ctx.lineTo(p2.sx, p2.sy);
            ctx.strokeStyle = '#040404';
            ctx.globalAlpha = lineAlpha;
            ctx.lineWidth = 0.8 * Math.min(p1.scale, p2.scale);
            ctx.stroke();
          }
        }
      }

      // Subtle mouse aura glow
      if (isHovering) {
        const gradient = ctx.createRadialGradient(
          mouseX,
          mouseY,
          0,
          mouseX,
          mouseY,
          180
        );
        gradient.addColorStop(0, 'rgba(152, 229, 142, 0.08)');
        gradient.addColorStop(0.5, 'rgba(152, 229, 142, 0.03)');
        gradient.addColorStop(1, 'rgba(152, 229, 142, 0)');

        ctx.globalAlpha = 1;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 180, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 select-none opacity-80"
      style={{ width: '100%', height: '100%' }}
      aria-hidden="true"
    />
  );
}
