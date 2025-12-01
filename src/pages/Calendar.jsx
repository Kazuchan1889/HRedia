import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function Calendar(){
  const [events, setEvents] = useState([])
  useEffect(()=>{ load() },[])
  async function load(){
    try{
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:4000/api/leaverequests', { headers: { Authorization: `Bearer ${token}` } })
      // show only approved as events
      const ev = res.data.filter(r=>r.status==='Approved').map(r=> ({ title: r.User?.name || 'Leave', date: r.startDate }))
      setEvents(ev)
    }catch(err){ console.error(err) }
  }
  // simple grid calendar: show events as list per date (basic)
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Kalender Cuti (Approved)</h1>
      <div className="card-strong">
        {events.length===0 && <div className="text-sm text-gray-500">Belum ada cuti disetujui</div>}
        <div className="mt-2 grid grid-cols-1 gap-2">
          {events.map((e,i)=>(<div key={i} className="p-2 bg-indigo-50 rounded">{e.date} — {e.title}</div>))}
        </div>
      </div>
    </div>
  )
}
