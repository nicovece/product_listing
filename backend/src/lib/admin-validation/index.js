const { z } = require('zod');
const schemas = require('./schemas');

class AdminValidation {
  static validate(schemaName, data) {
    const schema = schemas[schemaName];
    if (!schema) {
      throw new Error(`Unknown validation schema: ${schemaName}`);
    }

    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = this.formatZodErrors(error);
        const validationError = new Error('Validation failed');
        validationError.name = 'ValidationError';
        validationError.details = formattedErrors;
        throw validationError;
      }
      throw error;
    }
  }

  static validatePartial(schemaName, data) {
    const schema = schemas[schemaName];
    if (!schema) {
      throw new Error(`Unknown validation schema: ${schemaName}`);
    }

    try {
      return schema.partial().parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = this.formatZodErrors(error);
        const validationError = new Error('Validation failed');
        validationError.name = 'ValidationError';
        validationError.details = formattedErrors;
        throw validationError;
      }
      throw error;
    }
  }

  static validateAsync(schemaName, data) {
    const schema = schemas[schemaName];
    if (!schema) {
      throw new Error(`Unknown validation schema: ${schemaName}`);
    }

    return schema.parseAsync(data).catch(error => {
      if (error instanceof z.ZodError) {
        const formattedErrors = this.formatZodErrors(error);
        const validationError = new Error('Validation failed');
        validationError.name = 'ValidationError';
        validationError.details = formattedErrors;
        throw validationError;
      }
      throw error;
    });
  }

  static safeParse(schemaName, data) {
    const schema = schemas[schemaName];
    if (!schema) {
      return {
        success: false,
        error: new Error(`Unknown validation schema: ${schemaName}`)
      };
    }

    const result = schema.safeParse(data);
    if (!result.success) {
      return {
        success: false,
        error: {
          name: 'ValidationError',
          message: 'Validation failed',
          details: this.formatZodErrors(result.error)
        }
      };
    }

    return {
      success: true,
      data: result.data
    };
  }

  static formatZodErrors(zodError) {
    const errors = {};
    const fieldErrors = [];

    zodError.errors.forEach(error => {
      const path = error.path.join('.');
      const message = error.message;

      if (path) {
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(message);
      } else {
        fieldErrors.push(message);
      }
    });

    return {
      fields: errors,
      general: fieldErrors.length > 0 ? fieldErrors : undefined
    };
  }

  static createValidationMiddleware(schemaName, options = {}) {
    const { 
      source = 'body', 
      partial = false, 
      optional = false 
    } = options;

    return (req, res, next) => {
      try {
        let data;
        
        switch (source) {
          case 'body':
            data = req.body;
            break;
          case 'query':
            data = req.query;
            break;
          case 'params':
            data = req.params;
            break;
          default:
            throw new Error(`Invalid validation source: ${source}`);
        }

        if (optional && (!data || Object.keys(data).length === 0)) {
          return next();
        }

        const validatedData = partial 
          ? this.validatePartial(schemaName, data)
          : this.validate(schemaName, data);

        // Replace the original data with validated data
        if (source === 'body') {
          req.body = validatedData;
        } else if (source === 'query') {
          req.query = validatedData;
        } else if (source === 'params') {
          req.params = validatedData;
        }

        next();
      } catch (error) {
        if (error.name === 'ValidationError') {
          return res.status(400).json({
            error: 'Validation Error',
            message: error.message,
            details: error.details
          });
        }
        next(error);
      }
    };
  }

  static getSchemas() {
    return Object.keys(schemas);
  }

  static getSchemaStructure(schemaName) {
    const schema = schemas[schemaName];
    if (!schema) {
      throw new Error(`Unknown validation schema: ${schemaName}`);
    }

    // This is a simplified structure representation
    // In a real application, you might want to use a more sophisticated
    // schema introspection library
    return {
      name: schemaName,
      type: schema._def.typeName,
      description: schema.description || null
    };
  }

  // Helper methods for common validation patterns
  static validateId(id) {
    return this.validate('idParam', { id });
  }

  static validatePagination(query) {
    return this.validate('paginationQuery', query);
  }

  static validateBulkOperation(data) {
    const result = this.safeParse('bulkUpdateRequest', data);
    if (!result.success) {
      throw result.error;
    }
    return result.data;
  }

  // Custom validation helpers
  static isValidSKU(sku) {
    const skuRegex = /^[A-Za-z0-9-]+$/;
    return skuRegex.test(sku);
  }

  static isValidPrice(price) {
    return Number.isInteger(price) && price >= 0;
  }

  static isValidInventoryStatus(status) {
    return ['in_stock', 'out_of_stock', 'low_stock'].includes(status);
  }

  static isValidImageUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static sanitizeText(text, maxLength = null) {
    if (typeof text !== 'string') {
      return text;
    }

    // Basic HTML sanitization (remove tags)
    let sanitized = text.replace(/<[^>]*>/g, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    // Apply length limit if specified
    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
  }
}

module.exports = AdminValidation;