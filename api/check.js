const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = async (req, res) => {
  const player = (req.query.player_id || '').trim();
  if (!player) return res.status(400).json({ error: 'player_id required' });

  try {
    const { data, error } = await supabase
      .from('verifications')
      .select('*')
      .or(`player_id.eq.${player},txn_id.eq.${player},subid.eq.${player}`)
      .order('verified_at', { ascending: false })
      .limit(1);

    if (error) return res.status(500).json({ error: 'db error' });
    if (!data || data.length === 0) {
      return res.json({ access: false, message: "You're not registered using my link" });
    }
    return res.json({ access: true, record: data[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
};
