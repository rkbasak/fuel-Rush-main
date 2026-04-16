'use client';

import { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Station } from '@/types';
import { DARK_MAP_STYLE, getMarkerIcon, DEFAULT_MAP_CENTER, DEFAULT_ZOOM } from '@/lib/maps/utils';
import { useStationStore } from '@/stores';
import { getSiteSettings } from '@/lib/services/config';

interface StationWithVisited extends Station { isVisited?: boolean; }

interface MapViewProps {
  stations: StationWithVisited[];
  userLat?: number; userLng?: number;
  onStationSelect: (station: Station) => void;
  onMapLongPress?: (lat: number, lng: number) => void;
  className?: string;
}

export function MapView({ stations, userLat, userLng, onStationSelect, onMapLongPress, className = '' }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const { selectStation } = useStationStore();

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    
    async function initMap() {
      const settings = await getSiteSettings();
      const apiKey = settings.google_maps_api_key || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
      
      if (!apiKey) {
        console.error('Google Maps API key is missing. Please configure it in the Admin Panel.');
        return;
      }

      const loader = new Loader({ apiKey, version: 'weekly', libraries: ['places'] });
      await loader.load();
      
      if (!mapRef.current) return;
      
      const center = userLat && userLng ? { lat: userLat, lng: userLng } : DEFAULT_MAP_CENTER;
      mapInstanceRef.current = new google.maps.Map(mapRef.current, { 
        center, 
        zoom: DEFAULT_ZOOM, 
        styles: DARK_MAP_STYLE, 
        disableDefaultUI: true, 
        zoomControl: true, 
        mapTypeControl: false, 
        streetViewControl: false, 
        fullscreenControl: false, 
        gestureHandling: 'cooperative' 
      });
      
      infoWindowRef.current = new google.maps.InfoWindow();
      
      google.maps.event.addListener(mapInstanceRef.current, 'longpress', (e: google.maps.LatLng) => { 
        onMapLongPress?.(e.lat(), e.lng()); 
      });
    }

    initMap();

    return () => { 
      markersRef.current.forEach((m) => m.setMap(null)); 
      markersRef.current.clear(); 
      infoWindowRef.current?.close(); 
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();

    stations.forEach((station) => {
      const marker = new google.maps.Marker({
        position: { lat: station.lat, lng: station.lng },
        map: mapInstanceRef.current!,
        icon: { url: getMarkerIcon(station.status, station.isVisited), scaledSize: new google.maps.Size(32, 40), anchor: new google.maps.Point(16, 40) },
        title: station.name,
      });

      const visitedBadge = station.isVisited ? ' ⚫ Visited' : '';
      const infoContent = `<div style="color:#1F2937; padding:4px; min-width:150px;"><div style="font-weight:600; font-size:14px; margin-bottom:4px;">${station.name}</div><div style="font-size:12px; color:#6B7280; margin-bottom:4px;">${station.address}</div><div style="font-size:12px;"><span style="background:${station.status === 'available' ? '#10B981' : station.status === 'low' ? '#F59E0B' : station.status === 'queue' ? '#F97316' : '#EF4444'}20; color:${station.status === 'available' ? '#10B981' : station.status === 'low' ? '#F59E0B' : station.status === 'queue' ? '#F97316' : '#EF4444'}; padding:2px 8px; border-radius:12px; font-size:11px;">${station.status}${visitedBadge}</span><span style="margin-left:8px; color:#6B7280;">${station.confidence}%</span></div></div>`;
      marker.addListener('click', () => { selectStation(station.id); infoWindowRef.current?.setContent(infoContent); infoWindowRef.current?.open(mapInstanceRef.current!, marker); onStationSelect(station); });
      markersRef.current.set(station.id, marker);
    });
  }, [stations, selectStation, onStationSelect]);

  useEffect(() => { if (mapInstanceRef.current && userLat && userLng) mapInstanceRef.current.panTo({ lat: userLat, lng: userLng }); }, [userLat, userLng]);

  return <div ref={mapRef} className={`w-full h-full ${className}`} style={{ minHeight: '300px' }} />;
}
