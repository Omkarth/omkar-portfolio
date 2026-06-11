import { useState, useEffect, useRef, useCallback, useMemo, Suspense, lazy } from "react";
import { Canvas, useFrame, useThree, createPortal as createPortal3D } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { Link } from "react-router-dom";
import { X, ExternalLink, Github, Mail, Linkedin, Phone, ChevronDown, ArrowRight, Moon, Sun, Filter, Code2, Cpu, Database, Globe, Shield, Terminal, Award, GraduationCap, Briefcase, Calendar, Zap, Menu } from "lucide-react";

const SkillRadar = lazy(() => import("./SkillRadar"));

// ===== R3F AVATAR (Ready Player Me model + animation library, hosted in /public) =====
const SECTION_ROT = { home:0, about:0.4, experience:0.25, projects:-0.4, skills:-0.25, certifications:-0.15, contact:0 };
const AVATAR_URL = "/avatar.glb";
const ANIM_URL = "/animations.glb";

const SECTION_IDLE = { home:"idle", about:"idle2", experience:"idle", projects:"idle3", skills:"idle2", certifications:"idle3", contact:"idle" };
const SECTION_LINES = {
  home: "hi, I'm Omkar 👋",
  about: "security × systems × AI",
  experience: "TA @ University of Adelaide",
  projects: "ask me about CyberLLM",
  skills: "full-stack & then some",
  certifications: "certified & curious",
  contact: "let's build something",
};
const CLICK_REACTIONS = ["cheer", "bow", "think"];

// Cross-component avatar hooks: any part of the page can ask the avatar to
// gesture or speak without prop-drilling through the layout tree.
const avatarReact = (name) => window.dispatchEvent(new CustomEvent("avatar-react", { detail: name }));
const avatarSay = (line) => window.dispatchEvent(new CustomEvent("avatar-say", { detail: line }));

const TOUR_STEPS = [
  { id: "home", line: "hi, I'm Omkar 👋 — let me show you around", anim: "wave" },
  { id: "about", line: "Master's student at Adelaide — I like breaking systems, then building better ones", anim: "talk1" },
  { id: "experience", line: "Teaching Assistant, intern, builder — here's where I've worked", anim: "talk2" },
  { id: "projects", line: "my favourite: CyberLLM — a 350M-param security LLM trained from scratch", anim: "cheer" },
  { id: "skills", line: "the toolbox — from React to PyTorch, with a security mindset", anim: "talk1" },
  { id: "certifications", line: "the receipts 📜 — Google Cloud, security, and more", anim: "talk2" },
  { id: "contact", line: "that's me! say hi — let's build something together", anim: "bow" },
];

const QA = [
  [/cyber\s*llm|llm|model|ai\b/i, "CyberLLM is my 350M-param security LLM — custom tokenizer, 5B-token pretraining, SFT. It's in Projects, with a live SOC demo!"],
  [/project/i, "head to Projects — CyberLLM, an encrypted chat protocol, IoT logistics, and more."],
  [/skill|stack|tech/i, "Python, PyTorch, React, Node, AWS — plus a healthy security mindset."],
  [/experience|work|job|intern/i, "currently a Teaching Assistant at the University of Adelaide; before that, IoT and data science internships."],
  [/contact|email|hire|reach|touch/i, "scroll to Contact, or use the Get in Touch button — Omkar replies fast 😉"],
  [/study|degree|university|education|adelaide/i, "Master's in Computer Science at the University of Adelaide."],
  [/who|name|you\b/i, "I'm Omkar Thombre's avatar — the slightly more pixelated version of him."],
  [/security|cyber|hack/i, "security is the thing — secure protocols, SOC tooling, and an LLM trained on CVEs."],
  [/dance|party/i, "try clicking me ten times. just saying. 🕺"],
];
const answerFor = (q) => {
  for (const [re, a] of QA) if (re.test(q)) return a;
  return "good question! ask me about projects, skills, experience, or how to reach Omkar.";
};

// Loads the shared animation clips and binds them to the avatar's skeleton.
// Separate component so the avatar renders before the (larger) clip file arrives.
function AnimDriver({ scene, api }) {
  const { animations } = useGLTF(ANIM_URL);
  const { actions, mixer } = useAnimations(animations, scene);
  useEffect(() => {
    const a = api.current;
    a.actions = actions; a.mixer = mixer; a.ready = true;
    const onFinished = () => a.onFinished?.();
    mixer.addEventListener("finished", onFinished);
    a.onReady?.();
    return () => { mixer.removeEventListener("finished", onFinished); a.ready = false; a.current = null; };
  }, [actions, mixer, api]);
  return null;
}

// Spectacles built from primitives, rendered inside the Head bone so they
// follow head tracking exactly. Sizes are in head-bone local space (metres).
function Glasses() {
  const frame = { color: "#15151a", metalness: 0.45, roughness: 0.35 };
  return (
    <group position={[0, 0.075, 0.05]}>
      <mesh position={[-0.0315, 0, 0.072]}>
        <torusGeometry args={[0.0245, 0.0028, 10, 28]} /><meshStandardMaterial {...frame} />
      </mesh>
      <mesh position={[0.0315, 0, 0.072]}>
        <torusGeometry args={[0.0245, 0.0028, 10, 28]} /><meshStandardMaterial {...frame} />
      </mesh>
      <mesh position={[-0.0315, 0, 0.071]}>
        <circleGeometry args={[0.0225, 24]} /><meshStandardMaterial color="#aaccee" transparent opacity={0.12} roughness={0.05} />
      </mesh>
      <mesh position={[0.0315, 0, 0.071]}>
        <circleGeometry args={[0.0225, 24]} /><meshStandardMaterial color="#aaccee" transparent opacity={0.12} roughness={0.05} />
      </mesh>
      <mesh position={[0, 0.006, 0.072]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.0024, 0.0024, 0.018, 8]} /><meshStandardMaterial {...frame} />
      </mesh>
      <mesh position={[-0.0585, 0.006, 0.022]} rotation={[Math.PI / 2, 0, 0.06]}>
        <cylinderGeometry args={[0.0022, 0.0022, 0.1, 8]} /><meshStandardMaterial {...frame} />
      </mesh>
      <mesh position={[0.0585, 0.006, 0.022]} rotation={[Math.PI / 2, 0, -0.06]}>
        <cylinderGeometry args={[0.0022, 0.0022, 0.1, 8]} /><meshStandardMaterial {...frame} />
      </mesh>
    </group>
  );
}

function AvatarModel({ chaos, activeSection, mouseRef, dragRef, onSleepChange, onEgg, talking, controlRef }) {
  const groupRef = useRef();
  const baseRot = useRef(null);
  const blink = useRef({ next: 2.5, meshes: [] });
  const anim = useRef({ actions: null, mixer: null, ready: false, current: null, busy: false });
  const sectionRef = useRef(activeSection);
  const chaosSmooth = useRef(0);
  const eggUntil = useRef(0);
  const clicks = useRef(0);
  const drowsy = useRef(0);
  const smooth = useRef({ hx: 0, hy: 0 });
  const sleeping = useRef(false);
  const introDone = useRef(false);
  const night = useMemo(() => { const h = new Date().getHours(); return h >= 23 || h < 6; }, []);
  const { scene } = useGLTF(AVATAR_URL);

  const bones = useMemo(() => ({
    head: scene.getObjectByName("Head"),
    neck: scene.getObjectByName("Neck"),
    eyeL: scene.getObjectByName("LeftEye"),
    eyeR: scene.getObjectByName("RightEye"),
    armL: scene.getObjectByName("LeftArm"),
    armR: scene.getObjectByName("RightArm"),
    foreL: scene.getObjectByName("LeftForeArm"),
    foreR: scene.getObjectByName("RightForeArm"),
    spine: scene.getObjectByName("Spine2"),
  }), [scene]);

  const playLoop = useCallback((name, fade = 0.5) => {
    const a = anim.current;
    if (!a.ready) return;
    const next = a.actions[name];
    if (!next || a.current === next) return;
    next.reset().setLoop(THREE.LoopRepeat, Infinity);
    next.fadeIn(fade).play();
    if (a.current) a.current.fadeOut(fade);
    a.current = next;
  }, []);

  const playOnce = useCallback((name, fade = 0.35) => {
    const a = anim.current;
    if (!a.ready || !a.actions[name]) return;
    const next = a.actions[name];
    a.busy = true;
    next.reset().setLoop(THREE.LoopOnce, 1);
    next.clampWhenFinished = true;
    next.fadeIn(fade).play();
    if (a.current && a.current !== next) a.current.fadeOut(fade);
    a.current = next;
  }, []);

  const baseline = useCallback(() => (
    eggUntil.current ? "dance" : SECTION_IDLE[sectionRef.current] || "idle"
  ), []);

  // Wire animation-driver callbacks (refs, so re-assigning every render is fine)
  anim.current.onFinished = () => { anim.current.busy = false; anim.current.current = null; playLoop(baseline()); };
  anim.current.onReady = () => {
    if (!introDone.current) { introDone.current = true; playOnce("wave"); }
    else playLoop(baseline());
  };

  // Section changes: wave at contact, otherwise swap idle variation
  useEffect(() => {
    const prev = sectionRef.current;
    sectionRef.current = activeSection;
    const a = anim.current;
    if (!a.ready || eggUntil.current) return;
    if (activeSection === "contact" && prev !== "contact") playOnce("wave");
    else if (!a.busy) playLoop(baseline());
  }, [activeSection, playLoop, playOnce, baseline]);

  // Talking gesture while the speech bubble is typing
  const talkAlt = useRef(false);
  useEffect(() => {
    const a = anim.current;
    if (!a.ready || a.busy || eggUntil.current) return;
    if (talking) { talkAlt.current = !talkAlt.current; playLoop(talkAlt.current ? "talk1" : "talk2", 0.35); }
    else playLoop(baseline());
  }, [talking, playLoop, baseline]);

  // Page-wide reaction hook (hover highlights, theme toggle, …)
  const reactCooldown = useRef(0);
  useEffect(() => {
    const onReact = (e) => {
      const a = anim.current;
      const now = performance.now();
      if (!a.ready || a.busy || eggUntil.current || now < reactCooldown.current) return;
      reactCooldown.current = now + 6000;
      playOnce(e.detail, 0.3);
    };
    window.addEventListener("avatar-react", onReact);
    return () => window.removeEventListener("avatar-react", onReact);
  }, [playOnce]);

  // Imperative handle for the guided tour
  useEffect(() => {
    if (controlRef) controlRef.current = { playOnce, playLoop };
  }, [controlRef, playOnce, playLoop]);

  useEffect(() => {
    const blinkMeshes = [];
    scene.traverse((o) => {
      if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; }
      if (o.morphTargetDictionary && o.morphTargetDictionary.eyeBlinkLeft !== undefined) blinkMeshes.push(o);
    });
    blink.current.meshes = blinkMeshes;
    const { head, neck, eyeL, eyeR } = bones;
    baseRot.current = {
      hx: head?.rotation.x ?? 0, hy: head?.rotation.y ?? 0,
      nx: neck?.rotation.x ?? 0, ny: neck?.rotation.y ?? 0,
      lx: eyeL?.rotation.x ?? 0, ly: eyeL?.rotation.y ?? 0,
      rx: eyeR?.rotation.x ?? 0, ry: eyeR?.rotation.y ?? 0,
    };
  }, [scene, bones]);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (e.delta > 6) return; // it was a drag, not a click
    const a = anim.current;
    if (!a.ready) return;
    clicks.current++;
    if (clicks.current === 10) {
      eggUntil.current = performance.now() + 8000;
      a.busy = false;
      playLoop("dance", 0.3);
      onEgg?.();
      return;
    }
    if (a.busy || eggUntil.current) return;
    playOnce(CLICK_REACTIONS[clicks.current % CLICK_REACTIONS.length]);
  }, [playLoop, playOnce, onEgg]);

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const ptr = mouseRef.current;
    const drag = dragRef.current;
    const a = anim.current;

    // Easter-egg dance timeout
    if (eggUntil.current && performance.now() > eggUntil.current) {
      eggUntil.current = 0;
      playLoop(baseline());
    }



    // Floating + section turn + cursor + drag spin
    g.position.y = Math.sin(t * 0.8) * 0.08;
    if (!drag.active) drag.offset *= 0.94;
    const targetRotY = (SECTION_ROT[sectionRef.current] || 0) + ptr.x * 0.25 + drag.offset;
    g.rotation.y += (targetRotY - g.rotation.y) * (drag.active ? 0.3 : 0.06);

    // Sleepy state: doze off after 30s without mouse movement (droopier at night)
    const idleMs = Date.now() - ptr.t;
    const isSleeping = idleMs > 30000;
    if (isSleeping !== sleeping.current) { sleeping.current = isSleeping; onSleepChange?.(isSleeping); }
    drowsy.current += ((isSleeping ? 0.7 : night ? 0.25 : 0) - drowsy.current) * 0.03;

    // Head, neck & eyes follow the cursor. The mixer rewrites these bones every
    // frame, so keep our own smoothed offsets and set rotations absolutely —
    // cursor tracking takes priority over the clip's head motion.
    const base = baseRot.current;
    if (base) {
      const { head, neck, eyeL, eyeR } = bones;
      const droop = drowsy.current * 0.25;
      const s = smooth.current;
      s.hx += (-ptr.y * 0.35 + droop - s.hx) * 0.1;
      s.hy += (ptr.x * 0.45 - s.hy) * 0.1;
      if (head) {
        head.rotation.x = base.hx + s.hx;
        head.rotation.y = base.hy + s.hy;
      }
      if (neck) {
        neck.rotation.x = base.nx + s.hx * 0.35;
        neck.rotation.y = base.ny + s.hy * 0.4;
      }
      const ex = Math.max(-0.25, Math.min(0.25, -ptr.y * 0.18));
      const ey = Math.max(-0.3, Math.min(0.3, ptr.x * 0.28));
      if (eyeL) { eyeL.rotation.x = base.lx + ex; eyeL.rotation.y = base.ly + ey; }
      if (eyeR) { eyeR.rotation.x = base.rx + ex; eyeR.rotation.y = base.ry + ey; }
    }

    // Blink (procedural) + drowsy eyelids
    const b = blink.current;
    const dtb = t - b.next;
    let lid = 0;
    if (dtb > 0.24) b.next = t + 2 + Math.random() * 3;
    else if (dtb > 0) lid = dtb < 0.12 ? dtb / 0.12 : 1 - (dtb - 0.12) / 0.12;
    lid = Math.max(lid, drowsy.current);
    for (const m of b.meshes) {
      m.morphTargetInfluences[m.morphTargetDictionary.eyeBlinkLeft] = lid;
      m.morphTargetInfluences[m.morphTargetDictionary.eyeBlinkRight] = lid;
    }

    // Zero-g ragdoll: arms drift and flail during the gravity anomaly.
    // Offsets add on top of the mixer's pose each frame, so they fade to
    // nothing and leave the idle animation untouched when calm.
    const cf = chaosSmooth.current += (Math.min(chaos, 1) - chaosSmooth.current) * 0.04;
    if (cf > 0.01) {
      const { armL, armR, foreL, foreR, spine } = bones;
      if (armL) {
        armL.rotation.z += (1.3 + Math.cos(t * 1.3) * 0.55) * cf;
        armL.rotation.x += Math.sin(t * 1.7) * 0.35 * cf;
      }
      if (armR) {
        armR.rotation.z += -(1.3 + Math.cos(t * 1.6 + 1) * 0.55) * cf;
        armR.rotation.x += Math.sin(t * 2.1 + 2) * 0.35 * cf;
      }
      if (foreL) foreL.rotation.x += Math.sin(t * 2.3 + 1) * 0.3 * cf;
      if (foreR) foreR.rotation.x += Math.sin(t * 2.7 + 3) * 0.3 * cf;
      if (spine) spine.rotation.z += Math.sin(t * 1.1) * 0.1 * cf;
    }

    // Glitch shake during anomaly
    if (chaos > 0.02) {
      g.position.x = (Math.random() - 0.5) * chaos * 0.22;
      g.position.z = (Math.random() - 0.5) * chaos * 0.12;
      g.rotation.z = (Math.random() - 0.5) * chaos * 0.1;
    } else {
      g.position.x *= 0.85; g.position.z *= 0.85; g.rotation.z *= 0.85;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} position={[0, -5.5, 0]} scale={3.6} onClick={handleClick} />
      {bones.head && createPortal3D(<Glasses />, bones.head)}
      <Suspense fallback={null}>
        <AnimDriver scene={scene} api={anim} />
      </Suspense>
    </group>
  );
}
useGLTF.preload(AVATAR_URL);
useGLTF.preload(ANIM_URL);

function Orbits({ chaos }) {
  const ring1 = useRef(); const ring2 = useRef();
  const dot1 = useRef(); const dot2 = useRef(); const dot3 = useRef();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const speed = 1 + chaos * 6;
    if (ring1.current) ring1.current.rotation.z = t * 0.4 * speed;
    if (ring2.current) ring2.current.rotation.z = -t * 0.3 * speed;
    if (dot1.current) dot1.current.position.set(Math.cos(t * 1.2) * 2.0, Math.sin(t * 1.2) * 0.8, Math.sin(t * 1.2) * 2.0);
    if (dot2.current) dot2.current.position.set(Math.cos(t * 0.9 + 2) * 2.3, Math.sin(t * 0.9 + 2) * 1.0, Math.sin(t * 0.9 + 2) * 2.3);
    if (dot3.current) dot3.current.position.set(Math.cos(t * 1.5 + 4) * 1.8, Math.sin(t * 1.5 + 4) * 1.2, Math.sin(t * 1.5 + 4) * 1.8);
  });
  return (
    <>
      <mesh ref={ring1} rotation={[Math.PI * 0.4, 0.3, 0]}>
        <torusGeometry args={[2.0, 0.008, 8, 64]} /><meshBasicMaterial color="#00e5ff" transparent opacity={0.2} />
      </mesh>
      <mesh ref={ring2} rotation={[Math.PI * 0.55, 0, 0.5]}>
        <torusGeometry args={[2.3, 0.006, 8, 64]} /><meshBasicMaterial color="#7c4dff" transparent opacity={0.15} />
      </mesh>
      <mesh ref={dot1}><sphereGeometry args={[0.04, 8, 6]} /><meshBasicMaterial color="#00e5ff" /></mesh>
      <mesh ref={dot2}><sphereGeometry args={[0.04, 8, 6]} /><meshBasicMaterial color="#7c4dff" /></mesh>
      <mesh ref={dot3}><sphereGeometry args={[0.04, 8, 6]} /><meshBasicMaterial color="#ff4081" /></mesh>
    </>
  );
}

function AvatarLoader() {
  const ref = useRef();
  useFrame((state) => { if (ref.current) ref.current.rotation.z = -state.clock.elapsedTime * 2; });
  return (
    <mesh ref={ref}>
      <torusGeometry args={[0.5, 0.02, 8, 48, Math.PI * 1.5]} />
      <meshBasicMaterial color="#00e5ff" transparent opacity={0.6} />
    </mesh>
  );
}

function TypeLine({ text, onDone }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const iv = setInterval(() => setN((v) => {
      if (v >= text.length) { clearInterval(iv); return v; }
      return v + 1;
    }), 26);
    return () => clearInterval(iv);
  }, [text]);
  useEffect(() => { if (n >= text.length) onDone?.(); }, [n, text, onDone]);
  return <span>{"// "}{text.slice(0, n)}<span style={{ opacity: 0.6 }}>▌</span></span>;
}

function AvatarCanvas({ chaos, activeSection }) {
  const slotRef = useRef();
  const wrapRef = useRef();
  const mouseRef = useRef({ x: 0, y: 0, t: Date.now() });
  const dragRef = useRef({ active: false, offset: 0, lastX: 0 });
  const control = useRef({});
  const [mini, setMini] = useState(false);
  const [grabbing, setGrabbing] = useState(false);
  const [bubbleOverride, setBubbleOverride] = useState(null);
  const [typing, setTyping] = useState(false);
  const [tourIdx, setTourIdx] = useState(null);
  const [askMode, setAskMode] = useState(false);
  const [askText, setAskText] = useState("");
  const [voiceOn, setVoiceOn] = useState(() => { try { return localStorage.getItem("ot-voice") === "on"; } catch { return false; } });
  const miniRef = useRef(false);
  const morphUntil = useRef(0);
  const sayTimer = useRef(null);
  const tourRef = useRef(null);
  const stepDeadline = useRef(Infinity);
  const animAt = useRef(null);
  const glideTo = useRef(null);

  const touring = tourIdx !== null;
  const bubbleText = bubbleOverride ?? SECTION_LINES[activeSection] ?? SECTION_LINES.home;
  useEffect(() => { setTyping(true); }, [bubbleText]);
  const onTypeDone = useCallback(() => setTyping(false), []);

  // Global cursor tracking (so he watches the mouse anywhere on the page)
  useEffect(() => {
    const onMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseRef.current.t = Date.now();
    };
    const onDrag = (e) => {
      const d = dragRef.current;
      if (!d.active) return;
      d.offset += (e.clientX - d.lastX) * 0.012;
      d.lastX = e.clientX;
    };
    const onUp = () => { dragRef.current.active = false; setGrabbing(false); };
    const onSay = (e) => {
      setBubbleOverride(e.detail);
      clearTimeout(sayTimer.current);
      sayTimer.current = setTimeout(() => setBubbleOverride((cur) => (cur === e.detail ? null : cur)), 6000);
    };
    const cancelGlide = () => { glideTo.current = null; };
    window.addEventListener("wheel", cancelGlide, { passive: true });
    window.addEventListener("touchmove", cancelGlide, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointermove", onDrag, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("avatar-say", onSay);
    return () => {
      window.removeEventListener("wheel", cancelGlide);
      window.removeEventListener("touchmove", cancelGlide);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointermove", onDrag);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("avatar-say", onSay);
    };
  }, []);

  // Companion mode: the canvas lives in a fixed portal that either tracks the
  // hero slot or flies to the bottom-left corner once you scroll past the hero.
  useEffect(() => {
    let raf;
    const tick = () => {
      const el = wrapRef.current, slot = slotRef.current;
      if (el && slot) {
        const shouldMini = window.scrollY > window.innerHeight * 0.85;
        if (shouldMini !== miniRef.current) {
          miniRef.current = shouldMini;
          setMini(shouldMini);
          el.style.transition = "left .5s cubic-bezier(.5,0,.2,1), top .5s cubic-bezier(.5,0,.2,1), width .5s cubic-bezier(.5,0,.2,1), height .5s cubic-bezier(.5,0,.2,1)";
          morphUntil.current = performance.now() + 550;
        } else if (performance.now() > morphUntil.current && el.style.transition !== "none") {
          el.style.transition = "none";
        }
        if (glideTo.current !== null) {
          const cur = window.scrollY;
          const d = glideTo.current - cur;
          if (Math.abs(d) > 2) window.scrollTo(0, cur + d * 0.06);
          else glideTo.current = null;
        }
        if (tourRef.current !== null) {
          mouseRef.current.t = Date.now(); // keep him awake while narrating
          const now = performance.now();
          if (animAt.current !== null && now > animAt.current) {
            animAt.current = null;
            control.current.playOnce?.(TOUR_STEPS[tourRef.current]?.anim);
          }
          if (now > stepDeadline.current) {
            stepDeadline.current = Infinity;
            setTourIdx((i) => (i === null ? null : i + 1));
          }
        }
        if (performance.now() > morphUntil.current || miniRef.current) {
          if (miniRef.current) {
            el.style.left = "18px";
            el.style.top = (window.innerHeight - 196) + "px";
            el.style.width = "150px"; el.style.height = "178px";
          } else {
            const r = slot.getBoundingClientRect();
            el.style.left = r.left + "px"; el.style.top = r.top + "px";
            el.style.width = r.width + "px"; el.style.height = r.height + "px";
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Guided tour: each step scrolls to its section and narrates; the rAF tick
  // above advances steps via deadlines (long setTimeouts can be throttled).
  useEffect(() => {
    tourRef.current = tourIdx;
    if (tourIdx === null) { stepDeadline.current = Infinity; animAt.current = null; return; }
    if (tourIdx >= TOUR_STEPS.length) {
      setTourIdx(null);
      setBubbleOverride(null);
      glideTo.current = 0;
      return;
    }
    const step = TOUR_STEPS[tourIdx];
    const el = document.getElementById(step.id);
    if (el) glideTo.current = el.getBoundingClientRect().top + window.scrollY;
    setBubbleOverride(step.line);
    animAt.current = performance.now() + 700;
    stepDeadline.current = performance.now() + 2800 + step.line.length * 60;
  }, [tourIdx]);

  const startTour = () => {
    if (touring) {
      setTourIdx(null); setBubbleOverride(null);
      try { window.speechSynthesis?.cancel(); } catch {}
      return;
    }
    setAskMode(false);
    try { if (localStorage.getItem("ot-voice") !== "off") setVoiceOn(true); } catch {}
    setTourIdx(0);
  };

  const toggleVoice = () => {
    setVoiceOn((v) => {
      const next = !v;
      try { localStorage.setItem("ot-voice", next ? "on" : "off"); } catch {}
      if (!next) { try { window.speechSynthesis?.cancel(); } catch {} }
      return next;
    });
  };

  // Voice: read the bubble aloud (browser speech synthesis, no network)
  useEffect(() => {
    if (!voiceOn || !bubbleText || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(bubbleText.replace(/[^\p{L}\p{N}\p{P}\s']/gu, " "));
      u.rate = 1.04;
      window.speechSynthesis.speak(u);
    } catch {}
  }, [bubbleText, voiceOn]);

  const submitAsk = () => {
    const q = askText.trim();
    setAskMode(false); setAskText("");
    if (!q) return;
    avatarSay(answerFor(q));
  };

  const onEgg = useCallback(() => {
    setBubbleOverride("dance mode unlocked 🕺");
    setTimeout(() => setBubbleOverride(null), 8000);
  }, []);
  const onSleepChange = useCallback((s) => {
    if (miniRef.current && s) return;
    setBubbleOverride((cur) => (s ? "zzz… move the mouse to wake me" : (cur?.startsWith("zzz") ? null : cur)));
  }, []);

  const mono = "'Space Mono', monospace";
  const btnStyle = { fontFamily: mono, fontSize: 9, letterSpacing: "0.15em", color: "#00e5ff", background: "rgba(10,14,28,0.75)", border: "1px solid rgba(0,229,255,0.25)", borderRadius: 4, padding: "5px 9px", cursor: "pointer", backdropFilter: "blur(10px)" };

  return (
    <div ref={slotRef} className="avatar-slot" style={{ position: "relative", width: 400, height: 450, flexShrink: 0 }}>
      {createPortal(
        <div
          ref={wrapRef}
          onPointerDown={(e) => { dragRef.current.active = true; dragRef.current.lastX = e.clientX; setGrabbing(true); }}
          style={{ position: "fixed", left: 0, top: 0, width: 400, height: 450, zIndex: 50, cursor: grabbing ? "grabbing" : "grab", touchAction: "pan-y" }}
        >
          <div style={{ position: "absolute", inset: 0, borderRadius: mini ? 14 : 0, overflow: "hidden", border: mini ? "1px solid rgba(0,229,255,0.25)" : "1px solid transparent", background: mini ? "rgba(10,14,28,0.55)" : "transparent", backdropFilter: mini ? "blur(10px)" : "none" }}>
            <Canvas camera={{ position: [0, -0.2, 7.0], fov: 34 }} dpr={[1, 2]} gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }} style={{ width: "100%", height: "100%" }}>
              <ambientLight intensity={0.6} />
              <hemisphereLight skyColor="#fff8ee" groundColor="#2a1206" intensity={0.5} />
              <directionalLight position={[-2.5, 4, 5]} intensity={1.7} />
              <directionalLight position={[3, 0.5, 4]} intensity={0.6} color="#ffddb0" />
              <directionalLight position={[0, 2, -4]} intensity={0.9} color="#7c4dff" />
              <Suspense fallback={<AvatarLoader />}>
                <AvatarModel chaos={chaos} activeSection={activeSection} mouseRef={mouseRef} dragRef={dragRef} onSleepChange={onSleepChange} onEgg={onEgg} talking={typing && !askMode} controlRef={control} />
              </Suspense>
              <Orbits chaos={chaos} />
            </Canvas>
          </div>

          {/* Speech bubble — clickable to ask a question; floats above the widget in mini mode */}
          {(!mini || touring) && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => { if (!touring && !askMode) setAskMode(true); }}
              style={{ position: "absolute", ...(mini ? { bottom: "100%", left: 0, marginBottom: 40, width: 230 } : { top: 14, left: 14, maxWidth: 240 }), fontFamily: mono, fontSize: 10, lineHeight: 1.6, color: "#00e5ff", background: "rgba(10,14,28,0.8)", border: "1px solid rgba(0,229,255,0.25)", borderRadius: "8px 8px 8px 0", padding: "6px 10px", backdropFilter: "blur(10px)", cursor: touring ? "default" : "pointer" }}
            >
              {askMode ? (
                <input
                  autoFocus
                  value={askText}
                  onChange={(e) => setAskText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submitAsk(); if (e.key === "Escape") { setAskMode(false); setAskText(""); } }}
                  onBlur={() => { setAskMode(false); setAskText(""); }}
                  placeholder="ask me anything…"
                  style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#00e5ff", fontFamily: mono, fontSize: 10 }}
                />
              ) : (
                <>
                  <TypeLine key={bubbleText} text={bubbleText} onDone={onTypeDone} />
                  {!touring && !bubbleOverride && (
                    <div style={{ fontSize: 8, opacity: 0.45, marginTop: 2 }}>click to ask me something</div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tour + voice controls */}
          {(!mini || touring) && (
            <div onPointerDown={(e) => e.stopPropagation()} style={{ position: "absolute", ...(mini ? { bottom: "100%", left: 0, marginBottom: 8 } : { bottom: 14, right: 12 }), display: "flex", gap: 6 }}>
              <button onClick={startTour} style={{ ...btnStyle, color: touring ? "#ff4081" : "#00e5ff", borderColor: touring ? "rgba(255,64,129,0.35)" : "rgba(0,229,255,0.25)" }}>
                {touring ? "■ STOP" : "▶ TOUR"}
              </button>
              {!mini && (
                <button onClick={toggleVoice} title={voiceOn ? "mute voice" : "enable voice"} style={{ ...btnStyle, opacity: voiceOn ? 1 : 0.55 }}>
                  {voiceOn ? "🔊" : "🔇"}
                </button>
              )}
            </div>
          )}

          {!mini && (
            <>
              <div style={{ position: "absolute", top: 12, right: 12, fontFamily: mono, fontSize: 9, color: "#7c4dff", opacity: 0.4, letterSpacing: "0.15em", textAlign: "right", pointerEvents: "none" }}>
                ID:OT-007<br />STATUS:ACTIVE
              </div>
              <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", fontFamily: mono, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#00e5ff", background: "rgba(10,14,28,0.7)", border: "1px solid rgba(0,229,255,0.2)", padding: "4px 12px", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", gap: 6, pointerEvents: "none", whiteSpace: "nowrap" }}>
                <span style={{ width: 5, height: 5, background: chaos > 0.1 ? "#ff4081" : bubbleOverride?.startsWith("zzz") ? "#eab308" : "#0f6", borderRadius: "50%", boxShadow: `0 0 6px ${chaos > 0.1 ? "#ff4081" : bubbleOverride?.startsWith("zzz") ? "#eab308" : "#0f6"}` }} />
                {chaos > 0.1 ? "GRAVITY ANOMALY" : bubbleOverride?.startsWith("zzz") ? "STANDBY MODE" : touring ? "TOUR MODE" : "SYSTEMS NOMINAL"}
              </div>
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

// ===== DATA =====
const projects = [
  { id:5, cat:"ai", idx:"01", name:"CyberLLM", short:"Domain-specific 350M param cybersecurity LLM built from scratch", desc:"Built a domain-specific cybersecurity language model from scratch — a 350M parameter LLaMA-3 style decoder-only transformer. Trained a custom SentencePiece tokenizer (32K vocab) on security corpus, then pretrained on 5B tokens from 10+ cybersecurity sources including NVD/CVE, MITRE ATT&CK, NIST SP 800, and OWASP. Fine-tuned with 3,750 cybersecurity instruction pairs via SFT. Runs locally on Apple M4 MPS.", tech:["Python","PyTorch","LLaMA-3","SentencePiece","RunPod A40","Flask"], metric:"350M", metricLabel:"Parameters", features:["Custom 32K tokenizer trained on security corpus","3.4B tokens from 10+ cybersecurity data sources","LLaMA-3 architecture: 24 layers, GQA, SwiGLU, RoPE","Pretraining loss: 9.2 → 3.8 over 5B token budget","SFT on 3,750 cybersecurity instruction pairs","SOC Dashboard with real-time alert analysis"], challenges:"Training a capable LLM with limited compute required careful data curation — 90% security-weighted training data from Primus-FineWeb, Stack Exchange InfoSec, ArXiv cs.CR, and government publications. Solved scaling issues by testing the full pipeline locally on M4 before running 50-hour A40 training on RunPod.", year:"2025-2026", color:"#00ff88", github:"https://github.com/Omkarth/CyberLLM", hasDemo:true },
  { id:1, cat:"security", idx:"02", name:"Secure Open Chat Protocol (SOCP)", short:"WebSocket-based encrypted messaging with RSA-4096 & asyncio", desc:"Designed the core server architecture and implemented WebSocket handling for a secure, asynchronous messaging system. Engineered the message routing mechanism and utilized Python's asyncio library to successfully manage multiple parallel connections. Led the project's intentional backdoor implementation strategy, designing vulnerabilities for peer-review security auditing. Integrated RSA-4096 encryption and canonical JSON serialization to ensure strict signature verification across the network.", tech:["Python","WebSockets","asyncio","RSA-4096","JSON"], metric:"RSA-4096", metricLabel:"Encryption", features:["Asynchronous message routing","RSA-4096 end-to-end encryption","Canonical JSON serialization","Peer-review security auditing","Multi-connection management"], challenges:"Managing concurrent WebSocket connections while maintaining encryption integrity was the core challenge. Solved by implementing an async event loop with dedicated encryption/decryption pipelines per connection.", year:"2025-2026", color:"#00e5ff", github:"https://github.com/Omkarth/socp-chat" },
  { id:2, cat:"iot", idx:"03", name:"IoT Smart Logistics System", short:"Real-time tracking system reducing delivery delays by 40-50%", desc:"Developed an IoT-powered system to streamline logistics and transportation with real-time tracking and resource optimization. Integrated IoT sensors and cloud analytics, reducing delivery delays by 40-50% through automated route planning. Enhanced operational efficiency by 60% with predictive maintenance and data-driven insights.", tech:["IoT","Python","MQTT","AWS","Cloud Computing"], metric:"-50%", metricLabel:"Delivery Delays", features:["Real-time GPS tracking","Automated route optimization","Predictive maintenance alerts","Cloud-based analytics dashboard","MQTT sensor integration"], challenges:"Handling real-time data streams from hundreds of IoT sensors while maintaining low latency. Implemented MQTT message queuing with AWS IoT Core for scalable ingestion.", year:"2024-2025", color:"#7c4dff" },
  { id:3, cat:"ai", idx:"04", name:"Human Action Detection", short:"95% accuracy real-time detection in video via MATLAB & ML", desc:"Built a system for real-time human action and object detection in videos using MATLAB, targeting surveillance applications. Achieved 95% accuracy in detection by leveraging computer vision and machine learning algorithms. Reduced processing time by 80% through optimized feature extraction and model training.", tech:["MATLAB","OpenCV","Neural Networks","Computer Vision","ML"], metric:"95%", metricLabel:"Accuracy", features:["Real-time video processing","Multi-action classification","Object detection overlay","Optimized feature extraction","Surveillance-grade performance"], challenges:"Achieving real-time performance with high accuracy required innovative feature extraction. Implemented a pipeline that reduced processing time by 80% while maintaining 95% detection accuracy.", year:"2023-2024", color:"#ff4081" },
  { id:4, cat:"web", idx:"05", name:"Virtual Queuing System", short:"Ration distribution system boosting efficiency by 50%", desc:"Designed a virtual queuing system to improve ration distribution, minimizing wait times for beneficiaries. Automated scheduling and notifications, increasing distribution efficiency by 50%. Improved accessibility for users through a user-friendly interface and real-time updates.", tech:["Python","JavaScript","MySQL","Web Frameworks","Mobile Dev"], metric:"+50%", metricLabel:"Efficiency", features:["Virtual queue management","Automated SMS notifications","Real-time status updates","Mobile-responsive interface","Admin analytics dashboard"], challenges:"Designing a system accessible to users with varying tech literacy. Built a progressive web app with SMS fallback for notifications and an extremely simplified UI flow.", year:"2022-2023", color:"#ffc107" },
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
function AntiGravEl({ children, index, scrollY, chaos, mousePos, style, className, onClick, onMouseEnter, onMouseLeave }) {
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
    <div ref={elRef} className={className} onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
      style={{ ...style, ...dynStyle, willChange: chaos > 0.05 ? 'transform' : 'auto' }}>
      {children}
    </div>
  );
}

// ===== EXPLODING TEXT =====
function ExplodingText({ text, tag: Tag = 'span', chaos, style, className }) {
  const letters = text.split('');
  const offsets = useRef(letters.map(() => ({
    x: (Math.random() - 0.5) * 800, y: -(Math.random() * 600 + 200), r: (Math.random() - 0.5) * 180, delay: Math.random() * 0.3,
  })));
  const { background, WebkitBackgroundClip, WebkitTextFillColor, ...parentStyle } = style || {};
  const letterGradient = (background && WebkitBackgroundClip) ? { background, WebkitBackgroundClip, WebkitTextFillColor } : {};

  return (
    <Tag className={className} style={{ ...parentStyle, display: 'inline-block', whiteSpace: 'pre-wrap' }}>
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
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: '0.15em', color: gravityOff ? '#ff4081' : '#00e5ff', background: 'rgba(10,14,28,0.8)', border: `1px solid ${gravityOff ? '#ff408140' : '#00e5ff40'}`, padding: '6px 12px', backdropFilter: 'blur(10px)', borderRadius: 4 }}>
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
      <div onClick={e=>e.stopPropagation()} style={{ background:'#101626', border:'1px solid rgba(140,160,255,0.12)', borderRadius:12, maxWidth:800, width:'100%', maxHeight:'90vh', overflow:'auto' }}>
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
          {project.github && <a href={project.github} target="_blank" rel="noreferrer" style={{ padding:'10px 20px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, color:'#e8e8f0', textDecoration:'none', fontSize:12, fontFamily:"'Space Mono',monospace", display:'flex', alignItems:'center', gap:6 }}><Github size={14}/> Code</a>}
        </div>
        <div style={{ padding:'0 40px', marginBottom:32 }}>
          <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, marginBottom:12, display:'flex', alignItems:'center', gap:8 }}><Code2 size={16} style={{ color:project.color }}/> Overview</h3>
          <p style={{ fontSize:14, lineHeight:1.8, color:'#8888a0' }}>{project.desc}</p>
        </div>
        <div style={{ padding:'0 40px', marginBottom:32 }}>
          <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, marginBottom:12, display:'flex', alignItems:'center', gap:8 }}><Terminal size={16} style={{ color:project.color }}/> Key Features</h3>
          <div className="grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
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
            <div style={{ overflowX:'auto' }}><div style={{ minWidth:560 }}><SOCDashboardDemo /></div></div>
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
  const [dark, setDark] = useState(() => { try { return localStorage.getItem("ot-theme") !== "light"; } catch { return true; } });
  const [menuOpen, setMenuOpen] = useState(false);
  const reduceMotion = useMemo(() => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false, []);
  const lastScroll = useRef(0);

  useEffect(() => { try { localStorage.setItem("ot-theme", dark ? "dark" : "light"); } catch {} }, [dark]);

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
  const accent = dark ? '#00e5ff' : '#0091ad';
  const accent2 = dark ? '#7c4dff' : '#6a3de8';
  const bg = dark ? '#090c18' : '#f4f6fb';
  const card = dark ? '#131a2e' : '#ffffff';
  const text = dark ? '#e8e8f0' : '#1a1a2e';
  const textDim = dark ? '#8e96b0' : '#5b5e78';
  const border = dark ? 'rgba(140,160,255,0.10)' : 'rgba(20,30,60,0.10)';
  const cardShadow = dark ? 'none' : '0 2px 14px rgba(25,35,70,0.07)';
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
        /* React drops -webkit-background-clip when the inline background updates (theme toggle) — enforce via CSS */
        .grad-text, .grad-text span { -webkit-background-clip: text !important; background-clip: text !important; }
        @media (max-width: 900px) {
          .main-nav { padding: 12px 20px !important; }
          .nav-sections { display: none !important; }
          .hero { flex-direction: column !important; justify-content: center !important; padding: 110px 6vw 80px !important; }
          .section-pad { padding: 80px 6vw !important; }
          .grid-2 { grid-template-columns: 1fr !important; }
          .grid-3 { grid-template-columns: 1fr 1fr !important; }
          .grid-4 { grid-template-columns: repeat(2,1fr) !important; }
          .skills-layout { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 560px) {
          .grid-3 { grid-template-columns: 1fr !important; }
          .grid-4 { grid-template-columns: 1fr !important; }
          .avatar-slot { width: 280px !important; height: 330px !important; }
        }
        .nav-burger { display: none !important; }
        @media (max-width: 900px) { .nav-burger { display: flex !important; } }
        @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto } }
      `}</style>

      {/* Aurora backdrop: navy depth gradient with soft accent glows */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: dark
          ? `radial-gradient(1100px 700px at 12% 8%, rgba(0,229,255,0.08), transparent 60%),
             radial-gradient(1000px 800px at 88% 35%, rgba(124,77,255,0.10), transparent 60%),
             radial-gradient(900px 700px at 50% 100%, rgba(255,64,129,0.05), transparent 65%),
             linear-gradient(180deg, #0d1226 0%, #090c18 55%, #0a0e1d 100%)`
          : `radial-gradient(1100px 700px at 12% 8%, rgba(0,145,173,0.06), transparent 60%),
             radial-gradient(1000px 800px at 88% 35%, rgba(106,61,232,0.05), transparent 60%),
             linear-gradient(180deg, #f7f8fc, #eef1f8)`,
      }} />

      {dark && !reduceMotion && <BackgroundCanvas chaos={chaos} />}
      {!reduceMotion && <FloatingDebris scrollY={scrollY} chaos={chaos} />}

      {dark && (
        <>
          {/* Film grain + vignette for depth (sit below content, above the backdrop) */}
          <div style={{ position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none', opacity: 0.05, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
          <div style={{ position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(3,5,12,0.45) 100%)' }} />
        </>
      )}

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
      <nav className="main-nav" style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        padding:'16px 48px', display:'flex', justifyContent:'space-between', alignItems:'center',
        background: dark ? 'rgba(10,14,28,0.7)' : 'rgba(247,248,252,0.85)',
        backdropFilter:'blur(20px)', borderBottom:`1px solid ${border}`,
        transition:'transform 0.4s ease', transform: navHidden ? 'translateY(-100%)' : 'translateY(0)',
        animation: chaos > 0.5 ? 'glitch 0.3s ease infinite' : 'none',
      }}>
        <div className="grad-text" style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:22, background:`linear-gradient(135deg,${accent},${accent2})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>OT.</div>
        <div style={{ display:'flex', gap:28, alignItems:'center' }}>
          <div className="nav-sections" style={{ display:'flex', gap:28, alignItems:'center' }}>
            {['about','experience','projects','skills','certifications','contact'].map(s=>(
              <a key={s} href={`#${s}`} style={{ fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:'0.15em', textTransform:'uppercase', color:activeSection===s?accent:textDim, textDecoration:'none', padding:'4px 0', transition:'color 0.3s', borderBottom:activeSection===s?`1px solid ${accent}`:'1px solid transparent' }}>{s==='certifications'?'Certs':s}</a>
            ))}
          </div>
          <Link to="/blog" style={{ fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:'0.15em', textTransform:'uppercase', color:textDim, textDecoration:'none', padding:'4px 0', transition:'color 0.3s', borderBottom:'1px solid transparent' }}>Blog</Link>
          <button onClick={()=>{ if(dark){ avatarReact('shield'); avatarSay('☀️ ouch — my eyes!'); } setDark(!dark); }} style={{ background:'rgba(255,255,255,0.06)', border:`1px solid ${border}`, borderRadius:'50%', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:text }}>{dark?<Sun size={15}/>:<Moon size={15}/>}</button>
          <button className="nav-burger" onClick={()=>setMenuOpen(!menuOpen)} aria-label="Menu" style={{ background:'rgba(255,255,255,0.06)', border:`1px solid ${border}`, borderRadius:'50%', width:36, height:36, alignItems:'center', justifyContent:'center', cursor:'pointer', color:text }}>{menuOpen?<X size={16}/>:<Menu size={16}/>}</button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div onClick={()=>setMenuOpen(false)} style={{ position:'fixed', inset:0, zIndex:99, background: dark?'rgba(9,12,24,0.96)':'rgba(247,248,252,0.97)', backdropFilter:'blur(16px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:26, animation:'fadeIn 0.25s ease' }}>
          {['about','experience','projects','skills','certifications','contact'].map(s=>(
            <a key={s} href={`#${s}`} onClick={()=>setMenuOpen(false)} style={{ fontFamily:"'Space Mono',monospace", fontSize:15, letterSpacing:'0.25em', textTransform:'uppercase', color:activeSection===s?accent:text, textDecoration:'none' }}>{s}</a>
          ))}
          <Link to="/blog" style={{ fontFamily:"'Space Mono',monospace", fontSize:15, letterSpacing:'0.25em', textTransform:'uppercase', color:text, textDecoration:'none' }}>Blog</Link>
        </div>
      )}

      <div style={{ position:'relative', zIndex:5 }}>

        {/* ===== HERO ===== */}
        <section id="home" className="hero" style={{ minHeight:'100vh', display:'flex', alignItems:'center', padding:'0 8vw', position:'relative', gap:'2vw' }}>
          <AntiGravEl index={0} scrollY={scrollY} chaos={chaos} mousePos={mousePos} style={{ flex:1, animation:'fadeIn 1s ease 0.3s both' }}>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:13, letterSpacing:'0.3em', textTransform:'uppercase', color:accent, marginBottom:20 }}>
              // Computer Science · Adelaide University
            </div>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(2.8rem,5.5vw,5.5rem)', fontWeight:800, lineHeight:0.95, letterSpacing:'-0.04em', marginBottom:20 }}>
              <ExplodingText text="Omkar" chaos={chaos} style={{}} /><br />
              <ExplodingText text="Thombre." chaos={chaos} className="grad-text" style={{ background:`linear-gradient(135deg,${accent},${accent2},#ff4081)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }} />
            </h1>
            <p style={{ fontSize:16, color:textDim, maxWidth:480, lineHeight:1.7, fontWeight:300, marginBottom:32 }}>
              Master's student & Teaching Assistant crafting secure systems, intelligent IoT solutions, and full-stack experiences.
            </p>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <a href="#projects" style={{ fontFamily:"'Space Mono',monospace", fontSize:12, letterSpacing:'0.12em', textTransform:'uppercase', padding:'14px 28px', background:accent, color:dark?'#0a0a0f':'#ffffff', textDecoration:'none', fontWeight:700, display:'flex', alignItems:'center', gap:8 }}>View Projects <ArrowRight size={14}/></a>
              <a href="#contact" style={{ fontFamily:"'Space Mono',monospace", fontSize:12, letterSpacing:'0.12em', textTransform:'uppercase', padding:'14px 28px', border:`1px solid ${border}`, color:text, textDecoration:'none' }}>Get in Touch</a>
            </div>
          </AntiGravEl>
          <AntiGravEl index={100} scrollY={scrollY} chaos={chaos} mousePos={mousePos} style={{ animation:'fadeIn 1.2s ease 0.8s both', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AvatarCanvas chaos={gravityOff ? Math.max(chaos, 0.55) : chaos} activeSection={activeSection} />
          </AntiGravEl>
          <div style={{ position:'absolute', bottom:40, left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:8, animation:'fadeIn 1s ease 1.5s both' }}>
            <span style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:'0.2em', color:textDim, textTransform:'uppercase' }}>Scroll</span>
            <ChevronDown size={16} style={{ color:accent, animation:'float 2s ease infinite' }}/>
          </div>
        </section>

        {/* ===== ABOUT ===== */}
        <section id="about" className="section-pad" style={{ padding:'120px 8vw' }}>
          <AntiGravEl index={1} scrollY={scrollY} chaos={chaos} mousePos={mousePos}>
            <RevealSection>
              <div style={sLabel}><div style={{ width:40, height:1, background:accent }}/>01 — About</div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(2rem,4vw,3.2rem)', fontWeight:700, letterSpacing:'-0.03em', marginBottom:48, lineHeight:1.1 }}>
                <ExplodingText text="Building at the intersection" chaos={chaos} /><br/>
                <ExplodingText text="of security & innovation." chaos={chaos} />
              </h2>
            </RevealSection>
          </AntiGravEl>
          <div className="grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:48 }}>
            <AntiGravEl index={2} scrollY={scrollY} chaos={chaos} mousePos={mousePos}>
              <RevealSection delay={0.15}>
                <p style={{ fontSize:16, lineHeight:1.85, color:textDim, fontWeight:300, marginBottom:16 }}>I'm a Master of Computer Science student at Adelaide University with a strong foundation in software engineering, cybersecurity, and data science. Currently serving as a Teaching Assistant for Security Operations & Incident Response.</p>
                <p style={{ fontSize:16, lineHeight:1.85, color:textDim, fontWeight:300 }}>My work spans from designing cryptographic messaging protocols to building IoT-powered logistics systems. I'm driven by creating software that's both powerful and secure.</p>
              </RevealSection>
            </AntiGravEl>
            <RevealSection delay={0.3}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                {[{n:'6.67',l:'CGPA / 7.0'},{n:'5+',l:'Major Projects'},{n:'95%',l:'Detection Accuracy'},{n:'60%',l:'Efficiency Gains'}].map((s,i)=>(
                  <AntiGravEl key={i} index={3+i} scrollY={scrollY} chaos={chaos} mousePos={mousePos} style={{ background:card, border:`1px solid ${border}`, boxShadow:cardShadow, padding:24, borderRadius:4 }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:32, fontWeight:800, color:accent, lineHeight:1 }}>{s.n}</div>
                    <div style={{ fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:'0.15em', textTransform:'uppercase', color:textDim, marginTop:8 }}>{s.l}</div>
                  </AntiGravEl>
                ))}
              </div>
            </RevealSection>
          </div>
        </section>

        {/* ===== EXPERIENCE ===== */}
        <section id="experience" className="section-pad" style={{ padding:'120px 8vw' }}>
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
        <section id="projects" className="section-pad" style={{ padding:'120px 8vw' }}>
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

          <div className="grid-2" style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:24 }}>
            {filtered.map((p,i)=>(
              <AntiGravEl key={p.id} index={16+i} scrollY={scrollY} chaos={chaos} mousePos={mousePos}
                onClick={()=>setSelectedProject(p)}
                onMouseEnter={(e)=>{ if(p.id===5) avatarReact('cheer'); const el=e.currentTarget; el.style.transition='transform 0.3s, box-shadow 0.3s, border-color 0.3s'; el.style.transform='translateY(-6px)'; el.style.boxShadow=`0 18px 50px ${p.color}26`; el.style.borderColor=`${p.color}55`; }}
                onMouseLeave={(e)=>{ const el=e.currentTarget; el.style.transform=''; el.style.boxShadow=cardShadow; el.style.borderColor=''; }}
                style={{ background:card, border:`1px solid ${border}`, boxShadow:cardShadow, padding:32, borderRadius:8, position:'relative', overflow:'hidden', cursor:'pointer', transition:'transform 0.3s, box-shadow 0.3s', transformStyle:'preserve-3d' }}
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
        <section id="skills" className="section-pad" style={{ padding:'120px 8vw' }}>
          <AntiGravEl index={25} scrollY={scrollY} chaos={chaos} mousePos={mousePos}>
            <RevealSection>
              <div style={sLabel}><div style={{ width:40, height:1, background:accent }}/>04 — Skills</div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(2rem,4vw,3.2rem)', fontWeight:700, marginBottom:48, lineHeight:1.1 }}>
                <ExplodingText text="Technologies & tools." chaos={chaos} />
              </h2>
            </RevealSection>
          </AntiGravEl>
          <div className="skills-layout" style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:48 }}>
            <div className="grid-3" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20 }}>
              {Object.entries(skills).map(([group,items],gi)=>(
                <AntiGravEl key={group} index={26+gi} scrollY={scrollY} chaos={chaos} mousePos={mousePos} style={{ background:card, border:`1px solid ${border}`, boxShadow:cardShadow, padding:28, borderRadius:8, height:'100%' }}>
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
            <AntiGravEl index={30} scrollY={scrollY} chaos={chaos} mousePos={mousePos} onMouseEnter={()=>avatarReact('think')} style={{ background:card, border:`1px solid ${border}`, boxShadow:cardShadow, padding:28, borderRadius:8 }}>
              <RevealSection delay={0.4}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:16 }}>Skill Radar</div>
                <Suspense fallback={<div style={{ height:280 }} />}>
                  <SkillRadar data={radarData} dark={dark} accent={accent} textDim={textDim} />
                </Suspense>
              </RevealSection>
            </AntiGravEl>
          </div>
        </section>

        {/* ===== CERTIFICATIONS ===== */}
        <section id="certifications" className="section-pad" style={{ padding:'120px 8vw' }}>
          <AntiGravEl index={35} scrollY={scrollY} chaos={chaos} mousePos={mousePos}>
            <RevealSection>
              <div style={sLabel}><div style={{ width:40, height:1, background:accent }}/>05 — Certifications</div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(2rem,4vw,3.2rem)', fontWeight:700, marginBottom:48, lineHeight:1.1 }}>
                <ExplodingText text="Credentials & certifications." chaos={chaos} />
              </h2>
            </RevealSection>
          </AntiGravEl>
          <div className="grid-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            {certs.map((c,i)=>(
              <AntiGravEl key={i} index={36+i} scrollY={scrollY} chaos={chaos} mousePos={mousePos}
                onMouseEnter={(e)=>{ const el=e.currentTarget; el.style.transition='transform 0.3s, box-shadow 0.3s, border-color 0.3s'; el.style.transform='translateY(-4px)'; el.style.boxShadow=`0 12px 32px ${accent}14`; el.style.borderColor=`${accent}40`; }}
                onMouseLeave={(e)=>{ const el=e.currentTarget; el.style.transform=''; el.style.boxShadow=cardShadow; el.style.borderColor=''; }}
                style={{ background:card, border:`1px solid ${border}`, boxShadow:cardShadow, padding:20, borderRadius:6, transition:'all 0.4s', cursor:'default', overflow:'hidden' }}>
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
        <section id="contact" className="section-pad" style={{ padding:'120px 8vw', textAlign:'center' }}>
          <AntiGravEl index={55} scrollY={scrollY} chaos={chaos} mousePos={mousePos}>
            <RevealSection>
              <div style={{ ...sLabel, justifyContent:'center' }}>06 — Contact</div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(2.5rem,5vw,4.2rem)', fontWeight:800, letterSpacing:'-0.04em', marginBottom:16, lineHeight:1 }}>
                <ExplodingText text="Let's " chaos={chaos} />
                <ExplodingText text="connect." chaos={chaos} className="grad-text" style={{ background:`linear-gradient(135deg,${accent},${accent2})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }} />
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
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=accent;e.currentTarget.style.color=accent;e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow=`0 8px 30px ${accent}18`;avatarReact('wave');}}
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
