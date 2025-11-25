import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey } = await request.json();

    if (!provider || !apiKey) {
      return NextResponse.json(
        { success: false, error: 'Missing provider or API key' },
        { status: 400 }
      );
    }

    let success = false;
    let models: string[] = [];
    let error: string | undefined;

    switch (provider) {
      case 'anthropic': {
        try {
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-3-5-haiku-20241022',
              max_tokens: 10,
              messages: [{ role: 'user', content: 'Hi' }],
            }),
          });

          if (response.ok || response.status === 400) {
            // 400 might be rate limit but API key is valid
            success = true;
            models = ['claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'claude-3-5-haiku-20241022'];
          } else {
            const data = await response.json().catch(() => ({}));
            error = data.error?.message || 'Invalid API key';
          }
        } catch (e) {
          error = 'Failed to connect to Anthropic API';
        }
        break;
      }

      case 'openai': {
        try {
          const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            success = true;
            models = data.data
              ?.filter((m: { id: string }) =>
                m.id.includes('gpt-4') || m.id.includes('gpt-3.5')
              )
              .map((m: { id: string }) => m.id)
              .slice(0, 5) || ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'];
          } else {
            const data = await response.json().catch(() => ({}));
            error = data.error?.message || 'Invalid API key';
          }
        } catch (e) {
          error = 'Failed to connect to OpenAI API';
        }
        break;
      }

      case 'google': {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
          );

          if (response.ok) {
            const data = await response.json();
            success = true;
            models = data.models
              ?.filter((m: { name: string }) => m.name.includes('gemini'))
              .map((m: { name: string }) => m.name.replace('models/', ''))
              .slice(0, 5) || ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'];
          } else {
            const data = await response.json().catch(() => ({}));
            error = data.error?.message || 'Invalid API key';
          }
        } catch (e) {
          error = 'Failed to connect to Google API';
        }
        break;
      }

      default:
        error = 'Unknown provider';
    }

    return NextResponse.json({ success, models, error });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
