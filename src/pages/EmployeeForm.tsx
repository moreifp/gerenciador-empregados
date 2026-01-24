import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function EmployeeForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    const [formData, setFormData] = useState({
        name: '',
        role: '',
        phone: '',
        address: '',
        cpf: '',
        rg: '',
        bank: '',
        agency: '',
        account: '',
        pix: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Saved:', formData);
        // Here we would save to state/backend
        navigate('/employees');
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/employees')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {isEditing ? 'Editar Funcionário' : 'Novo Funcionário'}
                    </h2>
                    <p className="text-muted-foreground">
                        {isEditing ? 'Atualize os dados do funcionário' : 'Cadastre um novo membro da equipe'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Dados Pessoais</CardTitle>
                            <CardDescription>Informações básicas e contato.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium mb-2 block">Nome Completo</label>
                                <Input name="name" placeholder="Ex: Maria da Silva" value={formData.name} onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Cargo / Função</label>
                                <Input name="role" placeholder="Ex: Cozinheira" value={formData.role} onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Telefone / WhatsApp</label>
                                <Input name="phone" placeholder="(11) 99999-9999" value={formData.phone} onChange={handleChange} required />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium mb-2 block">Endereço Completo</label>
                                <Input name="address" placeholder="Rua, Número, Bairro" value={formData.address} onChange={handleChange} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Documentos e Pagamento</CardTitle>
                            <CardDescription>Dados para registro e transferências bancárias.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium mb-2 block">CPF</label>
                                <Input name="cpf" placeholder="000.000.000-00" value={formData.cpf} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">RG</label>
                                <Input name="rg" placeholder="00.000.000-0" value={formData.rg} onChange={handleChange} />
                            </div>

                            <div className="md:col-span-2 border-t pt-4 mt-2">
                                <h4 className="font-medium mb-4">Dados Bancários</h4>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Banco</label>
                                <Input name="bank" placeholder="Ex: Nubank" value={formData.bank} onChange={handleChange} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Agência</label>
                                    <Input name="agency" placeholder="0000" value={formData.agency} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Conta</label>
                                    <Input name="account" placeholder="00000-0" value={formData.account} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium mb-2 block">Chave PIX (Opcional)</label>
                                <Input name="pix" placeholder="CPF, Email ou Telefone" value={formData.pix} onChange={handleChange} />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => navigate('/employees')}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Funcionário
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
