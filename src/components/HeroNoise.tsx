import { useEffect, useRef } from 'react';

interface Props {
  src: string;
  alt: string;
}

function smoothstep(x: number) {
  return x * x * (3 - 2 * x);
}

function hash(x: number, y: number, z: number) {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function noise(x: number, y: number, z: number) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const ux = smoothstep(fx), uy = smoothstep(fy);
  const a = hash(ix,     iy,     z);
  const b = hash(ix + 1, iy,     z);
  const c = hash(ix,     iy + 1, z);
  const d = hash(ix + 1, iy + 1, z);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

const SCALE = 4;

export default function HeroNoise({ src, alt }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const ctx = canvas.getContext('2d')!;
    let t = 0;
    let raf: number;

    function resize() {
      canvas!.width  = Math.max(1, Math.floor(img!.offsetWidth  / SCALE));
      canvas!.height = Math.max(1, Math.floor(img!.offsetHeight / SCALE));
    }

    function draw() {
      const w = canvas!.width, h = canvas!.height;
      const imageData = ctx.createImageData(w, h);
      const data = imageData.data;
      t += 0.008;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const v = noise(x * 0.18, y * 0.18, t) * 255 | 0;
          const i = (y * w + x) * 4;
          data[i] = data[i + 1] = data[i + 2] = v;
          data[i + 3] = 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);
	  setTimeout(() => raf = requestAnimationFrame(draw), 300); // Limit to ~30 FPS
      // raf = requestAnimationFrame(draw);
    }

    const start = () => { resize(); draw(); };

    if (img.complete) {
      start();
    } else {
      img.addEventListener('load', start, { once: true });
    }

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-lg opacity-50">
      <img ref={imgRef} src={src} alt={alt} className="w-full h-auto block" />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ mixBlendMode: 'overlay', opacity: 0.35 }}
      />
    </div>
  );
}
