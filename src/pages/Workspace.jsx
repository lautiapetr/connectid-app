import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Save, Plus, MousePointer, 
  Square, Circle, Layers, Play, Trash2, X, FileText,
  ZoomIn, ZoomOut, Maximize, Type, Undo, Redo, Download, Image as ImageIcon, FileJson, Upload
} from 'lucide-react';
import * as htmlToImage from 'html-to-image'; 
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '../context/NavigationContext';
import { saveProject } from '../services/projectService';
import PropertiesPanel from '../components/workspace/PropertiesPanel';
import NotesPanel from '../components/workspace/NotesPanel';

const MODES = { EDIT: 'EDIT', CONNECT: 'CONNECT' };
const SHAPE_TYPES = { RECTANGLE: 'RECTANGLE', CIRCLE: 'CIRCLE', CAPSULE: 'CAPSULE', TEXT: 'TEXT' };

const getRectangleSnapPoint = (mx, my, rx, ry, rw, rh) => {
  const cx = Math.max(rx, Math.min(mx, rx + rw)), cy = Math.max(ry, Math.min(my, ry + rh));
  const dl = Math.abs(mx - rx), dr = Math.abs(mx - (rx + rw)), dt = Math.abs(my - ry), db = Math.abs(my - (ry + rh));
  const minDist = Math.min(dl, dr, dt, db);
  if (minDist === dl) return { x: rx, y: cy }; if (minDist === dr) return { x: rx + rw, y: cy };
  if (minDist === dt) return { x: cx, y: ry }; return { x: cx, y: ry + rh };
};
const getEllipseSnapPoint = (mx, my, rx, ry, rw, rh) => {
  const cx = rx + rw / 2, cy = ry + rh / 2, dx = (mx - cx) / (rw / 2), dy = (my - cy) / (rh / 2);
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return { x: cx + rw / 2, y: cy };
  return { x: cx + (dx / dist) * (rw / 2), y: cy + (dy / dist) * (rh / 2) };
};
const getCapsuleSnapPoint = (mx, my, rx, ry, rw, rh) => {
  if (rw >= rh) {
    const r = rh / 2;
    if (mx < rx + r) return getEllipseSnapPoint(mx, my, rx, ry, rh, rh);
    if (mx > rx + rw - r) return getEllipseSnapPoint(mx, my, rx + rw - rh, ry, rh, rh);
    return getRectangleSnapPoint(mx, my, rx, ry, rw, rh);
  } else {
    const r = rw / 2;
    if (my < ry + r) return getEllipseSnapPoint(mx, my, rx, ry, rw, rw);
    if (my > ry + rh - r) return getEllipseSnapPoint(mx, my, rx, ry + rh - rw, rw, rw);
    return getRectangleSnapPoint(mx, my, rx, ry, rw, rh);
  }
};
const getShapeSnapPoint = (mx, my, element) => {
  switch (element.type) {
    case SHAPE_TYPES.RECTANGLE: return getRectangleSnapPoint(mx, my, element.x, element.y, element.width, element.height);
    case SHAPE_TYPES.CIRCLE: return getEllipseSnapPoint(mx, my, element.x, element.y, element.width, element.height);
    case SHAPE_TYPES.CAPSULE: return getCapsuleSnapPoint(mx, my, element.x, element.y, element.width, element.height);
    case SHAPE_TYPES.TEXT: return { x: element.x + element.width / 2, y: element.y + element.height / 2 };
    default: return { x: element.x, y: element.y };
  }
};

const Workspace = ({ project, onBackToDashboard }) => {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();

  const [currentProject, setCurrentProject] = useState(project);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [interactionMode, setInteractionMode] = useState(MODES.EDIT);
  const [showNotes, setShowNotes] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const [history, setHistory] = useState([JSON.parse(JSON.stringify(project.sheets))]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [clipboard, setClipboard] = useState(null);
  
  const [selectedElementIds, setSelectedElementIds] = useState([]);
  const [selectedConnectionIds, setSelectedConnectionIds] = useState([]);
  const [selectionBox, setSelectionBox] = useState(null);

  const [dragStartPos, setDragStartPos] = useState(null);
  const [initialDragElements, setInitialDragElements] = useState([]); 
  
  const [draggingControlPointId, setDraggingControlPointId] = useState(null);
  const [draggingTerminal, setDraggingTerminal] = useState(null);
  const [snapPoint, setSnapPoint] = useState(null);
  const [activeConnectionStart, setActiveConnectionStart] = useState(null);
  const [currentMousePos, setCurrentMousePos] = useState({ x: 0, y: 0 });

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null); // Ref para importar backup

  const currentSheet = currentProject.sheets[currentSheetIndex] || currentProject.sheets[0];

  const getScreenToWorld = (clientX, clientY) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: (clientX - rect.left - pan.x) / zoom, y: (clientY - rect.top - pan.y) / zoom };
  };

  const triggerAutoSave = async (updatedProj, pushToHistory = true) => {
    setCurrentProject(updatedProj);
    await saveProject(updatedProj);
    if (pushToHistory) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(updatedProj.sheets)));
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const updatedProj = { ...currentProject, sheets: JSON.parse(JSON.stringify(history[newIndex])) };
      setCurrentProject(updatedProj); saveProject(updatedProj); 
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const updatedProj = { ...currentProject, sheets: JSON.parse(JSON.stringify(history[newIndex])) };
      setCurrentProject(updatedProj); saveProject(updatedProj);
    }
  };

  const handleExportPNG = async () => {
    setShowExportMenu(false);
    if (!canvasRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(canvasRef.current, {
        backgroundColor: isDarkMode ? '#020617' : '#f8fafc',
        pixelRatio: 2, 
      });
      const link = document.createElement('a');
      link.download = `${currentProject.name.replace(/\s+/g, '_')}_Connectid.png`;
      link.href = dataUrl; 
      link.click();
    } catch (err) {
      console.error("Error al exportar PNG:", err); alert(t('export_png_error'));
    }
  };

  const handleExportJSON = () => {
    setShowExportMenu(false);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentProject, null, 2));
    const link = document.createElement('a');
    link.href = dataStr; link.download = `${currentProject.name.replace(/\s+/g, '_')}_Backup.json`; link.click();
  };

  // --- MOTOR DE IMPORTACIÓN EN EL WORKSPACE ---
  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (!importedData.sheets || !Array.isArray(importedData.sheets)) {
          throw new Error("Formato inválido.");
        }
        
        const confirm = window.confirm("¿Deseas SOBREESCRIBIR tu lienzo actual con este archivo de copia de seguridad?");
        if (!confirm) {
          e.target.value = null;
          return;
        }

        // Mantenemos el ID actual para no crear un proyecto nuevo, solo pisamos las hojas
        const updatedProj = { ...currentProject, sheets: importedData.sheets };
        setCurrentSheetIndex(0);
        setSelectedElementIds([]);
        setSelectedConnectionIds([]);
        triggerAutoSave(updatedProj);
        setShowExportMenu(false);
      } catch (err) {
        alert(t('import_error', { message: err.message }));
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reset
  };

  const handleCopy = () => {
    if (selectedElementIds.length === 0) return;
    const elementsToCopy = currentSheet.elements.filter(el => selectedElementIds.includes(el.id));
    const connectionsToCopy = currentSheet.connections.filter(c => selectedElementIds.includes(c.fromId) && selectedElementIds.includes(c.toId));
    setClipboard({ elements: elementsToCopy, connections: connectionsToCopy });
  };

  const handlePaste = () => {
    if (!clipboard || clipboard.elements.length === 0) return;
    const newElements = []; const newConnections = []; const idMap = {}; 
    clipboard.elements.forEach(el => {
      const newId = `elem_${crypto.randomUUID().substring(0, 6)}`;
      idMap[el.id] = newId; newElements.push({ ...el, id: newId, x: el.x + 30, y: el.y + 30 }); 
    });
    clipboard.connections.forEach(c => {
      const newId = `conn_${crypto.randomUUID().substring(0, 6)}`;
      newConnections.push({ ...c, id: newId, fromId: idMap[c.fromId], toId: idMap[c.toId] });
    });
    const updatedSheets = [...currentProject.sheets];
    updatedSheets[currentSheetIndex].elements.push(...newElements);
    updatedSheets[currentSheetIndex].connections.push(...newConnections);
    setSelectedElementIds(newElements.map(e => e.id)); setSelectedConnectionIds(newConnections.map(c => c.id));
    triggerAutoSave({ ...currentProject, sheets: updatedSheets });
  };

  const handleWheel = (e) => {
    const scaleAdjust = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(zoom * scaleAdjust, 5));
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left, mouseY = e.clientY - rect.top;
    setZoom(newZoom);
    setPan({ x: mouseX - (mouseX - pan.x) * (newZoom / zoom), y: mouseY - (mouseY - pan.y) * (newZoom / zoom) });
  };
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const handleUpdateElementProperties = (updates) => {
    if (selectedElementIds.length === 0) return;
    const updatedSheets = [...currentProject.sheets];
    const elements = updatedSheets[currentSheetIndex].elements;
    selectedElementIds.forEach(id => {
      const targetIndex = elements.findIndex(el => el.id === id);
      if (targetIndex !== -1) {
        const el = elements[targetIndex];
        elements[targetIndex] = { ...el, ...updates, styles: { ...el.styles, ...(updates.styles || {}) } };
      }
    });
    triggerAutoSave({ ...currentProject, sheets: updatedSheets });
  };

  const handleUpdateConnectionProperties = (updates) => {
    if (selectedConnectionIds.length === 0) return;
    const updatedSheets = [...currentProject.sheets];
    const connections = updatedSheets[currentSheetIndex].connections;
    selectedConnectionIds.forEach(id => {
      const targetIndex = connections.findIndex(conn => conn.id === id);
      if (targetIndex !== -1) connections[targetIndex] = { ...connections[targetIndex], ...updates };
    });
    triggerAutoSave({ ...currentProject, sheets: updatedSheets });
  };

  const handleAddSheet = () => {
    const newSheet = { id: `sheet_${crypto.randomUUID().substring(0, 6)}`, name: t('page_name', { index: currentProject.sheets.length + 1 }), elements: [], connections: [] };
    triggerAutoSave({ ...currentProject, sheets: [...currentProject.sheets, newSheet] });
    setCurrentSheetIndex(currentProject.sheets.length); resetView();
  };

  const handleDeleteSheet = (e, sheetId) => {
    e.stopPropagation();
    if (currentProject.sheets.length <= 1) { alert(t('must_have_at_least_one_page')); return; }
    if (!window.confirm(t('confirm_delete_page'))) return;
    const updatedSheets = currentProject.sheets.filter(s => s.id !== sheetId);
    const deletedIndex = currentProject.sheets.findIndex(s => s.id === sheetId);
    if (currentSheetIndex >= updatedSheets.length) setCurrentSheetIndex(updatedSheets.length - 1);
    else if (currentSheetIndex <= deletedIndex) setCurrentSheetIndex(Math.max(0, currentSheetIndex - 1));
    triggerAutoSave({ ...currentProject, sheets: updatedSheets });
  };

  const handleAddElement = (type) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const isText = type === SHAPE_TYPES.TEXT;
    const centerX = (-pan.x + rect.width / 2) / zoom - (isText ? 100 : 70);
    const centerY = (-pan.y + rect.height / 2) / zoom - (isText ? 25 : 35);
    const newElement = {
      id: `elem_${crypto.randomUUID().substring(0, 6)}`, type, x: centerX, y: centerY,
      width: type === SHAPE_TYPES.CIRCLE ? 110 : (isText ? 200 : 140), height: type === SHAPE_TYPES.CIRCLE ? 110 : (isText ? 50 : 70),
      text: isText ? 'Escribe aquí...' : 'Doble click', 
      borderRadius: type === SHAPE_TYPES.CIRCLE ? '100%' : type === SHAPE_TYPES.CAPSULE ? '9999px' : '16px',
      styles: { fill: isText ? 'transparent' : (isDarkMode ? '#1e293b' : '#ffffff'), stroke: isText ? 'transparent' : '#3b82f6', strokeWidth: isText ? 0 : 2, textColor: isDarkMode ? '#f8fafc' : '#0f172a', fontSize: isText ? 18 : 14, fontFamily: 'Inter', isBold: false, isItalic: false }
    };
    const updatedSheets = [...currentProject.sheets];
    updatedSheets[currentSheetIndex].elements.push(newElement);
    setSelectedElementIds([newElement.id]);
    triggerAutoSave({ ...currentProject, sheets: updatedSheets });
  };

  const handleCanvasMouseDown = (e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault(); setIsPanning(true); setLastPanPos({ x: e.clientX, y: e.clientY }); return;
    }
    if (e.target === canvasRef.current || e.target.tagName === 'svg') {
      const worldPos = getScreenToWorld(e.clientX, e.clientY);
      if (interactionMode === MODES.EDIT) {
        setSelectionBox({ startX: worldPos.x, startY: worldPos.y, currentX: worldPos.x, currentY: worldPos.y });
        setCurrentMousePos(worldPos);
      }
      setSelectedElementIds([]); setSelectedConnectionIds([]);
    }
  };

  const handleElementMouseDown = (e, element) => {
    if (e.button === 1) return;
    e.stopPropagation();
    const worldPos = getScreenToWorld(e.clientX, e.clientY);

    if (interactionMode === MODES.EDIT) {
      let currentSelection = selectedElementIds;
      if (!selectedElementIds.includes(element.id)) {
        currentSelection = [element.id];
        setSelectedElementIds(currentSelection);
      }
      setSelectedConnectionIds([]);
      setDragStartPos(worldPos);
      setInitialDragElements(currentSheet.elements.filter(el => currentSelection.includes(el.id)).map(el => ({ id: el.id, x: el.x, y: el.y })));
    } 
    else if (interactionMode === MODES.CONNECT && snapPoint && element.type !== SHAPE_TYPES.TEXT) {
      const relX = (snapPoint.x - element.x) / element.width, relY = (snapPoint.y - element.y) / element.height;
      if (!activeConnectionStart) {
        setActiveConnectionStart({ elementId: element.id, relX, relY, absX: snapPoint.x, absY: snapPoint.y });
        setCurrentMousePos(worldPos);
      } else if (activeConnectionStart.elementId !== element.id) {
        const newConnection = {
          id: `conn_${crypto.randomUUID().substring(0, 6)}`, fromId: activeConnectionStart.elementId, toId: element.id,
          fromPoint: { x: activeConnectionStart.relX, y: activeConnectionStart.relY }, toPoint: { x: relX, y: relY },
          controlPointOffset: { dx: 0, dy: 0 }, color: '#3b82f6', width: 2.5
        };
        const updatedSheets = [...currentProject.sheets];
        updatedSheets[currentSheetIndex].connections.push(newConnection);
        setActiveConnectionStart(null);
        triggerAutoSave({ ...currentProject, sheets: updatedSheets });
      }
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (isPanning) {
      setPan(prev => ({ x: prev.x + (e.clientX - lastPanPos.x), y: prev.y + (e.clientY - lastPanPos.y) }));
      setLastPanPos({ x: e.clientX, y: e.clientY }); return;
    }

    const worldPos = getScreenToWorld(e.clientX, e.clientY);
    
    if (activeConnectionStart || selectionBox) setCurrentMousePos(worldPos);

    if (selectionBox && interactionMode === MODES.EDIT) {
      setSelectionBox(prev => ({ ...prev, currentX: worldPos.x, currentY: worldPos.y }));
      const minX = Math.min(selectionBox.startX, worldPos.x), maxX = Math.max(selectionBox.startX, worldPos.x);
      const minY = Math.min(selectionBox.startY, worldPos.y), maxY = Math.max(selectionBox.startY, worldPos.y);
      const newSelection = currentSheet.elements.filter(el => el.x < maxX && el.x + el.width > minX && el.y < maxY && el.y + el.height > minY).map(el => el.id);
      setSelectedElementIds(newSelection);
      return;
    }

    if (dragStartPos && initialDragElements.length > 0 && interactionMode === MODES.EDIT) {
      const deltaX = worldPos.x - dragStartPos.x, deltaY = worldPos.y - dragStartPos.y;
      const updatedSheets = [...currentProject.sheets];
      const elements = updatedSheets[currentSheetIndex].elements;
      initialDragElements.forEach(initial => {
        const targetIndex = elements.findIndex(el => el.id === initial.id);
        if (targetIndex !== -1) { elements[targetIndex].x = initial.x + deltaX; elements[targetIndex].y = initial.y + deltaY; }
      });
      setCurrentProject({ ...currentProject, sheets: updatedSheets });
      return;
    }

    if (draggingControlPointId && interactionMode === MODES.EDIT) {
      const updatedSheets = [...currentProject.sheets];
      const conn = updatedSheets[currentSheetIndex].connections.find(c => c.id === draggingControlPointId);
      const fromElem = updatedSheets[currentSheetIndex].elements.find(el => el.id === conn.fromId);
      const toElem = updatedSheets[currentSheetIndex].elements.find(el => el.id === conn.toId);
      if (fromElem && toElem) {
        const fp = conn.fromPoint || { x: 0.5, y: 0.5 }, tp = conn.toPoint || { x: 0.5, y: 0.5 };
        const pFrom = { x: fromElem.x + fp.x * fromElem.width, y: fromElem.y + fp.y * fromElem.height };
        const pTo = { x: toElem.x + tp.x * toElem.width, y: toElem.y + tp.y * toElem.height };
        conn.controlPointOffset = { dx: worldPos.x - (pFrom.x + pTo.x) / 2, dy: worldPos.y - (pFrom.y + pTo.y) / 2 };
        setCurrentProject({ ...currentProject, sheets: updatedSheets });
      }
      return;
    }

    if (draggingTerminal && interactionMode === MODES.EDIT) {
      const updatedSheets = [...currentProject.sheets];
      const conn = updatedSheets[currentSheetIndex].connections.find(c => c.id === draggingTerminal.id);
      const targetElem = updatedSheets[currentSheetIndex].elements.find(el => el.id === (draggingTerminal.type === 'from' ? conn.fromId : conn.toId));
      if (targetElem) {
        const snap = getShapeSnapPoint(worldPos.x, worldPos.y, targetElem);
        const relX = (snap.x - targetElem.x) / targetElem.width, relY = (snap.y - targetElem.y) / targetElem.height;
        if (draggingTerminal.type === 'from') conn.fromPoint = { x: relX, y: relY };
        else conn.toPoint = { x: relX, y: relY };
        setCurrentProject({ ...currentProject, sheets: updatedSheets });
      }
      return;
    }

    if (interactionMode === MODES.CONNECT) {
      let foundElement = null;
      for (let i = currentSheet.elements.length - 1; i >= 0; i--) {
        const el = currentSheet.elements[i];
        if (el.type === SHAPE_TYPES.TEXT) continue; 
        if (worldPos.x >= el.x - 20 && worldPos.x <= el.x + el.width + 20 && worldPos.y >= el.y - 20 && worldPos.y <= el.y + el.height + 20) {
          foundElement = el; break;
        }
      }
      if (foundElement) {
        const point = getShapeSnapPoint(worldPos.x, worldPos.y, foundElement);
        if (!snapPoint || snapPoint.elementId !== foundElement.id) {
            setSnapPoint({ x: point.x, y: point.y, elementId: foundElement.id });
        } else {
            setSnapPoint(prev => ({ ...prev, x: point.x, y: point.y }));
        }
      } else {
        if (snapPoint !== null) setSnapPoint(null);
      }
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    if (selectionBox) setSelectionBox(null);
    if (dragStartPos || draggingControlPointId || draggingTerminal) {
      setDragStartPos(null); setInitialDragElements([]); setDraggingControlPointId(null); setDraggingTerminal(null);
      triggerAutoSave(currentProject);
    }
  };

  const handleTextDoubleClick = (e, elementId) => {
    e.stopPropagation();
    if (interactionMode !== MODES.EDIT) return;
    const el = currentSheet.elements.find(el => el.id === elementId);
    const newText = prompt("Edita el texto:", el.text);
    if (newText === null) return;
    const updatedSheets = [...currentProject.sheets];
    const targetIndex = updatedSheets[currentSheetIndex].elements.findIndex(e => e.id === elementId);
    if (targetIndex !== -1) {
      updatedSheets[currentSheetIndex].elements[targetIndex].text = newText || ' ';
      triggerAutoSave({ ...currentProject, sheets: updatedSheets });
    }
  };

  const handleDeleteSelected = () => {
    const updatedSheets = [...currentProject.sheets];
    if (selectedElementIds.length > 0) {
      updatedSheets[currentSheetIndex].elements = currentSheet.elements.filter(el => !selectedElementIds.includes(el.id));
      updatedSheets[currentSheetIndex].connections = currentSheet.connections.filter(conn => !selectedElementIds.includes(conn.fromId) && !selectedElementIds.includes(conn.toId));
      setSelectedElementIds([]);
    } else if (selectedConnectionIds.length > 0) {
      updatedSheets[currentSheetIndex].connections = currentSheet.connections.filter(conn => !selectedConnectionIds.includes(conn.id));
      setSelectedConnectionIds([]);
    }
    triggerAutoSave({ ...currentProject, sheets: updatedSheets });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInput = document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA';
      if (isInput) return;

      if (e.key === 'Delete' || e.key === 'Backspace') handleDeleteSelected();

      if (e.ctrlKey || e.metaKey) {
        switch(e.key.toLowerCase()) {
          case 'z': e.preventDefault(); if (e.shiftKey) handleRedo(); else handleUndo(); break;
          case 'y': e.preventDefault(); handleRedo(); break;
          case 'c': e.preventDefault(); handleCopy(); break;
          case 'v': e.preventDefault(); handlePaste(); break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementIds, selectedConnectionIds, currentProject, currentSheetIndex, history, historyIndex, clipboard]);

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden select-none ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`} onContextMenu={(e) => { e.preventDefault(); setActiveConnectionStart(null); }}>
      
      {/* Input de archivo oculto para importar JSON */}
      <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportJSON} className="hidden" />

      {/* BARRA SUPERIOR */}
      <div className={`h-14 flex items-center justify-between px-6 border-b shrink-0 z-30 relative ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBackToDashboard} className={`p-2 rounded-xl transition-colors cursor-pointer ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}><ArrowLeft size={18} /></button>
          
          <div className="flex items-center gap-1 border-r pr-4 mr-1 border-slate-200 dark:border-slate-700">
            <button onClick={handleUndo} disabled={historyIndex <= 0} className={`p-1.5 rounded-lg transition-colors ${historyIndex <= 0 ? 'opacity-30 cursor-not-allowed' : isDarkMode ? 'hover:bg-slate-800 cursor-pointer' : 'hover:bg-slate-100 cursor-pointer'}`} title={t('undo')}><Undo size={16} /></button>
            <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className={`p-1.5 rounded-lg transition-colors ${historyIndex >= history.length - 1 ? 'opacity-30 cursor-not-allowed' : isDarkMode ? 'hover:bg-slate-800 cursor-pointer' : 'hover:bg-slate-100 cursor-pointer'}`} title={t('redo')}><Redo size={16} /></button>
          </div>

          <div><h3 className="font-extrabold text-sm truncate max-w-xs">{currentProject.name}</h3><span className="text-[10px] font-mono opacity-50 block">{t('project_card_id', { id: currentProject.id })}</span></div>
        </div>
        
        <div className={`flex items-center p-1 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
          <button onClick={() => { setInteractionMode(MODES.EDIT); setActiveConnectionStart(null); setSnapPoint(null); }} className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${interactionMode === MODES.EDIT ? 'bg-blue-500 text-white shadow-md' : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}><MousePointer size={14} /><span>{t('edit_mode')}</span></button>
          <button onClick={() => { setInteractionMode(MODES.CONNECT); setSelectedElementIds([]); }} className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${interactionMode === MODES.CONNECT ? 'bg-blue-500 text-white shadow-md' : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}><Play size={14} className="rotate-90" /><span>{t('connect_mode')}</span></button>
        </div>
        
        <div className="flex items-center gap-2 relative">
          <button onClick={() => setShowNotes(!showNotes)} className={`p-2 rounded-xl transition-colors cursor-pointer ${showNotes ? 'bg-blue-500/20 text-blue-500' : isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`} title={t('project_notes')}><FileText size={18} /></button>
          {(selectedElementIds.length > 0 || selectedConnectionIds.length > 0) && <button onClick={handleDeleteSelected} className="p-2 rounded-xl transition-colors text-red-500 hover:bg-red-500/10 cursor-pointer"><Trash2 size={18} /></button>}
          
          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)} className={`p-2 rounded-xl transition-colors cursor-pointer ${showExportMenu ? 'bg-blue-500/20 text-blue-500' : isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`} title={t('export_options')}>
              <Download size={18} />
            </button>
            <AnimatePresence>
              {showExportMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.15 }}
                  className={`absolute right-0 top-full mt-2 w-56 rounded-xl shadow-2xl border flex flex-col p-1 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                >
                  <button onClick={handleExportPNG} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-left transition-colors cursor-pointer ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}><ImageIcon size={14} className="text-blue-500" /> {t('export_png')}</button>
                  <div className="w-full h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
                  <button onClick={handleExportJSON} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-left transition-colors cursor-pointer ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}><FileJson size={14} className="text-amber-500" /> {t('download_backup')}</button>
                  <button onClick={() => fileInputRef.current?.click()} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-left transition-colors cursor-pointer ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}><Upload size={14} className="text-emerald-500" /> {t('restore_backup')}</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={() => triggerAutoSave(currentProject)} className={`p-2 rounded-xl transition-colors cursor-pointer ${isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`} title={t('save')}><Save size={18} /></button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative" onClick={() => setShowExportMenu(false)}>
        
        <AnimatePresence>
          {interactionMode === MODES.EDIT && (
            <motion.div 
              initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
              className={`absolute top-6 left-6 z-20 flex flex-col gap-2 p-2 rounded-2xl shadow-xl border ${isDarkMode ? 'bg-slate-900/90 border-slate-800 backdrop-blur-md' : 'bg-white/90 border-slate-200 backdrop-blur-md'}`}
            >
              <button onClick={() => handleAddElement(SHAPE_TYPES.RECTANGLE)} className={`p-3 rounded-xl transition-all hover:scale-105 cursor-pointer ${isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`} title={t('add_rectangle')}><Square size={20} /></button>
              <button onClick={() => handleAddElement(SHAPE_TYPES.CIRCLE)} className={`p-3 rounded-xl transition-all hover:scale-105 cursor-pointer ${isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`} title={t('add_circle')}><Circle size={20} /></button>
              <button onClick={() => handleAddElement(SHAPE_TYPES.CAPSULE)} className={`p-3 py-4 rounded-xl transition-all hover:scale-105 cursor-pointer flex items-center justify-center ${isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`} title={t('add_capsule')}><div className="w-5 h-2.5 border-2 border-current rounded-full"></div></button>
              <div className="w-full h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
              <button onClick={() => handleAddElement(SHAPE_TYPES.TEXT)} className={`p-3 rounded-xl transition-all hover:scale-105 cursor-pointer text-blue-500 hover:bg-blue-500/10`} title={t('add_text')}><Type size={20} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`absolute bottom-6 left-6 z-20 flex items-center gap-1 p-1 rounded-xl shadow-lg border ${isDarkMode ? 'bg-slate-900/90 border-slate-800 backdrop-blur-md' : 'bg-white/90 border-slate-200 backdrop-blur-md'}`}>
          <button onClick={() => setZoom(z => Math.max(0.1, z - 0.2))} className={`p-2 rounded-lg hover:bg-slate-500/20 cursor-pointer`}><ZoomOut size={16} /></button>
          <button onClick={resetView} className={`px-2 py-1 text-xs font-bold font-mono hover:bg-slate-500/20 rounded-lg cursor-pointer`} title={t('reset_view')}>{Math.round(zoom * 100)}%</button>
          <button onClick={() => setZoom(z => Math.min(5, z + 0.2))} className={`p-2 rounded-lg hover:bg-slate-500/20 cursor-pointer`}><ZoomIn size={16} /></button>
          <div className="w-px h-6 bg-slate-500/30 mx-1"></div>
          <button onClick={resetView} className={`p-2 rounded-lg hover:bg-slate-500/20 cursor-pointer`} title={t('center_origin')}><Maximize size={16} /></button>
        </div>

        <div 
          ref={canvasRef} 
          onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp} onWheel={handleWheel}
          className={`flex-1 h-full overflow-hidden relative ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`} 
          style={{ 
            cursor: isPanning ? 'grabbing' : dragStartPos || draggingControlPointId || draggingTerminal ? 'grabbing' : 'default',
            backgroundPosition: `${pan.x}px ${pan.y}px`, backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
            backgroundImage: `radial-gradient(${isDarkMode ? '#334155' : '#cbd5e1'} ${1 * zoom}px, transparent ${1 * zoom}px)`
          }}
        >
          <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            
            <svg className="w-full h-full absolute inset-0 pointer-events-none z-0 overflow-visible">
              <defs>
                <marker id="arrow-selected" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" /></marker>
                {currentSheet.connections && currentSheet.connections.map(conn => (
                  <marker key={`marker-${conn.id}`} id={`arrow-${conn.id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1 L 10 5 L 0 9 z" fill={conn.color || '#3b82f6'} /></marker>
                ))}
              </defs>

              {selectionBox && (
                <rect x={Math.min(selectionBox.startX, selectionBox.currentX)} y={Math.min(selectionBox.startY, selectionBox.currentY)} width={Math.abs(selectionBox.currentX - selectionBox.startX)} height={Math.abs(selectionBox.currentY - selectionBox.startY)} fill="rgba(59, 130, 246, 0.15)" stroke="#3b82f6" strokeWidth={1.5 / zoom} strokeDasharray={`${5/zoom},${5/zoom}`} />
              )}

              {currentSheet.connections && currentSheet.connections.map(conn => {
                const fromElem = currentSheet.elements.find(el => el.id === conn.fromId);
                const toElem = currentSheet.elements.find(el => el.id === conn.toId);
                if (!fromElem || !toElem) return null;

                const fp = conn.fromPoint || { x: 0.5, y: 0.5 }, tp = conn.toPoint || { x: 0.5, y: 0.5 };
                const pFrom = { x: fromElem.x + fp.x * fromElem.width, y: fromElem.y + fp.y * fromElem.height };
                const pTo = { x: toElem.x + tp.x * toElem.width, y: toElem.y + tp.y * toElem.height };
                const offset = conn.controlPointOffset || { dx: 0, dy: 0 };
                const cpX = (pFrom.x + pTo.x) / 2 + offset.dx, cpY = (pFrom.y + pTo.y) / 2 + offset.dy;
                const isSelected = selectedConnectionIds.includes(conn.id);

                return (
                  <g key={conn.id} className="pointer-events-auto">
                    <path d={`M ${pFrom.x} ${pFrom.y} Q ${cpX} ${cpY} ${pTo.x} ${pTo.y}`} fill="none" stroke="transparent" strokeWidth={15} className="cursor-pointer" onMouseDown={(e) => { e.stopPropagation(); setSelectedConnectionIds([conn.id]); setSelectedElementIds([]); setInteractionMode(MODES.EDIT); }} />
                    <path d={`M ${pFrom.x} ${pFrom.y} Q ${cpX} ${cpY} ${pTo.x} ${pTo.y}`} fill="none" stroke={isSelected ? '#ef4444' : conn.color || '#3b82f6'} strokeWidth={isSelected ? 3.5 : conn.width || 2.5} markerEnd={isSelected ? "url(#arrow-selected)" : `url(#arrow-${conn.id})`} className="pointer-events-none transition-colors duration-150" />
                    {isSelected && selectedConnectionIds.length === 1 && interactionMode === MODES.EDIT && (
                      <>
                        <circle cx={pFrom.x} cy={pFrom.y} r={6} fill="#ffffff" stroke="#ef4444" strokeWidth={2.5} className="cursor-move shadow-sm pointer-events-auto hover:scale-125 transition-transform origin-center" style={{ transformBox: 'fill-box' }} onMouseDown={(e) => { e.stopPropagation(); setDraggingTerminal({ id: conn.id, type: 'from' }); }} />
                        <circle cx={cpX} cy={cpY} r={7} fill="#ffffff" stroke="#ef4444" strokeWidth={3} className="cursor-move shadow-lg pointer-events-auto hover:scale-110 transition-transform origin-center" style={{ transformBox: 'fill-box' }} onMouseDown={(e) => { e.stopPropagation(); setDraggingControlPointId(conn.id); }} />
                        <circle cx={pTo.x} cy={pTo.y} r={6} fill="#ffffff" stroke="#ef4444" strokeWidth={2.5} className="cursor-move shadow-sm pointer-events-auto hover:scale-125 transition-transform origin-center" style={{ transformBox: 'fill-box' }} onMouseDown={(e) => { e.stopPropagation(); setDraggingTerminal({ id: conn.id, type: 'to' }); }} />
                      </>
                    )}
                  </g>
                );
              })}
              {activeConnectionStart && (
                <path d={`M ${activeConnectionStart.absX} ${activeConnectionStart.absY} Q ${(activeConnectionStart.absX + currentMousePos.x)/2} ${(activeConnectionStart.absY + currentMousePos.y)/2} ${currentMousePos.x} ${currentMousePos.y}`} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeDasharray="6,4" className="pointer-events-none" />
              )}
            </svg>

            {currentSheet.elements.map(elem => {
              const isSelected = selectedElementIds.includes(elem.id);
              const isOnlySelected = isSelected && selectedElementIds.length === 1;
              const isText = elem.type === SHAPE_TYPES.TEXT;

              return (
                <div
                  key={elem.id}
                  onMouseDown={(e) => handleElementMouseDown(e, elem)}
                  onDoubleClick={(e) => handleTextDoubleClick(e, elem.id)}
                  className={`absolute flex items-center justify-center px-4 py-2 transition-shadow duration-200 select-none z-10 pointer-events-auto ${
                    interactionMode === MODES.EDIT ? 'cursor-grab active:cursor-grabbing' : (isText ? 'cursor-default' : 'cursor-crosshair')
                  }`}
                  style={{
                    left: elem.x, top: elem.y, width: elem.width, height: elem.height,
                    backgroundColor: elem.styles.fill, borderStyle: isSelected && isText ? 'dashed' : 'solid',
                    borderColor: isSelected && interactionMode === MODES.EDIT ? '#3b82f6' : (isText ? 'transparent' : elem.styles.stroke),
                    borderWidth: isSelected && interactionMode === MODES.EDIT && isText ? '2px' : `${elem.styles.strokeWidth}px`,
                    borderRadius: elem.borderRadius, color: elem.styles.textColor, fontSize: `${elem.styles.fontSize}px`, 
                    fontFamily: elem.styles.fontFamily, fontStyle: elem.styles.isItalic ? 'italic' : 'normal', fontWeight: elem.styles.isBold ? 'bold' : 'normal',
                    boxShadow: isSelected && interactionMode === MODES.EDIT && !isText ? '0 0 15px rgba(59, 130, 246, 0.4)' : (!isText && isDarkMode ? '0 4px 12px rgba(0,0,0,0.3)' : (!isText ? '0 4px 12px rgba(0,0,0,0.05)' : 'none')),
                  }}
                >
                  <span className="text-center w-full break-words select-none leading-tight pointer-events-none">{elem.text}</span>
                  {isOnlySelected && interactionMode === MODES.EDIT && (
                    <div 
                      className="absolute bottom-1.5 right-1.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white cursor-se-resize shadow-md pointer-events-auto"
                      onMouseDown={(e) => {
                        e.stopPropagation(); e.preventDefault();
                        const startWidth = elem.width, startHeight = elem.height, startX = e.clientX, startY = e.clientY;
                        const handleResizeMove = (moveEvent) => {
                          const updatedSheets = [...currentProject.sheets];
                          const el = updatedSheets[currentSheetIndex].elements.find(item => item.id === elem.id);
                          if (el) {
                            el.width = Math.max(60, startWidth + (moveEvent.clientX - startX) / zoom);
                            el.height = Math.max(40, startHeight + (moveEvent.clientY - startY) / zoom);
                            setCurrentProject({ ...currentProject, sheets: updatedSheets });
                          }
                        };
                        const handleResizeUp = () => { window.removeEventListener('mousemove', handleResizeMove); window.removeEventListener('mouseup', handleResizeUp); triggerAutoSave(currentProject); };
                        window.addEventListener('mousemove', handleResizeMove); window.addEventListener('mouseup', handleResizeUp);
                      }}
                    />
                  )}
                </div>
              );
            })}
            {interactionMode === MODES.CONNECT && snapPoint && (
              <div className="absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full pointer-events-none shadow-[0_0_10px_rgba(59,130,246,0.6)] animate-pulse z-30" style={{ left: snapPoint.x - 8, top: snapPoint.y - 8 }} />
            )}
          </div>
        </div>

        <AnimatePresence>
          {(selectedElementIds.length > 0 || selectedConnectionIds.length > 0) && (
            <PropertiesPanel 
              selectedElements={currentSheet.elements.filter(el => selectedElementIds.includes(el.id))}
              selectedConnections={currentSheet.connections.filter(conn => selectedConnectionIds.includes(conn.id))}
              onUpdateElement={handleUpdateElementProperties}
              onUpdateConnection={handleUpdateConnectionProperties}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showNotes && (
            <NotesPanel notes={currentProject.notes} onUpdateNotes={(newNotes) => triggerAutoSave({ ...currentProject, notes: newNotes })} onClose={() => setShowNotes(false)} />
          )}
        </AnimatePresence>
      </div>

      <div className={`h-14 flex items-center justify-between px-6 border-t shrink-0 z-30 relative ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-2 overflow-x-auto max-w-full">
          <div className="flex items-center gap-1"><Layers size={14} className="opacity-60 mr-1" /><span className="text-xs font-bold opacity-60 mr-2">{t('pages_label')}</span></div>
          {currentProject.sheets.map((sheet, index) => (
            <div 
              key={sheet.id} 
              className={`flex items-center gap-2 pl-4 pr-2 py-1.5 rounded-xl transition-all cursor-pointer group ${currentSheetIndex === index ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : isDarkMode ? 'bg-slate-800/40 text-slate-400 hover:bg-slate-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              onClick={() => { setSelectedElementIds([]); setSelectedConnectionIds([]); setCurrentSheetIndex(index); resetView(); }}
            >
              <span className="text-xs font-bold">{sheet.name}</span>
              {currentProject.sheets.length > 1 && (
                <button onClick={(e) => handleDeleteSheet(e, sheet.id)} className={`p-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-all ${isDarkMode ? 'hover:bg-slate-700 hover:text-red-400' : 'hover:bg-slate-300 hover:text-red-500'}`} title={t('delete_page')}><X size={12} /></button>
              )}
            </div>
          ))}
          <button onClick={handleAddSheet} className={`p-1.5 rounded-lg border border-dashed transition-all cursor-pointer ${isDarkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-400' : 'border-slate-300 hover:bg-slate-100 text-slate-600'}`} title={t('add_page')}><Plus size={14} /></button>
        </div>
      </div>
    </div>
  );
};

export default Workspace;