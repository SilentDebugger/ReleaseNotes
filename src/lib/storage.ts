import { ReleaseDraft, ReleaseItem } from './types';

const STORAGE_PREFIX = 'release-notes:';
const DRAFTS_KEY = `${STORAGE_PREFIX}drafts`;

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Get all stored drafts
 */
export function getAllDrafts(): ReleaseDraft[] {
  if (!isBrowser) return [];
  
  try {
    const data = localStorage.getItem(DRAFTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    console.error('Failed to load drafts from localStorage');
    return [];
  }
}

/**
 * Get a specific draft by owner/repo/version
 */
export function getDraft(owner: string, repo: string, version?: string): ReleaseDraft | null {
  const drafts = getAllDrafts();
  return drafts.find(d => 
    d.owner === owner && 
    d.repo === repo && 
    (version ? d.version === version : true)
  ) || null;
}

/**
 * Get all drafts for a specific repository
 */
export function getRepoDrafts(owner: string, repo: string): ReleaseDraft[] {
  const drafts = getAllDrafts();
  return drafts.filter(d => d.owner === owner && d.repo === repo);
}

/**
 * Save or update a draft
 */
export function saveDraft(draft: ReleaseDraft): void {
  if (!isBrowser) return;
  
  try {
    const drafts = getAllDrafts();
    const existingIndex = drafts.findIndex(d => d.id === draft.id);
    
    const updatedDraft = {
      ...draft,
      updatedAt: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
      drafts[existingIndex] = updatedDraft;
    } else {
      drafts.push(updatedDraft);
    }
    
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch (error) {
    console.error('Failed to save draft to localStorage:', error);
  }
}

/**
 * Delete a draft
 */
export function deleteDraft(draftId: string): void {
  if (!isBrowser) return;
  
  try {
    const drafts = getAllDrafts();
    const filtered = drafts.filter(d => d.id !== draftId);
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete draft from localStorage:', error);
  }
}

/**
 * Create a new draft
 */
export function createDraft(owner: string, repo: string, version: string = ''): ReleaseDraft {
  const now = new Date().toISOString();
  const draft: ReleaseDraft = {
    id: `${owner}/${repo}/${version || 'new'}-${Date.now()}`,
    owner,
    repo,
    version,
    title: '',
    description: '',
    filter: null,
    items: [],
    createdAt: now,
    updatedAt: now,
  };
  
  saveDraft(draft);
  return draft;
}

/**
 * Update items in a draft
 */
export function updateDraftItems(draftId: string, items: ReleaseItem[]): void {
  const drafts = getAllDrafts();
  const draft = drafts.find(d => d.id === draftId);
  
  if (draft) {
    draft.items = items;
    saveDraft(draft);
  }
}

/**
 * Update a single item's note or included status
 */
export function updateDraftItem(
  draftId: string, 
  itemId: string, 
  updates: Partial<Pick<ReleaseItem, 'note' | 'included'>>
): void {
  const drafts = getAllDrafts();
  const draft = drafts.find(d => d.id === draftId);
  
  if (draft) {
    const item = draft.items.find(i => i.id === itemId);
    if (item) {
      Object.assign(item, updates);
      saveDraft(draft);
    }
  }
}

/**
 * Clear all stored data
 */
export function clearAllData(): void {
  if (!isBrowser) return;
  
  try {
    // Remove all keys with our prefix
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
}

/**
 * Generate unique ID for items
 */
export function generateItemId(type: 'pr' | 'issue' | 'commit', id: number | string): string {
  return `${type}-${id}`;
}

