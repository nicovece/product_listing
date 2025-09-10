const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

class FileUpload {
  constructor(options = {}) {
    this.uploadDir = options.uploadDir || path.join(process.cwd(), 'uploads');
    this.maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB
    this.allowedTypes = options.allowedTypes || ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    this.createUploadDir();
  }

  async createUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'products'), { recursive: true });
      await fs.mkdir(path.join(this.uploadDir, 'temp'), { recursive: true });
    }
  }

  generateFilename(originalname) {
    const ext = path.extname(originalname);
    const hash = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}-${hash}${ext}`;
  }

  getStorage(destination = 'products') {
    return multer.diskStorage({
      destination: async (req, file, cb) => {
        const destPath = path.join(this.uploadDir, destination);
        try {
          await fs.access(destPath);
        } catch {
          await fs.mkdir(destPath, { recursive: true });
        }
        cb(null, destPath);
      },
      filename: (req, file, cb) => {
        const filename = this.generateFilename(file.originalname);
        cb(null, filename);
      }
    });
  }

  getMemoryStorage() {
    return multer.memoryStorage();
  }

  fileFilter = (req, file, cb) => {
    if (this.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: ${this.allowedTypes.join(', ')}`));
    }
  };

  createUploader(options = {}) {
    const {
      storage = 'disk',
      destination = 'products',
      single = true,
      fieldName = 'image',
      maxFiles = 10
    } = options;

    const storageEngine = storage === 'memory' 
      ? this.getMemoryStorage() 
      : this.getStorage(destination);

    const upload = multer({
      storage: storageEngine,
      fileFilter: this.fileFilter,
      limits: {
        fileSize: this.maxSize,
        files: maxFiles
      }
    });

    if (single) {
      return upload.single(fieldName);
    } else {
      return upload.array(fieldName, maxFiles);
    }
  }

  async saveFile(file, destination = 'products') {
    const filename = this.generateFilename(file.originalname);
    const destPath = path.join(this.uploadDir, destination);
    const filePath = path.join(destPath, filename);

    // Ensure destination directory exists
    try {
      await fs.access(destPath);
    } catch {
      await fs.mkdir(destPath, { recursive: true });
    }

    // Write file
    if (file.buffer) {
      await fs.writeFile(filePath, file.buffer);
    } else if (file.path) {
      await fs.copyFile(file.path, filePath);
      // Clean up original temp file
      await fs.unlink(file.path).catch(() => {});
    } else {
      throw new Error('File has no buffer or path');
    }

    return {
      filename,
      path: filePath,
      url: this.getFileUrl(filename, destination),
      size: file.size,
      mimetype: file.mimetype,
      originalname: file.originalname
    };
  }

  async saveMultipleFiles(files, destination = 'products') {
    const results = [];
    
    for (const file of files) {
      try {
        const result = await this.saveFile(file, destination);
        results.push(result);
      } catch (error) {
        results.push({
          originalname: file.originalname,
          error: error.message
        });
      }
    }

    return results;
  }

  async deleteFile(filename, destination = 'products') {
    const filePath = path.join(this.uploadDir, destination, filename);
    
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  async deleteMultipleFiles(filenames, destination = 'products') {
    const results = {};
    
    for (const filename of filenames) {
      results[filename] = await this.deleteFile(filename, destination);
    }

    return results;
  }

  async moveFile(filename, fromDestination, toDestination) {
    const fromPath = path.join(this.uploadDir, fromDestination, filename);
    const toPath = path.join(this.uploadDir, toDestination, filename);
    const toDirPath = path.join(this.uploadDir, toDestination);

    try {
      // Ensure destination directory exists
      try {
        await fs.access(toDirPath);
      } catch {
        await fs.mkdir(toDirPath, { recursive: true });
      }

      await fs.rename(fromPath, toPath);
      return {
        success: true,
        newPath: toPath,
        newUrl: this.getFileUrl(filename, toDestination)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  getFileUrl(filename, destination = 'products') {
    return `/uploads/${destination}/${filename}`;
  }

  getFilePath(filename, destination = 'products') {
    return path.join(this.uploadDir, destination, filename);
  }

  async getFileInfo(filename, destination = 'products') {
    const filePath = this.getFilePath(filename, destination);
    
    try {
      const stats = await fs.stat(filePath);
      return {
        filename,
        path: filePath,
        url: this.getFileUrl(filename, destination),
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        exists: true
      };
    } catch (error) {
      return {
        filename,
        exists: false,
        error: error.message
      };
    }
  }

  async listFiles(destination = 'products') {
    const destPath = path.join(this.uploadDir, destination);
    
    try {
      const files = await fs.readdir(destPath);
      const fileInfos = [];

      for (const filename of files) {
        const info = await this.getFileInfo(filename, destination);
        if (info.exists) {
          fileInfos.push(info);
        }
      }

      return fileInfos.sort((a, b) => b.modified - a.modified);
    } catch (error) {
      return [];
    }
  }

  async cleanupTempFiles(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    const tempPath = path.join(this.uploadDir, 'temp');
    
    try {
      const files = await fs.readdir(tempPath);
      const now = Date.now();
      let cleanedCount = 0;

      for (const filename of files) {
        const filePath = path.join(tempPath, filename);
        try {
          const stats = await fs.stat(filePath);
          if (now - stats.birthtime.getTime() > maxAge) {
            await fs.unlink(filePath);
            cleanedCount++;
          }
        } catch (error) {
          // File might have been deleted already, ignore
        }
      }

      return { cleanedCount };
    } catch (error) {
      return { cleanedCount: 0, error: error.message };
    }
  }

  async validateFile(file) {
    const errors = [];

    if (!file) {
      errors.push('No file provided');
      return errors;
    }

    if (!this.allowedTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} not allowed. Allowed types: ${this.allowedTypes.join(', ')}`);
    }

    if (file.size > this.maxSize) {
      errors.push(`File size ${file.size} exceeds maximum size ${this.maxSize}`);
    }

    // Additional validation for image files
    if (file.mimetype.startsWith('image/')) {
      // You could add image dimension validation here using sharp or similar library
    }

    return errors;
  }

  createValidationMiddleware() {
    return (req, res, next) => {
      const files = req.files || (req.file ? [req.file] : []);
      const errors = [];

      for (const file of files) {
        const fileErrors = this.validateFile(file);
        errors.push(...fileErrors);
      }

      if (errors.length > 0) {
        return res.status(400).json({
          error: 'File validation failed',
          details: errors
        });
      }

      next();
    };
  }

  // Utility method to extract filename from URL
  static extractFilenameFromUrl(url) {
    if (!url) return null;
    
    const parts = url.split('/');
    return parts[parts.length - 1];
  }

  // Utility method to get file extension
  static getFileExtension(filename) {
    return path.extname(filename).toLowerCase();
  }

  // Utility method to check if file is image
  static isImageFile(mimetype) {
    return mimetype && mimetype.startsWith('image/');
  }
}

// Default instance
const defaultUploader = new FileUpload();

module.exports = FileUpload;
module.exports.default = defaultUploader;