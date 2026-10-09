declare const process: {
  env: Record<string, string | undefined>;
};

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token || !projectId) {
    return new Response(JSON.stringify({ viewers: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    let url = `https://api.vercel.com/v1/query/web-analytics/visits/count?projectId=${projectId}`;
    if (teamId) {
      url += `&teamId=${teamId}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ viewers: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const count = typeof data?.count === 'number' ? data.count : 0;

    return new Response(JSON.stringify({ viewers: count }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400',
      },
    });
  } catch {
    return new Response(JSON.stringify({ viewers: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
