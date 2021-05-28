const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

/**
 * 
 * designationId values - 
 * 1 - 'CEO/CMO' - Master User
 * 2 - 'Branch Manager'
 * 3 - 'Manager'
 * 4 - 'Employee'
 */

/**
 * 
 * branchId values - 
 * 1 - 'Pune' - Head Office
 * 2 - 'Kolkata' - Branch
 * 3 - 'Bengaluru' - Branch
 * 4 - 'Chennai' - Branch
 */  


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password cannot contain "password"')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a postive number')
            }
        }
    },
    mobile: {
        type: String,
        trim: true,
        default: ''
    },
    address: {
        type: String,
        trim: true,
        default: ''
    },
    branchId: {
        type: Number,
        default: 1,
        required: true,
        validate(value) {
            if(value > 4 || value < 0) {
                throw new Error('Invalid branchId is Selected')
            }
        }
    },
    branchName: {
        type: String,
        default: '',
    },
    designationId: {
        type: Number,
        default: 1,
        required: true,
        validate(value) {
            if(value > 4 || value < 0) {
                throw new Error('Invalid branchId is Selected')
            }
        }
    },
    designation: {
        type: String,
        default: '',
    },
    jobTitle: {
        type: String,
        trim: true,
        default: '',
    },
    joiningDate: {
        type: String,
        trim: true,
        default: '',
    },
    promotions: {
        type: String,
        trim: true,
        default: ''
    },
    currentSallary: {
        type: String,
        trim: true,
        default: ''
    },
    history: [],
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
}, {
    timestamps: true
})


userSchema.methods.toJSON = function () {
    const user = this
    let userObject = user.toObject()
    userObject.userId = userObject._id

    delete userObject._id
    delete userObject.password
    delete userObject.tokens
    
    return userObject
}

userSchema.methods.Error = function () {
}

userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })

    if (!user) {
        throw new Error('Unauthorized user')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unauthorized user')
    }

    return user
}

// Hash the plain text password before saving
userSchema.pre('save', async function (next) {
    const user = this

    const branchName = setBranchName(user.branchId)
    const designation = setDesignation(user.designationId)

    user.branchName = branchName;
    user.designation = designation;

    
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

function setBranchName(branchId) {
    switch (branchId) {
        case 1: {
            return 'Pune'
        }
        case 2: {
            return 'Kolkata'
        }
        case 3: {
            return 'Bengaluru'
        }
        case 4: {
            return 'Chennai'
        }
    }
}


function setDesignation(designation) {
    switch (designation) {
        case 1: {
            return 'Master User'
        }
        case 2: {
            return 'Branch Manager'
        }
        case 3: {
            return 'Manager'
        }
        case 4: {
            return 'Employee'
        }
    }
}


const User = mongoose.model('User', userSchema)

module.exports = User