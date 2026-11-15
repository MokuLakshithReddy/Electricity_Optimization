import React, { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, Shield, Cpu, Activity, LogIn } from "lucide-react";

interface LumenRoofHeroProps {
  onOpenSignIn: () => void;
  onOpenTelemetry?: () => void;
  headlineVariant?: "enterprise" | "lumen";
  onToggleHeadlineVariant?: () => void;
}

export function LumenRoofHero({
  onOpenSignIn,
  onOpenTelemetry,
  headlineVariant = "enterprise",
  onToggleHeadlineVariant,
}: LumenRoofHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTime, setActiveTime] = useState<0 | 1>(1); // 1 = Night, 0 = Morning

  useEffect(() => {
    const root = document.documentElement.style;
    const calm = window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    const SINK = 240;
    const RISE = 820;
    const DEPTH = 0.27;

    const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
    const smooth = (a: number, b: number, x: number) => {
      const t = clamp((x - a) / (b - a));
      return t * t * (3 - 2 * t);
    };

    let night = 1;
    let target = 1;
    let from = 1;
    let start = -1e9;
    let queued: number | null = null;
    let swapped = true;
    let k = 1;
    let animating = false;
    let clock = 0;
    let rafId: number;

    const setM = document.getElementById("setM");
    const setN = document.getElementById("setN");
    const bm = document.getElementById("bm");
    const bn = document.getElementById("bn");

    const show = (n: number) => {
      if (setM && setN) {
        setM.classList.toggle("is-on", !n);
        setN.classList.toggle("is-on", !!n);
      }
    };

    const begin = (n: number, now: number) => {
      target = n;
      from = k;
      start = now;
      swapped = false;
      animating = true;
      setActiveTime(n as 0 | 1);
    };

    const pick = (n: number) => {
      if (n === target && queued === null) return;
      if (bm && bn) {
        bm.setAttribute("aria-pressed", (!n).toString());
        bn.setAttribute("aria-pressed", (!!n).toString());
      }
      setActiveTime(n as 0 | 1);
      if (calm) {
        target = night = n;
        k = n;
        show(n);
        root.setProperty("--k", n.toFixed(3));
        root.setProperty("--k2", n.toFixed(3));
        root.setProperty("--sink", "0px");
        root.setProperty("--dip", "0");
        return;
      }
      if (animating) {
        queued = n;
      } else {
        begin(n, clock);
      }
    };

    // Attach click listeners to toggle buttons
    const handleMorningClick = () => pick(0);
    const handleNightClick = () => pick(1);

    bm?.addEventListener("click", handleMorningClick);
    bn?.addEventListener("click", handleNightClick);

    // WebGL2 Fog Setup
    const cv = canvasRef.current;
    if (!cv) return;
    const gl = cv.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
    });

    const U: Record<string, WebGLUniformLocation | null> = {};

    if (gl) {
      const vs = `#version 300 es
      void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0,1);}`;

      const fs = `#version 300 es
      precision highp float;
      uniform vec2 R;uniform float T,S,K;out vec4 O;
      float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
      float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
      float fbm(vec2 p){float a=.5,s=0.;mat2 m=mat2(1.6,1.2,-1.2,1.6);p=mat2(.8,.6,-.6,.8)*p+5.3;for(int i=0;i<5;i++){s+=a*n(p);p=m*p;a*=.5;}return s;}
      void main(){
        vec2 uv=gl_FragCoord.xy/R;uv.y=1.-uv.y;
        float asp=R.x/R.y;vec2 p=vec2(uv.x*asp,uv.y);
        float t=T*.05;
        vec2 w=vec2(fbm(p*1.3+vec2(t,-t*.6)),fbm(p*1.3+vec2(-t*.8,t)+7.));
        float d=fbm(p*1.9+w*1.7+vec2(t*1.6,-t*1.1+S*.5));
        float e=fbm(p*.9-w+vec2(-t,t*.5)+3.);
        float low=smoothstep(.70,1.04,uv.y+(d-.5)*.34);
        float side=smoothstep(.2,.0,uv.x+(e-.5)*.28)+smoothstep(.8,1.,uv.x+(e-.5)*.28);
        side*=smoothstep(.25,.6,uv.y)*.2;
        float wisps=smoothstep(.5,.78,d)*smoothstep(.22,.5,uv.y)*smoothstep(.86,.6,uv.y)*.18;
        float rest=clamp(low+side+wisps,0.,1.);
        float front=1.02-S*.68;
        float rise=smoothstep(front-.02,front+.26,uv.y+(d-.5)*.5);
        float haze=S*(.3+.46*d);
        float a=clamp(max(rest,max(rise*.97,haze)),0.,1.);
        vec3 dayA=vec3(.97,.93,.84),dayB=vec3(.79,.78,.71);
        vec3 nitA=vec3(.40,.45,.57),nitB=vec3(.15,.19,.29);
        vec3 c=mix(mix(dayB,dayA,d*1.15),mix(nitB,nitA,d*1.1),K);
        float porch=exp(-dot((uv-vec2(.72,.74))*vec2(1.7,2.6),(uv-vec2(.72,.74))*vec2(1.7,2.6))*3.2);
        c=mix(c,vec3(.86,.55,.27),K*porch*.42*(1.-S));
        O=vec4(c*a,a);
      }`;

      const sh = (type: number, src: string) => {
        const o = gl.createShader(type)!;
        gl.shaderSource(o, src);
        gl.compileShader(o);
        if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) {
          console.error(gl.getShaderInfoLog(o));
        }
        return o;
      };

      const pr = gl.createProgram()!;
      gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs));
      gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(pr);
      gl.useProgram(pr);

      for (const u of ["R", "T", "S", "K"]) {
        U[u] = gl.getUniformLocation(pr, u);
      }
    }

    const handleResize = () => {
      if (!gl || !cv) return;
      const w = Math.round(Math.min(window.innerWidth, 960));
      const h = Math.round((w * window.innerHeight) / window.innerWidth);
      if (cv.width !== w || cv.height !== h) {
        cv.width = w;
        cv.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    // Initial state: Night (k=1)
    root.setProperty("--k", "1");
    root.setProperty("--k2", "1");
    root.setProperty("--dip", "0");
    root.setProperty("--sink", "0px");

    const frame = (now: number) => {
      clock = now;
      const d = now - start;
      let y = 0;
      let s = 0;
      let dip = 0;
      let k2 = k;

      if (animating) {
        if (d < SINK) {
          const x = d / SINK;
          y = x * x * (3 - 2 * x) * DEPTH;
        } else {
          if (!swapped) {
            swapped = true;
            night = target;
            show(target);
          }
          const x = clamp((d - SINK) / RISE);
          y = Math.pow(1 - x, 3.4) * DEPTH;
        }

        s = smooth(0, SINK * 0.92, d) * (1 - smooth(SINK + 70, SINK + RISE * 0.92, d));
        dip = smooth(30, 190, d) * (1 - smooth(330, 720, d));
        k = from + (target - from) * smooth(120, 520, d);
        k2 = from + (target - from) * smooth(340, 760, d);

        if (d >= SINK + RISE) {
          animating = false;
          k = k2 = target;
          y = s = dip = 0;
          if (queued !== null && queued !== target) {
            const q = queued;
            queued = null;
            begin(q, now);
          } else {
            queued = null;
          }
        }
      }

      root.setProperty("--sink", (y * window.innerHeight).toFixed(1) + "px");
      root.setProperty("--k", k.toFixed(3));
      root.setProperty("--k2", k2.toFixed(3));
      root.setProperty("--dip", dip.toFixed(3));

      if (gl && cv) {
        if (U.R) gl.uniform2f(U.R, cv.width, cv.height);
        if (U.T) gl.uniform1f(U.T, now / 1000);
        if (U.S) gl.uniform1f(U.S, s);
        if (U.K) gl.uniform1f(U.K, k);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    const loop = (t: number) => {
      frame(t);
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      bm?.removeEventListener("click", handleMorningClick);
      bn?.removeEventListener("click", handleNightClick);
    };
  }, []);

  return (
    <div ref={containerRef} className="lumen-hero">
      {/* LAYER 1: SKY (Morning & Night images, scaled & blurred, night opacity = var(--k)) */}
      <div className="lumen-layer lumen-sky">
        <img
          id="skyM"
          alt="Morning sky"
          src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_040343_a73684b4-3f71-4613-a843-c8be80fb1211.png&w=1600&q=80"
        />
        <img
          id="skyN"
          className="lumen-sky-night"
          alt="Night sky"
          src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_040308_f31964ab-ed8e-4ea4-90eb-3226c0859936.png&w=1600&q=80"
        />
      </div>

      {/* LAYER 2: MOVING HOME (Translates on Y axis via --sink) */}
      <div className="lumen-layer lumen-home">
        {/* Morning Set */}
        <div className="set" id="setM">
          <div className="lumen-layer lumen-ground">
            <img
              alt="Morning landscape grounds"
              src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_040259_1be34093-835e-4de4-b3a8-f875e6a74591.png&w=2560&q=85"
            />
          </div>
          <img
            className="cut"
            alt="A charcoal farmhouse with solar panels in soft morning light"
            src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_040416_e3b05fa4-cc80-4a43-afde-8a0a053933e9.png&w=2560&q=85"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "50% 62%",
            }}
          />
        </div>

        {/* Night Set (active by default) */}
        <div className="set is-on" id="setN">
          <div className="lumen-layer lumen-ground">
            <img
              alt="Night landscape grounds"
              src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_040211_c8fd4865-285e-4c1f-8a37-4bfe0771357b.png&w=2560&q=85"
            />
          </div>
          <img
            className="cut"
            alt="The same farmhouse at dusk with warm amber windows and rooftop solar panels"
            src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_040415_2ab95096-8c39-449f-b36c-17c2813815a4.png&w=2560&q=85"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "50% 62%",
            }}
          />
        </div>
      </div>

      {/* LAYER 3: TILT BLUR SOFTENING */}
      <div className="lumen-tilt" />

      {/* LAYER 4: LIVE WEBGL2 FOG CANVAS */}
      <canvas id="fog" ref={canvasRef} className="lumen-fog-canvas" aria-hidden="true" />

      {/* LAYER 5: UI OVERLAY (Text, Nav, Headline, Dock) */}
      <div className="lumen-ui">
        {/* Navigation Bar */}
        <header className="lumen-bar">
          <a className="lumen-logo" href="#" aria-label="Lumen Roof — IntelliGrid AI">
            <svg viewBox="0 0 40 40" aria-hidden="true">
              <g fill="color-mix(in srgb,#6d8f2a calc((1 - var(--k))*100%),#d8ee8e)">
                <circle cx="20" cy="20" r="0" />
                <path id="ray" d="M18.3 3.5h3.4l.9 8.4h-5.2Z" />
                <use href="#ray" transform="rotate(30 20 20)" />
                <use href="#ray" transform="rotate(60 20 20)" />
                <use href="#ray" transform="rotate(90 20 20)" />
                <use href="#ray" transform="rotate(120 20 20)" />
                <use href="#ray" transform="rotate(150 20 20)" />
                <use href="#ray" transform="rotate(180 20 20)" />
                <use href="#ray" transform="rotate(210 20 20)" />
                <use href="#ray" transform="rotate(240 20 20)" />
                <use href="#ray" transform="rotate(270 20 20)" />
                <use href="#ray" transform="rotate(300 20 20)" />
                <use href="#ray" transform="rotate(330 20 20)" />
              </g>
            </svg>
            <span>Lumen Roof</span>
          </a>

          {/* Centered Nav Links to Repository Application Modules */}
          <ul className="lumen-links">
            <li>
              <Link to="/app/dashboard">Dashboard</Link>
            </li>
            <li>
              <Link to="/app/energy-flow">Energy Flow</Link>
            </li>
            <li>
              <Link to="/app/digital-twin">Digital Twin</Link>
            </li>
            <li>
              <Link to="/app/forecasts">Forecasts</Link>
            </li>
            <li>
              <Link to="/app/scenarios">Scenarios</Link>
            </li>
          </ul>

          {/* Right Side Actions */}
          <div className="lumen-side">
            {onOpenTelemetry && (
              <button
                type="button"
                onClick={onOpenTelemetry}
                className="inline-flex items-center gap-1.5 hover:text-white transition-opacity"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Telemetry</span>
              </button>
            )}

            {onToggleHeadlineVariant && (
              <button
                type="button"
                onClick={onToggleHeadlineVariant}
                title="Toggle headline content style"
                className="opacity-75 hover:opacity-100 transition-opacity text-xs border border-white/20 rounded-full px-2.5 py-1"
              >
                {headlineVariant === "enterprise" ? "Lumen Mode" : "IntelliGrid Mode"}
              </button>
            )}

            <button
              type="button"
              className="lumen-cta"
              onClick={onOpenSignIn}
              aria-label="Open Control Centre Sign In"
            >
              <LogIn className="w-3.5 h-3.5 mr-2 inline" />
              <span>Enter Control Centre</span>
            </button>
          </div>
        </header>

        {/* Centered Split-Color Headline */}
        <h1 className="lumen-h1">
          {headlineVariant === "enterprise" ? (
            <>
              <span className="l1">Predict. Optimize. Save.</span>
              <span>
                <i>for the next</i> <span className="y">7 Years</span>
              </span>
            </>
          ) : (
            <>
              <span className="l1">$0 Electricity Bills</span>
              <span>
                <i>for the next</i> <span className="y">7 Years</span>
              </span>
            </>
          )}
        </h1>

        {/* Bottom Dock: Glass Morning / Night Toggle & Caption */}
        <div className="lumen-dock">
          <div className="lumen-toggle" role="group" aria-label="Time of day">
            <button id="bm" className="lumen-btn-morning" aria-pressed={activeTime === 0}>
              <b>Morning</b>
              <small>$0 for Electricity</small>
            </button>
            <button id="bn" className="lumen-btn-night" aria-pressed={activeTime === 1}>
              <b>Night</b>
              <small>$0 for Electricity</small>
            </button>
          </div>

          <p className="lumen-cap">
            {headlineVariant === "enterprise" ? (
              <>
                Forget the energy market, weather conditions and seasons. Our AI Copilot
                <br />
                optimizes solar, battery, grid and captive power for continuous zero waste.
              </>
            ) : (
              <>
                Forget the energy market, weather conditions and seasons. Our Smart
                <br />
                Controller guarantees you get no electricity bill for seven years.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
