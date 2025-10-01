import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

export async function GET(request: NextRequest) {
  try {
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

    // API 서버로 요청 전달
    const response = await fetch(`${API_BASE_URL}/consultations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'Cookie': `auth-token=${authToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Consultations API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'E_API_ERROR',
          message: 'Failed to fetch consultations'
        }
      },
      { status: 500 }
    );
  }
}