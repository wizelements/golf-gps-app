// ============================================
// Golf GPS Tracker - Map Component
// Lightweight vector mode (no external tiles required)
// ============================================

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Coordinate, Hole, Shot } from '@/types';
import { formatDistance } from '@/services/math';

interface MapProps {
  center?: Coordinate;
  playerPosition?: Coordinate | null;
  hole?: Hole | null;
  shots?: Shot[];
  onMapClick?: (coord: Coordinate) => void;
  showControls?: boolean;
  interactive?: boolean;
}

const COLORS = {
  tee: '#5c6bc0',
  green: '#4caf50',
  player: '#2196f3',
  shot: '#ff9800',
  putt: '#9c27b0',
  line: '#ffffff'
};

export function GolfMap({
  center,
  playerPosition,
  hole,
  shots = [],
  onMapClick,
  showControls = true,
  interactive = true
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const defaultCenter = center || playerPosition || { lat: 40.7128, lng: -74.006 };

    mapInstance.current = L.map(mapRef.current, {
      center: [defaultCenter.lat, defaultCenter.lng],
      zoom: 17,
      zoomControl: showControls,
      attributionControl: false,
      dragging: interactive,
      touchZoom: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      className: 'map-tiles'
    }).addTo(mapInstance.current);

    layersRef.current = L.layerGroup().addTo(mapInstance.current);

    if (onMapClick && interactive) {
      mapInstance.current.on('click', (e) => {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !layersRef.current) return;

    layersRef.current.clearLayers();

    if (hole) {
      const teeMarker = L.circleMarker([hole.teeLat, hole.teeLng], {
        radius: 12,
        fillColor: COLORS.tee,
        color: '#fff',
        weight: 2,
        fillOpacity: 0.9
      });
      teeMarker.bindTooltip('Tee', { permanent: false });
      layersRef.current.addLayer(teeMarker);

      const greenMarker = L.circleMarker([hole.greenLat, hole.greenLng], {
        radius: 16,
        fillColor: COLORS.green,
        color: '#fff',
        weight: 2,
        fillOpacity: 0.9
      });
      greenMarker.bindTooltip('Green', { permanent: false });
      layersRef.current.addLayer(greenMarker);

      const teeLine = L.polyline(
        [
          [hole.teeLat, hole.teeLng],
          [hole.greenLat, hole.greenLng]
        ],
        {
          color: 'rgba(255,255,255,0.3)',
          weight: 2,
          dashArray: '10, 10'
        }
      );
      layersRef.current.addLayer(teeLine);
    }

    if (shots.length > 0) {
      const shotCoords: [number, number][] = shots.map((s) => [s.lat, s.lng]);

      if (shotCoords.length > 1) {
        const shotLine = L.polyline(shotCoords, {
          color: COLORS.line,
          weight: 2,
          opacity: 0.7
        });
        layersRef.current.addLayer(shotLine);
      }

      shots.forEach((shot, index) => {
        const isLast = index === shots.length - 1;
        const marker = L.circleMarker([shot.lat, shot.lng], {
          radius: isLast ? 10 : 8,
          fillColor: shot.isPutt ? COLORS.putt : COLORS.shot,
          color: '#fff',
          weight: isLast ? 3 : 2,
          fillOpacity: 0.9
        });

        let tooltipText = `Shot ${shot.shotNumber}`;
        if (shot.club) tooltipText += ` (${shot.club})`;
        if (shot.distanceToNext) {
          tooltipText += ` - ${formatDistance(shot.distanceToNext)}`;
        }
        marker.bindTooltip(tooltipText, { permanent: false });
        layersRef.current?.addLayer(marker);
      });
    }

    if (playerPosition) {
      const playerMarker = L.circleMarker([playerPosition.lat, playerPosition.lng], {
        radius: 10,
        fillColor: COLORS.player,
        color: '#fff',
        weight: 3,
        fillOpacity: 1
      });
      playerMarker.bindTooltip('You', { permanent: false });
      layersRef.current.addLayer(playerMarker);

      const pulseCircle = L.circleMarker([playerPosition.lat, playerPosition.lng], {
        radius: 20,
        fillColor: COLORS.player,
        color: COLORS.player,
        weight: 2,
        fillOpacity: 0.2,
        className: 'pulse-circle'
      });
      layersRef.current.addLayer(pulseCircle);
    }
  }, [hole, shots, playerPosition]);

  useEffect(() => {
    if (!mapInstance.current) return;

    const bounds: L.LatLngBoundsExpression = [];

    if (hole) {
      bounds.push([hole.teeLat, hole.teeLng]);
      bounds.push([hole.greenLat, hole.greenLng]);
    }

    if (playerPosition) {
      bounds.push([playerPosition.lat, playerPosition.lng]);
    }

    shots.forEach((s) => {
      bounds.push([s.lat, s.lng]);
    });

    if (bounds.length >= 2) {
      mapInstance.current.fitBounds(bounds, { padding: [40, 40] });
    } else if (bounds.length === 1) {
      mapInstance.current.setView(bounds[0], 17);
    } else if (center) {
      mapInstance.current.setView([center.lat, center.lng], 17);
    }
  }, [hole, playerPosition, shots, center]);

  return (
    <div className="map-container">
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      <style>{`
        .map-tiles {
          filter: saturate(0.6) brightness(0.8);
        }
        .pulse-circle {
          animation: mapPulse 2s ease-out infinite;
        }
        @keyframes mapPulse {
          0% { opacity: 0.6; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

interface SimpleCourseMapProps {
  hole: Hole;
  playerPosition?: Coordinate | null;
  shots?: Shot[];
  width?: number;
  height?: number;
}

export function SimpleCourseView({
  hole,
  playerPosition,
  shots = [],
  width = 300,
  height = 400
}: SimpleCourseMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const padding = 40;
    const points: Coordinate[] = [
      { lat: hole.teeLat, lng: hole.teeLng },
      { lat: hole.greenLat, lng: hole.greenLng },
      ...shots.map((s) => ({ lat: s.lat, lng: s.lng }))
    ];

    if (playerPosition) points.push(playerPosition);

    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latRange = maxLat - minLat || 0.001;
    const lngRange = maxLng - minLng || 0.001;

    const toCanvas = (coord: Coordinate): { x: number; y: number } => {
      const x = padding + ((coord.lng - minLng) / lngRange) * (width - 2 * padding);
      const y = height - padding - ((coord.lat - minLat) / latRange) * (height - 2 * padding);
      return { x, y };
    };

    ctx.fillStyle = '#1a3020';
    ctx.fillRect(0, 0, width, height);

    const teePos = toCanvas({ lat: hole.teeLat, lng: hole.teeLng });
    const greenPos = toCanvas({ lat: hole.greenLat, lng: hole.greenLng });

    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(teePos.x, teePos.y);
    ctx.lineTo(greenPos.x, greenPos.y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = COLORS.tee;
    ctx.beginPath();
    ctx.arc(teePos.x, teePos.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = COLORS.green;
    ctx.beginPath();
    ctx.arc(greenPos.x, greenPos.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    if (shots.length > 1) {
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      shots.forEach((shot, i) => {
        const pos = toCanvas({ lat: shot.lat, lng: shot.lng });
        if (i === 0) ctx.moveTo(pos.x, pos.y);
        else ctx.lineTo(pos.x, pos.y);
      });
      ctx.stroke();
    }

    shots.forEach((shot, i) => {
      const pos = toCanvas({ lat: shot.lat, lng: shot.lng });
      ctx.fillStyle = shot.isPutt ? COLORS.putt : COLORS.shot;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, i === shots.length - 1 ? 10 : 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(shot.shotNumber), pos.x, pos.y);
    });

    if (playerPosition) {
      const playerPos = toCanvas(playerPosition);
      ctx.fillStyle = COLORS.player;
      ctx.beginPath();
      ctx.arc(playerPos.x, playerPos.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }, [hole, playerPosition, shots, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ borderRadius: 12, display: 'block', margin: '0 auto' }}
    />
  );
}
