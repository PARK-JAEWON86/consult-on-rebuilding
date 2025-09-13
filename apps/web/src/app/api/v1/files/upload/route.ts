import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileType, fileSize } = body;
    
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

    const response = await fetch(`${API_BASE_URL}/v1/files/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'Cookie': `auth-token=${authToken}`,
      },
      body: JSON.stringify({ fileName, fileType, fileSize }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('File upload API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'E_API_ERROR', 
          message: 'Failed to get upload URL' 
        } 
      },
      { status: 500 }
    );
  }
}
