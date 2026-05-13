import { useCallback, useMemo, useState } from 'react'
import { Layout } from './components/Layout'
import { Landing } from './screens/Landing'
import { AuthLogin } from './screens/AuthLogin'
import { AuthSignup } from './screens/AuthSignup'
import { Dashboard } from './screens/Dashboard'
import { NewApplication } from './screens/NewApplication'
import { ApplicationDetail } from './screens/ApplicationDetail'
import { Tracker } from './screens/Tracker'
import { Hotline } from './screens/Hotline'
import { createId, generateMockPack } from './utils/mockPack'
import './App.css'

const DAY_MS = 86400000

function daysAgo(n) {
  return new Date(Date.now() - n * DAY_MS).toISOString()
}

function buildSeedApplications() {
  const seeds = [
    {
      company: 'Northwind Analytics',
      jobTitle: 'Senior Product Designer',
      status: 'interview',
      tone: 'professional',
      cvText: '8+ years in product design, design systems, and research.',
      jobDescription:
        'Lead UX for our data platform; partner with PM and eng; ship accessible UI.',
      jobUrl: 'https://careers.example.com/northwind/senior-product-designer',
      location: 'Hybrid — Seattle',
      linkSource: 'LinkedIn',
      applicationDate: daysAgo(20),
      lastCommunicationDate: daysAgo(6),
      notes: 'Portfolio review completed. Waiting on panel availability.',
      updatedAt: daysAgo(6),
    },
    {
      company: 'Helio Robotics',
      jobTitle: 'Frontend Engineer',
      status: 'applied',
      tone: 'bold',
      cvText: 'React, TypeScript, performance, and design implementation.',
      jobDescription:
        'Build customer-facing dashboards; focus on reliability and speed.',
      jobUrl: 'https://jobs.heliorobotics.example/frontend',
      location: 'Remote — US',
      linkSource: 'Company site',
      applicationDate: daysAgo(70),
      lastCommunicationDate: daysAgo(65),
      notes: 'Applied via Greenhouse. Long silence on next steps.',
      updatedAt: daysAgo(10),
    },
    {
      company: 'Sigma Labs',
      jobTitle: 'Data Analyst',
      status: 'applied',
      tone: 'professional',
      cvText: 'SQL, dashboards, stakeholder reporting.',
      jobDescription: 'Support product and ops with self-serve analytics.',
      jobUrl: 'https://sigmalabs.example/careers/analyst',
      location: 'Remote — UK',
      linkSource: 'LinkedIn',
      applicationDate: daysAgo(22),
      lastCommunicationDate: null,
      notes: 'No response to follow-up email.',
      updatedAt: daysAgo(34),
    },
    {
      company: 'Riverstone Health',
      jobTitle: 'Engineering Manager',
      status: 'offer',
      tone: 'formal',
      cvText: 'Managed teams of 6–12; hiring, delivery, and stakeholder comms.',
      jobDescription:
        'Grow the platform team; partner with clinical stakeholders.',
      jobUrl: 'https://careers.riverstone.example/eng-manager',
      location: 'On-site — Boston',
      linkSource: 'Referral',
      applicationDate: daysAgo(35),
      lastCommunicationDate: daysAgo(2),
      notes: 'Verbal offer; compensation package under review.',
      updatedAt: daysAgo(2),
    },
    {
      company: 'Cedar Media',
      jobTitle: 'Content Strategist',
      status: 'saved',
      tone: 'warm',
      cvText: 'Editorial calendars, SEO content, and brand voice.',
      jobDescription:
        'Own narrative for B2B campaigns; collaborate with growth.',
      jobUrl: '',
      location: 'Hybrid — New York',
      linkSource: 'Indeed',
      applicationDate: daysAgo(8),
      lastCommunicationDate: null,
      notes: 'Tailor pack to growth narrative before sending.',
      updatedAt: daysAgo(4),
    },
    {
      company: 'Atlas Freight',
      jobTitle: 'Operations Lead',
      status: 'rejected',
      tone: 'professional',
      cvText: 'Logistics optimization, vendor management, KPI reporting.',
      jobDescription:
        'Drive on-time delivery; lead a distributed ops team.',
      jobUrl: 'https://atlasfreight.example/jobs/operations-lead',
      location: 'On-site — Chicago',
      linkSource: 'LinkedIn',
      applicationDate: daysAgo(40),
      lastCommunicationDate: daysAgo(12),
      notes: 'Feedback: stronger ops metrics in CV.',
      updatedAt: daysAgo(12),
    },
  ]

  return seeds.map((s, i) => ({
    id: `seed_${i}`,
    company: s.company,
    jobTitle: s.jobTitle,
    status: s.status,
    tone: s.tone,
    cvText: s.cvText,
    jobDescription: s.jobDescription,
    jobUrl: s.jobUrl,
    location: s.location,
    linkSource: s.linkSource,
    applicationDate: s.applicationDate,
    lastCommunicationDate: s.lastCommunicationDate,
    notes: s.notes,
    createdAt: daysAgo(45 - i * 3),
    updatedAt: s.updatedAt,
    pack: generateMockPack({
      company: s.company,
      jobTitle: s.jobTitle,
      cvText: s.cvText,
      jobDescription: s.jobDescription,
      tone: s.tone,
    }),
  }))
}

export default function App() {
  const [user, setUser] = useState(null)
  const [screen, setScreen] = useState('landing')
  const [applications, setApplications] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  const isAuthenticated = Boolean(user)

  const selectedApplication = useMemo(
    () => applications.find((a) => a.id === selectedId) ?? null,
    [applications, selectedId],
  )

  const login = useCallback((u) => {
    setUser(u)
    setApplications(buildSeedApplications())
    setScreen('dashboard')
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setApplications([])
    setSelectedId(null)
    setScreen('landing')
  }, [])

  const go = useCallback((next) => {
    setScreen(next)
  }, [])

  const openApplication = useCallback((id) => {
    setSelectedId(id)
    setScreen('applicationDetail')
  }, [])

  const handleGenerate = useCallback((form) => {
    const id = createId()
    const pack = generateMockPack(form)
    const now = new Date().toISOString()
    const row = {
      id,
      company: form.company,
      jobTitle: form.jobTitle,
      status: 'saved',
      tone: form.tone,
      cvText: form.cvText,
      jobDescription: form.jobDescription,
      jobUrl: '',
      location: 'Not specified',
      linkSource: 'Added in app',
      applicationDate: now,
      lastCommunicationDate: null,
      notes: '',
      createdAt: now,
      updatedAt: now,
      pack,
    }
    setApplications((prev) => [row, ...prev])
    setSelectedId(id)
    setScreen('applicationDetail')
  }, [])

  const updateStatus = useCallback((id, status) => {
    const now = new Date().toISOString()
    setApplications((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status, updatedAt: now } : a,
      ),
    )
  }, [])

  const layoutActive =
    screen === 'applicationDetail' ? 'dashboard' : screen

  if (!isAuthenticated) {
    if (screen === 'login') {
      return (
        <AuthLogin
          onBack={() => go('landing')}
          onSuccess={login}
        />
      )
    }
    if (screen === 'signup') {
      return (
        <AuthSignup
          onBack={() => go('landing')}
          onSuccess={login}
          onLogin={() => go('login')}
        />
      )
    }
    return (
      <Landing
        onLogin={() => go('login')}
        onSignup={() => go('signup')}
      />
    )
  }

  const authenticatedScreens = {
    dashboard: (
      <Dashboard
        applications={applications}
        onNewApplication={() => go('newApplication')}
        onOpenApplication={openApplication}
        onTracker={() => go('tracker')}
        onHotline={() => go('hotline')}
      />
    ),
    newApplication: (
      <NewApplication
        onGenerate={handleGenerate}
        onCancel={() => go('dashboard')}
      />
    ),
    applicationDetail: (
      <ApplicationDetail
        application={selectedApplication}
        onGoToDashboard={() => {
          setSelectedId(null)
          go('dashboard')
        }}
        onGoToHotline={() => {
          setSelectedId(null)
          go('hotline')
        }}
        onStatusChange={updateStatus}
      />
    ),
    tracker: (
      <Tracker
        applications={applications}
        onViewPack={openApplication}
      />
    ),
    hotline: <Hotline />,
  }

  const inner = authenticatedScreens[screen] ?? authenticatedScreens.dashboard

  return (
    <Layout
      user={user}
      active={layoutActive}
      onNavigate={(id) => {
        setSelectedId(null)
        go(id)
      }}
      onLogout={logout}
    >
      {inner}
    </Layout>
  )
}
