"use client"
import { useState, useEffect } from "react"

type Job = {
  id: number
  title: string
  description: string
  pay: number
  payType: "fixed" | "hourly"
  category: string
  location: string
  timeEstimate: string
  postedBy: string
  postedAt: Date
  urgent: boolean
  peopleNeeded: number
  claimed: boolean
}

const initialJobs: Job[] = [
  { id: 1, title: "Move a couch to 2nd floor apartment", description: "Got a big sectional that needs to go up one flight of stairs. Two people would be ideal.", pay: 40, payType: "fixed", category: "Moving & Hauling", location: "Wake Forest area", timeEstimate: "~30 min", postedBy: "Marcus T.", postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), urgent: true, peopleNeeded: 2, claimed: false },
  { id: 2, title: "Mow my lawn — front and back yard", description: "Standard suburban lawn. I have the mower and all the equipment, just need someone to do it.", pay: 25, payType: "fixed", category: "Yard Work", location: "Reynolds Village", timeEstimate: "~1 hour", postedBy: "Karen L.", postedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), urgent: false, peopleNeeded: 1, claimed: false },
  { id: 3, title: "Pick up groceries from Publix", description: "Short list of about 15 items. Just need them dropped off at my front door.", pay: 15, payType: "fixed", category: "Errands", location: "Thalhimer area", timeEstimate: "~45 min", postedBy: "David R.", postedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), urgent: false, peopleNeeded: 1, claimed: false },
  { id: 4, title: "Help unload a U-Haul truck", description: "Mostly boxes and some furniture. Shouldn't take long with an extra pair of hands.", pay: 60, payType: "fixed", category: "Moving & Hauling", location: "Crowne Park", timeEstimate: "~1.5 hours", postedBy: "James W.", postedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), urgent: true, peopleNeeded: 2, claimed: false },
  { id: 5, title: "Walk my dog while I'm at work", description: "Golden retriever, super friendly. Just needs a 30-minute walk around the neighborhood.", pay: 12, payType: "fixed", category: "Pet Care", location: "Ardmore", timeEstimate: "~30 min", postedBy: "Aaliyah S.", postedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), urgent: false, peopleNeeded: 1, claimed: false },
  { id: 6, title: "Pressure wash my driveway", description: "Driveway is about 40ft long. I have the pressure washer, just need someone who knows how to use it.", pay: 20, payType: "hourly", category: "Cleaning", location: "Buena Vista", timeEstimate: "~2 hours", postedBy: "Tom B.", postedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), urgent: false, peopleNeeded: 1, claimed: false },
]

const categories = ["All", "Moving & Hauling", "Yard Work", "Errands", "Cleaning", "Pet Care", "Tech Help", "Tutoring", "Event Help", "Other"]

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
export default function Home() {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showPostForm, setShowPostForm] = useState(false)
  const [activeCategory, setActiveCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest" | "urgent">("newest")
  const [showClaimedConfirm, setShowClaimedConfirm] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [formTitle, setFormTitle] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formPay, setFormPay] = useState("")
  const [formPayType, setFormPayType] = useState<"fixed" | "hourly">("fixed")
  const [formCategory, setFormCategory] = useState("Errands")
  const [formLocation, setFormLocation] = useState("")
  const [formTime, setFormTime] = useState("")
  const [formName, setFormName] = useState("")
  const [formUrgent, setFormUrgent] = useState(false)
  const [formPeople, setFormPeople] = useState("1")

  useEffect(() => { setMounted(true) }, [])

  const resetForm = () => {
    setFormTitle(""); setFormDescription(""); setFormPay(""); setFormPayType("fixed")
    setFormCategory("Errands"); setFormLocation(""); setFormTime("")
    setFormName(""); setFormUrgent(false); setFormPeople("1")
  }

  const handlePost = () => {
    if (!formTitle || !formPay || !formLocation || !formName) return
    const newJob: Job = {
      id: Date.now(), title: formTitle, description: formDescription || "No additional details provided.",
      pay: parseFloat(formPay), payType: formPayType, category: formCategory, location: formLocation,
      timeEstimate: formTime || "Not specified", postedBy: formName, postedAt: new Date(),
      urgent: formUrgent, peopleNeeded: parseInt(formPeople) || 1, claimed: false,
    }
    setJobs([newJob, ...jobs]); resetForm(); setShowPostForm(false)
  }

  const handleClaim = (jobId: number) => {
    setJobs(jobs.map(j => j.id === jobId ? { ...j, claimed: true } : j))
    setShowClaimedConfirm(true)
    setTimeout(() => { setShowClaimedConfirm(false); setSelectedJob(null) }, 2000)
  }

  const filteredJobs = jobs
    .filter(j => activeCategory === "All" || j.category === activeCategory)
    .filter(j => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return j.title.toLowerCase().includes(q) || j.location.toLowerCase().includes(q) || j.category.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (sortBy === "newest") return b.postedAt.getTime() - a.postedAt.getTime()
      if (sortBy === "highest") return b.pay - a.pay
      if (sortBy === "lowest") return a.pay - b.pay
      if (sortBy === "urgent") return (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0)
      return 0
    })

  if (!mounted) return null
  const canPost = formTitle && formPay && formLocation && formName
  return (
    <div style={{ minHeight: "100vh", background: "#08090a", color: "#e8e8e8", fontFamily: "'DM Sans', sans-serif" }}>
      <style jsx global>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');`}</style>

      <div style={{ padding: "16px 28px", borderBottom: "1px solid #1a1b1e", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "rgba(8,9,10,0.85)", backdropFilter: "blur(20px)", zIndex: 100 }}>
        <h1 style={{ fontSize: "22px", fontFamily: "'Space Mono', monospace", fontWeight: 700, color: "#fff", margin: 0 }}>QuickGig</h1>
        <button onClick={() => setShowPostForm(true)} style={{ padding: "10px 22px", background: "#cdff50", color: "#080808", border: "none", borderRadius: "10px", fontWeight: 600, fontSize: "14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>+ Post a Gig</button>
      </div>

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 20px 80px" }}>
        <h2 style={{ fontSize: "34px", fontWeight: 700, margin: "0 0 8px", color: "#fff" }}>Find a quick gig<span style={{ color: "#cdff50" }}>.</span></h2>
        <p style={{ color: "#555", margin: "0 0 32px", fontSize: "16px" }}>Real jobs from real people nearby — pick one up and get paid today.</p>

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
              <p style={{ fontSize: "18px", marginBottom: "8px" }}>No gigs found</p>
              <p style={{ fontSize: "14px" }}>Try a different search or category</p>
            </div>
          ) : filteredJobs.map(job => (
            <div key={job.id} onClick={() => !job.claimed && setSelectedJob(job)} style={{ background: job.claimed ? "#0d1210" : "#101114", border: job.urgent && !job.claimed ? "1px solid #2a2000" : "1px solid #1a1b1e", borderRadius: "14px", padding: "22px 24px", cursor: job.claimed ? "default" : "pointer", opacity: job.claimed ? 0.5 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                    <h3 style={{ fontSize: "17px", fontWeight: 600, margin: "0 0 6px 0", color: "#f0f0f0" }}>{job.title}</h3>
                    {job.urgent && <span style={{ background: "rgba(255,80,80,0.1)", color: "#ff6b6b", padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginLeft: "10px" }}>Urgent</span>}
                    {job.claimed && <span style={{ background: "rgba(80,200,120,0.1)", color: "#50c878", padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginLeft: "10px" }}>Claimed</span>}
                  </div>
                  <p style={{ fontSize: "13px", color: "#666", margin: "0 0 3px 0" }}>{job.location} · {job.category}</p>
                  <p style={{ fontSize: "13px", color: "#666", margin: "0 0 3px 0" }}>{job.timeEstimate} · Posted by {job.postedBy} · {timeAgo(job.postedAt)}</p>
                  {job.peopleNeeded > 1 && <p style={{ fontSize: "12px", color: "#555", marginTop: "8px" }}>👥 {job.peopleNeeded} people needed</p>}
                </div>
                <div style={{ background: "rgba(205,255,80,0.1)", color: "#cdff50", padding: "8px 16px", borderRadius: "20px", fontWeight: 700, fontSize: "15px", fontFamily: "'Space Mono', monospace", whiteSpace: "nowrap" }}>${job.pay}{job.payType === "hourly" ? "/hr" : ""}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {selectedJob && !showPostForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 200, display: "flex", justifyContent: "center", alignItems: "flex-start", paddingTop: "60px", overflowY: "auto" }} onClick={() => setSelectedJob(null)}>
          <div style={{ background: "#111214", border: "1px solid #1e2025", borderRadius: "18px", width: "100%", maxWidth: "560px", padding: "32px", margin: "0 16px 60px", position: "relative" }} onClick={e => e.stopPropagation()}>
            <button style={{ position: "absolute", top: "16px", right: "20px", background: "none", border: "none", color: "#555", fontSize: "24px", cursor: "pointer" }} onClick={() => setSelectedJob(null)}>✕</button>
            <div style={{ display: "inline-block", background: "rgba(255,255,255,0.05)", color: "#888", padding: "4px 12px", borderRadius: "6px", fontSize: "12px", marginBottom: "16px" }}>{selectedJob.category}</div>
            <h2 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 8px", color: "#fff" }}>{selectedJob.title}</h2>
            {selectedJob.urgent && <span style={{ display: "inline-block", background: "rgba(255,80,80,0.1)", color: "#ff6b6b", padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", marginBottom: "16px" }}>Urgent</span>}
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "24px" }}>
              <span style={{ fontSize: "36px", fontWeight: 700, fontFamily: "'Space Mono', monospace", color: "#cdff50" }}>${selectedJob.pay}</span>
              <span style={{ fontSize: "14px", color: "#666" }}>{selectedJob.payType === "hourly" ? "per hour" : "flat rate"}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              <div style={{ background: "#0c0d0f", borderRadius: "10px", padding: "14px 16px" }}><div style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Location</div><div style={{ fontSize: "15px", color: "#ddd", fontWeight: 500 }}>{selectedJob.location}</div></div>
              <div style={{ background: "#0c0d0f", borderRadius: "10px", padding: "14px 16px" }}><div style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Time Estimate</div><div style={{ fontSize: "15px", color: "#ddd", fontWeight: 500 }}>{selectedJob.timeEstimate}</div></div>
              <div style={{ background: "#0c0d0f", borderRadius: "10px", padding: "14px 16px" }}><div style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Posted By</div><div style={{ fontSize: "15px", color: "#ddd", fontWeight: 500 }}>{selectedJob.postedBy}</div></div>
              <div style={{ background: "#0c0d0f", borderRadius: "10px", padding: "14px 16px" }}><div style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>People Needed</div><div style={{ fontSize: "15px", color: "#ddd", fontWeight: 500 }}>{selectedJob.peopleNeeded}</div></div>
            </div>
            <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#999", marginBottom: "28px" }}>{selectedJob.description}</p>
            {showClaimedConfirm ? (
              <div style={{ textAlign: "center", padding: "16px", background: "rgba(205,255,80,0.06)", borderRadius: "12px", color: "#cdff50", fontWeight: 600 }}>✓ Gig claimed! You're on it.</div>
            ) : (
              <button onClick={() => handleClaim(selectedJob.id)} style={{ width: "100%", padding: "16px", background: "#cdff50", color: "#080808", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Claim This Gig</button>
            )}
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
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#666", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{formPayType === "hourly" ? "Rate ($/hr)" : "Pay ($)"} *</label>
                <input style={{ width: "100%", padding: "12px 14px", background: "#0c0d0f", border: "1px solid #1e2025", borderRadius: "10px", color: "#e8e8e8", fontSize: "15px", fontFamily: "'DM Sans', sans-serif", outline: "none", marginBottom: "18px", boxSizing: "border-box" }} type="number" placeholder="0" value={formPay} onChange={e => setFormPay(e.target.value)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#666", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Time estimate</label>
                <input style={{ width: "100%", padding: "12px 14px", background: "#0c0d0f", border: "1px solid #1e2025", borderRadius: "10px", color: "#e8e8e8", fontSize: "15px", fontFamily: "'DM Sans', sans-serif", outline: "none", marginBottom: "18px", boxSizing: "border-box" }} placeholder="e.g. ~1 hour" value={formTime} onChange={e => setFormTime(e.target.value)} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#666", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Location *</label>
                <input style={{ width: "100%", padding: "12px 14px", background: "#0c0d0f", border: "1px solid #1e2025", borderRadius: "10px", color: "#e8e8e8", fontSize: "15px", fontFamily: "'DM Sans', sans-serif", outline: "none", marginBottom: "18px", boxSizing: "border-box" }} placeholder="e.g. Reynolda Village" value={formLocation} onChange={e => setFormLocation(e.target.value)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#666", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>People needed</label>
                <input style={{ width: "100%", padding: "12px 14px", background: "#0c0d0f", border: "1px solid #1e2025", borderRadius: "10px", color: "#e8e8e8", fontSize: "15px", fontFamily: "'DM Sans', sans-serif", outline: "none", marginBottom: "18px", boxSizing: "border-box" }} type="number" min="1" value={formPeople} onChange={e => setFormPeople(e.target.value)} />
              </div>
            </div>

            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#666", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Your name *</label>
            <input style={{ width: "100%", padding: "12px 14px", background: "#0c0d0f", border: "1px solid #1e2025", borderRadius: "10px", color: "#e8e8e8", fontSize: "15px", fontFamily: "'DM Sans', sans-serif", outline: "none", marginBottom: "18px", boxSizing: "border-box" }} placeholder="e.g. Marcus T." value={formName} onChange={e => setFormName(e.target.value)} />

            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "22px" }}>
              <button onClick={() => setFormUrgent(!formUrgent)} style={{ width: "44px", height: "24px", borderRadius: "12px", background: formUrgent ? "#cdff50" : "#1e2025", border: "none", cursor: "pointer", position: "relative" }}>
                <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: formUrgent ? "#080808" : "#555", position: "absolute", top: "3px", left: formUrgent ? "23px" : "3px", transition: "all 0.2s" }} />
              </button>
              <span style={{ fontSize: "14px", color: "#888" }}>Mark as urgent</span>
            </div>

            <button onClick={canPost ? handlePost : undefined} style={{ width: "100%", padding: "14px", background: canPost ? "#cdff50" : "#1e2025", color: canPost ? "#080808" : "#444", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 700, cursor: canPost ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif" }}>Post Gig</button>
          </div>
        </div>
      )}

      {showClaimedConfirm && (
        <div style={{ position: "fixed", bottom: "32px", left: "50%", transform: "translateX(-50%)", background: "#cdff50", color: "#080808", padding: "14px 28px", borderRadius: "12px", fontWeight: 600, fontSize: "15px", zIndex: 999, fontFamily: "'DM Sans', sans-serif", boxShadow: "0 8px 32px rgba(205,255,80,0.2)" }}>✓ Gig claimed successfully!</div>
      )}
    </div>
  )
}