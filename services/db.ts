import { get, set, del, keys, update } from 'idb-keyval';
import { BoardSession } from '../types';

const STORE_PREFIX = 'board_session_';

export async function saveSessionToDb(session: BoardSession): Promise<void> {
  const key = STORE_PREFIX + session.id;
  await set(key, session);
}

export async function getSessionFromDb(id: string): Promise<BoardSession | undefined> {
  const key = STORE_PREFIX + id;
  return await get(key);
}

export async function deleteSessionFromDb(id: string): Promise<void> {
  const key = STORE_PREFIX + id;
  await del(key);
}

export async function getAllSessionsFromDb(): Promise<BoardSession[]> {
  const allKeys = await keys();
  const sessionKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith(STORE_PREFIX));
  
  const sessions: BoardSession[] = [];
  for (const key of sessionKeys) {
    const session = await get(key);
    if (session) {
      sessions.push(session as BoardSession);
    }
  }
  
  // Sort descending by updatedAt
  return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
}
