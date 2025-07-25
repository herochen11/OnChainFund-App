import { NextRequest, NextResponse } from 'next/server'
import platformConfig from '@/lib/environment'

export async function POST(request: NextRequest) {
  const infuraUrl = `https://sepolia.infura.io/v3/${platformConfig.infuraApiKey}`
  
  try {
    const body = await request.json()
    
    console.log('🔗 Sepolia RPC Proxy - Request:', {
      method: body.method,
      infuraUrl: infuraUrl.replace(platformConfig.infuraApiKey || '', 'xxx...'),
      timestamp: new Date().toISOString()
    })
    
    const response = await fetch(infuraUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    console.log('✅ Sepolia RPC Proxy - Success:', {
      method: body.method,
      hasResult: !!data.result,
      hasError: !!data.error
    })
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('❌ Sepolia RPC Proxy - Error:', error)
    return NextResponse.json({
      error: 'RPC request failed',
      details: error.message
    }, { status: 500 })
  }
}
