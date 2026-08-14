import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CameraConfig, FlightState, TerrainConfig, Waypoint } from '../types';
import { THEMES, getTerrainHeight } from '../utils/terrainGenerator';

interface Viewport3DProps {
  flightState: FlightState;
  onUpdateFlightState: (updater: (prev: FlightState) => FlightState) => void;
  cameraConfig: CameraConfig;
  terrainConfig: TerrainConfig;
  waypoints: Waypoint[];
  activeWaypoint: Waypoint | null;
  keysPressed: Record<string, boolean>;
  joystickInput: { x: number; y: number };
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  flightState,
  onUpdateFlightState,
  cameraConfig,
  terrainConfig,
  waypoints,
  activeWaypoint,
  keysPressed,
  joystickInput,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshGroupRef = useRef<THREE.Group | null>(null);
  const aircraftGroupRef = useRef<THREE.Group | null>(null);
  const waypointsGroupRef = useRef<THREE.Group | null>(null);
  const sunMeshRef = useRef<THREE.Mesh | null>(null);

  // Flight simulation internal variables (in ref for silky 60fps physics loop)
  const flightStateRef = useRef(flightState);
  flightStateRef.current = flightState;

  const cameraConfigRef = useRef(cameraConfig);
  cameraConfigRef.current = cameraConfig;

  const terrainConfigRef = useRef(terrainConfig);
  terrainConfigRef.current = terrainConfig;

  const keysPressedRef = useRef(keysPressed);
  keysPressedRef.current = keysPressed;

  const joystickInputRef = useRef(joystickInput);
  joystickInputRef.current = joystickInput;

  // Orbit camera drag state
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const orbitAngleRef = useRef({ yaw: 0, pitch: 0.3 });

  // Grid dimensions
  const GRID_SIZE = 40; // 40x40 segments
  const GRID_SPACING = 15; // units per vertex
  const terrainGeometryRef = useRef<THREE.PlaneGeometry | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const terrainWireRef = useRef<THREE.LineSegments | null>(null);
  const contourLinesRef = useRef<THREE.LineSegments | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const theme = THEMES[terrainConfig.colorTheme];
    scene.background = new THREE.Color(theme.bgHex);
    // Subtle fog to create depth fade into the cobalt horizon
    scene.fog = new THREE.FogExp2(theme.bgHex, 0.0016);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(
      cameraConfig.fov,
      width / height,
      1,
      2500
    );
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(200, 400, 100);
    scene.add(dirLight);

    // 5. Retro Vector Sun on Horizon
    const sunGeo = new THREE.CircleGeometry(60, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      color: theme.accentHex,
      wireframe: true,
      side: THREE.DoubleSide,
    });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.position.set(0, 70, -1400);
    scene.add(sunMesh);
    sunMeshRef.current = sunMesh;

    // 6. Terrain Mesh Group
    const meshGroup = new THREE.Group();
    scene.add(meshGroup);
    meshGroupRef.current = meshGroup;

    // Build initial terrain geometry
    const totalW = GRID_SIZE * GRID_SPACING;
    const totalH = GRID_SIZE * GRID_SPACING;
    const geo = new THREE.PlaneGeometry(totalW, totalH, GRID_SIZE, GRID_SIZE);
    geo.rotateX(-Math.PI / 2); // Lay flat on X-Z plane
    terrainGeometryRef.current = geo;

    // Shaded face mesh
    const faceMat = new THREE.MeshLambertMaterial({
      color: theme.faceHex,
      polygonOffset: true,
      polygonOffsetFactor: 1, // Push faces back so wireframe renders cleanly
      polygonOffsetUnits: 1,
      flatShading: true,
    });
    const faceMesh = new THREE.Mesh(geo, faceMat);
    meshGroup.add(faceMesh);
    terrainMeshRef.current = faceMesh;

    // Wireframe overlay using Edges or LineSegments
    const wireGeo = new THREE.WireframeGeometry(geo);
    const wireMat = new THREE.LineBasicMaterial({
      color: theme.wireHex,
      linewidth: 1,
    });
    const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
    meshGroup.add(wireMesh);
    terrainWireRef.current = wireMesh;

    // 7. Minimalist 3D Vector Jet Aircraft (for Chase/Orbit views)
    const aircraftGroup = new THREE.Group();
    scene.add(aircraftGroup);
    aircraftGroupRef.current = aircraftGroup;

    // Construct retro stealth vector fuselage
    const jetGeo = new THREE.BufferGeometry();
    // Vertices of futuristic vector jet
    const vertices = new Float32Array([
      // Nose to wingtips to tail
      0, 0, -10,   -8, 0, 8,     // Nose to Left Wingtip
      -8, 0, 8,     -2, 0, 7,     // Left Wingtip to left engine
      -2, 0, 7,     -2, 3, 8,     // Left engine to left tail fin
      -2, 3, 8,     0, 0, 7,      // Left tail fin to center tail
      0, 0, 7,      2, 3, 8,      // Center tail to right tail fin
      2, 3, 8,      2, 0, 7,      // Right tail fin to right engine
      2, 0, 7,      8, 0, 8,      // Right engine to Right Wingtip
      8, 0, 8,      0, 0, -10,    // Right Wingtip to Nose
      0, 0, -10,    0, 2, 2,      // Nose to cockpit top
      0, 2, 2,      0, 0, 7,      // Cockpit top to tail
      -8, 0, 8,     0, 1.5, 2,    // Left wing to cockpit
      8, 0, 8,      0, 1.5, 2,    // Right wing to cockpit
    ]);
    jetGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const jetMat = new THREE.LineBasicMaterial({ color: theme.accentHex, linewidth: 2 });
    const jetWire = new THREE.LineSegments(jetGeo, jetMat);
    aircraftGroup.add(jetWire);

    // 8. Waypoints Group
    const waypointsGroup = new THREE.Group();
    scene.add(waypointsGroup);
    waypointsGroupRef.current = waypointsGroup;

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Orbit mouse controls
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      orbitAngleRef.current.yaw -= dx * 0.008;
      orbitAngleRef.current.pitch = Math.max(-0.5, Math.min(1.2, orbitAngleRef.current.pitch + dy * 0.008));
    };
    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation Loop
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const keys = keysPressedRef.current;
      const joy = joystickInputRef.current;
      const cfg = terrainConfigRef.current;
      const cam = cameraConfigRef.current;

      // Update flight physics
      onUpdateFlightState((prev) => {
        let { x, y, z, pitch, roll, yaw, speed, throttle, autopilot } = prev;

        // Manual controls or Autopilot
        if (autopilot) {
          // Smooth autopilot cruising
          throttle = 65;
          speed = THREE.MathUtils.lerp(speed, 180, delta * 1.5);
          
          if (prev.autopilotMode === 'orbit') {
            yaw = (yaw + delta * 15) % 360;
            roll = THREE.MathUtils.lerp(roll, 20, delta * 2);
          } else if (prev.autopilotMode === 'canyon') {
            yaw = (yaw + Math.sin(currentTime * 0.001) * delta * 25) % 360;
            roll = THREE.MathUtils.lerp(roll, Math.sin(currentTime * 0.001) * 35, delta * 2);
          } else {
            // Straight cruise with gentle bank
            roll = THREE.MathUtils.lerp(roll, 0, delta * 2);
            pitch = THREE.MathUtils.lerp(pitch, 0, delta * 2);
          }
        } else {
          // Manual input from keyboard & joystick
          let pitchInput = 0;
          let rollInput = 0;
          let yawInput = 0;
          let throttleDelta = 0;

          if (keys['KeyW'] || keys['ArrowUp']) pitchInput -= 1;
          if (keys['KeyS'] || keys['ArrowDown']) pitchInput += 1;
          if (keys['KeyA'] || keys['ArrowLeft']) rollInput -= 1;
          if (keys['KeyD'] || keys['ArrowRight']) rollInput += 1;
          if (keys['KeyQ']) yawInput -= 1;
          if (keys['KeyE']) yawInput += 1;
          if (keys['ShiftLeft'] || keys['Equal']) throttleDelta += 25 * delta;
          if (keys['ControlLeft'] || keys['Minus']) throttleDelta -= 25 * delta;

          // Merge joystick
          if (Math.abs(joy.y) > 0.05) pitchInput += joy.y;
          if (Math.abs(joy.x) > 0.05) rollInput += joy.x;

          // Update throttle & speed
          throttle = Math.max(0, Math.min(100, throttle + throttleDelta));
          const targetSpeed = (throttle / 100) * 260 + 40;
          speed = THREE.MathUtils.lerp(speed, targetSpeed, delta * 2.0);

          // Flight angular physics (Roll drives Yaw, Pitch drives Climb)
          pitch = Math.max(-60, Math.min(60, pitch + pitchInput * 45 * delta));
          roll = Math.max(-75, Math.min(75, roll + rollInput * 70 * delta));
          yaw = (yaw + (yawInput * 35 + roll * 0.6) * delta + 360) % 360;

          // Auto-centering tendencies when no input
          if (pitchInput === 0 && Math.abs(joy.y) <= 0.05) {
            pitch = THREE.MathUtils.lerp(pitch, 0, delta * 1.5);
          }
          if (rollInput === 0 && Math.abs(joy.x) <= 0.05) {
            roll = THREE.MathUtils.lerp(roll, 0, delta * 1.2);
          }
        }

        // Forward vector calculation based on heading & pitch
        const radYaw = THREE.MathUtils.degToRad(yaw);
        const radPitch = THREE.MathUtils.degToRad(pitch);
        const speedUnits = (speed * 0.8 * cfg.scanSpeed) * delta;

        const forwardX = Math.sin(radYaw) * Math.cos(radPitch);
        const forwardZ = -Math.cos(radYaw) * Math.cos(radPitch);
        const forwardY = Math.sin(-radPitch);

        x += forwardX * speedUnits;
        z += forwardZ * speedUnits;
        y += forwardY * speedUnits * 0.8;

        // Sample ground elevation at aircraft position
        const groundElevation = getTerrainHeight(x, z, cfg.preset, cfg.elevationScale);
        
        // Prevent crashing below ground (terrain hugging minimum altitude)
        const minAltitude = groundElevation + 12;
        if (y < minAltitude) {
          y = THREE.MathUtils.lerp(y, minAltitude, delta * 8);
          pitch = Math.max(5, pitch); // Force pitch up
        }

        const altitudeAGL = Math.max(0, Math.round((y - groundElevation) * 35));
        const altitudeMSL = Math.round(y * 35 + 1200);
        const climbRate = Math.round(forwardY * speed * 25);
        const gForce = 1.0 + (Math.abs(roll) / 75) * 0.8 + (Math.abs(pitch) / 60) * 0.5;

        // Simulated GPS lat/lon
        const lat = 34.0522 + (z * 0.00008);
        const lon = -118.2437 + (x * 0.00008);

        return {
          ...prev,
          x,
          y,
          z,
          pitch,
          roll,
          yaw,
          speed,
          throttle,
          climbRate,
          gForce,
          groundElevation,
          altitudeAGL,
          altitudeMSL,
          lat,
          lon,
          time: prev.time + delta,
        };
      });

      // Update 3D Visual Mesh Vertices dynamically
      const currentFlight = flightStateRef.current;
      if (geo && terrainMeshRef.current && terrainWireRef.current) {
        const posAttr = geo.attributes.position;
        const totalW = GRID_SIZE * GRID_SPACING;
        const totalH = GRID_SIZE * GRID_SPACING;

        // Snap grid center to nearest grid spacing to create continuous rolling landscape illusion
        const snappedCenterX = Math.floor(currentFlight.x / GRID_SPACING) * GRID_SPACING;
        const snappedCenterZ = Math.floor(currentFlight.z / GRID_SPACING) * GRID_SPACING;

        meshGroup.position.set(snappedCenterX, 0, snappedCenterZ);

        for (let i = 0; i <= GRID_SIZE; i++) {
          for (let j = 0; j <= GRID_SIZE; j++) {
            const index = i * (GRID_SIZE + 1) + j;
            const vx = (j - GRID_SIZE / 2) * GRID_SPACING;
            const vz = (i - GRID_SIZE / 2) * GRID_SPACING;

            const worldX = snappedCenterX + vx;
            const worldZ = snappedCenterZ + vz;

            const height = getTerrainHeight(worldX, worldZ, cfg.preset, cfg.elevationScale);
            // Three.js rotated PlaneGeometry: Y is elevation after rotateX(-PI/2)
            posAttr.setY(index, height);
          }
        }
        posAttr.needsUpdate = true;
        geo.computeVertexNormals();

        // Refresh wireframe lines
        terrainWireRef.current.geometry.dispose();
        terrainWireRef.current.geometry = new THREE.WireframeGeometry(geo);
      }

      // Update Aircraft position & rotation
      if (aircraftGroupRef.current) {
        aircraftGroupRef.current.position.set(currentFlight.x, currentFlight.y, currentFlight.z);
        aircraftGroupRef.current.rotation.order = 'YXZ';
        aircraftGroupRef.current.rotation.y = -THREE.MathUtils.degToRad(currentFlight.yaw);
        aircraftGroupRef.current.rotation.x = THREE.MathUtils.degToRad(currentFlight.pitch);
        aircraftGroupRef.current.rotation.z = -THREE.MathUtils.degToRad(currentFlight.roll);

        // Hide aircraft in cockpit mode
        aircraftGroupRef.current.visible = cam.mode !== 'cockpit';
      }

      // Update Sun position to stay ahead of aircraft
      if (sunMeshRef.current) {
        const radY = THREE.MathUtils.degToRad(currentFlight.yaw);
        sunMeshRef.current.position.set(
          currentFlight.x + Math.sin(radY) * 1200,
          75,
          currentFlight.z - Math.cos(radY) * 1200
        );
        sunMeshRef.current.lookAt(currentFlight.x, 75, currentFlight.z);
      }

      // Update Camera based on active ViewMode
      if (cameraRef.current) {
        const radYaw = THREE.MathUtils.degToRad(currentFlight.yaw);
        const radPitch = THREE.MathUtils.degToRad(currentFlight.pitch);
        const radRoll = THREE.MathUtils.degToRad(currentFlight.roll);

        cameraRef.current.fov = cam.fov / cam.zoom;
        cameraRef.current.updateProjectionMatrix();

        if (cam.mode === 'cockpit') {
          // First person cockpit view
          cameraRef.current.position.set(currentFlight.x, currentFlight.y + 1.2, currentFlight.z);
          cameraRef.current.rotation.order = 'YXZ';
          cameraRef.current.rotation.y = -radYaw + cam.yawOffset;
          cameraRef.current.rotation.x = radPitch + cam.pitchOffset;
          cameraRef.current.rotation.z = -radRoll;
        } else if (cam.mode === 'chase') {
          // Third person chase view behind jet
          const dist = 32 * (1 / cam.zoom);
          const heightOffset = 9;
          const camX = currentFlight.x - Math.sin(radYaw) * dist;
          const camZ = currentFlight.z + Math.cos(radYaw) * dist;
          const camY = currentFlight.y + heightOffset;

          cameraRef.current.position.set(camX, camY, camZ);
          cameraRef.current.lookAt(
            currentFlight.x + Math.sin(radYaw) * 40,
            currentFlight.y + 2,
            currentFlight.z - Math.cos(radYaw) * 40
          );
        } else if (cam.mode === 'orbit') {
          // Orbit view around aircraft
          const dist = 50 * (1 / cam.zoom);
          const orbYaw = orbitAngleRef.current.yaw;
          const orbPitch = orbitAngleRef.current.pitch;

          const camX = currentFlight.x + Math.sin(orbYaw) * Math.cos(orbPitch) * dist;
          const camZ = currentFlight.z + Math.cos(orbYaw) * Math.cos(orbPitch) * dist;
          const camY = currentFlight.y + Math.sin(orbPitch) * dist + 10;

          cameraRef.current.position.set(camX, camY, camZ);
          cameraRef.current.lookAt(currentFlight.x, currentFlight.y, currentFlight.z);
        } else if (cam.mode === 'topdown') {
          // Top-down 2D GIS satellite view
          cameraRef.current.position.set(currentFlight.x, currentFlight.y + 280 / cam.zoom, currentFlight.z);
          cameraRef.current.rotation.set(-Math.PI / 2, 0, -radYaw);
        } else if (cam.mode === 'isometric') {
          // Angled axonometric survey view
          cameraRef.current.position.set(
            currentFlight.x + 140 / cam.zoom,
            currentFlight.y + 160 / cam.zoom,
            currentFlight.z + 140 / cam.zoom
          );
          cameraRef.current.lookAt(currentFlight.x, currentFlight.y, currentFlight.z);
        }
      }

      // Render Scene
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      resizeObserver.disconnect();
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Update theme colors when colorTheme changes
  useEffect(() => {
    if (!sceneRef.current || !terrainMeshRef.current || !terrainWireRef.current || !sunMeshRef.current) return;
    const theme = THEMES[terrainConfig.colorTheme];
    
    sceneRef.current.background = new THREE.Color(theme.bgHex);
    if (sceneRef.current.fog) {
      sceneRef.current.fog.color = new THREE.Color(theme.bgHex);
    }

    // Update materials
    const faceMat = terrainMeshRef.current.material as THREE.MeshLambertMaterial;
    if (faceMat) {
      faceMat.color.setHex(theme.faceHex);
      faceMat.visible = terrainConfig.wireframeMode !== 'wireframe';
    }

    const wireMat = terrainWireRef.current.material as THREE.LineBasicMaterial;
    if (wireMat) {
      wireMat.color.setHex(theme.wireHex);
    }

    const sunMat = sunMeshRef.current.material as THREE.MeshBasicMaterial;
    if (sunMat) {
      sunMat.color.setHex(theme.accentHex);
    }
  }, [terrainConfig.colorTheme, terrainConfig.wireframeMode]);

  // Update Waypoints in 3D scene
  useEffect(() => {
    if (!waypointsGroupRef.current) return;
    const group = waypointsGroupRef.current;
    group.clear();

    const theme = THEMES[terrainConfig.colorTheme];

    waypoints.forEach((wp) => {
      const wpGroup = new THREE.Group();
      wpGroup.position.set(wp.x, wp.alt, wp.z);

      // Vector beacon diamond
      const diamondGeo = new THREE.OctahedronGeometry(6, 0);
      const isTarget = activeWaypoint?.id === wp.id;
      const diamondMat = new THREE.MeshBasicMaterial({
        color: isTarget ? theme.accentHex : 0xffffff,
        wireframe: true,
      });
      const diamond = new THREE.Mesh(diamondGeo, diamondMat);
      wpGroup.add(diamond);

      // Beacon vertical laser line to ground
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -wp.alt, 0),
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: isTarget ? theme.accentHex : theme.wireHex,
        transparent: true,
        opacity: 0.7,
      });
      const laserLine = new THREE.Line(lineGeo, lineMat);
      wpGroup.add(laserLine);

      group.add(wpGroup);
    });
  }, [waypoints, activeWaypoint, terrainConfig.colorTheme]);

  return (
    <div
      ref={containerRef}
      id="viewport-3d-canvas"
      className="absolute inset-0 w-full h-full cursor-crosshair overflow-hidden touch-none"
    />
  );
};
