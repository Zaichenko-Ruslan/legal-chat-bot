import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Forward the file to the backend
    const backendUrl = 'http://localhost:8000/upload'; 
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      body: formData,
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      throw new Error(data.detail || 'Backend error');
    }

    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[API_PROXY_UPLOAD_ERROR]', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
