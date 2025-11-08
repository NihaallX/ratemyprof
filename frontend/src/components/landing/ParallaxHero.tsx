import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { trackEvent, prefersReducedMotion, lerp, clamp } from '../../utils/landing/helpers';

interface ParallaxHeroProps {
  scrollProgress: number;
  mousePosition: { x: number; y: number };
  gyroData: { beta: number; gamma: number };
}

export default function ParallaxHero({
  scrollProgress,
  mousePosition,
  gyroData,
}: ParallaxHeroProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });
  
  const reducedMotion = prefersReducedMotion();

  // Create layered depth texture
  const { texture, depthTexture } = useMemo(() => {
    // Create main texture with professor portrait (placeholder gradient)
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Background layer
    const bgGradient = ctx.createRadialGradient(512, 512, 0, 512, 512, 512);
    bgGradient.addColorStop(0, '#6366f1');
    bgGradient.addColorStop(0.5, '#8b5cf6');
    bgGradient.addColorStop(1, '#ec4899');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1024, 1024);

    // Add circular frame for professor
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.arc(512, 512, 400, 0, Math.PI * 2);
    ctx.fill();

    // Inner glow
    const glowGradient = ctx.createRadialGradient(512, 512, 300, 512, 512, 400);
    glowGradient.addColorStop(0, 'rgba(99, 102, 241, 0.8)');
    glowGradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(512, 512, 400, 0, Math.PI * 2);
    ctx.fill();

    // Placeholder text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PROFESSOR', 512, 480);
    ctx.fillText('PORTRAIT', 512, 540);
    ctx.font = '24px Arial';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('Replace with actual image', 512, 600);

    const mainTexture = new THREE.CanvasTexture(canvas);

    // Create depth map (lighter = closer to camera)
    const depthCanvas = document.createElement('canvas');
    depthCanvas.width = 256;
    depthCanvas.height = 256;
    const depthCtx = depthCanvas.getContext('2d')!;

    // Background (far)
    depthCtx.fillStyle = '#111111';
    depthCtx.fillRect(0, 0, 256, 256);

    // Face circle (close)
    const faceGradient = depthCtx.createRadialGradient(128, 128, 0, 128, 128, 100);
    faceGradient.addColorStop(0, '#ffffff'); // Closest (nose area)
    faceGradient.addColorStop(0.5, '#888888'); // Mid-depth (cheeks)
    faceGradient.addColorStop(1, '#444444'); // Far (edges)
    depthCtx.fillStyle = faceGradient;
    depthCtx.beginPath();
    depthCtx.arc(128, 128, 100, 0, Math.PI * 2);
    depthCtx.fill();

    // Glasses (very close)
    depthCtx.fillStyle = '#eeeeee';
    depthCtx.fillRect(68, 100, 40, 20); // Left lens
    depthCtx.fillRect(148, 100, 40, 20); // Right lens
    depthCtx.fillRect(108, 105, 40, 5); // Bridge

    const depth = new THREE.CanvasTexture(depthCanvas);

    return { texture: mainTexture, depthTexture: depth };
  }, []);

  // Handle mouse and gyro input
  useEffect(() => {
    if (reducedMotion) return;

    // Mouse parallax (subtle)
    targetRotation.current.x = mousePosition.y * 0.15;
    targetRotation.current.y = mousePosition.x * 0.15;

    // Add gyro if available (mobile)
    if (gyroData.beta !== 0 || gyroData.gamma !== 0) {
      targetRotation.current.x += gyroData.beta * 0.002;
      targetRotation.current.y += gyroData.gamma * 0.002;
    }

    // Clamp rotation
    targetRotation.current.x = clamp(targetRotation.current.x, -0.3, 0.3);
    targetRotation.current.y = clamp(targetRotation.current.y, -0.3, 0.3);
  }, [mousePosition, gyroData, reducedMotion]);

  // Smooth animation loop
  useFrame((state, delta) => {
    if (!meshRef.current || reducedMotion) return;

    // Smooth lerp to target rotation
    currentRotation.current.x = lerp(
      currentRotation.current.x,
      targetRotation.current.x,
      delta * 3
    );
    currentRotation.current.y = lerp(
      currentRotation.current.y,
      targetRotation.current.y,
      delta * 3
    );

    // Apply rotation
    meshRef.current.rotation.x = currentRotation.current.x;
    meshRef.current.rotation.y = currentRotation.current.y;

    // Scroll-based depth effect
    const scrollDepth = scrollProgress * 2;
    meshRef.current.position.z = -scrollDepth;

    // Scroll-based scale (zoom out slightly)
    const scale = 1 - scrollProgress * 0.3;
    meshRef.current.scale.setScalar(clamp(scale, 0.7, 1));

    // Apply displacement based on depth map via shader
    // This creates the 3D parallax effect
    const material = meshRef.current.material as THREE.ShaderMaterial;
    if (material.uniforms) {
      material.uniforms.uTime.value = state.clock.elapsedTime;
      material.uniforms.uMouse.value.set(mousePosition.x, mousePosition.y);
      material.uniforms.uParallaxStrength.value = reducedMotion ? 0 : 0.15;
    }
  });

  // Custom shader material for depth-based parallax
  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTexture: { value: texture },
          uDepthMap: { value: depthTexture },
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector2(0, 0) },
          uParallaxStrength: { value: 0.15 },
          uResolution: { value: new THREE.Vector2(viewport.width, viewport.height) },
        },
        vertexShader: `
          uniform vec2 uMouse;
          uniform float uParallaxStrength;
          uniform sampler2D uDepthMap;
          
          varying vec2 vUv;
          varying float vDepth;
          
          void main() {
            vUv = uv;
            
            // Sample depth at this vertex
            vec4 depthColor = texture2D(uDepthMap, uv);
            float depth = depthColor.r;
            vDepth = depth;
            
            // Displace vertices based on depth and mouse
            vec3 pos = position;
            vec2 mouseOffset = uMouse * uParallaxStrength;
            
            // Closer pixels move more (parallax)
            pos.x += mouseOffset.x * depth * 0.5;
            pos.y += mouseOffset.y * depth * 0.5;
            pos.z += depth * 0.3;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D uTexture;
          uniform float uTime;
          
          varying vec2 vUv;
          varying float vDepth;
          
          void main() {
            vec4 color = texture2D(uTexture, vUv);
            
            // Add subtle depth-based shading
            float shade = 0.8 + vDepth * 0.2;
            color.rgb *= shade;
            
            // Add subtle animated highlight on close areas
            float highlight = vDepth * sin(uTime * 2.0 + vUv.y * 10.0) * 0.05;
            color.rgb += highlight;
            
            gl_FragColor = color;
          }
        `,
      }),
    [texture, depthTexture, viewport]
  );

  // Track hero hover
  const handlePointerEnter = () => {
    trackEvent('hero_hover', { timestamp: Date.now() });
  };

  return (
    <mesh
      ref={meshRef}
      material={shaderMaterial}
      onPointerEnter={handlePointerEnter}
      scale={[3, 3, 1]}
    >
      <planeGeometry args={[1, 1, 64, 64]} />
    </mesh>
  );
}
