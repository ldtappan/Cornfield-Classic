import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function Leaderboard(){
  const [rows,setRows] = useState([])
  const [err,setErr] = useState('')
  async function load(){
    try{
      const r = await api('/api/leaderboard?eventId='+encodeURIComponent(import.meta.env.VITE_EVENT_ID))
      setRows(r.rows)
    }catch(e){ setErr(e.message) }
  }
  useEffect(()=>{ load(); const t=setInterval(load, 3000); return ()=>clearInterval(t) },[])
  return <div>
    <h2>Leaderboard</h2>
    {err && <p>{err}</p>}
    <table border="1" cellPadding="6" style={{borderCollapse:'collapse', minWidth:480}}>
      <thead><tr><th>Bib</th><th>Name</th><th>Division</th><th>Laps</th><th>Last Lap</th></tr></thead>
      <tbody>
        {rows.map((r,i)=>(
          <tr key={i}>
            <td>{r.bib}</td>
            <td>{r.name||''}</td>
            <td>{r.division||''}</td>
            <td><b>{r.laps}</b></td>
            <td>{new Date(r.last_ts).toLocaleTimeString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
}
