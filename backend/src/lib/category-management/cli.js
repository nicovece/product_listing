#!/usr/bin/env node

const CategoryManagement = require('./index');

function parseArgs(args) {
  const options = {};
  const positional = [];
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      options[key] = value || args[i + 1] || true;
      if (value === undefined && args[i + 1] && !args[i + 1].startsWith('--')) {
        i++;
      }
    } else {
      positional.push(arg);
    }
  }
  
  return { options, positional };
}

function printCategory(category, indent = 0) {
  const prefix = '  '.repeat(indent);
  console.log(`${prefix}ID: ${category.id}`);
  console.log(`${prefix}Name: ${category.name}`);
  console.log(`${prefix}Description: ${category.description || 'N/A'}`);
  console.log(`${prefix}Parent ID: ${category.parent_category_id || 'None'}`);
  console.log(`${prefix}Sort Order: ${category.sort_order}`);
  console.log(`${prefix}Products: ${category.product_count || 0}`);
  console.log(`${prefix}Active: ${category.is_active ? 'Yes' : 'No'}`);
  console.log(`${prefix}---`);
}

function printHierarchy(categories, indent = 0) {
  categories.forEach(category => {
    printCategory(category, indent);
    if (category.children && category.children.length > 0) {
      printHierarchy(category.children, indent + 1);
    }
  });
}

function printUsage() {
  console.log(`
Category Management CLI

Usage: node cli.js <command> [options]

Commands:
  list [--products]
    List all categories, optionally with product counts

  get <id>
    Get category details by ID

  create --name="Name" [--description="Desc"] [--parent=id] [--sort=0]
    Create new category

  update <id> [--name="Name"] [--description="Desc"] [--parent=id] [--sort=0] [--active=true/false]
    Update existing category

  delete <id>
    Delete category (must have no products or child categories)

  hierarchy
    Show category hierarchy as tree structure

  path <id>
    Show path from root to category

  children <id> [--products]
    Show direct child categories

  move <id> --parent=id [--sort=0]
    Move category to new parent

Examples:
  node cli.js list --products
  node cli.js get 123
  node cli.js create --name="Electronics" --description="Electronic products"
  node cli.js create --name="Phones" --parent=123 --sort=1
  node cli.js hierarchy
  node cli.js path 456
  node cli.js move 789 --parent=123 --sort=2
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    printUsage();
    process.exit(1);
  }

  const { options, positional } = parseArgs(args);
  const command = positional[0];

  try {
    switch (command) {
      case 'list': {
        const includeProducts = options.products !== undefined;
        const result = CategoryManagement.findAll({ includeProducts });
        
        console.log(`Found ${result.data.length} categories`);
        console.log('---');
        result.data.forEach(category => printCategory(category));
        break;
      }

      case 'get': {
        const id = parseInt(positional[1]);
        if (!id) {
          console.error('Error: Category ID required');
          process.exit(1);
        }

        const category = CategoryManagement.findById(id);
        if (!category) {
          console.error(`Error: Category ${id} not found`);
          process.exit(1);
        }

        printCategory(category);
        break;
      }

      case 'create': {
        if (!options.name) {
          console.error('Error: --name is required');
          process.exit(1);
        }

        const categoryData = {
          name: options.name
        };

        if (options.description) categoryData.description = options.description;
        if (options.parent) categoryData.parent_category_id = parseInt(options.parent);
        if (options.sort !== undefined) categoryData.sort_order = parseInt(options.sort);

        const category = CategoryManagement.create(categoryData);
        console.log('Category created successfully:');
        printCategory(category);
        break;
      }

      case 'update': {
        const id = parseInt(positional[1]);
        if (!id) {
          console.error('Error: Category ID required');
          process.exit(1);
        }

        const updates = {};
        if (options.name) updates.name = options.name;
        if (options.description !== undefined) updates.description = options.description || null;
        if (options.parent !== undefined) updates.parent_category_id = options.parent ? parseInt(options.parent) : null;
        if (options.sort !== undefined) updates.sort_order = parseInt(options.sort);
        if (options.active !== undefined) updates.is_active = options.active === 'true';

        const category = CategoryManagement.update(id, updates);
        if (!category) {
          console.error(`Error: Category ${id} not found`);
          process.exit(1);
        }

        console.log('Category updated successfully:');
        printCategory(category);
        break;
      }

      case 'delete': {
        const id = parseInt(positional[1]);
        if (!id) {
          console.error('Error: Category ID required');
          process.exit(1);
        }

        const success = CategoryManagement.delete(id);
        if (!success) {
          console.error(`Error: Category ${id} not found or cannot be deleted`);
          process.exit(1);
        }

        console.log(`Category ${id} deleted successfully`);
        break;
      }

      case 'hierarchy': {
        const hierarchy = CategoryManagement.getHierarchy();
        console.log('Category Hierarchy:');
        console.log('---');
        printHierarchy(hierarchy);
        break;
      }

      case 'path': {
        const id = parseInt(positional[1]);
        if (!id) {
          console.error('Error: Category ID required');
          process.exit(1);
        }

        const path = CategoryManagement.getCategoryPath(id);
        if (path.length === 0) {
          console.error(`Error: Category ${id} not found`);
          process.exit(1);
        }

        console.log('Category Path:');
        console.log('---');
        path.forEach((category, index) => {
          const prefix = '  '.repeat(index);
          console.log(`${prefix}${category.name} (ID: ${category.id})`);
        });
        break;
      }

      case 'children': {
        const id = parseInt(positional[1]);
        if (!id) {
          console.error('Error: Category ID required');
          process.exit(1);
        }

        const includeProducts = options.products !== undefined;
        const children = CategoryManagement.getChildCategories(id, includeProducts);
        
        console.log(`Found ${children.length} child categories for category ${id}`);
        console.log('---');
        children.forEach(category => printCategory(category));
        break;
      }

      case 'move': {
        const id = parseInt(positional[1]);
        if (!id) {
          console.error('Error: Category ID required');
          process.exit(1);
        }

        if (options.parent === undefined) {
          console.error('Error: --parent is required');
          process.exit(1);
        }

        const newParentId = options.parent ? parseInt(options.parent) : null;
        const newSortOrder = options.sort !== undefined ? parseInt(options.sort) : null;

        const category = CategoryManagement.moveCategory(id, newParentId, newSortOrder);
        if (!category) {
          console.error(`Error: Category ${id} not found`);
          process.exit(1);
        }

        console.log('Category moved successfully:');
        printCategory(category);
        break;
      }

      default:
        console.error(`Error: Unknown command '${command}'`);
        printUsage();
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, parseArgs };