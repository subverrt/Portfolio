import { Fragment, useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./App.css";
import AnimatedBackground from "./components/AnimatedBackground";

gsap.registerPlugin(ScrollTrigger);

/*
 * SPLIT CHARS
 * Wraps each character of `text` in a mask span (overflow: hidden)
 * containing an inner span (the thing GSAP actually animates).
 * The mask clips the letter while it slides up from below.
 * .char-mask has its own safe line-height (see App.css) so tight
 * heading line-heights don't clip ascenders/descenders.
 */
function SplitChars({ text }: { text: string }) {
  return (
    <>
      {text.split("").map((char, i) => (
        <span className="char-mask" key={i}>
          <span className="char">{char === " " ? "\u00A0" : char}</span>
        </span>
      ))}
    </>
  );
}

/*
 * SPLIT WORDS
 * Same masking idea as SplitChars, but per word, with real spaces
 * left between the mask spans so normal text wrapping still works.
 */
function SplitWords({ text }: { text: string }) {
  const words = text.split(" ");

  return (
    <>
      {words.map((word, i) => (
        <Fragment key={i}>
          <span className="word-mask">
            <span className="word">{word}</span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </>
  );
}

function App() {
  const heroRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLElement>(null);

  /*
   * LIVE CLOCK
   * Updates the footer time using India Standard Time.
   */
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      const time = now.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",

        hour: "2-digit",

        minute: "2-digit",

        hour12: false,
      });

      const element = document.getElementById("live-time");

      if (element) {
        element.textContent = time;
      }
    };

    updateTime();

    const interval = window.setInterval(updateTime, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  /*
   * HERO ENTRANCE TIMELINE
   * eyebrow -> title chars -> title line -> title shine sweep ->
   * description words -> button -> orbit.
   * Skips straight to the end state if the user prefers reduced motion.
   */
  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (prefersReducedMotion) {
        gsap.set(
          [
            ".hero-eyebrow-row > *",
            ".hero h1 .char",
            ".hero-title-line",
            ".hero-description-label",
            ".hero-description .word",
            ".hero-button",
            ".hero-orbit",
          ],
          { clearProps: "all" }
        );
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.from(".hero-eyebrow-row > *", {
        y: 16,
        opacity: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: "power3.out",
      })
        .from(
          ".hero h1 .char",
          {
            yPercent: 115,
            rotate: 6,
            duration: 1.1,
            stagger: 0.03,
          },
          "-=0.2"
        )
        .from(
          ".hero-title-line",
          {
            scaleX: 0,
            transformOrigin: "left",
            duration: 0.9,
            ease: "power3.out",
          },
          "-=0.6"
        )
        .to(
          ".hero-title-shine",
          {
            left: "130%",
            duration: 1.1,
            ease: "power2.inOut",
          },
          "-=0.5"
        )
        .from(
          ".hero-description-label",
          { y: 16, opacity: 0, duration: 0.5, ease: "power3.out" },
          "-=0.6"
        )
        .from(
          ".hero-description .word",
          {
            yPercent: 115,
            duration: 0.8,
            stagger: 0.025,
            ease: "power3.out",
          },
          "-=0.4"
        )
        .from(
          ".hero-button",
          { y: 20, opacity: 0, duration: 0.6, ease: "power3.out" },
          "-=0.5"
        )
        .from(
          ".hero-orbit",
          { opacity: 0, scale: 0.8, duration: 1, ease: "power3.out" },
          "-=0.8"
        );
    },
    { scope: heroRef }
  );

  /*
   * MAGNETIC BUTTON
   * VIEW PROJECTS button subtly follows the cursor within its bounds.
   */
  useGSAP(
    () => {
      const btn = heroRef.current?.querySelector<HTMLElement>(".hero-button");
      if (!btn) return;

      const xTo = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3" });
      const yTo = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3" });

      const handleMove = (e: MouseEvent) => {
        const rect = btn.getBoundingClientRect();
        const relX = e.clientX - rect.left - rect.width / 2;
        const relY = e.clientY - rect.top - rect.height / 2;
        xTo(relX * 0.25);
        yTo(relY * 0.4);
      };

      const handleLeave = () => {
        xTo(0);
        yTo(0);
      };

      btn.addEventListener("mousemove", handleMove);
      btn.addEventListener("mouseleave", handleLeave);

      return () => {
        btn.removeEventListener("mousemove", handleMove);
        btn.removeEventListener("mouseleave", handleLeave);
      };
    },
    { scope: heroRef }
  );

  /*
   * MOUSE-PARALLAX TILT
   * The hero content tilts a few degrees toward the cursor for depth.
   * Requires `perspective` on the .hero container (see App.css).
   */
  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (prefersReducedMotion) return;

      const heroEl = heroRef.current;
      const content = heroEl?.querySelector<HTMLElement>(".hero-content");
      if (!heroEl || !content) return;

      const rotateXTo = gsap.quickTo(content, "rotateX", {
        duration: 0.6,
        ease: "power3",
      });
      const rotateYTo = gsap.quickTo(content, "rotateY", {
        duration: 0.6,
        ease: "power3",
      });

      const handleMove = (e: MouseEvent) => {
        const rect = heroEl.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / rect.width - 0.5;
        const relY = (e.clientY - rect.top) / rect.height - 0.5;
        rotateYTo(relX * 6);
        rotateXTo(relY * -6);
      };

      const handleLeave = () => {
        rotateXTo(0);
        rotateYTo(0);
      };

      heroEl.addEventListener("mousemove", handleMove);
      heroEl.addEventListener("mouseleave", handleLeave);

      return () => {
        heroEl.removeEventListener("mousemove", handleMove);
        heroEl.removeEventListener("mouseleave", handleLeave);
      };
    },
    { scope: heroRef }
  );

  /*
   * SCROLL-LINKED FADE
   * "SCROLL TO EXPLORE" fades out as the user scrolls past the hero.
   */
  useGSAP(
    () => {
      gsap.to(".hero-scroll", {
        opacity: 0,
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "+=200",
          scrub: true,
        },
      });
    },
    { scope: heroRef }
  );

  /*
   * ABOUT HEADING SCROLL REVEAL
   * "I build things / for the web." uses the same char-mask technique
   * as the hero title, but plays once the section scrolls into view
   * (and reverses if the user scrolls back up past it).
   */
  useGSAP(
    () => {
      const chars = aboutRef.current?.querySelectorAll<HTMLElement>(
        ".about-main h2 .char"
      );
      if (!chars || chars.length === 0) return;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (prefersReducedMotion) {
        gsap.set(chars, { clearProps: "all" });
        return;
      }

      gsap.from(chars, {
        yPercent: 115,
        rotate: 4,
        duration: 1,
        stagger: 0.02,
        ease: "power4.out",
        scrollTrigger: {
          trigger: aboutRef.current,
          start: "top 70%",
          toggleActions: "play none none reverse",
        },
      });
    },
    { scope: aboutRef }
  );

  return (
    <main className="app">
      {/* =====================================
          ANIMATED BACKGROUND
      ===================================== */}

      <AnimatedBackground />

      {/* =====================================
          NAVIGATION
      ===================================== */}

      <nav className="navbar">
        <a href="/" className="logo">
          Subverrt
        </a>

        <div className="nav-links">
          <a href="#work">Work</a>

          <a href="#about">About</a>

          <a href="#contact">Contact</a>
        </div>
      </nav>

      <section className="hero" ref={heroRef}>
        <div className="hero-content">
          <div className="hero-eyebrow-row">
            <p className="eyebrow">CREATIVE DEVELOPER</p>

            <span className="hero-status">
              <span className="status-dot" />
              AVAILABLE
            </span>
          </div>

          <div className="hero-title-wrap">
            <div className="hero-title-mask">
              <h1 aria-label="Subverrt">
                <span aria-hidden="true">
                  <SplitChars text="Subverrt" />
                </span>
              </h1>

              <span className="hero-title-shine" />
            </div>

            <div className="hero-title-line" />
          </div>

          <div className="hero-bottom">
            <div className="hero-description-wrap">
              <span className="hero-description-label">
                DIGITAL / CODE / DESIGN
              </span>

              <p
                className="hero-description"
                aria-label="I build digital experiences with code, design & technology."
              >
                <span aria-hidden="true">
                  <SplitWords text="I build digital experiences" />
                  <br />
                  <SplitWords text="with code, design & technology." />
                </span>
              </p>
            </div>

            <a href="#work" className="hero-button">
              <span className="hero-button-number">01</span>

              <span className="hero-button-text">VIEW PROJECTS</span>

              <span className="hero-button-arrow">↗</span>
            </a>
          </div>
        </div>

        <div className="hero-orbit">
          <span />
          <span />
        </div>

        <div className="hero-scroll">
          <span className="hero-scroll-line" />

          <span>SCROLL TO EXPLORE</span>

          <span className="hero-scroll-arrow">↓</span>
        </div>
      </section>

      {/* =====================================
          ABOUT
      ===================================== */}

      <section id="about" className="about-section" ref={aboutRef}>
        <div className="about-header">
          <p className="section-label">01 — ABOUT</p>

          <p className="about-location">BHUBANESWAR, INDIA</p>
        </div>

        <div className="about-main">
          <h2 aria-label="I build things for the web.">
            <span aria-hidden="true">
              <SplitChars text="I build things" />
              <br />
              <span className="about-highlight">
                <SplitChars text="for the web." />
              </span>
            </span>
          </h2>

          <div className="about-content">
            <div className="about-description">
              <p className="about-intro">
                I'm Subverrt — a full-stack developer focused on building
                responsive, thoughtful digital experiences.
              </p>

              <p>
                Currently Learing Machine Learning and GenAI. I
                work across React, Next.js, Node.js, PostgreSQL, TypeScript, JavaScript and
                Python Libraries.
              </p>

              <p>
                I enjoy turning ideas into functional products, exploring new
                technologies, and continuously improving the way software is
                designed and built.
              </p>
            </div>

            {/* =================================
                ABOUT STATS
            ================================= */}

            <div className="about-stats">
              <div className="about-stat">
                <strong>OPEN</strong>

                <span> TO WORK</span>
              </div>

              <div className="about-stat">
                <strong>MERN</strong>

                <span>FULL STACK</span>
              </div>

              <div className="about-stat">
                <strong>UI/UX</strong>

                <span>DESIGN</span>
              </div>

              <div className="about-stat">
                <strong>4+</strong>

                <span>PROJECTs</span>
              </div>
            </div>
          </div>
        </div>

        <div className="about-footer">
          <span>REACT · NEXT.JS · NODE · POSTGRESQL</span>

          <span>SCROLL TO EXPLORE ↓</span>
        </div>
      </section>

      {/* =====================================
          PROJECTS
      ===================================== */}

      <section id="work" className="projects-section">
        <div className="projects-header">
          <p className="section-label">02 — SELECTED WORK</p>

          <p className="project-count">01 / 01</p>
        </div>

        <article className="project-card">
          {/* =================================
              PROJECT VISUAL
          ================================= */}

          <div className="project-visual">
            <div
              className="
                flyhigh-orbit
                orbit-one
              "
            />

            <div
              className="
                flyhigh-orbit
                orbit-two
              "
            />

            <div
              className="
                flyhigh-orbit
                orbit-three
              "
            />

            <div className="flight-glow" />

            <div className="flight-icon">✈</div>

            <span className="visual-label">FLY HIGH</span>
          </div>

          {/* =================================
              PROJECT INFORMATION
          ================================= */}

          <div className="project-info">
            <div className="project-meta">
              <span>01</span>

              <span>WEB APPLICATION</span>
            </div>

            <h3>Fly High</h3>

            <p className="project-description">
              A modern flight-booking platform built with the MERN stack. Users
              can discover flights, book tickets, manage bookings, and manage
              their profiles through a responsive interface.
            </p>

            <div className="project-tags">
              <span>MongoDB</span>

              <span>Express</span>

              <span>React</span>

              <span>Node.js</span>

              <span>JWT</span>
            </div>

            <div className="project-actions">
              <a
                href="https://flyhigh-two.vercel.app/"
                target="_blank"
                rel="noreferrer"
                className="
                  project-link
                  primary
                "
              >
                LIVE PROJECT
                <span>↗</span>
              </a>

              <span className="project-type">FULL STACK</span>
            </div>
          </div>
        </article>
      </section>

      {/* =====================================
          CONTACT
      ===================================== */}

      <section id="contact" className="contact-section">
        {/* =================================
            CONTACT LABEL
        ================================= */}

        <div className="contact-top">
          <div className="contact-label">
            <span>CONTACT</span>

            <span className="contact-line" />

            <span>SAY HELLO</span>
          </div>
        </div>

        {/* =================================
            CONTACT MAIN
        ================================= */}

        <div className="contact-main">
          {/* =================================
              LARGE TYPOGRAPHY
          ================================= */}

          <div className="contact-title">
            <h2>Subverrt</h2>

            <h3>@subverrt</h3>
          </div>

          {/* =================================
              CONTACT LINKS
          ================================= */}

          <div className="contact-links">
            {/* GITHUB */}

            <a
              href="https://github.com/subverrt"
              target="_blank"
              rel="noreferrer"
              className="contact-link"
            >
              <span>GitHub</span>

              <span className="contact-arrow">↗</span>
            </a>

            {/* X */}

            <a
              href="https://x.com/subverrt"
              target="_blank"
              rel="noreferrer"
              className="contact-link"
            >
              <span>X</span>

              <span className="contact-arrow">↗</span>
            </a>

            {/* EMAIL */}

            <a href="mailto:subhamdash265@gmail.com" className="contact-link">
              <span>Email</span>

              <span className="contact-arrow">↗</span>
            </a>

            {/* RESUME */}

            <a
              href="/src/assets/resume.pdf"
              target="_blank"
              rel="noreferrer"
              className="contact-link"
            >
              <span>Résumé</span>

              <span className="contact-arrow">↗</span>
            </a>
          </div>
        </div>

        {/* =================================
            CONTACT FOOTER
        ================================= */}

        <div className="contact-footer">
          <div className="contact-location">
            <span>BHUBANESWAR</span>

            <span className="footer-line" />

            <span>IST</span>

            <span id="live-time" className="live-time">
              00:00
            </span>
          </div>

          <span className="contact-year">© 2026</span>
        </div>
      </section>
    </main>
  );
}

export default App;