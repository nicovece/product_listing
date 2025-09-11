#!/usr/bin/env node

const ProductManagement = require('./index');

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

function printProduct(product) {
  console.log(`ID: ${product.id}`);
  console.log(`Name: ${product.name}`);
  console.log(`SKU: ${product.sku || 'N/A'}`);
  console.log(`Brand: ${product.brand || 'N/A'}`);
  console.log(`Price: $${(product.price / 100).toFixed(2)}`);
  console.log(`Category: ${product.category?.name || 'None'}`);
  console.log(`Status: ${product.inventory_status}`);
  console.log(`Stock: ${product.inventory_count}`);
  console.log(`Active: ${product.is_active ? 'Yes' : 'No'}`);
  console.log('---');
}

function printUsage() {
  console.log(`
Product Management CLI

Usage: node cli.js <command> [options]

Commands:
  list [--page=1] [--limit=25] [--category=id] [--status=status] [--search=term]
    List products with optional filtering

  get <id>
    Get product details by ID

  create --name="Name" --price=1000 [--sku=SKU] [--brand=Brand] [--category=id] [--status=status]
    Create new product (price in cents)

  update <id> [--name="Name"] [--price=1000] [--sku=SKU] [--brand=Brand] [--category=id] [--status=status]
    Update existing product

  delete <id>
    Soft delete product

  bulk-update --ids=1,2,3 [--category=id] [--status=status] [--price=1000] [--active=true/false]
    Update multiple products

  bulk-delete --ids=1,2,3
    Delete multiple products

  stats
    Show inventory statistics

Examples:
  node cli.js list --page=1 --limit=10
  node cli.js get 123
  node cli.js create --name="Test Product" --price=1999 --status=in_stock
  node cli.js update 123 --price=2999 --status=low_stock
  node cli.js bulk-update --ids=1,2,3 --status=out_of_stock
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
        const filters = {};
        if (options.page) filters.page = parseInt(options.page);
        if (options.limit) filters.limit = parseInt(options.limit);
        if (options.category) filters.category = parseInt(options.category);
        if (options.status) filters.status = options.status;
        if (options.search) filters.search = options.search;

        const result = ProductManagement.findAll(filters);
        console.log(`Found ${result.pagination.total_items} products (page ${result.pagination.current_page}/${result.pagination.total_pages})`);
        console.log('---');
        result.data.forEach(printProduct);
        break;
      }

      case 'get': {
        const id = parseInt(positional[1]);
        if (!id) {
          console.error('Error: Product ID required');
          process.exit(1);
        }

        const product = ProductManagement.findById(id);
        if (!product) {
          console.error(`Error: Product ${id} not found`);
          process.exit(1);
        }

        printProduct(product);
        break;
      }

      case 'create': {
        if (!options.name || !options.price) {
          console.error('Error: --name and --price are required');
          process.exit(1);
        }

        const productData = {
          name: options.name,
          price: parseInt(options.price),
          inventory_status: options.status || 'in_stock'
        };

        if (options.sku) productData.sku = options.sku;
        if (options.brand) productData.brand = options.brand;
        if (options.category) productData.category_id = parseInt(options.category);
        if (options.description) productData.description = options.description;

        const product = ProductManagement.create(productData);
        console.log('Product created successfully:');
        printProduct(product);
        break;
      }

      case 'update': {
        const id = parseInt(positional[1]);
        if (!id) {
          console.error('Error: Product ID required');
          process.exit(1);
        }

        const updates = {};
        if (options.name) updates.name = options.name;
        if (options.price) updates.price = parseInt(options.price);
        if (options.sku) updates.sku = options.sku;
        if (options.brand) updates.brand = options.brand;
        if (options.category) updates.category_id = parseInt(options.category);
        if (options.status) updates.inventory_status = options.status;
        if (options.description) updates.description = options.description;
        if (options.active !== undefined) updates.is_active = options.active === 'true';

        const product = ProductManagement.update(id, updates);
        if (!product) {
          console.error(`Error: Product ${id} not found`);
          process.exit(1);
        }

        console.log('Product updated successfully:');
        printProduct(product);
        break;
      }

      case 'delete': {
        const id = parseInt(positional[1]);
        if (!id) {
          console.error('Error: Product ID required');
          process.exit(1);
        }

        const success = ProductManagement.delete(id);
        if (!success) {
          console.error(`Error: Product ${id} not found`);
          process.exit(1);
        }

        console.log(`Product ${id} deleted successfully`);
        break;
      }

      case 'bulk-update': {
        if (!options.ids) {
          console.error('Error: --ids required (comma-separated list)');
          process.exit(1);
        }

        const productIds = options.ids.split(',').map(id => parseInt(id.trim()));
        const updates = {};

        if (options.category) updates.category_id = parseInt(options.category);
        if (options.status) updates.inventory_status = options.status;
        if (options.price) updates.price = parseInt(options.price);
        if (options.active !== undefined) updates.is_active = options.active === 'true';

        const result = ProductManagement.bulkUpdate(productIds, updates);
        console.log(`Bulk update completed: ${result.updated_count} products updated`);
        
        if (result.failed_items.length > 0) {
          console.log('Failed items:');
          result.failed_items.forEach(item => {
            console.log(`  ID ${item.id}: ${item.error}`);
          });
        }
        break;
      }

      case 'bulk-delete': {
        if (!options.ids) {
          console.error('Error: --ids required (comma-separated list)');
          process.exit(1);
        }

        const productIds = options.ids.split(',').map(id => parseInt(id.trim()));
        const result = ProductManagement.bulkDelete(productIds);
        
        console.log(`Bulk delete completed: ${result.deleted_count} products deleted`);
        
        if (result.failed_items.length > 0) {
          console.log('Failed items:');
          result.failed_items.forEach(item => {
            console.log(`  ID ${item.id}: ${item.error}`);
          });
        }
        break;
      }

      case 'stats': {
        const stats = ProductManagement.getInventoryStats();
        console.log('Inventory Statistics:');
        console.log('---');
        stats.forEach(stat => {
          console.log(`${stat.inventory_status}: ${stat.count} products (${stat.total_stock} total stock)`);
        });
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