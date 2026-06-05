export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const params = new URLSearchParams(event.body);
  const name = (params.get('name') || '').trim();
  const phone = (params.get('phone') || '').trim();
  const email = (params.get('email') || '').trim();
  const message = (params.get('message') || '').trim();
  const sms_consent = params.get('sms_consent') === 'on';
  const marketing_consent = params.get('marketing_consent') === 'on';
  const source_page = event.headers['referer'] || '';

  if (!name || !phone) {
    return {
      statusCode: 302,
      headers: { Location: '/contact?error=1' },
      body: '',
    };
  }

  // 1. Create contact in GHL (v2 API)
  try {
    const nameParts = name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';
    const ghlRes = await fetch('https://services.leadconnectorhq.com/contacts/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GHL_API_KEY}`,
        'Content-Type': 'application/json',
        Version: '2021-07-28',
      },
      body: JSON.stringify({
        firstName,
        lastName,
        phone,
        email,
        locationId: process.env.GHL_LOCATION_ID,
        source: 'Website Form',
        tags: ['website-lead'],
      }),
    });
    if (!ghlRes.ok) {
      console.error('GHL error:', ghlRes.status, await ghlRes.text());
    }
  } catch (err) {
    console.error('GHL create contact failed:', err.message);
  }

  // 2. Log lead to Supabase site_leads table
  try {
    const sbRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/site_leads`, {
      method: 'POST',
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        client_slug: 'bryant-hvac',
        name,
        email,
        phone,
        message,
        source_page,
        sms_consent,
      }),
    });
    if (!sbRes.ok) {
      console.error('Supabase error:', sbRes.status, await sbRes.text());
    }
  } catch (err) {
    console.error('Supabase insert failed:', err.message);
  }

  return {
    statusCode: 302,
    headers: { Location: '/thank-you' },
    body: '',
  };
};
