const fs = require('fs');
let content = fs.readFileSync('src/pages/superadmin/BranchDetailsPage.tsx', 'utf8');

// Imports
content = content.replace("import { IconUsers, IconSchool, IconWallet, IconIdBadge2, IconTrash, IconArrowLeft } from '@tabler/icons-react';", "import { IconUsers, IconSchool, IconWallet, IconIdBadge2, IconTrash, IconArrowLeft, IconEdit } from '@tabler/icons-react';\nimport { Modal } from '../../components/ui/Modal';\nimport { Input } from '../../components/ui/Input';\nimport { Button } from '../../components/ui/Button';\nimport { useForm as useRHForm } from 'react-hook-form';\nimport { z } from 'zod';\nimport { zodResolver } from '@hookform/resolvers/zod';");

// Store methods
content = content.replace("const { branches, deleteBranch } = useBranchStore();", "const { branches, deleteBranch, updateBranch } = useBranchStore();");

// Add Schema
const schemaStr = `
const branchSchema = z.object({
  name: z.string().min(3, "Filial nomi kiritilishi shart"),
  address: z.string().min(5, "Manzil kiritilishi shart")
});
type BranchForm = z.infer<typeof branchSchema>;
`;
content = content.replace("export const BranchDetailsPage = () => {", schemaStr + "\nexport const BranchDetailsPage = () => {");

// Add State and useForm right after branch lookup
const formStr = `
  const [isEditModalOpen, React_setIsEditModalOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useRHForm<BranchForm>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: branch.name,
      address: branch.address
    }
  });

  const onSubmit = async (data: BranchForm) => {
    await updateBranch(branch.id, data);
    React_setIsEditModalOpen(false);
  };
`;
content = content.replace("const branch = branches.find(b => b.id === branchId);\n  if (!branch) return <div className=\"p-6\">Filial topilmadi</div>;\n", "const branch = branches.find(b => b.id === branchId);\n  if (!branch) return <div className=\"p-6\">Filial topilmadi</div>;\n" + formStr);

// Add Edit Button
const buttonsStr = `
        <div className="flex gap-3">
          <button
            onClick={() => React_setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors font-medium text-sm"
          >
            <IconEdit size={18} />
            Tahrirlash
          </button>
          <button
            onClick={() => {
              if(window.confirm("Rostdan ham ushbu filialni o'chirmoqchimisiz? Barcha tegishli ma'lumotlar o'chib ketishi mumkin.")) {
                deleteBranch(branch.id);
                navigate('/superadmin/branches');
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-danger/10 text-danger hover:bg-danger hover:text-white rounded-lg transition-colors font-medium text-sm"
          >
            <IconTrash size={18} />
            Filialni o'chirish
          </button>
        </div>
`;
const oldDeleteBtnRegex = /<button[\s\S]*?Filialni o'chirish\s*<\/button>/;
content = content.replace(oldDeleteBtnRegex, buttonsStr);

// Add Modal JSX
const modalStr = `
      <Modal isOpen={isEditModalOpen} onClose={() => React_setIsEditModalOpen(false)} title="Filialni tahrirlash">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input 
            label="Filial nomi" 
            placeholder="Masalan: Yunusobod filiali" 
            error={errors.name?.message} 
            {...register('name')} 
          />
          <Input 
            label="Manzil" 
            placeholder="Masalan: Toshkent sh. Yunusobod tumani" 
            error={errors.address?.message} 
            {...register('address')} 
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" type="button" onClick={() => React_setIsEditModalOpen(false)}>Bekor qilish</Button>
            <Button type="submit">Saqlash</Button>
          </div>
        </form>
      </Modal>
`;
content = content.replace("    </div>\n  );\n};", modalStr + "    </div>\n  );\n};");

fs.writeFileSync('src/pages/superadmin/BranchDetailsPage.tsx', content);
console.log('done');
