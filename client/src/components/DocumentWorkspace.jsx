import React, { useState, useEffect, useRef } from 'react';
import {
  FolderTree,
  FileText,
  Search,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  MessageSquare,
  Users,
  Shield,
  Save,
  ChevronLeft,
  ChevronRight,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Send,
  History,
  Info,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Sliders,
  Type,
  Highlighter,
  Palette,
  Minus,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Check,
  Calendar,
  Sparkles,
  Image as ImageIcon,
  Columns,
  Grid,
  FileCode,
  Layers,
  ArrowRight,
  Replace,
  X,
  Printer,
  FileDown,
  RotateCcw,
  Heading1,
  Heading2,
  Heading3,
  Indent,
  Outdent,
  HelpCircle,
  Eye,
  CheckSquare,
  Tag,
  Scissors,
  Copy,
  Clipboard,
  Paintbrush,
  Subscript,
  Superscript,
  BookOpen,
  Bookmark,
  Link as LinkIcon,
  Shapes,
  BarChart3,
  PaintBucket,
  Eraser,
  Share2,
  ChevronDown,
  Quote,
  Split,
  FileCheck,
  FilePlus,
  LayoutTemplate
} from 'lucide-react';
import { api } from '../api';

export default function DocumentWorkspace({
  documentId,
  initialSectionId,
  selectedStage,
  currentUser,
  users,
  onOpenMatrixModal,
  onOpenConsistencyModal
}) {
  const [doc, setDoc] = useState(null);
  const [sections, setSections] = useState([]);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, MY_TASKS, REVIEW, APPROVED
  const [navTab, setNavTab] = useState('HEADINGS'); // 'HEADINGS', 'PAGES', 'RESULTS'
  const [collapsedNavIds, setCollapsedNavIds] = useState(new Set());

  // Ribbon Navigation: 'HOME', 'INSERT', 'LAYOUT', 'REVIEW', 'VIEW'
  const [activeRibbonTab, setActiveRibbonTab] = useState('HOME');
  
  // Viewing Mode: 'FULL_DOCUMENT' (Pratinjau Dokumen Utuh) or 'SECTION_EDITOR' (Edit Per Sub-Bab)
  const [viewMode, setViewMode] = useState('FULL_DOCUMENT');

  // Panels Visibility
  const [showNavPane, setShowNavPane] = useState(true);
  const [showReviewPane, setShowReviewPane] = useState(false);
  const [rightTab, setRightTab] = useState('COMMENTS'); // COMMENTS, PERMISSIONS, LOGS

  // Comments & Logs
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [logs, setLogs] = useState([]);

  // Editor states
  const [editorHtml, setEditorHtml] = useState('');
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionCode, setSectionCode] = useState('');
  const [saveStatus, setSaveStatus] = useState('IDLE'); // IDLE, SAVING, SAVED, ERROR

  // Typography & Layout Settings ala Word
  const [fontFamily, setFontFamily] = useState('Bookman Old Style');
  const [fontSize, setFontSize] = useState('12pt');
  const [lineSpacing, setLineSpacing] = useState('1.45'); // 1.0, 1.15, 1.45 (Perbup), 1.5, 2.0
  const [firstLineIndent, setFirstLineIndent] = useState(false);
  const [paragraphSpacing, setParagraphSpacing] = useState('6pt'); // 0pt, 4pt, 6pt (Perbup), 10pt, 12pt
  const [documentAlignment, setDocumentAlignment] = useState('justify'); // 'justify', 'left', 'center', 'right'
  const [textColumns, setTextColumns] = useState(1); // 1 or 2

  // Document Page Setup & Design
  const [orientation, setOrientation] = useState('PORTRAIT'); // 'PORTRAIT' or 'LANDSCAPE'
  const [paperSize, setPaperSize] = useState('F4'); // Default Folio F4 (216x330mm) standard Permendagri 86
  const [tableFontSize, setTableFontSize] = useState('9pt'); // 9pt / 8.5pt / 10pt official table font size // 'A4', 'F4', 'LETTER'
  const [marginPreset, setMarginPreset] = useState('PERBUP'); // 'PERBUP', 'NORMAL', 'NARROW', 'WIDE'
  const [pageColor, setPageColor] = useState('#ffffff');
  const [pageBorder, setPageBorder] = useState('none'); // 'none', 'box', 'double', 'shadow', 'perbup'
  const [activeTheme, setActiveTheme] = useState('PERBUP'); // 'PERBUP', 'GOVERNMENT', 'MODERN', 'FORMAL'
  const [spacingBeforePt, setSpacingBeforePt] = useState(0);
  const [spacingAfterPt, setSpacingAfterPt] = useState(6);

  // Popover menus state
  const [showCasePicker, setShowCasePicker] = useState(false);
  const [showSpacingPicker, setShowSpacingPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showWatermarkPicker, setShowWatermarkPicker] = useState(false);
  const [showPageColorPicker, setShowPageColorPicker] = useState(false);
  const [showPageBorderPicker, setShowPageBorderPicker] = useState(false);
  const [showSymbolPicker, setShowSymbolPicker] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  
  // Active Centimeter Margins & Ruler State ala Microsoft Word
  const [marginCm, setMarginCm] = useState({
    left: 4.0,   // Perbup Cilacap standard (3.5cm for Bab II)
    top: 2.5,    // Atas 2.5 cm
    right: 2.5,  // Kanan 2.5 cm (2.1cm for Bab II)
    bottom: 2.5  // Bawah 2.5 cm
  });
  const [firstLineIndentCm, setFirstLineIndentCm] = useState(1.27); // Standar 1.27 cm (0.5 in)
  const [activeDrag, setActiveDrag] = useState(null); // 'FIRST_LINE', 'LEFT_MARGIN', 'RIGHT_MARGIN'
  const [dragTooltip, setDragTooltip] = useState('');
  const [dragGuidelineX, setDragGuidelineX] = useState(null);
  const [showPageSetupModal, setShowPageSetupModal] = useState(false);
  const rulerTrackRef = useRef(null);

  // Caption Modal State (Judul Resmi Tabel & Gambar)
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [captionLabel, setCaptionLabel] = useState('Tabel'); // 'Tabel', 'Gambar', 'Bagan', 'Peta', 'Grafik', 'Kustom'
  const [captionNumber, setCaptionNumber] = useState('2.1');
  const [captionTitle, setCaptionTitle] = useState('');
  const [captionPosition, setCaptionPosition] = useState('DI_ATAS'); // 'DI_ATAS' or 'DI_BAWAH'
  const [captionSource, setCaptionSource] = useState('Sumber : Bappeda Kabupaten Cilacap Tahun 2026 (data diolah)');
  const [includeTableWithCaption, setIncludeTableWithCaption] = useState(false);

  const [watermark, setWatermark] = useState(''); // '', 'DRAFT', 'RAHASIA', 'CONFIDENTIAL'
  const [showRuler, setShowRuler] = useState(true);
  const [showGridlines, setShowGridlines] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Stats
  const [stats, setStats] = useState({ words: 0, characters: 0, paragraphs: 0 });
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Find & Replace Floating Toolbar
  const [showFindReplace, setShowFindReplace] = useState(false);

  // Microsoft Word Desktop Direct Collaboration State (Pendekatan 1)
  const [showWordModal, setShowWordModal] = useState(false);
  const [wordSessionActive, setWordSessionActive] = useState(false);
  const [wordSyncLoading, setWordSyncLoading] = useState(false);
  const [wordLastSync, setWordLastSync] = useState(null);
  const [wordTargetSection, setWordTargetSection] = useState(null);
  const wordFileInputRef = useRef(null);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [findMatchesCount, setFindMatchesCount] = useState(0);

  // Table Inserter Grid Popover
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [tableHoverGrid, setTableHoverGrid] = useState({ r: 3, c: 4 });

  const editorRef = useRef(null);
  const fullDocEditorRef = useRef(null);
  const imageInputRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);
  const mainDeskRef = useRef(null);

  // Full Document Mode State (100% Identical to original Word template)
  const [fullDocHtml, setFullDocHtml] = useState('');
  const [isFullEditMode, setIsFullEditMode] = useState(false);

  // Load document
  const loadDocument = async () => {
    try {
      setLoading(true);
      const res = await api.getDocument(documentId);
      if (res.success) {
        setDoc(res.data);
        const t = res.data.title || '';
        if (t.includes('BAB I:')) setCaptionNumber('1.1');
        else if (t.includes('BAB II:')) setCaptionNumber('2.1');
        else if (t.includes('BAB III:')) setCaptionNumber('3.1');
        else if (t.includes('BAB IV:')) setCaptionNumber('4.1');
        else if (t.includes('BAB V:')) setCaptionNumber('5.1');
        else if (t.includes('BAB VI:')) setCaptionNumber('6.1');
        else if (t.includes('BAB VII:')) setCaptionNumber('7.1');
        const rawFullHtml = res.data.fullContentHtml || (res.data.sections ? res.data.sections.map(s => s.content).join('') : '');
        setFullDocHtml(rawFullHtml);
        const secs = res.data.sections || [];
        setSections(secs);

        if (secs.length > 0) {
          const requested = initialSectionId ? secs.find(s => s.id === initialSectionId) : null;
          const currentExists = secs.find(s => s.id === activeSectionId);
          if (requested) {
            selectSection(requested);
            setViewMode('SECTION_EDITOR');
          } else if (!currentExists) {
            const myFirst = secs.find(s => s.assignedUserIds.includes(currentUser.id));
            selectSection(myFirst || secs[0]);
          } else {
            selectSection(currentExists);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load document:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocument();
  }, [documentId, currentUser.id]);

  // Load activity logs
  const loadLogs = async () => {
    try {
      const res = await api.getLogs(documentId);
      if (res.success) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    }
  };

  useEffect(() => {
    if (showReviewPane && rightTab === 'LOGS') {
      loadLogs();
    }
  }, [showReviewPane, rightTab, documentId]);

  // Calculate detailed stats
  const calculateStats = (html) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const characters = text.length;
    const paras = tempDiv.querySelectorAll('p, h1, h2, h3, h4, blockquote').length || (text ? 1 : 0);
    setStats({ words, characters, paragraphs: paras });
  };

  // Select section handler
  const selectSection = (sec) => {
    setActiveSectionId(sec.id);
    setSectionTitle(sec.title);
    setSectionCode(sec.code || '');
    setEditorHtml(sec.content || '');
    setComments(sec.comments || []);
    setSaveStatus('IDLE');
    calculateStats(sec.content || '');

    // Synchronize section orientation and typography matching Word template
    const secOrient = (sec.orientation || 'portrait').toUpperCase();
    setOrientation(secOrient);
    if (sec.tableFontSize) {
      setTableFontSize(sec.tableFontSize);
    } else if (secOrient === 'LANDSCAPE') {
      setTableFontSize('8.5pt');
    } else {
      setTableFontSize('9pt');
    }

    const isBab2 = (doc?.title || '').includes('BAB II');
    if (isBab2) {
      setMarginCm({ left: 3.5, right: 2.1, top: 2.5, bottom: 2.5 });
    } else if (secOrient === 'LANDSCAPE') {
      setMarginCm({ left: 2.5, right: 2.5, top: 2.5, bottom: 2.5 });
    } else {
      setMarginCm({ left: 4.0, right: 2.5, top: 2.5, bottom: 2.5 });
    }

    if (editorRef.current) {
      editorRef.current.innerHTML = sec.content || '';
    }
  };

  const activeSection = sections.find(s => s.id === activeSectionId) || sections[0];

  // Synchronize editor DOM whenever section or viewMode changes
  useEffect(() => {
    if (viewMode === 'SECTION_EDITOR' && editorRef.current) {
      editorRef.current.innerHTML = activeSection?.content || '';
    }
  }, [viewMode, activeSectionId]);

  // Helper to find the next section with content if current is an empty header
  const getNextContentSection = () => {
    if (!activeSection) return null;
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    const currentIndex = sorted.findIndex(s => s.id === activeSection.id);
    if (currentIndex === -1) return null;
    return sorted.slice(currentIndex + 1).find(s => s.content && s.content.trim() !== '') || null;
  };

  const nextContentSection = getNextContentSection();

  // Editor typing handler with debounced auto-save
  const handleEditorInput = (e) => {
    const html = e.currentTarget.innerHTML;
    setEditorHtml(html);
    setSaveStatus('UNSAVED');
    calculateStats(html);

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      saveSectionContent(html, sectionTitle, sectionCode);
    }, 1500);
  };

  // Full Document auto-save handler (when editing full template in Word canvas)
  const handleFullDocInput = (e) => {
    const html = e.currentTarget.innerHTML;
    setFullDocHtml(html);
    setSaveStatus('UNSAVED');
    calculateStats(html);

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaveStatus('SAVING');
        const saveRes = await api.updateDocumentContent(documentId, html);
        if (saveRes.success) {
          setSaveStatus('SAVED');
          setTimeout(() => setSaveStatus('IDLE'), 2500);
        } else {
          setSaveStatus('ERROR');
        }
      } catch (err) {
        console.error('Full doc save error:', err);
        setSaveStatus('ERROR');
      }
    }, 1500);
  };

  // Navigation outline click: smooth scroll to heading in full document
  const handleNavClick = (sec) => {
    selectSection(sec);
    if (viewMode === 'FULL_DOCUMENT') {
      const cleanTitle = (sec.title || '').replace(/\t\d+$/, '').trim().toLowerCase();
      const headings = fullDocEditorRef.current?.querySelectorAll('h1, h2, h3, h4, h5, h6, strong, p');
      if (headings) {
        for (const h of headings) {
          const text = h.textContent.trim().toLowerCase();
          if (text.length > 3 && (text.includes(cleanTitle) || cleanTitle.includes(text))) {
            h.scrollIntoView({ behavior: 'smooth', block: 'center' });
            h.classList.add('bg-blue-100', 'transition', 'duration-500');
            setTimeout(() => h.classList.remove('bg-blue-100'), 1500);
            break;
          }
        }
      }
    }
  };


  // Microsoft Word Desktop Direct Collaboration Handlers (Pendekatan 1)
  const openWordCollaboration = (sec = null) => {
    const target = sec || activeSection;
    setWordTargetSection(target);
    setShowWordModal(true);
  };

  const handleLaunchWord = (sec = null) => {
    const target = sec || wordTargetSection || activeSection;
    if (!target) return;
    api.launchWordDesktop(target.id);
    setWordSessionActive(true);
    setWordLastSync(new Date().toLocaleTimeString('id-ID'));
  };

  const handleManualWordUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const target = wordTargetSection || activeSection;
    if (!target) return;

    try {
      setWordSyncLoading(true);
      const res = await api.reimportWordFile(target.id, file);
      if (res.success && res.data) {
        setSections(prev => prev.map(s => s.id === target.id ? { ...s, ...res.data } : s));
        if (target.id === activeSectionId) {
          setEditorHtml(res.data.content);
          if (editorRef.current) {
            editorRef.current.innerHTML = res.data.content;
          }
          if (res.data.orientation) {
            setOrientation(res.data.orientation.toUpperCase());
          }
        }
        setWordLastSync(new Date().toLocaleTimeString('id-ID'));
        alert('Naskah berhasil disinkronkan dari file Microsoft Word!');
        setShowWordModal(false);
      } else {
        alert('Gagal menyinkronkan: ' + (res.message || 'File tidak valid'));
      }
    } catch (err) {
      alert('Error mengunggah file Word: ' + err.message);
    } finally {
      setWordSyncLoading(false);
      e.target.value = '';
    }
  };

  const handleRefreshFromWord = async (sec = null) => {
    const target = sec || wordTargetSection || activeSection;
    if (!target) return;
    try {
      setWordSyncLoading(true);
      const res = await api.getSection(target.id);
      if (res.success && res.data) {
        setSections(prev => prev.map(s => s.id === target.id ? { ...s, ...res.data } : s));
        if (target.id === activeSectionId) {
          setEditorHtml(res.data.content);
          if (editorRef.current) {
            editorRef.current.innerHTML = res.data.content;
          }
          if (res.data.orientation) {
            setOrientation(res.data.orientation.toUpperCase());
          }
        }
        setWordLastSync(new Date().toLocaleTimeString('id-ID'));
      }
    } catch (err) {
      console.error('Refresh from Word error:', err);
    } finally {
      setWordSyncLoading(false);
    }
  };

  // Roman Chapter detector & Document type
  const getRomanChapter = () => {
    if (!doc?.title) return 'II';
    const m = doc.title.match(/BAB\s+([IVXLCDM\d]+)/i);
    return m ? m[1].toUpperCase() : 'II';
  };
  const isBab2Doc = (doc?.title || '').includes('BAB II');

  // Toggle Section Orientation between Portrait and Landscape
  const toggleSectionOrientation = async (targetVal, secToUpdate = null) => {
    const sec = secToUpdate || activeSection;
    const nextOrient = targetVal || (orientation === 'PORTRAIT' ? 'LANDSCAPE' : 'PORTRAIT');
    setOrientation(nextOrient);

    if (isBab2Doc) {
      setMarginCm({ left: 3.5, right: 2.1, top: 2.5, bottom: 2.5 });
    } else if (nextOrient === 'LANDSCAPE') {
      setMarginCm({ left: 2.5, right: 2.5, top: 2.5, bottom: 2.5 });
    } else {
      setMarginCm({ left: 4.0, right: 2.5, top: 2.5, bottom: 2.5 });
    }

    if (sec) {
      const lower = nextOrient.toLowerCase();
      setSections(prev => prev.map(s => s.id === sec.id ? { ...s, orientation: lower } : s));
      try {
        await api.updateSectionContent(sec.id, { orientation: lower });
      } catch (e) {
        console.error('Failed to save orientation:', e);
      }
    }
  };

  // AutoFit Table ala Microsoft Word: normalize width & eliminate overflow
  const handleAutoFitTables = async (targetSec = null) => {
    const targetCanvas = viewMode === 'FULL_DOCUMENT' ? fullDocEditorRef.current : editorRef.current;
    if (!targetCanvas) return;

    const tables = targetCanvas.querySelectorAll('table');
    if (tables.length === 0) {
      alert('Tidak ditemukan tabel dalam bagian ini.');
      return;
    }

    let modifiedCount = 0;
    tables.forEach(table => {
      modifiedCount++;
      table.removeAttribute('width');
      table.style.width = '100%';
      table.style.maxWidth = '100%';
      table.style.tableLayout = 'auto';
      table.style.borderCollapse = 'collapse';
      table.style.margin = '12pt 0';
      table.style.boxSizing = 'border-box';
      table.style.wordBreak = 'break-word';
      table.style.overflowWrap = 'anywhere';

      let maxCols = 0;
      table.querySelectorAll('tr').forEach(r => {
        const c = r.querySelectorAll('th, td').length;
        if (c > maxCols) maxCols = c;
      });

      if (maxCols >= 6 && orientation !== 'LANDSCAPE') {
        toggleSectionOrientation('LANDSCAPE');
      }

      table.querySelectorAll('th, td').forEach(cell => {
        cell.removeAttribute('width');
        cell.style.wordBreak = 'break-word';
        cell.style.overflowWrap = 'anywhere';
        cell.style.boxSizing = 'border-box';
        if (maxCols >= 10) {
          cell.style.fontSize = '8.5pt';
        } else if (maxCols >= 6) {
          cell.style.fontSize = '9pt';
        }
      });
    });

    if (viewMode === 'SECTION_EDITOR') {
      const updatedHtml = editorRef.current.innerHTML;
      setEditorHtml(updatedHtml);
      saveSectionContent(updatedHtml, sectionTitle, sectionCode);
    } else {
      handleFullDocInput({ currentTarget: targetCanvas });
    }

    alert(`AutoFit Selesai! Sebanyak ${modifiedCount} tabel telah disesuaikan agar pas dalam batas margin kertas Folio tanpa terpotong.`);
  };

  // Set Table Font Size ala Word (8pt, 8.5pt, 9pt, 10pt, 11pt)
  const handleSetTableFontSize = (sizePt) => {
    setTableFontSize(sizePt);
    const targetCanvas = viewMode === 'FULL_DOCUMENT' ? fullDocEditorRef.current : editorRef.current;
    if (!targetCanvas) return;

    const tables = targetCanvas.querySelectorAll('table');
    tables.forEach(table => {
      table.style.setProperty('--tbl-data-size', sizePt);
      table.querySelectorAll('td').forEach(td => {
        td.style.fontSize = sizePt;
      });
    });

    if (viewMode === 'SECTION_EDITOR') {
      const updatedHtml = editorRef.current.innerHTML;
      setEditorHtml(updatedHtml);
      saveSectionContent(updatedHtml, sectionTitle, sectionCode);
      if (activeSection) {
        api.updateSectionContent(activeSection.id, { tableFontSize: sizePt });
      }
    } else {
      handleFullDocInput({ currentTarget: targetCanvas });
    }
  };

  // Save Content
  const saveSectionContent = async (htmlToSave, titleToSave, codeToSave, orientToSave) => {
    if (!activeSection) return;
    try {
      setSaveStatus('SAVING');
      const res = await api.updateSectionContent(activeSection.id, {
        content: htmlToSave !== undefined ? htmlToSave : editorHtml,
        title: titleToSave !== undefined ? titleToSave : sectionTitle,
        code: codeToSave !== undefined ? codeToSave : sectionCode,
        orientation: (orientToSave || orientation).toLowerCase()
      });

      if (res.success) {
        setSaveStatus('SAVED');
        setSections(prev => prev.map(s => (s.id === activeSection.id ? { ...s, ...res.data } : s)));
        setTimeout(() => setSaveStatus('IDLE'), 2500);
      } else {
        setSaveStatus('ERROR');
      }
    } catch (err) {
      console.error('Save error:', err);
      setSaveStatus('ERROR');
    }
  };

  // Change Status
  const handleStatusChange = async (newStatus) => {
    if (!activeSection) return;
    try {
      const res = await api.updateSectionStatus(activeSection.id, newStatus);
      if (res.success) {
        setSections(prev => prev.map(s => (s.id === activeSection.id ? { ...s, ...res.data } : s)));
      }
    } catch (err) {
      alert('Gagal mengubah status: ' + err.message);
    }
  };

  // Lock Toggle
  const handleToggleLock = async () => {
    if (!activeSection || currentUser.role !== 'ADMIN') return;
    try {
      const res = await api.updateSectionPermissions(activeSection.id, {
        isLocked: !activeSection.isLocked
      });
      if (res.success) {
        setSections(prev => prev.map(s => (s.id === activeSection.id ? { ...s, ...res.data } : s)));
      }
    } catch (err) {
      alert('Gagal mengubah kunci: ' + err.message);
    }
  };

  // Toggle Assignee
  const handleToggleAssignee = async (userId) => {
    if (!activeSection || currentUser.role !== 'ADMIN') return;
    const currentList = activeSection.assignedUserIds || [];
    const nextList = currentList.includes(userId)
      ? currentList.filter(id => id !== userId)
      : [...currentList, userId];

    try {
      const res = await api.updateSectionPermissions(activeSection.id, {
        assignedUserIds: nextList
      });
      if (res.success) {
        setSections(prev => prev.map(s => (s.id === activeSection.id ? { ...s, ...res.data } : s)));
      }
    } catch (err) {
      alert('Gagal mengubah penugasan: ' + err.message);
    }
  };

  // Send Comment
  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !activeSection) return;

    try {
      const res = await api.addComment(activeSection.id, newComment);
      if (res.success) {
        const updated = [...comments, res.data];
        setComments(updated);
        setNewComment('');
        setSections(prev =>
          prev.map(s => (s.id === activeSection.id ? { ...s, comments: updated } : s))
        );
      }
    } catch (err) {
      alert('Gagal mengirim catatan: ' + err.message);
    }
  };

  // Word formatting helper
  const execCmd = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    const activeCanvas = viewMode === 'FULL_DOCUMENT' ? fullDocEditorRef.current : editorRef.current;
    if (activeCanvas) {
      activeCanvas.focus();
      if (viewMode === 'FULL_DOCUMENT') {
        handleFullDocInput({ currentTarget: activeCanvas });
      } else {
        handleEditorInput({ currentTarget: activeCanvas });
      }
    }
  };

  // Grow / Shrink Font
  const changeFontSizeStep = (delta) => {
    const currentPt = parseInt(fontSize) || 12;
    const nextPt = Math.max(8, Math.min(72, currentPt + delta));
    setFontSize(`${nextPt}pt`);
    execCmd('fontSize', nextPt > 18 ? '6' : nextPt > 14 ? '5' : nextPt > 12 ? '4' : '3');
  };

  // Change Case (Sentence, UPPERCASE, lowercase)
  const changeTextCase = (type) => {
    const selection = window.getSelection();
    if (!selection || !selection.toString()) return;
    const selectedText = selection.toString();
    let transformed = selectedText;

    if (type === 'UPPERCASE') transformed = selectedText.toUpperCase();
    if (type === 'LOWERCASE') transformed = selectedText.toLowerCase();
    if (type === 'CAPITALIZE') {
      transformed = selectedText.replace(/\b\w/g, l => l.toUpperCase());
    }
    execCmd('insertText', transformed);
  };

  // Insert Table ala Microsoft Word Grid
  const insertWordTable = (rows, cols) => {
    let thead = '<tr style="background-color: #f1f5f9;">';
    for (let c = 1; c <= cols; c++) {
      thead += `<th style="border: 1px solid #000; padding: 6px 8px; font-weight: bold; text-align: center;">Kolom ${c}</th>`;
    }
    thead += '</tr>';

    let tbody = '';
    for (let r = 1; r <= rows; r++) {
      tbody += '<tr>';
      for (let c = 1; c <= cols; c++) {
        tbody += `<td style="border: 1px solid #000; padding: 5px 8px;">Data ${r}.${c}</td>`;
      }
      tbody += '</tr>';
    }

    const tableHtml = `
      <table border="1" style="width: 100%; border-collapse: collapse; margin: 14pt 0; font-size: 10.5pt;">
        <thead>${thead}</thead>
        <tbody>${tbody}</tbody>
      </table>
      <p></p>
    `;
    execCmd('insertHTML', tableHtml);
    setShowTablePicker(false);
  };

  // Insert Image from computer
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const base64 = loadEvt.target.result;
      const imgHtml = `<img src="${base64}" alt="${file.name}" style="max-width: 100%; height: auto; margin: 14pt auto; display: block; border: 1px solid #cbd5e1;" /><p></p>`;
      execCmd('insertHTML', imgHtml);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Insert Page Break
  const insertPageBreak = () => {
    execCmd('insertHTML', '<div class="page-break"></div><p></p>');
  };

  // Insert Callout Box
  const insertCalloutBox = () => {
    const boxHtml = `
      <blockquote style="border-left: 3.5px solid #185abd; background-color: #f8fafc; padding: 8pt 12pt; margin: 10pt 0; color: #1e293b; border-radius: 2px;">
        <strong style="color: #1e3a8a;">Landasan Regulasi / Dasar Hukum:</strong>
        <p style="margin: 4px 0 0 0; font-size: 11pt;">Tuliskan dasar hukum perencanaan di sini...</p>
      </blockquote>
      <p></p>
    `;
    execCmd('insertHTML', boxHtml);
  };

  // Insert Official Kop Lampiran Perbup Cilacap
  const insertOfficialKop = () => {
    const kopHtml = `
      <div class="kop-lampiran-perbup" style="margin-left: auto; width: 340px; margin-bottom: 24pt; font-weight: bold; font-size: 11pt; line-height: 1.35; text-align: left; text-transform: uppercase;">
        <div style="margin-bottom: 2pt;">LAMPIRAN</div>
        <div style="margin-bottom: 2pt;">PERATURAN BUPATI CILACAP</div>
        <div style="margin-bottom: 2pt;">NOMOR &nbsp; &nbsp; &nbsp; &nbsp; TAHUN 2026</div>
        <div style="margin-bottom: 2pt;">TENTANG</div>
        <div style="margin-bottom: 2pt;">RENCANA KERJA PEMERINTAH DAERAH KABUPATEN CILACAP TAHUN 2027</div>
      </div>
      <p></p>
    `;
    execCmd('insertHTML', kopHtml);
  };

  // Insert Official Bupati Signature Block
  const insertBupatiSignature = () => {
    const sigHtml = `
      <div class="signature-perbup-block" style="margin-left: auto; width: 320px; text-align: center; margin-top: 32pt; margin-bottom: 24pt;">
        <p style="margin: 0; font-weight: bold; font-size: 12pt; text-align: center;">Plt. BUPATI CILACAP,</p>
        <div style="height: 55pt;"></div>
        <p style="margin: 0; font-weight: bold; font-size: 12pt; text-decoration: underline; text-align: center;">AMMY AMALIA FATMA SURYA</p>
      </div>
      <p></p>
    `;
    execCmd('insertHTML', sigHtml);
  };

  // Insert Official Paraf Koordinasi Table (Cyan borders)
  const insertOfficialParafTable = () => {
    const parafHtml = `
      <table class="table-paraf-koordinasi" style="width: 320px; border-collapse: collapse; margin-top: 16pt; margin-bottom: 24pt; font-size: 9.5pt; border: 1.5px solid #00b0f0;">
        <thead>
          <tr>
            <th style="border: 1px solid #00b0f0; padding: 4px 8px; width: 230px; text-align: center; font-weight: bold; background-color: #f0f9ff;">J A B A T A N</th>
            <th style="border: 1px solid #00b0f0; padding: 4px 8px; width: 90px; text-align: center; font-weight: bold; background-color: #f0f9ff;">PARAF</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #00b0f0; padding: 4px 8px; width: 230px; text-align: left;">Sekretaris Daerah</td>
            <td style="border: 1px solid #00b0f0; padding: 4px 8px; width: 90px; text-align: center;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #00b0f0; padding: 4px 8px; width: 230px; text-align: left;">Asisten Pemerintahan dan Kesra</td>
            <td style="border: 1px solid #00b0f0; padding: 4px 8px; width: 90px; text-align: center;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #00b0f0; padding: 4px 8px; width: 230px; text-align: left;">Kepala Bagian Hukum</td>
            <td style="border: 1px solid #00b0f0; padding: 4px 8px; width: 90px; text-align: center;"></td>
          </tr>
        </tbody>
      </table>
      <p></p>
    `;
    execCmd('insertHTML', parafHtml);
  };

  // Find & Replace functionality
  const handleFind = () => {
    if (!findText) return;
    if (window.find) {
      window.find(findText);
    }
  };

  const handleReplace = () => {
    if (!findText || !editorRef.current) return;
    const currentHtml = editorRef.current.innerHTML;
    const newHtml = currentHtml.replace(new RegExp(findText, 'i'), replaceText);
    editorRef.current.innerHTML = newHtml;
    handleEditorInput({ currentTarget: editorRef.current });
  };

  const handleReplaceAll = () => {
    if (!findText || !editorRef.current) return;
    const currentHtml = editorRef.current.innerHTML;
    const newHtml = currentHtml.replaceAll(findText, replaceText);
    editorRef.current.innerHTML = newHtml;
    handleEditorInput({ currentTarget: editorRef.current });
    alert(`Semua kata "${findText}" telah diganti.`);
  };

  // Change Case (Sentence case, lower, UPPER, Title Case)
  const changeCase = (mode) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const text = sel.toString();
    if (!text) return;
    let transformed = text;
    if (mode === 'UPPER') transformed = text.toUpperCase();
    else if (mode === 'LOWER') transformed = text.toLowerCase();
    else if (mode === 'TITLE') {
      transformed = text.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    } else if (mode === 'SENTENCE') {
      transformed = text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase());
    }
    execCmd('insertText', transformed);
  };

  // Word Styles (Normal, Heading 1, 2, 3, Title, No Spacing)
  const applyStyle = (styleName) => {
    if (styleName === 'Normal') {
      execCmd('formatBlock', '<p>');
      setFontSize('12pt');
      setFontFamily('Bookman Old Style');
      setSpacingAfterPt(6);
      setLineSpacing('1.45');
    } else if (styleName === 'Heading 1') {
      execCmd('formatBlock', '<h1>');
      setFontSize('14pt');
    } else if (styleName === 'Heading 2') {
      execCmd('formatBlock', '<h2>');
      setFontSize('12pt');
    } else if (styleName === 'Heading 3') {
      execCmd('formatBlock', '<h3>');
      setFontSize('11pt');
    } else if (styleName === 'Title') {
      execCmd('formatBlock', '<h1>');
      setFontSize('16pt');
    } else if (styleName === 'No Spacing') {
      execCmd('formatBlock', '<p>');
      setParagraphSpacing('0pt');
      setSpacingAfterPt(0);
      setSpacingBeforePt(0);
      setLineSpacing('1.0');
    }
  };

  // Apply Theme Presets
  const applyTheme = (themeName) => {
    setActiveTheme(themeName);
    if (themeName === 'PERBUP') {
      setFontFamily('Bookman Old Style');
      setFontSize('12pt');
      setLineSpacing('1.45');
      setParagraphSpacing('6pt');
      setSpacingAfterPt(6);
      setMarginPreset('PERBUP');
      setMarginCm({ left: 4.0, top: 3.0, right: 3.0, bottom: 3.5 });
    } else if (themeName === 'GOVERNMENT') {
      setFontFamily('Times New Roman');
      setFontSize('12pt');
      setLineSpacing('1.5');
      setParagraphSpacing('6pt');
      setSpacingAfterPt(6);
      setMarginPreset('NORMAL');
      setMarginCm({ left: 2.54, top: 2.54, right: 2.54, bottom: 2.54 });
    } else if (themeName === 'MODERN') {
      setFontFamily('Calibri');
      setFontSize('11pt');
      setLineSpacing('1.15');
      setParagraphSpacing('4pt');
      setSpacingAfterPt(4);
      setMarginPreset('NORMAL');
    } else if (themeName === 'FORMAL') {
      setFontFamily('Georgia');
      setFontSize('11.5pt');
      setLineSpacing('1.4');
      setParagraphSpacing('6pt');
      setSpacingAfterPt(6);
    }
  };

  // Insert Table of Contents (Daftar Isi Otomatis)
  const insertTableOfContents = () => {
    const tocRows = sections.map((sec, idx) => {
      const pad = sec.level === 1 ? '0px' : sec.level === 2 ? '14px' : '28px';
      const wt = sec.level === 1 ? 'bold' : 'normal';
      return `
        <div style="display: flex; align-items: flex-end; justify-content: space-between; margin: 4pt 0; font-size: 11pt; padding-left: ${pad}; font-weight: ${wt};">
          <span style="background: white; padding-right: 4px; z-index: 1;">${sec.code ? `${sec.code} ` : ''}${sec.title}</span>
          <span style="flex: 1; border-bottom: 1.5px dotted #94a3b8; margin: 0 4px 3px 4px;"></span>
          <span style="background: white; padding-left: 4px; z-index: 1; font-weight: bold;">${idx + 1}</span>
        </div>
      `;
    }).join('');

    const tocHtml = `
      <div class="word-toc-block" style="border: 1px solid #cbd5e1; background-color: #f8fafc; padding: 18pt 24pt; margin: 16pt 0; font-family: inherit;">
        <p style="text-align: center; font-weight: bold; font-size: 13pt; margin: 0 0 14pt 0; text-transform: uppercase; letter-spacing: 0.5px;">DAFTAR ISI</p>
        ${tocRows}
      </div>
      <p></p>
    `;
    if (viewMode === 'FULL_DOCUMENT') setIsFullEditMode(true);
    execCmd('insertHTML', tocHtml);
  };

  // Insert Footnote (Catatan Kaki)
  const insertFootnote = (text) => {
    const noteNum = 1;
    const footnoteHtml = `<sup><span style="color: #185abd; font-weight: bold;">[${noteNum}]</span></sup> `;
    const footnoteContent = `
      <div style="border-top: 1px solid #94a3b8; margin-top: 24pt; padding-top: 6pt; font-size: 9.5pt; font-family: inherit; font-style: italic; color: #475569;">
        <p><sup>[${noteNum}]</sup> ${text}</p>
      </div>
    `;
    if (viewMode === 'FULL_DOCUMENT') setIsFullEditMode(true);
    execCmd('insertHTML', footnoteHtml + footnoteContent);
  };

  // Insert Word Caption (Keterangan Resmi Tabel & Gambar Standar Perbup RKPD)
  const insertCaption = () => {
    const fullTitle = captionTitle.trim() || `Judul ${captionLabel}`;
    const fullLabel = `${captionLabel} ${captionNumber}. ${fullTitle}`;

    let captionHtml = '';
    if (captionLabel === 'Tabel') {
      const tableSample = includeTableWithCaption ? `
        <table border="1" style="width: 100%; border-collapse: collapse; margin: 8pt 0; font-size: 10.5pt; font-family: inherit;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="border: 1px solid #94a3b8; padding: 6px 10px; font-weight: bold; text-align: center; width: 40px;">No.</th>
              <th style="border: 1px solid #94a3b8; padding: 6px 10px; font-weight: bold; text-align: center;">Indikator / Uraian</th>
              <th style="border: 1px solid #94a3b8; padding: 6px 10px; font-weight: bold; text-align: center; width: 80px;">Satuan</th>
              <th style="border: 1px solid #94a3b8; padding: 6px 10px; font-weight: bold; text-align: center; width: 100px;">Realisasi 2025</th>
              <th style="border: 1px solid #94a3b8; padding: 6px 10px; font-weight: bold; text-align: center; width: 100px;">Target 2027</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #94a3b8; padding: 6px 10px; text-align: center;">1</td>
              <td style="border: 1px solid #94a3b8; padding: 6px 10px;">Pertumbuhan Ekonomi</td>
              <td style="border: 1px solid #94a3b8; padding: 6px 10px; text-align: center;">%</td>
              <td style="border: 1px solid #94a3b8; padding: 6px 10px; text-align: right;">5,43</td>
              <td style="border: 1px solid #94a3b8; padding: 6px 10px; text-align: right;">5,60</td>
            </tr>
            <tr>
              <td style="border: 1px solid #94a3b8; padding: 6px 10px; text-align: center;">2</td>
              <td style="border: 1px solid #94a3b8; padding: 6px 10px;">Tingkat Pengangguran Terbuka</td>
              <td style="border: 1px solid #94a3b8; padding: 6px 10px; text-align: center;">%</td>
              <td style="border: 1px solid #94a3b8; padding: 6px 10px; text-align: right;">8,21</td>
              <td style="border: 1px solid #94a3b8; padding: 6px 10px; text-align: right;">7,80</td>
            </tr>
          </tbody>
        </table>
      ` : '';

      captionHtml = `
        <div class="word-caption-block" style="margin: 14pt 0 6pt 0;">
          <p class="word-caption-title" style="margin: 0 0 4pt 0; font-family: inherit; font-size: 11pt; font-weight: bold; line-height: 1.35; text-align: left;">
            ${fullLabel}
          </p>
          ${tableSample}
          ${captionSource ? `<p class="word-caption-source" style="margin: 4pt 0 10pt 0; font-family: inherit; font-size: 9.5pt; font-style: italic; color: #334155; line-height: 1.3; text-align: left;"><em>${captionSource}</em></p>` : ''}
        </div>
        <p></p>
      `;
    } else {
      // Gambar / Bagan / Peta / Grafik
      captionHtml = `
        <div class="word-caption-block" style="margin: 14pt 0 6pt 0; text-align: center;">
          ${captionPosition === 'DI_ATAS' ? `<p class="word-caption-title" style="margin: 0 0 6pt 0; font-family: inherit; font-size: 11pt; font-weight: bold; line-height: 1.35; text-align: center;">${fullLabel}</p>` : ''}
          <div style="min-height: 130px; border: 1.5px dashed #cbd5e1; background-color: #f8fafc; border-radius: 4px; display: flex; align-items: center; justify-content: center; margin: 8pt auto; color: #64748b; font-size: 11pt;">
            <span>[ Sisipkan ${captionLabel}: ${fullLabel} di sini ]</span>
          </div>
          ${captionPosition === 'DI_BAWAH' ? `<p class="word-caption-title" style="margin: 6pt 0 4pt 0; font-family: inherit; font-size: 11pt; font-weight: bold; line-height: 1.35; text-align: center;">${fullLabel}</p>` : ''}
          ${captionSource ? `<p class="word-caption-source" style="margin: 2pt 0 10pt 0; font-family: inherit; font-size: 9.5pt; font-style: italic; color: #334155; line-height: 1.3; text-align: center;"><em>${captionSource}</em></p>` : ''}
        </div>
        <p></p>
      `;
    }

    if (viewMode === 'FULL_DOCUMENT') {
      setIsFullEditMode(true);
    }
    execCmd('insertHTML', captionHtml);

    // Auto-increment caption number for next insertion (e.g. 2.1 -> 2.2)
    const numParts = captionNumber.split('.');
    if (numParts.length === 2 && !isNaN(parseInt(numParts[1]))) {
      setCaptionNumber(`${numParts[0]}.${parseInt(numParts[1]) + 1}`);
    }

    setShowCaptionModal(false);
    setCaptionTitle('');
  };

  // Filter sections
  const filteredSections = sections.filter(sec => {
    const matchSearch =
      (sec.code && sec.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (sec.title && sec.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (sec.content && sec.content.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchSearch) return false;

    if (filterType === 'MY_TASKS') return (sec.assignedUserIds || []).includes(currentUser.id);
    if (filterType === 'READ_ONLY') return !(sec.assignedUserIds || []).includes(currentUser.id);
    if (filterType === 'REVIEW') return sec.status === 'REVIEW';
    if (filterType === 'APPROVED') return sec.status === 'APPROVED';
    return true;
  });

  const mySectionsCount = sections.filter(s => (s.assignedUserIds || []).includes(currentUser.id)).length;
  const readOnlySectionsCount = sections.length - mySectionsCount;
  const reviewSectionsCount = sections.filter(s => s.status === 'REVIEW').length;

  // Hierarchy check & collapse helpers for Navigation Pane
  const hasNavChildren = (sec, allSections) => {
    const idx = allSections.findIndex(s => s.id === sec.id);
    if (idx === -1 || idx === allSections.length - 1) return false;
    return (allSections[idx + 1].level || 1) > (sec.level || 1);
  };

  const isNavSectionHidden = (sec, allSections) => {
    if (collapsedNavIds.size === 0) return false;
    const secIndex = allSections.findIndex(s => s.id === sec.id);
    if (secIndex <= 0) return false;

    let currentLevel = sec.level || 1;
    for (let i = secIndex - 1; i >= 0; i--) {
      const prev = allSections[i];
      const prevLvl = prev.level || 1;
      if (prevLvl < currentLevel) {
        if (collapsedNavIds.has(prev.id)) return true;
        currentLevel = prevLvl;
        if (currentLevel <= 1) break;
      }
    }
    return false;
  };

  const handleToggleNavCollapse = (secId, e) => {
    if (e) e.stopPropagation();
    setCollapsedNavIds(prev => {
      const next = new Set(prev);
      if (next.has(secId)) next.delete(secId);
      else next.add(secId);
      return next;
    });
  };

  const handleExpandAllNav = () => {
    setCollapsedNavIds(new Set());
  };

  const handleCollapseSubLevelsNav = () => {
    const set = new Set();
    sections.forEach(s => {
      if ((s.level || 1) >= 4 && hasNavChildren(s, sections)) set.add(s.id);
    });
    setCollapsedNavIds(set);
  };

  const currentIndex = sections.findIndex(s => s.id === activeSectionId);
  const prevSection = currentIndex > 0 ? sections[currentIndex - 1] : null;
  const nextSection = currentIndex < sections.length - 1 ? sections[currentIndex + 1] : null;

  // Paper Dimensions calculated from PaperSize & Orientation
  const getPaperDimensions = () => {
    let width = 794; // Standard A4 width (210mm at 96 DPI = 793.7px)
    let minHeight = 1123; // Standard A4 height (297mm at 96 DPI = 1122.5px)

    if (paperSize === 'F4') {
      minHeight = 1247; // Folio length 330mm
    } else if (paperSize === 'LETTER') {
      width = 816; // Letter 8.5 inches
      minHeight = 1056; // Letter 11 inches
    }

    if (orientation === 'LANDSCAPE') {
      return { width: minHeight, minHeight: width };
    }
    return { width, minHeight };
  };


  const getSectionMarginStyle = (secOrient) => {
    const isLand = (secOrient || '').toUpperCase() === 'LANDSCAPE';
    const totalCm = isLand
      ? (paperSize === 'F4' ? 33.0 : (paperSize === 'LETTER' ? 27.94 : 29.7))
      : (paperSize === 'F4' ? 21.6 : (paperSize === 'LETTER' ? 21.59 : 21.0));
    const pWidth = isLand ? 1247 : 816;
    const pxPerCmVal = pWidth / totalCm;

    let left = 4.0;
    let right = 2.5;
    let top = 2.5;
    let bottom = 2.5;

    if (isBab2Doc) {
      left = 3.5;
      right = 2.1;
    } else if (isLand) {
      left = 2.5;
      right = 2.5;
    }

    return {
      paddingLeft: `${Math.round(left * pxPerCmVal)}px`,
      paddingRight: `${Math.round(right * pxPerCmVal)}px`,
      paddingTop: `${Math.round(top * pxPerCmVal)}px`,
      paddingBottom: `${Math.round(bottom * pxPerCmVal)}px`,
    };
  };

  const paperDims = getPaperDimensions();

  // Smart Auto-Fit Zoom to ensure the paper never exceeds the screen boundary
  const handleFitToWidth = () => {
    if (!mainDeskRef.current) return;
    const availableWidth = mainDeskRef.current.clientWidth - 40;
    const pWidth = paperDims.width;
    if (availableWidth > 0 && pWidth > 0) {
      const fitZoom = Math.min(100, Math.max(50, Math.floor((availableWidth / pWidth) * 100)));
      setZoomLevel(fitZoom);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (mainDeskRef.current) {
        const availableWidth = mainDeskRef.current.clientWidth - 40;
        if (availableWidth > 0 && availableWidth < paperDims.width) {
          const fitZoom = Math.min(100, Math.max(50, Math.floor((availableWidth / paperDims.width) * 100)));
          setZoomLevel(fitZoom);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(handleResize, 350);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [paperDims.width, showNavPane, showReviewPane]);

  // Total paper width in centimeters based on size & orientation
  const totalPaperCm = orientation === 'LANDSCAPE'
    ? (paperSize === 'F4' ? 33.0 : (paperSize === 'LETTER' ? 27.94 : 29.7))
    : (paperSize === 'F4' ? 21.5 : (paperSize === 'LETTER' ? 21.59 : 21.0));

  const pxPerCm = paperDims.width / totalPaperCm;

  // Margin styles dynamically calculated from active centimeter values
  const getMarginStyle = () => {
    return {
      paddingLeft: `${Math.round(marginCm.left * pxPerCm)}px`,
      paddingRight: `${Math.round(marginCm.right * pxPerCm)}px`,
      paddingTop: `${Math.round(marginCm.top * pxPerCm)}px`,
      paddingBottom: `${Math.round(marginCm.bottom * pxPerCm)}px`,
    };
  };

  // Active Word Ruler Dragging Interaction Effect
  useEffect(() => {
    if (!activeDrag) return;

    const handleMouseMove = (e) => {
      if (!rulerTrackRef.current) return;
      const rect = rulerTrackRef.current.getBoundingClientRect();
      const clientX = e.clientX;
      const xInTrack = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const cmInTrack = (xInTrack / rect.width) * totalPaperCm;

      if (activeDrag === 'LEFT_MARGIN') {
        const newLeft = Math.max(1.0, Math.min(totalPaperCm - marginCm.right - 2.0, Math.round(cmInTrack * 10) / 10));
        setMarginCm((prev) => ({ ...prev, left: newLeft }));
        setMarginPreset('CUSTOM');
        setDragTooltip(`Margin Kiri: ${newLeft.toFixed(1)} cm`);
        setDragGuidelineX(newLeft * pxPerCm);
      } else if (activeDrag === 'RIGHT_MARGIN') {
        const rightFromEdge = totalPaperCm - cmInTrack;
        const newRight = Math.max(1.0, Math.min(totalPaperCm - marginCm.left - 2.0, Math.round(rightFromEdge * 10) / 10));
        setMarginCm((prev) => ({ ...prev, right: newRight }));
        setMarginPreset('CUSTOM');
        setDragTooltip(`Margin Kanan: ${newRight.toFixed(1)} cm`);
        setDragGuidelineX(paperDims.width - (newRight * pxPerCm));
      } else if (activeDrag === 'FIRST_LINE') {
        const indentCm = Math.max(-2.0, Math.min(5.0, Math.round((cmInTrack - marginCm.left) * 10) / 10));
        setFirstLineIndentCm(indentCm);
        setFirstLineIndent(indentCm !== 0);
        setDragTooltip(`Indentasi Baris Pertama: ${indentCm.toFixed(1)} cm`);
        setDragGuidelineX((marginCm.left + indentCm) * pxPerCm);
      }
    };

    const handleMouseUp = () => {
      setActiveDrag(null);
      setDragTooltip('');
      setDragGuidelineX(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeDrag, pxPerCm, totalPaperCm, marginCm.left, marginCm.right, paperDims.width]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] bg-[#f3f2f1]">
        <div className="text-center p-8 bg-white rounded-xl shadow-md border border-slate-200">
          <div className="w-10 h-10 border-4 border-[#185abd] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Membuka Microsoft Word Suite...</p>
          <p className="text-xs text-slate-400 mt-1">Menyiapkan kanvas tata letak naskah RKPD</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] overflow-hidden bg-[#e6e6e6]">
      
      {/* Hidden file input for image uploads */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* ================= 1. MICROSOFT WORD COMPREHENSIVE RIBBON MENU ================= */}
      <div className="bg-[#f3f2f1] border-b border-[#d2d0ce] select-none shrink-0 shadow-2xs">
        
        {/* Ribbon Tabs Header */}
        <div className="flex items-center justify-between px-2 pt-1 border-b border-[#e1dfdd] bg-[#f8f7f6] text-xs gap-1 min-w-0 overflow-x-auto">
          
          {/* Left Group: Word Tabs & View Mode Switcher */}
          <div className="flex items-center shrink-0 min-w-0">
            {['HOME', 'INSERT', 'DESIGN', 'LAYOUT', 'REFERENCES', 'REVIEW', 'VIEW'].map((tabKey) => {
              const labels = {
                HOME: 'Home',
                INSERT: 'Insert',
                DESIGN: 'Design',
                LAYOUT: 'Layout',
                REFERENCES: 'References',
                REVIEW: 'Review',
                VIEW: 'View'
              };
              const isActive = activeRibbonTab === tabKey;

              return (
                <button
                  key={tabKey}
                  onClick={() => setActiveRibbonTab(tabKey)}
                  className={`px-2.5 py-1.5 font-medium transition border-b-2 text-xs ${
                    isActive
                      ? 'border-[#185abd] text-[#185abd] bg-white font-bold shadow-2xs'
                      : 'border-transparent text-slate-700 hover:text-black hover:bg-slate-200/50'
                  }`}
                >
                  {labels[tabKey]}
                </button>
              );
            })}

            {/* View Mode Switcher: Full Document Preview vs Section Editor */}
            <div className="flex items-center bg-[#e1dfdd] p-0.5 rounded-md ml-2 shadow-inner">
              <button
                onClick={() => setViewMode('FULL_DOCUMENT')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded transition ${
                  viewMode === 'FULL_DOCUMENT'
                    ? 'bg-white text-[#185abd] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Pratinjau Dokumen Lengkap Sesuai Template Resmi"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Dokumen Utuh</span>
              </button>

              <button
                onClick={() => setViewMode('SECTION_EDITOR')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded transition ${
                  viewMode === 'SECTION_EDITOR'
                    ? 'bg-white text-[#185abd] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Sunting Bagian Sub-Bab Tertentu"
              >
                <Type className="w-3.5 h-3.5" />
                <span>{activeSection?.canEdit ? 'Sub-Bab' : 'Lihat Sub-Bab'}</span>
              </button>
            </div>
          </div>

          {/* Right Group: Status, Review & Share Button */}
          <div className="ml-auto flex items-center space-x-1.5 pb-1 relative shrink-0">
            {/* Responsibility / Role Mode Indicator */}
            {doc?.isDocReadOnly ? (
              <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs" title="Mode Baca Saja">
                <Eye className="w-3 h-3 text-amber-700" /> Lihat Saja
              </span>
            ) : currentUser?.role === 'REVIEWER' ? (
              <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-900 border border-cyan-300 shadow-2xs" title="Reviewer Resmi">
                <ShieldCheck className="w-3 h-3 text-cyan-700" /> Reviewer
              </span>
            ) : currentUser?.role === 'CONTRIBUTOR' ? (
              <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs" title="Kontributor Aktif">
                <Check className="w-3 h-3 text-emerald-700" /> Tugas
              </span>
            ) : null}

            {/* Stage Pill */}
            <span className="hidden 2xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              🏷️ {doc?.stage?.shortTitle || selectedStage?.shortTitle || 'Tahapan'}
            </span>

            {/* Status Dropdown */}
            <select
              value={activeSection?.status || 'DRAFT'}
              disabled={!activeSection?.canChangeStatus || doc?.isStageClosed || doc?.stage?.status === 'CLOSED'}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="text-[11px] font-bold px-2 py-0.5 rounded border border-slate-300 bg-white text-slate-700 cursor-pointer shadow-2xs max-w-[120px] truncate"
            >
              <option value="DRAFT">🟡 Draft</option>
              <option value="IN_PROGRESS">🔵 Dikerjakan</option>
              <option value="REVIEW">🟣 Review</option>
              {(currentUser.role === 'ADMIN' || (currentUser.role === 'REVIEWER' && (doc?.isReviewerForThisDoc !== false))) && (
                <option value="APPROVED">🟢 Final</option>
              )}
            </select>

            {/* Lock button */}
            {currentUser.role === 'ADMIN' && (
              <button
                onClick={handleToggleLock}
                className={`p-1 rounded text-[11px] flex items-center gap-1 px-1.5 border transition ${
                  activeSection?.isLocked
                    ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
                title="Kunci atau Buka Bagian Naskah"
              >
                {activeSection?.isLocked ? <Lock className="w-3 h-3 text-rose-600" /> : <Unlock className="w-3 h-3 text-slate-500" />}
                <span className="hidden sm:inline">{activeSection?.isLocked ? 'Terkunci' : 'Terbuka'}</span>
              </button>
            )}

            {/* Toggle Comments Button */}
            <button
              onClick={() => setShowReviewPane(!showReviewPane)}
              className={`px-2 py-1 text-xs font-semibold rounded border flex items-center gap-1 transition ${
                showReviewPane
                  ? 'bg-blue-100 text-[#185abd] border-blue-300'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              title="Buka Panel Catatan Revisi & Hak Akses"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Review</span>
              <span className="text-[10px] font-bold">({comments.length})</span>
            </button>

            {/* Official Microsoft Word Blue [ Share v ] Button */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="flex items-center gap-1 px-2.5 py-1 bg-[#185abd] hover:bg-[#144b9e] text-white font-bold rounded-sm text-xs shadow-xs transition cursor-pointer"
                title="Bagikan Dokumen, Ekspor Word atau Cetak PDF"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
                <ChevronDown className="w-3 h-3 opacity-80" />
              </button>
              {showShareMenu && (
                <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-300 shadow-2xl rounded-xl p-2 z-50 w-56 text-xs font-sans">
                  <div className="font-bold text-slate-800 px-2 py-1 border-b border-slate-100 mb-1 flex items-center justify-between">
                    <span>Bagikan Naskah RKPD</span>
                    <button onClick={() => setShowShareMenu(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                  </div>
                  <button
                    onClick={() => {
                      window.print();
                      setShowShareMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-blue-50 flex items-center gap-2 text-slate-800"
                  >
                    <Printer className="w-4 h-4 text-blue-700" />
                    <span>Cetak / Simpan PDF</span>
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Tautan dokumen telah disalin ke clipboard!');
                      setShowShareMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-blue-50 flex items-center gap-2 text-slate-800"
                  >
                    <LinkIcon className="w-4 h-4 text-indigo-700" />
                    <span>Salin Tautan Kolaborasi</span>
                  </button>
                  <button
                    onClick={() => {
                      if (viewMode === 'FULL_DOCUMENT') handleFullDocInput({ currentTarget: fullDocEditorRef.current });
                      else saveSectionContent(editorHtml, sectionTitle, sectionCode);
                      setShowShareMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-blue-50 flex items-center gap-2 text-slate-800"
                  >
                    <Save className="w-4 h-4 text-emerald-700" />
                    <span>Simpan Revisi ke Server</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= RIBBON TOOLBAR CONTROLS ================= */}
        <div className="px-3 py-1 bg-[#f3f2f1] flex items-center gap-1 overflow-x-auto min-h-[92px]">
          
          {/* TAB 1: HOME (Image 1) */}
          {activeRibbonTab === 'HOME' && (
            <div className="flex items-center space-x-1">
              {/* Clipboard Group */}
              <div className="word-ribbon-group">
                <div className="flex items-center gap-1 my-auto">
                  <button
                    onClick={() => {
                      navigator.clipboard.readText().then(text => execCmd('insertText', text)).catch(() => execCmd('paste'));
                    }}
                    disabled={!activeSection?.canEdit}
                    className="word-ribbon-btn-large"
                    title="Tempel Isi Clipboard (Paste)"
                  >
                    <Clipboard className="w-5 h-5 text-amber-700 mb-0.5" />
                    <span className="text-[10px]">Paste</span>
                  </button>
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => execCmd('cut')}
                      disabled={!activeSection?.canEdit}
                      className="word-ribbon-btn-small"
                      title="Potong Teks (Cut)"
                    >
                      <Scissors className="w-3.5 h-3.5 text-slate-700" />
                      <span className="text-[10px]">Cut</span>
                    </button>
                    <button
                      onClick={() => execCmd('copy')}
                      disabled={!activeSection?.canEdit}
                      className="word-ribbon-btn-small"
                      title="Salin Teks (Copy)"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-700" />
                      <span className="text-[10px]">Copy</span>
                    </button>
                    <button
                      onClick={() => alert('Kuas Format: Pilih teks yang ingin diubah gayanya!')}
                      disabled={!activeSection?.canEdit}
                      className="word-ribbon-btn-small"
                      title="Kuas Format (Format Painter)"
                    >
                      <Paintbrush className="w-3.5 h-3.5 text-amber-600" />
                    </button>
                  </div>
                </div>
                <div className="word-ribbon-group-label">
                  <span>Clipboard</span>
                  <span className="absolute right-0 text-[8px] opacity-40">↘</span>
                </div>
              </div>

              {/* Font Group */}
              <div className="word-ribbon-group">
                <div className="flex flex-col gap-1 my-auto">
                  <div className="flex items-center gap-1">
                    <select
                      value={fontFamily}
                      disabled={!activeSection?.canEdit}
                      onChange={(e) => {
                        setFontFamily(e.target.value);
                        execCmd('fontName', e.target.value);
                      }}
                      className="text-xs bg-white border border-[#c8c6c4] rounded px-1.5 py-0.5 font-medium text-slate-800 w-32 focus:outline-none"
                    >
                      <option value="Bookman Old Style">Bookman Old Style (Perbup)</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Calibri">Calibri</option>
                      <option value="Arial">Arial</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Garamond">Garamond</option>
                    </select>

                    <select
                      value={fontSize}
                      disabled={!activeSection?.canEdit}
                      onChange={(e) => {
                        setFontSize(e.target.value);
                        const pt = parseInt(e.target.value) || 12;
                        execCmd('fontSize', pt > 18 ? '6' : pt > 14 ? '5' : pt > 12 ? '4' : '3');
                      }}
                      className="text-xs bg-white border border-[#c8c6c4] rounded px-1 py-0.5 font-semibold text-slate-800 w-16 focus:outline-none"
                    >
                      {['8pt', '9pt', '10pt', '10.5pt', '11pt', '12pt', '14pt', '16pt', '18pt', '20pt', '24pt', '28pt', '36pt'].map(sz => (
                        <option key={sz} value={sz}>{sz}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => changeFontSizeStep(1)}
                      disabled={!activeSection?.canEdit}
                      className="p-1 hover:bg-[#e1dfdd] rounded text-slate-700"
                      title="Perbesar Huruf (Grow Font)"
                    >
                      <span className="text-xs font-bold">A<sup className="text-[9px]">▲</sup></span>
                    </button>
                    <button
                      onClick={() => changeFontSizeStep(-1)}
                      disabled={!activeSection?.canEdit}
                      className="p-1 hover:bg-[#e1dfdd] rounded text-slate-700"
                      title="Perkecil Huruf (Shrink Font)"
                    >
                      <span className="text-xs font-bold">A<sub className="text-[9px]">▼</sub></span>
                    </button>

                    {/* Change Case Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setShowCasePicker(!showCasePicker)}
                        disabled={!activeSection?.canEdit}
                        className="p-1 hover:bg-[#e1dfdd] rounded text-slate-700 flex items-center text-xs font-medium"
                        title="Ubah Huruf Besar / Kecil (Change Case)"
                      >
                        <span>Aa</span>
                        <ChevronDown className="w-2.5 h-2.5 ml-0.5 text-slate-500" />
                      </button>
                      {showCasePicker && (
                        <div className="absolute left-0 top-full mt-1 bg-white border border-slate-300 shadow-xl rounded-lg p-1 z-50 w-36 text-xs">
                          <button onClick={() => { changeCase('SENTENCE'); setShowCasePicker(false); }} className="w-full text-left px-2 py-1 hover:bg-blue-50 rounded">Huruf kalimat</button>
                          <button onClick={() => { changeCase('LOWER'); setShowCasePicker(false); }} className="w-full text-left px-2 py-1 hover:bg-blue-50 rounded">huruf kecil</button>
                          <button onClick={() => { changeCase('UPPER'); setShowCasePicker(false); }} className="w-full text-left px-2 py-1 hover:bg-blue-50 rounded">HURUF BESAR</button>
                          <button onClick={() => { changeCase('TITLE'); setShowCasePicker(false); }} className="w-full text-left px-2 py-1 hover:bg-blue-50 rounded">Kapital Tiap Kata</button>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => execCmd('removeFormat')}
                      disabled={!activeSection?.canEdit}
                      className="p-1 hover:bg-[#e1dfdd] rounded text-slate-700"
                      title="Hapus Semua Format (Clear Formatting)"
                    >
                      <Eraser className="w-3.5 h-3.5 text-purple-700" />
                    </button>
                  </div>

                  {/* Row 2: Bold, Italic, Underline, Strikethrough, Subscript, Superscript, Highlighter, Color */}
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => execCmd('bold')}
                      disabled={!activeSection?.canEdit}
                      className="p-1 hover:bg-[#e1dfdd] rounded font-bold text-slate-800"
                      title="Tebal (Ctrl+B)"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => execCmd('italic')}
                      disabled={!activeSection?.canEdit}
                      className="p-1 hover:bg-[#e1dfdd] rounded italic text-slate-800"
                      title="Miring (Ctrl+I)"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => execCmd('underline')}
                      disabled={!activeSection?.canEdit}
                      className="p-1 hover:bg-[#e1dfdd] rounded underline text-slate-800"
                      title="Garis Bawah (Ctrl+U)"
                    >
                      <Underline className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => execCmd('strikeThrough')}
                      disabled={!activeSection?.canEdit}
                      className="p-1 hover:bg-[#e1dfdd] rounded text-slate-800"
                      title="Coretan (Strikethrough)"
                    >
                      <Strikethrough className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => execCmd('subscript')}
                      disabled={!activeSection?.canEdit}
                      className="p-1 hover:bg-[#e1dfdd] rounded text-slate-800"
                      title="Subskrip (x₂)"
                    >
                      <Subscript className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => execCmd('superscript')}
                      disabled={!activeSection?.canEdit}
                      className="p-1 hover:bg-[#e1dfdd] rounded text-slate-800"
                      title="Superskrip (x²)"
                    >
                      <Superscript className="w-3.5 h-3.5" />
                    </button>

                    {/* Highlight Color */}
                    <div className="relative">
                      <button
                        onClick={() => setShowHighlightPicker(!showHighlightPicker)}
                        disabled={!activeSection?.canEdit}
                        className="p-1 hover:bg-[#e1dfdd] rounded text-amber-600 flex items-center"
                        title="Warna Sorotan Teks (Highlight)"
                      >
                        <Highlighter className="w-3.5 h-3.5" />
                        <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                      </button>
                      {showHighlightPicker && (
                        <div className="absolute left-0 top-full mt-1 bg-white border border-slate-300 shadow-xl rounded-lg p-2 z-50 grid grid-cols-4 gap-1.5 w-32">
                          {['#ffff00', '#86efac', '#67e8f9', '#f472b6', '#fed7aa', 'transparent'].map(color => (
                            <div
                              key={color}
                              onClick={() => {
                                execCmd('hiliteColor', color);
                                setShowHighlightPicker(false);
                              }}
                              className="w-5 h-5 rounded cursor-pointer border border-slate-300 hover:scale-110 transition"
                              style={{ backgroundColor: color === 'transparent' ? '#ffffff' : color }}
                              title={color === 'transparent' ? 'Tanpa Sorotan' : color}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Font Color */}
                    <div className="relative">
                      <button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        disabled={!activeSection?.canEdit}
                        className="p-1 hover:bg-[#e1dfdd] rounded text-red-600 flex items-center"
                        title="Warna Teks (Font Color)"
                      >
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-xs leading-none">A</span>
                          <div className="w-3 h-0.5 bg-red-600 mt-0.5" />
                        </div>
                        <ChevronDown className="w-2.5 h-2.5 text-slate-400 ml-0.5" />
                      </button>
                      {showColorPicker && (
                        <div className="absolute left-0 top-full mt-1 bg-white border border-slate-300 shadow-xl rounded-lg p-2 z-50 grid grid-cols-5 gap-1.5 w-36">
                          {['#000000', '#1e3a8a', '#dc2626', '#16a34a', '#d97706', '#9333ea', '#0284c7', '#475569', '#ffffff'].map(color => (
                            <div
                              key={color}
                              onClick={() => {
                                execCmd('foreColor', color);
                                setShowColorPicker(false);
                              }}
                              className="w-5 h-5 rounded cursor-pointer border border-slate-300 hover:scale-110 transition"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="word-ribbon-group-label">
                  <span>Font</span>
                  <span className="absolute right-0 text-[8px] opacity-40">↘</span>
                </div>
              </div>

              {/* Paragraph Group */}
              <div className="word-ribbon-group">
                <div className="flex flex-col gap-1 my-auto">
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => execCmd('insertUnorderedList')}
                      disabled={!activeSection?.canEdit}
                      className="p-1 hover:bg-[#e1dfdd] rounded text-slate-700"
                      title="Daftar Poin (Bullets)"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => execCmd('insertOrderedList')}
                      disabled={!activeSection?.canEdit}
                      className="p-1 hover:bg-[#e1dfdd] rounded text-slate-700"
                      title="Daftar Penomoran (Numbering)"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => execCmd('outdent')}
                      disabled={!activeSection?.canEdit}
                      className="p-1 hover:bg-[#e1dfdd] rounded text-slate-700"
                      title="Kurangi Indentasi (Decrease Indent)"
                    >
                      <Outdent className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => execCmd('indent')}
                      disabled={!activeSection?.canEdit}
                      className="p-1 hover:bg-[#e1dfdd] rounded text-slate-700"
                      title="Tambah Indentasi (Increase Indent)"
                    >
                      <Indent className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => alert('Simbol tanda akhir paragraf aktif')}
                      className="p-1 hover:bg-[#e1dfdd] rounded text-slate-500 font-serif text-xs font-bold"
                      title="Tanda Paragraf (Show/Hide ¶)"
                    >
                      ¶
                    </button>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => {
                        setDocumentAlignment('left');
                        execCmd('justifyLeft');
                      }}
                      disabled={!activeSection?.canEdit}
                      className={`p-1 rounded ${documentAlignment === 'left' ? 'bg-[#c8c6c4] text-[#185abd]' : 'hover:bg-[#e1dfdd] text-slate-800'}`}
                      title="Rata Kiri (Ctrl+L)"
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setDocumentAlignment('center');
                        execCmd('justifyCenter');
                      }}
                      disabled={!activeSection?.canEdit}
                      className={`p-1 rounded ${documentAlignment === 'center' ? 'bg-[#c8c6c4] text-[#185abd]' : 'hover:bg-[#e1dfdd] text-slate-800'}`}
                      title="Rata Tengah (Ctrl+E)"
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setDocumentAlignment('right');
                        execCmd('justifyRight');
                      }}
                      disabled={!activeSection?.canEdit}
                      className={`p-1 rounded ${documentAlignment === 'right' ? 'bg-[#c8c6c4] text-[#185abd]' : 'hover:bg-[#e1dfdd] text-slate-800'}`}
                      title="Rata Kanan (Ctrl+R)"
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setDocumentAlignment('justify');
                        execCmd('justifyFull');
                      }}
                      disabled={!activeSection?.canEdit}
                      className={`p-1 rounded ${documentAlignment === 'justify' ? 'bg-[#c8c6c4] text-[#185abd]' : 'hover:bg-[#e1dfdd] text-slate-800'}`}
                      title="Rata Kanan-Kiri (Ctrl+J - Standar Perbup)"
                    >
                      <AlignJustify className="w-3.5 h-3.5" />
                    </button>

                    {/* Line and Paragraph Spacing */}
                    <div className="relative">
                      <button
                        onClick={() => setShowSpacingPicker(!showSpacingPicker)}
                        disabled={!activeSection?.canEdit}
                        className="p-1 hover:bg-[#e1dfdd] rounded text-slate-700 flex items-center"
                        title="Spasi Baris dan Paragraf"
                      >
                        <div className="flex items-center text-[11px] font-semibold text-blue-900">
                          <span>↕</span>
                        </div>
                        <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                      </button>
                      {showSpacingPicker && (
                        <div className="absolute left-0 top-full mt-1 bg-white border border-slate-300 shadow-xl rounded-lg p-1.5 z-50 w-44 text-xs font-sans">
                          <span className="font-bold text-[10px] text-slate-400 uppercase px-2 py-0.5 block">Spasi Baris:</span>
                          {['1.0', '1.15', '1.45', '1.5', '2.0'].map(sp => (
                            <button
                              key={sp}
                              onClick={() => {
                                setLineSpacing(sp);
                                setShowSpacingPicker(false);
                              }}
                              className={`w-full text-left px-2 py-1 rounded flex items-center justify-between ${lineSpacing === sp ? 'bg-blue-100 font-bold text-blue-900' : 'hover:bg-slate-100'}`}
                            >
                              <span>{sp} {sp === '1.45' ? '(Perbup Cilacap)' : ''}</span>
                              {lineSpacing === sp && <Check className="w-3 h-3 text-blue-700" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="word-ribbon-group-label">
                  <span>Paragraph</span>
                  <span className="absolute right-0 text-[8px] opacity-40">↘</span>
                </div>
              </div>

              {/* Styles Group */}
              <div className="word-ribbon-group">
                <div className="flex items-center gap-1.5 my-auto overflow-x-auto max-w-[280px]">
                  {[
                    { label: 'Normal', desc: 'Isi Naskah', style: 'Normal' },
                    { label: 'No Spacing', desc: 'Rapat', style: 'No Spacing' },
                    { label: 'Heading 1', desc: 'BAB I / II', style: 'Heading 1' },
                    { label: 'Heading 2', desc: 'Sub-Bab', style: 'Heading 2' },
                    { label: 'Title', desc: 'Judul RKPD', style: 'Title' }
                  ].map(st => (
                    <div
                      key={st.label}
                      onClick={() => applyStyle(st.style)}
                      className="word-style-card"
                      title={`Terapkan gaya: ${st.label}`}
                    >
                      <span className={`text-[11px] truncate ${st.style === 'Heading 1' ? 'font-bold text-blue-900' : st.style === 'Heading 2' ? 'font-semibold text-blue-800' : st.style === 'Title' ? 'font-extrabold text-slate-900' : 'text-slate-800'}`}>
                        {st.label}
                      </span>
                      <span className="text-[9px] text-slate-400 truncate">{st.desc}</span>
                    </div>
                  ))}
                </div>
                <div className="word-ribbon-group-label">
                  <span>Styles</span>
                  <span className="absolute right-0 text-[8px] opacity-40">↘</span>
                </div>
              </div>

              {/* Editing Group */}
              <div className="word-ribbon-group">
                <div className="flex flex-col gap-0.5 my-auto">
                  <button
                    onClick={() => setShowFindReplace(true)}
                    className="word-ribbon-btn-small"
                    title="Cari Teks di Dokumen (Ctrl+F)"
                  >
                    <Search className="w-3 h-3 text-blue-700" />
                    <span>Find</span>
                  </button>
                  <button
                    onClick={() => setShowFindReplace(true)}
                    className="word-ribbon-btn-small"
                    title="Ganti Kata / Teks (Ctrl+H)"
                  >
                    <Replace className="w-3 h-3 text-blue-700" />
                    <span>Replace</span>
                  </button>
                  <button
                    onClick={() => execCmd('selectAll')}
                    className="word-ribbon-btn-small"
                    title="Pilih Semua Naskah (Ctrl+A)"
                  >
                    <CheckSquare className="w-3 h-3 text-slate-600" />
                    <span>Select</span>
                  </button>
                </div>
                <div className="word-ribbon-group-label">
                  <span>Editing</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INSERT (Image 2) */}
          {activeRibbonTab === 'INSERT' && (
            <div className="flex items-center space-x-1">
              {/* Pages Group */}
              <div className="word-ribbon-group">
                <div className="flex items-center gap-1 my-auto">
                  <button
                    onClick={insertPageBreak}
                    disabled={!activeSection?.canEdit}
                    className="word-ribbon-btn-large"
                    title="Sisipkan Hentian Halaman Baru"
                  >
                    <Layers className="w-5 h-5 text-blue-700 mb-0.5" />
                    <span className="text-[10px]">Page Break</span>
                  </button>
                </div>
                <div className="word-ribbon-group-label">
                  <span>Pages</span>
                </div>
              </div>

              {/* Tables Group */}
              <div className="word-ribbon-group">
                <div className="relative my-auto">
                  <button
                    onClick={() => setShowTablePicker(!showTablePicker)}
                    disabled={!activeSection?.canEdit}
                    className="word-ribbon-btn-large"
                    title="Sisipkan Tabel Dokumen"
                  >
                    <TableIcon className="w-5 h-5 text-blue-700 mb-0.5" />
                    <span className="text-[10px]">Table ▼</span>
                  </button>
                  {showTablePicker && (
                    <div className="absolute left-0 top-full mt-1.5 bg-white border border-slate-300 shadow-2xl rounded-xl p-3 z-50 w-64 select-none">
                      <p className="font-bold text-slate-800 text-xs mb-2">
                        Pilih Ukuran Kotak Tabel ({tableHoverGrid.r}x{tableHoverGrid.c}):
                      </p>
                      <div className="grid grid-cols-6 gap-1 mb-3">
                        {[1, 2, 3, 4, 5, 6].map((row) =>
                          [1, 2, 3, 4, 5, 6].map((col) => {
                            const isHovered = row <= tableHoverGrid.r && col <= tableHoverGrid.c;
                            return (
                              <div
                                key={`${row}-${col}`}
                                onMouseEnter={() => setTableHoverGrid({ r: row, c: col })}
                                onClick={() => insertWordTable(row, col)}
                                className={`w-6 h-6 border rounded-xs cursor-pointer transition ${
                                  isHovered ? 'bg-blue-500 border-blue-600' : 'bg-slate-100 border-slate-300'
                                }`}
                              />
                            );
                          })
                        )}
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex flex-col gap-1.5">
                        <button
                          onClick={() => insertWordTable(4, 5)}
                          className="text-left text-[11px] text-blue-700 font-semibold hover:underline"
                        >
                          📊 Preset: Tabel Indikator Makro (5 Kolom)
                        </button>
                        <button
                          onClick={() => insertWordTable(6, 2)}
                          className="text-left text-[11px] text-blue-700 font-semibold hover:underline"
                        >
                          ✍️ Preset: Tabel Paraf Koordinasi (2 Kolom)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="word-ribbon-group-label">
                  <span>Tables</span>
                </div>
              </div>

              {/* Illustrations Group */}
              <div className="word-ribbon-group">
                <div className="flex items-center gap-1 my-auto">
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    disabled={!activeSection?.canEdit}
                    className="word-ribbon-btn-large"
                    title="Sisipkan Gambar dari Komputer"
                  >
                    <ImageIcon className="w-5 h-5 text-emerald-700 mb-0.5" />
                    <span className="text-[10px]">Pictures</span>
                  </button>
                  <button
                    onClick={insertCalloutBox}
                    disabled={!activeSection?.canEdit}
                    className="word-ribbon-btn-large"
                    title="Sisipkan Bentuk / Kotak Regulasi"
                  >
                    <Shapes className="w-5 h-5 text-indigo-700 mb-0.5" />
                    <span className="text-[10px]">Shapes</span>
                  </button>
                  <button
                    onClick={() => {
                      const chartSample = `
                        <div style="border: 1px solid #cbd5e1; background-color: #f8fafc; padding: 12pt; border-radius: 6px; margin: 12pt 0; text-align: center;">
                          <p style="font-weight: bold; margin-bottom: 8pt; color: #1e3a8a;">Grafik Perkembangan Indikator Makro Kabupaten Cilacap</p>
                          <div style="display: flex; align-items: flex-end; justify-content: center; gap: 16px; height: 110px; border-bottom: 2px solid #64748b; padding-bottom: 4px;">
                            <div style="width: 36px; height: 60%; background-color: #3b82f6; border-radius: 2px 2px 0 0;"><span style="font-size: 9px; color: white; font-weight: bold;">5.12%</span></div>
                            <div style="width: 36px; height: 75%; background-color: #2563eb; border-radius: 2px 2px 0 0;"><span style="font-size: 9px; color: white; font-weight: bold;">5.43%</span></div>
                            <div style="width: 36px; height: 90%; background-color: #1d4ed8; border-radius: 2px 2px 0 0;"><span style="font-size: 9px; color: white; font-weight: bold;">5.58%</span></div>
                            <div style="width: 36px; height: 100%; background-color: #1e40af; border-radius: 2px 2px 0 0;"><span style="font-size: 9px; color: white; font-weight: bold;">5.75%</span></div>
                          </div>
                          <p style="font-size: 9px; color: #64748b; margin-top: 6px;">Realisasi 2024 s/d Target RKPD 2027 (%)</p>
                        </div>
                      `;
                      execCmd('insertHTML', chartSample);
                    }}
                    disabled={!activeSection?.canEdit}
                    className="word-ribbon-btn-large"
                    title="Sisipkan Grafik RKPD"
                  >
                    <BarChart3 className="w-5 h-5 text-amber-600 mb-0.5" />
                    <span className="text-[10px]">Chart</span>
                  </button>
                </div>
                <div className="word-ribbon-group-label">
                  <span>Illustrations</span>
                </div>
              </div>

              {/* Links Group */}
              <div className="word-ribbon-group">
                <div className="flex flex-col gap-0.5 my-auto">
                  <button
                    onClick={() => {
                      const url = prompt('Masukkan tautan URL website:');
                      if (url) execCmd('createLink', url);
                    }}
                    disabled={!activeSection?.canEdit}
                    className="word-ribbon-btn-small"
                  >
                    <LinkIcon className="w-3.5 h-3.5 text-blue-700" />
                    <span>Link</span>
                  </button>
                  <button
                    onClick={() => alert('Bookmark telah ditandai pada posisi kursor.')}
                    disabled={!activeSection?.canEdit}
                    className="word-ribbon-btn-small"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Bookmark</span>
                  </button>
                </div>
                <div className="word-ribbon-group-label">
                  <span>Links</span>
                </div>
              </div>

              {/* Comments Group */}
              <div className="word-ribbon-group">
                <button
                  onClick={() => setShowReviewPane(true)}
                  className="word-ribbon-btn-large my-auto"
                  title="Beri Catatan Review Perbaikan"
                >
                  <MessageSquare className="w-5 h-5 text-emerald-700 mb-0.5" />
                  <span className="text-[10px]">Comment</span>
                </button>
                <div className="word-ribbon-group-label">
                  <span>Comments</span>
                </div>
              </div>

              {/* Text Group */}
              <div className="word-ribbon-group">
                <div className="flex items-center gap-1 my-auto">
                  <button
                    onClick={insertOfficialKop}
                    disabled={!activeSection?.canEdit}
                    className="word-ribbon-btn-large"
                    title="Sisipkan Kop Lampiran Perbup Cilacap Resmi"
                  >
                    <FileText className="w-5 h-5 text-blue-900 mb-0.5" />
                    <span className="text-[10px]">Kop Perbup</span>
                  </button>
                  <button
                    onClick={insertBupatiSignature}
                    disabled={!activeSection?.canEdit}
                    className="word-ribbon-btn-large"
                    title="Sisipkan Blok Tanda Tangan Plt. Bupati Cilacap"
                  >
                    <Check className="w-5 h-5 text-blue-900 mb-0.5" />
                    <span className="text-[10px]">TTD Bupati</span>
                  </button>
                  <button
                    onClick={insertOfficialParafTable}
                    disabled={!activeSection?.canEdit}
                    className="word-ribbon-btn-large"
                    title="Sisipkan Tabel Paraf Koordinasi (Cyan Border)"
                  >
                    <TableIcon className="w-5 h-5 text-cyan-600 mb-0.5" />
                    <span className="text-[10px]">Tabel Paraf</span>
                  </button>
                </div>
                <div className="word-ribbon-group-label">
                  <span>Text</span>
                </div>
              </div>

              {/* Symbols Group */}
              <div className="word-ribbon-group">
                <div className="flex flex-col gap-0.5 my-auto">
                  <button
                    onClick={() => {
                      const eq = prompt('Masukkan rumus matematika atau lambang statistik (contoh: Y = a + bX):', 'Y = \\alpha + \\beta X');
                      if (eq) execCmd('insertHTML', `<em>[Rumus: <strong>${eq}</strong>]</em> `);
                    }}
                    disabled={!activeSection?.canEdit}
                    className="word-ribbon-btn-small"
                  >
                    <span className="font-serif font-bold text-xs text-purple-700">π</span>
                    <span>Equation</span>
                  </button>
                  <button
                    onClick={() => setShowSymbolPicker(!showSymbolPicker)}
                    disabled={!activeSection?.canEdit}
                    className="word-ribbon-btn-small"
                  >
                    <span className="font-serif font-bold text-xs text-amber-700">Ω</span>
                    <span>Symbol ▼</span>
                  </button>
                </div>
                {showSymbolPicker && (
                  <div className="absolute top-28 bg-white border border-slate-300 shadow-2xl rounded-xl p-2 z-50 grid grid-cols-6 gap-1 w-44 font-mono text-xs">
                    {['°', '±', '•', '—', '©', '®', '™', '§', '¶', '≤', '≥', '≠'].map(sym => (
                      <button
                        key={sym}
                        onClick={() => {
                          execCmd('insertText', sym);
                          setShowSymbolPicker(false);
                        }}
                        className="p-1 hover:bg-blue-100 rounded text-center font-bold"
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                )}
                <div className="word-ribbon-group-label">
                  <span>Symbols</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DESIGN (Image 3) */}
          {activeRibbonTab === 'DESIGN' && (
            <div className="flex items-center space-x-1">
              {/* Document Formatting Group */}
              <div className="word-ribbon-group">
                <div className="flex items-center gap-1.5 my-auto">
                  <button
                    onClick={() => setShowThemePicker(!showThemePicker)}
                    className="word-ribbon-btn-large"
                    title="Tema Dokumen Resmi RKPD"
                  >
                    <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-600 to-indigo-800 text-white flex items-center justify-center font-bold text-xs mb-0.5 shadow-xs">
                      Aa
                    </div>
                    <span className="text-[10px]">Themes ▼</span>
                  </button>

                  {[
                    { id: 'PERBUP', name: 'Perbup Cilacap', font: 'Bookman Old Style', desc: 'Resmi 12pt 1.45 spasi' },
                    { id: 'GOVERNMENT', name: 'Pemerintahan', font: 'Times New Roman', desc: 'Standar 12pt 1.5 spasi' },
                    { id: 'MODERN', name: 'Modern RKPD', font: 'Calibri', desc: 'Bersih 11pt 1.15 spasi' },
                    { id: 'FORMAL', name: 'Naskah Formal', font: 'Georgia', desc: 'Elegan 11.5pt' }
                  ].map(thm => (
                    <div
                      key={thm.id}
                      onClick={() => applyTheme(thm.id)}
                      className={`word-style-card ${activeTheme === thm.id ? 'border-[#185abd] ring-1 ring-[#185abd] bg-blue-50/50' : ''}`}
                      title={`Terapkan tema tata letak: ${thm.name}`}
                    >
                      <span className="text-[11px] font-bold text-slate-800 truncate">{thm.name}</span>
                      <span className="text-[9px] text-blue-700 font-mono truncate">{thm.font}</span>
                      <span className="text-[8px] text-slate-400 truncate">{thm.desc}</span>
                    </div>
                  ))}
                </div>
                <div className="word-ribbon-group-label">
                  <span>Document Formatting</span>
                </div>
              </div>

              {/* Page Background Group */}
              <div className="word-ribbon-group">
                <div className="flex items-center gap-1.5 my-auto">
                  {/* Watermark */}
                  <div className="relative">
                    <button
                      onClick={() => setShowWatermarkPicker(!showWatermarkPicker)}
                      className="word-ribbon-btn-large"
                      title="Atur Tanda Air / Watermark Dokumen"
                    >
                      <div className="w-5 h-5 flex items-center justify-center border border-red-500 rounded text-red-600 font-extrabold text-xs mb-0.5 transform -rotate-12">
                        A
                      </div>
                      <span className="text-[10px]">Watermark ▼</span>
                    </button>
                    {showWatermarkPicker && (
                      <div className="absolute left-0 top-full mt-1 bg-white border border-slate-300 shadow-xl rounded-lg p-2 z-50 w-48 text-xs font-sans">
                        <span className="font-bold text-[10px] text-slate-400 uppercase px-2 py-0.5 block">Pilih Watermark:</span>
                        {['', 'DRAFT', 'RAHASIA', 'CONFIDENTIAL', 'PERBUP 2027'].map(wm => (
                          <button
                            key={wm}
                            onClick={() => {
                              setWatermark(wm);
                              setShowWatermarkPicker(false);
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between ${watermark === wm ? 'bg-blue-100 font-bold text-blue-900' : 'hover:bg-slate-100'}`}
                          >
                            <span>{wm || 'Tanpa Watermark'}</span>
                            {watermark === wm && <Check className="w-3 h-3 text-blue-700" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Page Color */}
                  <div className="relative">
                    <button
                      onClick={() => setShowPageColorPicker(!showPageColorPicker)}
                      className="word-ribbon-btn-large"
                      title="Warna Kertas Naskah (Page Color)"
                    >
                      <PaintBucket className="w-5 h-5 text-indigo-700 mb-0.5" />
                      <span className="text-[10px]">Page Color ▼</span>
                    </button>
                    {showPageColorPicker && (
                      <div className="absolute left-0 top-full mt-1 bg-white border border-slate-300 shadow-xl rounded-lg p-2 z-50 w-48 text-xs font-sans">
                        <span className="font-bold text-[10px] text-slate-400 uppercase px-2 py-0.5 block">Warna Kertas Naskah:</span>
                        {[
                          { label: 'Putih Bersih (Standar)', color: '#ffffff' },
                          { label: 'Krem Naskah (Ivory)', color: '#fffdf7' },
                          { label: 'Abu-abu Lembut', color: '#f8fafc' },
                          { label: 'Biru Lembut', color: '#f0f9ff' },
                          { label: 'Hijau Lembut', color: '#f0fdf4' }
                        ].map(pc => (
                          <button
                            key={pc.color}
                            onClick={() => {
                              setPageColor(pc.color);
                              setShowPageColorPicker(false);
                            }}
                            className="w-full text-left px-2 py-1.5 rounded flex items-center justify-between hover:bg-slate-100"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded border border-slate-300" style={{ backgroundColor: pc.color }} />
                              <span>{pc.label}</span>
                            </div>
                            {pageColor === pc.color && <Check className="w-3 h-3 text-blue-700" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Page Borders */}
                  <div className="relative">
                    <button
                      onClick={() => setShowPageBorderPicker(!showPageBorderPicker)}
                      className="word-ribbon-btn-large"
                      title="Bingkai Tepi Halaman (Page Borders)"
                    >
                      <div className="w-5 h-5 border-2 border-orange-500 rounded-xs mb-0.5 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 border border-dashed border-orange-400" />
                      </div>
                      <span className="text-[10px]">Page Borders ▼</span>
                    </button>
                    {showPageBorderPicker && (
                      <div className="absolute left-0 top-full mt-1 bg-white border border-slate-300 shadow-xl rounded-lg p-2 z-50 w-48 text-xs font-sans">
                        <span className="font-bold text-[10px] text-slate-400 uppercase px-2 py-0.5 block">Bingkai Halaman:</span>
                        {[
                          { id: 'none', label: 'Tanpa Bingkai' },
                          { id: 'box', label: 'Garis Kotak (Box Border)' },
                          { id: 'double', label: 'Garis Ganda Formal' },
                          { id: 'shadow', label: 'Bingkai Bayangan (Shadow)' },
                          { id: 'perbup', label: 'Bingkai Resmi Perbup' }
                        ].map(pb => (
                          <button
                            key={pb.id}
                            onClick={() => {
                              setPageBorder(pb.id);
                              setShowPageBorderPicker(false);
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between ${pageBorder === pb.id ? 'bg-blue-100 font-bold text-blue-900' : 'hover:bg-slate-100'}`}
                          >
                            <span>{pb.label}</span>
                            {pageBorder === pb.id && <Check className="w-3 h-3 text-blue-700" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="word-ribbon-group-label">
                  <span>Page Background</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LAYOUT (Image 4) */}
          {activeRibbonTab === 'LAYOUT' && (
            <div className="flex items-center space-x-1">
              {/* Page Setup Group */}
              <div className="word-ribbon-group">
                <div className="flex items-center gap-1.5 my-auto">
                  <button
                    onClick={() => setShowPageSetupModal(true)}
                    className="word-ribbon-btn-large"
                    title="Atur Margin Presisi Dokumen"
                  >
                    <div className="w-5 h-5 border border-slate-400 rounded-xs mb-0.5 flex items-center justify-center p-0.5">
                      <div className="w-full h-full border border-dashed border-blue-600" />
                    </div>
                    <span className="text-[10px]">Margins ▼</span>
                  </button>

                  <button
                    onClick={() => setOrientation(orientation === 'PORTRAIT' ? 'LANDSCAPE' : 'PORTRAIT')}
                    className="word-ribbon-btn-large"
                    title="Ubah Orientasi Naskah: Potret / Lanskap"
                  >
                    <div className={`border border-blue-600 bg-blue-50 mb-0.5 transition-all ${orientation === 'PORTRAIT' ? 'w-3.5 h-5' : 'w-5 h-3.5'}`} />
                    <span className="text-[10px]">Orientation ▼</span>
                  </button>

                  <button
                    onClick={() => {
                      const nextSize = paperSize === 'A4' ? 'F4' : paperSize === 'F4' ? 'LETTER' : 'A4';
                      setPaperSize(nextSize);
                    }}
                    className="word-ribbon-btn-large"
                    title="Ubah Ukuran Kertas (A4, F4 Folio, Letter)"
                  >
                    <div className="w-5 h-5 border border-slate-500 rounded-xs mb-0.5 flex items-center justify-center font-bold text-[9px] text-blue-700">
                      {paperSize}
                    </div>
                    <span className="text-[10px]">Size ▼</span>
                  </button>

                  <button
                    onClick={() => setTextColumns(textColumns === 1 ? 2 : 1)}
                    className="word-ribbon-btn-large"
                    title="Bagi Teks Menjadi Kolom"
                  >
                    <Columns className="w-5 h-5 text-blue-700 mb-0.5" />
                    <span className="text-[10px]">{textColumns} Kolom</span>
                  </button>

                  <div className="flex flex-col gap-0.5 pl-1 border-l border-slate-300">
                    <button onClick={insertPageBreak} className="word-ribbon-btn-small">
                      <Split className="w-3 h-3 text-purple-700" />
                      <span className="text-[10px]">Breaks</span>
                    </button>
                    <button onClick={() => alert('Penomoran baris aktif')} className="word-ribbon-btn-small">
                      <span className="text-[10px] font-mono font-bold text-slate-600">123</span>
                      <span className="text-[10px]">Line Numbers</span>
                    </button>
                  </div>
                </div>
                <div className="word-ribbon-group-label">
                  <span>Page Setup</span>
                  <button onClick={() => setShowPageSetupModal(true)} className="absolute right-0 text-[8px] opacity-60 hover:opacity-100">↘</button>
                </div>
              </div>

              {/* Paragraph Indent & Spacing Spinboxes (Exact copy of Screenshot 4!) */}
              <div className="word-ribbon-group">
                <div className="flex items-center gap-3 my-auto text-xs font-sans text-slate-700">
                  {/* Indent column */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Indent</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-600 w-10">Left:</span>
                      <input
                        type="number"
                        step="0.1"
                        value={marginCm.left}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setMarginCm(prev => ({ ...prev, left: val }));
                          setMarginPreset('CUSTOM');
                        }}
                        className="word-spinbox"
                      />
                      <span className="text-[10px] text-slate-400">cm</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-600 w-10">Right:</span>
                      <input
                        type="number"
                        step="0.1"
                        value={marginCm.right}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setMarginCm(prev => ({ ...prev, right: val }));
                          setMarginPreset('CUSTOM');
                        }}
                        className="word-spinbox"
                      />
                      <span className="text-[10px] text-slate-400">cm</span>
                    </div>
                  </div>

                  {/* Spacing column */}
                  <div className="flex flex-col gap-1 pl-2 border-l border-slate-300">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Spacing</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-600 w-10">Before:</span>
                      <input
                        type="number"
                        step="1"
                        value={spacingBeforePt}
                        onChange={(e) => setSpacingBeforePt(parseInt(e.target.value) || 0)}
                        className="word-spinbox"
                      />
                      <span className="text-[10px] text-slate-400">pt</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-600 w-10">After:</span>
                      <input
                        type="number"
                        step="1"
                        value={spacingAfterPt}
                        onChange={(e) => setSpacingAfterPt(parseInt(e.target.value) || 0)}
                        className="word-spinbox"
                      />
                      <span className="text-[10px] text-slate-400">pt</span>
                    </div>
                  </div>
                </div>
                <div className="word-ribbon-group-label">
                  <span>Paragraph</span>
                  <span className="absolute right-0 text-[8px] opacity-40">↘</span>
                </div>
              </div>

              {/* Arrange Group */}
              <div className="word-ribbon-group">
                <div className="flex items-center gap-1 my-auto">
                  <button
                    onClick={() => setShowPageSetupModal(true)}
                    className="word-ribbon-btn-large"
                    title="Pengaturan Halaman & Margin Perbup Cilacap"
                  >
                    <Sliders className="w-5 h-5 text-indigo-700 mb-0.5" />
                    <span className="text-[10px]">Selection Pane</span>
                  </button>
                </div>
                <div className="word-ribbon-group-label">
                  <span>Arrange</span>
                </div>
              </div>

              {/* Table AutoFit & Anti-Overflow Group ala Word */}
              <div className="word-ribbon-group">
                <div className="flex items-center gap-1.5 my-auto">
                  <button
                    onClick={() => handleAutoFitTables()}
                    className="word-ribbon-btn-large bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200"
                    title="AutoFit ke Halaman ala Word: Sesuaikan tabel dengan batas margin kertas Folio tanpa overflow"
                  >
                    <TableIcon className="w-5 h-5 text-emerald-700 mb-0.5" />
                    <span className="text-[10px] font-bold text-emerald-900">AutoFit Table</span>
                  </button>

                  <div className="flex flex-col gap-1 pl-1 border-l border-slate-300">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-500 font-medium">Font:</span>
                      <select
                        value={tableFontSize}
                        onChange={(e) => handleSetTableFontSize(e.target.value)}
                        className="px-1 py-0.5 bg-white border border-slate-300 rounded text-[10px] text-slate-700 font-semibold focus:outline-none cursor-pointer"
                        title="Ukuran font tabel (Standar 9pt / 8.5pt untuk matriks lebar)"
                      >
                        <option value="8pt">8pt (Sangat Padat)</option>
                        <option value="8.5pt">8.5pt (Matriks 10+ Kolom)</option>
                        <option value="9pt">9pt (Standar Bab II/IV)</option>
                        <option value="10pt">10pt (Standar Bab I/III/V)</option>
                        <option value="11pt">11pt (Tabel Besar)</option>
                      </select>
                    </div>

                    <button
                      onClick={() => toggleSectionOrientation()}
                      className="px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded border border-blue-200 text-[10px] font-semibold flex items-center gap-1"
                      title="Ubah Orientasi Sub-Bab (Lanskap / Potret)"
                    >
                      <LayoutTemplate className="w-2.5 h-2.5" />
                      <span>{orientation === 'LANDSCAPE' ? 'Set Potret' : 'Set Lanskap'}</span>
                    </button>
                  </div>
                </div>
                <div className="word-ribbon-group-label">
                  <span>Tabel & Layout</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: REFERENCES (Image 5) */}
          {activeRibbonTab === 'REFERENCES' && (
            <div className="flex items-center space-x-1">
              {/* Table of Contents Group */}
              <div className="word-ribbon-group">
                <div className="flex items-center gap-1 my-auto">
                  <button
                    onClick={insertTableOfContents}
                    disabled={!activeSection?.canEdit}
                    className="word-ribbon-btn-large"
                    title="Sisipkan Daftar Isi Otomatis Lengkap Berdasarkan Bab dan Sub-Bab"
                  >
                    <BookOpen className="w-5 h-5 text-blue-800 mb-0.5" />
                    <span className="text-[10px]">Table of Contents ▼</span>
                  </button>
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => alert('Level Heading ditambahkan ke Daftar Isi')}
                      className="word-ribbon-btn-small"
                    >
                      <Plus className="w-3 h-3 text-emerald-700" />
                      <span className="text-[10px]">Add Text</span>
                    </button>
                    <button
                      onClick={insertTableOfContents}
                      className="word-ribbon-btn-small"
                    >
                      <RotateCcw className="w-3 h-3 text-blue-700" />
                      <span className="text-[10px]">Update Table</span>
                    </button>
                  </div>
                </div>
                <div className="word-ribbon-group-label">
                  <span>Table of Contents</span>
                </div>
              </div>

              {/* Footnotes Group */}
              <div className="word-ribbon-group">
                <div className="flex items-center gap-1 my-auto">
                  <button
                    onClick={() => {
                      const note = prompt('Masukkan catatan kaki (Footnote):', 'Bappeda Kabupaten Cilacap');
                      if (note) insertFootnote(note);
                    }}
                    disabled={!activeSection?.canEdit}
                    className="word-ribbon-btn-large"
                    title="Sisipkan Catatan Kaki (Insert Footnote)"
                  >
                    <div className="flex items-center justify-center font-serif text-sm font-bold text-blue-900 mb-0.5">
                      ab<sup className="text-[9px] text-red-600">1</sup>
                    </div>
                    <span className="text-[10px]">Insert Footnote</span>
                  </button>
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => {
                        const note = prompt('Masukkan catatan akhir (Endnote):', 'Keputusan Bupati Cilacap');
                        if (note) execCmd('insertHTML', `<sup>[i: ${note}]</sup> `);
                      }}
                      className="word-ribbon-btn-small"
                    >
                      <span className="text-[9px] font-serif font-bold text-blue-800">[i]</span>
                      <span className="text-[10px]">Insert Endnote</span>
                    </button>
                    <button
                      onClick={() => alert('Menampilkan catatan kaki dokumen')}
                      className="word-ribbon-btn-small"
                    >
                      <span className="text-[10px]">Show Notes</span>
                    </button>
                  </div>
                </div>
                <div className="word-ribbon-group-label">
                  <span>Footnotes</span>
                  <span className="absolute right-0 text-[8px] opacity-40">↘</span>
                </div>
              </div>

              {/* Citations & Bibliography Group */}
              <div className="word-ribbon-group">
                <div className="flex items-center gap-1 my-auto">
                  <button
                    onClick={() => {
                      const source = prompt('Masukkan sitasi / rujukan (misal: Permendagri No. 86 Tahun 2017):', 'Permendagri No. 86 Tahun 2017');
                      if (source) execCmd('insertHTML', `<em>(${source})</em> `);
                    }}
                    disabled={!activeSection?.canEdit}
                    className="word-ribbon-btn-large"
                    title="Sisipkan Sitasi Dokumen / Regulasi"
                  >
                    <Quote className="w-5 h-5 text-indigo-700 mb-0.5" />
                    <span className="text-[10px]">Insert Citation ▼</span>
                  </button>
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => alert('Gaya Sitasi: Standar Permendagri / APA')}
                      className="word-ribbon-btn-small"
                    >
                      <span className="text-[10px] font-semibold text-slate-700">Style: APA ▼</span>
                    </button>
                    <button
                      onClick={() => {
                        const bibSample = `
                          <div style="border-top: 1px solid #94a3b8; margin-top: 24pt; padding-top: 12pt; font-family: inherit;">
                            <p style="font-weight: bold; font-size: 12pt; text-align: left;">DAFTAR PUSTAKA & DASAR HUKUM</p>
                            <p style="text-indent: -20px; padding-left: 20px; font-size: 10.5pt; margin: 4pt 0;">1. Undang-Undang Nomor 23 Tahun 2014 tentang Pemerintahan Daerah.</p>
                            <p style="text-indent: -20px; padding-left: 20px; font-size: 10.5pt; margin: 4pt 0;">2. Peraturan Menteri Dalam Negeri Nomor 86 Tahun 2017 tentang Tata Cara Perencanaan, Pengendalian dan Evaluasi Pembangunan Daerah.</p>
                            <p style="text-indent: -20px; padding-left: 20px; font-size: 10.5pt; margin: 4pt 0;">3. Rencana Pembangunan Daerah (RPD) Kabupaten Cilacap Tahun 2023-2026.</p>
                          </div>
                        `;
                        execCmd('insertHTML', bibSample);
                      }}
                      className="word-ribbon-btn-small"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-blue-700" />
                      <span className="text-[10px]">Bibliography</span>
                    </button>
                  </div>
                </div>
                <div className="word-ribbon-group-label">
                  <span>Citations & Bibliography</span>
                </div>
              </div>

              {/* Captions Group (EXACTLY AS IN SCREENSHOT 5!) */}
              <div className="word-ribbon-group">
                <div className="flex items-center gap-1 my-auto">
                  <button
                    onClick={() => setShowCaptionModal(true)}
                    disabled={!activeSection?.canEdit}
                    className="word-ribbon-btn-large bg-amber-50/80 hover:bg-amber-100 border-amber-200"
                    title="Sisipkan Judul / Keterangan Resmi Tabel atau Gambar (Insert Caption)"
                  >
                    <Tag className="w-5 h-5 text-amber-700 mb-0.5" />
                    <span className="text-[10px] font-bold text-amber-900">Insert Caption</span>
                  </button>
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => {
                        const figTableHtml = `
                          <div style="border: 1px solid #cbd5e1; background-color: #f8fafc; padding: 12pt; margin: 12pt 0; font-family: inherit;">
                            <p style="text-align: center; font-weight: bold; font-size: 12pt; margin: 0 0 8pt 0;">DAFTAR TABEL & GAMBAR</p>
                            <div style="display: flex; justify-content: space-between; font-size: 10.5pt; margin: 3pt 0;">
                              <span>Tabel 2.1. Perkembangan Capaian Indikator Makro Kabupaten Cilacap</span>
                              <span style="flex: 1; border-bottom: 1px dotted #94a3b8; margin: 0 8px 4px 8px;"></span>
                              <span>12</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 10.5pt; margin: 3pt 0;">
                              <span>Gambar 2.1. Peta Administrasi Wilayah Kabupaten Cilacap</span>
                              <span style="flex: 1; border-bottom: 1px dotted #94a3b8; margin: 0 8px 4px 8px;"></span>
                              <span>18</span>
                            </div>
                          </div>
                        `;
                        execCmd('insertHTML', figTableHtml);
                      }}
                      className="word-ribbon-btn-small"
                    >
                      <span className="text-[10px]">Insert Table of Figures</span>
                    </button>
                    <button
                      onClick={() => alert('Daftar Tabel & Gambar diperbarui!')}
                      className="word-ribbon-btn-small"
                    >
                      <span className="text-[10px]">Update Table</span>
                    </button>
                  </div>
                </div>
                <div className="word-ribbon-group-label">
                  <span>Captions</span>
                </div>
              </div>

              {/* Index Group */}
              <div className="word-ribbon-group">
                <div className="flex flex-col gap-0.5 my-auto">
                  <button
                    onClick={() => alert('Kata terpilih ditandai sebagai entri indeks')}
                    className="word-ribbon-btn-small"
                  >
                    <span className="text-[10px]">Mark Entry</span>
                  </button>
                  <button
                    onClick={() => alert('Indeks dokumen disisipkan')}
                    className="word-ribbon-btn-small"
                  >
                    <span className="text-[10px]">Insert Index</span>
                  </button>
                </div>
                <div className="word-ribbon-group-label">
                  <span>Index</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: REVIEW */}
          {activeRibbonTab === 'REVIEW' && (
            <div className="flex items-center space-x-1">
              <div className="word-ribbon-group">
                <div className="flex items-center gap-1 my-auto">
                  <button
                    onClick={() => setShowStatsModal(true)}
                    className="word-ribbon-btn-large"
                  >
                    <Sparkles className="w-5 h-5 text-purple-600 mb-0.5" />
                    <span className="text-[10px]">Statistik & Hitung Kata</span>
                  </button>
                </div>
                <div className="word-ribbon-group-label">
                  <span>Proofing</span>
                </div>
              </div>

              <div className="word-ribbon-group">
                <div className="flex items-center gap-1 my-auto">
                  <button
                    onClick={() => setShowReviewPane(true)}
                    className="word-ribbon-btn-large"
                  >
                    <MessageSquare className="w-5 h-5 text-amber-600 mb-0.5" />
                    <span className="text-[10px]">Catatan ({comments.length})</span>
                  </button>
                </div>
                <div className="word-ribbon-group-label">
                  <span>Comments</span>
                </div>
              </div>

              {/* Consistency Checker Ribbon Tool */}
              <div className="word-ribbon-group">
                <div className="flex items-center gap-1 my-auto">
                  <button
                    onClick={onOpenConsistencyModal}
                    className="word-ribbon-btn-large bg-amber-50 hover:bg-amber-100/80 border-amber-300 text-amber-900"
                    title="Audit & Cek Konsistensi Antar Bab (Makro, Keuangan, Nomenklatur, Tabel/Gambar)"
                  >
                    <FileCheck className="w-5 h-5 text-amber-600 mb-0.5" />
                    <span className="text-[10px] font-bold">Uji Konsistensi</span>
                  </button>
                </div>
                <div className="word-ribbon-group-label">
                  <span>Audit Bab</span>
                </div>
              </div>

              {currentUser.role === 'ADMIN' && (
                <div className="word-ribbon-group">
                  <div className="flex items-center gap-1 my-auto">
                    <button
                      onClick={onOpenMatrixModal}
                      className="word-ribbon-btn-large"
                    >
                      <Shield className="w-5 h-5 text-indigo-600 mb-0.5" />
                      <span className="text-[10px]">Hak Akses OPD</span>
                    </button>
                  </div>
                  <div className="word-ribbon-group-label">
                    <span>Protect</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: VIEW */}
          {activeRibbonTab === 'VIEW' && (
            <div className="flex items-center space-x-1">
              <div className="word-ribbon-group">
                <div className="flex items-center gap-1.5 my-auto">
                  <button
                    onClick={() => setViewMode('FULL_DOCUMENT')}
                    className={`word-ribbon-btn-large ${viewMode === 'FULL_DOCUMENT' ? 'bg-blue-100 font-bold text-blue-900 border-blue-300' : ''}`}
                  >
                    <FileText className="w-5 h-5 text-blue-700 mb-0.5" />
                    <span className="text-[10px]">Dokumen Utuh</span>
                  </button>
                  <button
                    onClick={() => setViewMode('SECTION_EDITOR')}
                    className={`word-ribbon-btn-large ${viewMode === 'SECTION_EDITOR' ? 'bg-blue-100 font-bold text-blue-900 border-blue-300' : ''}`}
                  >
                    <Type className="w-5 h-5 text-blue-700 mb-0.5" />
                    <span className="text-[10px]">Per Sub-Bab</span>
                  </button>
                </div>
                <div className="word-ribbon-group-label">
                  <span>Views</span>
                </div>
              </div>

              <div className="word-ribbon-group">
                <div className="flex flex-col gap-1 my-auto text-xs text-slate-700 px-1">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showRuler}
                      onChange={(e) => setShowRuler(e.target.checked)}
                      className="rounded text-blue-600 w-3.5 h-3.5"
                    />
                    <span className="font-semibold text-[11px]">Penggaris (Ruler)</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showGridlines}
                      onChange={(e) => setShowGridlines(e.target.checked)}
                      className="rounded text-blue-600 w-3.5 h-3.5"
                    />
                    <span className="font-semibold text-[11px]">Garis Kisi (Gridlines)</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showNavPane}
                      onChange={(e) => setShowNavPane(e.target.checked)}
                      className="rounded text-blue-600 w-3.5 h-3.5"
                    />
                    <span className="font-semibold text-[11px]">Panel Navigasi</span>
                  </label>
                </div>
                <div className="word-ribbon-group-label">
                  <span>Show</span>
                </div>
              </div>

              <div className="word-ribbon-group">
                <div className="flex items-center gap-1.5 my-auto">
                  <button
                    onClick={() => setZoomLevel(100)}
                    className="word-ribbon-btn-large"
                  >
                    <ZoomIn className="w-5 h-5 text-blue-700 mb-0.5" />
                    <span className="text-[10px]">100% Zoom</span>
                  </button>
                </div>
                <div className="word-ribbon-group-label">
                  <span>Zoom</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ================= FLOATING FIND & REPLACE BAR (Ctrl+F) ================= */}
      {showFindReplace && (
        <div className="bg-white border-b border-slate-300 px-4 py-2 flex items-center justify-between text-xs shadow-sm z-30 shrink-0">
          <div className="flex items-center space-x-2 flex-1 max-w-2xl">
            <div className="flex items-center space-x-1">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kata..."
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFind()}
                className="px-2 py-1 border border-slate-300 rounded text-xs w-44 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleFind}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded font-semibold"
              >
                Cari
              </button>
            </div>

            <div className="flex items-center space-x-1">
              <Replace className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Ganti dengan..."
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                className="px-2 py-1 border border-slate-300 rounded text-xs w-44 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleReplace}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded font-semibold"
              >
                Ganti
              </button>
              <button
                onClick={handleReplaceAll}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold"
              >
                Ganti Semua
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowFindReplace(false)}
            className="p-1 rounded hover:bg-slate-200 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Closed Stage Read-Only Banner */}
      {(doc?.isStageClosed || doc?.stage?.status === 'CLOSED') && (
        <div className="bg-emerald-700 text-white px-4 py-2 text-xs font-medium flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0 text-emerald-200" />
            <span>
              <strong>Arsip Resmi Tahapan Ditutup (Read-Only):</strong> Naskah ini berasal dari Tahapan yang telah di-Closing. Anda dapat melihat pratinjau, mencetak, atau mengekspor dokumen, namun tidak dapat melakukan perubahan teks atau status.
            </span>
          </div>
          <span className="text-[10px] bg-emerald-800 border border-emerald-600 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
            Arsip Terkunci
          </span>
        </div>
      )}

      {/* ================= 3. MAIN WORKSPACE WITH DESK & A4 PAPER ================= */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT: Word Navigation Pane */}
        <aside
          className={`${
            showNavPane ? 'w-64 sm:w-72' : 'w-0'
          } bg-white border-r border-[#d2d0ce] flex flex-col transition-all duration-200 overflow-hidden shrink-0 select-none shadow-sm font-sans`}
        >
          {/* Header ala Microsoft Word */}
          <div className="px-3 py-2 border-b border-[#e1dfdd] bg-[#f8f7f6] flex items-center justify-between">
            <div className="flex items-center space-x-1.5 font-bold text-xs text-slate-800">
              <FolderTree className="w-3.5 h-3.5 text-[#185abd]" />
              <span>Navigation</span>
            </div>
            <button
              onClick={() => setShowNavPane(false)}
              className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
              title="Tutup Panel Navigasi"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search Box ala Word */}
          <div className="p-2 border-b border-[#e1dfdd] bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search document"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1 text-xs bg-[#f3f2f1] hover:bg-white focus:bg-white border border-[#d2d0ce] rounded focus:outline-none focus:border-[#185abd] transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                  title="Hapus pencarian"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Word Navigation Tabs: Headings | Pages | Results */}
          <div className="flex border-b border-[#e1dfdd] bg-white text-xs select-none">
            <button
              onClick={() => setNavTab('HEADINGS')}
              className={`flex-1 py-1.5 text-center transition font-medium border-b-2 text-[11px] ${
                navTab === 'HEADINGS'
                  ? 'border-[#185abd] text-[#185abd] font-bold bg-blue-50/20'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Headings
            </button>
            <button
              onClick={() => setNavTab('PAGES')}
              className={`flex-1 py-1.5 text-center transition font-medium border-b-2 text-[11px] ${
                navTab === 'PAGES'
                  ? 'border-[#185abd] text-[#185abd] font-bold bg-blue-50/20'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Pages
            </button>
            <button
              onClick={() => setNavTab('RESULTS')}
              className={`flex-1 py-1.5 text-center transition font-medium border-b-2 text-[11px] ${
                navTab === 'RESULTS'
                  ? 'border-[#185abd] text-[#185abd] font-bold bg-blue-50/20'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Results {searchQuery.trim() ? `(${filteredSections.length})` : ''}
            </button>
          </div>

          {/* TAB 1: HEADINGS OUTLINE */}
          {navTab === 'HEADINGS' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Quick Toolbar for Tree & Tasks */}
              <div className="px-2 py-1.5 bg-[#faf9f8] border-b border-[#e1dfdd] flex items-center justify-between text-[10px] gap-1 shrink-0">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setFilterType('ALL')}
                    className={`px-1.5 py-0.5 rounded font-semibold transition ${
                      filterType === 'ALL' ? 'bg-[#185abd] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Semua ({sections.length})
                  </button>

                  {currentUser?.role === 'CONTRIBUTOR' && (
                    <>
                      <button
                        onClick={() => setFilterType('MY_TASKS')}
                        className={`px-1.5 py-0.5 rounded font-semibold transition ${
                          filterType === 'MY_TASKS' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                        title="Sub-bab yang ditugaskan kepada Anda"
                      >
                        Tugas Saya ({mySectionsCount})
                      </button>
                      <button
                        onClick={() => setFilterType('READ_ONLY')}
                        className={`px-1.5 py-0.5 rounded font-semibold transition flex items-center gap-0.5 ${
                          filterType === 'READ_ONLY' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        title="Sub-bab milik kontributor lain (Mode Lihat Saja)"
                      >
                        <Eye className="w-2.5 h-2.5" />
                        <span>Lihat Saja ({readOnlySectionsCount})</span>
                      </button>
                    </>
                  )}

                  {currentUser?.role === 'REVIEWER' && (
                    <button
                      onClick={() => setFilterType('REVIEW')}
                      className={`px-1.5 py-0.5 rounded font-semibold transition ${
                        filterType === 'REVIEW' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
                      }`}
                    >
                      Review ({reviewSectionsCount})
                    </button>
                  )}

                  {currentUser?.role === 'ADMIN' && (
                    <>
                      <button
                        onClick={() => setFilterType('MY_TASKS')}
                        className={`px-1.5 py-0.5 rounded font-semibold transition ${
                          filterType === 'MY_TASKS' ? 'bg-[#185abd] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Tugas Saya
                      </button>
                      <button
                        onClick={() => setFilterType('REVIEW')}
                        className={`px-1.5 py-0.5 rounded font-semibold transition ${
                          filterType === 'REVIEW' ? 'bg-[#185abd] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Review ({reviewSectionsCount})
                      </button>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleExpandAllNav}
                    className="px-1 py-0.5 text-[9px] text-slate-500 hover:text-[#185abd] hover:bg-slate-200 rounded transition"
                    title="Buka seluruh sub-bab"
                  >
                    Buka Semua
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={handleCollapseSubLevelsNav}
                    className="px-1 py-0.5 text-[9px] text-slate-500 hover:text-[#185abd] hover:bg-slate-200 rounded transition"
                    title="Ringkas sub-level 4 dan 5"
                  >
                    Ringkas Level
                  </button>
                </div>
              </div>

              {/* Headings Outline Tree List */}
              <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
                {filteredSections.map((sec) => {
                  const isHidden = !searchQuery.trim() && isNavSectionHidden(sec, filteredSections);
                  if (isHidden) return null;

                  const isActive = sec.id === activeSectionId;
                  const isApproved = sec.status === 'APPROVED';
                  const hasChildren = hasNavChildren(sec, sections);
                  const isCollapsed = collapsedNavIds.has(sec.id);
                  const displayCode = (sec.code && !['SUB', 'POIN'].includes(sec.code.toUpperCase())) ? sec.code : '';
                  const displayTitle = (sec.title || '').replace(/\t\d+$/, '').trim();

                  // Compute Indentation exactly like Microsoft Word (Level 1: 4px, Level 2: 15px, Level 3: 26px, Level 4: 37px, Level 5: 48px)
                  const indentPx = Math.max(4, ((sec.level || 1) - 1) * 11 + 4);

                  // Font styling per level
                  let fontStyle = 'text-slate-700 text-[11px]';
                  if (sec.level === 1) fontStyle = 'font-bold text-slate-900 text-xs tracking-tight';
                  else if (sec.level === 2) fontStyle = 'font-bold text-slate-800 text-[11.5px]';
                  else if (sec.level === 3) fontStyle = 'font-semibold text-slate-800 text-[11px]';
                  else if (sec.level === 4) fontStyle = 'font-medium text-slate-700 text-[10.5px]';
                  else if (sec.level === 5) fontStyle = 'font-normal text-slate-600 text-[10.5px]';

                  return (
                    <div
                      key={sec.id}
                      onClick={() => handleNavClick(sec)}
                      className={`group py-1 px-1.5 rounded cursor-pointer transition flex items-center justify-between gap-1 select-none ${
                        isActive
                          ? 'bg-[#cfe4fa] text-[#0f3b7d] border-l-[3px] border-[#185abd] shadow-2xs'
                          : 'hover:bg-[#f3f2f1] text-slate-700'
                      }`}
                      style={{ paddingLeft: `${indentPx}px` }}
                    >
                      <div className="flex items-center min-w-0 flex-1">
                        {/* Word Toggle Arrow (◢ when open, ▶ when collapsed) */}
                        {hasChildren ? (
                          <button
                            type="button"
                            onClick={(e) => handleToggleNavCollapse(sec.id, e)}
                            className="w-3.5 h-3.5 flex items-center justify-center text-slate-500 hover:text-slate-800 shrink-0 select-none mr-0.5 rounded hover:bg-slate-200/60"
                            title={isCollapsed ? 'Buka Sub-bab' : 'Tutup Sub-bab'}
                          >
                            <span className="text-[9px] leading-none select-none">
                              {isCollapsed ? '▶' : '◢'}
                            </span>
                          </button>
                        ) : (
                          <span className="w-3.5 h-3.5 shrink-0 mr-0.5 inline-block" />
                        )}

                        {/* Title & Code */}
                        <span className={`truncate ${fontStyle} ${isActive ? 'text-[#0f3b7d] font-bold' : ''}`}>
                          {displayCode && (
                            <strong className={`${sec.level <= 3 ? 'font-bold mr-1' : 'font-semibold mr-1'} ${isActive ? 'text-[#185abd]' : 'text-slate-800'}`}>
                              {displayCode}
                            </strong>
                          )}
                          {displayTitle}
                        </span>
                      </div>

                      {/* Right Indicators: comments count, lock, approved, assignment tag */}
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        {currentUser?.role === 'CONTRIBUTOR' && (
                          (sec.assignedUserIds || []).includes(currentUser.id) ? (
                            <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-emerald-100 text-emerald-800" title="Tugas Tanggung Jawab Anda">
                              Tugas
                            </span>
                          ) : (
                            <span className="text-[8px] text-slate-400" title="Menu Lihat Saja (Read-Only)">
                              <Eye className="w-2.5 h-2.5" />
                            </span>
                          )
                        )}
                        {sec.comments?.length > 0 && (
                          <span className="text-[9px] font-bold px-1 rounded-full bg-amber-100 text-amber-800" title={`${sec.comments.length} Catatan Review`}>
                            {sec.comments.length}
                          </span>
                        )}
                        {sec.isLocked ? (
                          <Lock className="w-2.5 h-2.5 text-slate-400 shrink-0" title="Terkunci" />
                        ) : isApproved ? (
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" title="Disetujui" />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: PAGES THUMBNAILS */}
          {navTab === 'PAGES' && (
            <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-[#f8f7f6]">
              <div className="text-[10px] text-slate-500 font-medium px-1">
                Total {sections.length} bagian / halaman naskah:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {sections.map((sec, idx) => {
                  const isSelected = sec.id === activeSectionId;
                  const displayCode = sec.code || '';
                  const displayTitle = (sec.title || '').replace(/\t\d+$/, '').trim();
                  return (
                    <button
                      key={sec.id}
                      onClick={() => handleNavClick(sec)}
                      className={`flex flex-col items-center p-1.5 rounded border text-left transition bg-white shadow-2xs ${
                        isSelected
                          ? 'border-[#185abd] ring-2 ring-[#185abd]/30 bg-blue-50/40'
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <div className="w-full aspect-[1/1.3] bg-white border border-slate-200 rounded p-1.5 flex flex-col justify-between shadow-xs mb-1 overflow-hidden">
                        <div className="space-y-0.5">
                          <div className="h-1 bg-slate-300 rounded w-2/3" />
                          <div className="h-0.5 bg-slate-200 rounded w-full" />
                          <div className="h-0.5 bg-slate-200 rounded w-5/6" />
                          <div className="h-0.5 bg-slate-200 rounded w-4/5" />
                        </div>
                        <div className="text-[8px] font-mono text-center text-slate-400 border-t border-slate-100 pt-0.5">
                          Hal. {idx + 1}
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-800 line-clamp-1 w-full text-center">
                        {displayCode ? `${displayCode} ` : ''}{displayTitle}
                      </span>
                      <span className="text-[8px] text-slate-400">
                        Level {sec.level || 1} • {sec.status === 'APPROVED' ? 'Disetujui' : sec.status === 'REVIEW' ? 'Review' : 'Draft'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: RESULTS (SEARCH) */}
          {navTab === 'RESULTS' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {!searchQuery.trim() ? (
                <div className="flex-1 p-6 text-center text-slate-500 flex flex-col items-center justify-center">
                  <Search className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-700 mb-1">Hasil Pencarian</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-[200px]">
                    Ketik kata kunci di kotak pencarian di atas untuk melihat temuan di seluruh dokumen.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  <div className="text-[10px] text-slate-500 font-semibold px-1 pb-1 border-b border-slate-200">
                    Ditemukan {filteredSections.length} bagian naskah:
                  </div>
                  {filteredSections.map((sec) => {
                    const isActive = sec.id === activeSectionId;
                    const displayCode = sec.code || '';
                    const displayTitle = (sec.title || '').replace(/\t\d+$/, '').trim();
                    return (
                      <div
                        key={sec.id}
                        onClick={() => handleNavClick(sec)}
                        className={`p-2 rounded cursor-pointer transition border ${
                          isActive
                            ? 'bg-[#cfe4fa] border-[#185abd] text-[#0f3b7d]'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-1 font-bold text-xs text-slate-800 mb-0.5">
                          {displayCode && <span className="text-[#185abd]">{displayCode}</span>}
                          <span className="truncate">{displayTitle}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2">
                          <span>Level {sec.level || 1}</span>
                          <span>•</span>
                          <span>Status: {sec.status || 'DRAFT'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </aside>

        {!showNavPane && (
          <button
            onClick={() => setShowNavPane(true)}
            className="p-1.5 bg-white hover:bg-slate-100 border-r border-[#d2d0ce] text-slate-600 self-start mt-2 shadow-sm rounded-r z-20 shrink-0"
            title="Buka Navigasi Bab"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}

        {/* CENTER COLUMN: RULER + DESK CANVAS */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
          
          {/* HORIZONTAL RULER - PERFECTLY CENTERED WITH DOCUMENT DESK */}
          {showRuler && (
            <div className="word-ruler-container shrink-0">
              <div
                ref={rulerTrackRef}
                className="word-ruler-track"
                style={{
                  width: `${paperDims.width}px`,
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top center'
                }}
              >
                {/* Shaded Left Margin (Non-Printable Area) */}
                <div
                  className="absolute left-0 top-0 bottom-0 bg-[#d2d0ce] border-r border-[#a19f9d]"
                  style={{ width: `${marginCm.left * pxPerCm}px` }}
                  title={`Margin Kiri: ${marginCm.left.toFixed(1)} cm`}
                />

                {/* White Printable Area */}
                <div
                  className="absolute top-0 bottom-0 bg-white"
                  style={{
                    left: `${marginCm.left * pxPerCm}px`,
                    right: `${marginCm.right * pxPerCm}px`
                  }}
                />

                {/* Shaded Right Margin (Non-Printable Area) */}
                <div
                  className="absolute right-0 top-0 bottom-0 bg-[#d2d0ce] border-l border-[#a19f9d]"
                  style={{ width: `${marginCm.right * pxPerCm}px` }}
                  title={`Margin Kanan: ${marginCm.right.toFixed(1)} cm`}
                />

                {/* Tab Stop 'L' icon on far left of shaded margin */}
                <div
                  className="absolute left-1.5 top-0.5 text-[11px] font-mono font-bold text-slate-600 select-none cursor-pointer"
                  title="Tab Stop Kiri (Left Tab Stop)"
                >
                  L
                </div>

                {/* Left Margin Sub-Ticks (· | · |) */}
                {Array.from({ length: Math.floor(marginCm.left * 2) }).map((_, i) => {
                  const xPos = (i + 1) * 0.5 * pxPerCm;
                  const isHalf = (i + 1) % 2 === 0;
                  return (
                    <div
                      key={`left-sub-${i}`}
                      className="absolute top-0 w-px bg-slate-400/80 pointer-events-none"
                      style={{ left: `${xPos}px`, height: isHalf ? '5px' : '3px' }}
                    />
                  );
                })}

                {/* Centimeter Tick Marks & Number Labels inside Printable White Area */}
                {Array.from({ length: Math.max(1, Math.floor(totalPaperCm - marginCm.left - marginCm.right)) }).map((_, idx) => {
                  const cm = idx + 1;
                  const xPos = (marginCm.left + cm) * pxPerCm;
                  return (
                    <React.Fragment key={cm}>
                      <div
                        className="absolute top-1.5 w-[1.5px] h-[1.5px] rounded-full bg-slate-400 pointer-events-none"
                        style={{ left: `${xPos - (0.75 * pxPerCm)}px` }}
                      />
                      <div
                        className="absolute top-0 w-px bg-slate-400 pointer-events-none"
                        style={{ left: `${xPos - (0.5 * pxPerCm)}px`, height: '4px' }}
                      />
                      <div
                        className="absolute top-1.5 w-[1.5px] h-[1.5px] rounded-full bg-slate-400 pointer-events-none"
                        style={{ left: `${xPos - (0.25 * pxPerCm)}px` }}
                      />
                      <div
                        className="absolute top-0 w-px bg-slate-500 pointer-events-none"
                        style={{ left: `${xPos}px`, height: '6px' }}
                      />
                      <span
                        className="absolute top-1.5 text-[9px] text-[#605e5c] font-mono font-semibold pointer-events-none select-none transform -translate-x-1/2"
                        style={{ left: `${xPos}px` }}
                      >
                        {cm}
                      </span>
                    </React.Fragment>
                  );
                })}

                {/* Right Margin Sub-Ticks (· | · |) */}
                {Array.from({ length: Math.floor(marginCm.right * 2) }).map((_, i) => {
                  const xPos = paperDims.width - (marginCm.right * pxPerCm) + ((i + 1) * 0.5 * pxPerCm);
                  const isHalf = (i + 1) % 2 === 0;
                  return (
                    <div
                      key={`right-sub-${i}`}
                      className="absolute top-0 w-px bg-slate-400/80 pointer-events-none"
                      style={{ left: `${xPos}px`, height: isHalf ? '5px' : '3px' }}
                    />
                  );
                })}

                {/* MARKER 1: First Line Indent Marker */}
                <div
                  className="ruler-marker-handle group"
                  style={{
                    left: `${(marginCm.left + firstLineIndentCm) * pxPerCm}px`,
                    top: '0px',
                    transform: 'translateX(-50%)'
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveDrag('FIRST_LINE');
                  }}
                  title={`Indentasi Baris Pertama: ${firstLineIndentCm.toFixed(1)} cm`}
                >
                  <svg width="11" height="9" viewBox="0 0 11 9" className="drop-shadow-xs fill-slate-700 hover:fill-blue-700 transition-colors">
                    <polygon points="0,0 11,0 5.5,8" stroke="#334155" strokeWidth="0.8" />
                  </svg>
                </div>

                {/* MARKER 2: Left Margin Marker */}
                <div
                  className="ruler-marker-handle group"
                  style={{
                    left: `${marginCm.left * pxPerCm}px`,
                    bottom: '0px',
                    transform: 'translateX(-50%)'
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveDrag('LEFT_MARGIN');
                  }}
                  title={`Margin Kiri: ${marginCm.left.toFixed(1)} cm`}
                >
                  <div className="flex flex-col items-center">
                    <svg width="11" height="8" viewBox="0 0 11 8" className="drop-shadow-xs fill-slate-700 hover:fill-blue-700 transition-colors">
                      <polygon points="5.5,0 11,8 0,8" stroke="#334155" strokeWidth="0.8" />
                    </svg>
                    <div className="w-[10px] h-[5px] bg-slate-700 group-hover:bg-blue-700 border border-slate-600 mt-[-1px] rounded-[0.5px]" />
                  </div>
                </div>

                {/* MARKER 3: Right Margin Marker */}
                <div
                  className="ruler-marker-handle group"
                  style={{
                    left: `${paperDims.width - (marginCm.right * pxPerCm)}px`,
                    bottom: '0px',
                    transform: 'translateX(-50%)'
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveDrag('RIGHT_MARGIN');
                  }}
                  title={`Margin Kanan: ${marginCm.right.toFixed(1)} cm`}
                >
                  <svg width="11" height="9" viewBox="0 0 11 9" className="drop-shadow-xs fill-slate-700 hover:fill-blue-700 transition-colors">
                    <polygon points="5.5,0 11,9 0,9" stroke="#334155" strokeWidth="0.8" />
                  </svg>
                </div>

                {/* Vertical Dotted Guideline */}
                {dragGuidelineX !== null && (
                  <div
                    className="ruler-guideline"
                    style={{ left: `${dragGuidelineX}px` }}
                  />
                )}

                {/* Floating Measurement Tooltip while Dragging */}
                {dragTooltip && dragGuidelineX !== null && (
                  <div
                    className="absolute top-6 bg-slate-900 text-white text-[11px] font-mono px-2.5 py-0.5 rounded shadow-lg pointer-events-none z-50 transform -translate-x-1/2 whitespace-nowrap border border-slate-700"
                    style={{ left: `${dragGuidelineX}px` }}
                  >
                    {dragTooltip}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CENTER: Desk Workspace with Floating Paper Canvas */}
          <main
            ref={mainDeskRef}
            className="flex-1 overflow-x-auto overflow-y-auto p-3 sm:p-6 flex flex-col items-center word-desk min-w-0"
          >
            
            {/* Document Responsibility Banner for Reviewer / Contributor */}
            {doc && (
              <div style={{ maxWidth: `${paperDims.width}px` }} className="w-full mb-2 select-none font-sans">
                {doc.isDocReadOnly ? (
                  <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-900 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <Eye className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span><strong>Mode Lihat Saja:</strong> Dokumen ini dibuka sebagai referensi (read-only).</span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-200 text-amber-900 shrink-0">
                      Hanya Baca
                    </span>
                  </div>
                ) : currentUser?.role === 'REVIEWER' ? (
                  <div className="px-3 py-1.5 bg-cyan-50 border border-cyan-200 rounded-lg flex items-center justify-between text-xs text-cyan-950 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-700 shrink-0" />
                      <span><strong>Reviewer {doc.chapter}:</strong> Hak review & persetujuan naskah aktif.</span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-cyan-200 text-cyan-950 shrink-0">
                      Review Aktif
                    </span>
                  </div>
                ) : null}
              </div>
            )}

            {/* Top Control Bar in Full Document Preview */}
            {viewMode === 'FULL_DOCUMENT' && (
              <div style={{ maxWidth: `${paperDims.width}px` }} className="mb-3 bg-white px-3.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2 w-full select-none text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">Pratinjau Dokumen</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">{sections.length} Bagian Naskah</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded border border-slate-200 text-xs transition flex items-center gap-1"
                  title="Cetak Dokumen atau Simpan PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / PDF</span>
                </button>

                {currentUser?.role === 'ADMIN' && (
                  <button
                    type="button"
                    onClick={() => setIsFullEditMode(!isFullEditMode)}
                    className={`px-2.5 py-1 font-semibold rounded text-xs transition flex items-center gap-1 ${
                      isFullEditMode
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-[#185abd] hover:bg-[#144b9e] text-white'
                    }`}
                    title={isFullEditMode ? 'Kunci Mode Sunting' : 'Sunting Seluruh Dokumen'}
                  >
                    {isFullEditMode ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Selesai Sunting</span>
                      </>
                    ) : (
                      <>
                        <Type className="w-3.5 h-3.5" />
                        <span>Edit Langsung</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setViewMode('SECTION_EDITOR')}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded border border-slate-200 text-xs transition flex items-center gap-1"
                  title="Buka per sub-bab"
                >
                  <span>{activeSection?.canEdit ? 'Edit Sub-Bab' : 'Lihat Sub-Bab'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          <div
            className="w-full flex justify-center transition-transform origin-top pb-24"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            {/* ================= VIEW MODE 1: FULL DOCUMENT PREVIEW (IDENTIK PER SUB-BAB & TABEL DENGAN ORIENTASI ASLI) ================= */}
            {viewMode === 'FULL_DOCUMENT' ? (
              <div className="w-full flex flex-col items-center gap-10">
                {sections.map((sec, secIdx) => {
                  const isLand = (sec.orientation || 'portrait').toLowerCase() === 'landscape';
                  const secWidth = isLand ? 1247 : 816;
                  const secMinHeight = isLand ? 816 : 1247;
                  const mStyle = getSectionMarginStyle(sec.orientation);
                  const isFirst = secIdx === 0;

                  return (
                    <div
                      key={sec.id}
                      id={`full-sec-${sec.id}`}
                      className={`word-page-sheet relative group ${showGridlines ? 'show-gridlines' : ''}`}
                      style={{
                        width: `${secWidth}px`,
                        minHeight: `${secMinHeight}px`,
                        backgroundColor: pageColor,
                        border: '1px solid #d2d0ce',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                        ...mStyle
                      }}
                    >
                      {/* Watermark Diagonal Overlay */}
                      {watermark && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
                          <span
                            className="font-extrabold text-slate-900/5 tracking-widest uppercase transform -rotate-45"
                            style={{ fontSize: isLand ? '9rem' : '7rem' }}
                          >
                            {watermark}
                          </span>
                        </div>
                      )}

                      {/* Floating Quick Action Bar on Hover */}
                      <div className="absolute -top-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 border border-slate-300 shadow-md rounded-md px-2 py-1 flex items-center gap-1.5 text-[11px] font-sans z-30 select-none">
                        <span className="font-bold text-slate-700">{sec.code || `Bagian ${secIdx + 1}`}</span>
                        <span className="text-slate-300">|</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${isLand ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                          {isLand ? 'Lanskap (330×216 mm)' : 'Potret (216×330 mm)'}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleSectionOrientation(isLand ? 'PORTRAIT' : 'LANDSCAPE', sec)}
                          className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-medium"
                          title="Ganti Orientasi Sub-Bab"
                        >
                          Ubah Orientasi
                        </button>
                        <button
                          type="button"
                          onClick={() => openWordCollaboration(sec)}
                          className="px-1.5 py-0.5 bg-[#185abd] hover:bg-[#144b9e] text-white rounded text-[10px] font-medium flex items-center gap-1"
                          title="Buka sub-bab ini di Microsoft Word desktop"
                        >
                          <span className="font-bold">W</span>
                          <span>Word</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            selectSection(sec);
                            setViewMode('SECTION_EDITOR');
                          }}
                          className="px-1.5 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-medium flex items-center gap-1"
                        >
                          <span>Sunting</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      {/* Word Header on Page */}
                      <div className="pb-3 mb-6 border-b border-slate-300 flex items-center justify-between text-[10px] text-slate-500 select-none relative z-10 font-['Bookman_Old_Style',Georgia,serif]">
                        <span className="font-semibold tracking-wide">RKPD Kabupaten Cilacap Tahun 2027</span>
                        <span className="uppercase tracking-wide text-slate-400">
                          {sec.code ? `${sec.code} ${sec.title}` : (doc?.title?.replace('RKPD 2027 PERBUP - ', '') || 'DOKUMEN RESMI')}
                        </span>
                      </div>

                      {/* Kop Lampiran on First Page */}
                      {isFirst && (
                        <div className="kop-lampiran-perbup mb-8 text-right font-['Bookman_Old_Style',Georgia,serif]" style={{ marginLeft: 'auto', width: '360px', fontSize: '10.5pt', lineHeight: '1.35' }}>
                          <div className="font-bold tracking-wider">LAMPIRAN</div>
                          <div className="font-bold tracking-wider">PERATURAN BUPATI CILACAP</div>
                          <div className="font-bold">NOMOR &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; TAHUN 2026</div>
                          <div className="font-bold">TENTANG</div>
                          <div className="font-bold">RENCANA KERJA PEMERINTAH DAERAH KABUPATEN CILACAP TAHUN 2027</div>
                        </div>
                      )}



                      {/* Section Content with Table Anti-Overflow */}
                      <div
                        className={`word-content focus:outline-none ${firstLineIndent ? 'with-indent' : ''}`}
                        style={{
                          fontFamily: fontFamily,
                          fontSize: fontSize,
                          lineHeight: lineSpacing,
                          textAlign: documentAlignment,
                          columnCount: textColumns === 2 ? 2 : 1,
                          columnGap: '28pt',
                          '--p-spacing': `${spacingAfterPt}pt`,
                          '--p-spacing-before': `${spacingBeforePt}pt`,
                          '--tbl-data-size': sec.tableFontSize || (isLand ? '8.5pt' : '9pt'),
                          '--tbl-header-size': isLand ? '9pt' : '9.5pt'
                        }}
                        dangerouslySetInnerHTML={{ __html: sec.content || '<p><em>Belum ada naskah narasi.</em></p>' }}
                      />

                      {/* Word Footer on Page */}
                      <div className="mt-14 pt-3 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-600 select-none clear-both relative z-10 font-['Bookman_Old_Style',Georgia,serif]">
                        <span className="tracking-wide">RKPD Kabupaten Cilacap Tahun 2027</span>
                        <span className="font-semibold font-mono">
                          {sec.pageLabel || `${getRomanChapter()}-${secIdx + 1}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ================= VIEW MODE 2: SECTION EDITOR (WORD CANVAS) ================= */
              <div
                className={`word-page-sheet ${showGridlines ? 'show-gridlines' : ''}`}
                style={{
                  width: `${paperDims.width}px`,
                  minHeight: `${paperDims.minHeight}px`,
                  backgroundColor: pageColor,
                  border: pageBorder === 'box'
                    ? '1px solid #475569'
                    : pageBorder === 'double'
                    ? '4px double #334155'
                    : pageBorder === 'shadow'
                    ? '2px solid #0f172a'
                    : pageBorder === 'perbup'
                    ? '3px double #185abd'
                    : '1px solid #d2d0ce',
                  boxShadow: pageBorder === 'shadow'
                    ? '8px 8px 0px rgba(0,0,0,0.2)'
                    : '0 4px 20px rgba(0,0,0,0.12)',
                  ...getMarginStyle()
                }}
              >
                {/* Watermark Diagonal Overlay */}
                {watermark && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
                    <span
                      className="font-extrabold text-slate-900/5 tracking-widest uppercase transform -rotate-45"
                      style={{ fontSize: orientation === 'LANDSCAPE' ? '9rem' : '7rem' }}
                    >
                      {watermark}
                    </span>
                  </div>
                )}

                {/* Word Header on Page */}
                <div className="pb-3 mb-6 border-b border-slate-300 flex items-center justify-between text-[10px] text-slate-500 select-none relative z-10 font-['Bookman_Old_Style',Georgia,serif]">
                  <span className="font-semibold tracking-wide">RKPD Kabupaten Cilacap Tahun 2027</span>
                  <span className="uppercase tracking-wide text-slate-400">
                    {doc?.title?.replace('RKPD 2027 PERBUP - ', '') || 'DOKUMEN RESMI'}
                  </span>
                </div>

                {/* Kop Lampiran on First Section */}
                {activeSection?.order === 1 && (
                  <div className="kop-lampiran-perbup mb-8 text-right font-['Bookman_Old_Style',Georgia,serif]" style={{ marginLeft: 'auto', width: '360px', fontSize: '10.5pt', lineHeight: '1.35' }}>
                    <div className="font-bold tracking-wider">LAMPIRAN</div>
                    <div className="font-bold tracking-wider">PERATURAN BUPATI CILACAP</div>
                    <div className="font-bold">NOMOR &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; TAHUN 2026</div>
                    <div className="font-bold">TENTANG</div>
                    <div className="font-bold">RENCANA KERJA PEMERINTAH DAERAH KABUPATEN CILACAP TAHUN 2027</div>
                  </div>
                )}

                <div className="relative z-10">
                  {/* Read-only notification */}
                  {!activeSection?.canEdit && (
                    <div className="mb-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between select-none font-sans">
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>
                          <strong>Mode Lihat Saja:</strong>{' '}
                          {activeSection?.isLocked
                            ? 'Naskah berstatus final / dikunci.'
                            : currentUser?.role === 'REVIEWER'
                            ? 'Bab di luar penugasan review Anda.'
                            : 'Naskah ditugaskan kepada kontributor lain.'}
                        </span>
                      </div>
                      {activeSection?.canComment ? (
                        <button
                          type="button"
                          onClick={() => setShowReviewPane(true)}
                          className="text-xs font-semibold text-amber-900 hover:underline shrink-0 ml-2"
                        >
                          Catatan Review ➔
                        </button>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-200 text-amber-900 shrink-0 ml-2">
                          Hanya Baca
                        </span>
                      )}
                    </div>
                  )}

                  {/* Word Page Navigation & Anti-Overflow Bar */}
                  <div className="mb-4 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs font-sans select-none shadow-2xs">
                    <div className="flex items-center gap-2">
                      {/* Prev Page Button */}
                      <button
                        type="button"
                        disabled={currentIndex <= 0}
                        onClick={() => selectSection(sections[currentIndex - 1])}
                        className="px-2 py-1 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 font-semibold rounded border border-slate-300 text-xs flex items-center gap-1 transition cursor-pointer"
                        title="Ke Halaman Sebelumnya"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Sebelumnya</span>
                      </button>

                      {/* Current Page Pill */}
                      <div className="px-2.5 py-1 bg-blue-100/80 border border-blue-200 text-[#185abd] font-bold rounded text-xs">
                        Halaman {activeSection?.pageLabel || `${getRomanChapter()}-${currentIndex + 1}`} ({currentIndex + 1} dari {sections.length})
                      </div>

                      {/* Next Page Button */}
                      <button
                        type="button"
                        disabled={currentIndex >= sections.length - 1}
                        onClick={() => selectSection(sections[currentIndex + 1])}
                        className="px-2 py-1 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 font-semibold rounded border border-slate-300 text-xs flex items-center gap-1 transition cursor-pointer"
                        title="Ke Halaman Selanjutnya"
                      >
                        <span>Selanjutnya</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <span className="text-slate-300">|</span>

                      {/* Orientation Toggle Button */}
                      <button
                        type="button"
                        onClick={() => toggleSectionOrientation()}
                        className={`px-2.5 py-1 rounded font-semibold text-xs border flex items-center gap-1.5 transition cursor-pointer ${
                          orientation === 'LANDSCAPE'
                            ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                        }`}
                        title="Ubah Orientasi Halaman (Lanskap 330×216 mm untuk tabel matriks lebar)"
                      >
                        <LayoutTemplate className="w-3.5 h-3.5" />
                        <span>{orientation === 'LANDSCAPE' ? 'Lanskap (330 × 216 mm)' : 'Potret (216 × 330 mm)'}</span>
                      </button>

                      {/* AutoFit Table Button */}
                      <button
                        type="button"
                        onClick={() => handleAutoFitTables()}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded border border-emerald-200 text-xs flex items-center gap-1 transition cursor-pointer"
                        title="AutoFit ala Word: Sesuaikan seluruh tabel agar pas dalam margin kertas Folio tanpa overflow"
                      >
                        <TableIcon className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Paskan Tabel</span>
                      </button>

                      <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                        <span className="text-[11px] text-slate-500 font-medium">Font Tabel:</span>
                        <select
                          value={tableFontSize}
                          onChange={(e) => handleSetTableFontSize(e.target.value)}
                          className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                          title="Ukuran font tabel (Standar 9pt / 8.5pt untuk matriks lebar)"
                        >
                          <option value="8pt">8pt (Sangat Padat)</option>
                          <option value="8.5pt">8.5pt (Matriks 10+ Kolom)</option>
                          <option value="9pt">9pt (Standar Bab II/IV)</option>
                          <option value="10pt">10pt (Standar Bab I/III/V)</option>
                          <option value="11pt">11pt (Tabel Besar)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded font-mono font-medium">
                        Margin {marginCm.left}cm / {marginCm.right}cm
                      </span>
                      <span>• Folio F4</span>
                    </div>
                  </div>

                  {/* Section Title Inputs */}
                  <div className="mb-5 pb-2 border-b border-slate-200 flex items-center gap-2 font-sans select-none">
                    <input
                      type="text"
                      value={sectionCode}
                      disabled={!activeSection?.canEdit}
                      onChange={(e) => setSectionCode(e.target.value)}
                      placeholder="Kode"
                      className="w-20 px-2 py-1 text-base font-bold text-[#185abd] bg-transparent border-b border-dashed border-slate-300 focus:border-[#185abd] focus:outline-none"
                      title="Kode Bagian (misal: 2.1)"
                    />
                    <input
                      type="text"
                      value={sectionTitle}
                      disabled={!activeSection?.canEdit}
                      onChange={(e) => setSectionTitle(e.target.value)}
                      placeholder="Judul Sub-Bab..."
                      className="flex-1 px-2 py-1 text-base sm:text-lg font-bold text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-[#185abd] focus:outline-none"
                      title="Judul Sub-Bab"
                    />
                  </div>

                  {/* Informational Banner for Parent / Empty Header Sections */}
                  {(!activeSection?.content || activeSection.content.trim() === '') && (
                    <div className="mb-4 px-3.5 py-2.5 bg-blue-50/80 border border-blue-200 rounded-lg text-xs text-blue-950 flex items-center justify-between gap-2 shadow-2xs font-sans">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-[#185abd] shrink-0" />
                        <span><strong>Judul Induk:</strong> Naskah tersimpan pada sub-bagian di bawah ini.</span>
                      </div>
                      {nextContentSection && (
                        <button
                          type="button"
                          onClick={() => selectSection(nextContentSection)}
                          className="px-2.5 py-1 bg-[#185abd] hover:bg-[#144b9e] text-white font-semibold rounded text-xs transition flex items-center gap-1 shrink-0"
                          title={`Buka sub-bagian: ${nextContentSection.title}`}
                        >
                          <span>Ke Sub-Bagian ➔</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Word Rich Text ContentEditable Canvas */}
                  <div
                    ref={editorRef}
                    contentEditable={activeSection?.canEdit}
                    onInput={handleEditorInput}
                    suppressContentEditableWarning={true}
                    className={`word-content focus:outline-none ${firstLineIndent ? 'with-indent' : ''}`}
                    style={{
                      fontFamily: fontFamily,
                      fontSize: fontSize,
                      lineHeight: lineSpacing,
                      textAlign: documentAlignment,
                      columnCount: textColumns === 2 ? 2 : 1,
                      columnGap: '28pt',
                      '--p-spacing': `${spacingAfterPt}pt`,
                      '--p-spacing-before': `${spacingBeforePt}pt`,
                      '--indent-size': `${Math.round(firstLineIndentCm * pxPerCm)}px`,
                      '--tbl-data-size': tableFontSize,
                      '--tbl-header-size': orientation === 'LANDSCAPE' ? '9pt' : '9.5pt'
                    }}
                  />
                </div>

                {/* Word Footer on Page */}
                <div className="mt-14 pt-3 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-600 select-none clear-both relative z-10 font-['Bookman_Old_Style',Georgia,serif]">
                  <span className="tracking-wide">RKPD Kabupaten Cilacap Tahun 2027</span>
                  <span className="font-semibold font-mono">
                    {activeSection?.pageLabel || `${getRomanChapter()}-${currentIndex + 1}`}
                  </span>
                </div>
              </div>
            )}
          </div>

        </main>
        </div>

        {/* RIGHT: Word Review & Collaboration Pane */}
        {showReviewPane && (
          <aside className="w-64 sm:w-72 bg-white border-l border-[#d2d0ce] flex flex-col shrink-0 select-none shadow-sm">
            <div className="p-2.5 border-b border-[#e1dfdd] bg-[#f8f7f6] flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-blue-700" />
                <span>Panel Tinjauan & Hak Akses</span>
              </span>
              <button
                onClick={() => setShowReviewPane(false)}
                className="p-1 rounded hover:bg-slate-200 text-slate-500"
              >
                <PanelRightClose className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex border-b border-[#e1dfdd] text-xs">
              <button
                onClick={() => setRightTab('COMMENTS')}
                className={`flex-1 py-2 font-bold transition border-b-2 text-center ${
                  rightTab === 'COMMENTS'
                    ? 'border-[#185abd] text-[#185abd]'
                    : 'border-transparent text-slate-500 hover:text-black'
                }`}
              >
                Komentar ({comments.length})
              </button>

              <button
                onClick={() => setRightTab('PERMISSIONS')}
                className={`flex-1 py-2 font-bold transition border-b-2 text-center ${
                  rightTab === 'PERMISSIONS'
                    ? 'border-[#185abd] text-[#185abd]'
                    : 'border-transparent text-slate-500 hover:text-black'
                }`}
              >
                Hak Akses OPD
              </button>

              <button
                onClick={() => setRightTab('LOGS')}
                className={`flex-1 py-2 font-bold transition border-b-2 text-center ${
                  rightTab === 'LOGS'
                    ? 'border-[#185abd] text-[#185abd]'
                    : 'border-transparent text-slate-500 hover:text-black'
                }`}
              >
                Riwayat
              </button>
            </div>

            {/* TAB 1: COMMENTS */}
            {rightTab === 'COMMENTS' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  {comments.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      Belum ada catatan perbaikan.
                    </div>
                  ) : (
                    comments.map((c) => (
                      <div
                        key={c.id}
                        className="p-2.5 rounded bg-[#f8fafc] border border-slate-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-slate-800">{c.authorName}</span>
                          <span className="text-slate-400">
                            {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-normal">{c.text}</p>
                      </div>
                    ))
                  )}
                </div>

                {activeSection?.canComment ? (
                  <form onSubmit={handleSendComment} className="p-2.5 border-t border-[#e1dfdd] bg-[#f8f7f6]">
                    <textarea
                      rows={2}
                      placeholder="Tuliskan catatan koreksi data..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full p-2 text-xs bg-white border border-[#d2d0ce] rounded focus:outline-none focus:border-[#185abd] resize-none mb-1.5"
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="w-full py-1 bg-[#185abd] hover:bg-[#144b9e] text-white rounded text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>Kirim Catatan</span>
                    </button>
                  </form>
                ) : (
                  <div className="p-3 border-t border-[#e1dfdd] bg-[#f8f7f6] text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Mode Lihat Saja: Anda tidak memiliki hak memberikan catatan pada bagian ini.</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PERMISSIONS */}
            {rightTab === 'PERMISSIONS' && (
              <div className="flex-1 overflow-y-auto p-3 space-y-3.5 text-xs">
                
                {/* Reviewer Level Bab Info Box */}
                <div className="p-2.5 rounded-lg bg-cyan-50 border border-cyan-200">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-950 text-[11px] mb-1">
                    <Eye className="w-3.5 h-3.5 text-cyan-700" />
                    <span>Reviewer Dokumen ({doc?.chapter || 'Bab Ini'}):</span>
                  </div>
                  {doc?.assignedReviewers?.length > 0 ? (
                    <div className="space-y-1">
                      {doc.assignedReviewers.map(r => (
                        <div key={r.id} className="text-[11px] text-cyan-900 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
                          <span>{r.name}</span>
                          <span className="text-[10px] text-slate-500 font-normal">({r.opd})</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 italic">Belum ada Reviewer yang ditugaskan memantau Bab ini.</p>
                  )}
                </div>

                {/* Contributor Delegation */}
                <div>
                  <p className="font-bold text-slate-800">Delegasi Kontributor Sub-Bab Ini:</p>
                  <p className="text-[10px] text-slate-500">Pilih PIC Bidang / OPD yang berhak menyunting narasi bagian ini</p>
                </div>

                <div className="space-y-1.5">
                  {users.filter(u => u.role === 'CONTRIBUTOR').map((u) => {
                    const isAssigned = (activeSection?.assignedUserIds || []).includes(u.id);

                    return (
                      <label
                        key={u.id}
                        className={`flex items-start space-x-2 p-2 rounded-lg border text-xs transition ${
                          isAssigned
                            ? 'bg-emerald-50 border-emerald-300 font-semibold'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        } ${currentUser.role === 'ADMIN' ? 'cursor-pointer' : 'cursor-default'}`}
                      >
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          disabled={currentUser.role !== 'ADMIN'}
                          onChange={() => handleToggleAssignee(u.id)}
                          className="mt-0.5 rounded text-emerald-600 w-3.5 h-3.5"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-slate-800">{u.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{u.opd}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: LOGS */}
            {rightTab === 'LOGS' && (
              <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
                {logs.map((l) => (
                  <div key={l.id} className="p-2 rounded bg-slate-50 border border-slate-200 space-y-0.5">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span className="font-bold text-slate-700">{l.userName}</span>
                      <span>{new Date(l.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{l.details}</p>
                  </div>
                ))}
              </div>
            )}

          </aside>
        )}

      </div>

      {/* ================= 4. MICROSOFT WORD BOTTOM STATUS BAR ================= */}
      <footer className="h-6 bg-[#f3f2f1] border-t border-[#d2d0ce] text-[#605e5c] text-[11px] flex items-center justify-between px-3 select-none shrink-0 font-sans">
        
        {/* Left Stats */}
        <div className="flex items-center space-x-3">
          <span>Halaman {currentIndex + 1} dari {sections.length}</span>
          <button
            onClick={() => setShowStatsModal(true)}
            className="border-l border-slate-300 pl-3 hover:text-black font-semibold"
            title="Klik untuk melihat statistik detail dokumen"
          >
            {stats.words} Kata
          </button>
          <span className="border-l border-slate-300 pl-3 hidden sm:inline">Bahasa: Indonesia</span>
          
          <div className="border-l border-slate-300 pl-3 flex items-center gap-1">
            {saveStatus === 'SAVING' ? (
              <span className="text-amber-600 font-semibold animate-pulse">Menyimpan ke Cloud...</span>
            ) : saveStatus === 'SAVED' ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" />
                Tersimpan di Cloud
              </span>
            ) : saveStatus === 'UNSAVED' ? (
              <span className="text-amber-600">Perubahan belum disimpan</span>
            ) : (
              <span className="text-slate-500">Tersimpan</span>
            )}
          </div>
        </div>

        {/* Right: Layout Indicators & Zoom Controls */}
        <div className="flex items-center space-x-3">
          <span className="hidden md:inline font-mono text-[10px] text-slate-400">
            {paperSize} • {orientation === 'PORTRAIT' ? 'Potret' : 'Lanskap'} • Margin {marginPreset}
          </span>

          <div className="flex items-center space-x-1.5 border-l border-slate-300 pl-3">
            <button
              onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
              className="p-0.5 hover:bg-slate-200 rounded text-slate-600"
              title="Perkecil Tampilan"
            >
              <ZoomOut className="w-3 h-3" />
            </button>

            <input
              type="range"
              min="50"
              max="150"
              step="5"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className="w-16 h-1 bg-slate-300 rounded appearance-none cursor-pointer"
            />

            <button
              onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
              className="p-0.5 hover:bg-slate-200 rounded text-slate-600"
              title="Perbesar Tampilan"
            >
              <ZoomIn className="w-3 h-3" />
            </button>

            <button
              onClick={() => setZoomLevel(100)}
              className="px-1 py-0.5 hover:bg-slate-200 rounded font-bold text-[11px] text-slate-700 transition cursor-pointer"
              title="Reset ke Tampilan 100%"
            >
              {zoomLevel}%
            </button>

            <button
              onClick={handleFitToWidth}
              className="p-1 hover:bg-slate-200 rounded text-slate-600 hover:text-blue-700 transition cursor-pointer"
              title="Sesuaikan Lebar Naskah ke Layar (Fit to Screen)"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        </div>

      </footer>

      {/* ================= DETAILED DOCUMENT STATS MODAL ================= */}
      {showStatsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Statistik & Hitung Kata Dokumen</span>
              </span>
              <button
                onClick={() => setShowStatsModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Jumlah Kata:</span>
                <span className="font-bold text-slate-800">{stats.words} kata</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Jumlah Karakter:</span>
                <span className="font-bold text-slate-800">{stats.characters} karakter</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Jumlah Paragraf:</span>
                <span className="font-bold text-slate-800">{stats.paragraphs} paragraf</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Total Bagian / Sub-Bab:</span>
                <span className="font-bold text-slate-800">{sections.length} bagian</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Perkiraan Waktu Membaca:</span>
                <span className="font-bold text-slate-800">{Math.ceil(stats.words / 200)} menit</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowStatsModal(false)}
                className="px-4 py-1.5 bg-[#185abd] text-white rounded-lg text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= INSERT CAPTION MODAL (KETERANGAN RESMI TABEL & GAMBAR) ================= */}
      {showCaptionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-600" />
                <span>Sisipkan Keterangan Dokumen (Insert Caption)</span>
              </span>
              <button
                onClick={() => setShowCaptionModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                {/* Label Selector */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Label Keterangan:
                  </label>
                  <select
                    value={captionLabel}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCaptionLabel(val);
                      if (val === 'Tabel') {
                        setCaptionPosition('DI_ATAS');
                      } else {
                        setCaptionPosition('DI_BAWAH');
                      }
                    }}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="Tabel">Tabel (Standar Dokumen Bab RKPD)</option>
                    <option value="Gambar">Gambar (Foto / Dokumentasi)</option>
                    <option value="Bagan">Bagan (Struktur / Kerangka Pikir)</option>
                    <option value="Grafik">Grafik (Statistik Capaian)</option>
                    <option value="Peta">Peta (Administrasi / Tematik)</option>
                  </select>
                </div>

                {/* Numbering */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor (Bab.Nomor Urut):
                  </label>
                  <input
                    type="text"
                    value={captionNumber}
                    onChange={(e) => setCaptionNumber(e.target.value)}
                    placeholder="misal: 2.1"
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 font-mono font-bold text-blue-700 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Title input */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Judul Lengkap {captionLabel}:
                </label>
                <input
                  type="text"
                  value={captionTitle}
                  onChange={(e) => setCaptionTitle(e.target.value)}
                  placeholder={`Contoh: Perkembangan Capaian Indikator Sasaran Makro Kabupaten Cilacap`}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:border-blue-600 focus:outline-none text-xs"
                  autoFocus
                />
              </div>

              {/* Position */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Posisi Judul / Keterangan:
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="captionPos"
                      value="DI_ATAS"
                      checked={captionPosition === 'DI_ATAS'}
                      onChange={() => setCaptionPosition('DI_ATAS')}
                      className="text-blue-600"
                    />
                    <span className="text-slate-700 font-medium">Di Atas Item (Standar Tabel)</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="captionPos"
                      value="DI_BAWAH"
                      checked={captionPosition === 'DI_BAWAH'}
                      onChange={() => setCaptionPosition('DI_BAWAH')}
                      className="text-blue-600"
                    />
                    <span className="text-slate-700 font-medium">Di Bawah Item (Standar Gambar/Grafik)</span>
                  </label>
                </div>
              </div>

              {/* Source */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Sumber Data Resmi:
                </label>
                <input
                  type="text"
                  value={captionSource}
                  onChange={(e) => setCaptionSource(e.target.value)}
                  placeholder="Sumber : Bappeda Kabupaten Cilacap Tahun 2026 (data diolah)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-700 focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* Table Option */}
              {captionLabel === 'Tabel' && (
                <label className="flex items-center space-x-2 p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTableWithCaption}
                    onChange={(e) => setIncludeTableWithCaption(e.target.checked)}
                    className="rounded text-blue-600 w-4 h-4"
                  />
                  <span className="font-semibold text-blue-900 text-xs">
                    Sertakan template tabel indikator makro 5 kolom di bawah judul keterangan
                  </span>
                </label>
              )}

              {/* Live Preview Card */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="font-bold text-[10px] uppercase text-slate-400 tracking-wider">
                  Pratinjau Format Sesuai Naskah Perbup (Bookman Old Style):
                </span>
                <div className="p-3 bg-white border border-slate-200 rounded shadow-2xs font-serif">
                  <p className="font-bold text-[12px] text-slate-900 m-0">
                    {captionLabel} {captionNumber}. {captionTitle.trim() || `[Judul ${captionLabel}]`}
                  </p>
                  {captionSource && (
                    <p className="text-[10px] italic text-slate-500 m-0 mt-1">
                      <em>{captionSource}</em>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                onClick={() => setShowCaptionModal(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-200 font-semibold text-xs"
              >
                Batal
              </button>
              <button
                onClick={insertCaption}
                className="px-5 py-2 bg-[#185abd] hover:bg-[#144b9e] text-white rounded-lg font-bold text-xs shadow-sm flex items-center gap-1.5"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Sisipkan Keterangan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= PAGE SETUP MODAL (PENGATURAN MARGIN PRESISI CM) ================= */}
      {showPageSetupModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-700" />
                <span>Pengaturan Halaman & Margin Presisi (cm)</span>
              </span>
              <button
                onClick={() => setShowPageSetupModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Margin Kiri (Left cm):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={marginCm.left}
                    onChange={(e) => setMarginCm({ ...marginCm, left: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-800 focus:border-blue-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Standar Perbup: 4.0 cm</span>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Margin Atas (Top cm):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={marginCm.top}
                    onChange={(e) => setMarginCm({ ...marginCm, top: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-800 focus:border-blue-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Standar Perbup: 3.0 cm</span>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Margin Kanan (Right cm):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={marginCm.right}
                    onChange={(e) => setMarginCm({ ...marginCm, right: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-800 focus:border-blue-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Standar Perbup: 3.0 cm</span>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Margin Bawah (Bottom cm):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={marginCm.bottom}
                    onChange={(e) => setMarginCm({ ...marginCm, bottom: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-800 focus:border-blue-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Standar Perbup: 3.5 cm</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Indentasi Baris Pertama Paragraf (cm):
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={firstLineIndentCm}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setFirstLineIndentCm(val);
                    setFirstLineIndent(val > 0);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-800 focus:border-blue-600 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">Standar Tab: 1.27 cm (0.5 in)</span>
              </div>

              {/* Quick Presets */}
              <div className="pt-2 border-t border-slate-200">
                <span className="block font-bold text-slate-700 mb-2">Preset Margin Cepat:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMarginCm({ left: 4.0, top: 3.0, right: 3.0, bottom: 3.5 });
                      setFirstLineIndentCm(1.27);
                      setMarginPreset('PERBUP');
                    }}
                    className="px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-900 font-bold hover:bg-blue-100"
                  >
                    🏛️ Perbup Cilacap (4-3-3-3.5)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMarginCm({ left: 2.54, top: 2.54, right: 2.54, bottom: 2.54 });
                      setMarginPreset('NORMAL');
                    }}
                    className="px-2.5 py-1 rounded bg-slate-100 border border-slate-300 text-slate-800 font-semibold hover:bg-slate-200"
                  >
                    📄 Normal (2.54 cm)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMarginCm({ left: 1.27, top: 1.27, right: 1.27, bottom: 1.27 });
                      setMarginPreset('NARROW');
                    }}
                    className="px-2.5 py-1 rounded bg-slate-100 border border-slate-300 text-slate-800 font-semibold hover:bg-slate-200"
                  >
                    📐 Sempit (1.27 cm)
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
              <button
                onClick={() => setShowPageSetupModal(false)}
                className="px-5 py-2 bg-[#185abd] hover:bg-[#144b9e] text-white rounded-lg font-bold text-xs"
              >
                Terapkan Pengaturan
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ================= MICROSOFT WORD COLLABORATION MODAL (PENDEKATAN 1) ================= */}
      {showWordModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal with Word Blue */}
            <div className="p-4 bg-[#185abd] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-white text-[#185abd] flex items-center justify-center font-bold text-lg shadow-xs">
                  W
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base leading-tight">Kolaborasi Langsung Microsoft Word</h3>
                  <p className="text-[11px] text-blue-100">Jadikan Microsoft Word sebagai lembar kerja utama naskah</p>
                </div>
              </div>
              <button
                onClick={() => setShowWordModal(false)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Target Section Info */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-slate-400">Naskah yang dipilih:</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">
                  {wordTargetSection?.code || ''} {wordTargetSection?.title || 'Bagian Dokumen'}
                </p>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="bg-blue-100 text-blue-800 font-semibold px-1.5 py-0.5 rounded text-[10px]">
                    {wordTargetSection?.orientation === 'landscape' ? 'Lanskap (330×216 mm)' : 'Potret (216×330 mm)'}
                  </span>
                  <span>• Kertas Folio F4 • Bookman Old Style</span>
                </div>
              </div>

              {/* Option 1: Automatic Launch */}
              <div className="border-2 border-blue-500/30 bg-blue-50/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-blue-950 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Metode 1: Luncurkan Otomatis (Direkomendasikan)</span>
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[9px]">
                    Ctrl + S Auto-Sync
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed mb-3">
                  Aplikasi Microsoft Word di komputer Anda akan terbuka otomatis. Setiap kali Anda menekan <strong>Ctrl + S (Simpan)</strong> di Word, naskah dan tabel langsung tersimpan ke server Codot.
                </p>
                <button
                  type="button"
                  onClick={() => handleLaunchWord()}
                  className="w-full py-2.5 px-4 bg-[#185abd] hover:bg-[#144b9e] text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition"
                >
                  <FileText className="w-4 h-4 text-white" />
                  <span>Buka di Microsoft Word Desktop Sekarang</span>
                </button>
              </div>

              {/* Option 2: Manual Download & Re-upload */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 text-xs">
                    Metode 2: Unduh & Unggah Manual (Alternatif Offline)
                  </span>
                  <span className="text-[10px] text-slate-400">Bekerja tanpa internet</span>
                </div>
                <p className="text-slate-500 leading-relaxed mb-3">
                  Jika firewall/kebijakan komputer membatasi sinkronisasi langsung dari Word, unduh naskah ini, edit di Word, lalu unggah file hasil revisinya.
                </p>
                <div className="flex items-center gap-2">
                  <a
                    href={api.getWordBridgeUrl(wordTargetSection?.id || activeSection?.id)}
                    download={`${wordTargetSection?.code || 'Sec'}_${wordTargetSection?.title || 'Doc'}.docx`}
                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg border border-slate-300 flex items-center justify-center gap-1.5 transition text-center"
                  >
                    <FileDown className="w-3.5 h-3.5 text-slate-600" />
                    <span>Unduh .docx</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => wordFileInputRef.current?.click()}
                    disabled={wordSyncLoading}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 transition shadow-2xs"
                  >
                    <FilePlus className="w-3.5 h-3.5 text-white" />
                    <span>{wordSyncLoading ? 'Memproses...' : 'Unggah Revisi Word'}</span>
                  </button>
                  <input
                    ref={wordFileInputRef}
                    type="file"
                    accept=".docx"
                    onChange={handleManualWordUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div className="text-[11px] text-slate-500 bg-slate-100/70 p-3 rounded-lg leading-relaxed">
                <span className="font-bold text-slate-700">💡 Tips Format:</span> Naskah ini telah dikonfigurasi dengan standar kertas Folio F4 (216×330 mm), font Bookman Old Style, dan garis batas tabel resmi. Penambahan tabel atau baris baru di Word akan otomatis disesuaikan saat disimpan ke sistem.
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleRefreshFromWord()}
                disabled={wordSyncLoading}
                className="text-xs font-semibold text-blue-700 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Muat Ulang Perubahan dari Word</span>
              </button>

              <button
                onClick={() => setShowWordModal(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md font-semibold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
