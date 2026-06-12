import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { AuthInit } from '@/components/AuthInit'
import { RealtimeBootstrap } from '@/components/RealtimeBootstrap'
import { AppLayout } from '@/components/layout/AppLayout'
import { ToastContainer } from '@/components/ui/Toast'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import DashboardPage from '@/pages/DashboardPage'
import TablesPage from '@/pages/TablesPage'
import POSPage from '@/pages/POSPage'
import KitchenPage from '@/pages/KitchenPage'
import CatalogPage from '@/pages/CatalogPage'
import ReportsPage from '@/pages/ReportsPage'
import SettingsPage from '@/pages/SettingsPage'
import CashPage from '@/pages/CashPage'
import UsersPage from '@/pages/UsersPage'
import BranchesPage from '@/pages/BranchesPage'
import ModulesHubPage from '@/pages/ModulesHubPage'
import ComensalPWA from '@/pages/pwa/ComensalPWA'
import MeseroPWA from '@/pages/pwa/MeseroPWA'
import CajaPWA from '@/pages/pwa/CajaPWA'

import {
  SalesHistoryPage, CategoriesPage, PromotionsPage,
  ProductionPage, PrintingPage, QRMenuPage,
} from '@/pages/demo/operacionPages'
import { SuppliersPage } from '@/pages/demo/inventarioPages'
import ReservationsPage from '@/pages/ReservationsPage'
import InventoryPage from '@/pages/InventoryPage'
import PurchasesPage from '@/pages/PurchasesPage'
import CustomersPage from '@/pages/CustomersPage'
import LoyaltyPage from '@/pages/LoyaltyPage'
import DeliveryPage from '@/pages/DeliveryPage'
import InvoicingPage from '@/pages/InvoicingPage'
import FinancePage from '@/pages/FinancePage'
import {
  SubscriptionsPage, AuditPage, PermissionsPage, NotificationsPage,
  IntegrationsPage, SupportPage, HRPage, AutomationPage, MarketplacePage,
  SaaSOwnerPage, FranchisePage, SecurityPage, APIPage, OnboardingPage,
  VersioningPage, LocalizationPage, DataWarehousePage, BIPage, AntifraudPage,
  CustomerSuccessPage,
} from '@/pages/demo/empresaPages'
import { IAChatPage } from '@/pages/demo/iaPages'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthInit>
      <BrowserRouter>
        <RealtimeBootstrap />
        <ToastContainer />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/comensal" element={<ComensalPWA />} />
          <Route path="/mesero" element={<MeseroPWA />} />
          <Route path="/caja" element={<CajaPWA />} />
          <Route path="/app" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="modules" element={<ModulesHubPage />} />
            <Route path="pos" element={<POSPage />} />
            <Route path="sales" element={<SalesHistoryPage />} />
            <Route path="tables" element={<TablesPage />} />
            <Route path="kitchen" element={<KitchenPage />} />
            <Route path="production" element={<ProductionPage />} />
            <Route path="catalog" element={<CatalogPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="cash" element={<CashPage />} />
            <Route path="promotions" element={<PromotionsPage />} />
            <Route path="delivery" element={<DeliveryPage />} />
            <Route path="reservations" element={<ReservationsPage />} />
            <Route path="printing" element={<PrintingPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route path="purchases" element={<PurchasesPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="loyalty" element={<LoyaltyPage />} />
            <Route path="invoicing" element={<InvoicingPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="finance" element={<FinancePage />} />
            <Route path="qr" element={<QRMenuPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="hr" element={<HRPage />} />
            <Route path="branches" element={<BranchesPage />} />
            <Route path="franchise" element={<FranchisePage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="saas" element={<SaaSOwnerPage />} />
            <Route path="onboarding" element={<OnboardingPage />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="marketplace" element={<MarketplacePage />} />
            <Route path="ia" element={<IAChatPage />} />
            <Route path="automation" element={<AutomationPage />} />
            <Route path="bi" element={<BIPage />} />
            <Route path="datawarehouse" element={<DataWarehousePage />} />
            <Route path="antifraud" element={<AntifraudPage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="permissions" element={<PermissionsPage />} />
            <Route path="security" element={<SecurityPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="localization" element={<LocalizationPage />} />
            <Route path="versioning" element={<VersioningPage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
            <Route path="api" element={<APIPage />} />
            <Route path="customer-success" element={<CustomerSuccessPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthInit>
  )
}
