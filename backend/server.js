// 2. BACK-END (Node.js + Express)
// Salve como server.js e rode com: npm init -y && npm install express cors pg

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Configuração do Banco de Dados (Substitua com suas credenciais)
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sistema_cobranca',
  password: 'masedti123',
  port: 5432,
});

// Rota para cadastrar cliente
app.post('/clientes', async (req, res) => {
  const { nome, telefone, cep, endereco } = req.body;
  try {
    const novoCliente = await pool.query(
      'INSERT INTO clientes (nome, telefone, cep, endereco) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, telefone, cep, endereco]
    );
    res.json(novoCliente.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota para lançar empréstimo
app.post('/emprestimos', async (req, res) => {
  const { cliente_id, valor_emprestado, data_vencimento } = req.body;
  try {
    const novoEmprestimo = await pool.query(
      'INSERT INTO emprestimos (cliente_id, valor_emprestado, data_vencimento) VALUES ($1, $2, $3) RETURNING *',
      [cliente_id, valor_emprestado, data_vencimento]
    );
    res.json(novoEmprestimo.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota para listar cobranças e clientes (Para a tabela e calendário)
app.get('/cobrancas', async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT e.id, c.nome, c.telefone, e.valor_emprestado, e.data_vencimento, e.status 
      FROM emprestimos e 
      JOIN clientes c ON e.cliente_id = c.id
      ORDER BY e.data_vencimento ASC
    `);
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PDFDocument = require('pdfkit');

// NOVA ROTA: Gerar Recibo em PDF
app.get('/emprestimos/:id/recibo', async (req, res) => {
  const { id } = req.params;

  try {
    // Busca os dados do empréstimo e do cliente combinados
    const resultado = await pool.query(`
      SELECT e.valor_emprestado, e.data_vencimento, c.nome, c.telefone, c.endereco
      FROM emprestimos e
      JOIN clientes c ON e.cliente_id = c.id
      WHERE e.id = $1
    `, [id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Empréstimo não encontrado' });
    }

    const dados = resultado.rows[0];

    // Configura o cabeçalho da resposta para indicar que é um arquivo PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=recibo_${id}.pdf`);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res); // Envia o PDF direto para o navegador/celular

    // --- DESENHANDO O RECIBO ---
    // Topo / Design
    doc.rect(0, 0, 612, 15).fill('#2563eb'); // Barra azul decorativa no topo
    doc.moveDown(2);

    // Título
    doc.fillColor('#1e293b').fontSize(24).text('COMPROVANTE DE EMPRÉSTIMO', { align: 'center', stroke: true });
    doc.fontSize(10).fillColor('#64748b').text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')}`, { align: 'center' });
    doc.moveDown(2);

    // Linha divisória
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e2e8f0');
    doc.moveDown(1.5);

    // Dados do Emitente (Você)
    doc.fillColor('#1e293b').fontSize(12).text('CREDOR:', { underline: true });
    doc.fillColor('#475569').text('Sua Empresa de Crédito Ltda');
    doc.text('Contato: (11) 99999-9999');
    doc.moveDown(1.5);

    // Dados do Cliente
    doc.fillColor('#1e293b').text('CLIENTE (MUTUÁRIO):', { underline: true });
    doc.fillColor('#475569').text(`Nome: ${dados.nome}`);
    doc.text(`Telefone: ${dados.telefone}`);
    doc.text(`Endereço: ${dados.endereco}`);
    doc.moveDown(1.5);

    // Linha divisória
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e2e8f0');
    doc.moveDown(1.5);

    // Detalhes do Valor
    doc.fillColor('#1e293b').fontSize(14).text('DETALHES DA OPERAÇÃO', { bold: true });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#16a34a').text(`Valor Financiado: R$ ${parseFloat(dados.valor_emprestado).toFixed(2)}`);
    doc.fillColor('#475569').text(`Data de Vencimento: ${new Date(dados.data_vencimento).toLocaleDateString('pt-BR')}`);
    doc.moveDown(3);

    // Campos de Assinatura
    const yAssinatura = doc.y;
    doc.moveTo(50, yAssinatura).lineTo(230, yAssinatura).stroke('#94a3b8');
    doc.moveTo(365, yAssinatura).lineTo(545, yAssinatura).stroke('#94a3b8');
    
    doc.fontSize(10).fillColor('#64748b');
    doc.text('Assinatura do Credor', 50, yAssinatura + 5, { width: 180, align: 'center' });
    doc.text('Assinatura do Cliente', 365, yAssinatura + 5, { width: 180, align: 'center' });

    // Finaliza o documento
    doc.end();

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log('Servidor rodando na porta 3001'));