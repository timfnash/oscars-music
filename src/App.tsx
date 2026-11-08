import { HashRouter, Link, NavLink, Route, Routes } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { DataProvider, useData } from './lib/store'
import Songs from './pages/Songs'
import Song from './pages/Song'
import SongForm from './pages/SongForm'
import Collections from './pages/Collections'
import Collection from './pages/Collection'
import Calendar from './pages/Calendar'
import About from './pages/About'
import Contact from './pages/Contact'
import Admin from './pages/Admin'

function Shell() {
  const { isAdmin, auth } = useData()
  return (
    <>
      <header className="top"><div className="wrap bar">
        <Link className="brand" to="/">Oscar's <em>music</em></Link>
        <nav className="main" aria-label="Main">
          <NavLink to="/" end className={({ isActive }) => (isActive || location.hash.startsWith('#/songs') ? 'active' : '')}>Songs</NavLink>
          <NavLink to="/collections">Collections</NavLink>
          <NavLink to="/calendar">Calendar</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </nav>
        <Link className="btn primary" to="/contact?r=booking">Book Oscar</Link>
      </div></header>
      {isAdmin && (
        <div className="adminbar"><div className="wrap">
          <b>Admin mode</b><span>You can edit this site.</span><Link to="/admin">Admin page</Link>
          <button onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div></div>
      )}
      <div className="draftbar"><div className="wrap">Preview. This site is being filled in and is not listed on search engines yet.</div></div>
      <main className="wrap">
        <Routes>
          <Route path="/" element={<Songs />} />
          <Route path="/songs/new" element={<SongForm />} />
          <Route path="/songs/:id" element={<Song />} />
          <Route path="/songs/:id/edit" element={<SongForm />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/collections/:id" element={<Collection />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<div className="empty">Page not found. <Link to="/">Back to songs</Link></div>} />
        </Routes>
      </main>
      <footer><div className="wrap"><span>© Oscar Nash</span><span>{auth ? <Link to="/admin">Admin</Link> : <Link to="/admin">Admin sign in</Link>}</span></div></footer>
    </>
  )
}

export default function App() {
  return <HashRouter><DataProvider><Shell /></DataProvider></HashRouter>
}
