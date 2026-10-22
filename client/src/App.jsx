import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StageStepper from './components/StageStepper';
import DocumentList from './components/DocumentList';
import DocumentWorkspace from './components/DocumentWorkspace';
import ImportModal from './components/ImportModal';
import UserManagementModal from './components/UserManagementModal';
import AccessMatrixModal from './components/AccessMatrixModal';
import CreateDocModal from './components/CreateDocModal';
import GoogleDriveModal from './components/GoogleDriveModal';
import StageClosingModal from './components/StageClosingModal';
import ConsistencyCheckModal from './components/ConsistencyCheckModal';
import LoginScreen from './components/LoginScreen';
import { api, getActiveUserId, setActiveUserId, getSavedAuthUser, setSavedAuthUser } from './api';

export default function App() {
  const [users, setUsers] = useState([]);
  const savedUser = getSavedAuthUser();
  const [isAuthenticated, setIsAuthenticated] = useState(!!savedUser);
  const [currentUserId, setCurrentUserId] = useState(savedUser?.id || getActiveUserId() || 'user_admin');
  
  // 8 Tahapan RKPD State
  const [stages, setStages] = useState([]);
  const [activeStageId, setActiveStageId] = useState('stage_1');
  const [selectedStageId, setSelectedStageId] = useState('stage_1');

  const [documents, setDocuments] = useState([]);
  const [activeDocId, setActiveDocId] = useState(null);
  const [activeDoc, setActiveDoc] = useState(null);
  const [initialSectionId, setInitialSectionId] = useState(null);
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Modals
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
  const [isConsistencyModalOpen, setIsConsistencyModalOpen] = useState(false);
  const [isCreateDocOpen, setIsCreateDocOpen] = useState(false);
  const [isGdriveModalOpen, setIsGdriveModalOpen] = useState(false);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Load initial users
  const loadUsers = async () => {
    try {
      const res = await api.getUsers();
      if (res.success) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  // Load 8 stages
  const loadStages = async (preferredStageId = null) => {
    try {
      const res = await api.getStages();
      if (res.success && res.data.length > 0) {
        setStages(res.data);
        const live = res.data.find(s => s.status === 'ACTIVE') || res.data[0];
        setActiveStageId(live.id);
        const targetId = preferredStageId || selectedStageId || live.id;
        setSelectedStageId(targetId);
        loadDocuments(targetId);
      }
    } catch (err) {
      console.error('Error loading stages:', err);
    }
  };

  // Load documents for a specific stage
  const loadDocuments = async (stageId = null) => {
    try {
      setLoadingDocs(true);
      const targetStage = stageId || selectedStageId || 'stage_1';
      const res = await api.getDocuments(targetStage);
      if (res.success) {
        setDocuments(res.data);
      }
    } catch (err) {
      console.error('Error loading documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadStages();
  }, []);

  // Update active user
  const handleSelectUser = (id) => {
    setCurrentUserId(id);
    setActiveUserId(id);
    const u = users.find(x => x.id === id);
    if (u) {
      setSavedAuthUser(u);
    }
  };

  // Login handler
  const handleLoginSuccess = (user, rememberMe) => {
    if (rememberMe) {
      setSavedAuthUser(user);
    } else {
      setActiveUserId(user.id);
    }
    setCurrentUserId(user.id);
    setIsAuthenticated(true);
    loadStages();
    loadDocuments();
  };

  // Logout handler
  const handleLogout = () => {
    setSavedAuthUser(null);
    setIsAuthenticated(false);
    setActiveDocId(null);
    setActiveDoc(null);
    setInitialSectionId(null);
  };

  const currentUser = users.find(u => u.id === currentUserId) || users[0] || {
    id: 'user_admin',
    name: 'Admin Bappeda (Koordinator)',
    role: 'ADMIN',
    opd: 'Bappeda'
  };

  // Select Stage
  const handleSelectStage = (stageId) => {
    setSelectedStageId(stageId);
    loadDocuments(stageId);
  };

  // Open Document
  const handleOpenDoc = async (id) => {
    setActiveDocId(id);
    try {
      const res = await api.getDocument(id);
      if (res.success) {
        setActiveDoc(res.data);
      }
    } catch (err) {
      console.error('Failed to open doc:', err);
    }
  };

  // Open Document & Jump directly to a Section
  const handleOpenDocSection = (docId, sectionId) => {
    setInitialSectionId(sectionId);
    handleOpenDoc(docId);
  };

  // Back to Document List
  const handleBackToDocs = () => {
    setActiveDocId(null);
    setActiveDoc(null);
    setInitialSectionId(null);
    loadStages(selectedStageId);
  };

  // Delete Document
  const handleDeleteDoc = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus dokumen ini beserta seluruh naskahnya?')) {
      return;
    }
    try {
      const res = await api.deleteDocument(id);
      if (res.success) {
        loadStages(selectedStageId);
      }
    } catch (err) {
      alert('Gagal menghapus dokumen: ' + err.message);
    }
  };

  // Create standard RKPD template
  const handleCreateTemplate = async () => {
    try {
      const res = await api.createRkpdTemplate();
      if (res.success) {
        await loadStages(selectedStageId);
        handleOpenDoc(res.data.id);
      }
    } catch (err) {
      alert('Gagal memuat template: ' + err.message);
    }
  };

  // Seed 7 official templates into a stage
  const handleSeedTemplates = async (stageId) => {
    try {
      setLoadingDocs(true);
      const res = await api.seedStageTemplates(stageId);
      if (res.success) {
        await loadStages(stageId);
      }
    } catch (err) {
      alert('Gagal menginisialisasi template: ' + err.message);
    } finally {
      setLoadingDocs(false);
    }
  };

  // Confirm Stage Closing & Roll Forward
  const handleConfirmCloseStage = async (stageId, data) => {
    const res = await api.closeStage(stageId, data);
    if (res.success) {
      const nextId = res.data.nextStage ? res.data.nextStage.id : stageId;
      await loadStages(nextId);
    }
  };

  // Reopen closed stage
  const handleReopenStage = async (stageId) => {
    if (!window.confirm('Apakah Anda yakin ingin membuka kembali tahapan ini?')) return;
    try {
      const res = await api.reopenStage(stageId);
      if (res.success) {
        await loadStages(stageId);
      }
    } catch (err) {
      alert('Gagal membuka kembali tahapan: ' + err.message);
    }
  };

  // Export to Word
  const handleExport = async (docIdToExport = activeDocId) => {
    if (!docIdToExport) return;
    try {
      setIsExporting(true);
      const downloadUrl = api.getExportUrl(docIdToExport);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = '';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      alert('Gagal mengekspor dokumen: ' + err.message);
    } finally {
      setTimeout(() => setIsExporting(false), 1500);
    }
  };

  const selectedStage = stages.find(s => s.id === selectedStageId) || stages[0] || {};
  const currentActiveStage = stages.find(s => s.status === 'ACTIVE') || stages[0];
  const nextStageIdx = stages.findIndex(s => s.id === currentActiveStage?.id) + 1;
  const nextStage = nextStageIdx < stages.length ? stages[nextStageIdx] : null;

  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        availableUsers={users}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* Top Navigation */}
      <Navbar
        users={users}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        currentDoc={activeDoc}
        selectedStage={selectedStage}
        onBackToDocs={handleBackToDocs}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        onOpenMatrixModal={() => setIsMatrixModalOpen(true)}
        onOpenConsistencyModal={() => setIsConsistencyModalOpen(true)}
        onOpenGdriveModal={() => setIsGdriveModalOpen(true)}
        isExporting={isExporting}
        onExport={() => handleExport(activeDocId)}
        onLogout={handleLogout}
      />

      {/* 8 Stages Horizontal Stepper (Shown when in Document List view) */}
      {!activeDocId && (
        <StageStepper
          stages={stages}
          activeStageId={activeStageId}
          selectedStageId={selectedStageId}
          onSelectStage={handleSelectStage}
          currentUser={currentUser}
          onOpenClosingModal={() => setIsClosingModalOpen(true)}
          onReopenStage={handleReopenStage}
          onSeedTemplates={handleSeedTemplates}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {!activeDocId ? (
          <DocumentList
            documents={documents}
            loading={loadingDocs}
            currentUser={currentUser}
            selectedStage={selectedStage}
            stages={stages}
            onOpenDoc={handleOpenDoc}
            onOpenDocSection={handleOpenDocSection}
            onOpenImportModal={() => setIsImportOpen(true)}
            onCreateTemplate={handleCreateTemplate}
            onCreateBlankDoc={() => setIsCreateDocOpen(true)}
            onDeleteDoc={handleDeleteDoc}
            onExportDoc={(id) => handleExport(id)}
            onSeedTemplates={handleSeedTemplates}
            onOpenClosingModal={() => setIsClosingModalOpen(true)}
            onOpenConsistencyModal={() => setIsConsistencyModalOpen(true)}
            onRefreshDocs={() => loadDocuments(selectedStageId)}
          />
        ) : (
          <DocumentWorkspace
            documentId={activeDocId}
            initialSectionId={initialSectionId}
            selectedStage={selectedStage}
            currentUser={currentUser}
            users={users}
            onOpenMatrixModal={() => setIsMatrixModalOpen(true)}
            onOpenConsistencyModal={() => setIsConsistencyModalOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <ConsistencyCheckModal
        isOpen={isConsistencyModalOpen}
        onClose={() => setIsConsistencyModalOpen(false)}
        activeStageId={selectedStageId}
        stages={stages}
        onNavigateToSection={(docId, sectionId) => {
          setIsConsistencyModalOpen(false);
          handleOpenDocSection(docId, sectionId);
        }}
      />

      <StageClosingModal
        isOpen={isClosingModalOpen}
        onClose={() => setIsClosingModalOpen(false)}
        currentStage={currentActiveStage}
        nextStage={nextStage}
        onConfirmClose={handleConfirmCloseStage}
      />

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={(newDocId) => {
          loadStages(selectedStageId);
          handleOpenDoc(newDocId);
        }}
      />

      <UserManagementModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        users={users}
        onUserAdded={loadUsers}
      />

      <AccessMatrixModal
        isOpen={isMatrixModalOpen}
        onClose={() => setIsMatrixModalOpen(false)}
        documentId={activeDocId}
        currentDoc={activeDoc}
        documents={documents}
        sections={activeDoc?.sections || []}
        users={users}
        onSectionsUpdated={() => {
          if (activeDocId) handleOpenDoc(activeDocId);
          loadStages(selectedStageId);
        }}
      />

      <CreateDocModal
        isOpen={isCreateDocOpen}
        onClose={() => setIsCreateDocOpen(false)}
        onSuccess={(newDocId) => {
          loadStages(selectedStageId);
          handleOpenDoc(newDocId);
        }}
      />

      <GoogleDriveModal
        isOpen={isGdriveModalOpen}
        onClose={() => setIsGdriveModalOpen(false)}
        currentUser={currentUser}
        onDatabaseRestored={() => {
          loadUsers();
          loadStages();
          setActiveDocId(null);
        }}
      />

    </div>
  );
}
