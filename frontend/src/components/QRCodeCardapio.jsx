function QRCodeCardapio({ isOpen, onClose }) {
  if (!isOpen) return null;

  const cardapioUrl = `${window.location.origin}/cardapio`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(cardapioUrl)}`;

  const handleImprimir = () => {
    const win = window.open('', '_blank', 'width=400,height=550');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Code - Cardapio</title>
        <style>
          body {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            text-align: center;
          }
          h1 { font-size: 1.8rem; margin-bottom: 8px; color: #111827; }
          p { color: #6B7280; margin-bottom: 24px; font-size: 0.9rem; }
          img { border-radius: 12px; }
          .url { margin-top: 16px; font-size: 0.8rem; color: #9CA3AF; word-break: break-all; }
        </style>
      </head>
      <body>
        <h1>Grao & Byte</h1>
        <p>Escaneie para ver nosso cardapio</p>
        <img src="${qrUrl}" width="220" height="220" alt="QR Code" />
        <p class="url">${cardapioUrl}</p>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card qrcode-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-titulo">QR Code do Cardapio</h3>
        <p className="modal-mensagem">
          Imprima e coloque nas mesas para os clientes acessarem o cardapio digital.
        </p>

        <div className="qrcode-container">
          <img
            src={qrUrl}
            width="220"
            height="220"
            alt="QR Code do Cardapio"
            className="qrcode-imagem"
          />
          <span className="qrcode-url">{cardapioUrl}</span>
        </div>

        <div className="modal-acoes">
          <button className="modal-btn-confirmar" onClick={handleImprimir}>
            Imprimir
          </button>
          <button className="modal-btn-cancelar" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default QRCodeCardapio;
