const router = require("express").Router();
const { verifyToken } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const chat = require("../controllers/chat.controller");
const { courseChatSchema } = require("../validators/chat.validator");

router.post("/course", verifyToken, validate(courseChatSchema), chat.courseChat);

module.exports = router;
