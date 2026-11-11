import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { romanticAudio } from '../audio/romanticAudio';

// Helper to create a curved petal geometry for falling & burst petals
function createRosePetalGeometry(width = 0.2, height = 0.3, curve = 0.16) {
  const geom = new THREE.PlaneGeometry(width, height, 10, 10);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const ny = (y + height / 2) / height;
    const cup = Math.sin(ny * Math.PI) * curve;
    const curlX = (1 - (x / (width / 2)) ** 2) * cup;
    const topCurl = ny > 0.75 ? Math.sin((ny - 0.75) * 4 * Math.PI * 0.5) * -0.05 : 0;
    pos.setZ(i, curlX + topCurl);
    const taper = 0.3 + 0.7 * Math.sin(ny * Math.PI * 0.5);
    pos.setX(i, x * taper);
  }
  geom.computeVertexNormals();
  return geom;
}

// Romantic meanings mapped to the FBX bouquet meshes
const FLOWER_MEANINGS = {
  petal_001: { name: 'Velvet Blush Rose', meaning: 'Deep, everlasting love for you' },
  petal_002: { name: 'Crimson Tipped Rose', meaning: 'My heart belongs only to you' },
  petal_003: { name: 'Sweet Coral Blossom', meaning: 'Every day with you is a gift' },
  petal_004: { name: 'Watercolor Garden Rose', meaning: 'Pure tenderness and devotion' },
  petal_005: { name: 'Romantic Ruby Rose', meaning: 'Passion that never fades' },
  petal_006: { name: 'Soft Dawn Rose', meaning: 'You make my whole world brighter' },
  petal_007: { name: 'Porcelain Blush Rose', meaning: 'Admiration for your gentle soul' },
  petal_008: { name: 'Scarlet Kiss Blossom', meaning: 'Every beat of my heart is yours' },
  petal_009: { name: 'Dreamy Pink Peony Rose', meaning: 'Endless sweet memories together' },
  petal_010: { name: 'Rose Quartz Bloom', meaning: 'Unconditional warmth and care' },
  petal_011: { name: 'Silk Petal Rose', meaning: 'Grace, beauty, and kindness' },
  petal_012: { name: 'Sunset Blush Rose', meaning: 'Thinking of you every single moment' },
  petal_013: { name: 'Eternal Spring Rose', meaning: 'A love that blooms forever' },
  petal_014: { name: 'Crown Jewel Rose', meaning: 'You are my favorite person in the world' },
  smallplantA_petals: { name: 'Starlight Filler Blossoms', meaning: 'Little sparks of joy you bring me' },
  smallplantB_petals: { name: "Baby's Breath Cloud", meaning: 'Everlasting sincerity and pure love' },
  smallplantB1_petals: { name: "Baby's Breath Sprig", meaning: 'Whispered promises of forever' },
  smallplantB2_petals: { name: 'Delicate White Blossoms', meaning: 'Innocent, wholehearted affection' },
  smallplantB3_petals: { name: 'Meadow Mist Flowers', meaning: 'Peace and comfort in your arms' },
  smallplantC_petals: { name: 'Wildflower Accent', meaning: 'Adventures waiting for us ahead' },
  ribbon: { name: 'Sheer Organza Ribbon', meaning: 'Tying our hearts together always' },
  ribbon_knot: { name: 'Hand-Tied Bow', meaning: 'Wrapped with all my love for you' },
  parcel_knot: { name: 'Silk Bouquet Tie', meaning: 'Held close and cherished forever' }
};

// Compute ideal camera distance & viewport offset so the entire bouquet stays framed on the left
function getCameraFraming(width, height) {
  const aspect = Math.max(width / Math.max(height, 1), 0.5);
  if (width >= 1024) {
    // Ensure enough horizontal room so the left side of the bouquet never clips
    const zDist = Math.max(5.55, 7.2 / aspect);
    const xOffset = Math.round(width * 0.205);
    const yOffset = Math.round(height * -0.02);
    return { zDist, xOffset, yOffset, useOffset: true };
  }
  // Stacked mobile/tablet layout: place bouquet higher up above the message card
  const zDist = aspect < 0.8 ? 6.8 : 5.9;
  const xOffset = 0;
  const yOffset = Math.round(height * 0.14);
  return { zDist, xOffset, yOffset, useOffset: true };
}

export default function BouquetCanvas({ isRevealed, onBouquetClick }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const bouquetGroupRef = useRef(null);
  const fallingPetalsRef = useRef([]);
  const burstParticlesRef = useRef([]);
  const isRevealedRef = useRef(isRevealed);
  const onBouquetClickRef = useRef(onBouquetClick);
  const bloomAnimRef = useRef({ active: false, progress: 1, baseY: 0 });

  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [tooltipState, setTooltipState] = useState({ name: '', meaning: '', visible: false, x: 0, y: 0 });

  useEffect(() => {
    isRevealedRef.current = isRevealed;
  }, [isRevealed]);

  useEffect(() => {
    onBouquetClickRef.current = onBouquetClick;
  }, [onBouquetClick]);

  // Trigger smooth rise & bloom without fighting the render loop
  const triggerBloomAnimation = useCallback(() => {
    if (!bouquetGroupRef.current) return;
    bloomAnimRef.current = { active: true, startTime: performance.now(), duration: 2000 };
    bouquetGroupRef.current.position.y = -2.4;
    bouquetGroupRef.current.scale.setScalar(0.3);
    bouquetGroupRef.current.rotation.y = -0.4;
  }, []);

  // Handle smooth reset view
  const resetCamera = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const framing = getCameraFraming(window.innerWidth, window.innerHeight);
    const targetCamPos = new THREE.Vector3(0, 0.25, framing.zDist);
    const targetLookAt = new THREE.Vector3(0, 0.05, 0);

    const startPos = cameraRef.current.position.clone();
    const startLook = controlsRef.current.target.clone();
    let t = 0;

    const animReset = () => {
      t = Math.min(1, t + 0.06);
      const ease = 1 - Math.pow(1 - t, 3);
      cameraRef.current.position.lerpVectors(startPos, targetCamPos, ease);
      controlsRef.current.target.lerpVectors(startLook, targetLookAt, ease);
      controlsRef.current.update();
      if (t < 1) {
        requestAnimationFrame(animReset);
      }
    };
    animReset();
  }, []);

  useEffect(() => {
    const mountEl = mountRef.current;
    if (!mountEl) return;

    let isDisposed = false;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const framing = getCameraFraming(width, height);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.25, framing.zDist);
    if (framing.useOffset) {
      camera.setViewOffset(width, height, framing.xOffset, framing.yOffset, width, height);
    }
    camera.updateProjectionMatrix();
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mountEl.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3.0;
    controls.maxDistance = 8.5;
    controls.maxPolarAngle = Math.PI / 2 + 0.35;
    controls.minPolarAngle = Math.PI / 6;
    controls.target.set(0, 0.05, 0);
    controlsRef.current = controls;

    // 3. Sculptural Romantic Lighting (balanced so textures stay vivid & rich)
    const ambientLight = new THREE.AmbientLight(0xfff5f7, 1.18);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xfff7fa, 0xf5d0fe, 0.65);
    hemiLight.position.set(0, 8, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff6ed, 1.35);
    keyLight.position.set(4, 6, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 15;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0xffb3c6, 0.85, 16);
    fillLight.position.set(-4, 2, 4);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xe9d5ff, 1.05, 14);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    // 4. Bouquet Container Group
    const bouquetGroup = new THREE.Group();
    bouquetGroupRef.current = bouquetGroup;
    scene.add(bouquetGroup);

    // 5. Load the Wrapped Flower Bouquet FBX Model & All Textures via LoadingManager
    const manager = new THREE.LoadingManager();
    manager.onProgress = (_url, itemsLoaded, itemsTotal) => {
      if (!isDisposed && itemsTotal > 0) {
        setLoadProgress(Math.round((itemsLoaded / itemsTotal) * 100));
      }
    };
    manager.onLoad = () => {
      if (isDisposed) return;
      setIsLoadingModel(false);
      if (isRevealedRef.current) {
        triggerBloomAnimation();
      }
    };

    const baseUrl = import.meta.env.BASE_URL || '/';
    const fbxLoader = new FBXLoader(manager);
    fbxLoader.setResourcePath(`${baseUrl}bouquet/fbx/textures/`);

    fbxLoader.load(
      `${baseUrl}bouquet/fbx/SM_BuquetA_v1.1.fbx`,
      (fbxModel) => {
        if (isDisposed) return;

        // Normalize model size so the whole wrapped bouquet (blooms to bow) fits cleanly
        const box = new THREE.Box3().setFromObject(fbxModel);
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        box.getCenter(center);
        box.getSize(size);

        const maxDim = Math.max(size.x, size.y, size.z);
        const targetHeight = 2.7;
        const modelScale = targetHeight / (maxDim || 64);

        fbxModel.scale.setScalar(modelScale);
        fbxModel.position.set(
          -center.x * modelScale,
          -center.y * modelScale - 0.04,
          -center.z * modelScale
        );
        // Subtle upright angle so roses face forward cleanly without hiding the ribbon
        fbxModel.rotation.x = 0.14;

        // Configure materials & attach flower hover metadata
        fbxModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            const meaningInfo = FLOWER_MEANINGS[child.name] || (
              child.name.startsWith('petal_')
                ? { name: 'Handcrafted Rose Blossom', meaning: 'Every petal holds a piece of my love' }
                : child.name.startsWith('leaf_')
                ? { name: 'Botanical Foliage', meaning: 'Growing closer with you every day' }
                : null
            );

            if (meaningInfo) {
              child.userData = { ...child.userData, ...meaningInfo };
            }

            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((mat) => {
              if (!mat) return;
              if (mat.color) {
                mat.color.setHex(0xffffff);
              }
              if (mat.specular) {
                mat.specular.setHex(mat.name === 'Ribbons1' ? 0x2b2b2b : 0x080808);
              }
              if (mat.shininess !== undefined) {
                mat.shininess = mat.name === 'Ribbons1' ? 32 : 5;
              }
              if (mat.map) {
                mat.map.colorSpace = THREE.SRGBColorSpace;
                mat.map.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
              }
              if (mat.name === 'Ribbons1') {
                mat.transparent = true;
                mat.opacity = 0.82;
                mat.depthWrite = false;
              } else {
                mat.transparent = false;
                mat.opacity = 1.0;
                mat.depthWrite = true;
              }
              mat.side = THREE.DoubleSide;
            });
          }
        });

        bouquetGroup.add(fbxModel);
      },
      undefined,
      (err) => {
        console.error('Error loading wrapped flower bouquet FBX:', err);
        setIsLoadingModel(false);
      }
    );

    // 6. 3D Drifting Background Petals
    const fallingPetals = [];
    const petalGeom = createRosePetalGeometry(0.18, 0.27, 0.14);
    const petalColors = [0xfb7185, 0xff8fa3, 0xf43f5e, 0xfce7f3, 0xe0aaff];

    for (let p = 0; p < 55; p++) {
      const pColor = petalColors[p % petalColors.length];
      const pMat = new THREE.MeshStandardMaterial({
        color: pColor,
        roughness: 0.5,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.78
      });
      const pMesh = new THREE.Mesh(petalGeom, pMat);
      pMesh.position.set(
        (Math.random() - 0.5) * 14,
        Math.random() * 9 - 3.5,
        (Math.random() - 0.5) * 8 - 1.5
      );
      pMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      pMesh.scale.setScalar(0.6 + Math.random() * 0.5);
      pMesh.userData = {
        speedY: 0.006 + Math.random() * 0.011,
        rotSpeedX: 0.01 + Math.random() * 0.02,
        rotSpeedY: 0.015 + Math.random() * 0.025,
        swingOffset: Math.random() * Math.PI * 2,
        swingSpeed: 0.8 + Math.random() * 0.8
      };
      scene.add(pMesh);
      fallingPetals.push(pMesh);
    }
    fallingPetalsRef.current = fallingPetals;

    // 7. Raycasting for flower hover & click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredMesh = null;

    const setMeshHighlight = (mesh, highlighted) => {
      if (!mesh || !mesh.material) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => {
        if (m && m.emissive) {
          m.emissive.setHex(highlighted ? 0x3b0a18 : 0x000000);
        }
      });
    };

    const onPointerMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(bouquetGroup.children, true);

      let foundFlower = null;
      if (intersects.length > 0) {
        for (const hit of intersects) {
          let obj = hit.object;
          while (obj && obj !== bouquetGroup && obj !== scene) {
            if (obj.userData && obj.userData.name) {
              foundFlower = obj;
              break;
            }
            obj = obj.parent;
          }
          if (foundFlower) break;
        }
      }

      if (foundFlower !== hoveredMesh) {
        if (hoveredMesh) {
          setMeshHighlight(hoveredMesh, false);
        }
        hoveredMesh = foundFlower;

        if (hoveredMesh && hoveredMesh.userData) {
          setMeshHighlight(hoveredMesh, true);
          setTooltipState({
            name: hoveredMesh.userData.name,
            meaning: hoveredMesh.userData.meaning,
            visible: true,
            x: e.clientX,
            y: e.clientY
          });
        } else {
          setTooltipState({ name: '', meaning: '', visible: false, x: 0, y: 0 });
        }
      } else if (hoveredMesh) {
        setTooltipState((prev) => ({ ...prev, x: e.clientX, y: e.clientY }));
      }
    };

    const onPointerLeave = () => {
      if (hoveredMesh) {
        setMeshHighlight(hoveredMesh, false);
        hoveredMesh = null;
      }
      setTooltipState({ name: '', meaning: '', visible: false, x: 0, y: 0 });
    };

    const onCanvasClick = (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(bouquetGroup.children, true);

      romanticAudio.playSparkle();

      let burstOrigin = new THREE.Vector3(0, 0.3, 0.4);
      if (intersects.length > 0) {
        burstOrigin = intersects[0].point.clone();
      }

      const burstGeom = createRosePetalGeometry(0.15, 0.22, 0.16);
      const colors = [0xf43f5e, 0xfb7185, 0xff8fa3, 0xfda4af, 0xfff0f3];

      for (let b = 0; b < 24; b++) {
        const bMat = new THREE.MeshStandardMaterial({
          color: colors[b % colors.length],
          roughness: 0.4,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 1
        });
        const bMesh = new THREE.Mesh(burstGeom, bMat);
        bMesh.position.copy(burstOrigin);
        bMesh.scale.setScalar(0.4 + Math.random() * 0.4);

        const angle = Math.random() * Math.PI * 2;
        const speed = 0.032 + Math.random() * 0.055;
        const elevation = 0.025 + Math.random() * 0.06;

        bMesh.userData = {
          vx: Math.cos(angle) * speed,
          vy: elevation,
          vz: Math.sin(angle) * speed,
          rotSpeed: (Math.random() - 0.5) * 0.22,
          life: 1.0,
          decay: 0.014 + Math.random() * 0.008
        };
        scene.add(bMesh);
        burstParticlesRef.current.push(bMesh);
      }

      if (onBouquetClickRef.current) {
        onBouquetClickRef.current(e);
      }
    };

    mountEl.addEventListener('pointermove', onPointerMove);
    mountEl.addEventListener('pointerleave', onPointerLeave);
    mountEl.addEventListener('click', onCanvasClick);

    // 8. Responsive Resize Handler
    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w === 0 || h === 0) return;

      const nextFraming = getCameraFraming(w, h);
      camera.aspect = w / h;
      camera.position.z = nextFraming.zDist;
      if (nextFraming.useOffset) {
        camera.setViewOffset(w, h, nextFraming.xOffset, nextFraming.yOffset, w, h);
      } else {
        camera.clearViewOffset();
      }
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 9. Main Render Animation Loop (uses performance.now to avoid THREE.Clock deprecation)
    let animId;
    const startPerf = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const elapsedTime = (now - startPerf) / 1000;

      // Bloom transition OR gentle floating & breathing motion
      if (bouquetGroupRef.current) {
        if (bloomAnimRef.current.active) {
          const bloomElapsed = now - bloomAnimRef.current.startTime;
          const progress = Math.min(1, bloomElapsed / bloomAnimRef.current.duration);
          const ease = 1 - Math.pow(1 - progress, 3);
          bouquetGroupRef.current.position.y = -2.4 * (1 - ease);
          bouquetGroupRef.current.scale.setScalar(0.3 + 0.7 * ease);
          bouquetGroupRef.current.rotation.y = -0.4 * (1 - ease);
          if (progress >= 1) {
            bloomAnimRef.current.active = false;
          }
        } else {
          bouquetGroupRef.current.position.y = Math.sin(elapsedTime * 1.15) * 0.05;
          bouquetGroupRef.current.rotation.y = Math.sin(elapsedTime * 0.4) * 0.1;
        }
      }

      // Update falling background petals
      fallingPetalsRef.current.forEach((petal) => {
        petal.position.y -= petal.userData.speedY;
        petal.position.x += Math.sin(elapsedTime * petal.userData.swingSpeed + petal.userData.swingOffset) * 0.005;
        petal.rotation.x += petal.userData.rotSpeedX;
        petal.rotation.y += petal.userData.rotSpeedY;

        if (petal.position.y < -4.5) {
          petal.position.y = 5.5;
          petal.position.x = (Math.random() - 0.5) * 14;
        }
      });

      // Update interactive burst particles
      for (let i = burstParticlesRef.current.length - 1; i >= 0; i--) {
        const bp = burstParticlesRef.current[i];
        bp.position.x += bp.userData.vx;
        bp.position.y += bp.userData.vy;
        bp.position.z += bp.userData.vz;
        bp.userData.vy -= 0.0018;
        bp.rotation.x += bp.userData.rotSpeed;
        bp.rotation.y += bp.userData.rotSpeed;

        bp.userData.life -= bp.userData.decay;
        if (bp.material) {
          bp.material.opacity = Math.max(0, bp.userData.life);
        }

        if (bp.userData.life <= 0) {
          scene.remove(bp);
          if (bp.geometry) bp.geometry.dispose();
          if (bp.material) bp.material.dispose();
          burstParticlesRef.current.splice(i, 1);
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      mountEl.removeEventListener('pointermove', onPointerMove);
      mountEl.removeEventListener('pointerleave', onPointerLeave);
      mountEl.removeEventListener('click', onCanvasClick);
      if (renderer.domElement && mountEl.contains(renderer.domElement)) {
        mountEl.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [triggerBloomAnimation]);

  // Trigger bloom animation when revealed
  useEffect(() => {
    if (isRevealed && !isLoadingModel) {
      triggerBloomAnimation();
    }
  }, [isRevealed, isLoadingModel, triggerBloomAnimation]);

  return (
    <div className="bouquet-canvas-container relative w-full h-full select-none cursor-grab active:cursor-grabbing overflow-hidden">
      {/* Soft Halo Glow BEHIND the 3D Bouquet Canvas (never washes out the flowers) */}
      <div
        className="pointer-events-none fixed inset-0 transition-opacity duration-1000"
        style={{
          zIndex: 0,
          opacity: isRevealed ? 0.9 : 0,
          background:
            'radial-gradient(circle at 29% 52%, rgba(255, 255, 255, 0.55) 0%, rgba(254, 205, 211, 0.35) 26%, transparent 56%)'
        }}
      />

      {/* Three.js canvas container rendered ON TOP of the soft halo */}
      <div ref={mountRef} className="relative w-full h-full" style={{ zIndex: 1, touchAction: 'none' }} />

      {/* Loading Indicator while FBX Bouquet & Textures Load */}
      {isLoadingModel && (
        <div className="fixed inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
          <div className="glass-pill px-5 py-3 rounded-full flex items-center gap-3 text-rose-700 font-serif text-sm">
            <span className="animate-pulse text-lg">💐</span>
            <span>Wrapping your bouquet{loadProgress > 0 ? ` (${loadProgress}%)` : '...'}</span>
          </div>
        </div>
      )}

      {/* Romantic Flower Tooltip on Hover */}
      {tooltipState.visible && (
        <div
          className="flower-tooltip fixed pointer-events-none z-50 px-4 py-2 rounded-2xl glass-card animate-fade-in"
          style={{
            left: `${tooltipState.x}px`,
            top: `${tooltipState.y - 16}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="font-serif font-semibold text-rose-800 text-sm">
            {tooltipState.name}
          </div>
          <div className="text-xs text-rose-600 italic">
            "{tooltipState.meaning}"
          </div>
        </div>
      )}

      {/* Bottom Controls under the Bouquet */}
      {isRevealed && (
        <div className="bouquet-controls-bar fixed z-20 pointer-events-none">
          <button
            onClick={resetCamera}
            id="btn-reset-view"
            aria-label="Reset bouquet viewing angle"
            className="reset-view-btn flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium text-rose-700 glass-pill pointer-events-auto"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Reset View</span>
          </button>

          <div className="interaction-hint-pill flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill text-xs text-rose-800">
            <span>✨ Drag to rotate · Scroll to zoom · Tap flowers for petals</span>
          </div>
        </div>
      )}
    </div>
  );
}
