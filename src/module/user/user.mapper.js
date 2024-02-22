const { omitBy, isNil } = require('lodash');
const mongoose = require('mongoose');

const { getPresignedUrl } = require('../../core/aws/s3')

class UserMapper {
  static async toDto(user) {
    const dto = {};
    dto._id = user?._id;
    dto.fullname = user?.fullname;
    dto.username = user?.username;
    dto.email = user?.email;
    dto.avatar = await getPresignedUrl(user?.avatar);
    dto.createdAt = user?.email;
    dto.role = user?.email;
    dto.gender = user?.gender;
    dto.address = user?.address;
    dto.story = user?.story;
    dto.website = user?.website;
    if (dto.followers?.[0] instanceof mongoose.Types.ObjectId) {
      dto.followers = user?.followers;
    } else {
      dto.followers = await UserMapper.toListDto(user?.followers);
    }
    if (dto.following?.[0] instanceof mongoose.Types.ObjectId) {
      dto.following = user?.following;
    } else {
      dto.following = await UserMapper.toListDto(user?.following);
    }
    dto.following = await UserMapper.toListDto(user?.following);
    dto.saved = user?.saved;
    dto.settings = user?.settings;
    return omitBy(dto, isNil);
  }

  static async toListDto(users) {
    if (!users || users.length === 0) return [];
    return await Promise.all(users.map(async (user) => await this.toDto(user)))
  }
}

module.exports = { UserMapper };