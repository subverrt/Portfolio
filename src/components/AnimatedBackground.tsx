import {
  Canvas,
  useFrame,
  useThree,
} from "@react-three/fiber";

import { useEffect, useRef } from "react";
import * as THREE from "three";

import vertexShader from "./shaders/vertexShader";
import fragmentShader from "./shaders/fragmentShader";

function Scene() {
  const { viewport } = useThree();

  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const mouse = useRef(new THREE.Vector2(0.5, 0.5));

  const targetMouse = useRef(
    new THREE.Vector2(0.5, 0.5)
  );

  const scroll = useRef(0);

  const targetScroll = useRef(0);

  const prefersReducedMotion = useRef(false);

  // --------------------------------
  // Listen to scroll
  // Was previously `window.onscroll = () => {...}` directly in the
  // render body — that reassigns the handler on every single render,
  // silently overwrites any other scroll listener on the page, and
  // never cleans up. Moved into an effect with addEventListener so it
  // registers once and tears down properly.
  // --------------------------------

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const handleScroll = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;

      if (maxScroll <= 0) {
        targetScroll.current = 0;
        return;
      }

      targetScroll.current = window.scrollY / maxScroll;
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useFrame((state, delta) => {
    if (!materialRef.current) return;

    // --------------------------------
    // Mouse
    // Skipped when the user prefers reduced motion, so the
    // background doesn't chase the cursor for people who've asked
    // their OS to minimize motion.
    // --------------------------------

    if (!prefersReducedMotion.current) {
      targetMouse.current.x = state.pointer.x * 0.5 + 0.5;
      targetMouse.current.y = state.pointer.y * 0.5 + 0.5;

      mouse.current.lerp(targetMouse.current, 0.05);
    }

    // --------------------------------
    // Smooth scroll
    // --------------------------------

    scroll.current +=
      (targetScroll.current - scroll.current) * 0.05;

    // --------------------------------
    // Update shader uniforms
    // Time advances much more slowly under reduced motion — still
    // alive, not a jarring freeze-frame, just calm.
    // --------------------------------

    const timeSpeed = prefersReducedMotion.current ? 0.15 : 1;

    materialRef.current.uniforms.uTime.value +=
      delta * timeSpeed;

    materialRef.current.uniforms.uMouse.value.copy(mouse.current);

    materialRef.current.uniforms.uScroll.value = scroll.current;

    // uResolution feeds the shader's grain effect — using real
    // pixel dimensions (rather than 0-1 UV space) keeps the grain
    // texture consistent instead of stretching with the viewport's
    // aspect ratio.
    materialRef.current.uniforms.uResolution.value.set(
      state.size.width,
      state.size.height
    );
  });

  return (
    <mesh
      scale={[
        viewport.width / 2,
        viewport.height / 2,
        1,
      ]}
    >
      <planeGeometry args={[2, 2]} />

      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: {
            value: 0,
          },

          uMouse: {
            value: new THREE.Vector2(
              0.5,
              0.5
            ),
          },

          uScroll: {
            value: 0,
          },

          uResolution: {
            value: new THREE.Vector2(
              window.innerWidth,
              window.innerHeight
            ),
          },
        }}
      />
    </mesh>
  );
}

export default function AnimatedBackground() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
      }}
    >
      <Canvas
        orthographic
        camera={{
          position: [0, 0, 1],
          zoom: 1,
        }}
        // Caps pixel ratio at 2x. Without this, a 3x-DPI display
        // renders the shader at 3x the pixel count for no visible
        // benefit — pure battery/heat cost for a background layer.
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}