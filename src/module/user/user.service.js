const { StatusCodes } = require('http-status-codes');

const Users = require('./user.model');
const Posts = require('../post/post.model');
const { APIFeatures } = require('../../shared/APIFeatures');
const { addToNotificationQueue } = require('../notification/notification.queue');
const { UserMapper } = require('./user.mapper');
const { PostMapper } = require('../post/post.mapper');

const userService = {
  search: async ({ username }) => {
    const users = await Users.find({
      username: {
        $regex: username || '',
      },
    })
      .limit(10)
      .select('fullname username avatar');

    const userDtos = await UserMapper.toListDto(users)
    return { users: userDtos };
  },

  suggest: async ({ user, query }) => {
    const newArr = [...user.following, user._id];
    const num = query.num || 10;
    const users = await Users.aggregate([
      { $match: { _id: { $nin: newArr } } },
      { $sample: { size: Number(num) } },
      {
        $lookup: {
          from: 'users',
          localField: 'followers',
          foreignField: '_id',
          as: 'followers',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'following',
          foreignField: '_id',
          as: 'following',
        },
      },
    ]).project('-password');
    
    const userDtos = await UserMapper.toListDto(users)
    return { users: userDtos };
  },

  getSavedPosts: async ({ user, query }) => {
    const condition = {
      _id: { $in: user.saved },
    }
    const features = new APIFeatures(
      Posts.find(condition),
      query
    ).paginate();

    const posts = await features.query
      .sort('-createdAt')
      .populate('likes user', '-password')
      .populate({
        path: 'comments',
        populate: {
          path: 'user likes',
          select: '-password',
        },
      });
    const postDtos = await PostMapper.toListDto(posts)
    const count = await Posts.countDocuments(condition);
    return { count, savedPosts: postDtos };
  },

  getDiscoverPosts: async ({ user, query }) => {
    const newArr = [...user.following, user._id];
    const num = query.num || 9;

    const posts = await Posts.aggregate([
      { $match: { user: { $nin: newArr } } },
      { $sample: { size: Number(num) } },
    ]);
    return { posts };
  },

  get: async ({ id }) => {
    const user = await Users.findById(id)
      .select('-password')
      .populate('followers following', '-password');
    if (!user) {
      const err = new Error('User does not exist.');
      err.status = StatusCodes.NOT_FOUND;
      throw err;
    }
  
    const userDto = await UserMapper.toDto(user);
    return { user: userDto };
  },

  update: async ({
    avatar,
    fullname,
    mobile,
    address,
    story,
    website,
    gender,
    userId,
  }) => {
    if (!fullname) {
      const err = new Error('Missing fullname !');
      err.status = StatusCodes.BAD_REQUEST;
      throw err;
    }

    await Users.findOneAndUpdate(
      { _id: userId },
      {
        avatar,
        fullname,
        mobile,
        address,
        story,
        website,
        gender,
      }
    );
  },

  follow: async ({ id, userId }) => {
    const user = await Users.find({ _id: id, followers: userId });
    if (user.length > 0) {
      const err = new Error('You followed this user.');
      err.status = StatusCodes.BAD_REQUEST;
      throw err;
    }

    const updatedUser = await Users.findOneAndUpdate(
      { _id: id },
      {
        $push: { followers: userId },
      },
      { new: true }
    ).populate('followers following', '-password');

    await Users.findOneAndUpdate(
      { _id: userId },
      {
        $push: { following: id },
      },
      { new: true }
    );

    const userDto = await UserMapper.toDto(updatedUser);
    addToNotificationQueue({
      user: { _id: userId },
      text: 'has started to follow you.',
      url: `/profile/${userId}`,
      recipients: [updatedUser._id],
    });

    return { user: userDto };
  },

  unfollow: async ({ id, userId }) => {
    const updatedUser = await Users.findOneAndUpdate(
      { _id: id },
      {
        $pull: { followers: userId },
      },
      { new: true }
    ).populate('followers following', '-password');

    await Users.findOneAndUpdate(
      { _id: userId },
      {
        $pull: { following: id },
      },
      { new: true }
    );

    const userDto = await UserMapper.toDto(updatedUser);
    return { user: userDto };
  },

  getUserPosts: async ({ user, query }) => {
    const features = new APIFeatures(Posts.find({ user }), query).paginate();
    const posts = await features.query
      .sort('-createdAt')
      .populate('likes user', '-password')
      .populate({
        path: 'comments',
        populate: {
          path: 'user likes',
          select: '-password',
        },
      });
    
    const postDtos = await PostMapper.toListDto(posts)
    const count = await Posts.countDocuments({ user })
    return { count, posts: postDtos };
  },
};

module.exports = userService;
