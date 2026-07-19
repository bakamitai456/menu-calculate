export async function downloadFromRemote(deps) {
  const {
    getSyncUrl,
    getLastSyncAt,
    setLastSyncAt,
    buildLocalPayload,
    applyMerged,
    fetchRemote,
    merge,
    onStatusChange,
    onConflict,
    onDownloaded,
  } = deps;

  const url = getSyncUrl();
  if (!url) return;

  onStatusChange?.('downloading');
  try {
    const remote = await fetchRemote(url);
    if (!remote || !remote.version) {
      onStatusChange?.('idle');
      return;
    }

    const local = buildLocalPayload();
    const { merged, conflicts } = merge(local, remote, getLastSyncAt());

    if (conflicts.length > 0) {
      onStatusChange?.('conflict');
      const resolvedMerged = await onConflict(conflicts, merged);
      applyMerged(resolvedMerged);
    } else {
      applyMerged(merged);
    }

    setLastSyncAt(new Date().toISOString());
    onStatusChange?.('idle');
    onDownloaded?.();
  } catch (err) {
    console.error('[Sync] download failed', err);
    onStatusChange?.('error');
  }
}

export async function uploadToRemote(deps) {
  const { getSyncUrl, setLastSyncAt, buildLocalPayload, pushRemote, onStatusChange } = deps;

  const url = getSyncUrl();
  if (!url) return;

  onStatusChange?.('uploading');
  try {
    await pushRemote(url, buildLocalPayload());
    setLastSyncAt(new Date().toISOString());
    onStatusChange?.('idle');
  } catch (err) {
    console.error('[Sync] upload failed', err);
    onStatusChange?.('error');
  }
}
