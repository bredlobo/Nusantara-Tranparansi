import { useEffect, useState } from 'react'
export function useData<T>(fn: () => Promise<T>) {
  const [d, setD] = useState<T>(), [e, setE] = useState(''), [k, setK] = useState(0)
  useEffect(() => { setD(undefined); setE(''); fn().then(setD).catch(x => setE(String(x.message ?? x))) }, [k])
  return { d, e, retry: () => setK(k + 1) }
}
