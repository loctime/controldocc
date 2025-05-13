import React from "react";

/**
 * Componente reutilizable para acciones de editar y eliminar.
 * Props:
 *  - onEdit: función a ejecutar al hacer clic en editar
 *  - onDelete: función a ejecutar al hacer clic en eliminar
 *  - editLabel: texto alternativo para el botón editar (opcional)
 *  - deleteLabel: texto alternativo para el botón eliminar (opcional)
 */
const EditDeleteActions = ({ onEdit, onDelete, editLabel = "Editar", deleteLabel = "Eliminar" }) => {
  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <button onClick={onEdit} style={{ background: '#1976d2', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
        {editLabel}
      </button>
      <button onClick={onDelete} style={{ background: '#d32f2f', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
        {deleteLabel}
      </button>
    </div>
  );
};

export default EditDeleteActions;
