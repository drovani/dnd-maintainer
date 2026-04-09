import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { Layout } from '@/components/Layout'
import CampaignList from '@/pages/CampaignList'
import CampaignDashboard from '@/pages/CampaignDashboard'
import CharacterList from '@/pages/CharacterList'
import CharacterBuilder from '@/pages/CharacterBuilder'
import CharacterSheet from '@/pages/CharacterSheet'
import SessionList from '@/pages/SessionList'
import SessionDetail from '@/pages/SessionDetail'
import NotesPage from '@/pages/NotesPage'
import ExportData from '@/pages/ExportData'
import SettingsTheme from '@/pages/SettingsTheme'

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<CampaignList />} />
          <Route path="/campaign/:campaignSlug" element={<CampaignDashboard />} />
          <Route path="/campaign/:campaignSlug/characters" element={<CharacterList />} />
          <Route path="/campaign/:campaignSlug/character/new" element={<CharacterBuilder />} />
          <Route path="/campaign/:campaignSlug/character/:characterSlug" element={<CharacterSheet />} />
          <Route path="/campaign/:campaignSlug/sessions" element={<SessionList />} />
          <Route path="/campaign/:campaignSlug/session/:sessionSlug" element={<SessionDetail />} />
          <Route path="/campaign/:campaignSlug/notes" element={<NotesPage />} />
          <Route path="/export" element={<ExportData />} />
          <Route path="/settings/theme" element={<SettingsTheme />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="bottom-center" />
    </>
  )
}
