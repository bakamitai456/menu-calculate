// A polling sync engine inherently needs a timer handle and in-flight/conflict
// guard flags. This factory closes over that mutable state instead of exposing
// it as a shared singleton object with `this` — the one place in this codebase
// that isn't pure, made explicit rather than implicit.
export function createSyncEngine(deps) {
  const {
    getSyncUrl,
    getLastSyncAt,
    setLastSyncAt,
    getSyncInterval,
    setSyncInterval,
    buildLocalPayload,
    applyMerged,
    fetchRemote,
    pushRemote,
    merge,
    onStatusChange,
    onConflict,
    onSynced,
  } = deps;

  let timer = null;
  let syncing = false;
  let conflictPending = false;

  async function syncOnce() {
    const url = getSyncUrl();
    if (!url || syncing || conflictPending) return;
    syncing = true;
    onStatusChange?.('syncing');
    try {
      const remote = await fetchRemote(url);
      const local = buildLocalPayload();

      if (!remote || !remote.version) {
        await pushRemote(url, local);
        setLastSyncAt(new Date().toISOString());
        onStatusChange?.('idle');
        return;
      }

      const { merged, conflicts } = merge(local, remote, getLastSyncAt());

      if (conflicts.length > 0) {
        conflictPending = true;
        onStatusChange?.('conflict');
        const resolvedMerged = await onConflict(conflicts, merged);
        applyMerged(resolvedMerged);
        try {
          await pushRemote(url, buildLocalPayload());
          setLastSyncAt(new Date().toISOString());
        } catch (e) {
          console.error('[SyncEngine] push after conflict resolution failed', e);
        }
        conflictPending = false;
        onStatusChange?.('idle');
        onSynced?.();
        return;
      }

      applyMerged(merged);
      await pushRemote(url, buildLocalPayload());
      setLastSyncAt(new Date().toISOString());
      onStatusChange?.('idle');
      onSynced?.();
    } catch (err) {
      console.error('[SyncEngine]', err);
      onStatusChange?.('error');
    } finally {
      syncing = false;
    }
  }

  function start() {
    if (timer) return;
    syncOnce();
    timer = setInterval(syncOnce, getSyncInterval() * 1000);
  }

  function stop() {
    clearInterval(timer);
    timer = null;
  }

  function setIntervalSeconds(seconds) {
    setSyncInterval(seconds);
    if (timer) {
      clearInterval(timer);
      timer = setInterval(syncOnce, getSyncInterval() * 1000);
    }
  }

  return { start, stop, syncOnce, setIntervalSeconds };
}
