import React, { useState } from 'react'
import { api } from '../lib/api'

export default function Checkin(){
  const [bib,setBib] = useState('')
  const [name,setName] = useState('')
  const [division,setDivision] = useState('')
  const [msg,setMsg] = useState('')
  const [token,setToken] = useState(localStorage.getItem('riderToken')||'')

  async function submit(e){
    e.preventDefault()
    setMsg('')
    try{
      const r = await api('/api/checkin',{method:'POST', body: JSON.stringify({ bib, name, division })})
      localStorage.setItem('riderToken', r.riderToken)
      setToken(r.riderToken)
      setMsg('Checked in! Rider token saved on this device.')
    }catch(err){ setMsg(err.message) }
  }

  return <div>
    <h2>Check-in</h2>
    <form onSubmit={submit} style={{display:'grid', gap:'8px', maxWidth:360}}>
      <input placeholder="Bib number" value={bib} onChange={e=>setBib(e.target.value)} required />
      <input placeholder="Name (optional)" value={name} onChange={e=>setName(e.target.value)} />
      <input placeholder="Division (optional)" value={division} onChange={e=>setDivision(e.target.value)} />
      <button>Get Rider Token</button>
    </form>
    {msg && <p style={{marginTop:12}}>{msg}</p>}
    {token && <details style={{marginTop:12}}><summary>Rider token (JWT)</summary><code style={{fontSize:12,wordBreak:'break-all'}}>{token}</code></details>}
  </div>
}
