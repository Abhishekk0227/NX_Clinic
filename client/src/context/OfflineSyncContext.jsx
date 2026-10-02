import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useToast } from './ToastContext';

const OfflineSyncContext = createContext(null);

export const OfflineSyncProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState(() => {
    try {
      const saved = localStorage.getItem('hms_sync_queue');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const { addToast } = useToast();

  // Save queue to local storage
  useEffect(() => {
    localStorage.setItem('hms_sync_queue', JSON.stringify(syncQueue));
  }, [syncQueue]);

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || syncQueue.length === 0 || isSyncing) return;

    setIsSyncing(true);
    addToast(`Syncing ${syncQueue.length} offline changes with server...`, 'info', 2000);

    try {
      const res = await api.syncBatch(syncQueue);
      if (res && res.results) {
        const failedOps = [];
        res.results.forEach((r, idx) => {
          if (r.status === 'failed') {
            failedOps.push(syncQueue[idx]);
          }
        });

        setSyncQueue(failedOps);
        const syncedCount = syncQueue.length - failedOps.length;
        if (syncedCount > 0) {
          addToast(`Successfully synchronized ${syncedCount} changes!`, 'success');
        }
        if (failedOps.length > 0) {
          addToast(`${failedOps.length} operations had conflicts or failed.`, 'warning');
        }
      }
    } catch (err) {
      console.error('Batch sync error:', err);
      addToast('Sync failed. Will retry automatically when connection stabilizes.', 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [syncQueue, isSyncing, addToast]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addToast('Connection restored. Back online!', 'success');
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      addToast('Working in offline mode. Changes will be saved locally.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [triggerSync, addToast]);

  const queueOperation = useCallback((operation) => {
    const op = {
      operationId: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      deviceId: 'client-browser-1',
      ...operation
    };

    setSyncQueue((prev) => [...prev, op]);
    addToast('Change saved to offline queue', 'info', 2000);

    if (navigator.onLine) {
      setTimeout(() => triggerSync(), 500);
    }
  }, [addToast, triggerSync]);

  return (
    <OfflineSyncContext.Provider
      value={{
        isOnline,
        syncQueue,
        queueCount: syncQueue.length,
        isSyncing,
        queueOperation,
        triggerSync
      }}
    >
      {children}
    </OfflineSyncContext.Provider>
  );
};

export const useOfflineSync = () => {
  const context = useContext(OfflineSyncContext);
  if (!context) {
    throw new Error('useOfflineSync must be used within an OfflineSyncProvider');
  }
  return context;
};
