const { validationResult } = require('express-validator');
const Request = require('../models/Request');

const register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const organizationId = req.organizationId;

    try {
        const { cms_id } = req.body;

        // Check if request exists in THIS organization
        const request = await Request.findOne({ organizationId, cms_id });

        if (request) {
            return res.status(400).json({ errors: [{ msg: 'Request already exists in your organization' }] });
        }

        const newRequest = new Request({
            organizationId,
            cms_id
        });

        await newRequest.save();
        res.json({ success: true, request: newRequest });
    } catch (err) {
        console.error('Register Request Error:', err.message);
        res.status(500).send('Server error');
    }
}

const getAll = async (req, res) => {
    const organizationId = req.organizationId;

    try {
        // Only get requests for THIS organization
        const requests = await Request.find({ organizationId }).sort({ date: -1 });
        res.json({ success: true, requests, count: requests.length });
    } catch (err) {
        console.error('Get All Requests Error:', err.message);
        res.status(500).send('Server error');
    }
}

module.exports = {
    register,
    getAll
}