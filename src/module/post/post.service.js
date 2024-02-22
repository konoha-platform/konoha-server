const { StatusCodes } = require('http-status-codes');

const Posts = require('./post.model');
const Comments = require('../comment/comment.model');
const Users = require('../user/user.model');
const { PostMapper } = require('./post.mapper');
const { addToNotificationQueue } = require('../notification/notification.queue');
const { APIFeatures } = require('../../shared/APIFeatures');
const { USER, POST } = require('../../shared/message');

const postService = {
  create: async ({ content, images, user }) => {
    const newPost = new Posts({
      content,
      images,
      user: user._id,
    });
    await newPost.save();

    const postDto = await PostMapper.toDto(newPost);

    addToNotificationQueue({
      content,
      user,
      url: `/posts/${newPost._id}`,
      text: 'added a new post.',
      recipients: [...user.followers],
    });

    return { newPost: postDto }
  },

  list: async ({ user, query }) => {
    const condition = { user: [...user.following, user._id] }
    const features = new APIFeatures(
      Posts.find(condition),
      query
    ).paginate();

    const posts = await features.query
      .sort('-createdAt')
      .populate('user likes')
      .populate({
        path: 'comments',
        populate: {
          path: 'user likes',
          select: '-password',
        },
      });
    const postDtos = await PostMapper.toListDto(posts);
    const count = await Posts.countDocuments(condition)
    return { count, posts: postDtos };
  },

  update: async ({ content, images, postId }) => {
    const updatedPost = await Posts.findOneAndUpdate(
      { _id: postId },
      {
        content,
        images,
      },
      {
        new: true
      }
    )
      .populate('user likes')
      .populate({
        path: 'comments',
        populate: {
          path: 'user likes',
          select: '-password',
        },
      });

    const postDto = await PostMapper.toDto(updatedPost);
    return { post: postDto };
  },

  get: async ({ id }) => {
    const post = await Posts.findById(id)
      .populate('user likes')
      .populate({
        path: 'comments',
        populate: {
          path: 'user likes',
          select: '-password',
        },
      });

    if (!post) {
      const err = new Error(POST.POST_NOT_FOUND);
      err.status = StatusCodes.NOT_FOUND;
      throw err;
    }
    const formattedPosts = await PostMapper.toDto(post);
    return { post: formattedPosts };
  },

  delete: async ({ id, user }) => {
    const post = await Posts.findOneAndDelete({ _id: id, user: user.id });
    await Comments.deleteMany({ _id: { $in: post.comments } });
    return {
      post: {
        ...post,
        user,
      },
    };
  },

  like: async ({ postId, user }) => {
    const post = await Posts.find({ _id: postId, likes: user._id });
    if (post.length > 0) {
      const err = new Error(POST.POST_LIKED);
      err.status = StatusCodes.BAD_REQUEST;
      throw err;
    }
    
    const updatedPost = await Posts.findOneAndUpdate(
      { _id: postId },
      {
        $push: { likes: user._id },
      },
      { new: true }
    );

    if (!updatedPost) {
      const err = new Error(POST.POST_NOT_FOUND);
      err.status = StatusCodes.NOT_FOUND;
      throw err;
    }

    addToNotificationQueue({
      user,
      content: updatedPost.content,
      url: `/posts/${updatedPost._id}`,
      recipients: [updatedPost.user._id],
      text: 'like your post.',
    });
  },

  unlike: async ({ postId, user }) => {
    const updatedPost = await Posts.findOneAndUpdate(
      { _id: postId },
      {
        $pull: { likes: user._id },
      },
      { new: true }
    );

    if (!updatedPost) {
      const err = new Error(POST.POST_NOT_FOUND);
      err.status = StatusCodes.NOT_FOUND;
      throw err;
    }
  },

  save: async ({ id, userId }) => {
    const user = await Users.find({ _id: userId, saved: id });
    if (user.length > 0) {
      const err = new Error(POST.POST_SAVED);
      err.status = StatusCodes.BAD_REQUEST;
      throw err;
    }

    const updatedUser = await Users.findOneAndUpdate(
      { _id: userId },
      {
        $push: { saved: id },
      },
      { new: true }
    );

    if (!updatedUser) {
      const err = new Error(USER.USER_NOT_FOUND);
      err.status = StatusCodes.NOT_FOUND;
      throw err;
    }
  },

  unsave: async ({ id, userId }) => {
    const updatedUser = await Users.findOneAndUpdate(
      { _id: userId },
      {
        $pull: { saved: id },
      },
      { new: true }
    );

    if (!updatedUser) {
      const err = new Error(USER.USER_NOT_FOUND);
      err.status = StatusCodes.NOT_FOUND;
      throw err;
    }
  },
};

module.exports = postService;
