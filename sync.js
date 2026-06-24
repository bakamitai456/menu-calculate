// sync.js — Google Sheets sync engine
const EPOCH = '1970-01-01T00:00:00.000Z';

const SyncEngine = {
  _timer: null,
  _interval: 10_000,
  _syncing: false,
  _conflictPending: false,

  start() {
    if (this._timer) return;
    this.syncOnce();
    this._timer = setInterval(() => this.syncOnce(), this._interval);
  },

  stop() {
    clearInterval(this._timer);
    this._timer = null;
  },

  async syncOnce() {
    const url = Storage.getSyncUrl();
    if (!url || this._syncing || this._conflictPending) return;
    this._syncing = true;
    this._setStatus('syncing');
    try {
      const remote = await this._fetchRemote(url);
      const local = this._buildLocalPayload();

      if (!remote || !remote.version) {
        await this._pushRemote(url, local);
        Storage.setLastSyncAt(new Date().toISOString());
        this._setStatus('idle');
        return;
      }

      const { merged, conflicts } = this._merge(local, remote);

      if (conflicts.length > 0) {
        this._conflictPending = true;
        this._setStatus('conflict');
        ConflictUI.show(conflicts, merged, async (resolvedMerged) => {
          this._applyMerged(resolvedMerged);
          try {
            await this._pushRemote(url, this._buildLocalPayload());
            Storage.setLastSyncAt(new Date().toISOString());
          } catch (e) {
            console.error('[SyncEngine] push after conflict resolution failed', e);
          }
          this._conflictPending = false;
          this._setStatus('idle');
          window._syncRefresh?.();
        });
        return;
      }

      this._applyMerged(merged);
      await this._pushRemote(url, this._buildLocalPayload());
      Storage.setLastSyncAt(new Date().toISOString());
      this._setStatus('idle');
      window._syncRefresh?.();
    } catch (err) {
      console.error('[SyncEngine]', err);
      this._setStatus('error');
    } finally {
      this._syncing = false;
    }
  },

  async _fetchRemote(url) {
    const resp = await fetch(url, { cache: 'no-store' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();
    if (!text || text === '{}') return null;
    return JSON.parse(text);
  },

  async _pushRemote(url, payload) {
    // Apps Script 302-redirects all requests; browsers convert POST→GET on redirect,
    // so doPost never receives the body. Use GET + query param instead.
    const data = encodeURIComponent(JSON.stringify(payload));
    const resp = await fetch(`${url}?action=write&data=${data}`, { cache: 'no-store' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  },

  _buildLocalPayload() {
    return {
      version: 1,
      ingredients:    Storage.getIngredients(),
      fixedCostItems: Storage.getFixedCosts(),
      menus:          Storage.getMenus(),
      tombstones:     Storage.getTombstones(),
    };
  },

  _merge(local, remote) {
    const lastSyncAt = Storage.getLastSyncAt();
    const conflicts = [];

    // Build unified tombstone map: id → newest deletedAt
    const tombstoneMap = {};
    for (const s of [...(local.tombstones || []), ...(remote.tombstones || [])]) {
      if (!tombstoneMap[s.id] || s.deletedAt > tombstoneMap[s.id]) {
        tombstoneMap[s.id] = s.deletedAt;
      }
    }

    const mergeList = (localList, remoteList, type) => {
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
          result.push(localItem); // tentative; user will decide
        } else if (localTs >= remoteTs) {
          result.push(localItem);
        } else {
          result.push(remoteItem);
        }
      }
      return result;
    };

    // Merge tombstones (deduplicate by id, keep newest deletedAt)
    const tombstoneById = {};
    for (const s of [...(local.tombstones || []), ...(remote.tombstones || [])]) {
      if (!tombstoneById[s.id] || s.deletedAt > tombstoneById[s.id].deletedAt) {
        tombstoneById[s.id] = s;
      }
    }

    const merged = {
      version:        1,
      ingredients:    mergeList(local.ingredients,    remote.ingredients,    'ingredient'),
      fixedCostItems: mergeList(local.fixedCostItems, remote.fixedCostItems, 'fixedCost'),
      menus:          mergeList(local.menus,           remote.menus,          'menu'),
      tombstones:     Object.values(tombstoneById),
    };

    return { merged, conflicts };
  },

  _applyMerged(merged) {
    Storage._saveList(KEYS.ingredients, merged.ingredients);
    Storage._saveList(KEYS.fixedCosts,  merged.fixedCostItems);
    Storage._saveList(KEYS.menus,       merged.menus);
    Storage._saveList(KEYS.tombstones,  merged.tombstones);
  },

  _setStatus(status) {
    const el = document.getElementById('syncStatus');
    if (!el) return;
    el.dataset.status = status;
    const labels = { idle: 'Synced', syncing: 'Syncing...', conflict: 'Conflict', error: 'Error' };
    el.querySelector('.sync-status-text').textContent = labels[status] || status;
  },
};

// ---------------------------------------------------------------------------

const ConflictUI = {
  _queue:     [],
  _resolved:  [],
  _merged:    null,
  _doneCb:    null,

  show(conflicts, mergedObj, doneCb) {
    this._queue    = [...conflicts];
    this._resolved = [];
    this._merged   = mergedObj;
    this._doneCb   = doneCb;
    this._showNext();
  },

  _showNext() {
    if (this._queue.length === 0) {
      document.getElementById('conflictModal').classList.remove('open');
      this._doneCb(this._merged);
      return;
    }
    const total   = this._resolved.length + this._queue.length;
    const current = this._resolved.length + 1;
    const conflict = this._queue.shift();

    document.getElementById('conflictCounter').textContent =
      `Conflict ${current} of ${total}`;
    document.getElementById('conflictLocal').textContent  =
      this._format(conflict.localItem,  conflict.type);
    document.getElementById('conflictRemote').textContent =
      this._format(conflict.remoteItem, conflict.type);
    document.getElementById('conflictModal').classList.add('open');

    document.getElementById('conflictKeepLocal').onclick = () => {
      this._applyDecision(conflict, 'local');
      this._showNext();
    };
    document.getElementById('conflictKeepRemote').onclick = () => {
      this._applyDecision(conflict, 'remote');
      this._showNext();
    };
  },

  _applyDecision(conflict, side) {
    const winner = side === 'local' ? conflict.localItem : conflict.remoteItem;
    const listKey = conflict.type === 'ingredient' ? 'ingredients'
                  : conflict.type === 'fixedCost'  ? 'fixedCostItems'
                  : 'menus';
    const list = this._merged[listKey];
    const idx  = list.findIndex(x => x.id === winner.id);
    if (idx >= 0) list[idx] = winner; else list.push(winner);
    this._resolved.push({ type: conflict.type, id: winner.id, side });
  },

  _format(item, type) {
    const { id, updatedAt, ...rest } = item;
    const lines = [`Changed: ${new Date(updatedAt || EPOCH).toLocaleString()}`];
    for (const [k, v] of Object.entries(rest)) {
      if (Array.isArray(v)) lines.push(`${k}: [${v.length} items]`);
      else lines.push(`${k}: ${v}`);
    }
    return lines.join('\n');
  },
};
