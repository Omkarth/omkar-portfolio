import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { X, ExternalLink, Github, Mail, Linkedin, Phone, ChevronDown, ArrowRight, Moon, Sun, Filter, Code2, Cpu, Database, Globe, Shield, Terminal, Award, GraduationCap, Briefcase, Calendar, Zap } from "lucide-react";

// ===== R3F AVATAR HEAD MODEL =====
const SECTION_ROT = { home:0, about:0.4, experience:0.25, projects:-0.4, skills:-0.25, certifications:-0.15, contact:0 };

function HeadModel({ chaos, activeSection }) {
  const groupRef = useRef();
  const meshRefs = useRef([]);
  const fillLightRef = useRef();
  const bottomLightRef = useRef();
  const physicsInit = useRef(false);
  const physics = useRef([]);

  const mr = (i) => (el) => { if (el) meshRefs.current[i] = el; };

  // Original positions/rotations stored once
  const originals = useRef([]);

  // Store original transforms after first render
  useEffect(() => {
    if (originals.current.length > 0) return;
    // Wait a frame for refs to populate
    requestAnimationFrame(() => {
      meshRefs.current.forEach((m, i) => {
        if (m) {
          originals.current[i] = {
            px: m.position.x, py: m.position.y, pz: m.position.z,
            rx: m.rotation.x, ry: m.rotation.y, rz: m.rotation.z,
          };
        }
      });
      // Init explosion physics
      physics.current = meshRefs.current.map((_, i) => {
        const force = i < 38 ? (i < 1 ? 0.3 : i < 10 ? 1.5 : 2.0) : 3.0;
        return {
          vx: (Math.random() - 0.5) * 8 * force,
          vy: (Math.random() * 6 + 3) * force,
          vz: (Math.random() - 0.5) * 8 * force,
          rx: (Math.random() - 0.5) * 6, ry: (Math.random() - 0.5) * 6, rz: (Math.random() - 0.5) * 6,
          ox: 0, oy: 0, oz: 0, orx: 0, ory: 0, orz: 0,
        };
      });
      physicsInit.current = true;
    });
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const c = chaos;
    const ptr = state.pointer;

    // Floating
    groupRef.current.position.y = Math.sin(t * 0.8) * 0.08;

    // Section-directed rotation + cursor blend
    const sectionY = SECTION_ROT[activeSection] || 0;
    const targetRotY = sectionY + ptr.x * 0.3;
    const targetRotX = -ptr.y * 0.2;
    groupRef.current.rotation.y += (targetRotY - groupRef.current.rotation.y) * 0.06;
    groupRef.current.rotation.x += (targetRotX - groupRef.current.rotation.x) * 0.06;

    // Rings rotation (indices 38-39)
    const ring1 = meshRefs.current[38];
    const ring2 = meshRefs.current[39];
    if (ring1) ring1.rotation.z = t * 0.4;
    if (ring2) ring2.rotation.z = -t * 0.3;

    // Orbital dots (indices 40-42)
    const dot1 = meshRefs.current[40];
    const dot2 = meshRefs.current[41];
    const dot3 = meshRefs.current[42];
    if (dot1) dot1.position.set(Math.cos(t * 1.2) * 2.0, Math.sin(t * 1.2) * 0.8, Math.sin(t * 1.2) * 2.0);
    if (dot2) dot2.position.set(Math.cos(t * 0.9 + 2) * 2.3, Math.sin(t * 0.9 + 2) * 1.0, Math.sin(t * 0.9 + 2) * 2.3);
    if (dot3) dot3.position.set(Math.cos(t * 1.5 + 4) * 1.8, Math.sin(t * 1.5 + 4) * 1.2, Math.sin(t * 1.5 + 4) * 1.8);

    if (!physicsInit.current || originals.current.length === 0) return;

    // Explosion / snap-back for physical parts (0-37)
    if (c > 0.02) {
      meshRefs.current.forEach((part, i) => {
        if (!part || !physics.current[i] || !originals.current[i]) return;
        const ev = physics.current[i];
        const orig = originals.current[i];
        ev.ox += ev.vx * c * 0.15; ev.oy += ev.vy * c * 0.2; ev.oz += ev.vz * c * 0.15;
        ev.orx += ev.rx * c * 0.08; ev.ory += ev.ry * c * 0.08; ev.orz += ev.rz * c * 0.08;
        const wx = Math.sin(t * (1 + i * 0.3)) * c * 0.3;
        const wy = Math.cos(t * (0.8 + i * 0.2)) * c * 0.3;
        part.position.set(orig.px + ev.ox + wx, orig.py + ev.oy + wy, orig.pz + ev.oz);
        part.rotation.set(orig.rx + ev.orx, orig.ry + ev.ory, orig.rz + ev.orz);
      });
      if (fillLightRef.current) fillLightRef.current.intensity = 0.3 + Math.sin(t * 4) * c * 0.5;
      if (bottomLightRef.current) bottomLightRef.current.intensity = 0.3 + Math.cos(t * 3) * c * 0.4;
    } else {
      // Snap back physical parts only (0-37)
      for (let i = 0; i < 38; i++) {
        const part = meshRefs.current[i];
        if (!part || !physics.current[i] || !originals.current[i]) continue;
        const ev = physics.current[i];
        const orig = originals.current[i];
        ev.ox *= 0.88; ev.oy *= 0.88; ev.oz *= 0.88;
        ev.orx *= 0.88; ev.ory *= 0.88; ev.orz *= 0.88;
        part.position.set(orig.px + ev.ox, orig.py + ev.oy, orig.pz + ev.oz);
        part.rotation.set(orig.rx + ev.orx, orig.ry + ev.ory, orig.rz + ev.orz);
      }
      if (fillLightRef.current) fillLightRef.current.intensity = 0.3;
      if (bottomLightRef.current) bottomLightRef.current.intensity = 0.3;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={0.8} castShadow />
      <directionalLight ref={fillLightRef} position={[-3, 1, 3]} intensity={0.3} color="#00e5ff" />
      <directionalLight position={[0, 2, -3]} intensity={0.4} color="#7c4dff" />
      <pointLight ref={bottomLightRef} position={[0, -3, 2]} intensity={0.3} color="#00e5ff" distance={10} />

      <group ref={groupRef}>
        {/* 0: Head */}
        <mesh ref={mr(0)} position={[0, 0.2, 0]} castShadow>
          <sphereGeometry args={[1.1, 32, 32]} />
          <meshPhongMaterial color="#d4a574" shininess={40} />
        </mesh>
        {/* 1: Hair top */}
        <mesh ref={mr(1)} position={[0, 0.35, 0]}>
          <sphereGeometry args={[1.18, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshPhongMaterial color="#1a1a2e" shininess={60} flatShading />
        </mesh>
        {/* 2: Hair left */}
        <mesh ref={mr(2)} position={[-1.0, 0.1, 0.15]} scale={[0.6, 1.3, 0.9]}>
          <sphereGeometry args={[0.35, 12, 8]} />
          <meshPhongMaterial color="#1a1a2e" shininess={60} flatShading />
        </mesh>
        {/* 3: Hair right */}
        <mesh ref={mr(3)} position={[1.0, 0.1, 0.15]} scale={[0.6, 1.3, 0.9]}>
          <sphereGeometry args={[0.35, 12, 8]} />
          <meshPhongMaterial color="#1a1a2e" shininess={60} flatShading />
        </mesh>
        {/* 4: Hair back */}
        <mesh ref={mr(4)} position={[0, 0.3, -0.25]} scale={[1.05, 1.1, 0.9]}>
          <sphereGeometry args={[1.1, 16, 12]} />
          <meshPhongMaterial color="#1a1a2e" shininess={60} flatShading />
        </mesh>
        {/* 5-9: Hair fringes */}
        {[0,1,2,3,4].map(i => {
          const angle = -0.6 + (i / 4) * 1.2;
          return (
            <mesh key={`fringe-${i}`} ref={mr(5+i)} position={[Math.sin(angle) * 0.9, 1.1 + i*0.03, Math.cos(angle) * 0.5 + 0.5]} scale={[1.2, 0.6, 1]}>
              <sphereGeometry args={[0.22, 8, 6]} />
              <meshPhongMaterial color="#1a1a2e" shininess={60} flatShading />
            </mesh>
          );
        })}
        {/* 10: Ear L */}
        <mesh ref={mr(10)} position={[-1.12, 0.05, 0.1]} scale={[0.6, 1.2, 1]}>
          <sphereGeometry args={[0.18, 12, 8]} />
          <meshPhongMaterial color="#c4946a" shininess={30} />
        </mesh>
        {/* 11: Ear R */}
        <mesh ref={mr(11)} position={[1.12, 0.05, 0.1]} scale={[0.6, 1.2, 1]}>
          <sphereGeometry args={[0.18, 12, 8]} />
          <meshPhongMaterial color="#c4946a" shininess={30} />
        </mesh>
        {/* 12-13: Eyes */}
        <mesh ref={mr(12)} position={[-0.38, 0.2, 0.9]} scale={[1.3, 1, 1]}>
          <sphereGeometry args={[0.2, 16, 12]} />
          <meshPhongMaterial color="#ffffff" shininess={80} />
        </mesh>
        <mesh ref={mr(13)} position={[0.38, 0.2, 0.9]} scale={[1.3, 1, 1]}>
          <sphereGeometry args={[0.2, 16, 12]} />
          <meshPhongMaterial color="#ffffff" shininess={80} />
        </mesh>
        {/* 14-15: Irises */}
        <mesh ref={mr(14)} position={[-0.36, 0.2, 1.08]}>
          <sphereGeometry args={[0.12, 12, 8]} />
          <meshPhongMaterial color="#2c1810" shininess={100} />
        </mesh>
        <mesh ref={mr(15)} position={[0.36, 0.2, 1.08]}>
          <sphereGeometry args={[0.12, 12, 8]} />
          <meshPhongMaterial color="#2c1810" shininess={100} />
        </mesh>
        {/* 16-17: Pupils */}
        <mesh ref={mr(16)} position={[-0.35, 0.2, 1.16]}>
          <sphereGeometry args={[0.06, 8, 6]} />
          <meshPhongMaterial color="#050505" shininess={120} />
        </mesh>
        <mesh ref={mr(17)} position={[0.35, 0.2, 1.16]}>
          <sphereGeometry args={[0.06, 8, 6]} />
          <meshPhongMaterial color="#050505" shininess={120} />
        </mesh>
        {/* 18-19: Eye shines */}
        <mesh ref={mr(18)} position={[-0.32, 0.24, 1.18]}>
          <sphereGeometry args={[0.035, 8, 6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh ref={mr(19)} position={[0.38, 0.24, 1.18]}>
          <sphereGeometry args={[0.035, 8, 6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* 20-21: Brows */}
        <mesh ref={mr(20)} position={[-0.38, 0.45, 0.95]} rotation={[0, 0, 0.1]}>
          <boxGeometry args={[0.35, 0.06, 0.08]} />
          <meshPhongMaterial color="#1a1a2e" />
        </mesh>
        <mesh ref={mr(21)} position={[0.38, 0.45, 0.95]} rotation={[0, 0, -0.1]}>
          <boxGeometry args={[0.35, 0.06, 0.08]} />
          <meshPhongMaterial color="#1a1a2e" />
        </mesh>
        {/* 22: Nose */}
        <mesh ref={mr(22)} position={[0, -0.05, 1.1]} scale={[0.8, 1.2, 1]}>
          <sphereGeometry args={[0.12, 10, 8]} />
          <meshPhongMaterial color="#c4946a" shininess={30} />
        </mesh>
        {/* 23: Nose bridge */}
        <mesh ref={mr(23)} position={[0, 0.1, 1.0]}>
          <boxGeometry args={[0.08, 0.3, 0.1]} />
          <meshPhongMaterial color="#d4a574" shininess={40} />
        </mesh>
        {/* 24: Mouth */}
        <mesh ref={mr(24)} position={[0, -0.32, 1.0]} rotation={[0.1, 0, 0]}>
          <torusGeometry args={[0.15, 0.035, 8, 16, Math.PI]} />
          <meshPhongMaterial color="#b07060" shininess={50} />
        </mesh>
        {/* 25-26: Glass frames */}
        <mesh ref={mr(25)} position={[-0.38, 0.2, 1.0]} rotation={[0, 0, Math.PI / 4]}>
          <torusGeometry args={[0.28, 0.025, 8, 4]} />
          <meshPhongMaterial color="#00e5ff" transparent opacity={0.6} shininess={100} />
        </mesh>
        <mesh ref={mr(26)} position={[-0.38, 0.2, 0.99]} rotation={[0, 0, Math.PI / 4]}>
          <circleGeometry args={[0.25, 4]} />
          <meshPhongMaterial color="#00e5ff" transparent opacity={0.25} shininess={120} />
        </mesh>
        <mesh ref={mr(27)} position={[0.38, 0.2, 1.0]} rotation={[0, 0, Math.PI / 4]}>
          <torusGeometry args={[0.28, 0.025, 8, 4]} />
          <meshPhongMaterial color="#00e5ff" transparent opacity={0.6} shininess={100} />
        </mesh>
        <mesh ref={mr(28)} position={[0.38, 0.2, 0.99]} rotation={[0, 0, Math.PI / 4]}>
          <circleGeometry args={[0.25, 4]} />
          <meshPhongMaterial color="#00e5ff" transparent opacity={0.25} shininess={120} />
        </mesh>
        {/* 29: Bridge */}
        <mesh ref={mr(29)} position={[0, 0.24, 1.05]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.015, 0.015, 0.2, 6]} />
          <meshPhongMaterial color="#00e5ff" transparent opacity={0.6} shininess={100} />
        </mesh>
        {/* 30-31: Arms */}
        <mesh ref={mr(30)} position={[-0.68, 0.2, 0.6]} rotation={[Math.PI / 2, 0, 0.15]}>
          <cylinderGeometry args={[0.012, 0.012, 0.8, 6]} />
          <meshPhongMaterial color="#00e5ff" transparent opacity={0.6} shininess={100} />
        </mesh>
        <mesh ref={mr(31)} position={[0.68, 0.2, 0.6]} rotation={[Math.PI / 2, 0, -0.15]}>
          <cylinderGeometry args={[0.012, 0.012, 0.8, 6]} />
          <meshPhongMaterial color="#00e5ff" transparent opacity={0.6} shininess={100} />
        </mesh>
        {/* 32: Neck */}
        <mesh ref={mr(32)} position={[0, -1.2, 0]}>
          <cylinderGeometry args={[0.4, 0.5, 0.5, 16]} />
          <meshPhongMaterial color="#d4a574" shininess={40} />
        </mesh>
        {/* 33: Hood */}
        <mesh ref={mr(33)} position={[0, -0.9, 0]} scale={[1.35, 1.1, 1.2]}>
          <sphereGeometry args={[1.0, 16, 12, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.45]} />
          <meshPhongMaterial color="#12121a" shininess={20} />
        </mesh>
        {/* 34-35: Hoodie strings */}
        <mesh ref={mr(34)} position={[-0.2, -1.5, 0.9]}>
          <cylinderGeometry args={[0.01, 0.015, 0.4, 6]} />
          <meshPhongMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={0.3} shininess={120} />
        </mesh>
        <mesh ref={mr(35)} position={[0.2, -1.5, 0.9]}>
          <cylinderGeometry args={[0.01, 0.015, 0.4, 6]} />
          <meshPhongMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={0.3} shininess={120} />
        </mesh>
        {/* 36-37: String tips */}
        <mesh ref={mr(36)} position={[-0.2, -1.72, 0.9]}>
          <sphereGeometry args={[0.03, 8, 6]} />
          <meshPhongMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={0.3} shininess={120} />
        </mesh>
        <mesh ref={mr(37)} position={[0.2, -1.72, 0.9]}>
          <sphereGeometry args={[0.03, 8, 6]} />
          <meshPhongMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={0.3} shininess={120} />
        </mesh>
        {/* 38: Ring 1 */}
        <mesh ref={mr(38)} rotation={[Math.PI * 0.4, 0.3, 0]}>
          <torusGeometry args={[2.0, 0.008, 8, 64]} />
          <meshBasicMaterial color="#00e5ff" transparent opacity={0.2} />
        </mesh>
        {/* 39: Ring 2 */}
        <mesh ref={mr(39)} rotation={[Math.PI * 0.55, 0, 0.5]}>
          <torusGeometry args={[2.3, 0.006, 8, 64]} />
          <meshBasicMaterial color="#7c4dff" transparent opacity={0.15} />
        </mesh>
        {/* 40-42: Orbital dots */}
        <mesh ref={mr(40)}>
          <sphereGeometry args={[0.04, 8, 6]} />
          <meshBasicMaterial color="#00e5ff" />
        </mesh>
        <mesh ref={mr(41)}>
          <sphereGeometry args={[0.04, 8, 6]} />
          <meshBasicMaterial color="#7c4dff" />
        </mesh>
        <mesh ref={mr(42)}>
          <sphereGeometry args={[0.04, 8, 6]} />
          <meshBasicMaterial color="#ff4081" />
        </mesh>
      </group>
    </>
  );
}

function AvatarCanvas({ chaos, activeSection }) {
  return (
    <div style={{ position: 'relative', width: 400, height: 450, flexShrink: 0 }}>
      <Canvas camera={{ position: [0, 0.5, 6.5], fov: 35 }} dpr={[1, 2]} gl={{ alpha: true, antialias: true }} style={{ width: '100%', height: '100%', cursor: 'grab' }}>
        <HeadModel chaos={chaos} activeSection={activeSection} />
      </Canvas>
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
  { id:5, cat:"ai", idx:"01", name:"CyberLLM", short:"Domain-specific 350M param cybersecurity LLM built from scratch", desc:"Built a domain-specific cybersecurity language model from scratch — a 350M parameter LLaMA-3 style decoder-only transformer. Trained a custom SentencePiece tokenizer (32K vocab) on security corpus, then pretrained on 5B tokens from 10+ cybersecurity sources including NVD/CVE, MITRE ATT&CK, NIST SP 800, and OWASP. Fine-tuned with 3,750 cybersecurity instruction pairs via SFT. Runs locally on Apple M4 MPS.", tech:["Python","PyTorch","LLaMA-3","SentencePiece","RunPod A40","Flask"], metric:"350M", metricLabel:"Parameters", features:["Custom 32K tokenizer trained on security corpus","3.4B tokens from 10+ cybersecurity data sources","LLaMA-3 architecture: 24 layers, GQA, SwiGLU, RoPE","Pretraining loss: 9.2 → 3.8 over 5B token budget","SFT on 3,750 cybersecurity instruction pairs","SOC Dashboard with real-time alert analysis"], challenges:"Training a capable LLM with limited compute required careful data curation — 90% security-weighted training data from Primus-FineWeb, Stack Exchange InfoSec, ArXiv cs.CR, and government publications. Solved scaling issues by testing the full pipeline locally on M4 before running 50-hour A40 training on RunPod.", year:"2025-2026", color:"#00ff88", github:"https://github.com/Omkarth/CyberLLM", hasDemo:true },
  { id:1, cat:"security", idx:"02", name:"Secure Open Chat Protocol (SOCP)", short:"WebSocket-based encrypted messaging with RSA-4096 & asyncio", desc:"Designed the core server architecture and implemented WebSocket handling for a secure, asynchronous messaging system. Engineered the message routing mechanism and utilized Python's asyncio library to successfully manage multiple parallel connections. Led the project's intentional backdoor implementation strategy, designing vulnerabilities for peer-review security auditing. Integrated RSA-4096 encryption and canonical JSON serialization to ensure strict signature verification across the network.", tech:["Python","WebSockets","asyncio","RSA-4096","JSON"], metric:"RSA-4096", metricLabel:"Encryption", features:["Asynchronous message routing","RSA-4096 end-to-end encryption","Canonical JSON serialization","Peer-review security auditing","Multi-connection management"], challenges:"Managing concurrent WebSocket connections while maintaining encryption integrity was the core challenge. Solved by implementing an async event loop with dedicated encryption/decryption pipelines per connection.", year:"2025-2026", color:"#00e5ff", github:"https://github.com/Omkarth" },
  { id:2, cat:"iot", idx:"03", name:"IoT Smart Logistics System", short:"Real-time tracking system reducing delivery delays by 40-50%", desc:"Developed an IoT-powered system to streamline logistics and transportation with real-time tracking and resource optimization. Integrated IoT sensors and cloud analytics, reducing delivery delays by 40-50% through automated route planning. Enhanced operational efficiency by 60% with predictive maintenance and data-driven insights.", tech:["IoT","Python","MQTT","AWS","Cloud Computing"], metric:"-50%", metricLabel:"Delivery Delays", features:["Real-time GPS tracking","Automated route optimization","Predictive maintenance alerts","Cloud-based analytics dashboard","MQTT sensor integration"], challenges:"Handling real-time data streams from hundreds of IoT sensors while maintaining low latency. Implemented MQTT message queuing with AWS IoT Core for scalable ingestion.", year:"2024-2025", color:"#7c4dff", github:"https://github.com/Omkarth" },
  { id:3, cat:"ai", idx:"04", name:"Human Action Detection", short:"95% accuracy real-time detection in video via MATLAB & ML", desc:"Built a system for real-time human action and object detection in videos using MATLAB, targeting surveillance applications. Achieved 95% accuracy in detection by leveraging computer vision and machine learning algorithms. Reduced processing time by 80% through optimized feature extraction and model training.", tech:["MATLAB","OpenCV","Neural Networks","Computer Vision","ML"], metric:"95%", metricLabel:"Accuracy", features:["Real-time video processing","Multi-action classification","Object detection overlay","Optimized feature extraction","Surveillance-grade performance"], challenges:"Achieving real-time performance with high accuracy required innovative feature extraction. Implemented a pipeline that reduced processing time by 80% while maintaining 95% detection accuracy.", year:"2023-2024", color:"#ff4081", github:"https://github.com/Omkarth" },
  { id:4, cat:"web", idx:"05", name:"Virtual Queuing System", short:"Ration distribution system boosting efficiency by 50%", desc:"Designed a virtual queuing system to improve ration distribution, minimizing wait times for beneficiaries. Automated scheduling and notifications, increasing distribution efficiency by 50%. Improved accessibility for users through a user-friendly interface and real-time updates.", tech:["Python","JavaScript","MySQL","Web Frameworks","Mobile Dev"], metric:"+50%", metricLabel:"Efficiency", features:["Virtual queue management","Automated SMS notifications","Real-time status updates","Mobile-responsive interface","Admin analytics dashboard"], challenges:"Designing a system accessible to users with varying tech literacy. Built a progressive web app with SMS fallback for notifications and an extremely simplified UI flow.", year:"2022-2023", color:"#ffc107", github:"https://github.com/Omkarth" },
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

// ===== SOC DASHBOARD INLINE DEMO =====
const SOC_ALERTS = [
  { id:"ALT-0847", title:"PowerShell Encoded Command", severity:"critical", score:92, src_ip:"10.0.12.45", dst_ip:"185.220.101.34", hostname:"WRK-FIN-042", user:"j.martinez", source:"EDR - CrowdStrike", mitre:["T1059.001","T1027"], tactics:["Execution","Defense Evasion"],
    raw_log:'Process: powershell.exe | Args: -enc SQBFAFgAIAAoAE4AZQB3AC... | PID: 4892 | PPID: 3104 (explorer.exe)',
    analysis:"A PowerShell process launched with a Base64-encoded command — a common technique to obfuscate malicious payloads. The encoded command decodes to a download cradle fetching a remote script. Parent process (explorer.exe) suggests user-initiated execution, likely via phishing. Recommended: isolate host, capture memory dump, block external IP, investigate email activity.",
    playbook:["Isolate host WRK-FIN-042 from network","Capture memory dump using WinPmem","Block IP 185.220.101.34 at firewall","Check email gateway for messages to j.martinez","Search EDR for other hosts connecting to 185.220.101.34","Preserve PowerShell script block logs (Event ID 4104)","Escalate to Tier 2 for malware analysis"] },
  { id:"ALT-0848", title:"Kerberoasting - Suspicious TGS", severity:"high", score:78, src_ip:"10.0.8.22", dst_ip:"10.0.1.5", hostname:"WRK-DEV-019", user:"svc_backup", source:"SIEM - Splunk", mitre:["T1558.003"], tactics:["Credential Access"],
    raw_log:'EventID: 4769 | ServiceName: MSSQLSvc/DB-PROD-01 | TicketEncryption: 0x17 (RC4)',
    analysis:"Multiple Kerberos TGS requests using RC4 encryption (downgraded from AES), targeting service accounts with SPNs. Consistent with Kerberoasting — requesting tickets for offline password cracking.",
    playbook:["Verify svc_backup logon history","Reset targeted service account password","Audit all SPN accounts for weak passwords","Enable AES-only Kerberos via Group Policy","Check for BloodHound artifacts on WRK-DEV-019"] },
  { id:"ALT-0849", title:"Lateral Movement via PsExec", severity:"critical", score:88, src_ip:"10.0.12.45", dst_ip:"10.0.5.100", hostname:"SRV-DC-01", user:"admin_jsmith", source:"EDR - SentinelOne", mitre:["T1570","T1021.002"], tactics:["Lateral Movement"],
    raw_log:'Service installed: PSEXESVC | Path: %SystemRoot%\\PSEXESVC.exe | Source: 10.0.12.45',
    analysis:"PsExec service installation on the domain controller from the same workstation involved in the PowerShell alert. Indicates lateral movement after initial compromise using admin credentials.",
    playbook:["CRITICAL: Isolate SRV-DC-01","Block all traffic from 10.0.12.45","Reset admin_jsmith credentials","Check for DCSync or NTDS.dit extraction","Activate full incident response"] },
  { id:"ALT-0850", title:"DNS Tunneling Detected", severity:"medium", score:65, src_ip:"10.0.9.88", dst_ip:"8.8.8.8", hostname:"WRK-MKT-007", user:"a.chen", source:"NDR - Zeek", mitre:["T1071.004","T1048.003"], tactics:["Command and Control","Exfiltration"],
    raw_log:'DNS Query: aG9zdG5hbWU9V1JLLU1LVC0wMDc=.data.evil-c2.com | Type: TXT | Freq: 142/min',
    analysis:"High-volume DNS queries with Base64-encoded subdomain labels to an external domain. Characteristic of DNS tunneling for data exfiltration or C2 channels.",
    playbook:["Block domain evil-c2.com at DNS and firewall","Isolate WRK-MKT-007","Decode Base64 subdomains to identify exfiltrated data","Search for dnscat2/iodine on the host"] },
  { id:"ALT-0851", title:"Brute Force - Failed Logins", severity:"low", score:35, src_ip:"203.0.113.42", dst_ip:"10.0.1.10", hostname:"VPN-GW-01", user:"multiple", source:"SIEM - Splunk", mitre:["T1110.001"], tactics:["Credential Access"],
    raw_log:'EventID: 4625 | LogonType: 10 | TargetUsers: admin,administrator,root | Failures: 847/300s',
    analysis:"External IP conducting credential brute force against VPN gateway at high rate. Volume suggests targeted campaign.",
    playbook:["Block 203.0.113.42 at perimeter firewall","Verify account lockout policy (threshold: 5)","Check if targeted usernames are valid accounts","Add IP to threat intel watchlist"] },
];

const SOC_SEV = {
  critical:{c:"#ff2b2b",bg:"#1a0505",l:"CRIT"}, high:{c:"#ff8c00",bg:"#1a0f00",l:"HIGH"},
  medium:{c:"#eab308",bg:"#1a1500",l:"MED"}, low:{c:"#22c55e",bg:"#001a0a",l:"LOW"},
};
const SOC_MITRE = {
  "T1059.001":"PowerShell","T1027":"Obfuscated Files","T1558.003":"Kerberoasting",
  "T1570":"Lateral Tool Transfer","T1021.002":"SMB/Admin Shares",
  "T1071.004":"DNS C2","T1048.003":"Exfil Unencrypted","T1110.001":"Password Guessing",
};

function SOCDashboardDemo() {
  const [sel, setSel] = useState(null);
  const [tab, setTab] = useState("analysis");
  const [filt, setFilt] = useState("all");
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState([]);
  const [inp, setInp] = useState("");
  const [typing, setTyping] = useState(false);
  const chatEnd = useRef(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({behavior:"smooth"}); }, [chat]);

  const filtered = filt==="all" ? SOC_ALERTS : SOC_ALERTS.filter(a=>a.severity===filt);
  const mono = "'Space Mono','Menlo','Consolas',monospace";
  const sans = "'DM Sans','Segoe UI',system-ui,sans-serif";

  const pick = async (a) => {
    setSel(a); setTab("analysis"); setChat([]);
    setLoading(true);
    await new Promise(r=>setTimeout(r,600+Math.random()*800));
    setLoading(false);
  };

  const send = async () => {
    if (!inp.trim()||typing||!sel) return;
    const m = inp.trim(); setInp(""); setChat(p=>[...p,{r:"u",c:m}]); setTyping(true);
    await new Promise(r=>setTimeout(r,500+Math.random()*800));
    const fallback = {
      block:"Block the source IP at the perimeter firewall and add to threat intel blocklist. Create SIEM correlation rules for future connections.",
      isolat:"Isolate the host via EDR console. Do NOT power off — preserve volatile memory. Begin memory acquisition with WinPmem.",
      investigat:"Collect forensic artifacts: memory dump, disk image, event logs. Review process chain, check persistence mechanisms.",
      report:"Include: executive summary, timeline, affected systems, root cause, MITRE mapping, containment actions, remediation steps.",
    };
    const l=m.toLowerCase(); let resp="I can help with blocking IPs, isolating hosts, investigating artifacts, and generating reports. Ask about specific response actions.";
    for(const k of Object.keys(fallback)){if(l.includes(k)){resp=fallback[k];break;}}
    setChat(p=>[...p,{r:"a",c:resp}]);
    setTyping(false);
  };

  return (
    <div style={{background:"#050709",borderRadius:10,overflow:"hidden",border:"1px solid #151a28",fontFamily:sans}}>
      <style>{`@keyframes socfs{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
@keyframes socp{0%,100%{opacity:1}50%{opacity:.25}}`}</style>

      {/* Top Bar */}
      <div style={{height:38,background:"#08090e",borderBottom:"1px solid #151a28",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 12px"}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:22,height:22,borderRadius:4,background:"linear-gradient(135deg,#00e87b,#00a858)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#000"}}>S</div>
          <span style={{fontSize:12,fontWeight:700,color:"#00e87b"}}>SOC Assistant</span>
          <span style={{fontSize:9,color:"#2a3048",fontFamily:mono}}>CyberLLM-350M</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          <div style={{width:5,height:5,borderRadius:"50%",background:"#00e87b",animation:"socp 2s infinite"}}/>
          <span style={{fontSize:9,color:"#00e87b",fontFamily:mono}}>DEMO</span>
        </div>
      </div>

      <div style={{display:"flex",height:380}}>
        {/* Sidebar */}
        <div style={{width:240,borderRight:"1px solid #151a28",display:"flex",flexDirection:"column",background:"#070810",flexShrink:0}}>
          <div style={{padding:"6px 10px",borderBottom:"1px solid #151a28",display:"flex",gap:3}}>
            {["all","critical","high","medium","low"].map(f=>(
              <button key={f} onClick={()=>setFilt(f)} style={{padding:"2px 5px",borderRadius:3,border:"none",fontSize:8,fontWeight:600,cursor:"pointer",fontFamily:mono,background:filt===f?"#0f1a14":"transparent",color:filt===f?"#00e87b":"#2a3048"}}>{f.toUpperCase()}</button>
            ))}
          </div>
          <div style={{flex:1,overflowY:"auto"}}>
            {filtered.map(a=>{const sv=SOC_SEV[a.severity];const on=sel?.id===a.id;return(
              <div key={a.id} onClick={()=>pick(a)} style={{padding:"8px 10px",borderBottom:"1px solid #0e1118",cursor:"pointer",background:on?"#0c1018":"transparent",borderLeft:on?`2px solid ${sv.c}`:"2px solid transparent",transition:"all .12s"}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:4}}>
                  <span style={{fontSize:10.5,fontWeight:600,color:"#c0c8d8",lineHeight:1.3}}>{a.title}</span>
                  <span style={{fontSize:8,fontWeight:700,color:sv.c,background:sv.bg,padding:"1px 4px",borderRadius:3,fontFamily:mono,flexShrink:0}}>{sv.l}</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
                  <span style={{fontSize:8,color:"#252a38",fontFamily:mono}}>{a.id}</span>
                  <span style={{fontSize:8,color:"#252a38",fontFamily:mono}}>{a.hostname}</span>
                </div>
              </div>
            );})}
          </div>
        </div>

        {/* Main Panel */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {/* Stats Row */}
          <div style={{display:"flex",borderBottom:"1px solid #151a28",background:"#070810"}}>
            {[["Total",5,"#b8bfcc"],["Crit",2,"#ff2b2b"],["High",1,"#ff8c00"],["Med",1,"#eab308"],["Low",1,"#22c55e"]].map(([l,v,c])=>(
              <div key={l} style={{flex:1,padding:"6px 8px",borderRight:"1px solid #151a28",textAlign:"center"}}>
                <div style={{fontSize:16,fontWeight:700,color:c,fontFamily:mono}}>{v}</div>
                <div style={{fontSize:7,color:"#2a3048",textTransform:"uppercase",letterSpacing:.4}}>{l}</div>
              </div>
            ))}
          </div>

          {sel ? (
            <>
              {/* Alert Header */}
              <div style={{padding:"8px 12px",borderBottom:"1px solid #151a28",background:"#070810",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:"#dde0e8"}}>{sel.title}</div>
                  <div style={{fontSize:9,color:"#2a3048",fontFamily:mono,marginTop:1}}>{sel.id} · {sel.user}@{sel.hostname}</div>
                </div>
                <div style={{width:34,height:34,borderRadius:"50%",border:`2px solid ${SOC_SEV[sel.severity].c}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:mono,fontSize:12,fontWeight:700,color:SOC_SEV[sel.severity].c}}>{sel.score}</div>
              </div>

              {/* Tabs */}
              <div style={{display:"flex",borderBottom:"1px solid #151a28",background:"#070810"}}>
                {[["analysis","Analysis"],["playbook","Playbook"],["mitre","MITRE"],["raw","Raw Log"],["chat","Ask CyberLLM"]].map(([k,l])=>(
                  <button key={k} onClick={()=>setTab(k)} style={{padding:"5px 10px",fontSize:10,fontWeight:600,cursor:"pointer",border:"none",background:"transparent",color:tab===k?"#00e87b":"#2a3048",borderBottom:tab===k?"2px solid #00e87b":"2px solid transparent",fontFamily:sans}}>{l}</button>
                ))}
              </div>

              {/* Tab Content */}
              <div style={{flex:1,overflowY:"auto",padding:10}}>
                {tab==="analysis"&&(
                  <div>
                    <div style={{background:"#0a0c14",border:"1px solid #151a28",borderRadius:6,padding:12,marginBottom:8}}>
                      <div style={{fontSize:8,fontWeight:700,color:"#2a3048",textTransform:"uppercase",letterSpacing:.8,marginBottom:6}}>CyberLLM Threat Analysis</div>
                      {loading?(
                        <div style={{display:"flex",alignItems:"center",gap:5,color:"#2a3048"}}>
                          {[0,1,2].map(i=><div key={i} style={{width:4,height:4,borderRadius:"50%",background:"#00e87b",animation:`socp 1.4s infinite ${i*.2}s`}}/>)}
                          <span style={{fontSize:10,fontFamily:mono}}>Analyzing...</span>
                        </div>
                      ):(
                        <div style={{fontSize:11,lineHeight:1.7,color:"#8890a8",animation:"socfs .4s ease"}}>{sel.analysis}</div>
                      )}
                    </div>
                    <div style={{background:"#0a0c14",border:"1px solid #151a28",borderRadius:6,padding:12}}>
                      <div style={{fontSize:8,fontWeight:700,color:"#2a3048",textTransform:"uppercase",letterSpacing:.8,marginBottom:6}}>Details</div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4}}>
                        {[["Src IP",sel.src_ip],["Dst IP",sel.dst_ip],["Host",sel.hostname],["User",sel.user],["Score",`${sel.score}/100`],["Source",sel.source]].map(([l,v])=>(
                          <div key={l} style={{padding:"4px 6px",background:"#06080c",borderRadius:3}}>
                            <div style={{fontSize:8,color:"#1a1f2e"}}>{l}</div>
                            <div style={{fontSize:10,color:"#8890a8",fontFamily:mono}}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {tab==="playbook"&&(
                  <div style={{background:"#0a0c14",border:"1px solid #151a28",borderRadius:6,padding:12}}>
                    <div style={{fontSize:8,fontWeight:700,color:"#2a3048",textTransform:"uppercase",letterSpacing:.8,marginBottom:8}}>Response Playbook</div>
                    {sel.playbook.map((step,i)=>(
                      <div key={i} style={{display:"flex",gap:6,padding:"5px 0",borderBottom:"1px solid #0e1118",animation:`socfs .3s ease ${i*.06}s both`}}>
                        <div style={{width:18,height:18,borderRadius:"50%",background:"#081a10",color:"#00e87b",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,flexShrink:0}}>{i+1}</div>
                        <div style={{fontSize:11,color:"#8890a8",lineHeight:1.5}}>{step}</div>
                      </div>
                    ))}
                  </div>
                )}

                {tab==="mitre"&&(
                  <div>
                    <div style={{background:"#0a0c14",border:"1px solid #151a28",borderRadius:6,padding:12,marginBottom:8}}>
                      <div style={{fontSize:8,fontWeight:700,color:"#2a3048",textTransform:"uppercase",letterSpacing:.8,marginBottom:8}}>Mapped Techniques</div>
                      {sel.mitre.map(tid=>(
                        <div key={tid} style={{padding:"6px 8px",background:"#06080c",borderRadius:4,border:"1px solid #0e1118",marginBottom:4,display:"flex",justifyContent:"space-between"}}>
                          <span><span style={{fontSize:10,fontWeight:600,color:"#00e87b",fontFamily:mono}}>{tid}</span><span style={{fontSize:10,color:"#687088",marginLeft:6}}>{SOC_MITRE[tid]}</span></span>
                        </div>
                      ))}
                    </div>
                    <div style={{background:"#0a0c14",border:"1px solid #151a28",borderRadius:6,padding:12}}>
                      <div style={{fontSize:8,fontWeight:700,color:"#2a3048",textTransform:"uppercase",letterSpacing:.8,marginBottom:8}}>Tactic Chain</div>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
                        {sel.tactics.map((t,i)=>(
                          <div key={t} style={{display:"flex",alignItems:"center",gap:4}}>
                            <div style={{padding:"4px 8px",borderRadius:4,background:"#081a10",border:"1px solid #0a3018",color:"#00e87b",fontSize:10,fontWeight:600}}>{t}</div>
                            {i<sel.tactics.length-1&&<span style={{color:"#151a28",fontSize:12}}>→</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {tab==="raw"&&(
                  <div style={{background:"#0a0c14",border:"1px solid #151a28",borderRadius:6,padding:12}}>
                    <div style={{fontSize:8,fontWeight:700,color:"#2a3048",textTransform:"uppercase",letterSpacing:.8,marginBottom:6}}>Raw Log</div>
                    <pre style={{background:"#030406",border:"1px solid #0e1118",borderRadius:3,padding:10,fontSize:10,color:"#00e87b",fontFamily:mono,lineHeight:1.5,whiteSpace:"pre-wrap",wordBreak:"break-all",margin:0}}>{sel.raw_log}</pre>
                  </div>
                )}

                {tab==="chat"&&(
                  <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
                    <div style={{flex:1,overflowY:"auto",marginBottom:8}}>
                      {chat.length===0&&(
                        <div style={{textAlign:"center",padding:16,color:"#1a1f2e",fontSize:11}}>
                          Ask about this alert (demo mode)
                        </div>
                      )}
                      {chat.map((m,i)=>(
                        <div key={i} style={{display:"flex",gap:5,marginBottom:8,animation:"socfs .3s ease"}}>
                          <div style={{width:18,height:18,borderRadius:4,flexShrink:0,background:m.r==="u"?"#0e0e1e":"#081a10",border:`1px solid ${m.r==="u"?"#1a1a30":"#0a3018"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:m.r==="u"?"#4444aa":"#00e87b"}}>{m.r==="u"?"Y":"C"}</div>
                          <div style={{fontSize:11,lineHeight:1.5,color:m.r==="u"?"#b8bfcc":"#8890a8"}}>{m.c}</div>
                        </div>
                      ))}
                      {typing&&<div style={{display:"flex",gap:3,padding:4}}>{[0,1,2].map(i=><div key={i} style={{width:4,height:4,borderRadius:"50%",background:"#00e87b",animation:`socp 1.4s infinite ${i*.2}s`}}/>)}</div>}
                      <div ref={chatEnd}/>
                    </div>
                    <div style={{display:"flex",gap:5}}>
                      <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask about this alert..."
                        style={{flex:1,background:"#0a0c14",border:"1px solid #151a28",borderRadius:4,padding:"6px 8px",color:"#b8bfcc",fontSize:11,outline:"none",fontFamily:sans}}/>
                      <button onClick={send} disabled={typing} style={{padding:"6px 10px",borderRadius:4,border:"none",background:"#00e87b",color:"#000",fontWeight:700,fontSize:10,cursor:"pointer",fontFamily:sans}}>Send</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ):(
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:6}}>
              <div style={{fontSize:28}}>🛡️</div>
              <div style={{fontSize:13,fontWeight:700,color:"#151a28"}}>Select an alert to analyze</div>
              <div style={{fontSize:10,color:"#0e1118"}}>Click any alert from the sidebar</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
        x: 0, y: 0, z: 0, vx: (Math.random() - 0.5) * 2, vy: -(Math.random() * 3 + 1), vz: (Math.random() - 0.5) * 1,
        rotation: 0, rotVel: (Math.random() - 0.5) * 4, scale: 1, opacity: 1, seed: Math.random(),
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
        x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight * 5,
        size: Math.random() * 6 + 2, speed: Math.random() * 2 + 0.5, drift: (Math.random() - 0.5) * 3,
        rot: Math.random() * 360, rotSpeed: (Math.random() - 0.5) * 5,
        color: ['#00e5ff', '#7c4dff', '#ff4081', '#ffc107'][Math.floor(Math.random() * 4)],
        shape: Math.floor(Math.random() * 3),
      }));
    }

    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;

    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const intensity = Math.min(chaos, 1);
      debrisRef.current.forEach(d => {
        d.y -= d.speed * (1 + intensity * 4); d.x += d.drift * intensity; d.rot += d.rotSpeed * (1 + intensity * 3);
        if (d.y < -50) { d.y = canvas.height + 50; d.x = Math.random() * canvas.width; }
        if (d.x < -50) d.x = canvas.width + 50; if (d.x > canvas.width + 50) d.x = -50;
        const screenY = d.y - (scrollY * d.speed * 0.3);
        const alpha = 0.15 + intensity * 0.4;
        ctx.save();
        ctx.translate(d.x, ((screenY % (canvas.height + 100)) + canvas.height + 100) % (canvas.height + 100) - 50);
        ctx.rotate(d.rot * Math.PI / 180); ctx.globalAlpha = alpha; ctx.fillStyle = d.color; ctx.shadowColor = d.color; ctx.shadowBlur = 8 + intensity * 15;
        if (d.shape === 0) { ctx.fillRect(-d.size/2, -d.size/2, d.size, d.size); }
        else if (d.shape === 1) { ctx.beginPath(); ctx.arc(0, 0, d.size/2, 0, Math.PI * 2); ctx.fill(); }
        else { ctx.beginPath(); for (let i = 0; i < 3; i++) { const angle = (i * 120 - 90) * Math.PI / 180; ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(angle) * d.size, Math.sin(angle) * d.size); } ctx.closePath(); ctx.fill(); }
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
    vx: (Math.random() - 0.5) * 8, vy: -(Math.random() * 6 + 2), vr: (Math.random() - 0.5) * 6,
    seed: Math.random(), lastChaos: 0,
  });

  const getTransform = useCallback(() => {
    const p = physicsRef.current;
    const intensity = Math.max(0, chaos);
    const t = Date.now() * 0.001;

    if (intensity > 0.05) {
      if (p.lastChaos < 0.05) { p.vx = (Math.random() - 0.5) * 12; p.vy = -(Math.random() * 8 + 3); p.vr = (Math.random() - 0.5) * 10; }
      p.offsetX += p.vx * intensity * 0.6; p.offsetY += p.vy * intensity * 0.8; p.rotation += p.vr * intensity * 0.5;
      p.vx *= 0.98; p.vy *= 0.98; p.vy -= 0.05 * intensity; p.vr *= 0.99;

      if (elRef.current && mousePos) {
        const rect = elRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2; const cy = rect.top + rect.height / 2;
        const dx = cx - mousePos.x; const dy = cy - mousePos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 250) { const force = (250 - dist) / 250 * intensity * 2; p.vx += (dx / dist) * force; p.vy += (dy / dist) * force; }
      }

      const wobbleX = Math.sin(t * (1 + p.seed * 2) + p.seed * 10) * 8 * intensity;
      const wobbleY = Math.cos(t * (0.8 + p.seed * 1.5) + p.seed * 7) * 6 * intensity;
      p.lastChaos = intensity;
      return { transform: `translate(${p.offsetX + wobbleX}px, ${p.offsetY + wobbleY}px) rotate(${p.rotation}deg) scale(${1 + intensity * 0.05})`, opacity: Math.max(0.3, 1 - intensity * 0.3), filter: `blur(${intensity * 0.5}px)`, transition: 'none' };
    } else {
      p.offsetX *= 0.9; p.offsetY *= 0.9; p.rotation *= 0.9; p.lastChaos = intensity;
      return { transform: `translate(${p.offsetX}px, ${p.offsetY}px) rotate(${p.rotation}deg)`, opacity: 1, filter: 'none', transition: 'all 0.8s cubic-bezier(0.4,0,0.2,1)' };
    }
  }, [chaos, mousePos]);

  const [dynStyle, setDynStyle] = useState({});

  useEffect(() => {
    let animId;
    const update = () => { setDynStyle(getTransform()); animId = requestAnimationFrame(update); };
    if (chaos > 0.05) { update(); } else { setDynStyle(getTransform()); }
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
    x: (Math.random() - 0.5) * 800, y: -(Math.random() * 600 + 200), r: (Math.random() - 0.5) * 180, delay: Math.random() * 0.3,
  })));
  const { background, WebkitBackgroundClip, WebkitTextFillColor, ...parentStyle } = style || {};
  const letterGradient = (background && WebkitBackgroundClip) ? { background, WebkitBackgroundClip, WebkitTextFillColor } : {};

  return (
    <Tag style={{ ...parentStyle, display: 'inline-block', whiteSpace: 'pre-wrap' }}>
      {letters.map((l, i) => {
        const o = offsets.current[i]; const intensity = Math.min(chaos, 1);
        return (
          <span key={i} style={{
            display: 'inline-block', ...letterGradient,
            transform: intensity > 0.05 ? `translate(${o.x * intensity}px, ${o.y * intensity}px) rotate(${o.r * intensity}deg)` : 'translate(0,0) rotate(0deg)',
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
// ===== R3F ANTI-GRAVITY BACKGROUND SCENE =====
function ShapeGeo({ type }) {
  switch(type) {
    case 0: return <icosahedronGeometry args={[2, 1]} />;
    case 1: return <octahedronGeometry args={[1.8, 0]} />;
    case 2: return <tetrahedronGeometry args={[1.5, 0]} />;
    case 3: return <torusGeometry args={[1.5, 0.4, 8, 16]} />;
    case 4: return <dodecahedronGeometry args={[1.6, 0]} />;
    case 5: return <boxGeometry args={[2, 2, 2]} />;
    case 6: return <coneGeometry args={[1.2, 2.5, 6]} />;
    default: return <torusGeometry args={[1, 0.3, 6, 12]} />;
  }
}

function BackgroundShapes({ chaos }) {
  const groupRef = useRef();
  const particlesRef = useRef();
  const l1Ref = useRef();
  const l2Ref = useRef();
  const chaosRef = useRef(0);
  chaosRef.current = chaos;

  // Generate stable shape data
  const shapes = useMemo(() => {
    return Array.from({ length: 30 }, () => ({
      pos: [(Math.random()-.5)*70, (Math.random()-.5)*70, (Math.random()-.5)*30-10],
      rot: [Math.random()*Math.PI, Math.random()*Math.PI, 0],
      type: Math.floor(Math.random() * 8),
      colorIdx: Math.floor(Math.random() * 4),
      rx: (Math.random()-.5)*.01, ry: (Math.random()-.5)*.01,
      vx: 0, vy: 0, vz: 0,
    }));
  }, []);

  const shapeRefs = useRef([]);
  const smr = (i) => (el) => { if (el) shapeRefs.current[i] = el; };

  const colors = ['#00e5ff', '#7c4dff', '#ff4081', '#ffc107'];
  const opacities = [0.15, 0.12, 0.1, 0.1];

  // Particles
  const { pPos, pVel } = useMemo(() => {
    const count = 600;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i*3] = (Math.random()-.5)*100;
      pos[i*3+1] = (Math.random()-.5)*100;
      pos[i*3+2] = (Math.random()-.5)*50-10;
      vel[i*3] = (Math.random()-.5)*.1;
      vel[i*3+1] = (Math.random()-.5)*.1;
      vel[i*3+2] = (Math.random()-.5)*.05;
    }
    return { pPos: pos, pVel: vel };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const c = chaosRef.current;

    // Animate shapes
    shapeRefs.current.forEach((m, i) => {
      if (!m) return;
      const s = shapes[i];
      s.vy += 0.002 * (1 + c * 5);
      if (c > 0.1) { s.vx += (Math.random()-.5)*0.02*c; s.vy += (Math.random()-.5)*0.01*c; s.vz += (Math.random()-.5)*0.01*c; }
      s.vx *= 0.99; s.vy *= 0.99; s.vz *= 0.99;
      m.position.x += s.vx; m.position.y += s.vy; m.position.z += s.vz;
      if (m.position.y > 50) m.position.y = -50;
      if (m.position.y < -50) m.position.y = 50;
      if (Math.abs(m.position.x) > 50) m.position.x *= -0.9;
      if (Math.abs(m.position.z) > 30) m.position.z *= -0.9;
      m.rotation.x += s.rx * (1 + c * 4);
      m.rotation.y += s.ry * (1 + c * 4);
    });

    // Animate particles
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < 600; i++) {
        positions[i*3] += pVel[i*3] * (1 + c * 3);
        positions[i*3+1] += Math.abs(pVel[i*3+1]) * (1 + c * 5) + 0.02;
        positions[i*3+2] += pVel[i*3+2];
        if (positions[i*3+1] > 60) positions[i*3+1] = -60;
        if (Math.abs(positions[i*3]) > 60) positions[i*3] *= -1;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Camera parallax
    const cam = state.camera;
    cam.position.x += (state.pointer.x * 4 - cam.position.x) * 0.03;
    cam.position.y += (-state.pointer.y * 4 - cam.position.y) * 0.03;
    cam.rotation.z = Math.sin(t * 0.2) * 0.02 * (1 + c * 3);
    cam.lookAt(0, 0, 0);

    // Pulsing lights
    if (l1Ref.current) l1Ref.current.intensity = 1.2 + Math.sin(t * 3) * c * 0.8;
    if (l2Ref.current) l2Ref.current.intensity = 0.8 + Math.cos(t * 2.5) * c * 0.6;
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight ref={l1Ref} position={[10, 15, 25]} intensity={1.2} distance={120} color="#00e5ff" />
      <pointLight ref={l2Ref} position={[-20, -10, 20]} intensity={0.8} distance={120} color="#7c4dff" />
      <pointLight position={[0, 20, -10]} intensity={0.4} distance={100} color="#ff4081" />

      {shapes.map((s, i) => (
        <mesh key={i} ref={smr(i)} position={s.pos} rotation={s.rot}>
          <ShapeGeo type={s.type} />
          <meshPhongMaterial color={colors[s.colorIdx]} transparent opacity={opacities[s.colorIdx]} wireframe />
        </mesh>
      ))}

      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={600} array={pPos} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color="#00e5ff" size={0.08} transparent opacity={0.4} />
      </points>
    </>
  );
}

function BackgroundCanvas({ chaos }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0, 0, 35], fov: 60 }} dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
        <BackgroundShapes chaos={chaos} />
      </Canvas>
    </div>
  );
}

// ===== GRAVITY CONTROL HUD =====
function GravityHUD({ chaos, onToggle, gravityOff }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: '0.15em', color: gravityOff ? '#ff4081' : '#00e5ff', background: 'rgba(10,10,15,0.8)', border: `1px solid ${gravityOff ? '#ff408140' : '#00e5ff40'}`, padding: '6px 12px', backdropFilter: 'blur(10px)', borderRadius: 4 }}>
        GRAVITY: {gravityOff ? 'OFF' : 'ON'} | CHAOS: {Math.round(chaos * 100)}%
      </div>
      <button onClick={onToggle} style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 24px', cursor: 'pointer', background: gravityOff ? 'linear-gradient(135deg, #ff4081, #ff6e40)' : 'linear-gradient(135deg, #00e5ff, #7c4dff)', border: 'none', color: '#0a0a0f', fontWeight: 700, borderRadius: 4, boxShadow: gravityOff ? '0 0 30px rgba(255,64,129,0.4), 0 0 60px rgba(255,64,129,0.15)' : '0 0 30px rgba(0,229,255,0.3)', transition: 'all 0.4s', display: 'flex', alignItems: 'center', gap: 8, animation: gravityOff ? 'pulse 1s ease infinite' : 'none' }}>
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
        {project.hasDemo && (
          <div style={{ padding:'0 40px', marginBottom:32 }}>
            <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, marginBottom:12, display:'flex', alignItems:'center', gap:8 }}><Zap size={16} style={{ color:project.color }}/> Live Demo — SOC Dashboard</h3>
            <SOCDashboardDemo />
          </div>
        )}
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
      const y = window.scrollY; setScrollY(y);
      setNavHidden(y > lastScroll.current && y > 100);
      lastScroll.current = y;
      if (gravityOff) { const maxScroll = document.body.scrollHeight - window.innerHeight; const progress = Math.min(y / (maxScroll * 0.5), 1); setChaos(progress); } else { setChaos(0); }
      const secs = ['home','about','experience','projects','skills','certifications','contact'];
      for (const s of [...secs].reverse()) { const el = document.getElementById(s); if (el && el.getBoundingClientRect().top < 300) { setActiveSection(s); break; } }
    };
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, [gravityOff]);

  useEffect(() => {
    const h = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);

  const handleGravityToggle = () => { if (gravityOff) { setGravityOff(false); setChaos(0); } else { setGravityOff(true); } };

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

      {dark && <BackgroundCanvas chaos={chaos} />}
      <FloatingDebris scrollY={scrollY} chaos={chaos} />

      <div style={{
        position: 'fixed', left: mousePos.x - (gravityOff ? 200 : 150), top: mousePos.y - (gravityOff ? 200 : 150),
        width: gravityOff ? 400 : 300, height: gravityOff ? 400 : 300, borderRadius: '50%',
        background: gravityOff ? `radial-gradient(circle, ${accent}15, ${accent2}08, transparent 70%)` : `radial-gradient(circle, ${accent}08, transparent 70%)`,
        border: gravityOff ? `1px solid ${accent}15` : 'none', pointerEvents: 'none', zIndex: 3,
        transition: 'width 0.5s, height 0.5s, left 0.1s ease, top 0.1s ease',
      }} />

      {chaos > 0.3 && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 4, pointerEvents: 'none', background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,229,255,0.02) 2px, rgba(0,229,255,0.02) 4px)', opacity: chaos * 0.5 }}>
          <div style={{ position: 'absolute', left: 0, right: 0, height: '30%', background: 'linear-gradient(to bottom, rgba(0,229,255,0.04), transparent)', animation: 'scanline 3s linear infinite' }} />
        </div>
      )}

      {/* NAV */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        padding:'16px 48px', display:'flex', justifyContent:'space-between', alignItems:'center',
        background: dark ? 'rgba(10,10,15,0.7)' : 'rgba(245,245,248,0.8)',
        backdropFilter:'blur(20px)', borderBottom:`1px solid ${border}`,
        transition:'transform 0.4s ease', transform: navHidden ? 'translateY(-100%)' : 'translateY(0)',
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
              <ExplodingText text="Omkar" chaos={chaos} style={{}} /><br />
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
            <AvatarCanvas chaos={chaos} activeSection={activeSection} />
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
                {[{n:'6.67',l:'CGPA / 7.0'},{n:'5+',l:'Major Projects'},{n:'95%',l:'Detection Accuracy'},{n:'60%',l:'Efficiency Gains'}].map((s,i)=>(
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
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:p.color, letterSpacing:'0.2em', marginBottom:12 }}>// {p.idx} — {p.cat.toUpperCase()}{p.hasDemo && <span style={{ marginLeft:8, fontSize:9, background:`${p.color}20`, border:`1px solid ${p.color}40`, padding:'2px 6px', borderRadius:3 }}>LIVE DEMO</span>}</div>
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
