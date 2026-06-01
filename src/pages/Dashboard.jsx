import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, ExternalLink, Calendar, Folder, X, AlertCircle, UploadCloud } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { saveProject, fetchProjects, deleteProject } from '../services/projectService';

const Dashboard = ({ currentUser, onOpenProject }) => {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  // Formularios y Referencias
  const [newProjectName, setNewProjectName] = useState('');
  const [generatedId, setGeneratedId] = useState('');
  const [deleteConfirmationId, setDeleteConfirmationId] = useState('');
  const [error, setError] = useState('');
  
  // Referencia oculta para el input de archivos
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadProjects();
  }, [currentUser]);

  const loadProjects = async () => {
    setLoading(true);
    const data = await fetchProjects();
    setProjects(data);
    setLoading(false);
  };

  const openCreateModal = () => {
    setNewProjectName('');
    setGeneratedId(`proj_${crypto.randomUUID().substring(0, 8)}`);
    setError('');
    setShowCreateModal(true);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const newProject = {
      id: generatedId,
      name: newProjectName,
      sheets: [{ id: 'sheet_1', name: t('page_name', { index: 1 }), elements: [], connections: [] }]
    };

    await saveProject(newProject);
    setShowCreateModal(false);
    loadProjects();
  };

  // --- MOTOR DE IMPORTACIÓN DE JSON ---
  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);

        // Validación básica de seguridad
        if (!importedData.sheets || !Array.isArray(importedData.sheets)) {
          throw new Error(t('import_error', { message: 'Invalid Connectid file format.' }));
        }

        const newProject = {
          ...importedData,
          id: `proj_${crypto.randomUUID().substring(0, 8)}`,
          name: `${importedData.name || t('default_project_name')} ${t('imported_label')}`
        };

        await saveProject(newProject);
        loadProjects(); // Recargamos la grilla
      } catch (err) {
        alert(t('import_error', { message: err.message }));
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Resetea el input para poder subir el mismo archivo dos veces seguidas
  };

  const openDeleteModal = (project) => {
    setProjectToDelete(project);
    setDeleteConfirmationId('');
    setError('');
    setShowDeleteModal(true);
  };

  const handleDeleteProject = async (e) => {
    e.preventDefault();
    if (deleteConfirmationId !== projectToDelete.id) {
      setError(t('id_not_match'));
      return;
    }
    await deleteProject(projectToDelete.id);
    setShowDeleteModal(false);
    setProjectToDelete(null);
    loadProjects();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <main className="flex-1 p-6 sm:p-8 relative overflow-hidden flex flex-col">
      <div className={`absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none transition-colors duration-700 -z-10 ${
        isDarkMode 
          ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950' 
          : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-slate-50'
      }`}></div>

      {/* Input de archivos invisible */}
      <input 
        type="file" 
        accept=".json" 
        ref={fileInputRef} 
        onChange={handleImportJSON} 
        className="hidden" 
      />

      <div className="max-w-7xl w-full mx-auto flex flex-col flex-1">
        
        <div className="mb-8">
          <h2 className="text-3xl font-black tracking-tight mb-2">{t('topbar_projects')}</h2>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {currentUser ? t('synced_as', { email: currentUser.email }) : t('local_mode_message')}
          </p>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            
            {/* Tarjeta de Crear */}
            <button 
              onClick={openCreateModal}
              className={`h-48 flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed transition-all cursor-pointer group hover:scale-[1.02] ${
                isDarkMode 
                  ? 'border-slate-800 bg-slate-900/40 hover:border-blue-500 hover:bg-slate-900/60' 
                  : 'border-slate-300 bg-white/50 hover:border-blue-500 hover:bg-white'
              }`}
            >
              <div className={`p-4 rounded-2xl transition-colors ${
                isDarkMode ? 'bg-slate-800 group-hover:bg-blue-500/20 text-slate-400 group-hover:text-blue-400' : 'bg-slate-100 group-hover:bg-blue-50 text-slate-500 group-hover:text-blue-500'
              }`}>
                <Plus size={28} className="transition-transform group-hover:rotate-90" />
              </div>
              <span className={`text-sm font-bold tracking-wide ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {t('create_project_card')}
              </span>
            </button>

            {/* Tarjeta de Importar */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={`h-48 flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed transition-all cursor-pointer group hover:scale-[1.02] ${
                isDarkMode 
                  ? 'border-slate-800 bg-slate-900/40 hover:border-emerald-500 hover:bg-slate-900/60' 
                  : 'border-slate-300 bg-white/50 hover:border-emerald-500 hover:bg-white'
              }`}
            >
              <div className={`p-4 rounded-2xl transition-colors ${
                isDarkMode ? 'bg-slate-800 group-hover:bg-emerald-500/20 text-slate-400 group-hover:text-emerald-400' : 'bg-slate-100 group-hover:bg-emerald-50 text-slate-500 group-hover:text-emerald-500'
              }`}>
                <UploadCloud size={28} className="transition-transform group-hover:-translate-y-1" />
              </div>
              <span className={`text-sm font-bold tracking-wide ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {t('import_backup_card')}
              </span>
            </button>

            {/* Tarjetas de Proyectos Existentes */}
            {projects.map(project => (
              <div 
                key={project.id}
                onClick={() => onOpenProject && onOpenProject(project)}
                className={`h-48 rounded-3xl border flex flex-col overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 relative group cursor-pointer ${
                  isDarkMode 
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:shadow-black/50' 
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-blue-900/5'
                }`}
              >
                <div className="flex-1 p-5 flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-slate-800 text-blue-400' : 'bg-blue-50 text-blue-500'}`}>
                      <Folder size={20} />
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); openDeleteModal(project); }}
                      className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-red-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <h3 className="font-bold text-lg truncate mt-2">{project.name}</h3>
                  <p className={`text-xs mt-1 font-mono truncate ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    {t('project_card_id', { id: project.id })}
                  </p>
                </div>
                
                <div className={`px-5 py-3 border-t text-xs flex justify-between items-center ${
                  isDarkMode ? 'border-slate-800 bg-slate-900/50 text-slate-400' : 'border-slate-100 bg-slate-50/50 text-slate-500'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    <span>{formatDate(project.updatedAt)}</span>
                  </div>
                  <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modales existentes de Crear/Borrar (Igual que antes)... */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-md p-6 rounded-3xl shadow-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{t('create_project_modal_title')}</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-full hover:bg-slate-500/10"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 opacity-70">{t('project_name_label')}</label>
                <input type="text" autoFocus required placeholder={t('project_name_placeholder')} value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} className={`w-full px-4 py-3 rounded-xl outline-none border focus:ring-2 focus:ring-blue-500 transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 opacity-70">{t('project_id_label')}</label>
                <input type="text" disabled value={generatedId} className={`w-full px-4 py-3 rounded-xl outline-none border font-mono text-sm opacity-60 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
              </div>
              <button type="submit" className="w-full mt-2 py-3 px-4 font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-all shadow-md active:scale-95">{t('create_and_open')}</button>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className={`w-full max-w-md p-6 rounded-3xl shadow-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4"><AlertCircle size={24} /></div>
              <h3 className="text-xl font-bold mb-2">{t('delete_project_confirm_title')}</h3>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{t('delete_project_confirm_desc')}</p>
            </div>
            {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-500 text-xs font-bold text-center">{error}</div>}
            <form onSubmit={handleDeleteProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 opacity-70">{t('confirm_project_id_label')} <span className="font-mono text-red-500 font-bold select-all bg-red-500/10 px-1 py-0.5 rounded">{projectToDelete.id}</span></label>
                <input type="text" required value={deleteConfirmationId} onChange={(e) => setDeleteConfirmationId(e.target.value)} className={`w-full px-4 py-3 rounded-xl outline-none border focus:ring-2 focus:ring-red-500 transition-all font-mono ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowDeleteModal(false)} className={`flex-1 py-3 px-4 font-bold rounded-xl transition-all ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'}`}>{t('cancel')}</button>
                <button type="submit" className="flex-1 py-3 px-4 font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all shadow-md active:scale-95">{t('delete')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Dashboard;