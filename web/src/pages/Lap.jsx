import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'

function getQuery() {
  const p = new URLSearchParams(location.search)
  return Object.fromEntries(p.entries())
}

export default function Lap(){
  const [status,setStatus] = useState('Submitting lap...')
  const [ok,setOk] = useState(false)
  const { gate='main', nonce='' } = getQuery()

  useEffect(()=>{
    (async ()=>{
      try{
        const riderToken = localStorage.getItem('riderToken')
        if(!riderToken) throw new Error('No rider token. Go to Check-in first on this device.')
        if(!nonce) throw new Error('No gate token in QR. Ask a volunteer to refresh the Gate Display.')
        const body = { eventId: import.meta.env.VITE_EVENT_ID, gateId: gate, token: nonce, tsClient: Date.now() }
        const r = await api('/api/laps', { method:'POST', body: JSON.stringify(body), headers: { Authorization: 'Bearer ' + riderToken } })
        setOk(true)
        setStatus(`Lap recorded! Lap #${r.lap.lap_no}`)
      }catch(err){ setStatus(err.message) }
    })()
  },[])

  return <div>
    <h2>Lap Gate</h2>
    <p>{status}</p>
    {!ok && <p>Please keep this page open until it finishes.</p>}
  </div>
}
