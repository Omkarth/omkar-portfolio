import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, Clock, Tag, ChevronDown, Moon, Sun } from "lucide-react";

// ===== BLOG POST DATA =====
// Add new posts here — newest first
const posts = [
  {
    slug: "building-cyberllm-from-scratch",
    title: "Building CyberLLM: A 350M Parameter Security LLM From Scratch",
    date: "2026-04-15",
    readTime: "8 min",
    tags: ["AI/ML", "Cybersecurity", "LLM"],
    color: "#00ff88",
    excerpt: "How I pretrained a domain-specific LLaMA-3 style transformer on 5B tokens of cybersecurity data — and what I learned about training LLMs on a student budget.",
    content: [
      {
        type: "text",
        body: "When I started this project, I had a simple question: could I build a language model that actually understands cybersecurity? Not a general-purpose model prompted with security context, but one trained from the ground up on security data — CVEs, MITRE ATT&CK techniques, incident reports, and threat intelligence."
      },
      {
        type: "heading",
        body: "The Architecture Decision"
      },
      {
        type: "text",
        body: "I chose LLaMA-3's architecture: a decoder-only transformer with 24 layers, Grouped Query Attention (GQA), SwiGLU activation, and Rotary Position Embeddings (RoPE). At 350M parameters, it's small enough to train on a student budget but large enough to capture meaningful security knowledge. The first attempt at 125M parameters proved too small — the model couldn't retain enough domain knowledge through SFT."
      },
      {
        type: "heading",
        body: "Data Curation Was Everything"
      },
      {
        type: "text",
        body: "The training corpus was 90% security-weighted: NVD/CVE databases, MITRE ATT&CK documentation, NIST SP 800 series, OWASP guidelines, Stack Exchange InfoSec, ArXiv cs.CR papers, and government cybersecurity publications. I built a custom SentencePiece tokenizer with a 32K vocabulary trained specifically on this corpus, which significantly outperformed a general-purpose tokenizer on security terminology."
      },
      {
        type: "heading",
        body: "Training on a Budget"
      },
      {
        type: "text",
        body: "Total compute cost: roughly $40. I tested the full pipeline locally on my MacBook Air M4 before committing to cloud training. The actual pretraining ran on a RunPod A40 GPU for about 50 hours, bringing the loss from 9.2 down to 3.8 over 5B tokens. SFT on 3,750 cybersecurity instruction pairs brought the validation loss to 1.28."
      },
      {
        type: "heading",
        body: "What I'd Do Differently"
      },
      {
        type: "text",
        body: "If I were starting over, I'd invest more time in data quality filtering before pretraining. Some of the government publications had OCR artifacts that introduced noise. I'd also explore a curriculum learning approach — starting with foundational security concepts before moving to advanced threat analysis. The SOC Dashboard I built as a frontend demo showed that even a 350M model can produce useful security triage suggestions when the training data is well-curated."
      },
    ]
  },
  {
    slug: "dark-ship-detection-yolov8-sar",
    title: "Detecting Dark Ships in SAR Imagery with YOLOv8 + SAHI",
    date: "2026-03-20",
    readTime: "6 min",
    tags: ["Computer Vision", "Deep Learning", "Maritime"],
    color: "#7c4dff",
    excerpt: "Using sliced inference on Sentinel-1 satellite imagery to find vessels that disable their AIS transponders — and why the custom P2 model failed spectacularly.",
    content: [
      {
        type: "text",
        body: "Dark ships — vessels that intentionally disable their Automatic Identification System transponders — are a growing concern for maritime security. They're used for illegal fishing, sanctions evasion, and smuggling. Detecting them from space using Synthetic Aperture Radar (SAR) imagery is one of the few reliable methods."
      },
      {
        type: "heading",
        body: "The Pipeline"
      },
      {
        type: "text",
        body: "I built a detection pipeline on Google Colab free tier using YOLOv8s with SAHI (Slicing Aided Hyper Inference) on Sentinel-1 SAR imagery from the SARFish/xView3 dataset. SAR images are massive — a single tile can be 10,000+ pixels. SAHI slices these into overlapping patches, runs detection on each, then merges the results. This is critical because ships appear as tiny bright spots in these images."
      },
      {
        type: "heading",
        body: "The P2 Experiment That Failed"
      },
      {
        type: "text",
        body: "I tried building a custom YOLOv8s-P2 model with 75M parameters, adding an extra detection head for small objects. It failed completely — zero useful detections. The standard YOLOv8s + SAHI combination achieved 0.27 mAP@50 with 161 vessel detections, and 77% were classified as dark ships via SAR-AIS fusion using a 5km Haversine threshold. Sometimes the simple approach wins."
      },
      {
        type: "heading",
        body: "Lessons Learned"
      },
      {
        type: "text",
        body: "The biggest takeaway was that for small object detection in satellite imagery, inference strategy (SAHI slicing) matters more than model architecture complexity. Also, running deep learning experiments on Colab free tier taught me to be extremely disciplined about checkpoint management and experiment tracking — you never know when the runtime will disconnect."
      },
    ]
  },
  {
    slug: "teaching-soc-triage-workshop",
    title: "Teaching SOC Triage: Building Realistic Workshop Materials",
    date: "2026-02-28",
    readTime: "5 min",
    tags: ["Cybersecurity", "Teaching", "SOC"],
    color: "#ff4081",
    excerpt: "Designing scenario-based workshops for Security Operations that teach students to think like analysts, not just follow playbooks.",
    content: [
      {
        type: "text",
        body: "As a Teaching Assistant for Security Operations & Incident Response at Adelaide University, I faced an interesting challenge: how do you teach students to triage security alerts when they've never sat in a SOC? Textbook knowledge about MITRE ATT&CK and incident response frameworks is necessary but insufficient. Students need to develop intuition."
      },
      {
        type: "heading",
        body: "Scenario-Based Learning"
      },
      {
        type: "text",
        body: "I designed weekly workshops around realistic incident scenarios. Each scenario presents students with a stream of alerts — some critical, some noise — and they need to prioritize, investigate, and respond under time pressure. The key was making scenarios ambiguous enough that there's no single 'correct' answer, forcing students to justify their reasoning."
      },
      {
        type: "heading",
        body: "Printable Worksheets as Training Tools"
      },
      {
        type: "text",
        body: "I created structured worksheets that walk students through the triage process: initial assessment, P1-P4 priority classification, SITREP documentation, and escalation decisions. The tutor answer keys don't just list 'right answers' — they explain the reasoning chain and highlight common mistakes. This format worked well because students could reference the worksheets during hands-on exercises without breaking flow."
      },
      {
        type: "heading",
        body: "What Worked Best"
      },
      {
        type: "text",
        body: "The most effective exercise was the 'alert fatigue' simulation — flooding students with 30+ alerts in 15 minutes and seeing who could identify the one critical lateral movement alert hidden in the noise. It taught them that real SOC work is mostly about filtering signal from noise, not about knowing every CVE by heart."
      },
    ]
  },
  {
    slug: "numcompute-group-project",
    title: "NumCompute: Building a Scientific Computing Toolkit in Plain Python",
    date: "2026-02-10",
    readTime: "4 min",
    tags: ["Python", "NumPy", "Teamwork"],
    color: "#ffc107",
    excerpt: "How four students built a modular scientific computing toolkit with 129 tests at 99% coverage — coordinated entirely through GitHub branches and PRs.",
    content: [
      {
        type: "text",
        body: "NumCompute was our group assignment for the AIML course — a modular scientific computing toolkit built with plain Python and NumPy. No scikit-learn, no scipy, no shortcuts. The constraint forced us to deeply understand the algorithms we were implementing: linear algebra solvers, statistical functions, numerical integration, and optimization methods."
      },
      {
        type: "heading",
        body: "Coordination at Scale"
      },
      {
        type: "text",
        body: "Four people working on interrelated mathematical modules is a recipe for merge conflicts. We established strict conventions from day one: each person owns specific modules, all work happens on feature branches, PRs require at least one reviewer, and every function needs tests before merging. GitHub's branch protection rules enforced this automatically."
      },
      {
        type: "heading",
        body: "Testing as Documentation"
      },
      {
        type: "text",
        body: "We ended up with 129 tests at 99% coverage. More importantly, the tests served as living documentation — anyone could read the test file for a module and understand exactly what each function does, what edge cases it handles, and what outputs to expect. This was especially valuable when debugging integration issues between modules."
      },
    ]
  },
];

// ===== HELPER =====
function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// ===== BLOG PAGE =====
export default function Blog() {
  const [selectedPost, setSelectedPost] = useState(null);
  const [dark, setDark] = useState(true);
  const [filterTag, setFilterTag] = useState(null);
  const contentRef = useRef(null);

  // Check URL hash for direct post links
  useEffect(() => {
    const slug = window.location.hash.replace("#", "");
    if (slug) {
      const post = posts.find((p) => p.slug === slug);
      if (post) setSelectedPost(post);
    }
  }, []);

  useEffect(() => {
    if (selectedPost && contentRef.current) {
      contentRef.current.scrollTo(0, 0);
    }
  }, [selectedPost]);

  const allTags = [...new Set(posts.flatMap((p) => p.tags))];
  const filtered = filterTag ? posts.filter((p) => p.tags.includes(filterTag)) : posts;

  const accent = "#00e5ff";
  const accent2 = "#7c4dff";
  const bg = dark ? "#0a0a0f" : "#f5f5f8";
  const card = dark ? "#12121a" : "#ffffff";
  const text = dark ? "#e8e8f0" : "#1a1a2e";
  const textDim = dark ? "#8888a0" : "#666680";
  const border = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";
  const mono = "'Space Mono',monospace";
  const heading = "'Syne',sans-serif";
  const body = "'DM Sans',sans-serif";

  return (
    <div ref={contentRef} style={{ background: bg, color: text, fontFamily: body, minHeight: "100vh", transition: "background 0.4s, color 0.4s" }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeInFast { from{opacity:0} to{opacity:1} }
        ::selection { background:#00e5ff33; color:#00e5ff }
        * { scrollbar-width:thin; scrollbar-color:#00e5ff33 transparent }
        html { scroll-behavior:smooth }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        padding: "16px 48px", display: "flex", justifyContent: "space-between", alignItems: "center",
        background: dark ? "rgba(10,10,15,0.85)" : "rgba(245,245,248,0.9)",
        backdropFilter: "blur(20px)", borderBottom: `1px solid ${border}`,
      }}>
        <Link to="/" style={{ fontFamily: heading, fontWeight: 800, fontSize: 22, background: `linear-gradient(135deg,${accent},${accent2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", textDecoration: "none" }}>
          OT.
        </Link>
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          <Link to="/" style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: textDim, textDecoration: "none", padding: "4px 0", transition: "color 0.3s" }}>
            Portfolio
          </Link>
          <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: accent, padding: "4px 0", borderBottom: `1px solid ${accent}` }}>
            Blog
          </span>
          <button onClick={() => setDark(!dark)} style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${border}`, borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: text }}>
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "60px 24px 120px" }}>

        {/* READING VIEW */}
        {selectedPost ? (
          <article style={{ animation: "fadeIn 0.5s ease both" }}>
            <button
              onClick={() => { setSelectedPost(null); window.location.hash = ""; }}
              style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: accent, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0, marginBottom: 40 }}
            >
              <ArrowLeft size={14} /> All Posts
            </button>

            <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.2em", color: selectedPost.color, marginBottom: 12 }}>
              {selectedPost.tags.join(" · ").toUpperCase()}
            </div>
            <h1 style={{ fontFamily: heading, fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.03em", marginBottom: 16 }}>
              {selectedPost.title}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 20, fontFamily: mono, fontSize: 11, color: textDim, marginBottom: 48, paddingBottom: 32, borderBottom: `1px solid ${border}` }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Calendar size={12} /> {formatDate(selectedPost.date)}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Clock size={12} /> {selectedPost.readTime} read</span>
            </div>

            <div style={{ fontSize: 16, lineHeight: 1.85, color: textDim, fontWeight: 300 }}>
              {selectedPost.content.map((block, i) => {
                if (block.type === "heading") {
                  return (
                    <h2 key={i} style={{ fontFamily: heading, fontSize: 20, fontWeight: 700, color: text, marginTop: 40, marginBottom: 12, lineHeight: 1.3 }}>
                      {block.body}
                    </h2>
                  );
                }
                return (
                  <p key={i} style={{ marginBottom: 20, animation: `fadeIn 0.4s ease ${0.1 + i * 0.05}s both` }}>
                    {block.body}
                  </p>
                );
              })}
            </div>

            {/* Post footer */}
            <div style={{ marginTop: 60, paddingTop: 32, borderTop: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {selectedPost.tags.map((t) => (
                  <span key={t} style={{ fontFamily: mono, fontSize: 10, padding: "4px 10px", background: `${selectedPost.color}12`, border: `1px solid ${selectedPost.color}30`, color: selectedPost.color, borderRadius: 4 }}>{t}</span>
                ))}
              </div>
              <button
                onClick={() => { setSelectedPost(null); window.location.hash = ""; }}
                style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: accent, background: "none", border: `1px solid ${border}`, borderRadius: 4, padding: "10px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.3s" }}
              >
                Back to All Posts <ArrowRight size={12} />
              </button>
            </div>
          </article>
        ) : (
          /* POST LIST VIEW */
          <>
            <div style={{ marginBottom: 60, animation: "fadeIn 0.5s ease both" }}>
              <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", color: accent, marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 1, background: accent }} />
                Blog
              </div>
              <h1 style={{ fontFamily: heading, fontSize: "clamp(2rem, 4.5vw, 3.2rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 16 }}>
                Thoughts & <span style={{ background: `linear-gradient(135deg,${accent},${accent2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>write-ups.</span>
              </h1>
              <p style={{ fontSize: 16, color: textDim, maxWidth: 520, lineHeight: 1.7, fontWeight: 300 }}>
                Notes on building things — from training language models to detecting ships from space.
              </p>
            </div>

            {/* Tag filters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 40, flexWrap: "wrap", animation: "fadeIn 0.5s ease 0.1s both" }}>
              <button
                onClick={() => setFilterTag(null)}
                style={{
                  fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", padding: "8px 16px",
                  background: !filterTag ? `${accent}18` : "transparent",
                  border: `1px solid ${!filterTag ? accent + "40" : border}`,
                  color: !filterTag ? accent : textDim,
                  cursor: "pointer", borderRadius: 4, transition: "all 0.3s",
                }}
              >
                All
              </button>
              {allTags.map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterTag(filterTag === t ? null : t)}
                  style={{
                    fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", padding: "8px 16px",
                    background: filterTag === t ? `${accent}18` : "transparent",
                    border: `1px solid ${filterTag === t ? accent + "40" : border}`,
                    color: filterTag === t ? accent : textDim,
                    cursor: "pointer", borderRadius: 4, transition: "all 0.3s",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Post cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {filtered.map((post, i) => (
                <article
                  key={post.slug}
                  onClick={() => { setSelectedPost(post); window.location.hash = post.slug; }}
                  style={{
                    padding: "32px 0", borderBottom: `1px solid ${border}`,
                    cursor: "pointer", transition: "all 0.3s",
                    animation: `fadeIn 0.4s ease ${0.15 + i * 0.08}s both`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.paddingLeft = "16px"; e.currentTarget.style.borderLeftColor = post.color; }}
                  onMouseLeave={(e) => { e.currentTarget.style.paddingLeft = "0"; e.currentTarget.style.borderLeftColor = "transparent"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
                    <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.15em", color: post.color }}>{formatDate(post.date)}</span>
                    <span style={{ fontFamily: mono, fontSize: 10, color: textDim, display: "flex", alignItems: "center", gap: 4 }}><Clock size={10} /> {post.readTime}</span>
                  </div>
                  <h2 style={{ fontFamily: heading, fontSize: 22, fontWeight: 700, lineHeight: 1.3, marginBottom: 8, color: text }}>{post.title}</h2>
                  <p style={{ fontSize: 15, color: textDim, lineHeight: 1.7, fontWeight: 300, marginBottom: 12, maxWidth: 640 }}>{post.excerpt}</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {post.tags.map((t) => (
                      <span key={t} style={{ fontFamily: mono, fontSize: 9, padding: "3px 8px", background: `${post.color}10`, border: `1px solid ${post.color}20`, color: post.color, borderRadius: 3 }}>{t}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: 60, color: textDim, fontFamily: mono, fontSize: 12 }}>
                No posts matching that tag yet.
              </div>
            )}
          </>
        )}
      </div>

      {/* FOOTER */}
      <footer style={{ padding: "24px 8vw", borderTop: `1px solid ${border}`, display: "flex", justifyContent: "space-between", fontFamily: mono, fontSize: 11, color: textDim, letterSpacing: "0.1em" }}>
        <span>&copy; 2026 Omkar Thombre</span>
        <span>Adelaide, Australia</span>
      </footer>
    </div>
  );
}
