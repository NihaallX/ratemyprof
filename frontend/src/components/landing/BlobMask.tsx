import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import blobVertexShader from '../shaders/blob.vert?raw';
import blobFragmentShader from '../shaders/blob.frag?raw';

interface BlobMaskProps {
  mousePosition: { x: number; y: number };
}

export default function BlobMask({ mousePosition }: BlobMaskProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useRef(
    new THREE.ShaderMaterial({
      uniforms: {
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uRadius: { value: 0.2 },
        uColor: { value: new THREE.Color('#6366f1') },
      },
      vertexShader: blobVertexShader,
      fragmentShader: blobFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
    })
  ).current;

  useEffect(() => {
    const handleResize = () => {
      material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [material]);

  useFrame((state) => {
    if (!meshRef.current) return;

    // Update uniforms
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uMouse.value.set(
      mousePosition.x * window.innerWidth,
      (1 - mousePosition.y) * window.innerHeight
    );
  });

  return (
    <mesh ref={meshRef} material={material}>
      <planeGeometry args={[window.innerWidth / 100, window.innerHeight / 100, 1, 1]} />
    </mesh>
  );
}
