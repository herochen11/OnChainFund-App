import { NextRequest, NextResponse } from 'next/server'
import platformConfig from '@/lib/environment'

export async function POST(request: NextRequest) {
  // Primary: Infura, Fallback: Public RPC
  const primaryUrl = `https://sepolia.infura.io/v3/${platformConfig.infuraApiKey}`
  const fallbackUrl = 'https://rpc.sepolia.org'
  
  const useInfura = platformConfig.infuraApiKey && platformConfig.infuraApiKey !== '<YOUR API KEY>'
  const rpcUrl = useInfura ? primaryUrl : fallbackUrl
  
  try {
    const body = await request.json()
    
    console.log('🔗 Sepolia RPC Proxy - Request:', {
      method: body.method,
      provider: useInfura ? 'Infura' : 'Public RPC',
      timestamp: new Date().toISOString()
    })
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000) // 15 second timeout
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    console.log('✅ Sepolia RPC Proxy - Success:', {
      method: body.method,
      provider: useInfura ? 'Infura' : 'Public RPC',
      hasResult: !!data.result,
      hasError: !!data.error
    })
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('❌ Sepolia RPC Proxy - Error:', error)
    
    // If Infura failed, try fallback
    if (useInfura && error.name !== 'TimeoutError') {
      try {
        console.log('🔄 Retrying with fallback RPC...')
        const body = await request.json()
        
        const fallbackResponse = await fetch(fallbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(10000)
        })
        
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json()
          console.log('✅ Fallback RPC succeeded')
          return NextResponse.json(data)
        }
      } catch (fallbackError) {
        console.error('❌ Fallback RPC also failed:', fallbackError)
      }
    }
    
    return NextResponse.json({
      error: 'RPC request failed',
      details: error.message
    }, { status: 500 })
  }
}
