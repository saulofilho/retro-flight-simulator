# Retro 3D Wireframe Flight Simulator 🛩️

Um simulador de voo retrofuturista interativo em 3D com malha de arame (wireframe), HUD vetorial clássico dos anos 80/90, relevo fractal contínuo procedural e áudio sintetizado em Web Audio API.

Live: https://saulofilho.github.io/retro-flight-simulator/

Inspirado nas clássicas interfaces de navegação vetorial e mapeamento militar/GIS estilo CRT azul-cobalto e verde neon.

---

## 🚀 Funcionalidades

- **Renderização 3D em Tempo Real (Three.js)**:
  - Malha poligonal procedural contínua gerada por ruído fractal Simplex.
  - Vários biomas e estilos de terreno: *Alpine Ridge*, *Canyon Maze*, *Coastal GIS*, *Lunar Craters* e *Synthwave Grid*.
  - Paletas de cores retrô: Cobalt & Neon Green (estilo do GIF original), Amber Phosphor, Emerald Terminal, Cyberpunk Violet e Monochrome Vector.
- **HUD Vetorial Completo & Telemetria**:
  - Bússola deslizante de rumo (Heading Ribbon de 000° a 359°).
  - Horizonte artificial dinâmico e escada de arfagem (Pitch Ladder) com retículo de mira.
  - Indicadores numéricos de GPS (Lat/Lon), Altitude MSL/AGL, Razão de Subida (FPM), Força G e Velocidade em Nós (KTS).
  - Mini Radar Tático 2D com feixe rotativo de varredura e detecção de waypoints.
- **Controles de Câmera & Visão**:
  - 5 Modos de câmera: *Cockpit 1ª Pessoa*, *Chase 3D*, *Orbit Livre*, *Top-Down 2D GIS* e *Isométrico*.
  - Ajuste de Campo de Visão (FOV) e Zoom.
  - Efeito opcional de tela CRT (Scanlines + Vinheta + Curvatura fosforescente).
- **Controles de Voo & Áudio Sintetizado**:
  - Manche virtual na tela para uso com mouse/touch e suporte total a atalhos de teclado.
  - Sintetizador sonoro em tempo real via Web Audio API (ronco do motor sincronizado à velocidade/aceleração, bipe de radar e alertas sonoros).
  - Piloto automático inteligente com modo de cruzeiro e navegação por waypoints.

---

## 🎮 Controles de Teclado

| Tecla | Ação |
| :--- | :--- |
| **W / S** ou **Seta Cima / Baixo** | Arfagem (Pitch Down / Up) |
| **A / D** ou **Seta Esquerda / Direita** | Rolagem / Inclinação (Roll Left / Right) |
| **Q / E** | Guinada / Leme (Yaw Left / Right) |
| **Shift / Ctrl** | Aumentar / Diminuir Potência (Throttle) |
| **V** | Alternar Modo de Câmera (Cockpit, Chase, Orbit, Top-Down, Isométrico) |
| **Tab** | Alternar Waypoint Alvo no Radar |
| **Espaço** | Ativar / Desativar Piloto Automático |

---

## 🛠️ Tecnologias Utilizadas

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Three.js](https://threejs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide React](https://lucide.dev/) (Ícones vetoriais)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) (Sintetizador procedural de áudio)

---

## 📦 Como Rodar Localmente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/saulofilho/retro-flight-simulator.git
   cd retro-flight-simulator
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Abra no navegador em `http://localhost:3000`.

4. **Gerar build de produção:**
   ```bash
   npm run build
   ```

---

## 🌐 Publicação no GitHub Pages

Este projeto já está configurado com o GitHub Actions workflow para deploy automático em `.github/workflows/deploy.yml`.

Para publicar no seu GitHub:

1. Crie um novo repositório no seu GitHub: [https://github.com/new](https://github.com/new) (ex: `retro-flight-simulator`).
2. Conecte o código local e envie:
   ```bash
   git remote add origin https://github.com/saulofilho/retro-flight-simulator.git
   git branch -M main
   git push -u origin main
   ```
3. No GitHub, vá em **Settings > Pages > Build and deployment > Source** e selecione **GitHub Actions**.
4. A cada push na branch `main`, seu site será compilado e publicado automaticamente no GitHub Pages!
