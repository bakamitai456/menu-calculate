import { renderConflictSide, renderConflictCounter } from '../render/conflictModal.js';
import { upsertById } from '../records/listOps.js';

const LIST_KEY_BY_TYPE = { ingredient: 'ingredients', fixedCost: 'fixedCostItems', menu: 'menus' };

export function createConflictModalController({ modal, counter, localEl, remoteEl, keepLocalBtn, keepRemoteBtn }) {
  return function resolve(conflicts, mergedObj) {
    return new Promise(resolvePromise => {
      const queue = [...conflicts];
      const resolved = [];
      let merged = mergedObj;

      function applyDecision(conflict, side) {
        const winner = side === 'local' ? conflict.localItem : conflict.remoteItem;
        const listKey = LIST_KEY_BY_TYPE[conflict.type];
        merged = { ...merged, [listKey]: upsertById(merged[listKey], winner) };
        resolved.push({ type: conflict.type, id: winner.id, side });
      }

      function showNext() {
        if (queue.length === 0) {
          modal.classList.remove('open');
          resolvePromise(merged);
          return;
        }
        const total = resolved.length + queue.length;
        const current = resolved.length + 1;
        const conflict = queue.shift();

        counter.textContent = renderConflictCounter(current, total);
        localEl.textContent = renderConflictSide(conflict.localItem, conflict.type);
        remoteEl.textContent = renderConflictSide(conflict.remoteItem, conflict.type);
        modal.classList.add('open');

        keepLocalBtn.onclick = () => { applyDecision(conflict, 'local'); showNext(); };
        keepRemoteBtn.onclick = () => { applyDecision(conflict, 'remote'); showNext(); };
      }

      showNext();
    });
  };
}
