const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const AFF_LINK_TEMPLATE = process.env.AFF_LINK_TEMPLATE || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = async (req, res) => {
  try {
    const token = uuidv4();
    await supabase.from('clicks').insert([{ click_token: token }]);
    const url = AFF_LINK_TEMPLATE.replace('{token}', token);
    return res.redirect(url);
  } catch (err) {
    console.error(err);
    return res.status(500).send('redirect-error');
  }
};
