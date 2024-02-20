const authService = require('./auth.service');

const { AUTH } = require('../../shared/message');

const authController = {
  register: async (req, res, next) => {
    try {
      const { fullname, username, email, password, gender } = req.body;

      const {
        user,
        accessToken: access_token,
        refreshToken: refresh_token,
      } = await authService.register({
        fullname,
        username,
        email,
        password,
        gender,
      });

      return res.json({
        msg: 'Register Success!',
        access_token,
        refresh_token,
        user,
      });
    } catch (err) {
      return next(err);
    }
  },

  login: async (req, res, next) => {
    const { email, password } = req.body;
    try {
      const {
        user,
        accessToken: access_token,
        refreshToken: refresh_token,
      } = await authService.login({ email, password });

      return res.json({
        msg: AUTH.LOGIN_SUCCESS,
        access_token,
        refresh_token,
        user,
      });
    } catch (err) {
      return next(err);
    }
  },

  logout: async (req, res) => {
    try {
      res.clearCookie('refreshtoken', { path: '/api/auto-login' });
      return res.json({
        msg: AUTH.LOGOUT_SUCCESS
      });
    } catch (err) {
      next(err);
    }
  },

  autoLogin: async (req, res, next) => {
    try {
      const refreshToken = req.body.refreshToken;
      const { user, accessToken: access_token } =
        await authService.autoLogin({ refreshToken });
      return res.json({
        msg: AUTH.TOKEN_REFRESHED,
        user,
        access_token
      });
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = authController;
