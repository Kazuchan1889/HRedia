import React, { useState } from 'react'

export default function Reports(){
  const [month, setMonth] = useState('')
  function download(path){
    const url = `http://localhost:4000/api${path}?month=${month}`
    window.open(url, '_blank')
  }
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Laporan & Export</h1>
      <div className="card-strong">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-sm text-gray-600">Pilih Bulan</label>
            <input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="mt-1 p-2 border rounded w-full" />
          </div>
          <div>
            <button onClick={()=>download('/reports/attendances')} className="btn btn-primary">Export Absensi (CSV)</button>
          </div>
          <div>
            <button onClick={()=>download('/reports/leaves')} className="btn btn-ghost">Export Cuti (CSV)</button>
          </div>
        </div>
      </div>
    </div>
  )
}
