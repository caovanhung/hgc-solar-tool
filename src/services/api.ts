import { Project } from '../types/solar';

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
