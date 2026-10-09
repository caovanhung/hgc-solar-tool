import { Project, MaterialItem } from '../types/solar';

const API_BASE = '/api';

function handleResponseAuth(res: Response) {
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
  }
}

export async function fetchProjectsFromServer(): Promise<Project[] | null> {
  try {
    const res = await fetch(`${API_BASE}/projects`, {
      credentials: 'same-origin',
    });
    handleResponseAuth(res);
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
      credentials: 'same-origin',
      body: JSON.stringify(project),
    });
    handleResponseAuth(res);
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
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
    });
    handleResponseAuth(res);
    return res.ok;
  } catch (err) {
    console.warn('[API] Failed to delete project on server:', err);
    return false;
  }
}

export async function fetchMaterialsFromServer(): Promise<MaterialItem[] | null> {
  try {
    const res = await fetch(`${API_BASE}/materials`, {
      credentials: 'same-origin',
    });
    handleResponseAuth(res);
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : null;
  } catch (err) {
    console.warn('[API] Could not fetch materials from server:', err);
    return null;
  }
}

export async function saveMaterialToServer(material: MaterialItem): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/materials/${material.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(material),
    });
    handleResponseAuth(res);
    return res.ok;
  } catch (err) {
    console.warn('[API] Failed to save material to server:', err);
    return false;
  }
}

export async function saveMaterialsBatchToServer(materials: MaterialItem[]): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/materials/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(materials),
    });
    handleResponseAuth(res);
    return res.ok;
  } catch (err) {
    console.warn('[API] Failed to batch save materials to server:', err);
    return false;
  }
}
