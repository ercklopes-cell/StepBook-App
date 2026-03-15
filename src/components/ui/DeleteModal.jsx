export default function DeleteModal({ title, onConfirm, onClose }) {
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3 className="modal-title">Remover "{title}"?</h3>
        <p className="modal-sub">Esta ação não pode ser desfeita. O livro e todo seu progresso serão removidos.</p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-danger" onClick={onConfirm}>Remover</button>
        </div>
      </div>
    </div>
  )
}
