import { Project, MaterialItem } from '../types/solar';

const API_BASE = '/api';

function getAuthHeaders(userEmail?: string, userRole?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (userEmail) headers['x-user-email'] = userEmail;
  if (userRole) headers['x-user-role'] = userRole;
  return headers;
}

export async function fetchProjectsFromServer(userEmail?: string, userRole?: string): Promise<Project[] | null> {
  try {
    const res = await fetch(`${API_BASE}/projects`, {
      headers: getAuthHeaders(userEmail, userRole),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : null;
  } catch (err) {
    console.warn('[API] Could not fetch projects from server, using local cache:', err);
    return null;
  }
}

export async function saveProjectToServer(project: Project, userEmail?: string, userRole?: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/projects/${project.id}`, {
      method: 'PUT',
      headers: getAuthHeaders(userEmail, userRole),
      body: JSON.stringify(project),
    });
    return res.ok;
  } catch (err) {
    console.warn('[API] Failed to save project to server:', err);
    return false;
  }
}

export async function deleteProjectFromServer(id: string, userEmail?: string, userRole?: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(userEmail, userRole),
    });
    return res.ok;
  } catch (err) {
    console.warn('[API] Failed to delete project on server:', err);
    return false;
  }
}

export async function fetchMaterialsFromServer(): Promise<MaterialItem[] | null> {
  try {
    const res = await fetch(`${API_BASE}/materials`);
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
      body: JSON.stringify(material),
    });
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
      body: JSON.stringify(materials),
    });
    return res.ok;
  } catch (err) {
    console.warn('[API] Failed to batch save materials to server:', err);
    return false;
  }
}

