const User = require('../models/User')
const asyncHandler = require('../utils/asyncHandler')
const ApiError = require('../utils/ApiError')

exports.me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.sub)
  if (!user) throw new ApiError(404, 'User not found')
  res.json({ success: true, data: user })
})

// PATCH /users/me — profile + optional partial settings merge
exports.updateMe = asyncHandler(async (req, res) => {
  const { firstName, lastName, avatar, bio, city, country, settings } = req.body

  const user = await User.findById(req.user.sub)
  if (!user) throw new ApiError(404, 'User not found')

  if (firstName !== undefined) user.firstName = firstName
  if (lastName  !== undefined) user.lastName  = lastName
  if (avatar    !== undefined) user.avatar    = avatar
  if (bio       !== undefined) user.bio       = bio
  if (city      !== undefined) user.city      = city
  if (country   !== undefined) user.country   = country

  if (settings && typeof settings === 'object') {
    mergeSettings(user, settings)
  }

  await user.save()
  res.json({ success: true, data: user })
})

// PATCH /users/me/settings — settings only
exports.updateSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.sub)
  if (!user) throw new ApiError(404, 'User not found')

  mergeSettings(user, req.body || {})
  await user.save()

  res.json({ success: true, data: user.settings })
})

// POST /users/me/export — request data export
// Real implementation could enqueue a background job + email.
// For now we return a small JSON snapshot the client can download.
exports.requestExport = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.sub).lean()
  if (!user) throw new ApiError(404, 'User not found')

  const Enrollment   = require('../models/Enrollment')
  const Certificate  = require('../models/Certificate')

  const [enrollments, certificates] = await Promise.all([
    Enrollment.find({ user: user._id }).populate('course', 'title category').lean(),
    Certificate.find({ user: user._id }).populate('course', 'title').lean(),
  ])

  const snapshot = {
    exportedAt: new Date().toISOString(),
    profile: {
      firstName: user.firstName,
      lastName:  user.lastName,
      email:     user.email,
      bio:       user.bio,
      city:      user.city,
      country:   user.country,
      role:      user.role,
      points:    user.points,
      careerGoal:user.careerGoal,
      interests: user.interests,
      createdAt: user.createdAt,
    },
    settings:     user.settings,
    enrollments,
    certificates,
  }

  res.json({ success: true, data: snapshot })
})

// DELETE /users/me — soft-delete (keeps data, signs user out)
// Use isActive=false so admin tools can still see history.
exports.deleteMe = asyncHandler(async (req, res) => {
  const { confirm } = req.body || {}
  if (confirm !== 'DELETE') {
    throw new ApiError(400, "Send body { confirm: 'DELETE' } to confirm")
  }
  await User.findByIdAndUpdate(req.user.sub, { isActive: false })
  res.json({ success: true, message: 'Account deactivated' })
})

/* ─── helper ─────────────────────────────────────────────────── */
function mergeSettings(user, incoming) {
  user.settings = user.settings || {}

  if (incoming.notifications && typeof incoming.notifications === 'object') {
    user.settings.notifications = {
      ...(user.settings.notifications || {}),
      ...incoming.notifications,
    }
  }
  if (incoming.preferences && typeof incoming.preferences === 'object') {
    user.settings.preferences = {
      ...(user.settings.preferences || {}),
      ...incoming.preferences,
    }
  }
  if (incoming.privacy && typeof incoming.privacy === 'object') {
    user.settings.privacy = {
      ...(user.settings.privacy || {}),
      ...incoming.privacy,
    }
  }
  user.markModified('settings')
}