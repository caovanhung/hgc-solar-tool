import { Project } from '../types/solar';

const API_BASE = '/api';

export async function fetchProjectsFromServer(): Promise<Project[] | null> {
  try {
    const res = await fetch(`${API_BASE}/projects`);
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : null;
  } catch (err) {
    console.warn('[API] Could not fetch projects from server, using local cache:', err);
    return null;
  }
}

export async function saveProjectToServer(project: Project): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    return res.ok;
  } catch (err) {
    console.warn('[API] Failed to save project to server:', err);
    return false;
  }
}

export async function deleteProjectFromServer(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('[API] Failed to delete project on server:', err);
    return false;
  }
}
