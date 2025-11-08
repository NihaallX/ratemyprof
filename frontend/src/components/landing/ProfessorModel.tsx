import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { trackEvent } from '../utils/helpers';

interface ProfessorModelProps {
  scrollProgress: number;
  mousePosition: { x: number; y: number };
}

export default function ProfessorModel({ scrollProgress, mousePosition }: ProfessorModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Load 3D model (place your .glb file in public/models/)
  // If model doesn't exist, this will show error in console but won't crash
  let scene: THREE.Group | undefined;
  
  try {
    const gltf = useGLTF('/models/professor.glb');
    scene = gltf.scene as THREE.Group;
  } catch (error) {
    console.warn('3D model not found. Place professor.glb in public/models/');
  }

  useFrame((state) => {
    if (!groupRef.current) return;

    // Rotate based on mouse position
    groupRef.current.rotation.y = mousePosition.x * 0.5;
    groupRef.current.rotation.x = mousePosition.y * 0.3;

    // Float animation
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;

    // Scale based on scroll
    const scale = 1 - scrollProgress * 0.3;
    groupRef.current.scale.setScalar(Math.max(scale, 0.7));
  });

  const handlePointerEnter = () => {
    trackEvent('model_hover', { timestamp: Date.now() });
  };

  if (!scene) {
    // Fallback: simple geometry if model not loaded
    return (
      <group ref={groupRef} onPointerEnter={handlePointerEnter}>
        <mesh>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#6366f1" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    );
  }

  return (
    <primitive 
      ref={groupRef} 
      object={scene} 
      onPointerEnter={handlePointerEnter}
      scale={1.5}
    />
  );
}

// Preload model
useGLTF.preload('/models/professor.glb');
