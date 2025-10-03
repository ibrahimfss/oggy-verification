const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = async (req, res) => {
  const params = req.method === 'POST' ? req.body : req.query;
  const incomingSecret = (req.headers['x-postback-secret'] || params.secret || '').toString();
  if (WEBHOOK_SECRET && incomingSecret !== WEBHOOK_SECRET) {
    return res.status(401).send('unauthorized');
  }

  const subid = params.subid || params.source_id || params.source || params.sub || null;
  const hash_id = params.hash_id || params.hash || params.link_id || null;
  const hash_name = params.hash_name || params.hash_name || params.name || null;
  const player_id = params.player_id || params.client_id || params.user || null;
  const txn_id = params.txnid || params.txn_id || params.transaction || params.trid || null;
  const amount = params.amount || params.sum || params.deposit || null;
  const promo = (params.promo || params.promo_code || params.coupon || '').toString();
  const event = (params.event || params.event_id || '').toString().toLowerCase();

  if (event && !event.includes('first')) {
    return res.status(200).send('ignored-non-first');
  }
  if (promo && promo.toLowerCase() !== 'oggy') {
    return res.status(200).send('promo-mismatch');
  }
  if (amount && parseFloat(amount) < 10) {
    return res.status(200).send('amount-too-small');
  }

  try {
    if (txn_id) {
      const { data: exists } = await supabase
        .from('verifications')
        .select('id')
        .eq('txn_id', txn_id)
        .limit(1);
      if (exists && exists.length > 0) {
        return res.status(200).send('already-recorded');
      }
    }

    const { error } = await supabase.from('verifications').insert([{
      subid, hash_id, hash_name, source_id: subid, player_id, txn_id, amount: amount ? parseFloat(amount) : null, promo,
      verified_at: new Date().toISOString()
    }]);

    if (error) {
      console.error('Supabase insert error', error);
      return res.status(500).send('db-error');
    }
    return res.status(200).send('ok');
  } catch (err) {
    console.error(err);
    return res.status(500).send('server-error');
  }
};
