const Notifications = require('./notification.model');
const { getIo, getSocketUserById, getRoomName } = require('../../core/socket/socket');
const { NotificationMapper } = require('./notification.mapper');
const { UserMapper } = require('../user/user.mapper');

const notificationService = {
  create: async ({ recipients, url, text, content, user }) => {
    if (recipients.length < 1) return null;
	
    if (recipients.includes(user._id.toString())) return;

    const createdNotification = new Notifications({
      recipients,
      url,
      text,
      content,
      user: user._id,
    });
    await createdNotification.save();

    const recipientDtos = await UserMapper.toListDto(recipients);
    for (const recipient of recipientDtos) {
      const user = await getSocketUserById(recipient);
      if (!user) continue;
      const io = getIo();
      io.to(getRoomName(user.id)).emit('send_notifcation', {
        _id: createdNotification._id,
        recipients,
        url,
        text,
        content,
        user,
      });
    }
    return { notification: createdNotification };
  },

  remove: async ({ id, url }) => {
    const notification = await Notifications.findOneAndDelete({
      id,
      url,
    });
    return { notification };
  },

  list: async ({ userId }) => {
    const notifications = await Notifications.find({ recipients: userId })
      .sort('-createdAt')
      .populate('user', 'avatar username');

    const notificationDtos = await NotificationMapper.toListDto(notifications)
    return { notifications: notificationDtos };
  },

  markAsRead: async ({ id }) => {
    const notification = await Notifications.findOneAndUpdate(
      { _id: id },
      {
        isRead: true,
      }
    );
    return { notification };
  },

  deleteAll: async ({ userId }) => {
    const notifications = await Notifications.deleteMany({ recipients: userId });
    return { notifications };
  },
};

module.exports = notificationService;
