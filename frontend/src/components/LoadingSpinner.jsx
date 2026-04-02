function LoadingSpinner({ tamanho = 40, texto = 'Carregando...' }) {
  return (
    <div className="loading-spinner-container">
      <div
        className="loading-spinner"
        style={{ width: tamanho, height: tamanho }}
      />
      {texto && <p className="loading-spinner-texto">{texto}</p>}
    </div>
  );
}

export default LoadingSpinner;
