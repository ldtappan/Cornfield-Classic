import React, { useEffect, useState } from 'react'
import { QRCode } from 'qrcode.react'
import { api } from '../lib/api'

export default function GateDisplay(){
  const [adminKey,setAdminKey] = useState(localStorage.getItem('adminKey')||'')
  const [token,setToken] = useState('')
  const [err,setErr] = useState('')

  const base = location.origin
  const gate = import.meta.env.VITE_GATE_ID || 'main'

  async function refresh(){
    try{
      setErr('')
      const r = await api('/api/gate-token', { headers: { 'x-admin-key': adminKey } })
      setToken(r.token)
    }catch(e){ setErr(e.message); setToken('') }
  }

  useEffect(()=>{
    if(!adminKey) return
    localStorage.setItem('adminKey', adminKey)
    refresh()
    const t = setInterval(refresh, (Number(import.meta.env.VITE_TOKEN_WINDOW_SECONDS)||10)*1000 || 10000)
    return ()=>clearInterval(t)
  },[adminKey])

  const url = `${base}/lap?gate=${encodeURIComponent(gate)}&nonce=${encodeURIComponent(token)}`

  return <div style={{textAlign:'center'}}>
    <h2>Gate Display</h2>
    <p>Enter Admin Key to start rotating QR:</p>
    <input placeholder="Admin Key" value={adminKey} onChange={e=>setAdminKey(e.target.value)} style={{padding:8, minWidth:300}}/>
    <div style={{marginTop:20}}>
      {token ? <QRCode value={url} size={320} /> : <p>Token unavailable. Check Admin Key or server.</p>}
      <p style={{marginTop:12, fontSize:18}}><b>Scan to record lap</b></p>
    </div>
  </div>
}
