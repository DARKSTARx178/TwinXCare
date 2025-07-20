// hash.js
import bcrypt from 'bcrypt';

/**
 * Hashes a plaintext password.
 * @param {string} userPassword - The plaintext password to hash.
 * @returns {Promise<string>} The hashed password.
 */
export async function hashPassword(userPassword) {
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(userPassword, salt);
    return passwordHash;
}

/**
 * Compares a plaintext password with a hashed password.
 * @param {string} userPassword - The plaintext password provided by the user.
 * @param {string} passwordHash - The hashed password stored in the database.
 * @returns {Promise<boolean>} True if passwords match, false otherwise.
 */
export async function comparePassword(userPassword, passwordHash) {
    const result = await bcrypt.compare(userPassword, passwordHash);
    return result;
}
