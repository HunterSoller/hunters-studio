"use client";

import { useEffect, useRef, useState } from "react";
import { hasFinePointer, prefersReducedMotion, trackPointer } from "@/lib/motion";

const VERT = /* glsl */ `
precision highp float;
attribute vec2 a_grid;          // x: -1..1 across, y: 0 (near) .. 1 (far)
uniform mat4 u_proj;
uniform mat4 u_view;
uniform float u_time;
uniform float u_amp;            // intro / scroll amplitude
uniform float u_width;          // aspect-driven horizontal spread
uniform vec2 u_mouse;           // cursor projected onto the ground plane (x, z)
uniform float u_mouseAmt;
varying float v_depth;
varying float v_height;
varying float v_edge;
varying float v_glow;
varying float v_sweep;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
  float d = a_grid.y;
  float z = mix(1.4, -9.0, d);
  float x = a_grid.x * mix(1.9, 8.5, d) * u_width;

  // Terrain scrolls toward the viewer like a spectrogram history.
  vec2 q = vec2(x * 0.55, z * 0.62 - u_time * 0.32);
  float n = noise(q) * 0.62 + noise(q * 2.03 + 7.1) * 0.28 + noise(q * 4.1 + 3.3) * 0.10;
  n = pow(n, 2.4) * 2.1;

  // Quiet center channel keeps the headline legible; energy lives toward the sides.
  float band = 0.28 + 0.72 * smoothstep(0.4, 3.2, abs(x));
  float wave = sin(x * 2.6 - u_time * 1.4 + z * 1.3) * 0.045 + sin(x * 8.0 + u_time * 2.1) * 0.012;

  float dm = distance(vec2(x, z), u_mouse);
  float g = exp(-dm * dm * 0.55);
  float ring = sin(dm * 5.5 - u_time * 4.0) * 0.07 * g;

  float h = (n * 0.62 * band + wave) * u_amp + (g * 0.42 + ring) * u_mouseAmt * u_amp;

  v_depth = d;
  v_height = h;
  v_edge = abs(a_grid.x);
  v_glow = g * u_mouseAmt;
  // Playback head sweeping from horizon to viewer.
  v_sweep = smoothstep(0.035, 0.0, abs(d - (1.0 - fract(u_time * 0.055))));
  gl_Position = u_proj * u_view * vec4(x, h, z, 1.0);
}
`;

const FRAG = /* glsl */ `
precision mediump float;
uniform float u_alpha;
uniform float u_fade;
varying float v_depth;
varying float v_height;
varying float v_edge;
varying float v_glow;
varying float v_sweep;

void main() {
  float far = 1.0 - smoothstep(0.5, 1.0, v_depth);
  float near = smoothstep(0.0, 0.07, v_depth);
  float side = 1.0 - smoothstep(0.72, 1.0, v_edge);
  float sweep = v_sweep;

  vec3 base = vec3(0.82, 0.83, 0.9);
  vec3 amber = vec3(1.0, 0.54, 0.24);
  vec3 violet = vec3(0.62, 0.48, 1.0);

  float hi = smoothstep(0.22, 0.85, v_height);
  vec3 col = mix(base, amber, clamp(hi + v_glow * 0.8 + sweep * 0.6, 0.0, 1.0));
  col = mix(col, violet, smoothstep(0.35, 0.95, v_depth) * 0.75);

  float a = (0.13 + hi * 0.5 + v_glow * 0.35 + sweep * 0.35) * far * near * side * u_alpha * u_fade;
  gl_FragColor = vec4(col * a, a);
}
`;

type M4 = Float32Array;

function perspective(fovy: number, aspect: number, near: number, far: number): M4 {
  const f = 1 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}

function mul(a: M4, b: M4): M4 {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
  return o;
}

function rotX(t: number): M4 {
  const c = Math.cos(t), s = Math.sin(t);
  return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
}

function translate(x: number, y: number, z: number): M4 {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn(gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function buildGrid(rows: number, cols: number) {
  const verts = new Float32Array(rows * cols * 2);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = (r * cols + c) * 2;
      verts[i] = (c / (cols - 1)) * 2 - 1;
      verts[i + 1] = r / (rows - 1);
    }
  }
  const rowLines: number[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols - 1; c++) rowLines.push(r * cols + c, r * cols + c + 1);
  }
  const colLines: number[] = [];
  const colStep = Math.max(4, Math.round(cols / 18));
  for (let c = 0; c < cols; c += colStep) {
    for (let r = 0; r < rows - 1; r++) colLines.push(r * cols + c, (r + 1) * cols + c);
  }
  const tris: number[] = [];
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c, b = a + 1, d = a + cols, e = d + 1;
      tris.push(a, d, b, b, d, e);
    }
  }
  return {
    verts,
    rowLines: new Uint16Array(rowLines),
    colLines: new Uint16Array(colLines),
    tris: new Uint16Array(tris),
  };
}

export default function HeroVisual() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      antialias: true,
      alpha: true,
      depth: true,
      premultipliedAlpha: true,
      powerPreference: "low-power",
    });
    if (!gl) return;

    const reduced = prefersReducedMotion();
    const fine = hasFinePointer();
    const compact = !fine || window.innerWidth < 768;
    const rows = compact ? 38 : 60;
    const cols = compact ? 96 : 180;
    const maxDpr = compact ? 1.5 : 2;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn(gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    const grid = buildGrid(rows, cols);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, grid.verts, gl.STATIC_DRAW);
    const aGrid = gl.getAttribLocation(prog, "a_grid");
    gl.enableVertexAttribArray(aGrid);
    gl.vertexAttribPointer(aGrid, 2, gl.FLOAT, false, 0, 0);

    const makeIndex = (data: Uint16Array) => {
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
      return { buf: b, count: data.length };
    };
    const triIdx = makeIndex(grid.tris);
    const rowIdx = makeIndex(grid.rowLines);
    const colIdx = makeIndex(grid.colLines);

    const u = (name: string) => gl.getUniformLocation(prog, name);
    const uProj = u("u_proj"), uView = u("u_view"), uTime = u("u_time"), uAmp = u("u_amp");
    const uWidth = u("u_width"), uMouse = u("u_mouse"), uMouseAmt = u("u_mouseAmt");
    const uAlpha = u("u_alpha"), uFade = u("u_fade");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clearColor(0, 0, 0, 0);
    gl.polygonOffset(1, 1);

    let proj = perspective(0.8, 1, 0.1, 40);
    let aspect = 1;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
      proj = perspective(aspect < 1 ? 1.0 : 0.8, aspect, 0.1, 40);
    };
    resize();

    const pointer = trackPointer();
    const sm = { x: 0, y: 0, amt: 0 };
    let raf = 0;
    let running = false;
    let shown = false;
    const t0 = performance.now();

    const draw = (time: number, intro: number) => {
      const scroll = Math.min(1, Math.max(0, window.scrollY / Math.max(1, window.innerHeight)));

      if (fine && !reduced) {
        sm.x += (pointer.x - sm.x) * 0.045;
        sm.y += (pointer.y - sm.y) * 0.045;
        sm.amt += ((pointer.active ? 1 : 0) - sm.amt) * 0.03;
      }

      const view = mul(rotX(0.2), translate(0, -1.05, -2.6));

      const mz = -6.5 + (sm.y * 0.5 + 0.5) * 7.2;
      const mx = sm.x * (2.2 + Math.max(0, -mz) * 0.75) * Math.min(1.4, Math.max(0.5, aspect / 1.6));

      const width = Math.min(1.35, Math.max(0.45, aspect / 1.6));
      const amp = intro * (1 - scroll * 0.5);
      const fade = Math.min(1, intro * 1.4) * (1 - scroll);

      gl.uniformMatrix4fv(uProj, false, proj);
      gl.uniformMatrix4fv(uView, false, view);
      gl.uniform1f(uTime, time);
      gl.uniform1f(uAmp, amp);
      gl.uniform1f(uWidth, width);
      gl.uniform2f(uMouse, mx, mz);
      gl.uniform1f(uMouseAmt, sm.amt);
      gl.uniform1f(uFade, fade);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Depth-only pass: the surface occludes ridges behind it.
      gl.colorMask(false, false, false, false);
      gl.depthMask(true);
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triIdx.buf);
      gl.drawElements(gl.TRIANGLES, triIdx.count, gl.UNSIGNED_SHORT, 0);
      gl.disable(gl.POLYGON_OFFSET_FILL);

      gl.colorMask(true, true, true, true);
      gl.depthMask(false);
      gl.uniform1f(uAlpha, 1);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rowIdx.buf);
      gl.drawElements(gl.LINES, rowIdx.count, gl.UNSIGNED_SHORT, 0);
      gl.uniform1f(uAlpha, 0.32);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, colIdx.buf);
      gl.drawElements(gl.LINES, colIdx.count, gl.UNSIGNED_SHORT, 0);

      if (!shown) {
        shown = true;
        setVisible(true);
      }
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const t = (now - t0) / 1000;
      const p = Math.min(1, t / 2.6);
      draw(t + 6, 1 - Math.pow(1 - p, 3));
    };

    const start = () => {
      if (running || reduced) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) draw(14, 1);
    });
    ro.observe(canvas);

    // The canvas is fixed to the viewport, so pause rendering once the hero has scrolled away.
    const pastHero = () => window.scrollY >= window.innerHeight;
    const onScroll = () => {
      if (reduced) return draw(14, 1);
      if (pastHero()) {
        if (running) {
          stop();
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }
      } else if (!document.hidden) start();
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (!pastHero()) start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    if (reduced || pastHero()) draw(14, 1);
    else start();

    const onLost = (e: Event) => {
      e.preventDefault();
      stop();
    };
    canvas.addEventListener("webglcontextlost", onLost);

    return () => {
      stop();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", onScroll);
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.deleteBuffer(vbo);
      [triIdx, rowIdx, colIdx].forEach((b) => gl.deleteBuffer(b.buf));
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`absolute inset-0 h-full w-full transition-opacity duration-[1600ms] ease-out ${visible ? "opacity-100" : "opacity-0"}`}
    />
  );
}
