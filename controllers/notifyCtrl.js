const Notifies = require('../models/notifyModel')
const { getPresignedUrl } = require('../middleware/s3')


const notifyCtrl = {
    createNotify: async (req, res) => {
        try {
            const { id, recipients, url, text, content } = req.body

            if(recipients.includes(req.user._id.toString())) {
                return;
            }
            const notify = new Notifies({
                id, recipients, url, text, content, user: req.user._id
            })

            await notify.save()
            return res.json({ notify })
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },
    removeNotify: async (req, res) => {
        try {
            const notify = await Notifies.findOneAndDelete({
                id: req.params.id, url: req.query.url
            })
            
            return res.json({ notify })
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },
    getNotifies: async (req, res) => {
        try {
            const notifies = await Notifies
                .find({ recipients: req.user._id })
                .sort('-createdAt')
                .populate('user', 'avatar username')
            for (let notify of notifies) {
                notify.user.avatar = await getPresignedUrl(notify.user.avatar)
            }

            return res.json({ notifies })
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },
    isReadNotify: async (req, res) => {
        try {
            const notifies = await Notifies.findOneAndUpdate({ _id: req.params.id }, {
                isRead: true
            })

            return res.json({ notifies })
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },
    deleteAllNotifies: async (req, res) => {
        try {
            const notifies = await Notifies.deleteMany({ recipients: req.user._id })
            return res.json({ notifies })
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },
}


module.exports = notifyCtrl