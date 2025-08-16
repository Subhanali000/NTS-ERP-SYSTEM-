const { supabase } = require('../config/supabase');


module.exports = (roles) => async (req, res, next) => {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', req.user.id)
            .single();

        if (error) throw error;

        if (!roles.includes(profile.role)) {
            return res.status(403).json({ error: 'Unauthorized role' });
        }

        req.user.role = profile.role;
        next();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};