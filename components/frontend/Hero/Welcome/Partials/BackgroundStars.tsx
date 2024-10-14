"use client";
import React, {
  useState,
  useEffect,
  useRef,
} from "react";

import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import { inSphere } from "maath/random";

function Background() {
  return (
    <Canvas
      camera={{ position: [0, 0, 1] }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 1,
        width: "100%",
        height: "100%",
      }}
    >
      <Stars />
    </Canvas>
  );
}

function Stars(props = {}) {
  const ref = useRef() as any;

  const [dotColor, setDotColor] = useState("#ffffff");

  const [sphere] = useState(
    () => new Float32Array(inSphere(new Float32Array(5000), { radius: 1.5 })),
  );

  useFrame((state, delta) => {
    if (!ref.current || !ref.current?.rotation) {
      return;
    }
    ref.current.rotation.x -= delta / 10;
    ref.current.rotation.y -= delta / 15;

    ref.current.rotation.z -= delta / 20;

    //change color of dots
    let html_theme = document.documentElement.getAttribute("data-theme");

    if (html_theme === "dark") {
      setDotColor("#ffffff");
    } else if (html_theme === "light") {
      setDotColor("#000000");
    } else {
      setDotColor("#ffffff");
    }
  });

  useEffect(() => {
    let html_theme = document.documentElement.getAttribute("data-theme");

    if (html_theme === "dark") {
      setDotColor("#ffffff");
    } else {
      setDotColor("#000000");
    }
  }, []);

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points
        ref={ref}
        positions={sphere}
        stride={3}
        frustumCulled={false}
        {...props}
      >
        <PointMaterial
          transparent
          size={0.005}
          sizeAttenuation={true}
          depthWrite={false}
          color={dotColor}
        />
      </Points>
    </group>
  );
}

export default Background;
