import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as THREE from "three";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { X, ExternalLink, Github, Mail, Linkedin, Phone, ChevronDown, ArrowRight, Moon, Sun, Filter, Code2, Cpu, Database, Globe, Shield, Terminal, Award, GraduationCap, Briefcase, Calendar, Zap } from "lucide-react";

// ===== 3D BOY HEAD MODEL =====
function Head3D({ chaos }) {
  const mountRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const chaosRef = useRef(0);
  const partsRef = useRef([]);
  const explosionVelocities = useRef([]);

  useEffect(() => { chaosRef.current = chaos; }, [chaos]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || typeof THREE === 'undefined') return;

    const w = 400, h = 450;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
    camera.position.set(0, 0.5, 6.5);

    // -- MATERIALS --
    const skinMat = new THREE.MeshPhongMaterial({ color: 0xd4a574, shininess: 40, flatShading: false });
    const skinDarkMat = new THREE.MeshPhongMaterial({ color: 0xc4946a, shininess: 30 });
    const hairMat = new THREE.MeshPhongMaterial({ color: 0x1a1a2e, shininess: 60, flatShading: true });
    const eyeWhiteMat = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 80 });
    const irisMat = new THREE.MeshPhongMaterial({ color: 0x2c1810, shininess: 100 });
    const pupilMat = new THREE.MeshPhongMaterial({ color: 0x050505, shininess: 120 });
    const lipMat = new THREE.MeshPhongMaterial({ color: 0xb07060, shininess: 50 });
    const glassMat = new THREE.MeshPhongMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.25, shininess: 120 });
    const glassFrameMat = new THREE.MeshPhongMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.6, wireframe: false, shininess: 100 });
    const hoodMat = new THREE.MeshPhongMaterial({ color: 0x12121a, shininess: 20 });
    const accentMat = new THREE.MeshPhongMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 0.3, shininess: 120 });

    const headGroup = new THREE.Group();
    const parts = [];

    // Helper to track parts for explosion
    const addPart = (mesh, explosionForce = 1) => {
      headGroup.add(mesh);
      parts.push(mesh);
      explosionVelocities.current.push({
        vx: (Math.random() - 0.5) * 8 * explosionForce,
        vy: (Math.random() * 6 + 3) * explosionForce,
        vz: (Math.random() - 0.5) * 8 * explosionForce,
        rx: (Math.random() - 0.5) * 6,
        ry: (Math.random() - 0.5) * 6,
        rz: (Math.random() - 0.5) * 6,
        origPos: mesh.position.clone(),
        origRot: mesh.rotation.clone(),
        offset: { x: 0, y: 0, z: 0 },
        rotOff: { x: 0, y: 0, z: 0 },
      });
    };

    // -- HEAD (main sphere) --
    const headGeo = new THREE.SphereGeometry(1.1, 32, 32);
    headGeo.scale(1, 1.18, 1.05);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 0.2;
    head.castShadow = true;
    addPart(head, 0.3);

    // -- HAIR (multiple pieces for explosion effect) --
    // Top hair
    const hairTopGeo = new THREE.SphereGeometry(1.18, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
    hairTopGeo.scale(1.02, 1.15, 1.08);
    const hairTop = new THREE.Mesh(hairTopGeo, hairMat);
    hairTop.position.y = 0.35;
    addPart(hairTop, 1.5);

    // Hair left side
    const hairSideGeoL = new THREE.SphereGeometry(0.35, 12, 8);
    hairSideGeoL.scale(0.6, 1.3, 0.9);
    const hairLeft = new THREE.Mesh(hairSideGeoL, hairMat);
    hairLeft.position.set(-1.0, 0.1, 0.15);
    addPart(hairLeft, 1.8);

    // Hair right side
    const hairSideGeoR = new THREE.SphereGeometry(0.35, 12, 8);
    hairSideGeoR.scale(0.6, 1.3, 0.9);
    const hairRight = new THREE.Mesh(hairSideGeoR, hairMat);
    hairRight.position.set(1.0, 0.1, 0.15);
    addPart(hairRight, 1.8);

    // Hair back volume
    const hairBackGeo = new THREE.SphereGeometry(1.1, 16, 12);
    hairBackGeo.scale(1.05, 1.1, 0.9);
    const hairBack = new THREE.Mesh(hairBackGeo, hairMat);
    hairBack.position.set(0, 0.3, -0.25);
    addPart(hairBack, 1.2);

    // Fringe / bangs pieces
    for (let i = 0; i < 5; i++) {
      const fringeGeo = new THREE.SphereGeometry(0.2 + Math.random() * 0.15, 8, 6);
      fringeGeo.scale(1.2, 0.6, 1);
      const fringe = new THREE.Mesh(fringeGeo, hairMat);
      const angle = -0.6 + (i / 4) * 1.2;
      fringe.position.set(Math.sin(angle) * 0.9, 1.1 + Math.random() * 0.15, Math.cos(angle) * 0.5 + 0.5);
      addPart(fringe, 2.0);
    }

    // -- EARS --
    const earGeo = new THREE.SphereGeometry(0.18, 12, 8);
    earGeo.scale(0.6, 1.2, 1);
    const earL = new THREE.Mesh(earGeo, skinDarkMat);
    earL.position.set(-1.12, 0.05, 0.1);
    addPart(earL, 1.5);

    const earR = new THREE.Mesh(earGeo.clone(), skinDarkMat);
    earR.position.set(1.12, 0.05, 0.1);
    addPart(earR, 1.5);

    // -- EYES --
    // Eye whites
    const eyeGeo = new THREE.SphereGeometry(0.2, 16, 12);
    eyeGeo.scale(1.3, 1, 1);
    const eyeL = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    eyeL.position.set(-0.38, 0.2, 0.9);
    addPart(eyeL, 2.0);

    const eyeR = new THREE.Mesh(eyeGeo.clone(), eyeWhiteMat);
    eyeR.position.set(0.38, 0.2, 0.9);
    addPart(eyeR, 2.0);

    // Irises
    const irisGeo = new THREE.SphereGeometry(0.12, 12, 8);
    const irisL = new THREE.Mesh(irisGeo, irisMat);
    irisL.position.set(-0.36, 0.2, 1.08);
    addPart(irisL, 2.2);

    const irisR = new THREE.Mesh(irisGeo.clone(), irisMat);
    irisR.position.set(0.36, 0.2, 1.08);
    addPart(irisR, 2.2);

    // Pupils
    const pupilGeo = new THREE.SphereGeometry(0.06, 8, 6);
    const pupilL = new THREE.Mesh(pupilGeo, pupilMat);
    pupilL.position.set(-0.35, 0.2, 1.16);
    addPart(pupilL, 2.5);

    const pupilR = new THREE.Mesh(pupilGeo.clone(), pupilMat);
    pupilR.position.set(0.35, 0.2, 1.16);
    addPart(pupilR, 2.5);

    // Eye shine
    const shineGeo = new THREE.SphereGeometry(0.035, 8, 6);
    const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const shineL = new THREE.Mesh(shineGeo, shineMat);
    shineL.position.set(-0.32, 0.24, 1.18);
    addPart(shineL, 2.5);
    const shineR = new THREE.Mesh(shineGeo.clone(), shineMat);
    shineR.position.set(0.38, 0.24, 1.18);
    addPart(shineR, 2.5);

    // -- EYEBROWS --
    const browGeo = new THREE.BoxGeometry(0.35, 0.06, 0.08);
    const browMat = new THREE.MeshPhongMaterial({ color: 0x1a1a2e });
    const browL = new THREE.Mesh(browGeo, browMat);
    browL.position.set(-0.38, 0.45, 0.95);
    browL.rotation.z = 0.1;
    addPart(browL, 2.0);
    const browR = new THREE.Mesh(browGeo.clone(), browMat);
    browR.position.set(0.38, 0.45, 0.95);
    browR.rotation.z = -0.1;
    addPart(browR, 2.0);

    // -- NOSE --
    const noseGeo = new THREE.SphereGeometry(0.12, 10, 8);
    noseGeo.scale(0.8, 1.2, 1);
    const nose = new THREE.Mesh(noseGeo, skinDarkMat);
    nose.position.set(0, -0.05, 1.1);
    addPart(nose, 1.8);

    // Nose bridge
    const noseBridgeGeo = new THREE.BoxGeometry(0.08, 0.3, 0.1);
    const noseBridge = new THREE.Mesh(noseBridgeGeo, skinMat);
    noseBridge.position.set(0, 0.1, 1.0);
    addPart(noseBridge, 1.5);

    // -- MOUTH --
    const mouthGeo = new THREE.TorusGeometry(0.15, 0.035, 8, 16, Math.PI);
    const mouth = new THREE.Mesh(mouthGeo, lipMat);
    mouth.position.set(0, -0.32, 1.0);
    mouth.rotation.x = 0.1;
    addPart(mouth, 1.8);

    // -- GLASSES (cyber style) --
    // Left lens
    const lensGeoL = new THREE.TorusGeometry(0.28, 0.025, 8, 4);
    const lensL = new THREE.Mesh(lensGeoL, glassFrameMat);
    lensL.position.set(-0.38, 0.2, 1.0);
    lensL.rotation.set(0, 0, Math.PI / 4);
    addPart(lensL, 2.5);

    // Left lens fill
    const lensFillGeo = new THREE.CircleGeometry(0.25, 4);
    const lensFillL = new THREE.Mesh(lensFillGeo, glassMat);
    lensFillL.position.set(-0.38, 0.2, 0.99);
    lensFillL.rotation.z = Math.PI / 4;
    addPart(lensFillL, 2.5);

    // Right lens
    const lensR = new THREE.Mesh(lensGeoL.clone(), glassFrameMat);
    lensR.position.set(0.38, 0.2, 1.0);
    lensR.rotation.set(0, 0, Math.PI / 4);
    addPart(lensR, 2.5);

    const lensFillR = new THREE.Mesh(lensFillGeo.clone(), glassMat);
    lensFillR.position.set(0.38, 0.2, 0.99);
    lensFillR.rotation.z = Math.PI / 4;
    addPart(lensFillR, 2.5);

    // Bridge
    const bridgeGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.2, 6);
    const bridge = new THREE.Mesh(bridgeGeo, glassFrameMat);
    bridge.position.set(0, 0.24, 1.05);
    bridge.rotation.z = Math.PI / 2;
    addPart(bridge, 2.0);

    // Temple arms
    const armGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.8, 6);
    const armL = new THREE.Mesh(armGeo, glassFrameMat);
    armL.position.set(-0.68, 0.2, 0.6);
    armL.rotation.x = Math.PI / 2;
    armL.rotation.z = 0.15;
    addPart(armL, 2.0);
    const armR = new THREE.Mesh(armGeo.clone(), glassFrameMat);
    armR.position.set(0.68, 0.2, 0.6);
    armR.rotation.x = Math.PI / 2;
    armR.rotation.z = -0.15;
    addPart(armR, 2.0);

    // -- HOODIE / NECK --
    const neckGeo = new THREE.CylinderGeometry(0.4, 0.5, 0.5, 16);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.y = -1.2;
    addPart(neck, 0.5);

    const hoodGeo = new THREE.SphereGeometry(1.0, 16, 12, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.45);
    hoodGeo.scale(1.35, 1.1, 1.2);
    const hood = new THREE.Mesh(hoodGeo, hoodMat);
    hood.position.y = -0.9;
    addPart(hood, 0.8);

    // Hoodie strings
    const stringGeo = new THREE.CylinderGeometry(0.01, 0.015, 0.4, 6);
    const stringL = new THREE.Mesh(stringGeo, accentMat);
    stringL.position.set(-0.2, -1.5, 0.9);
    addPart(stringL, 2.5);
    const stringR = new THREE.Mesh(stringGeo.clone(), accentMat);
    stringR.position.set(0.2, -1.5, 0.9);
    addPart(stringR, 2.5);

    // String tips (glowing)
    const tipGeo = new THREE.SphereGeometry(0.03, 8, 6);
    const tipL = new THREE.Mesh(tipGeo, accentMat);
    tipL.position.set(-0.2, -1.72, 0.9);
    addPart(tipL, 3.0);
    const tipR = new THREE.Mesh(tipGeo.clone(), accentMat);
    tipR.position.set(0.2, -1.72, 0.9);
    addPart(tipR, 3.0);

    // -- ORBITING RINGS --
    const ringGeo1 = new THREE.TorusGeometry(2.0, 0.008, 8, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.2 });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI * 0.4;
    ring1.rotation.y = 0.3;
    addPart(ring1, 3.0);

    const ringGeo2 = new THREE.TorusGeometry(2.3, 0.006, 8, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x7c4dff, transparent: true, opacity: 0.15 });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = Math.PI * 0.55;
    ring2.rotation.z = 0.5;
    addPart(ring2, 3.0);

    // Orbiting dots
    const dotGeo = new THREE.SphereGeometry(0.04, 8, 6);
    const dotMat1 = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const dot1 = new THREE.Mesh(dotGeo, dotMat1);
    addPart(dot1, 3.5);
    const dotMat2 = new THREE.MeshBasicMaterial({ color: 0x7c4dff });
    const dot2 = new THREE.Mesh(dotGeo.clone(), dotMat2);
    addPart(dot2, 3.5);
    const dotMat3 = new THREE.MeshBasicMaterial({ color: 0xff4081 });
    const dot3 = new THREE.Mesh(dotGeo.clone(), dotMat3);
    addPart(dot3, 3.5);

    partsRef.current = parts;
    scene.add(headGroup);

    // -- LIGHTING --
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(3, 4, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x00e5ff, 0.3);
    fillLight.position.set(-3, 1, 3);
    scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0x7c4dff, 0.4);
    rimLight.position.set(0, 2, -3);
    scene.add(rimLight);
    const bottomLight = new THREE.PointLight(0x00e5ff, 0.3, 10);
    bottomLight.position.set(0, -3, 2);
    scene.add(bottomLight);

    // -- MOUSE TRACKING --
    const onMouse = (e) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
        y: -((e.clientY - rect.top) / rect.height - 0.5) * 2,
      };
    };
    container.addEventListener('mousemove', onMouse);

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = Date.now() * 0.001;
      const c = chaosRef.current;

      // Gentle floating
      headGroup.position.y = Math.sin(t * 0.8) * 0.08;

      // Head follows mouse
      const targetRotY = mouseRef.current.x * 0.5;
      const targetRotX = -mouseRef.current.y * 0.3;
      headGroup.rotation.y += (targetRotY - headGroup.rotation.y) * 0.06;
      headGroup.rotation.x += (targetRotX - headGroup.rotation.x) * 0.06;

      // Orbiting rings
      ring1.rotation.z = t * 0.4;
      ring2.rotation.z = -t * 0.3;

      // Orbiting dots
      dot1.position.set(Math.cos(t * 1.2) * 2.0, Math.sin(t * 1.2) * 0.8, Math.sin(t * 1.2) * 2.0);
      dot2.position.set(Math.cos(t * 0.9 + 2) * 2.3, Math.sin(t * 0.9 + 2) * 1.0, Math.sin(t * 0.9 + 2) * 2.3);
      dot3.position.set(Math.cos(t * 1.5 + 4) * 1.8, Math.sin(t * 1.5 + 4) * 1.2, Math.sin(t * 1.5 + 4) * 1.8);

      // ANTI-GRAVITY EXPLOSION
      if (c > 0.02) {
        parts.forEach((part, i) => {
          const ev = explosionVelocities.current[i];
          if (!ev) return;

          ev.offset.x += ev.vx * c * 0.15;
          ev.offset.y += ev.vy * c * 0.2;
          ev.offset.z += ev.vz * c * 0.15;
          ev.rotOff.x += ev.rx * c * 0.08;
          ev.rotOff.y += ev.ry * c * 0.08;
          ev.rotOff.z += ev.rz * c * 0.08;

          // Add wobble
          const wobbleX = Math.sin(t * (1 + i * 0.3)) * c * 0.3;
          const wobbleY = Math.cos(t * (0.8 + i * 0.2)) * c * 0.3;

          part.position.set(
            ev.origPos.x + ev.offset.x + wobbleX,
            ev.origPos.y + ev.offset.y + wobbleY,
            ev.origPos.z + ev.offset.z
          );
          part.rotation.set(
            ev.origRot.x + ev.rotOff.x,
            ev.origRot.y + ev.rotOff.y,
            ev.origRot.z + ev.rotOff.z
          );
        });

        // Pulsing glow in chaos
        fillLight.intensity = 0.3 + Math.sin(t * 4) * c * 0.5;
        bottomLight.intensity = 0.3 + Math.cos(t * 3) * c * 0.4;
      } else {
        // Snap back
        parts.forEach((part, i) => {
          const ev = explosionVelocities.current[i];
          if (!ev) return;
          ev.offset.x *= 0.88; ev.offset.y *= 0.88; ev.offset.z *= 0.88;
          ev.rotOff.x *= 0.88; ev.rotOff.y *= 0.88; ev.rotOff.z *= 0.88;

          part.position.set(
            ev.origPos.x + ev.offset.x,
            ev.origPos.y + ev.offset.y,
            ev.origPos.z + ev.offset.z
          );
          part.rotation.set(
            ev.origRot.x + ev.rotOff.x,
            ev.origRot.y + ev.rotOff.y,
            ev.origRot.z + ev.rotOff.z
          );
        });
        fillLight.intensity = 0.3;
        bottomLight.intensity = 0.3;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousemove', onMouse);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: 400, height: 450, flexShrink: 0 }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />
      {/* HUD overlay */}
      <div style={{ position: 'absolute', top: 12, right: 12, fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#7c4dff', opacity: 0.4, letterSpacing: '0.15em', textAlign: 'right' }}>
        ID:OT-007<br/>STATUS:ACTIVE
      </div>
      <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#00e5ff', background: 'rgba(10,10,15,0.7)', border: '1px solid rgba(0,229,255,0.2)', padding: '4px 12px', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 5, height: 5, background: chaos > 0.1 ? '#ff4081' : '#0f6', borderRadius: '50%', boxShadow: `0 0 6px ${chaos > 0.1 ? '#ff4081' : '#0f6'}` }} />
        {chaos > 0.1 ? 'GRAVITY ANOMALY' : 'SYSTEMS NOMINAL'}
      </div>
    </div>
  );
}

// ===== DATA =====
const projects = [
  { id:1, cat:"security", idx:"01", name:"Secure Open Chat Protocol (SOCP)", short:"WebSocket-based encrypted messaging with RSA-4096 & asyncio", desc:"Designed the core server architecture and implemented WebSocket handling for a secure, asynchronous messaging system. Engineered the message routing mechanism and utilized Python's asyncio library to successfully manage multiple parallel connections. Led the project's intentional backdoor implementation strategy, designing vulnerabilities for peer-review security auditing. Integrated RSA-4096 encryption and canonical JSON serialization to ensure strict signature verification across the network.", tech:["Python","WebSockets","asyncio","RSA-4096","JSON"], metric:"RSA-4096", metricLabel:"Encryption", features:["Asynchronous message routing","RSA-4096 end-to-end encryption","Canonical JSON serialization","Peer-review security auditing","Multi-connection management"], challenges:"Managing concurrent WebSocket connections while maintaining encryption integrity was the core challenge. Solved by implementing an async event loop with dedicated encryption/decryption pipelines per connection.", year:"2025-2026", color:"#00e5ff", github:"https://github.com/Omkarth" },
  { id:2, cat:"iot", idx:"02", name:"IoT Smart Logistics System", short:"Real-time tracking system reducing delivery delays by 40-50%", desc:"Developed an IoT-powered system to streamline logistics and transportation with real-time tracking and resource optimization. Integrated IoT sensors and cloud analytics, reducing delivery delays by 40-50% through automated route planning. Enhanced operational efficiency by 60% with predictive maintenance and data-driven insights.", tech:["IoT","Python","MQTT","AWS","Cloud Computing"], metric:"-50%", metricLabel:"Delivery Delays", features:["Real-time GPS tracking","Automated route optimization","Predictive maintenance alerts","Cloud-based analytics dashboard","MQTT sensor integration"], challenges:"Handling real-time data streams from hundreds of IoT sensors while maintaining low latency. Implemented MQTT message queuing with AWS IoT Core for scalable ingestion.", year:"2024-2025", color:"#7c4dff", github:"https://github.com/Omkarth" },
  { id:3, cat:"ai", idx:"03", name:"Human Action Detection", short:"95% accuracy real-time detection in video via MATLAB & ML", desc:"Built a system for real-time human action and object detection in videos using MATLAB, targeting surveillance applications. Achieved 95% accuracy in detection by leveraging computer vision and machine learning algorithms. Reduced processing time by 80% through optimized feature extraction and model training.", tech:["MATLAB","OpenCV","Neural Networks","Computer Vision","ML"], metric:"95%", metricLabel:"Accuracy", features:["Real-time video processing","Multi-action classification","Object detection overlay","Optimized feature extraction","Surveillance-grade performance"], challenges:"Achieving real-time performance with high accuracy required innovative feature extraction. Implemented a pipeline that reduced processing time by 80% while maintaining 95% detection accuracy.", year:"2023-2024", color:"#ff4081", github:"https://github.com/Omkarth" },
  { id:4, cat:"web", idx:"04", name:"Virtual Queuing System", short:"Ration distribution system boosting efficiency by 50%", desc:"Designed a virtual queuing system to improve ration distribution, minimizing wait times for beneficiaries. Automated scheduling and notifications, increasing distribution efficiency by 50%. Improved accessibility for users through a user-friendly interface and real-time updates.", tech:["Python","JavaScript","MySQL","Web Frameworks","Mobile Dev"], metric:"+50%", metricLabel:"Efficiency", features:["Virtual queue management","Automated SMS notifications","Real-time status updates","Mobile-responsive interface","Admin analytics dashboard"], challenges:"Designing a system accessible to users with varying tech literacy. Built a progressive web app with SMS fallback for notifications and an extremely simplified UI flow.", year:"2022-2023", color:"#ffc107", github:"https://github.com/Omkarth" },
];

const skills = {
  languages: ["JavaScript","TypeScript","Python","C/C++","SQL","HTML/CSS/Sass"],
  frameworks: ["React JS","Next JS","Node JS","Express JS","Tailwind CSS","Firebase","MongoDB","Bootstrap"],
  tools: ["Git/GitHub","VS Code","Postman","Figma","Vercel","Netlify","Drizzle ORM","AWS"],
};

const radarData = [
  { skill:"Frontend", val:90 }, { skill:"Backend", val:80 },
  { skill:"Security", val:85 }, { skill:"IoT", val:75 },
  { skill:"ML/AI", val:70 }, { skill:"Cloud", val:78 },
];

const certs = [
  { issuer:"RangeForce", name:"Secure Coding", date:"Sep 2025" },
  { issuer:"Google", name:"Intro to Generative AI", date:"Oct 2023" },
  { issuer:"Google", name:"Cloud: Data, ML & AI", date:"Oct 2023" },
  { issuer:"Google", name:"Build & Secure Networks GCP", date:"Oct 2023" },
  { issuer:"Google", name:"Cloud Networking", date:"Oct 2023" },
  { issuer:"Google", name:"Cloud Infrastructure", date:"Oct 2023" },
  { issuer:"Google", name:"Cloud Fundamentals", date:"Oct 2023" },
  { issuer:"Google", name:"Manage Cloud Resources", date:"Oct 2023" },
  { issuer:"Google", name:"Level 3: GenAI", date:"Sep 2023" },
  { issuer:"GDSC", name:"Developer Student Club", date:"Sep 2023" },
  { issuer:"HCL GUVI", name:"Google Education — Python", date:"Sep 2023" },
  { issuer:"HCL GUVI", name:"Google — Cybersecurity", date:"Aug 2023" },
  { issuer:"HCL GUVI", name:"ISO 9001 Lead Implementer", date:"Aug 2023" },
  { issuer:"Academor", name:"Flutura — Data Science", date:"Sep 2023" },
];

const catIcons = { all:Filter, security:Shield, iot:Cpu, ai:Database, web:Globe };
const catLabels = { all:"All", security:"Security", iot:"IoT", ai:"AI/ML", web:"Web" };

// ===== ANTI-GRAVITY PHYSICS ENGINE =====
function useAntiGravity(elementCount) {
  const particles = useRef([]);
  const frameRef = useRef(null);
  const scrollRef = useRef(0);
  const mouseRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const chaosRef = useRef(0);

  useEffect(() => {
    if (particles.current.length === 0) {
      particles.current = Array.from({ length: elementCount }, () => ({
        x: 0, y: 0, z: 0,
        vx: (Math.random() - 0.5) * 2,
        vy: -(Math.random() * 3 + 1),
        vz: (Math.random() - 0.5) * 1,
        rotation: 0,
        rotVel: (Math.random() - 0.5) * 4,
        scale: 1,
        opacity: 1,
        seed: Math.random(),
      }));
    }
  }, [elementCount]);

  return { particles, scrollRef, mouseRef, chaosRef };
}

// ===== FLOATING DEBRIS =====
function FloatingDebris({ scrollY, chaos }) {
  const debrisRef = useRef([]);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (debrisRef.current.length === 0) {
      debrisRef.current = Array.from({ length: 60 }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight * 5,
        size: Math.random() * 6 + 2,
        speed: Math.random() * 2 + 0.5,
        drift: (Math.random() - 0.5) * 3,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 5,
        color: ['#00e5ff', '#7c4dff', '#ff4081', '#ffc107'][Math.floor(Math.random() * 4)],
        shape: Math.floor(Math.random() * 3),
      }));
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const intensity = Math.min(chaos, 1);

      debrisRef.current.forEach(d => {
        d.y -= d.speed * (1 + intensity * 4);
        d.x += d.drift * intensity;
        d.rot += d.rotSpeed * (1 + intensity * 3);

        if (d.y < -50) { d.y = canvas.height + 50; d.x = Math.random() * canvas.width; }
        if (d.x < -50) d.x = canvas.width + 50;
        if (d.x > canvas.width + 50) d.x = -50;

        const screenY = d.y - (scrollY * d.speed * 0.3);
        const alpha = 0.15 + intensity * 0.4;

        ctx.save();
        ctx.translate(d.x, ((screenY % (canvas.height + 100)) + canvas.height + 100) % (canvas.height + 100) - 50);
        ctx.rotate(d.rot * Math.PI / 180);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = d.color;
        ctx.shadowColor = d.color;
        ctx.shadowBlur = 8 + intensity * 15;

        if (d.shape === 0) {
          ctx.fillRect(-d.size/2, -d.size/2, d.size, d.size);
        } else if (d.shape === 1) {
          ctx.beginPath(); ctx.arc(0, 0, d.size/2, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.beginPath();
          for (let i = 0; i < 3; i++) {
            const angle = (i * 120 - 90) * Math.PI / 180;
            ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(angle) * d.size, Math.sin(angle) * d.size);
          }
          ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', handleResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', handleResize); };
  }, [scrollY, chaos]);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }} />;
}

// ===== ANTI-GRAVITY ELEMENT WRAPPER =====
function AntiGravEl({ children, index, scrollY, chaos, mousePos, style, className, onClick }) {
  const elRef = useRef(null);
  const physicsRef = useRef({
    offsetX: 0, offsetY: 0, rotation: 0,
    vx: (Math.random() - 0.5) * 8,
    vy: -(Math.random() * 6 + 2),
    vr: (Math.random() - 0.5) * 6,
    seed: Math.random(),
    lastChaos: 0,
  });

  const getTransform = useCallback(() => {
    const p = physicsRef.current;
    const intensity = Math.max(0, chaos);
    const t = Date.now() * 0.001;

    if (intensity > 0.05) {
      if (p.lastChaos < 0.05) {
        p.vx = (Math.random() - 0.5) * 12;
        p.vy = -(Math.random() * 8 + 3);
        p.vr = (Math.random() - 0.5) * 10;
      }

      p.offsetX += p.vx * intensity * 0.6;
      p.offsetY += p.vy * intensity * 0.8;
      p.rotation += p.vr * intensity * 0.5;

      p.vx *= 0.98;
      p.vy *= 0.98;
      p.vy -= 0.05 * intensity;
      p.vr *= 0.99;

      // Mouse repulsion
      if (elRef.current && mousePos) {
        const rect = elRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = cx - mousePos.x;
        const dy = cy - mousePos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 250) {
          const force = (250 - dist) / 250 * intensity * 2;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }

      const wobbleX = Math.sin(t * (1 + p.seed * 2) + p.seed * 10) * 8 * intensity;
      const wobbleY = Math.cos(t * (0.8 + p.seed * 1.5) + p.seed * 7) * 6 * intensity;

      p.lastChaos = intensity;

      return {
        transform: `translate(${p.offsetX + wobbleX}px, ${p.offsetY + wobbleY}px) rotate(${p.rotation}deg) scale(${1 + intensity * 0.05})`,
        opacity: Math.max(0.3, 1 - intensity * 0.3),
        filter: `blur(${intensity * 0.5}px)`,
        transition: 'none',
      };
    } else {
      p.offsetX *= 0.9;
      p.offsetY *= 0.9;
      p.rotation *= 0.9;
      p.lastChaos = intensity;
      return {
        transform: `translate(${p.offsetX}px, ${p.offsetY}px) rotate(${p.rotation}deg)`,
        opacity: 1,
        filter: 'none',
        transition: 'all 0.8s cubic-bezier(0.4,0,0.2,1)',
      };
    }
  }, [chaos, mousePos]);

  const [dynStyle, setDynStyle] = useState({});

  useEffect(() => {
    let animId;
    const update = () => {
      setDynStyle(getTransform());
      animId = requestAnimationFrame(update);
    };
    if (chaos > 0.05) {
      update();
    } else {
      setDynStyle(getTransform());
    }
    return () => cancelAnimationFrame(animId);
  }, [chaos > 0.05, getTransform]);

  return (
    <div ref={elRef} className={className} onClick={onClick}
      style={{ ...style, ...dynStyle, willChange: chaos > 0.05 ? 'transform' : 'auto' }}>
      {children}
    </div>
  );
}

// ===== EXPLODING TEXT =====
function ExplodingText({ text, tag: Tag = 'span', chaos, style }) {
  const letters = text.split('');
  const offsets = useRef(letters.map(() => ({
    x: (Math.random() - 0.5) * 800,
    y: -(Math.random() * 600 + 200),
    r: (Math.random() - 0.5) * 180,
    delay: Math.random() * 0.3,
  })));

  // Extract gradient styles that need to be on each letter
  const { background, WebkitBackgroundClip, WebkitTextFillColor, ...parentStyle } = style || {};
  const letterGradient = (background && WebkitBackgroundClip) ? { background, WebkitBackgroundClip, WebkitTextFillColor } : {};

  return (
    <Tag style={{ ...parentStyle, display: 'inline-block', whiteSpace: 'pre-wrap' }}>
      {letters.map((l, i) => {
        const o = offsets.current[i];
        const intensity = Math.min(chaos, 1);
        return (
          <span key={i} style={{
            display: 'inline-block',
            ...letterGradient,
            transform: intensity > 0.05
              ? `translate(${o.x * intensity}px, ${o.y * intensity}px) rotate(${o.r * intensity}deg)`
              : 'translate(0,0) rotate(0deg)',
            opacity: intensity > 0.05 ? Math.max(0.1, 1 - intensity * 0.8) : 1,
            transition: intensity > 0.05 ? 'none' : 'all 1s cubic-bezier(0.4,0,0.2,1)',
            textShadow: intensity > 0.3 ? `0 0 ${20 * intensity}px currentColor` : 'none',
          }}>
            {l === ' ' ? '\u00A0' : l}
          </span>
        );
      })}
    </Tag>
  );
}

// ===== THREE.JS ANTI-GRAVITY SCENE =====
function ThreeAntiGravity({ chaos }) {
  const mountRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const chaosRef = useRef(0);

  useEffect(() => { chaosRef.current = chaos; }, [chaos]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || typeof THREE === 'undefined') return;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 35;

    const objects = [];
    const mats = [
      new THREE.MeshPhongMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.15, wireframe: true }),
      new THREE.MeshPhongMaterial({ color: 0x7c4dff, transparent: true, opacity: 0.12, wireframe: true }),
      new THREE.MeshPhongMaterial({ color: 0xff4081, transparent: true, opacity: 0.1, wireframe: true }),
      new THREE.MeshPhongMaterial({ color: 0xffc107, transparent: true, opacity: 0.1, wireframe: true }),
    ];
    const shapes = [
      new THREE.IcosahedronGeometry(2, 1), new THREE.OctahedronGeometry(1.8, 0),
      new THREE.TetrahedronGeometry(1.5, 0), new THREE.TorusGeometry(1.5, 0.4, 8, 16),
      new THREE.DodecahedronGeometry(1.6, 0), new THREE.BoxGeometry(2, 2, 2),
      new THREE.ConeGeometry(1.2, 2.5, 6),
      new THREE.TorusGeometry(1, 0.3, 6, 12),
    ];

    for (let i = 0; i < 30; i++) {
      const mesh = new THREE.Mesh(
        shapes[Math.floor(Math.random() * shapes.length)],
        mats[Math.floor(Math.random() * mats.length)]
      );
      mesh.position.set((Math.random()-.5)*70, (Math.random()-.5)*70, (Math.random()-.5)*30-10);
      mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, 0);
      mesh.userData = {
        rx: (Math.random()-.5)*.01, ry: (Math.random()-.5)*.01,
        vx: 0, vy: 0, vz: 0,
        baseX: mesh.position.x, baseY: mesh.position.y, baseZ: mesh.position.z,
        mass: 0.5 + Math.random() * 2,
      };
      scene.add(mesh); objects.push(mesh);
    }

    // Particle system
    const pGeo = new THREE.BufferGeometry();
    const pCount = 600;
    const pPos = new Float32Array(pCount * 3);
    const pVel = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i*3] = (Math.random()-.5)*100;
      pPos[i*3+1] = (Math.random()-.5)*100;
      pPos[i*3+2] = (Math.random()-.5)*50-10;
      pVel[i*3] = (Math.random()-.5)*.1;
      pVel[i*3+1] = (Math.random()-.5)*.1;
      pVel[i*3+2] = (Math.random()-.5)*.05;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x00e5ff, size: 0.08, transparent: true, opacity: 0.4 });
    const particleSystem = new THREE.Points(pGeo, pMat);
    scene.add(particleSystem);

    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const l1 = new THREE.PointLight(0x00e5ff, 1.2, 120); l1.position.set(10, 15, 25); scene.add(l1);
    const l2 = new THREE.PointLight(0x7c4dff, 0.8, 120); l2.position.set(-20, -10, 20); scene.add(l2);
    const l3 = new THREE.PointLight(0xff4081, 0.4, 100); l3.position.set(0, 20, -10); scene.add(l3);

    const onMouse = (e) => { mouseRef.current = { x: (e.clientX / window.innerWidth - 0.5) * 2, y: (e.clientY / window.innerHeight - 0.5) * 2 }; };
    window.addEventListener('mousemove', onMouse);

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = Date.now() * 0.001;
      const c = chaosRef.current;

      objects.forEach(m => {
        const d = m.userData;
        // Anti-gravity: push upward
        d.vy += 0.002 * (1 + c * 5);
        // Random forces in chaos
        if (c > 0.1) {
          d.vx += (Math.random() - 0.5) * 0.02 * c;
          d.vy += (Math.random() - 0.5) * 0.01 * c;
          d.vz += (Math.random() - 0.5) * 0.01 * c;
        }
        // Damping
        d.vx *= 0.99; d.vy *= 0.99; d.vz *= 0.99;
        // Apply velocity
        m.position.x += d.vx;
        m.position.y += d.vy;
        m.position.z += d.vz;
        // Wrap around
        if (m.position.y > 50) m.position.y = -50;
        if (m.position.y < -50) m.position.y = 50;
        if (Math.abs(m.position.x) > 50) m.position.x *= -0.9;
        if (Math.abs(m.position.z) > 30) m.position.z *= -0.9;

        m.rotation.x += d.rx * (1 + c * 4);
        m.rotation.y += d.ry * (1 + c * 4);
      });

      // Particle anti-gravity
      const positions = particleSystem.geometry.attributes.position.array;
      for (let i = 0; i < pCount; i++) {
        positions[i*3] += pVel[i*3] * (1 + c * 3);
        positions[i*3+1] += Math.abs(pVel[i*3+1]) * (1 + c * 5) + 0.02;
        positions[i*3+2] += pVel[i*3+2];
        if (positions[i*3+1] > 60) positions[i*3+1] = -60;
        if (Math.abs(positions[i*3]) > 60) positions[i*3] *= -1;
      }
      particleSystem.geometry.attributes.position.needsUpdate = true;

      camera.position.x += (mouseRef.current.x * 4 - camera.position.x) * 0.03;
      camera.position.y += (-mouseRef.current.y * 4 - camera.position.y) * 0.03;
      camera.rotation.z = Math.sin(t * 0.2) * 0.02 * (1 + c * 3);
      camera.lookAt(0, 0, 0);

      // Pulsing lights in chaos
      l1.intensity = 1.2 + Math.sin(t * 3) * c * 0.8;
      l2.intensity = 0.8 + Math.cos(t * 2.5) * c * 0.6;

      pMat.size = 0.08 + c * 0.12;
      pMat.opacity = 0.4 + c * 0.3;

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', onResize);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}

// ===== GRAVITY CONTROL HUD =====
function GravityHUD({ chaos, onToggle, gravityOff }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 200,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8,
    }}>
      <div style={{
        fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: '0.15em',
        color: gravityOff ? '#ff4081' : '#00e5ff',
        background: 'rgba(10,10,15,0.8)', border: `1px solid ${gravityOff ? '#ff408140' : '#00e5ff40'}`,
        padding: '6px 12px', backdropFilter: 'blur(10px)', borderRadius: 4,
      }}>
        GRAVITY: {gravityOff ? 'OFF' : 'ON'} | CHAOS: {Math.round(chaos * 100)}%
      </div>
      <button onClick={onToggle} style={{
        fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
        padding: '12px 24px', cursor: 'pointer',
        background: gravityOff
          ? 'linear-gradient(135deg, #ff4081, #ff6e40)'
          : 'linear-gradient(135deg, #00e5ff, #7c4dff)',
        border: 'none', color: '#0a0a0f', fontWeight: 700, borderRadius: 4,
        boxShadow: gravityOff
          ? '0 0 30px rgba(255,64,129,0.4), 0 0 60px rgba(255,64,129,0.15)'
          : '0 0 30px rgba(0,229,255,0.3)',
        transition: 'all 0.4s',
        display: 'flex', alignItems: 'center', gap: 8,
        animation: gravityOff ? 'pulse 1s ease infinite' : 'none',
      }}>
        <Zap size={14} /> {gravityOff ? 'RESTORE GRAVITY' : 'KILL GRAVITY'}
      </button>
    </div>
  );
}

// ===== PROJECT MODAL =====
function ProjectModal({ project, onClose }) {
  if (!project) return null;
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.88)', backdropFilter:'blur(25px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, animation:'fadeIn 0.3s ease' }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#12121a', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, maxWidth:800, width:'100%', maxHeight:'90vh', overflow:'auto' }}>
        <div style={{ padding:'40px 40px 0', position:'relative' }}>
          <button onClick={onClose} style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.06)', border:'none', color:'#e8e8f0', width:36, height:36, borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={18}/></button>
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:'0.2em', color:project.color, marginBottom:8 }}>PROJECT {project.idx}</div>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:32, fontWeight:800, marginBottom:8, lineHeight:1.1 }}>{project.name}</h2>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24, fontSize:13, color:'#8888a0' }}><Calendar size={14}/> {project.year}</div>
        </div>
        <div style={{ margin:'0 40px', padding:'24px 32px', background:`linear-gradient(135deg,${project.color}12,${project.color}06)`, border:`1px solid ${project.color}25`, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:32 }}>
          <div>
            <div style={{ fontSize:11, color:'#8888a0', fontFamily:"'Space Mono',monospace", letterSpacing:'0.15em', textTransform:'uppercase' }}>{project.metricLabel}</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:42, fontWeight:800, color:project.color, lineHeight:1 }}>{project.metric}</div>
          </div>
          <a href={project.github} target="_blank" rel="noreferrer" style={{ padding:'10px 20px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, color:'#e8e8f0', textDecoration:'none', fontSize:12, fontFamily:"'Space Mono',monospace", display:'flex', alignItems:'center', gap:6 }}><Github size={14}/> Code</a>
        </div>
        <div style={{ padding:'0 40px', marginBottom:32 }}>
          <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, marginBottom:12, display:'flex', alignItems:'center', gap:8 }}><Code2 size={16} style={{ color:project.color }}/> Overview</h3>
          <p style={{ fontSize:14, lineHeight:1.8, color:'#8888a0' }}>{project.desc}</p>
        </div>
        <div style={{ padding:'0 40px', marginBottom:32 }}>
          <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, marginBottom:12, display:'flex', alignItems:'center', gap:8 }}><Terminal size={16} style={{ color:project.color }}/> Key Features</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {project.features.map((f,i)=>(
              <div key={i} style={{ padding:'12px 16px', background:'rgba(255,255,255,0.02)', borderLeft:`2px solid ${project.color}`, fontSize:13, color:'#c0c0d0' }}>{f}</div>
            ))}
          </div>
        </div>
        <div style={{ padding:'0 40px', marginBottom:32 }}>
          <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, marginBottom:12, display:'flex', alignItems:'center', gap:8 }}><Shield size={16} style={{ color:project.color }}/> Challenges & Solutions</h3>
          <p style={{ fontSize:14, lineHeight:1.8, color:'#8888a0' }}>{project.challenges}</p>
        </div>
        <div style={{ padding:'0 40px 40px' }}>
          <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, marginBottom:12 }}>Tech Stack</h3>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {project.tech.map(t=>(
              <span key={t} style={{ fontFamily:"'Space Mono',monospace", fontSize:11, padding:'6px 14px', background:`${project.color}12`, border:`1px solid ${project.color}30`, color:project.color, borderRadius:4 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== SCROLL REVEAL =====
function useScrollReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function RevealSection({ children, delay = 0 }) {
  const [ref, visible] = useScrollReveal();
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(50px)', transition: `all 0.8s cubic-bezier(0.4,0,0.2,1) ${delay}s` }}>
      {children}
    </div>
  );
}

// ===== MAIN PORTFOLIO =====
export default function Portfolio() {
  const [gravityOff, setGravityOff] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [chaos, setChaos] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [filter, setFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState(null);
  const [navHidden, setNavHidden] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [dark, setDark] = useState(true);
  const lastScroll = useRef(0);

  useEffect(() => {
    const h = () => {
      const y = window.scrollY;
      setScrollY(y);
      setNavHidden(y > lastScroll.current && y > 100);
      lastScroll.current = y;

      if (gravityOff) {
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        const progress = Math.min(y / (maxScroll * 0.5), 1);
        setChaos(progress);
      } else {
        setChaos(0);
      }

      const secs = ['home','about','experience','projects','skills','certifications','contact'];
      for (const s of [...secs].reverse()) {
        const el = document.getElementById(s);
        if (el && el.getBoundingClientRect().top < 300) { setActiveSection(s); break; }
      }
    };
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, [gravityOff]);

  useEffect(() => {
    const h = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);

  const handleGravityToggle = () => {
    if (gravityOff) {
      setGravityOff(false);
      setChaos(0);
    } else {
      setGravityOff(true);
    }
  };

  const filtered = filter === 'all' ? projects : projects.filter(p => p.cat === filter);
  const accent = '#00e5ff';
  const accent2 = '#7c4dff';
  const bg = dark ? '#0a0a0f' : '#f5f5f8';
  const card = dark ? '#1a1a28' : '#ffffff';
  const text = dark ? '#e8e8f0' : '#1a1a2e';
  const textDim = dark ? '#8888a0' : '#666680';
  const border = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  const sLabel = { fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:'0.35em', textTransform:'uppercase', color:accent, marginBottom:8, display:'flex', alignItems:'center', gap:12 };

  return (
    <div style={{ background: bg, color: text, fontFamily: "'DM Sans',sans-serif", minHeight: '100vh', overflowX: 'hidden', transition: 'background 0.4s, color 0.4s' }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulse { 0%,100%{opacity:1;box-shadow:0 0 30px rgba(255,64,129,0.4)} 50%{opacity:0.85;box-shadow:0 0 50px rgba(255,64,129,0.6)} }
        @keyframes glitch { 0%,100%{transform:translate(0)} 20%{transform:translate(-2px,2px)} 40%{transform:translate(2px,-2px)} 60%{transform:translate(-1px,-1px)} 80%{transform:translate(1px,1px)} }
        @keyframes scanline { 0%{top:-100%} 100%{top:100%} }
        ::selection { background:#00e5ff33; color:#00e5ff }
        * { scrollbar-width:thin; scrollbar-color:#00e5ff33 transparent }
        html { scroll-behavior:smooth }
      `}</style>

      {dark && <ThreeAntiGravity chaos={chaos} />}
      <FloatingDebris scrollY={scrollY} chaos={chaos} />

      {/* Cursor Force Field */}
      <div style={{
        position: 'fixed',
        left: mousePos.x - (gravityOff ? 200 : 150),
        top: mousePos.y - (gravityOff ? 200 : 150),
        width: gravityOff ? 400 : 300,
        height: gravityOff ? 400 : 300,
        borderRadius: '50%',
        background: gravityOff
          ? `radial-gradient(circle, ${accent}15, ${accent2}08, transparent 70%)`
          : `radial-gradient(circle, ${accent}08, transparent 70%)`,
        border: gravityOff ? `1px solid ${accent}15` : 'none',
        pointerEvents: 'none', zIndex: 3,
        transition: 'width 0.5s, height 0.5s, left 0.1s ease, top 0.1s ease',
      }} />

      {/* Scanline effect in chaos */}
      {chaos > 0.3 && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 4, pointerEvents: 'none',
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,229,255,0.02) 2px, rgba(0,229,255,0.02) 4px)',
          opacity: chaos * 0.5,
        }}>
          <div style={{
            position: 'absolute', left: 0, right: 0, height: '30%',
            background: 'linear-gradient(to bottom, rgba(0,229,255,0.04), transparent)',
            animation: 'scanline 3s linear infinite',
          }} />
        </div>
      )}

      {/* NAV */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        padding:'16px 48px', display:'flex', justifyContent:'space-between', alignItems:'center',
        background: dark ? 'rgba(10,10,15,0.7)' : 'rgba(245,245,248,0.8)',
        backdropFilter:'blur(20px)', borderBottom:`1px solid ${border}`,
        transition:'transform 0.4s ease',
        transform: navHidden ? 'translateY(-100%)' : 'translateY(0)',
        animation: chaos > 0.5 ? 'glitch 0.3s ease infinite' : 'none',
      }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:22, background:`linear-gradient(135deg,${accent},${accent2})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>OT.</div>
        <div style={{ display:'flex', gap:28, alignItems:'center' }}>
          {['about','experience','projects','skills','certifications','contact'].map(s=>(
            <a key={s} href={`#${s}`} style={{ fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:'0.15em', textTransform:'uppercase', color:activeSection===s?accent:textDim, textDecoration:'none', padding:'4px 0', transition:'color 0.3s', borderBottom:activeSection===s?`1px solid ${accent}`:'1px solid transparent' }}>{s==='certifications'?'Certs':s}</a>
          ))}
          <button onClick={()=>setDark(!dark)} style={{ background:'rgba(255,255,255,0.06)', border:`1px solid ${border}`, borderRadius:'50%', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:text }}>{dark?<Sun size={15}/>:<Moon size={15}/>}</button>
        </div>
      </nav>

      <div style={{ position:'relative', zIndex:5 }}>

        {/* ===== HERO ===== */}
        <section id="home" style={{ minHeight:'100vh', display:'flex', alignItems:'center', padding:'0 8vw', position:'relative', gap:'2vw' }}>
          <AntiGravEl index={0} scrollY={scrollY} chaos={chaos} mousePos={mousePos} style={{ flex:1, animation:'fadeIn 1s ease 0.3s both' }}>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:13, letterSpacing:'0.3em', textTransform:'uppercase', color:accent, marginBottom:20 }}>
              // Computer Science · Adelaide University
            </div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(2.8rem,5.5vw,5.5rem)', fontWeight:800, lineHeight:0.95, letterSpacing:'-0.04em', marginBottom:20 }}>
              <ExplodingText text="Omkar" chaos={chaos} style={{}} />
              <br />
              <ExplodingText text="Thombre." chaos={chaos} style={{ background:`linear-gradient(135deg,${accent},${accent2},#ff4081)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }} />
            </h1>
            <p style={{ fontSize:16, color:textDim, maxWidth:480, lineHeight:1.7, fontWeight:300, marginBottom:32 }}>
              Master's student & Teaching Assistant crafting secure systems, intelligent IoT solutions, and full-stack experiences.
            </p>
            <div style={{ display:'flex', gap:12 }}>
              <a href="#projects" style={{ fontFamily:"'Space Mono',monospace", fontSize:12, letterSpacing:'0.12em', textTransform:'uppercase', padding:'14px 28px', background:accent, color:'#0a0a0f', textDecoration:'none', fontWeight:700, display:'flex', alignItems:'center', gap:8 }}>View Projects <ArrowRight size={14}/></a>
              <a href="#contact" style={{ fontFamily:"'Space Mono',monospace", fontSize:12, letterSpacing:'0.12em', textTransform:'uppercase', padding:'14px 28px', border:`1px solid ${border}`, color:text, textDecoration:'none' }}>Get in Touch</a>
            </div>
          </AntiGravEl>
          <AntiGravEl index={100} scrollY={scrollY} chaos={chaos} mousePos={mousePos} style={{ animation:'fadeIn 1.2s ease 0.8s both', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Head3D chaos={chaos} />
          </AntiGravEl>
          <div style={{ position:'absolute', bottom:40, left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:8, animation:'fadeIn 1s ease 1.5s both' }}>
            <span style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:'0.2em', color:textDim, textTransform:'uppercase' }}>Scroll</span>
            <ChevronDown size={16} style={{ color:accent, animation:'float 2s ease infinite' }}/>
          </div>
        </section>

        {/* ===== ABOUT ===== */}
        <section id="about" style={{ padding:'120px 8vw' }}>
          <AntiGravEl index={1} scrollY={scrollY} chaos={chaos} mousePos={mousePos}>
            <RevealSection>
              <div style={sLabel}><div style={{ width:40, height:1, background:accent }}/>01 — About</div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(2rem,4vw,3.2rem)', fontWeight:700, letterSpacing:'-0.03em', marginBottom:48, lineHeight:1.1 }}>
                <ExplodingText text="Building at the intersection" chaos={chaos} /><br/>
                <ExplodingText text="of security & innovation." chaos={chaos} />
              </h2>
            </RevealSection>
          </AntiGravEl>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:48 }}>
            <AntiGravEl index={2} scrollY={scrollY} chaos={chaos} mousePos={mousePos}>
              <RevealSection delay={0.15}>
                <p style={{ fontSize:16, lineHeight:1.85, color:textDim, fontWeight:300, marginBottom:16 }}>I'm a Master of Computer Science student at Adelaide University with a strong foundation in software engineering, cybersecurity, and data science. Currently serving as a Teaching Assistant for Security Operations & Incident Response.</p>
                <p style={{ fontSize:16, lineHeight:1.85, color:textDim, fontWeight:300 }}>My work spans from designing cryptographic messaging protocols to building IoT-powered logistics systems. I'm driven by creating software that's both powerful and secure.</p>
              </RevealSection>
            </AntiGravEl>
            <RevealSection delay={0.3}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                {[{n:'6.67',l:'CGPA / 7.0'},{n:'4+',l:'Major Projects'},{n:'95%',l:'Detection Accuracy'},{n:'60%',l:'Efficiency Gains'}].map((s,i)=>(
                  <AntiGravEl key={i} index={3+i} scrollY={scrollY} chaos={chaos} mousePos={mousePos} style={{ background:card, border:`1px solid ${border}`, padding:24, borderRadius:4 }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:32, fontWeight:800, color:accent, lineHeight:1 }}>{s.n}</div>
                    <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:'0.15em', textTransform:'uppercase', color:textDim, marginTop:8 }}>{s.l}</div>
                  </AntiGravEl>
                ))}
              </div>
            </RevealSection>
          </div>
        </section>

        {/* ===== EXPERIENCE ===== */}
        <section id="experience" style={{ padding:'120px 8vw' }}>
          <AntiGravEl index={10} scrollY={scrollY} chaos={chaos} mousePos={mousePos}>
            <RevealSection>
              <div style={sLabel}><div style={{ width:40, height:1, background:accent }}/>02 — Experience</div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(2rem,4vw,3.2rem)', fontWeight:700, marginBottom:48, lineHeight:1.1 }}>
                <ExplodingText text="Where I've contributed." chaos={chaos} />
              </h2>
            </RevealSection>
          </AntiGravEl>
          <div style={{ position:'relative', paddingLeft:40 }}>
            <div style={{ position:'absolute', left:0, top:0, bottom:0, width:1, background:`linear-gradient(to bottom,${accent},${accent2},transparent)` }}/>
            {[
              { date:'Feb 2026 — Present', role:'Teaching Assistant', company:'Adelaide University — Security Ops & Incident Response', items:['Collaborating with Dr. Xiaogang Zhu to deliver advanced security curriculum.','Providing academic support and evaluating student coursework.'] },
              { date:'Jan 2023 — Feb 2023', role:'Data Science Intern', company:'Flutura Decision Sciences & Analytics × Academor', items:['Applied data collection and interpretation techniques for actionable insights.','Solved complex problems using data-driven approaches.','Recognized as an energetic learner in real-world applications.'] },
            ].map((exp,i)=>(
              <AntiGravEl key={i} index={11+i} scrollY={scrollY} chaos={chaos} mousePos={mousePos} style={{ position:'relative', marginBottom:40, paddingBottom:40, borderBottom:`1px solid ${border}` }}>
                <RevealSection delay={i*0.2}>
                  <div style={{ position:'absolute', left:-40, top:4, width:12, height:12, border:`2px solid ${accent}`, background:bg, transform:'translateX(-5.5px) rotate(45deg)' }}/>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:'0.15em', color:accent, marginBottom:8, display:'flex', alignItems:'center', gap:8 }}><Calendar size={12}/> {exp.date}</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:700, marginBottom:4 }}>{exp.role}</div>
                  <div style={{ fontSize:14, color:textDim, marginBottom:16 }}>{exp.company}</div>
                  {exp.items.map((item,j)=>(<div key={j} style={{ fontSize:14, color:textDim, lineHeight:1.7, paddingLeft:16, position:'relative', marginBottom:6 }}><span style={{ position:'absolute', left:0, color:accent }}>▹</span>{item}</div>))}
                </RevealSection>
              </AntiGravEl>
            ))}
          </div>
        </section>

        {/* ===== PROJECTS ===== */}
        <section id="projects" style={{ padding:'120px 8vw' }}>
          <AntiGravEl index={15} scrollY={scrollY} chaos={chaos} mousePos={mousePos}>
            <RevealSection>
              <div style={sLabel}><div style={{ width:40, height:1, background:accent }}/>03 — Projects</div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(2rem,4vw,3.2rem)', fontWeight:700, marginBottom:12, lineHeight:1.1 }}>
                <ExplodingText text="Things I've built." chaos={chaos} />
              </h2>
              <p style={{ fontSize:14, color:textDim, marginBottom:32 }}>Click any card for the full story.</p>
            </RevealSection>
          </AntiGravEl>

          <RevealSection delay={0.1}>
            <div style={{ display:'flex', gap:8, marginBottom:40, flexWrap:'wrap' }}>
              {Object.keys(catLabels).map(c=>{
                const Icon = catIcons[c];
                return <button key={c} onClick={()=>setFilter(c)} style={{ fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:'0.1em', textTransform:'uppercase', padding:'10px 20px', background:filter===c?`${accent}18`:'transparent', border:`1px solid ${filter===c?accent+'40':border}`, color:filter===c?accent:textDim, cursor:'pointer', display:'flex', alignItems:'center', gap:6, borderRadius:4, transition:'all 0.3s' }}><Icon size={13}/> {catLabels[c]}</button>;
              })}
            </div>
          </RevealSection>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:24 }}>
            {filtered.map((p,i)=>(
              <AntiGravEl key={p.id} index={16+i} scrollY={scrollY} chaos={chaos} mousePos={mousePos}
                onClick={()=>setSelectedProject(p)}
                style={{ background:card, border:`1px solid ${border}`, padding:32, borderRadius:8, position:'relative', overflow:'hidden', cursor:'pointer', transition:'transform 0.3s, box-shadow 0.3s', transformStyle:'preserve-3d' }}
              >
                <RevealSection delay={i*0.1}>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:p.color, letterSpacing:'0.2em', marginBottom:12 }}>// {p.idx} — {p.cat.toUpperCase()}</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:700, marginBottom:10, lineHeight:1.2 }}>{p.name}</div>
                  <p style={{ color:textDim, fontSize:14, lineHeight:1.7, marginBottom:20 }}>{p.short}</p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
                    {p.tech.slice(0,4).map(t=>(<span key={t} style={{ fontFamily:"'Space Mono',monospace", fontSize:10, padding:'4px 10px', background:`${p.color}10`, border:`1px solid ${p.color}25`, color:p.color, borderRadius:3 }}>{t}</span>))}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:accent, fontFamily:"'Space Mono',monospace" }}>View Details <ArrowRight size={12}/></div>
                  <div style={{ position:'absolute', bottom:24, right:24, fontFamily:"'Syne',sans-serif", fontSize:48, fontWeight:800, color:`${p.color}10`, lineHeight:1 }}>{p.metric}</div>
                </RevealSection>
              </AntiGravEl>
            ))}
          </div>
        </section>

        {/* ===== SKILLS ===== */}
        <section id="skills" style={{ padding:'120px 8vw' }}>
          <AntiGravEl index={25} scrollY={scrollY} chaos={chaos} mousePos={mousePos}>
            <RevealSection>
              <div style={sLabel}><div style={{ width:40, height:1, background:accent }}/>04 — Skills</div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(2rem,4vw,3.2rem)', fontWeight:700, marginBottom:48, lineHeight:1.1 }}>
                <ExplodingText text="Technologies & tools." chaos={chaos} />
              </h2>
            </RevealSection>
          </AntiGravEl>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:48 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20 }}>
              {Object.entries(skills).map(([group,items],gi)=>(
                <AntiGravEl key={group} index={26+gi} scrollY={scrollY} chaos={chaos} mousePos={mousePos} style={{ background:card, border:`1px solid ${border}`, padding:28, borderRadius:8, height:'100%' }}>
                  <RevealSection delay={gi*0.15}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg,${accent}18,${accent2}18)`, borderRadius:4 }}>
                        {gi===0?<Code2 size={15} style={{color:accent}}/>:gi===1?<Globe size={15} style={{color:accent}}/>:<Terminal size={15} style={{color:accent}}/>}
                      </div>
                      {group.charAt(0).toUpperCase()+group.slice(1)}
                    </div>
                    {items.map((s,si)=>(
                      <div key={si} style={{ fontSize:14, color:textDim, padding:'8px 12px', background:dark?'rgba(255,255,255,0.02)':'rgba(0,0,0,0.02)', borderLeft:'2px solid transparent', marginBottom:4, transition:'all 0.3s', borderRadius:2, cursor:'default' }}
                        onMouseEnter={e=>{e.target.style.borderLeftColor=accent;e.target.style.color=text;e.target.style.transform='translateX(4px)';}}
                        onMouseLeave={e=>{e.target.style.borderLeftColor='transparent';e.target.style.color=textDim;e.target.style.transform='translateX(0)';}}>{s}</div>
                    ))}
                  </RevealSection>
                </AntiGravEl>
              ))}
            </div>
            <AntiGravEl index={30} scrollY={scrollY} chaos={chaos} mousePos={mousePos} style={{ background:card, border:`1px solid ${border}`, padding:28, borderRadius:8 }}>
              <RevealSection delay={0.4}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:16 }}>Skill Radar</div>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={dark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.08)'}/>
                    <PolarAngleAxis dataKey="skill" tick={{ fill:textDim, fontSize:11, fontFamily:"'Space Mono',monospace" }}/>
                    <Radar dataKey="val" stroke={accent} fill={accent} fillOpacity={0.15} strokeWidth={2}/>
                  </RadarChart>
                </ResponsiveContainer>
              </RevealSection>
            </AntiGravEl>
          </div>
        </section>

        {/* ===== CERTIFICATIONS ===== */}
        <section id="certifications" style={{ padding:'120px 8vw' }}>
          <AntiGravEl index={35} scrollY={scrollY} chaos={chaos} mousePos={mousePos}>
            <RevealSection>
              <div style={sLabel}><div style={{ width:40, height:1, background:accent }}/>05 — Certifications</div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(2rem,4vw,3.2rem)', fontWeight:700, marginBottom:48, lineHeight:1.1 }}>
                <ExplodingText text="Credentials & certifications." chaos={chaos} />
              </h2>
            </RevealSection>
          </AntiGravEl>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            {certs.map((c,i)=>(
              <AntiGravEl key={i} index={36+i} scrollY={scrollY} chaos={chaos} mousePos={mousePos}
                style={{ background:card, border:`1px solid ${border}`, padding:20, borderRadius:6, transition:'all 0.4s', cursor:'default', overflow:'hidden' }}>
                <RevealSection delay={(i%4)*0.08}>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:'0.15em', textTransform:'uppercase', color:accent, marginBottom:6 }}>{c.issuer}</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:600, lineHeight:1.3, marginBottom:6 }}>{c.name}</div>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:textDim }}>{c.date}</div>
                </RevealSection>
              </AntiGravEl>
            ))}
          </div>
        </section>

        {/* ===== CONTACT ===== */}
        <section id="contact" style={{ padding:'120px 8vw', textAlign:'center' }}>
          <AntiGravEl index={55} scrollY={scrollY} chaos={chaos} mousePos={mousePos}>
            <RevealSection>
              <div style={{ ...sLabel, justifyContent:'center' }}>06 — Contact</div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(2.5rem,5vw,4.2rem)', fontWeight:800, letterSpacing:'-0.04em', marginBottom:16, lineHeight:1 }}>
                <ExplodingText text="Let's " chaos={chaos} />
                <ExplodingText text="connect." chaos={chaos} style={{ background:`linear-gradient(135deg,${accent},${accent2})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }} />
              </h2>
              <p style={{ fontSize:16, color:textDim, maxWidth:500, margin:'0 auto 40px', lineHeight:1.7, fontWeight:300 }}>Currently open to opportunities in software development, cybersecurity, and data-driven engineering.</p>
              <div style={{ display:'flex', justifyContent:'center', gap:16, flexWrap:'wrap' }}>
                {[
                  { icon:Mail, label:'Email', href:'mailto:unientreeomkar@gmail.com' },
                  { icon:Linkedin, label:'LinkedIn', href:'https://www.linkedin.com/in/omkar-thombre-7a90a6262/' },
                  { icon:Github, label:'GitHub', href:'https://github.com/Omkarth' },
                  { icon:Phone, label:'Call', href:'tel:+61433237995' },
                ].map((l,i)=>(
                  <AntiGravEl key={i} index={56+i} scrollY={scrollY} chaos={chaos} mousePos={mousePos}>
                    <a href={l.href} target={l.href.startsWith('http')?'_blank':undefined} rel="noreferrer"
                      style={{ fontFamily:"'Space Mono',monospace", fontSize:12, letterSpacing:'0.12em', textTransform:'uppercase', padding:'14px 28px', border:`1px solid ${border}`, color:textDim, textDecoration:'none', transition:'all 0.4s', display:'flex', alignItems:'center', gap:8, borderRadius:4 }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=accent;e.currentTarget.style.color=accent;e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow=`0 8px 30px ${accent}18`;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=border;e.currentTarget.style.color=textDim;e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none';}}>
                      <l.icon size={14}/> {l.label}
                    </a>
                  </AntiGravEl>
                ))}
              </div>
            </RevealSection>
          </AntiGravEl>
        </section>

        <footer style={{ padding:'24px 8vw', borderTop:`1px solid ${border}`, display:'flex', justifyContent:'space-between', fontFamily:"'Space Mono',monospace", fontSize:11, color:textDim, letterSpacing:'0.1em' }}>
          <span>&copy; 2026 Omkar Thombre</span>
          <span>Adelaide, Australia</span>
        </footer>
      </div>

      <GravityHUD chaos={chaos} onToggle={handleGravityToggle} gravityOff={gravityOff} />
      <ProjectModal project={selectedProject} onClose={()=>setSelectedProject(null)} />
    </div>
  );
}