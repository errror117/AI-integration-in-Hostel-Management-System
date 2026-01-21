const Organization = require('../models/Organization');

// @desc    Get organization branding
// @route   GET /api/branding
// @access  Private (organization members)
exports.getBranding = async (req, res) => {
    try {
        const organization = await Organization.findById(req.user.organizationId)
            .select('name slug branding domain');

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        res.json({
            success: true,
            data: {
                name: organization.name,
                slug: organization.slug,
                branding: organization.branding,
                subdomain: organization.domain?.subdomain || organization.slug
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch branding',
            error: error.message
        });
    }
};

// @desc    Update organization branding
// @route   PUT /api/branding
// @access  Admin only
exports.updateBranding = async (req, res) => {
    try {
        const {
            logo,
            favicon,
            primaryColor,
            secondaryColor,
            tagline,
            welcomeMessage
        } = req.body;

        const organization = await Organization.findById(req.user.organizationId);

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        // Update branding fields
        if (logo !== undefined) organization.branding.logo = logo;
        if (favicon !== undefined) organization.branding.favicon = favicon;
        if (primaryColor) organization.branding.primaryColor = primaryColor;
        if (secondaryColor) organization.branding.secondaryColor = secondaryColor;
        if (tagline !== undefined) organization.branding.tagline = tagline;
        if (welcomeMessage !== undefined) organization.branding.welcomeMessage = welcomeMessage;

        await organization.save();

        res.json({
            success: true,
            message: 'Branding updated successfully',
            data: organization.branding
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update branding',
            error: error.message
        });
    }
};

// @desc    Get branding by subdomain (public)
// @route   GET /api/branding/public/:subdomain
// @access  Public
exports.getBrandingBySubdomain = async (req, res) => {
    try {
        const { subdomain } = req.params;

        const organization = await Organization.findOne({ slug: subdomain })
            .select('name slug branding');

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        res.json({
            success: true,
            data: {
                name: organization.name,
                slug: organization.slug,
                branding: organization.branding
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch branding',
            error: error.message
        });
    }
};

// @desc    Reset branding to defaults
// @route   POST /api/branding/reset
// @access  Admin only
exports.resetBranding = async (req, res) => {
    try {
        const organization = await Organization.findById(req.user.organizationId);

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        // Reset to defaults
        organization.branding = {
            logo: null,
            favicon: null,
            primaryColor: '#4F46E5', // Indigo
            secondaryColor: '#10B981', // Green
            tagline: '',
            welcomeMessage: ''
        };

        await organization.save();

        res.json({
            success: true,
            message: 'Branding reset to defaults',
            data: organization.branding
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to reset branding',
            error: error.message
        });
    }
};

module.exports = exports;
