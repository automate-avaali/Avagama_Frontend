import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { apiService } from '../services/api';

// ---------------------------------------------------------------------------
// Feature-Based Access Control (FBAC) — client helper.
// Reads GET /api/permissions/me once (cached per auth token) and exposes a
// `can(feature)` gate used to mask nav items and guard routes.
//
// FAIL-SAFE BY DESIGN: the default is FULL ACCESS. A feature is hidden ONLY when
// it is explicitly `false`. If /permissions/me errors or the endpoint doesn't
// exist (e.g. an environment without FBAC), nothing is hidden — the app behaves
// exactly as before. Admins always pass.
// ---------------------------------------------------------------------------

export interface Perms {
  role?: string;
  isAdmin?: boolean;
  features?: Record<string, boolean>;
  agentAccess?: { mode: 'all' | 'restricted'; allowedAgentIds?: string[] };
}

// Module-level cache, keyed by the current auth token so it auto-invalidates on
// login / logout / account switch. One network call is shared across every hook.
let cacheToken: string | null = null;
let cache: Perms | null = null;
let inflight: Promise<Perms | null> | null = null;

const loadPerms = (): Promise<Perms | null> => {
  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('token') : null;
  if (token !== cacheToken) { cacheToken = token; cache = null; inflight = null; }
  if (!token) return Promise.resolve(null);
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = apiService.permissions
      .me()
      .then((r: any) => { cache = r?.data ?? null; return cache; })
      .catch(() => { cache = null; return null; });
  }
  return inflight;
};

/** Force the next read to refetch (e.g. after permissions were changed). */
export const resetPermissionsCache = () => { cacheToken = null; cache = null; inflight = null; };

export function usePermissions() {
  const [perms, setPerms] = useState<Perms | null>(cache);
  const [loading, setLoading] = useState<boolean>(
    !cache && typeof sessionStorage !== 'undefined' && !!sessionStorage.getItem('token'),
  );

  useEffect(() => {
    let alive = true;
    loadPerms().then(p => { if (alive) { setPerms(p); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  // Allowed unless the feature is explicitly false (admins always allowed).
  const can = (key: string): boolean => {
    if (!perms) return true;
    if (perms.isAdmin) return true;
    return perms.features?.[key] !== false;
  };

  return { perms, loading, can };
}

// Route guard — redirects to /dashboard when the user lacks the feature(s).
// Pass a single key or an array (all must pass). While permissions are still
// loading it shows a light spinner rather than flashing a page it may redirect.
export const FeatureRoute: React.FC<{ feature: string | string[]; children: React.ReactNode }> = ({ feature, children }) => {
  const { can, loading } = usePermissions();
  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-[#a26da8]/30 border-t-[#a26da8] rounded-full animate-spin" />
      </div>
    );
  }
  const keys = Array.isArray(feature) ? feature : [feature];
  return keys.every(k => can(k)) ? <>{children}</> : <Navigate to="/dashboard" replace />;
};
