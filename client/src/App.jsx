import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PatientList from './pages/Patients/PatientList';
import PatientProfile from './pages/Patients/PatientProfile';
import AppointmentsPage from './pages/Appointments/AppointmentsPage';
import QueuePage from './pages/Queue/QueuePage';
import ClinicalListPage from './pages/Clinical/ClinicalListPage';
import ClinicalWorkspace from './pages/Clinical/ClinicalWorkspace';
import BillingPage from './pages/Billing/BillingPage';
import InvoiceDetailPage from './pages/Billing/InvoiceDetailPage';
import ReceiptDetailPage from './pages/Billing/ReceiptDetailPage';
import BatchPrintPage from './pages/Billing/BatchPrintPage';
import DocumentsFollowupsPage from './pages/Documents/DocumentsFollowupsPage';
import ReportsPage from './pages/Reports/ReportsPage';
import AdminHub from './pages/Administration/AdminHub';
import SettingsPage from './pages/Settings/SettingsPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Verifying user session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Main 8 Primary Sections */}
        <Route index element={<Dashboard />} />
        <Route path="patients" element={<PatientList />} />
        <Route path="patients/:id" element={<PatientProfile />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="queue" element={<QueuePage />} />
        <Route path="clinical" element={<ClinicalListPage />} />
        <Route path="clinical/encounters/:id" element={<ClinicalWorkspace />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="billing/invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="billing/receipts/:id" element={<ReceiptDetailPage />} />
        <Route path="batch-print" element={<BatchPrintPage />} />
        <Route path="documents" element={<DocumentsFollowupsPage />} />
        <Route path="reports" element={<ReportsPage />} />

        {/* Administration & Settings */}
        <Route path="admin" element={<AdminHub />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
