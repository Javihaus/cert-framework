import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { connections, judgeConfig } = await request.json();

    // In production, this would save to a database
    // For now, we acknowledge the save (frontend uses localStorage)

    // Validate the configuration
    if (!connections || !Array.isArray(connections)) {
      return NextResponse.json(
        { success: false, error: 'Invalid connections configuration' },
        { status: 400 }
      );
    }

    if (!judgeConfig || !judgeConfig.provider || !judgeConfig.model) {
      return NextResponse.json(
        { success: false, error: 'Invalid judge configuration' },
        { status: 400 }
      );
    }

    // In a production environment, you would:
    // 1. Encrypt API keys before storing
    // 2. Save to a secure database
    // 3. Associate with user session

    return NextResponse.json({
      success: true,
      message: 'Configuration saved successfully',
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}
