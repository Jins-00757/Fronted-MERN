import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../../context/useAuth';
import api from '../../services/api';
import { EmptyBoxIllustration } from '../ui/DashboardIcons';
import './AccountsMap.css';

// Leaflet's default marker icon references image paths that Vite's bundler
// doesn't resolve (a well-known react-leaflet/webpack-family gotcha) -
// point the default icon at the same package version's CDN-hosted images
// instead of trying to import/resolve the local asset files.
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const formatCurrency = (amount) => `$${(amount || 0).toLocaleString()}`;

/**
 * Auto-fits the map viewport to every account marker whenever the account
 * list changes - has to live inside <MapContainer> to reach the map
 * instance via react-leaflet's useMap().
 */
const FitBounds = ({ accounts }) => {
  const map = useMap();

  useEffect(() => {
    if (accounts.length === 0) return;
    const bounds = L.latLngBounds(accounts.map((account) => [account.lat, account.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
  }, [accounts, map]);

  return null;
};

const EmptyState = ({ message }) => (
  <div className="map-empty-state">
    <EmptyBoxIllustration />
    <p>{message}</p>
  </div>
);

export const AccountsMap = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [ungeocoded, setUngeocoded] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.isSalesforceConnected) return undefined;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount loading flag, not derivable from props/state
    setIsLoading(true);
    setError('');

    api
      .get('/salesforce/map/accounts', { params: { limit: 200 } })
      .then((response) => {
        if (cancelled) return;
        if (response.data.success) {
          setAccounts(response.data.data?.accounts || []);
          setUngeocoded(response.data.data?.ungeocoded || []);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load account locations');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.isSalesforceConnected]);

  if (!user?.isSalesforceConnected) {
    return (
      <div className="container">
        <EmptyState message="Connect your Salesforce account from the Dashboard to view the accounts map." />
      </div>
    );
  }

  return (
    <div className="container map-page">
      <div className="map-page-header">
        <div>
          <h1 style={{ margin: 0 }}>Accounts Map</h1>
          <p className="map-page-subtitle">
            {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'} mapped from billing addresses
          </p>
        </div>
      </div>

      {error && <div className="map-error-banner">{error}</div>}

      {!error && isLoading && <EmptyState message="Loading account locations..." />}

      {!error && !isLoading && accounts.length === 0 && (
        <EmptyState message="No accounts could be mapped yet - add billing addresses in Salesforce to see them here." />
      )}

      {!error && !isLoading && accounts.length > 0 && (
        <>
          {ungeocoded.length > 0 && (
            <div className="map-ungeocoded-notice">
              {ungeocoded.length} {ungeocoded.length === 1 ? 'account' : 'accounts'} couldn&apos;t be mapped -
              missing or unrecognized address.
            </div>
          )}

          <div className="map-container-wrap">
            <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitBounds accounts={accounts} />
              {accounts.map((account) => (
                <Marker key={account.id} position={[account.lat, account.lng]}>
                  <Popup>
                    <strong>{account.name}</strong>
                    <br />
                    {[account.city, account.state].filter(Boolean).join(', ') || 'Location on file'}
                    <br />
                    {account.opportunityCount} {account.opportunityCount === 1 ? 'deal' : 'deals'} ·{' '}
                    {formatCurrency(account.pipelineValue)}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default AccountsMap;
