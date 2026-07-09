const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'src', 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix req.params.id
  content = content.replace(/req\.params\.id/g, 'req.params.id as string');
  
  // Fix req.user
  content = content.replace(/req\.user!\.id/g, '(req as any).user.id');
  
  fs.writeFileSync(filePath, content);
});

console.log('Fixed TS errors in routes');
