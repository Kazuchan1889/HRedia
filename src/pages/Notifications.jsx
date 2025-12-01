import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function Notifications(){
  const [notes, setNotes] = useState([])
  useEffect(()=>{ load() },[])
  async function load(){
    try{
      const token = localStorage.getItem('token')
      const res = await axios.get('http://localhost:4000/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      setNotes(res.data || [])
    }catch(err){ console.error(err) }
  }
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Notifikasi</h1>
      <div className="card-strong">
        {notes.length===0 && <div className="text-sm text-gray-500">Belum ada notifikasi</div>}
        <div className="space-y-2">
          {notes.map(n=> (
            <div key={n.id} className="p-2 border rounded flex items-start gap-3">
              <div className="flex-1">
                <div className="font-medium">{n.title}</div>
                <div className="text-sm text-gray-600">{n.body}</div>
              </div>
              <div className="text-xs text-gray-500">{n.read ? 'Read' : 'New'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
