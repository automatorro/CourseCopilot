<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CourseForge AI - Generare Cursuri în Secunde</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Fraunces:opsz,wght@9..144,600;9..144,800&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --primary: #FF6B35;
            --secondary: #004E89;
            --accent: #F7B801;
            --dark: #1A1423;
            --light: #FFF8F0;
            --gradient-1: linear-gradient(135deg, #FF6B35 0%, #F7B801 100%);
            --gradient-2: linear-gradient(225deg, #004E89 0%, #1A1423 100%);
        }

        body {
            font-family: 'Outfit', sans-serif;
            background: var(--dark);
            color: var(--light);
            overflow-x: hidden;
        }

        /* Animated Mesh Background */
        .mesh-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
            background: 
                radial-gradient(circle at 20% 30%, rgba(255, 107, 53, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(0, 78, 137, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 50% 50%, rgba(247, 184, 1, 0.1) 0%, transparent 50%);
            animation: meshFloat 15s ease-in-out infinite;
        }

        @keyframes meshFloat {
            0%, 100% { 
                background-position: 0% 0%, 100% 100%, 50% 50%;
                background-size: 80% 80%, 90% 90%, 70% 70%;
            }
            50% { 
                background-position: 100% 100%, 0% 0%, 30% 70%;
                background-size: 100% 100%, 70% 70%, 90% 90%;
            }
        }

        /* Floating Particles */
        .particles {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
            overflow: hidden;
        }

        .particle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: var(--accent);
            border-radius: 50%;
            opacity: 0.3;
            animation: particleFloat 20s infinite ease-in-out;
        }

        @keyframes particleFloat {
            0%, 100% { 
                transform: translateY(0) translateX(0);
                opacity: 0.3;
            }
            50% { 
                transform: translateY(-100vh) translateX(50px);
                opacity: 0;
            }
        }

        /* Navigation */
        nav {
            position: fixed;
            top: 0;
            width: 100%;
            z-index: 1000;
            padding: 1.5rem 5%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(26, 20, 35, 0.8);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255, 248, 240, 0.1);
            transition: all 0.3s;
        }

        nav.scrolled {
            padding: 1rem 5%;
            background: rgba(26, 20, 35, 0.95);
        }

        .logo {
            font-family: 'Fraunces', serif;
            font-size: 1.8rem;
            font-weight: 800;
            background: var(--gradient-1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            letter-spacing: -0.02em;
            cursor: pointer;
            transition: transform 0.3s;
        }

        .logo:hover {
            transform: scale(1.05);
        }

        .nav-links {
            display: flex;
            gap: 3rem;
            list-style: none;
        }

        .nav-links a {
            color: var(--light);
            text-decoration: none;
            font-weight: 400;
            font-size: 0.95rem;
            position: relative;
            transition: color 0.3s;
        }

        .nav-links a::after {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 0;
            width: 0;
            height: 2px;
            background: var(--accent);
            transition: width 0.3s ease;
        }

        .nav-links a:hover::after {
            width: 100%;
        }

        .cta-nav {
            background: var(--gradient-1);
            color: var(--dark);
            padding: 0.7rem 1.8rem;
            border-radius: 50px;
            font-weight: 600;
            border: none;
            cursor: pointer;
            transition: transform 0.3s, box-shadow 0.3s;
            font-size: 0.95rem;
        }

        .cta-nav:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(255, 107, 53, 0.4);
        }

        /* Hero Section */
        .hero {
            position: relative;
            min-height: 100vh;
            display: flex;
            align-items: center;
            padding: 0 5%;
            gap: 5rem;
            z-index: 2;
        }

        .hero-content {
            flex: 1;
            max-width: 650px;
            opacity: 0;
            animation: fadeInLeft 1s ease-out forwards;
            animation-delay: 0.3s;
        }

        @keyframes fadeInLeft {
            from { transform: translateX(-50px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        .hero-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(247, 184, 1, 0.15);
            border: 1px solid var(--accent);
            padding: 0.5rem 1.2rem;
            border-radius: 50px;
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--accent);
            margin-bottom: 2rem;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(247, 184, 1, 0.4); }
            50% { transform: scale(1.05); box-shadow: 0 0 20px 10px rgba(247, 184, 1, 0); }
        }

        .hero h1 {
            font-family: 'Fraunces', serif;
            font-size: clamp(3rem, 7vw, 5.5rem);
            font-weight: 800;
            line-height: 1.1;
            margin-bottom: 1.5rem;
            letter-spacing: -0.03em;
        }

        .hero h1 .gradient-text {
            background: var(--gradient-1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            display: inline-block;
            animation: gradientShift 3s ease-in-out infinite;
        }

        @keyframes gradientShift {
            0%, 100% { filter: hue-rotate(0deg); }
            50% { filter: hue-rotate(20deg); }
        }

        .hero p {
            font-size: 1.25rem;
            line-height: 1.7;
            color: rgba(255, 248, 240, 0.8);
            margin-bottom: 3rem;
            font-weight: 300;
        }

        .hero-cta {
            display: flex;
            gap: 1.5rem;
            flex-wrap: wrap;
        }

        .btn-primary {
            background: var(--gradient-1);
            color: var(--dark);
            padding: 1.2rem 3rem;
            border-radius: 50px;
            font-weight: 600;
            border: none;
            cursor: pointer;
            font-size: 1.1rem;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
        }

        .btn-primary::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: translate(-50%, -50%);
            transition: width 0.6s, height 0.6s;
        }

        .btn-primary:hover::before {
            width: 300px;
            height: 300px;
        }

        .btn-primary:hover {
            transform: translateY(-3px) scale(1.05);
            box-shadow: 0 15px 40px rgba(255, 107, 53, 0.5);
        }

        .btn-secondary {
            background: transparent;
            color: var(--light);
            padding: 1.2rem 3rem;
            border-radius: 50px;
            border: 2px solid rgba(255, 248, 240, 0.3);
            font-weight: 600;
            cursor: pointer;
            font-size: 1.1rem;
            transition: all 0.3s;
        }

        .btn-secondary:hover {
            border-color: var(--accent);
            background: rgba(247, 184, 1, 0.1);
            transform: translateY(-3px);
        }

        /* Hero Visual with 3D Cards */
        .hero-visual {
            flex: 1;
            position: relative;
            perspective: 1000px;
            opacity: 0;
            animation: fadeInRight 1s ease-out forwards;
            animation-delay: 0.5s;
        }

        @keyframes fadeInRight {
            from { transform: translateX(50px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        .mockup-container {
            position: relative;
            width: 100%;
            height: 600px;
        }

        .mockup-window {
            position: absolute;
            background: rgba(255, 248, 240, 0.05);
            backdrop-filter: blur(30px);
            border: 1px solid rgba(255, 248, 240, 0.2);
            border-radius: 20px;
            overflow: hidden;
            transition: transform 0.3s ease;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .mockup-window:hover {
            transform: translateZ(20px) rotateY(5deg);
        }

        .window-header {
            background: rgba(255, 248, 240, 0.1);
            padding: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            border-bottom: 1px solid rgba(255, 248, 240, 0.1);
        }

        .window-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: var(--primary);
        }

        .window-dot:nth-child(2) { background: var(--accent); }
        .window-dot:nth-child(3) { background: var(--secondary); }

        .window-content {
            padding: 1.5rem;
            color: var(--light);
        }

        /* Main Window */
        .main-window {
            width: 450px;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            animation: floatMain 4s ease-in-out infinite;
            z-index: 3;
        }

        @keyframes floatMain {
            0%, 100% { transform: translate(-50%, -50%) translateY(0); }
            50% { transform: translate(-50%, -50%) translateY(-15px); }
        }

        /* Secondary Windows */
        .secondary-window-1 {
            width: 300px;
            top: 10%;
            left: 5%;
            animation: floatSecondary1 5s ease-in-out infinite;
            z-index: 2;
        }

        @keyframes floatSecondary1 {
            0%, 100% { transform: translateY(0) rotateZ(-3deg); }
            50% { transform: translateY(-20px) rotateZ(3deg); }
        }

        .secondary-window-2 {
            width: 280px;
            bottom: 15%;
            right: 5%;
            animation: floatSecondary2 6s ease-in-out infinite;
            z-index: 2;
        }

        @keyframes floatSecondary2 {
            0%, 100% { transform: translateY(0) rotateZ(3deg); }
            50% { transform: translateY(-25px) rotateZ(-3deg); }
        }

        /* Content Elements */
        .content-line {
            height: 8px;
            background: var(--gradient-1);
            border-radius: 4px;
            margin-bottom: 0.8rem;
            animation: contentPulse 2s ease-in-out infinite;
        }

        .content-line:nth-child(1) { width: 90%; animation-delay: 0s; }
        .content-line:nth-child(2) { width: 75%; animation-delay: 0.2s; }
        .content-line:nth-child(3) { width: 85%; animation-delay: 0.4s; }
        .content-line:nth-child(4) { width: 60%; animation-delay: 0.6s; }

        @keyframes contentPulse {
            0%, 100% { opacity: 0.6; transform: scaleX(1); }
            50% { opacity: 1; transform: scaleX(1.02); }
        }

        .ai-typing {
            display: flex;
            gap: 0.5rem;
            align-items: center;
            margin-top: 1.5rem;
        }

        .typing-dot {
            width: 8px;
            height: 8px;
            background: var(--accent);
            border-radius: 50%;
            animation: typingDot 1.4s ease-in-out infinite;
        }

        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typingDot {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-10px); }
        }

        /* Process Flow Animation */
        .process-flow {
            display: flex;
            align-items: center;
            gap: 0.8rem;
            margin-top: 1rem;
        }

        .process-step {
            flex: 1;
            height: 4px;
            background: rgba(255, 248, 240, 0.2);
            border-radius: 2px;
            position: relative;
            overflow: hidden;
        }

        .process-step::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: var(--gradient-1);
            animation: processFlow 3s ease-in-out infinite;
        }

        .process-step:nth-child(1)::after { animation-delay: 0s; }
        .process-step:nth-child(2)::after { animation-delay: 0.3s; }
        .process-step:nth-child(3)::after { animation-delay: 0.6s; }
        .process-step:nth-child(4)::after { animation-delay: 0.9s; }

        @keyframes processFlow {
            0% { left: -100%; }
            50%, 100% { left: 100%; }
        }

        /* Stats Section with Animated Numbers */
        .stats {
            position: relative;
            padding: 5rem 5%;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 3rem;
            z-index: 2;
        }

        .stat-card {
            text-align: center;
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.6s ease;
        }

        .stat-card.visible {
            opacity: 1;
            transform: translateY(0);
        }

        .stat-number {
            font-family: 'Fraunces', serif;
            font-size: 4rem;
            font-weight: 800;
            background: var(--gradient-1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            line-height: 1;
            margin-bottom: 0.5rem;
            position: relative;
        }

        .stat-number::after {
            content: attr(data-value);
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--gradient-1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: statGlow 2s ease-in-out infinite;
        }

        @keyframes statGlow {
            0%, 100% { opacity: 0; }
            50% { opacity: 0.5; filter: blur(10px); }
        }

        .stat-label {
            font-size: 1.1rem;
            color: rgba(255, 248, 240, 0.7);
            font-weight: 300;
        }

        /* Animated Illustration Section */
        .illustration-section {
            position: relative;
            padding: 8rem 5%;
            z-index: 2;
            overflow: hidden;
        }

        .illustration-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 5rem;
            align-items: center;
        }

        .illustration-content h2 {
            font-family: 'Fraunces', serif;
            font-size: clamp(2.5rem, 5vw, 4rem);
            font-weight: 800;
            margin-bottom: 1.5rem;
            line-height: 1.2;
        }

        .illustration-content p {
            font-size: 1.2rem;
            line-height: 1.7;
            color: rgba(255, 248, 240, 0.8);
            margin-bottom: 2rem;
        }

        .feature-list {
            list-style: none;
        }

        .feature-list li {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem 0;
            font-size: 1.1rem;
            border-bottom: 1px solid rgba(255, 248, 240, 0.1);
            opacity: 0;
            transform: translateX(-20px);
            transition: all 0.5s ease;
        }

        .feature-list li.visible {
            opacity: 1;
            transform: translateX(0);
        }

        .feature-icon-small {
            width: 40px;
            height: 40px;
            background: var(--gradient-1);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            flex-shrink: 0;
        }

        /* Animated SVG Illustration */
        .animated-illustration {
            position: relative;
            width: 100%;
            height: 500px;
        }

        .illustration-element {
            position: absolute;
            border-radius: 20px;
            transition: transform 0.3s ease;
        }

        .illustration-element:hover {
            transform: scale(1.05) translateZ(20px);
        }

        .element-1 {
            width: 60%;
            height: 70%;
            top: 10%;
            left: 20%;
            background: linear-gradient(135deg, rgba(255, 107, 53, 0.2), rgba(247, 184, 1, 0.2));
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 248, 240, 0.2);
            animation: float1 6s ease-in-out infinite;
        }

        @keyframes float1 {
            0%, 100% { transform: translateY(0) rotateZ(0deg); }
            50% { transform: translateY(-30px) rotateZ(2deg); }
        }

        .element-2 {
            width: 40%;
            height: 40%;
            top: 5%;
            right: 5%;
            background: linear-gradient(225deg, rgba(0, 78, 137, 0.2), rgba(26, 20, 35, 0.3));
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 248, 240, 0.2);
            animation: float2 5s ease-in-out infinite;
        }

        @keyframes float2 {
            0%, 100% { transform: translateY(0) rotateZ(0deg); }
            50% { transform: translateY(-20px) rotateZ(-3deg); }
        }

        .element-3 {
            width: 35%;
            height: 30%;
            bottom: 10%;
            left: 10%;
            background: linear-gradient(315deg, rgba(247, 184, 1, 0.2), rgba(255, 107, 53, 0.2));
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 248, 240, 0.2);
            animation: float3 7s ease-in-out infinite;
        }

        @keyframes float3 {
            0%, 100% { transform: translateY(0) rotateZ(0deg); }
            50% { transform: translateY(-25px) rotateZ(3deg); }
        }

        /* Icon animations inside elements */
        .element-icon {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 4rem;
            animation: iconPulse 3s ease-in-out infinite;
        }

        @keyframes iconPulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
            50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
        }

        /* Responsive */
        @media (max-width: 968px) {
            .hero {
                flex-direction: column;
                text-align: center;
                padding-top: 120px;
            }

            .hero-content {
                max-width: 100%;
            }

            .hero-cta {
                justify-content: center;
            }

            .nav-links {
                display: none;
            }

            .mockup-container {
                height: 400px;
            }

            .main-window {
                width: 320px;
            }

            .secondary-window-1,
            .secondary-window-2 {
                width: 200px;
            }

            .illustration-grid {
                grid-template-columns: 1fr;
                gap: 3rem;
            }

            .animated-illustration {
                height: 300px;
            }
        }

        /* Loading Animation */
        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255, 248, 240, 0.2);
            border-top-color: var(--accent);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 2rem auto;
        }
    </style>
</head>
<body>
    <!-- Animated Mesh Background -->
    <div class="mesh-bg"></div>

    <!-- Floating Particles -->
    <div class="particles" id="particles"></div>

    <!-- Navigation -->
    <nav id="navbar">
        <div class="logo">CourseForge AI</div>
        <ul class="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#demo">Demo</a></li>
            <li><a href="#contact">Contact</a></li>
        </ul>
        <button class="cta-nav">Începe Gratuit</button>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
        <div class="hero-content">
            <div class="hero-badge">
                ⚡ Powered by Gemini AI
            </div>
            <h1>
                Creează cursuri <span class="gradient-text">complete</span> în minute, nu luni
            </h1>
            <p>
                Platforma AI care transformă ideile tale în materiale de training profesionale. 
                De la blueprint la manual, exerciții și slides—totul generat automat cu pedagogie solidă.
            </p>
            <div class="hero-cta">
                <button class="btn-primary">Generează Primul Curs</button>
                <button class="btn-secondary">Vezi Demo Live</button>
            </div>
        </div>

        <div class="hero-visual">
            <div class="mockup-container">
                <!-- Main Window -->
                <div class="mockup-window main-window">
                    <div class="window-header">
                        <div class="window-dot"></div>
                        <div class="window-dot"></div>
                        <div class="window-dot"></div>
                    </div>
                    <div class="window-content">
                        <div style="font-weight: 600; margin-bottom: 1rem; font-size: 0.9rem; color: var(--accent);">
                            🧠 AI Generează...
                        </div>
                        <div class="content-line"></div>
                        <div class="content-line"></div>
                        <div class="content-line"></div>
                        <div class="content-line"></div>
                        <div class="ai-typing">
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                        </div>
                        <div class="process-flow">
                            <div class="process-step"></div>
                            <div class="process-step"></div>
                            <div class="process-step"></div>
                            <div class="process-step"></div>
                        </div>
                    </div>
                </div>

                <!-- Secondary Window 1 -->
                <div class="mockup-window secondary-window-1">
                    <div class="window-header">
                        <div class="window-dot"></div>
                        <div class="window-dot"></div>
                        <div class="window-dot"></div>
                    </div>
                    <div class="window-content">
                        <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.8rem;">Module 1: Intro</div>
                        <div style="font-size: 0.75rem; color: rgba(255, 248, 240, 0.6); margin-bottom: 0.5rem;">✓ Obiective generate</div>
                        <div style="font-size: 0.75rem; color: rgba(255, 248, 240, 0.6); margin-bottom: 0.5rem;">✓ Slides create</div>
                        <div style="font-size: 0.75rem; color: rgba(255, 248, 240, 0.6);">⏳ Exercises...</div>
                    </div>
                </div>

                <!-- Secondary Window 2 -->
                <div class="mockup-window secondary-window-2">
                    <div class="window-header">
                        <div class="window-dot"></div>
                        <div class="window-dot"></div>
                        <div class="window-dot"></div>
                    </div>
                    <div class="window-content">
                        <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.8rem;">📊 Progress</div>
                        <div style="height: 6px; background: rgba(255, 248, 240, 0.2); border-radius: 3px; overflow: hidden; margin-bottom: 0.5rem;">
                            <div style="height: 100%; width: 65%; background: var(--gradient-1); animation: progressGrow 2s ease-in-out infinite;"></div>
                        </div>
                        <div style="font-size: 0.75rem; color: var(--accent);">65% Complete</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Stats Section -->
    <section class="stats">
        <div class="stat-card" data-observe>
            <div class="stat-number" data-value="10min" data-target="10">10min</div>
            <div class="stat-label">Timp mediu generare</div>
        </div>
        <div class="stat-card" data-observe>
            <div class="stat-number" data-value="80%" data-target="80">80%</div>
            <div class="stat-label">Reducere timp creare</div>
        </div>
        <div class="stat-card" data-observe>
            <div class="stat-number" data-value="12" data-target="12">12</div>
            <div class="stat-label">Tipuri de materiale</div>
        </div>
        <div class="stat-card" data-observe>
            <div class="stat-number" data-value="99%" data-target="99">99%</div>
            <div class="stat-label">Satisfacție utilizatori</div>
        </div>
    </section>

    <!-- Illustration Section -->
    <section class="illustration-section">
        <div class="illustration-grid">
            <div class="illustration-content">
                <h2>Workflow <span class="gradient-text">inteligent</span> în 12 pași</h2>
                <p>
                    De la conversația inițială până la export-ul final, AI-ul orchestrează fiecare pas 
                    cu precizie pedagogică. Zero guesswork, 100% structură profesională.
                </p>
                <ul class="feature-list">
                    <li data-observe>
                        <div class="feature-icon-small">🎯</div>
                        <span>Blueprint automat bazat pe Bloom's Taxonomy</span>
                    </li>
                    <li data-observe>
                        <div class="feature-icon-small">📝</div>
                        <span>Content generation cu 3-pass refinement</span>
                    </li>
                    <li data-observe>
                        <div class="feature-icon-small">🎨</div>
                        <span>Export branded în PPTX, DOCX, PDF, SCORM</span>
                    </li>
                    <li data-observe>
                        <div class="feature-icon-small">⚡</div>
                        <span>Colaborare real-time pentru echipe</span>
                    </li>
                </ul>
            </div>

            <div class="animated-illustration">
                <div class="illustration-element element-1">
                    <div class="element-icon">📚</div>
                </div>
                <div class="illustration-element element-2">
                    <div class="element-icon">🧠</div>
                </div>
                <div class="illustration-element element-3">
                    <div class="element-icon">✨</div>
                </div>
            </div>
        </div>
    </section>

    <script>
        // Generate floating particles
        function createParticles() {
            const container = document.getElementById('particles');
            const particleCount = 30;
            
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = `${Math.random() * 100}%`;
                particle.style.top = `${Math.random() * 100}%`;
                particle.style.animationDelay = `${Math.random() * 20}s`;
                particle.style.animationDuration = `${15 + Math.random() * 10}s`;
                container.appendChild(particle);
            }
        }

        createParticles();

        // Navbar scroll effect
        const navbar = document.getElementById('navbar');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });

        // Intersection Observer for animations
        const observerOptions = {
            threshold: 0.2,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, index * 100);
                }
            });
        }, observerOptions);

        // Observe all elements with data-observe
        document.querySelectorAll('[data-observe]').forEach(el => {
            observer.observe(el);
        });

        // Smooth scroll
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // Parallax effect for hero
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrolled = window.pageYOffset;
                    const hero = document.querySelector('.hero');
                    const heroVisual = document.querySelector('.hero-visual');
                    
                    if (hero && scrolled < window.innerHeight) {
                        hero.style.transform = `translateY(${scrolled * 0.3}px)`;
                        hero.style.opacity = 1 - (scrolled / window.innerHeight * 0.5);
                    }
                    
                    if (heroVisual && scrolled < window.innerHeight) {
                        heroVisual.style.transform = `translateY(${scrolled * 0.5}px)`;
                    }
                    
                    ticking = false;
                });
                ticking = true;
            }
        });

        // 3D tilt effect for mockup windows
        document.querySelectorAll('.mockup-window').forEach(window => {
            window.addEventListener('mousemove', (e) => {
                const rect = window.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / 20;
                const rotateY = (centerX - x) / 20;
                
                window.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
            });
            
            window.addEventListener('mouseleave', () => {
                window.style.transform = '';
            });
        });

        // Progress bar animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes progressGrow {
                0% { width: 0%; }
                100% { width: 65%; }
            }
        `;
        document.head.appendChild(style);

        // Button ripple effect
        document.querySelectorAll('.btn-primary, .btn-secondary, .cta-nav').forEach(button => {
            button.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.style.position = 'absolute';
                ripple.style.borderRadius = '50%';
                ripple.style.background = 'rgba(255, 255, 255, 0.5)';
                ripple.style.transform = 'scale(0)';
                ripple.style.animation = 'ripple 0.6s ease-out';
                ripple.style.pointerEvents = 'none';
                
                this.appendChild(ripple);
                
                setTimeout(() => ripple.remove(), 600);
            });
        });

        const rippleStyle = document.createElement('style');
        rippleStyle.textContent = `
            @keyframes ripple {
                to { transform: scale(2); opacity: 0; }
            }
        `;
        document.head.appendChild(rippleStyle);
    </script>
</body>
</html>