import { db, auth } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';

// ID de la aplicación requerida por la REGLA 1 de almacenamiento
const APP_ID = 'connectid-app';

/**
 * REGLA 1 - Strict Paths:
 * Retorna la referencia a la colección de proyectos privados del usuario.
 */
const getUserProjectsCollection = () => {
  const user = auth.currentUser;
  if (!user) return null;
  return collection(db, 'artifacts', APP_ID, 'users', user.uid, 'projects');
};

/**
 * Guarda o actualiza un proyecto.
 * REGLA 3: Funciona offline (localStorage) y sube a Firestore si hay sesión.
 */
export const saveProject = async (projectData) => {
  const user = auth.currentUser;
  const projectId = projectData.id || `proj_${crypto.randomUUID().substring(0, 8)}`;
  
  const payload = {
    ...projectData,
    id: projectId,
    updatedAt: new Date().toISOString(),
  };

  // 1. Guardado Local Inmediato
  const localProjects = JSON.parse(localStorage.getItem('connectid_local_projects') || '{}');
  localProjects[projectId] = payload;
  localStorage.setItem('connectid_local_projects', JSON.stringify(localProjects));

  // 2. Sincronización en la Nube
  if (user) {
    try {
      const projectDocRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'projects', projectId);
      await setDoc(projectDocRef, {
        ...payload,
        serverUpdatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Error guardando proyecto en Firestore:", error);
    }
  }

  return payload;
};

/**
 * REGLA 2 - No Complex Queries: Trae todos los documentos y los procesa en memoria.
 */
export const fetchProjects = async () => {
  const user = auth.currentUser;
  let projectsMap = {};

  // 1. Cargar caché local primero
  const localProjects = JSON.parse(localStorage.getItem('connectid_local_projects') || '{}');
  projectsMap = { ...localProjects };

  // 2. Si hay sesión, descargar de Firebase y fusionar
  if (user) {
    try {
      const projectsCol = getUserProjectsCollection();
      if (projectsCol) {
        const querySnapshot = await getDocs(projectsCol);
        querySnapshot.forEach((docSnap) => {
          const cloudProj = docSnap.data();
          const localProj = projectsMap[docSnap.id];
          
          // Se queda con la versión más reciente
          if (!localProj || new Date(cloudProj.updatedAt) > new Date(localProj.updatedAt)) {
            projectsMap[docSnap.id] = {
              ...cloudProj,
              serverUpdatedAt: null 
            };
          }
        });
        
        localStorage.setItem('connectid_local_projects', JSON.stringify(projectsMap));
      }
    } catch (error) {
      console.error("Error obteniendo proyectos de Firestore:", error);
    }
  }

  return Object.values(projectsMap).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
};

export const deleteProject = async (projectId) => {
  const user = auth.currentUser;

  // 1. Eliminar local
  const localProjects = JSON.parse(localStorage.getItem('connectid_local_projects') || '{}');
  delete localProjects[projectId];
  localStorage.setItem('connectid_local_projects', JSON.stringify(localProjects));

  // 2. Eliminar de Firestore
  if (user) {
    try {
      const projectDocRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'projects', projectId);
      await deleteDoc(projectDocRef);
    } catch (error) {
      console.error("Error eliminando proyecto de Firestore:", error);
    }
  }
};