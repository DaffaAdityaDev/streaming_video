"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateVideoUpdate = exports.validateVideoUpload = exports.validate = exports.validateLogin = exports.validateRegistration = void 0;
const express_validator_1 = require("express-validator");
exports.validateRegistration = [
    (0, express_validator_1.body)('username').notEmpty().withMessage('Username is required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Invalid email'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];
exports.validateLogin = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Invalid email'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
];
const validate = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};
exports.validate = validate;
exports.validateVideoUpload = [
    (0, express_validator_1.body)('title').optional().isString().withMessage('Title must be a string'),
    (0, express_validator_1.body)('description').optional().isString().withMessage('Description must be a string'),
];
exports.validateVideoUpdate = [
    (0, express_validator_1.body)('title').isString().withMessage('Title is required and must be a string'),
    (0, express_validator_1.body)('description').isString().withMessage('Description is required and must be a string'),
];
