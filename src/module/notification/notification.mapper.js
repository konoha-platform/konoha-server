const { omitBy, isNil } = require('lodash');

const { UserMapper } = require('../user/user.mapper');

class NotificationMapper {
  static async toDto(notification) {
    const dto = {};
    dto._id = notification?._id;
    dto.text = notification?.text;
    dto.content = notification?.content;
    dto.isRead = notification?.isRead;
    dto.url = notification?.url;
    dto.user = await UserMapper.toDto(notification?.user);
    dto.recipients = await NotificationMapper.toListDto(notification?.recipients);
    return omitBy(dto, isNil);
  }

  static async toListDto(notifications) {
    if (!notifications || notifications.length === 0) return [];
    return await Promise.all(notifications.map(async (notification) => await this.toDto(notification)))
  }
}

module.exports = { NotificationMapper };