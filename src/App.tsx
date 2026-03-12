import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import CampaignList from '@/pages/CampaignList'
import CampaignDashboard from '@/pages/CampaignDashboard'
import CharacterList from '@/pages/CharacterList'
import CharacterBuilder from '@/pages/CharacterBuilder'
import CharacterSheet from '@/pages/CharacterSheet'
import SessionList from '@/pages/SessionList'
import SessionDetail from '@/pages/SessionDetail'
import NotesPage from '@/pages/NotesPage'
import DmToolkit from '@/pages/DmToolkit'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<CampaignList />} />
        <Route path="/campaign/:id" element={<CampaignDashboard />} />
        <Route path="/campaign/:id/characters" element={<CharacterList />} />
        <Route path="/campaign/:id/character/new" element={<CharacterBuilder />} />
        <Route path="/campaign/:id/character/:characterId" element={<CharacterSheet />} />
        <Route path="/campaign/:id/sessions" element={<SessionList />} />
        <Route path="/campaign/:id/session/:sessionId" element={<SessionDetail />} />
        <Route path="/campaign/:id/notes" element={<NotesPage />} />
        <Route path="/campaign/:id/toolkit" element={<DmToolkit />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
