"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePasswordLength = validatePasswordLength;
exports.validateDisplayName = validateDisplayName;
const messages_1 = require("./messages");
function validatePasswordLength(password) {
    if (password.length < 6 || password.length > 30) {
        return { field: 'password', message: messages_1.ValidationMessages.passwordLength };
    }
    return null;
}
function validateDisplayName(name) {
    const trimmed = name.trim();
    if (!trimmed) {
        return { field: 'displayName', message: messages_1.ValidationMessages.displayNameRequired };
    }
    if ([...trimmed].length > 50) {
        return { field: 'displayName', message: messages_1.ValidationMessages.displayNameMaxLength };
    }
    return null;
}
//# sourceMappingURL=validators.js.map