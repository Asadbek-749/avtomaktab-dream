const fs = require('fs');
let content = fs.readFileSync('src/pages/superadmin/BranchesPage.tsx', 'utf8');

// Add useNavigate
content = content.replace("import { motion } from 'framer-motion';", "import { useNavigate } from 'react-router-dom';\nimport { motion } from 'framer-motion';");

// Remove BranchDetailsModal import
content = content.replace("import { BranchDetailsModal } from './BranchDetailsModal';\n", '');

// Replace state and add navigate
content = content.replace(/const \[selectedBranchId, setSelectedBranchId\] = React\.useState<string \| null>\(null\);/, 'const navigate = useNavigate();');

// Replace onClick for Card
content = content.replace(/onClick=\{\(\) => setSelectedBranchId\(branch\.id\)\}/g, "onClick={() => navigate('/superadmin/branches/' + branch.id)}");

// Remove the Footer section completely
const footerRegex = /\{\/\* Footer \*\/\}[\s\S]*?<\/div>(\s*<\/Card>)/;
content = content.replace(footerRegex, '$1');

// Remove BranchDetailsModal JSX
const modalJsxRegex = /<BranchDetailsModal[\s\S]*?\/>/;
content = content.replace(modalJsxRegex, '');

fs.writeFileSync('src/pages/superadmin/BranchesPage.tsx', content);
console.log('done');
