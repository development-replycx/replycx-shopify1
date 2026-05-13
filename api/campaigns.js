import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
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
      
      // If no ID, let Supabase generate one or use Date.now() if column is text
      if (!campaign.id) {
        delete campaign.id; // Let DB generate UUID if configured
      }

      const { data, error } = await supabase
        .from('campaigns')
        .upsert({
          ...campaign,
          status: 'active',
          updated_at: new Date().toISOString()
        })
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
