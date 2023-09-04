const Users = require('../models/userModel')
const { getPresignedUrl } = require("../middleware/s3")

const userCtrl = {
    searchUser: async (req, res) => {
        try {
            const users = await Users
                .find({ username: { $regex: req.query.username } })
                .limit(10).select('fullname username avatar')
            
            const formattedUsers = await Promise.all(users.map(async (user) => ({
                ...user,
                avatar: await getPresignedUrl(user.avatar)
            })))

            return res.json({
                users: formattedUsers
            })
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },
    getUser: async (req, res) => {
        try {
            const user = await Users
                .findById(req.params.id)
                .select('-password')
                .populate('followers following', '-password')
            if(!user) {
                return res.status(400).json({ msg: 'User does not exist.' })
            }
            user.avatar = await getPresignedUrl(user.avatar)
            return res.json({ user })
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },
    updateUser: async (req, res) => {
        try {
            const { avatar, fullname, mobile, address, story, website, gender } = req.body
            if(!fullname) {
                return res.status(400).json({ msg: 'Please add your full name.' })
            }

            await Users.findOneAndUpdate({_id: req.user._id}, {
                avatar, fullname, mobile, address, story, website, gender
            })

            return res.json({ msg: 'Update Success!' })
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },
    follow: async (req, res) => {
        try {
            const user = await Users.find({ _id: req.params.id, followers: req.user._id })
            if(user.length > 0) {
                return res.status(400).json({ msg: 'You followed this user.' })
            }

            const newUser = await Users.findOneAndUpdate({ _id: req.params.id }, { 
                $push: { followers: req.user._id }
            }, { new: true }).populate('followers following', '-password')

            await Users.findOneAndUpdate({ _id: req.user._id }, {
                $push: { following: req.params.id }
            }, { new: true })
            return res.json({ newUser })
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },
    unfollow: async (req, res) => {
        try {

            const newUser = await Users.findOneAndUpdate({ _id: req.params.id }, { 
                $pull: { followers: req.user._id }
            }, { new: true }).populate('followers following', '-password')

            await Users.findOneAndUpdate({ _id: req.user._id }, {
                $pull: { following: req.params.id }
            }, { new: true })

            return res.json({ newUser })
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },
    suggestionsUser: async (req, res) => {
        try {
            const newArr = [...req.user.following, req.user._id]
            const num  = req.query.num || 10
            const users = await Users
                .aggregate([
                    { $match: { _id: { $nin: newArr } } },
                    { $sample: { size: Number(num) } },
                    { $lookup: { from: 'users', localField: 'followers', foreignField: '_id', as: 'followers' } },
                    { $lookup: { from: 'users', localField: 'following', foreignField: '_id', as: 'following' } },
                ]).project('-password')
            const formattedUsers = await Promise.all(users.map(async (user) => ({
                ...user,
                avatar: await getPresignedUrl(user.avatar)
            })))
            return res.json({
                users: formattedUsers,
                result: formattedUsers.length
            })

        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },
}

module.exports = userCtrl