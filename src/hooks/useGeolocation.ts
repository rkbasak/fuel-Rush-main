'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  isWatching: boolean;
}

export function useGeolocation(options?: {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    isWatching: false,
  });

  const watchIdRef = useRef<number | null>(null);

  // Request permission and get current position
  const getCurrentPosition = useCallback(async () => {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 10000,
        maximumAge: options?.maximumAge ?? 0,
      });

      setState((prev) => ({
        ...prev,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        error: null,
      }));

      return position;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get location';
      setState((prev) => ({ ...prev, error: errorMessage }));
      return null;
    }
  }, [options?.enableHighAccuracy, options?.timeout, options?.maximumAge]);

  // Start watching position (battery-efficient: only when app is active)
  const startWatching = useCallback(async () => {
    if (watchIdRef.current !== null) return; // Already watching

    try {
      // Request permission first
      const permStatus = await Geolocation.checkPermissions();
      if (permStatus.location !== 'granted') {
        const result = await Geolocation.requestPermissions();
        if (result.location !== 'granted') {
          setState((prev) => ({ ...prev, error: 'Location permission denied' }));
          return;
        }
      }

      // Get initial position
      await getCurrentPosition();

      // Start watching
      const watchId: number = Geolocation.watchPosition(
        {
          enableHighAccuracy: options?.enableHighAccuracy ?? true,
          timeout: options?.timeout ?? 10000,
          maximumAge: options?.maximumAge ?? 30000, // Cache for 30s to save battery
        },
        (position, error) => {
          if (error) {
            setState((prev) => ({ ...prev, error: error.message }));
            return;
          }
          if (position) {
            setState((prev) => ({
              ...prev,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              error: null,
              isWatching: true,
            }));
          }
        }
      ) as unknown as number;
      watchIdRef.current = watchId;

      setState((prev) => ({ ...prev, isWatching: true }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to watch location';
      setState((prev) => ({ ...prev, error: errorMessage }));
    }
  }, [getCurrentPosition, options?.enableHighAccuracy, options?.timeout, options?.maximumAge]);

  // Stop watching
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch({ id: String(watchIdRef.current) });
      watchIdRef.current = null;
    }
    setState((prev) => ({ ...prev, isWatching: false }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  return {
    ...state,
    getCurrentPosition,
    startWatching,
    stopWatching,
  };
}
