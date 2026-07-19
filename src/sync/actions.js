export async function downloadFromRemote(deps) {
  const { getSyncUrl, applyRemotePayload, fetchRemote, onStatusChange, onDownloaded } = deps;

  const url = getSyncUrl();
  if (!url) return;

  onStatusChange?.('downloading');
  try {
    const remote = await fetchRemote(url);
    if (!remote || !remote.version) {
      onStatusChange?.('idle');
      return;
    }

    applyRemotePayload(remote);
    onStatusChange?.('idle');
    onDownloaded?.();
  } catch (err) {
    console.error('[Sync] download failed', err);
    onStatusChange?.('error');
  }
}

export async function uploadToRemote(deps) {
  const { getSyncUrl, buildLocalPayload, pushRemote, onStatusChange } = deps;

  const url = getSyncUrl();
  if (!url) return;

  onStatusChange?.('uploading');
  try {
    await pushRemote(url, buildLocalPayload());
    onStatusChange?.('idle');
  } catch (err) {
    console.error('[Sync] upload failed', err);
    onStatusChange?.('error');
  }
}
