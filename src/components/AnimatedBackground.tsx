import {
  Canvas,
  useFrame,
  useThree,
} from "@react-three/fiber";

import { useRef } from "react";
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

  // --------------------------------
  // Listen to scroll
  // --------------------------------

  if (typeof window !== "undefined") {
    window.onscroll = () => {
      const maxScroll =
        document.documentElement.scrollHeight -
        window.innerHeight;

      if (maxScroll <= 0) {
        targetScroll.current = 0;
        return;
      }

      targetScroll.current =
        window.scrollY / maxScroll;
    };
  }

  useFrame((state) => {
    if (!materialRef.current) return;

    // --------------------------------
    // Mouse
    // --------------------------------

    targetMouse.current.x =
      state.pointer.x * 0.5 + 0.5;

    targetMouse.current.y =
      state.pointer.y * 0.5 + 0.5;

    mouse.current.lerp(
      targetMouse.current,
      0.05
    );

    // --------------------------------
    // Smooth scroll
    // --------------------------------

    scroll.current +=
      (
        targetScroll.current -
        scroll.current
      ) * 0.05;

    // --------------------------------
    // Update shader uniforms
    // --------------------------------

    materialRef.current.uniforms.uTime.value =
      state.clock.getElapsedTime();

    materialRef.current.uniforms.uMouse.value.copy(
      mouse.current
    );

    materialRef.current.uniforms.uScroll.value =
      scroll.current;
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
      >
        <Scene />
      </Canvas>
    </div>
  );
}