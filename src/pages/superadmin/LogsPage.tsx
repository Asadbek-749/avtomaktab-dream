import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '../../components/ui/Table';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

export const LogsPage = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    api.getLogs().then(setLogs).catch(console.error);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Loglar</h2>
        <p className="text-text-muted">Tizimdagi barcha harakatlar tarixi</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Oxirgi harakatlar</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vaqti</TableHead>
                <TableHead>Foydalanuvchi</TableHead>
                <TableHead>Harakat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-text-muted">Loglar mavjud emas</TableCell>
                </TableRow>
              ) : (
                logs.map((log, i) => (
                  <TableRow key={log.id} transition={{ delay: i * 0.02 }}>
                    <TableCell className="text-text-secondary whitespace-nowrap">{formatDate(log.timestamp)}</TableCell>
                    <TableCell className="font-medium text-accent">{log.userName}</TableCell>
                    <TableCell>{log.action}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LogsPage;
