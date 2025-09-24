/**
 * @fileoverview Map страница мобильного приложения
 * @module mobile/pages/Map
 * @description Страница с картой активностей
 */

import React, { useEffect, useMemo, useState } from 'react';
import styles from './Map.module.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MobileHeader from '../../components/MobileHeader';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import activitiesAPI from '../../../api/activities.api';
import { Activity } from '../../../types';
import { useNavigate } from 'react-router-dom';

/**
 * Map компонент
 * @component
 * @returns {JSX.Element} Страница карты
 */
const Map: React.FC = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fix default marker icons (Leaflet assets)
  useEffect(() => {
    const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
    const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
    const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
    // @ts-ignore
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const resp = await activitiesAPI.getActivities({}, 1, 200, 'created_at', false);
        setActivities(resp.data);
      } catch (e) {
        console.error('Failed to load activities for map', e);
        setError('Failed to load activities');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const center = useMemo<[number, number]>(() => {
    // Default center: Helsinki
    return [60.1699, 24.9384];
  }, []);

  return (
    <div className={styles.map}>
      <MobileHeader />

      <div className={styles.mapContainer}>
        {loading ? (
          <p className={styles.placeholder}>Loading map…</p>
        ) : error ? (
          <p className={styles.placeholder}>{error}</p>
        ) : (
          <MapContainer center={center} zoom={11} className={styles.leafletMap}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {activities.map(act => {
              const coords = act.coordinates;
              if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') return null;
              return (
                <Marker key={act.id} position={[coords.lat, coords.lng] as [number, number]}>
                  <Popup>
                    <div style={{ minWidth: 180 }}>
                      <strong>{act.title}</strong>
                      <div style={{ fontSize: 12, color: '#555' }}>{act.location}</div>
                      <button
                        style={{ marginTop: 8 }}
                        onClick={() => navigate(`/mobile/activity/${act.id}`)}
                      >
                        Open details
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>
    </div>
  );
};

export default Map;
