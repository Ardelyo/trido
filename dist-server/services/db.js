import { get, set, del, keys } from 'idb-keyval';
const STORE_PREFIX = 'board_session_';
export async function saveSessionToDb(session) {
    const key = STORE_PREFIX + session.id;
    await set(key, session);
}
export async function getSessionFromDb(id) {
    const key = STORE_PREFIX + id;
    return await get(key);
}
export async function deleteSessionFromDb(id) {
    const key = STORE_PREFIX + id;
    await del(key);
}
export async function getAllSessionsFromDb() {
    const allKeys = await keys();
    const sessionKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith(STORE_PREFIX));
    const sessions = [];
    for (const key of sessionKeys) {
        const session = await get(key);
        if (session) {
            sessions.push(session);
        }
    }
    // Sort descending by updatedAt
    return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
}
