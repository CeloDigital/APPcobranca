// frontend/src/pages/Cobrancas.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Importa a configuração que criamos acima

export default function Cobrancas() {
  const [listaCobrancas, setListaCobrancas] = useState([]);

  // Função que busca os dados no Back-end
  const buscarDadosDoBanco = async () => {
    try {
      // Faz o GET na rota '/cobrancas' do Back-end
      const resposta = await api.get('/cobrancas'); 
      setListaCobrancas(resposta.data); // Salva os dados vindos do banco no estado
    } catch (erro) {
      console.error("Erro ao conectar com o back-end:", erro);
    }
  };

  // Executa a busca assim que a página abre
  useEffect(() => {
    buscarDadosDoBanco();
  }, []);

  return (
    <div>
      <h2>Lista de Cobranças</h2>
      <ul>
        {listaCobrancas.map(cobranca => (
          <li key={cobranca.id}>
            {cobranca.nome} - R$ {cobranca.valor_emprestado}
          </li>
        ))}
      </ul>
    </div>
  );
}