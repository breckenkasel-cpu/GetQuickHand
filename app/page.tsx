"use client"
import { useState, useEffect } from "react"
import { supabase } from "./supabase"

type Job = {
  id: string
  title: string
  description: string
  pay: number
  pay_type: string
  category: string
  location: string
  time_estimate: string
  posted_by: string
  posted_by_name: string
  urgent: boolean
  people_needed: number
  status: string
  created_at: string
}

type Claim = {
  id: string
  job_id: string
  claimer_id: string
  claimer_name: string
  status: string
  created_at: string
}

type Message = {
  id: string
  job_id: string
  sender_id: string
  sender_name: string
  content: string
  created_at: string
}

const categories = ["All", "Moving & Hauling", "Yard Work", "Errands", "Cleaning", "Pet Care", "Tech Help", "Tutoring", "Event Help", "Other"]

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [claims, setClaims] = useState<Claim[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [showPostForm, setShowPostForm] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [activeCategory, setActiveCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest" | "urgent">("newest")
  const [mounted, setMounted] = useState(false)
  const [toast, setToast] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [showMessages, setShowMessages] = useState(false)
  const [authEmail, setAuthEmail] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [authName, setAuthName] = useState("")
  const [authError, setAuthError] = useState("")
  const [formTitle, setFormTitle] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formPay, setFormPay] = useState("")
  const [formPayType, setFormPayType] = useState<"fixed" | "hourly">("fixed")
  const [formCategory, setFormCategory] = useState("Errands")
  const [formLocation, setFormLocation] = useState("")
  const [formTime, setFormTime] = useState("")
  const [formUrgent, setFormUrgent] = useState(false)
  const [formPeople, setFormPeople] = useState("1")
  useEffect(() => { setMounted(true); checkUser(); fetchJobs() }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchJobs = async () => {
    const { data } = await supabase.from("jobs").select("*").order("created_at", { ascending: false })
    if (data) setJobs(data)
  }

  const fetchClaims = async (jobId: string) => {
    const { data } = await supabase.from("claims").select("*").eq("job_id", jobId)
    if (data) setClaims(data)
  }

  const fetchMessages = async (jobId: string) => {
    const { data } = await supabase.from("messages").select("*").eq("job_id", jobId).order("created_at", { ascending: true })
    if (data) setMessages(data)
  }

  const handleSignUp = async () => {
    setAuthError("")
    const { data, error } = await supabase.auth.signUp({ email: authEmail, password: authPassword })
    if (error) { setAuthError(error.message); return }
    if (data.user) {
      await supabase.from("profiles").insert({ id: data.user.id, name: authName, email: authEmail })
      setAuthEmail(""); setAuthPassword(""); setAuthName("")
      setAuthError("")
      setIsSignUp(false)
      showToast("Account created! Check your email to confirm, then sign in.")
    }
  }

  const handleLogin = async () => {
    setAuthError("")
    const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
    if (error) { setAuthError(error.message); return }
    setUser(data.user)
    setShowAuth(false)
    setAuthEmail(""); setAuthPassword("")
    showToast("Logged in!")
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    showToast("Logged out")
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(""), 2500)
  }

  const resetForm = () => {
    setFormTitle(""); setFormDescription(""); setFormPay(""); setFormPayType("fixed")
    setFormCategory("Errands"); setFormLocation(""); setFormTime("")
    setFormUrgent(false); setFormPeople("1")
  }

  const handlePost = async () => {
    if (!user || !formTitle || !formPay || !formLocation) return
    const profile = await supabase.from("profiles").select("name").eq("id", user.id).single()
    const name = profile.data?.name || "Anonymous"
    const { error } = await supabase.from("jobs").insert({
      title: formTitle, description: formDescription || "No additional details.",
      pay: parseFloat(formPay), pay_type: formPayType, category: formCategory,
      location: formLocation, time_estimate: formTime || "Not specified",
      posted_by: user.id, posted_by_name: name, urgent: formUrgent,
      people_needed: parseInt(formPeople) || 1
    })
    if (!error) { fetchJobs(); resetForm(); setShowPostForm(false); showToast("Gig posted!") }
  }

  const handleClaim = async (jobId: string) => {
    if (!user) { setShowAuth(true); return }
    const profile = await supabase.from("profiles").select("name").eq("id", user.id).single()
    const name = profile.data?.name || "Anonymous"
    const existing = await supabase.from("claims").select("id").eq("job_id", jobId).eq("claimer_id", user.id)
    if (existing.data && existing.data.length > 0) { showToast("You already claimed this gig"); return }
    const { error } = await supabase.from("claims").insert({ job_id: jobId, claimer_id: user.id, claimer_name: name })
    if (!error) { fetchClaims(jobId); showToast("Request sent to poster!") }
  }

  const handleAcceptClaim = async (claimId: string, jobId: string) => {
    await supabase.from("claims").update({ status: "accepted" }).eq("id", claimId)
    await supabase.from("jobs").update({ status: "claimed" }).eq("id", jobId)
    fetchClaims(jobId); fetchJobs(); showToast("Claim accepted!")
  }

  const handleDeclineClaim = async (claimId: string, jobId: string) => {
    await supabase.from("claims").update({ status: "declined" }).eq("id", claimId)
    fetchClaims(jobId); showToast("Claim declined")
  }

  const handleSendMessage = async (jobId: string) => {
    if (!user || !newMessage.trim()) return
    const profile = await supabase.from("profiles").select("name").eq("id", user.id).single()
    const name = profile.data?.name || "Anonymous"
    const { error } = await supabase.from("messages").insert({ job_id: jobId, sender_id: user.id, sender_name: name, content: newMessage.trim() })
    if (!error) { setNewMessage(""); fetchMessages(jobId) }
  }

  const filteredJobs = jobs
    .filter(j => activeCategory === "All" || j.category === activeCategory)
    .filter(j => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return j.title.toLowerCase().includes(q) || j.location.toLowerCase().includes(q) || j.category.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortBy === "highest") return b.pay - a.pay
      if (sortBy === "lowest") return a.pay - b.pay
      if (sortBy === "urgent") return (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0)
      return 0
    })

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return "just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  if (!mounted) return null
  const canPost = formTitle && formPay && formLocation
  return (
    <div style={{ minHeight: "100vh", background: "#08090a", color: "#e8e8e8", fontFamily: "'DM Sans', sans-serif" }}>
      <style jsx global>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');`}</style>

      <div style={{ padding: "16px 28px", borderBottom: "1px solid #1a1b1e", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "rgba(8,9,10,0.85)", backdropFilter: "blur(20px)", zIndex: 100 }}>
        <h1 style={{ fontSize: "22px", fontFamily: "'Space Mono', monospace", fontWeight: 700, color: "#fff", margin: 0, cursor: "pointer" }} onClick={() => { setSelectedJob(null); setShowPostForm(false); setShowAuth(false) }}>QuickGig</h1>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {user ? (
            <>
              <button onClick={() => setShowPostForm(true)} style={{ padding: "10px 22px", background: "#cdff50", color: "#080808", border: "none", borderRadius: "10px", fontWeight: 600, fontSize: "14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>+ Post a Gig</button>
              <button onClick={handleLogout} style={{ padding: "10px 16px", background: "transparent", color: "#666", border: "1px solid #1e2025", borderRadius: "10px", fontSize: "13px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Log out</button>
            </>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{ padding: "10px 22px", background: "#cdff50", color: "#080808", border: "none", borderRadius: "10px", fontWeight: 600, fontSize: "14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Sign In</button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 20px 80px" }}>
        <h2 style={{ fontSize: "34px", fontWeight: 700, margin: "0 0 8px", color: "#fff" }}>Find a quick gig<span style={{ color: "#cdff50" }}>.</span></h2>
        <p style={{ color: "#555", margin: "0 0 24px", fontSize: "16px" }}>Post anything you need done. Pick up a gig and get paid.</p>
          <p style={{ fontSize: "20px", color: "#cdff50", fontWeight: 600, marginBottom: "12px", letterSpacing: "0.5px", textTransform: "uppercase" }}>How it works</p>
        <div style={{ display: "flex", gap: "20px", marginBottom: "32px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "200px", background: "#101114", border: "1px solid #1a1b1e", borderRadius: "14px", padding: "20px" }}>
            <div style={{ fontSize: "28px", marginBottom: "10px" }}>1</div>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Post</h3>
            <p style={{ fontSize: "13px", color: "#666", margin: 0, lineHeight: 1.5 }}>Describe what you need done and set your price. Anything goes.</p>
          </div>
          <div style={{ flex: 1, minWidth: "200px", background: "#101114", border: "1px solid #1a1b1e", borderRadius: "14px", padding: "20px" }}>
            <div style={{ fontSize: "28px", marginBottom: "10px" }}>2</div>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Claim</h3>
            <p style={{ fontSize: "13px", color: "#666", margin: 0, lineHeight: 1.5 }}>Someone nearby sees your gig and requests it. You review and accept.</p>
          </div>
          <div style={{ flex: 1, minWidth: "200px", background: "#101114", border: "1px solid #1a1b1e", borderRadius: "14px", padding: "20px" }}>
            <div style={{ fontSize: "28px", marginBottom: "10px" }}>3</div>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>Connect</h3>
            <p style={{ fontSize: "13px", color: "#666", margin: 0, lineHeight: 1.5 }}>Message each other, coordinate details, get it done, get paid. No fees.</p>
          </div>
        </div>

        <input style={{ width: "100%", padding: "14px 18px", background: "#111214", border: "1px solid #1e2025", borderRadius: "12px", color: "#e8e8e8", fontSize: "15px", fontFamily: "'DM Sans', sans-serif", outline: "none", marginBottom: "20px", boxSizing: "border-box" }} placeholder="Search by job, location, or category..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />

        <div style={{ display: "flex", gap: "8px", overflowX: "auto", marginBottom: "20px" }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{ padding: "8px 16px", borderRadius: "20px", border: activeCategory === cat ? "1px solid #cdff50" : "1px solid #1e2025", background: activeCategory === cat ? "rgba(205,255,80,0.08)" : "transparent", color: activeCategory === cat ? "#cdff50" : "#777", fontSize: "13px", fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif" }}>{cat}</button>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <span style={{ fontSize: "13px", color: "#555" }}>{filteredJobs.length} gig{filteredJobs.length !== 1 ? "s" : ""} available</span>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ padding: "8px 12px", background: "#111214", border: "1px solid #1e2025", borderRadius: "8px", color: "#aaa", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", cursor: "pointer", outline: "none" }}>
            <option value="newest">Newest first</option>
            <option value="urgent">Urgent first</option>
            <option value="highest">Highest pay</option>
            <option value="lowest">Lowest pay</option>
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredJobs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#444" }}>
              <p style={{ fontSize: "18px", marginBottom: "8px" }}>No gigs yet</p>
              <p style={{ fontSize: "14px" }}>{user ? "Be the first to post one!" : "Sign in to post a gig"}</p>
            </div>
          ) : filteredJobs.map(job => (
            <div key={job.id} onClick={() => { setSelectedJob(job); fetchClaims(job.id); setShowMessages(false) }} style={{ background: job.status !== "open" ? "#0d1210" : "#101114", border: job.urgent && job.status === "open" ? "1px solid #2a2000" : "1px solid #1a1b1e", borderRadius: "14px", padding: "22px 24px", cursor: "pointer", opacity: job.status === "completed" ? 0.5 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                    <h3 style={{ fontSize: "17px", fontWeight: 600, margin: "0 0 6px 0", color: "#f0f0f0" }}>{job.title}</h3>
                    {job.urgent && job.status === "open" && <span style={{ background: "rgba(255,80,80,0.1)", color: "#ff6b6b", padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginLeft: "10px" }}>Urgent</span>}
                    {job.status === "claimed" && <span style={{ background: "rgba(205,255,80,0.1)", color: "#cdff50", padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginLeft: "10px" }}>In Progress</span>}
                    {job.status === "completed" && <span style={{ background: "rgba(80,200,120,0.1)", color: "#50c878", padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginLeft: "10px" }}>Done</span>}
                  </div>
                  <p style={{ fontSize: "13px", color: "#666", margin: "0 0 3px 0" }}>{job.location} · {job.category}</p>
                  <p style={{ fontSize: "13px", color: "#666", margin: "0 0 3px 0" }}>{job.time_estimate} · Posted by {job.posted_by_name} · {timeAgo(job.created_at)}</p>
                  {job.people_needed > 1 && <p style={{ fontSize: "12px", color: "#555", marginTop: "8px" }}>👥 {job.people_needed} people needed</p>}
                </div>
                <div style={{ background: "rgba(205,255,80,0.1)", color: "#cdff50", padding: "8px 16px", borderRadius: "20px", fontWeight: 700, fontSize: "15px", fontFamily: "'Space Mono', monospace", whiteSpace: "nowrap" }}>${job.pay}{job.pay_type === "hourly" ? "/hr" : ""}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {selectedJob && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 200, display: "flex", justifyContent: "center", alignItems: "flex-start", paddingTop: "60px", overflowY: "auto" }} onClick={() => { setSelectedJob(null); setShowMessages(false) }}>
          <div style={{ background: "#111214", border: "1px solid #1e2025", borderRadius: "18px", width: "100%", maxWidth: "560px", padding: "32px", margin: "0 16px 60px", position: "relative" }} onClick={e => e.stopPropagation()}>
            <button style={{ position: "absolute", top: "16px", right: "20px", background: "none", border: "none", color: "#555", fontSize: "24px", cursor: "pointer" }} onClick={() => { setSelectedJob(null); setShowMessages(false) }}>✕</button>
            <div style={{ display: "inline-block", background: "rgba(255,255,255,0.05)", color: "#888", padding: "4px 12px", borderRadius: "6px", fontSize: "12px", marginBottom: "16px" }}>{selectedJob.category}</div>
            <h2 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 8px", color: "#fff" }}>{selectedJob.title}</h2>
            {selectedJob.urgent && <span style={{ display: "inline-block", background: "rgba(255,80,80,0.1)", color: "#ff6b6b", padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginBottom: "16px" }}>Urgent</span>}
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "24px" }}>
              <span style={{ fontSize: "36px", fontWeight: 700, fontFamily: "'Space Mono', monospace", color: "#cdff50" }}>${selectedJob.pay}</span>
              <span style={{ fontSize: "14px", color: "#666" }}>{selectedJob.pay_type === "hourly" ? "per hour" : "flat rate"}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              <div style={{ background: "#0c0d0f", borderRadius: "10px", padding: "14px 16px" }}><div style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Location</div><div style={{ fontSize: "15px", color: "#ddd", fontWeight: 500 }}>{selectedJob.location}</div></div>
              <div style={{ background: "#0c0d0f", borderRadius: "10px", padding: "14px 16px" }}><div style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Time Estimate</div><div style={{ fontSize: "15px", color: "#ddd", fontWeight: 500 }}>{selectedJob.time_estimate}</div></div>
              <div style={{ background: "#0c0d0f", borderRadius: "10px", padding: "14px 16px" }}><div style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Posted By</div><div style={{ fontSize: "15px", color: "#ddd", fontWeight: 500 }}>{selectedJob.posted_by_name}</div></div>
              <div style={{ background: "#0c0d0f", borderRadius: "10px", padding: "14px 16px" }}><div style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>People Needed</div><div style={{ fontSize: "15px", color: "#ddd", fontWeight: 500 }}>{selectedJob.people_needed}</div></div>
            </div>
            <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#999", marginBottom: "28px" }}>{selectedJob.description}</p>

            {user && user.id === selectedJob.posted_by ? (
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#fff", marginBottom: "16px" }}>Requests ({claims.filter(c => c.status === "pending").length} pending)</h3>
                {claims.length === 0 ? (
                  <p style={{ color: "#555", fontSize: "14px" }}>No one has claimed this gig yet.</p>
                ) : claims.map(claim => (
                  <div key={claim.id} style={{ background: "#0c0d0f", borderRadius: "10px", padding: "16px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ margin: 0, color: "#ddd", fontWeight: 500 }}>{claim.claimer_name}</p>
                      <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#555" }}>{claim.status === "pending" ? "Wants to do this gig" : claim.status === "accepted" ? "Accepted" : "Declined"}</p>
                    </div>
                    {claim.status === "pending" && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => handleAcceptClaim(claim.id, selectedJob.id)} style={{ padding: "8px 16px", background: "#cdff50", color: "#080808", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "13px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Accept</button>
                        <button onClick={() => handleDeclineClaim(claim.id, selectedJob.id)} style={{ padding: "8px 16px", background: "transparent", color: "#666", border: "1px solid #1e2025", borderRadius: "8px", fontSize: "13px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Decline</button>
                      </div>
                    )}
                    {claim.status === "accepted" && (
                      <span style={{ color: "#cdff50", fontSize: "13px", fontWeight: 600 }}>✓ Accepted</span>
                    )}
                    {claim.status === "declined" && (
                      <span style={{ color: "#ff6b6b", fontSize: "13px", fontWeight: 600 }}>✗ Declined</span>
                    )}
                  </div>
                ))}
                {claims.some(c => c.status === "accepted") && (
                  <button onClick={() => { setShowMessages(true); fetchMessages(selectedJob.id) }} style={{ width: "100%", marginTop: "16px", padding: "14px", background: "rgba(205,255,80,0.08)", color: "#cdff50", border: "1px solid rgba(205,255,80,0.2)", borderRadius: "12px", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Open Messages</button>
                )}
              </div>
            ) : (
              <div>
                {selectedJob.status === "open" ? (
                  <button onClick={() => handleClaim(selectedJob.id)} style={{ width: "100%", padding: "16px", background: "#cdff50", color: "#080808", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>{user ? "I'm Interested — Request This Gig" : "Sign In to Claim This Gig"}</button>
                ) : selectedJob.status === "claimed" ? (
                  <div>
                    {claims.some(c => c.claimer_id === user?.id && c.status === "accepted") ? (
                      <button onClick={() => { setShowMessages(true); fetchMessages(selectedJob.id) }} style={{ width: "100%", padding: "14px", background: "rgba(205,255,80,0.08)", color: "#cdff50", border: "1px solid rgba(205,255,80,0.2)", borderRadius: "12px", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Open Messages</button>
                    ) : (
                      <div style={{ textAlign: "center", padding: "16px", background: "rgba(205,255,80,0.06)", borderRadius: "12px", color: "#cdff50", fontWeight: 600 }}>This gig has been claimed</div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "16px", background: "rgba(80,200,120,0.06)", borderRadius: "12px", color: "#50c878", fontWeight: 600 }}>This gig is complete</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {showMessages && selectedJob && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 300, display: "flex", justifyContent: "center", alignItems: "flex-start", paddingTop: "60px", overflowY: "auto" }} onClick={() => setShowMessages(false)}>
          <div style={{ background: "#111214", border: "1px solid #1e2025", borderRadius: "18px", width: "100%", maxWidth: "480px", padding: "32px", margin: "0 16px 60px", position: "relative", display: "flex", flexDirection: "column", maxHeight: "70vh" }} onClick={e => e.stopPropagation()}>
            <button style={{ position: "absolute", top: "16px", right: "20px", background: "none", border: "none", color: "#555", fontSize: "24px", cursor: "pointer" }} onClick={() => setShowMessages(false)}>✕</button>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#fff", margin: "0 0 20px" }}>Messages — {selectedJob.title}</h3>
            <div style={{ flex: 1, overflowY: "auto", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {messages.length === 0 ? (
                <p style={{ color: "#555", fontSize: "14px", textAlign: "center", padding: "20px" }}>No messages yet. Say hello!</p>
              ) : messages.map(msg => (
                <div key={msg.id} style={{ padding: "12px 16px", borderRadius: "12px", background: msg.sender_id === user?.id ? "rgba(205,255,80,0.08)" : "#0c0d0f", alignSelf: msg.sender_id === user?.id ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                  <p style={{ fontSize: "11px", color: "#555", margin: "0 0 4px", fontWeight: 600 }}>{msg.sender_name}</p>
                  <p style={{ fontSize: "14px", color: "#ddd", margin: 0, lineHeight: 1.5 }}>{msg.content}</p>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <input style={{ flex: 1, padding: "12px 14px", background: "#0c0d0f", border: "1px solid #1e2025", borderRadius: "10px", color: "#e8e8e8", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", outline: "none" }} placeholder="Type a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleSendMessage(selectedJob.id) }} />
              <button onClick={() => handleSendMessage(selectedJob.id)} style={{ padding: "12px 20px", background: "#cdff50", color: "#080808", border: "none", borderRadius: "10px", fontWeight: 600, fontSize: "14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Send</button>
            </div>
          </div>
        </div>
      )}

      {showPostForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 200, display: "flex", justifyContent: "center", alignItems: "flex-start", paddingTop: "60px", overflowY: "auto" }} onClick={() => { setShowPostForm(false); resetForm() }}>
          <div style={{ background: "#111214", border: "1px solid #1e2025", borderRadius: "18px", width: "100%", maxWidth: "560px", padding: "32px", margin: "0 16px 60px", position: "relative" }} onClick={e => e.stopPropagation()}>
            <button style={{ position: "absolute", top: "16px", right: "20px", background: "none", border: "none", color: "#555", fontSize: "24px", cursor: "pointer" }} onClick={() => { setShowPostForm(false); resetForm() }}>✕</button>
            <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 24px", color: "#fff" }}>Post a new gig</h2>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#666", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>What needs to be done? *</label>
            <input style={{ width: "100%", padding: "12px 14px", background: "#0c0d0f", border: "1px solid #1e2025", borderRadius: "10px", color: "#e8e8e8", fontSize: "15px", fontFamily: "'DM Sans', sans-serif", outline: "none", marginBottom: "18px", boxSizing: "border-box" }} placeholder="e.g. Help me move a dresser" value={formTitle} onChange={e => setFormTitle(e.target.value)} />
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#666", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Details</label>
            <textarea style={{ width: "100%", padding: "12px 14px", background: "#0c0d0f", border: "1px solid #1e2025", borderRadius: "10px", color: "#e8e8e8", fontSize: "15px", fontFamily: "'DM Sans', sans-serif", outline: "none", marginBottom: "18px", boxSizing: "border-box", resize: "vertical", minHeight: "100px" }} placeholder="Add any extra info — what to expect, what to bring, etc." value={formDescription} onChange={e => setFormDescription(e.target.value)} />
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#666", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Category</label>
            <select style={{ width: "100%", padding: "12px 14px", background: "#0c0d0f", border: "1px solid #1e2025", borderRadius: "10px", color: "#e8e8e8", fontSize: "15px", fontFamily: "'DM Sans', sans-serif", outline: "none", marginBottom: "18px", boxSizing: "border-box" }} value={formCategory} onChange={e => setFormCategory(e.target.value)}>
              {categories.filter(c => c !== "All").map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#666", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Pay type</label>
            <div style={{ display: "flex", borderRadius: "10px", overflow: "hidden", border: "1px solid #1e2025", marginBottom: "18px" }}>
              <button onClick={() => setFormPayType("fixed")} style={{ flex: 1, padding: "10px", background: formPayType === "fixed" ? "rgba(205,255,80,0.08)" : "#0c0d0f", color: formPayType === "fixed" ? "#cdff50" : "#555", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Fixed price</button>
              <button onClick={() => setFormPayType("hourly")} style={{ flex: 1, padding: "10px", background: formPayType === "hourly" ? "rgba(205,255,80,0.08)" : "#0c0d0f", color: formPayType === "hourly" ? "#cdff50" : "#555", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Hourly rate</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div><label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#666", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{formPayType === "hourly" ? "Rate ($/hr)" : "Pay ($)"} *</label><input style={{ width: "100%", padding: "12px 14px", background: "#0c0d0f", border: "1px solid #1e2025", borderRadius: "10px", color: "#e8e8e8", fontSize: "15px", fontFamily: "'DM Sans', sans-serif", outline: "none", marginBottom: "18px", boxSizing: "border-box" }} type="number" placeholder="0" value={formPay} onChange={e => setFormPay(e.target.value)} /></div>
              <div><label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#666", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Time estimate</label><input style={{ width: "100%", padding: "12px 14px", background: "#0c0d0f", border: "1px solid #1e2025", borderRadius: "10px", color: "#e8e8e8", fontSize: "15px", fontFamily: "'DM Sans', sans-serif", outline: "none", marginBottom: "18px", boxSizing: "border-box" }} placeholder="e.g. ~1 hour" value={formTime} onChange={e => setFormTime(e.target.value)} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div><label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#666", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Location *</label><input style={{ width: "100%", padding: "12px 14px", background: "#0c0d0f", border: "1px solid #1e2025", borderRadius: "10px", color: "#e8e8e8", fontSize: "15px", fontFamily: "'DM Sans', sans-serif", outline: "none", marginBottom: "18px", boxSizing: "border-box" }} placeholder="e.g. Reynolda Village" value={formLocation} onChange={e => setFormLocation(e.target.value)} /></div>
              <div><label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#666", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>People needed</label><input style={{ width: "100%", padding: "12px 14px", background: "#0c0d0f", border: "1px solid #1e2025", borderRadius: "10px", color: "#e8e8e8", fontSize: "15px", fontFamily: "'DM Sans', sans-serif", outline: "none", marginBottom: "18px", boxSizing: "border-box" }} type="number" min="1" value={formPeople} onChange={e => setFormPeople(e.target.value)} /></div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "22px" }}>
              <button onClick={() => setFormUrgent(!formUrgent)} style={{ width: "44px", height: "24px", borderRadius: "12px", background: formUrgent ? "#cdff50" : "#1e2025", border: "none", cursor: "pointer", position: "relative" }}><div style={{ width: "18px", height: "18px", borderRadius: "50%", background: formUrgent ? "#080808" : "#555", position: "absolute", top: "3px", left: formUrgent ? "23px" : "3px", transition: "all 0.2s" }} /></button>
              <span style={{ fontSize: "14px", color: "#888" }}>Mark as urgent</span>
            </div>
            <button onClick={canPost ? handlePost : undefined} style={{ width: "100%", padding: "14px", background: canPost ? "#cdff50" : "#1e2025", color: canPost ? "#080808" : "#444", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 700, cursor: canPost ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif" }}>Post Gig</button>
          </div>
        </div>
      )}

      {showAuth && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 200, display: "flex", justifyContent: "center", alignItems: "flex-start", paddingTop: "100px" }} onClick={() => { setShowAuth(false); setAuthError("") }}>
          <div style={{ background: "#111214", border: "1px solid #1e2025", borderRadius: "18px", width: "100%", maxWidth: "400px", padding: "32px", margin: "0 16px", position: "relative" }} onClick={e => e.stopPropagation()}>
            <button style={{ position: "absolute", top: "16px", right: "20px", background: "none", border: "none", color: "#555", fontSize: "24px", cursor: "pointer" }} onClick={() => { setShowAuth(false); setAuthError("") }}>✕</button>
            <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 24px", color: "#fff" }}>{isSignUp ? "Create Account" : "Sign In"}</h2>
            {authError && <p style={{ color: "#ff6b6b", fontSize: "13px", marginBottom: "16px", background: "rgba(255,80,80,0.08)", padding: "10px 14px", borderRadius: "8px" }}>{authError}</p>}
            {isSignUp && (
              <><label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#666", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Your Name</label>
              <input style={{ width: "100%", padding: "12px 14px", background: "#0c0d0f", border: "1px solid #1e2025", borderRadius: "10px", color: "#e8e8e8", fontSize: "15px", fontFamily: "'DM Sans', sans-serif", outline: "none", marginBottom: "18px", boxSizing: "border-box" }} placeholder="e.g. Marcus T." value={authName} onChange={e => setAuthName(e.target.value)} /></>
            )}
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#666", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Email</label>
            <input style={{ width: "100%", padding: "12px 14px", background: "#0c0d0f", border: "1px solid #1e2025", borderRadius: "10px", color: "#e8e8e8", fontSize: "15px", fontFamily: "'DM Sans', sans-serif", outline: "none", marginBottom: "18px", boxSizing: "border-box" }} type="email" placeholder="you@email.com" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#666", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Password</label>
            <input style={{ width: "100%", padding: "12px 14px", background: "#0c0d0f", border: "1px solid #1e2025", borderRadius: "10px", color: "#e8e8e8", fontSize: "15px", fontFamily: "'DM Sans', sans-serif", outline: "none", marginBottom: "24px", boxSizing: "border-box" }} type="password" placeholder="At least 6 characters" value={authPassword} onChange={e => setAuthPassword(e.target.value)} />
            <button onClick={isSignUp ? handleSignUp : handleLogin} style={{ width: "100%", padding: "14px", background: "#cdff50", color: "#080808", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginBottom: "16px" }}>{isSignUp ? "Create Account" : "Sign In"}</button>
            <p style={{ textAlign: "center", fontSize: "13px", color: "#555", margin: 0 }}>{isSignUp ? "Already have an account?" : "Don't have an account?"} <span onClick={() => { setIsSignUp(!isSignUp); setAuthError("") }} style={{ color: "#cdff50", cursor: "pointer", fontWeight: 600 }}>{isSignUp ? "Sign In" : "Sign Up"}</span></p>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: "32px", left: "50%", transform: "translateX(-50%)", background: "#cdff50", color: "#080808", padding: "14px 28px", borderRadius: "12px", fontWeight: 600, fontSize: "15px", zIndex: 999, fontFamily: "'DM Sans', sans-serif", boxShadow: "0 8px 32px rgba(205,255,80,0.2)" }}>{toast}</div>
      )}
    </div>
  )
}