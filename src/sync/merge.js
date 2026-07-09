const EPOCH = '1970-01-01T00:00:00.000Z';

function mergeList(localList, remoteList, type, tombstoneMap, lastSyncAt, conflicts) {
  const allIds = [...new Set([
    ...(localList || []).map(x => x.id),
    ...(remoteList || []).map(x => x.id),
  ])];
  const result = [];

  for (const id of allIds) {
    const localItem  = (localList  || []).find(x => x.id === id);
    const remoteItem = (remoteList || []).find(x => x.id === id);
    const localTs    = localItem?.updatedAt  || EPOCH;
    const remoteTs   = remoteItem?.updatedAt || EPOCH;

    // Tombstone wins unless item was re-created after deletion
    if (tombstoneMap[id]) {
      const deletedAt = tombstoneMap[id];
      if (deletedAt >= localTs && deletedAt >= remoteTs) continue;
    }

    if (!localItem)  { result.push(remoteItem); continue; }
    if (!remoteItem) { result.push(localItem);  continue; }

    const localChanged  = localTs  > lastSyncAt;
    const remoteChanged = remoteTs > lastSyncAt;

    if (localChanged && remoteChanged && localTs !== remoteTs) {
      conflicts.push({ type, localItem, remoteItem });
      result.push(localItem); // tentative; caller resolves
    } else if (localTs >= remoteTs) {
      result.push(localItem);
    } else {
      result.push(remoteItem);
    }
  }
  return result;
}

export function merge(local, remote, lastSyncAt) {
  const conflicts = [];

  // Build unified tombstone map: id → newest deletedAt
  const tombstoneMap = {};
  for (const s of [...(local.tombstones || []), ...(remote.tombstones || [])]) {
    if (!tombstoneMap[s.id] || s.deletedAt > tombstoneMap[s.id]) {
      tombstoneMap[s.id] = s.deletedAt;
    }
  }

  const ingredients    = mergeList(local.ingredients,    remote.ingredients,    'ingredient', tombstoneMap, lastSyncAt, conflicts);
  const fixedCostItems = mergeList(local.fixedCostItems, remote.fixedCostItems, 'fixedCost',  tombstoneMap, lastSyncAt, conflicts);
  const menus          = mergeList(local.menus,          remote.menus,          'menu',       tombstoneMap, lastSyncAt, conflicts);

  // Merge tombstones (deduplicate by id, keep newest deletedAt)
  const tombstoneById = {};
  for (const s of [...(local.tombstones || []), ...(remote.tombstones || [])]) {
    if (!tombstoneById[s.id] || s.deletedAt > tombstoneById[s.id].deletedAt) {
      tombstoneById[s.id] = s;
    }
  }

  const merged = {
    version: 1,
    ingredients,
    fixedCostItems,
    menus,
    tombstones: Object.values(tombstoneById),
  };

  return { merged, conflicts };
}
