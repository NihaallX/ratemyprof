/**
 * Real 3D Animated Globe using Three.js
 * Features: Continent outlines, drag-to-rotate, hover zoom, realistic markers
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import * as THREE from 'three';

interface GlobeProps {
  className?: string;
}

export const AnimatedGlobe: React.FC<GlobeProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    
    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      1, // aspect ratio 1:1 for square container
      0.1,
      1000
    );
    camera.position.z = 400;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(300, 300);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Create globe sphere
    const globeGeometry = new THREE.SphereGeometry(100, 64, 64);
    
    // Create a canvas texture with realistic continents
    const createEarthTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d')!;

      // Create ocean gradient
      const oceanGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      oceanGradient.addColorStop(0, '#0a1929');
      oceanGradient.addColorStop(0.5, '#0d2847');
      oceanGradient.addColorStop(1, '#0a1929');
      ctx.fillStyle = oceanGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add subtle noise/texture to ocean
      for (let i = 0; i < 5000; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.03})`;
        ctx.fillRect(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          2,
          2
        );
      }

      // Function to draw smooth continents
      const drawContinent = (path: Array<[number, number]>, landColor: string, shadowColor: string) => {
        // Draw shadow first (offset)
        ctx.save();
        ctx.translate(3, 3);
        ctx.fillStyle = shadowColor;
        ctx.beginPath();
        ctx.moveTo(path[0][0], path[0][1]);
        path.forEach(([x, y]) => ctx.lineTo(x, y));
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Draw main continent
        ctx.fillStyle = landColor;
        ctx.strokeStyle = '#1e3a5f';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(path[0][0], path[0][1]);
        path.forEach(([x, y]) => ctx.lineTo(x, y));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Add highlight
        const gradient = ctx.createLinearGradient(path[0][0], path[0][1], path[0][0], path[0][1] + 100);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();
      };

      // ASIA (detailed, with focus on India)
      const asia: Array<[number, number]> = [
        // Starting from top of Asia
        [1450, 250], [1550, 230], [1650, 260], [1700, 320],
        [1720, 380], [1700, 450], [1650, 500],
        // East Asia curve
        [1680, 550], [1700, 600], [1680, 650],
        // Southeast Asia
        [1620, 680], [1580, 700], [1540, 710],
        // India - East coast
        [1480, 700], [1450, 680], [1420, 650], [1400, 600],
        // India - Southern tip
        [1395, 580], [1385, 560], [1380, 540],
        // India - West coast
        [1375, 520], [1365, 480], [1360, 440], [1365, 400],
        [1375, 360], [1390, 330], [1410, 310],
        // Pakistan and North India
        [1430, 295], [1450, 285], [1470, 280],
        // Central Asia
        [1400, 260], [1420, 240], [1450, 235],
      ];
      drawContinent(asia, '#1e4d7b', '#0f2540');

      // Highlight India specifically
      const india: Array<[number, number]> = [
        [1410, 310], [1430, 300], [1445, 310],
        [1450, 340], [1452, 380], [1450, 420],
        [1445, 460], [1438, 500], [1428, 540],
        [1415, 570], [1400, 590], [1385, 600],
        [1385, 580], [1380, 560], [1375, 540],
        [1370, 510], [1365, 470], [1365, 430],
        [1368, 390], [1375, 350], [1385, 320],
        [1395, 305], [1410, 300],
      ];
      ctx.fillStyle = '#2563eb';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#60a5fa';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(india[0][0], india[0][1]);
      india.forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // EUROPE
      const europe: Array<[number, number]> = [
        [1050, 280], [1100, 260], [1150, 265], [1180, 280],
        [1200, 310], [1190, 340], [1160, 360], [1120, 370],
        [1080, 365], [1050, 350], [1030, 320], [1035, 295],
      ];
      drawContinent(europe, '#1e4d7b', '#0f2540');

      // AFRICA
      const africa: Array<[number, number]> = [
        [1050, 420], [1100, 400], [1150, 410], [1180, 440],
        [1200, 490], [1200, 550], [1180, 610], [1150, 660],
        [1110, 690], [1070, 700], [1030, 690], [1000, 660],
        [990, 610], [990, 550], [1000, 490], [1020, 440],
      ];
      drawContinent(africa, '#1e4d7b', '#0f2540');

      // NORTH AMERICA
      const northAmerica: Array<[number, number]> = [
        [350, 280], [420, 250], [480, 260], [520, 290],
        [540, 340], [530, 390], [510, 440], [480, 480],
        [440, 500], [400, 510], [360, 500], [330, 470],
        [320, 420], [320, 370], [330, 320],
      ];
      drawContinent(northAmerica, '#1e4d7b', '#0f2540');

      // SOUTH AMERICA
      const southAmerica: Array<[number, number]> = [
        [550, 540], [580, 560], [590, 600], [585, 650],
        [570, 700], [550, 750], [520, 780], [490, 790],
        [470, 780], [460, 740], [465, 690], [480, 640],
        [500, 590], [520, 560],
      ];
      drawContinent(southAmerica, '#1e4d7b', '#0f2540');

      // AUSTRALIA
      const australia: Array<[number, number]> = [
        [1580, 720], [1640, 710], [1680, 730], [1690, 770],
        [1680, 810], [1640, 830], [1590, 825], [1560, 800],
        [1555, 760], [1565, 730],
      ];
      drawContinent(australia, '#1e4d7b', '#0f2540');

      // Add atmospheric glow around edges
      const atmosGradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.width / 3,
        canvas.width / 2, canvas.height / 2, canvas.width / 2
      );
      atmosGradient.addColorStop(0, 'rgba(59, 130, 246, 0)');
      atmosGradient.addColorStop(0.8, 'rgba(59, 130, 246, 0.05)');
      atmosGradient.addColorStop(1, 'rgba(59, 130, 246, 0.15)');
      ctx.fillStyle = atmosGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add city lights for major cities (tiny bright dots)
      const cities = [
        [1410, 390], // Mumbai
        [1432, 300], // Delhi
        [1438, 560], // Bangalore
        [1448, 580], // Chennai
        [1470, 350], // Kolkata
        [1425, 520], // Hyderabad
        [1408, 510], // Pune
      ];
      
      cities.forEach(([x, y]) => {
        const cityGradient = ctx.createRadialGradient(x, y, 0, x, y, 8);
        cityGradient.addColorStop(0, '#fbbf24');
        cityGradient.addColorStop(0.5, 'rgba(251, 191, 36, 0.3)');
        cityGradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = cityGradient;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
      });

      return new THREE.CanvasTexture(canvas);
    };

    const texture = createEarthTexture();
    texture.needsUpdate = true;
    
    // Create material with texture and bump mapping
    const globeMaterial = new THREE.MeshPhongMaterial({
      map: texture,
      emissive: 0x112240,
      emissiveIntensity: 0.15,
      shininess: 25,
      specular: 0x1e3a5f,
      transparent: false,
    });

    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    // Rotate globe to show India prominently
    globe.rotation.y = -Math.PI / 1.8; // Show Asia/India facing front
    scene.add(globe);

    // Add subtle wireframe overlay (more transparent)
    const wireframeGeometry = new THREE.SphereGeometry(101, 48, 48);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    scene.add(wireframe);

    // Add atmosphere glow (more realistic)
    const glowGeometry = new THREE.SphereGeometry(108, 32, 32);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        c: { value: 0.4 },
        p: { value: 4.5 },
        glowColor: { value: new THREE.Color(0x2563eb) },
        viewVector: { value: camera.position },
      },
      vertexShader: `
        uniform vec3 viewVector;
        uniform float c;
        uniform float p;
        varying float intensity;
        void main() {
          vec3 vNormal = normalize(normalMatrix * normal);
          vec3 vNormel = normalize(normalMatrix * viewVector);
          intensity = pow(c - dot(vNormal, vNormel), p);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
          vec3 glow = glowColor * intensity;
          gl_FragColor = vec4(glow, intensity * 0.8);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glow);

    // College locations (lat, lon converted to 3D coordinates)
    const colleges = [
      { name: 'Mumbai', lat: 19.0760, lon: 72.8777, color: 0x3b82f6 },
      { name: 'Delhi', lat: 28.7041, lon: 77.1025, color: 0x8b5cf6 },
      { name: 'Bangalore', lat: 12.9716, lon: 77.5946, color: 0xec4899 },
      { name: 'Chennai', lat: 13.0827, lon: 80.2707, color: 0xf59e0b },
      { name: 'Kolkata', lat: 22.5726, lon: 88.3639, color: 0x10b981 },
      { name: 'Hyderabad', lat: 17.3850, lon: 78.4867, color: 0x06b6d4 },
      { name: 'Pune', lat: 18.5204, lon: 73.8567, color: 0x6366f1 },
    ];

    // Convert lat/lon to 3D coordinates
    const latLonToVector3 = (lat: number, lon: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);

      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);

      return new THREE.Vector3(x, y, z);
    };

    // Add markers for each college
    const markers: THREE.Mesh[] = [];
    const markerRings: THREE.Mesh[] = [];

    colleges.forEach((college, index) => {
      const position = latLonToVector3(college.lat, college.lon, 102);

      // Create marker dot (larger and more visible)
      const markerGeometry = new THREE.SphereGeometry(3.5, 16, 16);
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: college.color,
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.copy(position);
      scene.add(marker);
      markers.push(marker);

      // Create pulsing ring around marker (larger)
      const ringGeometry = new THREE.RingGeometry(5, 6.5, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: college.color,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.copy(position);
      ring.lookAt(0, 0, 0);
      scene.add(ring);
      markerRings.push(ring);

      // Add stronger point light at marker
      const light = new THREE.PointLight(college.color, 1.2, 60);
      light.position.copy(position);
      scene.add(light);
    });

    // Lighting (improved for better continent visibility)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(150, 100, 200);
    scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0x6366f1, 0.5);
    backLight.position.set(-150, -100, -200);
    scene.add(backLight);

    // Add rim light for edge definition
    const rimLight = new THREE.DirectionalLight(0x3b82f6, 0.6);
    rimLight.position.set(0, 200, -200);
    scene.add(rimLight);

    // Mouse interaction for drag and hover
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;
    let dragRotationX = 0;
    let dragRotationY = 0;

    const handleMouseDown = (event: MouseEvent) => {
      isDragging = true;
      previousMouseX = event.clientX;
      previousMouseY = event.clientY;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!containerRef.current) return;

      if (isDragging) {
        // Drag to rotate
        const deltaX = event.clientX - previousMouseX;
        const deltaY = event.clientY - previousMouseY;
        
        dragRotationY += deltaX * 0.005;
        dragRotationX += deltaY * 0.005;
        
        // Clamp vertical rotation
        dragRotationX = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, dragRotationX));
        
        previousMouseX = event.clientX;
        previousMouseY = event.clientY;
      } else {
        // Subtle mouse tracking for camera
        const rect = containerRef.current.getBoundingClientRect();
        mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        targetRotationX = mouseY * 0.2;
        targetRotationY = mouseX * 0.2;
      }
    };

    const handleMouseEnter = () => {
      setIsHovered(true);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      isDragging = false;
    };

    if (containerRef.current) {
      containerRef.current.addEventListener('mousedown', handleMouseDown);
      containerRef.current.addEventListener('mouseenter', handleMouseEnter);
      containerRef.current.addEventListener('mouseleave', handleMouseLeave);
    }
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    let animationId: number;
    let time = 0;
    let targetScale = 1;
    let currentScale = 1;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      time += 0.01;

      // Hover zoom effect (smoother)
      targetScale = isHovered ? 1.2 : 1;
      currentScale += (targetScale - currentScale) * 0.08;
      globe.scale.set(currentScale, currentScale, currentScale);
      wireframe.scale.set(currentScale, currentScale, currentScale);

      // Auto-rotation (slower and smoother)
      if (!isDragging) {
        globe.rotation.y += 0.0015;
        wireframe.rotation.y += 0.0015;
      }

      // Apply drag rotation
      globe.rotation.y = dragRotationY + globe.rotation.y * 0.99;
      globe.rotation.x = dragRotationX;
      wireframe.rotation.x = dragRotationX;

      // Mouse-based camera movement (subtle)
      if (!isDragging) {
        camera.position.x += (targetRotationY * 30 - camera.position.x) * 0.05;
        camera.position.y += (targetRotationX * 30 - camera.position.y) * 0.05;
      }
      camera.lookAt(scene.position);

      // Animate markers
      markers.forEach((marker, index) => {
        const scale = 1 + Math.sin(time * 2 + index) * 0.3;
        marker.scale.set(scale, scale, scale);
      });

      // Animate rings
      markerRings.forEach((ring, index) => {
        const scale = 1 + Math.sin(time * 2 + index * 0.5) * 0.5;
        const opacity = 0.3 + Math.sin(time * 2 + index * 0.5) * 0.2;
        ring.scale.set(scale, scale, scale);
        (ring.material as THREE.MeshBasicMaterial).opacity = opacity;
      });

      renderer.render(scene, camera);
    };

    animate();
    setIsLoaded(true);

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousedown', handleMouseDown);
        containerRef.current.removeEventListener('mouseenter', handleMouseEnter);
        containerRef.current.removeEventListener('mouseleave', handleMouseLeave);
      }
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
      
      // Dispose of geometries and materials
      globeGeometry.dispose();
      globeMaterial.dispose();
      wireframeGeometry.dispose();
      wireframeMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
      
      markers.forEach(marker => {
        marker.geometry.dispose();
        (marker.material as THREE.Material).dispose();
      });
      
      markerRings.forEach(ring => {
        ring.geometry.dispose();
        (ring.material as THREE.Material).dispose();
      });
      
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 0.8 }}
        transition={{ duration: 0.8 }}
        className="relative"
      >
        {/* Three.js container */}
        <div 
          ref={containerRef} 
          className="mx-auto cursor-grab active:cursor-grabbing transition-transform duration-300"
          style={{ 
            width: '300px', 
            height: '300px',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          }}
        />

        {/* Loading state */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Label */}
        <motion.div
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="text-sm text-slate-400 font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Colleges Across India
          </div>
        </motion.div>

        {/* Interactive hint */}
        <motion.div
          className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-slate-500 whitespace-nowrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          {isHovered ? '🖱️ Click and drag to rotate' : 'Hover and drag to explore'}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AnimatedGlobe;
