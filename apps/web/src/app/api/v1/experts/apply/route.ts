import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 쿠키에서 인증 토큰 가져오기
    const cookieStore = cookies();
    const authToken = cookieStore.get('auth-token')?.value;
    
    if (!authToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'E_AUTH_REQUIRED', 
            message: 'Authentication required' 
          } 
        },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/v1/experts/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'Cookie': `auth-token=${authToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Expert application API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'E_API_ERROR', 
          message: 'Failed to submit expert application' 
        } 
      },
      { status: 500 }
    );
  }
}
