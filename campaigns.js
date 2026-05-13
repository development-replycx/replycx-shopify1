import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase environment variables are missing in Vercel settings.' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { method } = req;

  try {
    if (method === 'GET') {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (method === 'POST') {
      const campaign = req.body;
      
      // Map frontend camelCase to backend snake_case
      const dbPayload = {
        name: campaign.name,
        event_type: campaign.event_type,
        reply_url: campaign.reply_url,
        reply_token: campaign.reply_token,
        mappings: campaign.mappings,
        status: 'active',
        updated_at: new Date().toISOString()
      };

      if (campaign.id) {
        dbPayload.id = campaign.id;
      }

      const { data, error } = await supabase
        .from('campaigns')
        .upsert(dbPayload)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    if (method === 'DELETE') {
      const { id } = req.query;
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  } catch (error) {
    console.error('Supabase Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
