const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const router = new express.Router()


const resSuccessObject = {
    status: true,
    message: 'Success!'
}

const resFailedObject = {
    status: false,
    message: ''
}

const fieldsArray = [
    "age",
    "mobile",
    "address",
    "branchId",
    "branchName",
    "designationId",
    "designation",
    "jobTitle",
    "joiningDate",
    "currentSallary",
    "name",
    "email",
    "password",
    "promotions",
    "userId",
]

/**
 * Create User api 
 */

router.post('/users/createUser', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({
            ...resSuccessObject,
            data: {
                authorizationToken: token,
                currentUser: user
            }
        })
    } catch (e) {
        if (e.name == "MongoError" && e.code == 11000) {
            res.status(400).send({
                ...resFailedObject,
                message: 'Email already exist!',
                data: ''
            })
        } else {
            res.status(400).send({
                ...resFailedObject,
                message: e.message,
                data: ''
            })
        }
    }
})

// ======================


/**
 * Login User API
 */

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({
            ...resSuccessObject,
            message: 'Login successfully!',
            data: {
                authorizationToken: token,
                currentUser: user
            }
        })
    } catch (e) {
        res.status(400).send({
            ...resFailedObject,
            message: e.message,
            data: ''
        })
    }
})

// ======================


/**
 * Logout User Api
 */


router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send({
            ...resSuccessObject,
            message: 'Logout successfully!',
            data: ''
        })
    } catch (e) {
        res.status(500).send({
            ...resFailedObject,
            message: e.message,
            data: ''
        })
    }
})

// ======================


/**
 * GetCurrentUser ApI
 */


router.get('/users/currentUser', auth, async (req, res) => {
    try {
        res.send({
            ...resSuccessObject,
            data: req.user
        })
    } catch (e) {
        res.status(500).send({
            ...resFailedObject,
            message: e.message,
            data: ''
        })
    }
})

// ======================


/**
 * Get Users List ApI
 */

router.get('/users/get', auth, async (req, res) => {
    const designationId = parseInt(req.query.designationId);
    const branchId = parseInt(req.query.branchId);

    try {
        let tasks;
        if (designationId == 1 && branchId == 1) {
            tasks = await User.find({ designationId: { $ne: 1 } })
        }
        else if ((designationId == 2 || designationId == 3) && branchId != 1) {
            tasks = await User.find({ branchId, designationId: { $ne: 2 }, designationId: { $ne: designationId } })
        }
        else {
            throw new Error("Access Denied!")
        }

        res.send({
            ...resSuccessObject,
            data: tasks
        });
    } catch (e) {
        res.status(200).send({
            ...resFailedObject,
            message: e.message,
            data: ''
        })
    }
})

// ======================


/**
 * Update User API
 */

router.post('/users/updateUser', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = fieldsArray
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        const user = await User.findOne({ _id: req.body.userId })
        if (!user) {
            res.status(404).send({
                ...resFailedObject,
                message: "User not Found!",
                data: ''
            })
        }

        updates.forEach((update) => user[update] = req.body[update])
        await user.save()
        res.send({
            ...resSuccessObject,
            message: "User updated successfully!",
            data: ''
        })
    } catch (e) {
        if (e.name == "MongoError" && e.code == 11000) {
            res.status(400).send({
                ...resFailedObject,
                message: 'Email already exist!',
                data: ''
            })
        } else {
            res.status(400).send({
                ...resFailedObject,
                message: e.message,
                data: ''
            })
        }
    }
})

// ======================







router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (e) {
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router