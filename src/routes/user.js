const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const router = new express.Router()
const multer = require('multer')
const sharp = require('sharp')
const {sendWelcomeEmail, sendCancelationEmail} = require('../emails/account')

//Configuration for multer(file management)
const upload = multer({
    limits: {
        fileSize: 1000000,
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png )$/)){
            return cb(new Error('File must be a image(JPG, JPEG, PNG)'))
        }
        
        cb(undefined, true)
    }
})

router.post('/users', async (req, res) => {
    const user =  new User(req.body)

    try{
        await user.save()

        sendWelcomeEmail(user.mail, user.name)

        const token = await user.generateAuthToken()

        res.status(201).send({user, token})
    }catch(e) {
        res.status(400).send(e)
    }
})

router.post('/users/login', async (req, res) => {
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        
        res.send( {user, token} )
    }catch(e) {
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async(req, res) => {
    try{
        req.user.tokens = req.user.tokens.filter( token => {
            return token.token !== req.token
        })

        await req.user.save()

        res.send()
    }catch(e){
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async(req, res) => {
    try{
        req.user.tokens = []

        await req.user.save()

        res.send()
    }catch(e){
        res.status(500).send()
    }
})

router.post('/users/me/avatar', upload.single('avatar'), async (req, res) => {
    req.user.avatar = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()

    await req.user.save()

    res.status(200).send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined

    await req.user.save()

    res.send()
})

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    
    const isValidOperation = updates.every( (update) => {
        return allowedUpdates.includes(update)
    })

    if(!isValidOperation){
        return res.status(400).send({error: 'Invalid Updates'})
    }

    try{
        const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true})

        if(!user){
            return res.status(404).send()
        }

        res.send(user)
    }catch(e) {
        res.status(400).send(e)
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try{
        await req.user.remove()

        sendCancelationEmail(req.user.email, req.user.name)

        res.send(req.user)
    }catch(e) { 
        return res.status(500).send()
    }
})

router.get('/users/:id/avatar', async (req, res) => {
    try{
        const user = await User.findById(req.params.id)

        if(!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/jpg')
        res.send(user.avatar)
    }catch(e){
        res.status(404).send()
    }
})

module.exports = router