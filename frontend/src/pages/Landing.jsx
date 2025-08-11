import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const typingText = "_A Collaborative Project Management Tool";

// Geometric shape component
const GeometricShape = ({ size, color, delay, position }) => {
  return (
    <div
      style={{
        position: "absolute",
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${color}20, ${color}05)`,
        borderRadius: "12px",
        transform: `rotate(${position.rotate}deg)`,
        left: position.x,
        top: position.y,
        animation: `floatGeometric 8s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        zIndex: 0,
      }}
    />
  );
};

// Dot pattern component
const DotPattern = ({ theme }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: theme === "dark" ? 0.08 : 0.15,
        background: `radial-gradient(circle, ${
          theme === "dark" ? "#6366f1" : "#3b82f6"
        } 1px, transparent 1px)`,
        backgroundSize: "30px 30px",
        animation: "drift 15s linear infinite",
        zIndex: 0,
      }}
    />
  );
};

const ICON_BG = {
  light: [
    "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    "linear-gradient(135deg, #10b981, #059669)",
    "linear-gradient(135deg, #824d12ff, #64290bff)",
  ],
  dark: [
    "linear-gradient(135deg, #6366f1, #3730a3)",
    "linear-gradient(135deg, #34d399, #047857)",
    "linear-gradient(135deg,#824d12ff, #64290bff )",
  ],
};

export default function Landing() {
  const [displayed, setDisplayed] = useState("");
  const [showButtons, setShowButtons] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [theme, setTheme] = useState("dark");
  const idx = useRef(0);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    // Clean the text by trimming whitespace
    const cleanText = typingText.trim();
    if (idx.current < cleanText.length) {
      const timeout = setTimeout(() => {
        setDisplayed((prev) => prev + cleanText[idx.current]);
        idx.current += 1;
      }, 60);
      return () => clearTimeout(timeout);
    } else {
      setTimeout(() => setShowButtons(true), 800);
    }
  }, [displayed]);

  const geometricShapes = [
    {
      size: "120px",
      color: theme === "dark" ? "#6366f1" : "#3b82f6",
      delay: 0,
      position: { x: "10%", y: "20%", rotate: 45 },
    },
    {
      size: "80px",
      color: theme === "dark" ? "#34d399" : "#10b981",
      delay: 2,
      position: { x: "85%", y: "30%", rotate: -30 },
    },
    {
      size: "100px",
      color: theme === "dark" ? "#fbbf24" : "#f59e0b",
      delay: 4,
      position: { x: "15%", y: "70%", rotate: 60 },
    },
    {
      size: "60px",
      color: theme === "dark" ? "#f87171" : "#ef4444",
      delay: 6,
      position: { x: "80%", y: "75%", rotate: -45 },
    },
  ];

  // Theme toggle handler
  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  // Feature icon backgrounds
  const iconBg = theme === "dark" ? ICON_BG.dark : ICON_BG.light;

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          theme === "dark"
            ? "linear-gradient(135deg, #18181b 0%, #27272a 100%)"
            : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        overflow: "hidden",
        position: "relative",
        fontFamily: "Arial, sans-serif",
        color: theme === "dark" ? "#e5e7eb" : "#1e293b",
        transition: "background 0.5s, color 0.5s",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes floatGeometric {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(180deg); }
        }
        @keyframes drift {
          0% { transform: translateX(0); }
          100% { transform: translateX(30px); }
        }
        @keyframes slideUp {
          0% { transform: translateY(60px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideDown {
          0% { transform: translateY(-60px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .main-title {
          font-family: 'Inter', sans-serif;
          font-weight: 800;
          font-size: clamp(3rem, 8vw, 5rem);
          color: inherit;
          margin: 0 0 32px 0;
          text-align: center;
          letter-spacing: -2px;
          line-height: 1.1;
          animation: slideDown 1s ease-out 0.2s both;
        }
        .subtitle {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 500;
          font-size: clamp(1.1rem, 3vw, 1.4rem);
          color: ${theme === "dark" ? "#a5b4fc" : "#64748b"};
          margin: 0 0 64px 0;
          text-align: center;
          letter-spacing: 0.5px;
          min-height: 50px;
          border-right: 0px solid transparent;
          padding-right: 8px;
          animation: slideUp 1s ease-out 0.4s both;
        }
        .button-container {
          display: flex;
          gap: 24px;
          flex-direction: row;
          align-items: center;
          animation: fadeIn 1s ease-out 0.6s both;
        }
        .btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
          padding: 16px 40px;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 12px;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.25);
          position: relative;
          overflow: hidden;
        }
        .btn-primary::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }
        .btn-primary:hover::before {
          left: 100%;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(59, 130, 246, 0.35);
        }
        .btn-secondary {
          background: ${theme === "dark" ? "#27272a" : "white"};
          color: #3b82f6;
          border: 2px solid #3b82f6;
          padding: 16px 40px;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 12px;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.1);
          position: relative;
          overflow: hidden;
        }
        .btn-secondary::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
          transition: left 0.5s;
        }
        .btn-secondary:hover::before {
          left: 100%;
        }
        .btn-secondary:hover {
          transform: translateY(-2px);
          background: #f8fafc;
          box-shadow: 0 8px 30px rgba(59, 130, 246, 0.2);
        }
        .main-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 2;
          position: relative;
          max-width: 900px;
          padding: 40px 20px;
          text-align: center;
        }
        @media (max-width: 768px) {
          .button-container {
            flex-direction: column;
            gap: 16px;
          }
          .btn-primary, .btn-secondary {
            width: 100%;
            max-width: 280px;
          }
        }
        .theme-toggle {
          position: absolute;
          top: 32px;
          right: 32px;
          z-index: 10;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.7rem;
          color: ${theme === "dark" ? "#a5b4fc" : "#1e293b"};
          transition: color 0.3s;
        }
      `}</style>

      {/* Theme toggle button */}
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        title="Toggle theme"
      >
        {theme === "dark" ? "🌞" : "🌙"}
      </button>

      {/* Dot pattern background */}
      <DotPattern theme={theme} />

      {/* Geometric shapes */}
      {geometricShapes.map((shape, index) => (
        <GeometricShape
          key={index}
          size={shape.size}
          color={shape.color}
          delay={shape.delay}
          position={shape.position}
        />
      ))}

      {/* Main content */}
      <div className="main-container">
        <h1 className="main-title">TeamSync</h1>
        <h2 className="subtitle">
          {displayed.substring(0, displayed.length - 9)}
        </h2>
        <div
          className="button-container"
          style={{
            opacity: showButtons ? 1 : 0,
            transform: showButtons ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s ease-out",
          }}
        >
          <button className="btn-primary" onClick={() => navigate("/signup")}>
            Sign Up
          </button>
          <button className="btn-secondary" onClick={() => navigate("/login")}>
            Login
          </button>
        </div>
        {/* Know More link */}
        <div
          style={{
            marginTop: 18,
            opacity: showButtons ? 1 : 0,
            transition: "opacity 0.8s 0.7s", // fade in after buttons
            display: "flex",
            justifyContent: "center",
          }}
        >
          <a
            href="#"
            style={{
              color:
                theme === "dark"
                  ? "rgba(165,180,252,0.55)"
                  : "rgba(59,130,246,0.55)",
              fontSize: "0.92rem",
              textDecoration: "none",
              opacity: 0.7,
              background: "none",
              border: "none",
              borderRadius: 6,
              padding: "2px 10px",
              transition: "color 0.2s, background 0.2s",
              cursor: "pointer",
              fontWeight: 500,
              letterSpacing: "0.02em",
              boxShadow: "none",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.textDecoration = "underline")
            }
            onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            Know More
          </a>
        </div>
        {/* Feature highlights */}
        <div
          style={{
            marginTop: "80px",
            display: "flex",
            gap: "40px",
            flexWrap: "wrap",
            justifyContent: "center",
            opacity: showButtons ? 1 : 0,
            transform: showButtons ? "translateY(0)" : "translateY(30px)",
            transition: "all 1s ease-out 0.3s",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              color: theme === "dark" ? "#d1d5db" : "#64748b",
              fontSize: "0.95rem",
              fontWeight: 500,
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: iconBg[0],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "1.2rem",
              }}
            >
              👥
            </div>
            Team Collaboration
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              color: theme === "dark" ? "#d1d5db" : "#64748b",
              fontSize: "0.95rem",
              fontWeight: 500,
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: iconBg[1],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "1.2rem",
              }}
            >
              📊
            </div>
            Project Tracking
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              color: theme === "dark" ? "#d1d5db" : "#64748b",
              fontSize: "0.95rem",
              fontWeight: 500,
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: iconBg[2],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "1.2rem",
              }}
            >
              ⚡
            </div>
            Real-time Updates
          </div>
        </div>
      </div>
    </div>
  );
}
