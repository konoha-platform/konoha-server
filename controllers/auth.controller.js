const authService = require('../services/auth.service')

const authController = {
    register: async (req, res, next) => {
        try {
            const { fullname, username, email, password, gender } = req.body
            
            const {
                user,
                accessToken: access_token,
                refreshToken: refresh_token
            } = await authService.register({ fullname, username, email, password, gender })

            return res.json({
                msg: 'Register Success!',
                access_token,
                refresh_token,
                user
            })
        } catch (err) {
            return next(err)
        }
    },

    login: async (req, res, next) => {
        const { email, password } = req.body
        try {
            const {
                user,
                accessToken: access_token,
                refreshToken: refresh_token
            } = await authService.login({ email, password })
    
            return res.json({
                msg: 'Login Success!',
                access_token,
                refresh_token,
                user
            })
        } catch (err) {
            return next(err)
        }
    },

    logout: async (req, res) => {
        try {
            res.clearCookie('refreshtoken', { path: '/api/refresh-token' })
            return res.json({ msg: 'Logged out!' })
        } catch (err) {
            next(err)
        }
    },
    
    generateAccessToken: async (req, res, next) => {
        try {
            const refreshToken = req.body.refreshToken
            const {
                user,
                accessToken: access_token
            } = await authService.generateAccessToken({ refreshToken })
            return res.json({ user, access_token })
        } catch (err) {
            return next(err)
        }
    }
}

module.exports = authController