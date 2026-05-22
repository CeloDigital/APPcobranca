// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';

export default function App() {
  const [clientes, setClientes] = useState([]);
  const [formData, setFormData] = useState({ nome: '', telefone: '', cep: '', endereco: '', valor: '', vencimento: '' });

  const carregarDados = async () => {
    try {
      const res = await fetch('http://localhost:3001/cobrancas');
      const data = await res.json();
      setClientes(data);
    } catch (err) {
      console.error("Erro ao buscar dados do servidor:", err);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const buscarCep = async (cep) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData(prev => ({ ...prev, endereco: `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}` }));
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'cep') buscarCep(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const resCliente = await fetch('http://localhost:3001/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: formData.nome, telefone: formData.telefone, cep: formData.cep, endereco: formData.endereco })
    });
    const clienteCriado = await resCliente.json();

    await fetch('http://localhost:3001/emprestimos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cliente_id: clienteCriado.id, valor_emprestado: formData.valor, data_vencimento: formData.vencimento })
    });

    setFormData({ nome: '', telefone: '', cep: '', endereco: '', valor: '', vencimento: '' });
    carregarDados();
  };

  const enviarWhatsApp = (nome, telefone, valor, vencimento) => {
    const telefoneLimpo = telefone.replace(/\D/g, '');
    const mensagem = encodeURIComponent(`Olá ${nome}, tudo bem? Passando para lembrar que o vencimento da sua parcela no valor de R$ ${valor} é no dia ${new Date(vencimento).toLocaleDateString('pt-BR')}.`);
    window.open(`https://api.whatsapp.com/send?phone=55${telefoneLimpo}&text=${mensagem}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased pb-12">
      
      {/* Cabeçalho Fixo Mobile */}
      <header className="sticky top-0 z-10 bg-blue-600 text-white px-4 py-4 shadow-md text-center">
        <h1 className="text-xl font-bold tracking-wide">Cobrança Rápida</h1>
        <p className="text-xs text-blue-100 mt-0.5">Controle de Empréstimos</p>
      </header>

      <main className="px-4 mt-6 max-w-md mx-auto space-y-6">
        
        {/* Seção: Novo Empréstimo */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span>👤</span> Novo Cadastro
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Nome do Cliente</label>
              <input type="text" name="nome" value={formData.nome} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 transition" placeholder="Ex: João Silva" required />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">WhatsApp</label>
              <input type="tel" name="telefone" value={formData.telefone} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 transition" placeholder="DDD + Número" required />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-500 mb-1">CEP</label>
                <input type="text" name="cep" value={formData.cep} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 transition" placeholder="00000-000" required />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Endereço Auto</label>
                <input type="text" name="endereco" value={formData.endereco} onChange={handleInputChange} className="w-full bg-slate-100 border border-transparent rounded-xl p-3 text-sm text-slate-500 read-only:bg-slate-100 focus:outline-none" placeholder="Preenchido via CEP" readOnly />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Valor</label>
                <input type="number" name="valor" value={formData.valor} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 transition" placeholder="R$ 0,00" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Vencimento</label>
                <input type="date" name="vencimento" value={formData.vencimento} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 transition" required />
              </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 active:bg-blue-700 text-white text-sm font-bold py-3.5 px-4 rounded-xl shadow-sm transition mt-2">
              + Salvar e Lançar
            </button>
          </form>
        </section>

        {/* Seção: Lista de Clientes Ativos */}
        <section className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-lg font-bold text-slate-700">Clientes Ativos</h2>
            <span className="bg-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-full font-bold">{clientes.length}</span>
          </div>

          {/* Cards Mobile de Cobrança */}
          <div className="space-y-3">
            {clientes.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-6">Nenhum cliente cadastrado.</p>
            ) : (
              clientes.map(c => (
                <div key={c.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between gap-3">
                  
                  {/* Info Principais */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{c.nome}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">📅 Vence: {new Date(c.data_vencimento).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md block mb-1">Pendente</span>
                      <span className="text-base font-extrabold text-emerald-600">R$ {parseFloat(c.valor_emprestado).toFixed(2)}</span>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Detalhes e Ação de Toque Único */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400 truncate max-w-[120px]">📞 {c.telefone}</span>
                    
                    <div className="flex gap-1.5">
                      {/* NOVO BOTÃO: Baixar Recibo */}
                      <a 
                        href={`http://localhost:3001/emprestimos/${c.id}/recibo`}
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-slate-100 active:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2.5 rounded-xl flex items-center gap-1 shadow-sm transition"
                      >
                        📄 Recibo
                      </a>

                      <button 
                        onClick={() => enviarWhatsApp(c.nome, c.telefone, c.valor_emprestado, c.data_vencimento)} 
                        className="bg-emerald-500 active:bg-emerald-600 text-white text-xs font-bold px-3 py-2.5 rounded-xl flex items-center gap-1 shadow-sm transition"
                      >
                        💬 Cobrar
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </main>
    </div>
  );
}