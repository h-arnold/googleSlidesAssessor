// Utils.js

/**
 * Utils Class
 * 
 * Provides utility functions for the application.
 */
class Utils {
    /**
     * Generates a SHA-256 hash for a given string.
     * @param {string} inputString - The string to be hashed.
     * @return {string} - The SHA-256 hash of the input string.
     */
    static generateHash(inputString) {
        const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, inputString);
        const hash = rawHash.map(e => {
            // Convert each byte to a hexadecimal string
            const hex = (e < 0 ? e + 256 : e).toString(16);
            // Ensure each byte is represented by two hex digits
            return hex.length === 1 ? "0" + hex : hex;
        }).join("");
        return hash;
    }

    /**
     * Converts a column index to its corresponding letter.
     * @param {number} columnIndex - The column index to convert (0-based).
     * @returns {string} - The corresponding column letter.
     */
    static getColumnLetter(columnIndex) {
        let temp;
        let letter = '';
        while (columnIndex >= 0) {
            temp = (columnIndex) % 26;
            letter = String.fromCharCode(temp + 65) + letter;
            columnIndex = Math.floor((columnIndex - temp) / 26) - 1;
        }
        return letter;
    }

    /**
     * Compares two arrays for equality.
     * @param {Array} arr1 - The first array.
     * @param {Array} arr2 - The second array.
     * @return {boolean} - True if arrays are equal, false otherwise.
     */
    static arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) return false;
        }
        return true;
    }

    // Add other utility methods as needed
}
