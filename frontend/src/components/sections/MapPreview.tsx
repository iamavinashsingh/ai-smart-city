import { useEffect, useRef } from "react";
import * as THREE from "three";
import ThreeGlobe from "three-globe";

export default function MapPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const tooltip = tooltipRef.current;

    const markerData = [
      { lat: 19.0760, lng: 72.8777, city: 'Mumbai', severity: 'Critical', label: '142 Potholes' },
      { lat: 28.7041, lng: 77.1025, city: 'New Delhi', severity: 'High', label: '89 Potholes' },
      { lat: 12.9716, lng: 77.5946, city: 'Bangalore', severity: 'Critical', label: '215 Potholes' },
      { lat: 13.0827, lng: 80.2707, city: 'Chennai', severity: 'Medium', label: '45 Potholes' },
      { lat: 22.5726, lng: 88.3639, city: 'Kolkata', severity: 'Low', label: '22 Potholes' },
    ];

    const arcsData = [
      { startLat: 19.0760, startLng: 72.8777, endLat: 28.7041, endLng: 77.1025, color: '#d6baff' },
      { startLat: 28.7041, startLng: 77.1025, endLat: 12.9716, endLng: 77.5946, color: '#6c1ecd' },
      { startLat: 12.9716, startLng: 77.5946, endLat: 22.5726, endLng: 88.3639, color: '#d6baff' }
    ];

    const Globe = new ThreeGlobe()
      .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-dark.jpg')
      .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
      .pointsData(markerData)
      .pointLat(d => (d as any).lat)
      .pointLng(d => (d as any).lng)
      .pointColor(d => (d as any).severity === 'Critical' ? '#ffb4ab' : '#d6baff')
      .pointAltitude(0.01)
      .pointRadius(0.8)
      .pointsMerge(true)
      .arcsData(arcsData)
      .arcColor('color')
      .arcDashLength(0.4)
      .arcDashGap(4)
      .arcDashInitialGap(() => Math.random() * 5)
      .arcDashAnimateTime(1000)
      .arcAltitude(0.2)
      .arcStroke(0.5)
      .hexPolygonsData([])
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.3)
      .hexPolygonColor((e) => ['IND'].includes((e as any).properties.ISO_A3) ? '#6c1ecd' : 'rgba(214, 186, 255, 0.05)');

    fetch('https://raw.githubusercontent.com/vasturiano/three-globe/master/example/country-polygons/ne_110m_admin_0_countries.json')
      .then(res => res.json())
      .then(countries => {
          Globe.hexPolygonsData(countries.features);
      });

    // Make camera look at India natively (India approx Lon: 78, Lat: 20 -> Rotate Y axis by -78 deg)
    Globe.rotation.y = - (78 * Math.PI) / 180;
    // Slightly tilt up to face 20 deg North
    Globe.rotation.x = (15 * Math.PI) / 180;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    let width = container.offsetWidth;
    let height = container.offsetHeight;
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.add(Globe);
    scene.add(new THREE.AmbientLight(0xbbbbbb, 0.3));
    const dLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dLight.position.set(-1, 1, 1);
    scene.add(dLight);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 280;

    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    const handleMouseDown = () => { isDragging = true; };
    const handleMouseUp = () => { isDragging = false; };
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaMove = {
          x: (e as any).offsetX - previousMousePosition.x,
          y: (e as any).offsetY - previousMousePosition.y
      };

      if (isDragging) {
          const deltaRotationQuaternion = new THREE.Quaternion()
              .setFromEuler(new THREE.Euler(
                  deltaMove.y * (Math.PI / 180) * 0.5,
                  deltaMove.x * (Math.PI / 180) * 0.5,
                  0,
                  'XYZ'
              ));
          Globe.quaternion.multiplyQuaternions(deltaRotationQuaternion, Globe.quaternion);
      }
      
      previousMousePosition = { x: (e as any).offsetX, y: (e as any).offsetY };

      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(Globe.children, true);
      
      if (tooltip) {
        if (intersects.length > 0) {
            tooltip.style.display = 'block';
            tooltip.style.left = `${e.clientX - rect.left + 15}px`;
            tooltip.style.top = `${e.clientY - rect.top + 15}px`;
            tooltip.innerHTML = `<strong>India Data Sync</strong><br/>Active Detection Node`;
        } else {
            tooltip.style.display = 'none';
        }
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mousemove', handleMouseMove);

    let animationFrameId: number;
    function animate() {
      if (!isDragging) {
          Globe.rotation.y += 0.001;
      }
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    }
    animate();

    const handleResize = () => {
      width = container.offsetWidth;
      height = container.offsetHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <section className="py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid lg:grid-cols-5 gap-12 items-center">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-4xl font-headline font-bold leading-tight">National Intelligence <br/>Grid</h2>
            <p className="text-on-surface-variant leading-relaxed">
              A real-time heatmap of Indian structural health. Monitor damage severity and prioritize repairs across connected urban hubs with automated AI urgency scores tailored for Indian roads.
            </p>
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-high border border-outline-variant/10">
                <div className="w-3 h-3 rounded-full bg-error animate-pulse"></div>
                <div>
                  <div className="text-sm font-bold">Critical Severity</div>
                  <div className="text-xs text-on-surface-variant">Bangalore, Inner Ring Road - 215 Reported</div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-high border border-outline-variant/10">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <div>
                  <div className="text-sm font-bold">Medium Priority</div>
                  <div className="text-xs text-on-surface-variant">Mumbai, Andheri West - 142 Reported</div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="relative glass-panel rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/20 aspect-[4/3] group bg-[#08080A]">
              <div ref={containerRef} id="globe-container"></div>
              <div ref={tooltipRef} className="globe-tooltip" id="globe-tooltip"></div>
              <div className="absolute bottom-4 left-4 pointer-events-none opacity-50 text-[10px] uppercase tracking-widest text-on-surface-variant">
                [ Click and drag to orbit ]
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
