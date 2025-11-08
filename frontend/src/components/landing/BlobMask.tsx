import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Inline shaders for Next.js compatibility
const blobVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const blobFragmentShader = `
uniform vec2 uMouse;
uniform float uTime;
uniform vec2 uResolution;
uniform float uRadius;
uniform vec3 uColor;
varying vec2 vUv;

// Smooth noise function
float noise(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Smooth interpolation
float smoothNoise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = noise(i);
    float b = noise(i + vec2(1.0, 0.0));
    float c = noise(i + vec2(0.0, 1.0));
    float d = noise(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
    // Normalize coordinates
    vec2 st = gl_FragCoord.xy / uResolution;
    vec2 mouse = uMouse / uResolution;
    
    // Distance from mouse
    float dist = distance(st, mouse);
    
    // Animated noise for organic blob shape
    float n1 = smoothNoise(st * 3.0 + uTime * 0.2);
    float n2 = smoothNoise(st * 5.0 - uTime * 0.15);
    float noiseValue = (n1 + n2) * 0.5;
    
    // Dynamic radius with noise
    float dynamicRadius = uRadius + noiseValue * 0.05;
    
    // Create smooth blob shape
    float blob = smoothstep(dynamicRadius + 0.1, dynamicRadius - 0.05, dist);
    
    // Add subtle pulsing
    float pulse = sin(uTime * 2.0) * 0.5 + 0.5;
    blob *= 0.7 + pulse * 0.3;
    
    // Gradient from center
    vec3 innerColor = uColor;
    vec3 outerColor = uColor * 0.5;
    vec3 color = mix(outerColor, innerColor, blob);
    
    // Add soft glow
    float glow = exp(-dist * 3.0) * 0.3;
    color += glow * uColor;
    
    gl_FragColor = vec4(color, blob * 0.9);
}
`;

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
