import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { UploadPage } from '@/pages/UploadPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ErrorExplorerPage } from '@/pages/ErrorExplorerPage'
import { DiffPage } from '@/pages/DiffPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/upload" replace />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/errors" element={<ErrorExplorerPage />} />
          <Route path="/diff" element={<DiffPage />} />
          <Route path="*" element={<Navigate to="/upload" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
