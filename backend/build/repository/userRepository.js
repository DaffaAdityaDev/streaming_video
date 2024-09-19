"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const findByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.default.users.findUnique({ where: { email } });
});
const create = (userData) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.default.users.create({ data: Object.assign(Object.assign({}, userData), { token: null }) });
});
const update = (email, data) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.default.users.update({ where: { email }, data });
});
const updateByUsername = (username, data) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.default.users.update({ where: { username }, data });
});
exports.default = { findByEmail, create, update, updateByUsername };
